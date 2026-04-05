import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.models import Booking, BookingStatus, BookingDuration, Seat, User
from app.core.auth import get_current_user
from app.core.pricing import compute_amount
from datetime import datetime, timezone

router = APIRouter(prefix="/bookings", tags=["bookings"])
logger = logging.getLogger(__name__)


class CreateBookingResponse(BaseModel):
    booking_id: str
    amount: float
    duration_unit: BookingDuration
    duration_quantity: int
    message: str


class CreateBookingRequest(BaseModel):
    duration_unit: BookingDuration = BookingDuration.MONTHLY
    duration_quantity: int = 1


@router.post("/create/{seat_id}", response_model=CreateBookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    seat_id: int,
    body: CreateBookingRequest = CreateBookingRequest(),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if body.duration_quantity < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duration quantity must be at least 1")
    # Check if seat exists and is available
    seat = session.get(Seat, seat_id)
    if not seat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")
    if not seat.is_available:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat not available")

    now = datetime.now(timezone.utc)
    active_booking = session.exec(
        select(Booking).where(
            Booking.seat_id == seat_id,
            Booking.status == BookingStatus.PAID,
            Booking.end_time.is_not(None),
            Booking.end_time > now,
        )
    ).first()
    if active_booking:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat already booked for the selected time")

    existing_user_booking = session.exec(
        select(Booking).where(
            Booking.user_id == current_user.id,
            Booking.seat_id == seat_id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.PAID]),
        )
    ).first()
    if existing_user_booking:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have an active booking for this seat")

    seat_already_paid = session.exec(
        select(Booking).where(
            Booking.seat_id == seat_id,
            Booking.status == BookingStatus.PAID,
        )
    ).first()
    if seat_already_paid:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat has already been booked")
    
    # Create pending booking
    booking_amount = compute_amount(seat.type, body.duration_unit, body.duration_quantity)
    booking = Booking(
        user_id=current_user.id,
        seat_id=seat_id,
        booking_date=datetime.now(timezone.utc),
        status=BookingStatus.PENDING,
        duration_unit=body.duration_unit,
        duration_quantity=body.duration_quantity,
        price_amount=booking_amount,
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return {
        "booking_id": str(booking.id),
        "amount": booking_amount,
        "duration_unit": body.duration_unit,
        "duration_quantity": body.duration_quantity,
        "message": "Booking created. Proceed to payment.",
    }
