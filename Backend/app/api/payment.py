import hashlib
import hmac
import json
import logging

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.notifications import send_booking_email
from app.core.pricing import compute_amount, to_paise, compute_end_time
from app.db.database import get_session
from app.models.models import (
    Booking,
    BookingStatus,
    BookingDuration,
    Payment,
    PaymentStatus,
    RazorpayPaymentStatus,
    Seat,
    User,
)
from datetime import datetime, timezone

router = APIRouter(prefix="/payment", tags=["payment"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_razorpay_client() -> razorpay.Client:
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway not configured.",
        )
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    message = f"{order_id}|{payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateOrderRequest(BaseModel):
    booking_id: str


class CreateOrderBatchRequest(BaseModel):
    seat_ids: list[int]
    duration_unit: BookingDuration = BookingDuration.MONTHLY
    duration_quantity: int = 1


class CreateOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int          # paise (INR × 100)
    currency: str
    key_id: str
    booking_id: str | None = None
    booking_ids: list[str] | None = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ---------------------------------------------------------------------------
# POST /payment/create-order
# ---------------------------------------------------------------------------

@router.post("/create-order", response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    body: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a Razorpay order for an existing PENDING booking."""
    booking = session.get(Booking, body.booking_id)
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status == BookingStatus.PAID:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking already paid")
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cancelled booking cannot be paid")

    # Idempotency: return existing order if already created
    if booking.razorpay_order_id:
        seat = session.get(Seat, booking.seat_id)
        booking_amount = booking.price_amount or compute_amount(
            seat.price if seat else 0, booking.duration_unit, booking.duration_quantity
        )
        return CreateOrderResponse(
            razorpay_order_id=booking.razorpay_order_id,
            amount=to_paise(booking_amount),
            currency="INR",
            key_id=settings.RAZORPAY_KEY_ID,
            booking_id=str(booking.id),
        )

    seat = session.get(Seat, booking.seat_id)
    if not seat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")

    client = _get_razorpay_client()
    booking_amount = booking.price_amount or compute_amount(
        seat.price, booking.duration_unit, booking.duration_quantity
    )
    amount_paise = to_paise(booking_amount)

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": str(booking.id)[:40],   # Razorpay max 40 chars
            "notes": {
                "booking_id": str(booking.id),
                "seat_code": seat.code,
                "user_email": current_user.email,
            },
        })
    except Exception as exc:
        logger.error("Razorpay order creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway error. Try again.",
        )

    booking.razorpay_order_id = order["id"]
    booking.payment_status = RazorpayPaymentStatus.PENDING
    session.add(booking)
    session.commit()
    session.refresh(booking)

    return CreateOrderResponse(
        razorpay_order_id=order["id"],
        amount=amount_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
        booking_id=str(booking.id),
    )


# ---------------------------------------------------------------------------
# POST /payment/create-order-batch
# ---------------------------------------------------------------------------

@router.post("/create-order-batch", response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_batch(
    body: CreateOrderBatchRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a Razorpay order for multiple seats in one payment."""
    if body.duration_quantity < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duration quantity must be at least 1")
    if not body.seat_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one seat is required")

    seats = session.exec(select(Seat).where(Seat.id.in_(body.seat_ids))).all()
    seat_map = {seat.id: seat for seat in seats}

    missing = [seat_id for seat_id in body.seat_ids if seat_id not in seat_map]
    if missing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Some seats were not found")

    now = datetime.now(timezone.utc)
    active_bookings = session.exec(
        select(Booking.seat_id).where(
            Booking.status == BookingStatus.PAID,
            Booking.end_time.is_not(None),
            Booking.end_time > now,
        )
    ).all()
    locked_seat_ids = set(active_bookings)

    for seat in seats:
        if not seat.is_available or seat.id in locked_seat_ids:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Seat {seat.code} is not available")

    existing_user_booking = session.exec(
        select(Booking).where(
            Booking.user_id == current_user.id,
            Booking.seat_id.in_(body.seat_ids),
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.PAID]),
        )
    ).first()
    if existing_user_booking:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have an active booking for one of these seats")

    seat_already_paid = session.exec(
        select(Booking).where(
            Booking.seat_id.in_(body.seat_ids),
            Booking.status == BookingStatus.PAID,
        )
    ).first()
    if seat_already_paid:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="One or more seats have already been booked")

    booking_ids: list[str] = []
    total_amount = 0.0
    for seat_id in body.seat_ids:
        seat = seat_map[seat_id]
        seat_amount = compute_amount(seat.price, body.duration_unit, body.duration_quantity)
        total_amount += seat_amount
        booking = Booking(
            user_id=current_user.id,
            seat_id=seat_id,
            booking_date=datetime.now(timezone.utc),
            status=BookingStatus.PENDING,
            duration_unit=body.duration_unit,
            duration_quantity=body.duration_quantity,
            price_amount=seat_amount,
        )
        session.add(booking)
        session.flush()
        booking_ids.append(str(booking.id))

    session.commit()

    client = _get_razorpay_client()
    amount_paise = to_paise(total_amount)

    # Razorpay receipt field has a hard 40-character maximum.
    # Use a short hash of the first booking_id so it's always within the limit.
    receipt_ref = f"batch-{booking_ids[0][:8]}" if booking_ids else "batch"

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt_ref,
            "notes": {
                "booking_ids": ",".join(b[:8] for b in booking_ids),
                "user_email": current_user.email,
                "duration_unit": body.duration_unit,
            },
        })
    except Exception as exc:
        logger.error("Razorpay order creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway error. Try again.",
        )

    for booking_id in booking_ids:
        booking = session.get(Booking, booking_id)
        if booking:
            booking.razorpay_order_id = order["id"]
            booking.payment_status = RazorpayPaymentStatus.PENDING
            session.add(booking)
    session.commit()

    return CreateOrderResponse(
        razorpay_order_id=order["id"],
        amount=amount_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
        booking_ids=booking_ids,
    )


