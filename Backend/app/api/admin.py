from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from pydantic import BaseModel
from app.db.database import get_session
from app.models.models import Booking, User, Seat, SeatType, BookingStatus, BookingDuration, Payment, PaymentStatus, RazorpayPaymentStatus
from app.core.auth import admin_required, get_current_user
from app.core.pricing import compute_amount, to_paise, compute_end_time
from typing import List, Optional
from datetime import datetime, timezone
import sqlalchemy
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(admin_required)])


class AdminUserSummary(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class AdminBookingSummary(BaseModel):
    id: str
    user_name: str
    user_email: str
    gov_id: str
    seat_code: str
    status: str
    date: datetime
    duration_unit: str
    duration_quantity: int
    amount: float
    start_time: datetime | None
    end_time: datetime | None


class AdminStats(BaseModel):
    total_users: int
    total_bookings: int
    total_seats: int
    available_seats: int


class AdminSeatSummary(BaseModel):
    id: int
    code: str
    type: str
    section: str
    price: float
    is_available: bool
    is_locked: bool
    locked_until: datetime | None


class AdminSeatCreate(BaseModel):
    code: str
    type: str
    section: str
    price: float
    is_available: bool = True


class AdminSeatUpdate(BaseModel):
    code: Optional[str] = None
    type: Optional[str] = None
    section: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None
    locked_until: Optional[datetime] = None


class AdminSeatLock(BaseModel):
    """Lock a seat manually until a specific datetime. Pass null to unlock."""
    locked_until: Optional[datetime] = None


@router.get("/users", response_model=List[AdminUserSummary])
def get_all_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    return [
        AdminUserSummary(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
        )
        for user in users
    ]


@router.get("/bookings", response_model=List[AdminBookingSummary])
def get_all_bookings(session: Session = Depends(get_session)):
    # Join with User and Seat for full CRM view
    statement = select(Booking, User, Seat).join(User).join(Seat)
    results = session.exec(statement).all()
    
    formatted_results = []
    for booking, user, seat in results:
        formatted_results.append({
            "id": str(booking.id),
            "user_name": user.full_name,
            "user_email": user.email,
            "gov_id": f"{user.gov_id_type}: {user.gov_id_number}",
            "seat_code": seat.code,
            "status": booking.status.value,
            "date": booking.booking_date,
            "duration_unit": booking.duration_unit.value,
            "duration_quantity": booking.duration_quantity,
            "amount": booking.price_amount,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
        })
    return formatted_results


@router.get("/stats", response_model=AdminStats)
def get_stats(session: Session = Depends(get_session)):
    total_seats = session.exec(select(Seat)).all()
    now = datetime.now(timezone.utc)
    active_bookings = session.exec(
        select(Booking.seat_id).where(
            Booking.status == BookingStatus.PAID,
            Booking.end_time.is_not(None),
            Booking.end_time > now,
        )
    ).all()
    locked_ids = set(active_bookings)
    available_seats = sum(1 for seat in total_seats if seat.is_available and seat.id not in locked_ids)

    return {
        "total_users": session.exec(select(func.count()).select_from(User)).one(),
        "total_bookings": session.exec(select(func.count()).select_from(Booking)).one(),
        "total_seats": len(total_seats),
        "available_seats": available_seats,
    }


@router.get("/seats", response_model=List[AdminSeatSummary])
def get_seats(session: Session = Depends(get_session)):
    seats = session.exec(select(Seat)).all()
    now = datetime.now(timezone.utc)
    active_bookings = session.exec(
        select(Booking.seat_id, Booking.end_time).where(
            Booking.status == BookingStatus.PAID,
            Booking.end_time.is_not(None),
            Booking.end_time > now,
        )
    ).all()
    booking_lock_map = {seat_id: end_time for seat_id, end_time in active_bookings}
    return [
        AdminSeatSummary(
            id=seat.id,
            code=seat.code,
            type=seat.type,
            section=seat.section,
            price=seat.price,
            is_available=seat.is_available and seat.id not in booking_lock_map and not (seat.locked_until and seat.locked_until > now),
            is_locked=seat.id in booking_lock_map or bool(seat.locked_until and seat.locked_until > now),
            locked_until=booking_lock_map.get(seat.id) or (seat.locked_until if seat.locked_until and seat.locked_until > now else None),
        )
        for seat in seats
    ]


@router.post("/seats", response_model=AdminSeatSummary, status_code=status.HTTP_201_CREATED)
def create_seat(body: AdminSeatCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Seat).where(Seat.code == body.code)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat code already exists")

    try:
        seat_type = SeatType(body.type).value
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid seat type")

    seat = Seat(
        code=body.code,
        type=seat_type,
        section=body.section,
        price=body.price,
        is_available=body.is_available,
    )
    session.add(seat)
    session.commit()
    session.refresh(seat)
    return AdminSeatSummary(
        id=seat.id,
        code=seat.code,
        type=seat.type,
        section=seat.section,
        price=seat.price,
        is_available=seat.is_available,
        is_locked=False,
        locked_until=None,
    )


@router.patch("/seats/{seat_id}", response_model=AdminSeatSummary)
def update_seat(seat_id: int, body: AdminSeatUpdate, session: Session = Depends(get_session)):
    seat = session.get(Seat, seat_id)
    if not seat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")

    if body.code and body.code != seat.code:
        existing = session.exec(select(Seat).where(Seat.code == body.code)).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat code already exists")
        seat.code = body.code

    if body.type:
        try:
            seat.type = SeatType(body.type).value
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid seat type")

    if body.section is not None:
        seat.section = body.section
    if body.price is not None:
        seat.price = body.price
    if body.is_available is not None:
        seat.is_available = body.is_available
    # Allow explicit null to clear the lock (use model_fields_set to distinguish "not sent" from "sent as null")
    if 'locked_until' in body.model_fields_set:
        seat.locked_until = body.locked_until

    session.add(seat)
    session.commit()
    session.refresh(seat)
    now = datetime.now(timezone.utc)
    return AdminSeatSummary(
        id=seat.id,
        code=seat.code,
        type=seat.type,
        section=seat.section,
        price=seat.price,
        is_available=seat.is_available and not (seat.locked_until and seat.locked_until > now),
        is_locked=bool(seat.locked_until and seat.locked_until > now),
        locked_until=seat.locked_until if seat.locked_until and seat.locked_until > now else None,
    )


@router.patch("/seats/{seat_id}/lock", response_model=AdminSeatSummary)
def lock_seat(seat_id: int, body: AdminSeatLock, session: Session = Depends(get_session)):
    """Manually lock or unlock a seat. Pass locked_until=null to remove the manual lock."""
    seat = session.get(Seat, seat_id)
    if not seat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")

    seat.locked_until = body.locked_until
    session.add(seat)
    session.commit()
    session.refresh(seat)
    now = datetime.now(timezone.utc)
    return AdminSeatSummary(
        id=seat.id,
        code=seat.code,
        type=seat.type,
        section=seat.section,
        price=seat.price,
        is_available=seat.is_available and not (seat.locked_until and seat.locked_until > now),
        is_locked=bool(seat.locked_until and seat.locked_until > now),
        locked_until=seat.locked_until if seat.locked_until and seat.locked_until > now else None,
    )


class AdminKYCSummary(BaseModel):
    id: str
    full_name: str
    email: str
    mobile: str | None
    gov_id_type: str
    gov_id_number: str
    occupation_sector: str | None
    occupation_role: str | None
    kyc_document_name: str | None
    has_document: bool
    created_at: datetime


@router.get("/kyc", response_model=List[AdminKYCSummary])
def get_kyc_list(session: Session = Depends(get_session)):
    """Return all users with KYC metadata — excludes raw document bytes."""
    users = session.exec(select(User)).all()
    return [
        AdminKYCSummary(
            id=str(u.id),
            full_name=u.full_name,
            email=u.email,
            mobile=u.mobile,
            gov_id_type=u.gov_id_type,
            gov_id_number=u.gov_id_number,
            occupation_sector=u.occupation_sector,
            occupation_role=u.occupation_role,
            kyc_document_name=u.kyc_document_name,
            has_document=bool(u.kyc_document_data),
            created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/kyc/{user_id}/document")
def get_kyc_document(user_id: str, session: Session = Depends(get_session)):
    """Return the base64 document for a single user (on-demand only)."""
    from uuid import UUID as _UUID
    try:
        uid = _UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    user = session.get(User, uid)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.kyc_document_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No document uploaded")
    return {
        "document_name": user.kyc_document_name,
        "document_data": user.kyc_document_data,
    }


@router.post("/seats/reset-availability")
def reset_seat_availability(session: Session = Depends(get_session)):
    session.exec(sqlalchemy.update(Seat).values(is_available=True))
    session.commit()
    return {"message": "All seats marked available."}


# ── Admin Manual Booking ────────────────────────────────────────────────────

class AdminBookingOrderRequest(BaseModel):
    seat_ids: List[int]
    duration_unit: BookingDuration = BookingDuration.MONTHLY
    duration_quantity: int = 1
    custom_amount: Optional[float] = None   # override computed price (total, in INR)


class AdminBookingOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int          # paise
    currency: str
    key_id: str
    booking_ids: List[str]
    computed_amount: float   # INR total shown to admin


@router.post("/bookings/create-order", response_model=AdminBookingOrderResponse)
def admin_create_booking_order(
    body: AdminBookingOrderRequest,
    current_admin: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Admin creates a booking + Razorpay order, optionally with a custom amount."""
    import razorpay
    from app.core.config import settings

    if body.duration_quantity < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duration quantity must be at least 1")
    if not body.seat_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one seat required")

    seats = session.exec(select(Seat).where(Seat.id.in_(body.seat_ids))).all()
    seat_map = {seat.id: seat for seat in seats}
    missing = [sid for sid in body.seat_ids if sid not in seat_map]
    if missing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Some seats not found")

    now = datetime.now(timezone.utc)
    active = session.exec(
        select(Booking.seat_id).where(
            Booking.status == BookingStatus.PAID,
            Booking.end_time.is_not(None),
            Booking.end_time > now,
        )
    ).all()
    locked_ids = set(active)

    for seat in seats:
        manually_locked = seat.locked_until and seat.locked_until > now
        if not seat.is_available or seat.id in locked_ids or manually_locked:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Seat {seat.code} is not available")

    # Cancel stale PENDING bookings by this admin for these seats
    stale = session.exec(
        select(Booking).where(
            Booking.user_id == current_admin.id,
            Booking.seat_id.in_(body.seat_ids),
            Booking.status == BookingStatus.PENDING,
        )
    ).all()
    for b in stale:
        b.status = BookingStatus.CANCELLED
        session.add(b)
    if stale:
        session.commit()

    # Compute per-seat amounts
    computed_total = sum(
        compute_amount(seat_map[sid].type, body.duration_unit, body.duration_quantity)
        for sid in body.seat_ids
    )
    total_amount = body.custom_amount if body.custom_amount and body.custom_amount > 0 else computed_total
    # Distribute custom amount proportionally across seats
    per_seat_amount = round(total_amount / len(body.seat_ids), 2)

    booking_ids: List[str] = []
    for seat_id in body.seat_ids:
        booking = Booking(
            user_id=current_admin.id,
            seat_id=seat_id,
            booking_date=now,
            status=BookingStatus.PENDING,
            duration_unit=body.duration_unit,
            duration_quantity=body.duration_quantity,
            price_amount=per_seat_amount,
        )
        session.add(booking)
        session.flush()
        booking_ids.append(str(booking.id))
    session.commit()

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Payment gateway not configured")

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    amount_paise = to_paise(total_amount)
    receipt = f"adm-{booking_ids[0][:8]}"

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                "booking_ids": ",".join(b[:8] for b in booking_ids),
                "admin_email": current_admin.email,
                "type": "admin_manual",
            },
        })
    except Exception as exc:
        logger.error("Admin Razorpay order creation failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Payment gateway error.")

    for bid in booking_ids:
        booking = session.get(Booking, bid)
        if booking:
            booking.razorpay_order_id = order["id"]
            booking.payment_status = RazorpayPaymentStatus.PENDING
            session.add(booking)
    session.commit()

    return AdminBookingOrderResponse(
        razorpay_order_id=order["id"],
        amount=amount_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
        booking_ids=booking_ids,
        computed_amount=total_amount,
    )
