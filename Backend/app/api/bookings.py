import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.models import Booking, BookingStatus, Seat, User, Payment, PaymentStatus
from app.core.auth import get_current_user
from app.core.notifications import send_booking_email
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/bookings", tags=["bookings"])
logger = logging.getLogger(__name__)


class CreateBookingResponse(BaseModel):
    booking_id: str
    amount: float
    message: str


class ProcessPaymentResponse(BaseModel):
    message: str
    transaction_id: str


@router.post("/create/{seat_id}", response_model=CreateBookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(seat_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Check if seat exists and is available
    seat = session.get(Seat, seat_id)
    if not seat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")
    if not seat.is_available:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat not available")

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
    booking = Booking(
        user_id=current_user.id,
        seat_id=seat_id,
        booking_date=datetime.now(timezone.utc),
        status=BookingStatus.PENDING
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return {"booking_id": str(booking.id), "amount": seat.price, "message": "Booking created. Proceed to payment."}


@router.post("/process-payment/{booking_id}", response_model=ProcessPaymentResponse)
def process_payment(booking_id: uuid.UUID, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    existing_payment = session.exec(select(Payment).where(Payment.booking_id == booking.id)).first()
    if existing_payment:
        return {"message": "Booking already paid", "transaction_id": existing_payment.transaction_id}
    
    if booking.status == BookingStatus.PAID:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking already paid")
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cancelled bookings cannot be paid")

    seat = session.get(Seat, booking.seat_id)
    if not seat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found for booking")

    conflicting_paid_booking = session.exec(
        select(Booking).where(
            Booking.seat_id == booking.seat_id,
            Booking.status == BookingStatus.PAID,
            Booking.id != booking.id,
        )
    ).first()
    if conflicting_paid_booking:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat has already been booked by another user")
        
    # Mock payment logic - assume success
    transaction_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    payment = Payment(
        booking_id=booking.id,
        amount=seat.price,
        status=PaymentStatus.COMPLETED,
        transaction_id=transaction_id
    )
    
    booking.status = BookingStatus.PAID
    seat.is_available = False
    
    session.add(payment)
    session.add(booking)
    session.add(seat)
    session.commit()
    
    # Send mock email
    booking_details = {
        "seat_code": seat.code,
        "date": booking.booking_date.strftime("%Y-%m-%d"),
        "amount": seat.price,
        "transaction_id": transaction_id
    }
    try:
        send_booking_email(current_user.email, current_user.full_name, booking_details)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to send booking email for %s: %s", current_user.email, exc)
    
    return {"message": "Payment successful", "transaction_id": transaction_id}