# ---------------------------------------------------------------------------
# POST /payment/verify
# ---------------------------------------------------------------------------

@router.post("/verify")
def verify_payment(
    body: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Verify Razorpay signature and confirm the booking."""
    bookings = session.exec(
        select(Booking).where(Booking.razorpay_order_id == body.razorpay_order_id)
    ).all()

    if not bookings:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if any(booking.user_id != current_user.id for booking in bookings):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized booking")

    if all(booking.status == BookingStatus.PAID for booking in bookings):
        return {"message": "Booking already confirmed", "booking_ids": [str(b.id) for b in bookings]}

    # Verify HMAC signature
    if not _verify_razorpay_signature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
    ):
        for booking in bookings:
            booking.payment_status = RazorpayPaymentStatus.FAILED
            session.add(booking)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed. Invalid signature.",
        )

    now = datetime.now(timezone.utc)
    for booking in bookings:
        seat = session.get(Seat, booking.seat_id)
        if not seat:
            continue

        conflicting = session.exec(
            select(Booking).where(
                Booking.seat_id == booking.seat_id,
                Booking.status == BookingStatus.PAID,
                Booking.id != booking.id,
            )
        ).first()
        if conflicting:
            booking.payment_status = RazorpayPaymentStatus.FAILED
            session.add(booking)
            session.commit()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Seat was booked by another user. Please contact support for a refund.",
            )

        booking.status = BookingStatus.PAID
        booking.payment_status = RazorpayPaymentStatus.SUCCESS
        booking.razorpay_payment_id = body.razorpay_payment_id
        booking.start_time = now
        booking.end_time = compute_end_time(now, booking.duration_unit, booking.duration_quantity)

        payment_amount = booking.price_amount or compute_amount(
            seat.price, booking.duration_unit, booking.duration_quantity
        )
        payment = Payment(
            booking_id=booking.id,
            amount=payment_amount,
            status=PaymentStatus.COMPLETED,
            transaction_id=body.razorpay_payment_id,
        )

        session.add(booking)
        session.add(seat)
        session.add(payment)
    session.commit()

    try:
        for booking in bookings:
            seat = session.get(Seat, booking.seat_id)
            if not seat:
                continue
            amount = booking.price_amount or compute_amount(
                seat.price, booking.duration_unit, booking.duration_quantity
            )
            send_booking_email(
                current_user.email,
                current_user.full_name,
                {
                    "seat_code": seat.code,
                    "date": booking.booking_date.strftime("%Y-%m-%d"),
                    "amount": amount,
                    "transaction_id": body.razorpay_payment_id,
                },
            )
    except Exception as exc:
        logger.warning("Failed to send booking email for %s: %s", current_user.email, exc)

    return {"message": "Payment verified. Booking confirmed.", "booking_ids": [str(b.id) for b in bookings]}


# ---------------------------------------------------------------------------
# POST /payment/webhook  (Bonus — no user auth, verified by Razorpay signature)
# ---------------------------------------------------------------------------

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def razorpay_webhook(request: Request, session: Session = Depends(get_session)):
    """
    Razorpay webhook endpoint.
    Configure in Razorpay Dashboard → Webhooks → URL: /payment/webhook
    Active events: payment.captured, payment.failed
    """
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Webhook not configured")

    body_bytes = await request.body()
    received_signature = request.headers.get("x-razorpay-signature", "")

    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, received_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    try:
        payload = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")
    event = payload.get("event")

    if event == "payment.captured":
        payment_entity = payload["payload"]["payment"]["entity"]
        order_id = payment_entity.get("order_id")
        payment_id = payment_entity.get("id")

        if not order_id:
            return {"status": "ignored"}

        bookings = session.exec(
            select(Booking).where(Booking.razorpay_order_id == order_id)
        ).all()

        now = datetime.now(timezone.utc)
        for booking in bookings:
            if booking.status == BookingStatus.PAID:
                continue
            booking.status = BookingStatus.PAID
            booking.payment_status = RazorpayPaymentStatus.SUCCESS
            booking.razorpay_payment_id = payment_id
            booking.start_time = now
            booking.end_time = compute_end_time(now, booking.duration_unit, booking.duration_quantity)

            seat = session.get(Seat, booking.seat_id)
            if seat:
                session.add(seat)

            existing_payment = session.exec(
                select(Payment).where(Payment.booking_id == booking.id)
            ).first()
            if not existing_payment:
                amount = booking.price_amount or compute_amount(
                    seat.price if seat else 0, booking.duration_unit, booking.duration_quantity
                )
                session.add(Payment(
                    booking_id=booking.id,
                    amount=amount,
                    status=PaymentStatus.COMPLETED,
                    transaction_id=payment_id,
                ))

            session.add(booking)
        session.commit()
        if bookings:
            logger.info("Webhook confirmed %s booking(s) via payment %s", len(bookings), payment_id)

    elif event == "payment.failed":
        payment_entity = payload["payload"]["payment"]["entity"]
        order_id = payment_entity.get("order_id")

        if order_id:
            bookings = session.exec(
                select(Booking).where(Booking.razorpay_order_id == order_id)
            ).all()
            for booking in bookings:
                if booking.status == BookingStatus.PENDING:
                    booking.payment_status = RazorpayPaymentStatus.FAILED
                    session.add(booking)
            session.commit()
            if bookings:
                logger.info("Webhook marked %s booking(s) as payment failed", len(bookings))

    return {"status": "ok"}
