from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel
from app.db.database import get_session
from app.models.models import Seat
from app.core.auth import admin_required
from typing import List, Optional
from datetime import datetime, timezone
from app.models.models import Booking, BookingStatus
from app.seed.office import get_office_seats

router = APIRouter(prefix="/seats", tags=["seats"])


class SeatResponse(BaseModel):
    id: int
    code: str
    type: str
    section: str
    price: float
    is_available: bool
    locked_until: Optional[datetime] = None


def _build_lock_map(session: Session) -> dict[int, datetime]:
    """Returns {seat_id: end_time} for all currently active paid bookings."""
    now = datetime.now(timezone.utc)
    rows = session.exec(
        select(Booking.seat_id, Booking.end_time).where(
            Booking.status == BookingStatus.PAID,
            Booking.end_time.is_not(None),
            Booking.end_time > now,
        )
    ).all()
    return {seat_id: end_time for seat_id, end_time in rows}


@router.get("/", response_model=List[SeatResponse])
def get_seats(session: Session = Depends(get_session)):
    seats = session.exec(select(Seat)).all()
    lock_map = _build_lock_map(session)
    return [
        SeatResponse(
            id=seat.id,
            code=seat.code,
            type=seat.type,
            section=seat.section,
            price=seat.price,
            is_available=seat.is_available and seat.id not in lock_map,
            locked_until=lock_map.get(seat.id),
        )
        for seat in seats
    ]


@router.get("/available", response_model=List[SeatResponse])
def get_available_seats(session: Session = Depends(get_session)):
    seats = session.exec(select(Seat)).all()
    lock_map = _build_lock_map(session)
    return [
        SeatResponse(
            id=seat.id,
            code=seat.code,
            type=seat.type,
            section=seat.section,
            price=seat.price,
            is_available=True,
            locked_until=None,
        )
        for seat in seats
        if seat.is_available and seat.id not in lock_map
    ]

@router.post("/initialize-office", dependencies=[Depends(admin_required)])
def initialize_office(session: Session = Depends(get_session)):
    # Check if already initialized
    if session.exec(select(Seat)).first():
        return {"message": "Office already initialized"}
        
    all_seats = get_office_seats()
    for seat in all_seats:
        session.add(seat)
    
    session.commit()
    return {"message": f"Initialized {len(all_seats)} seats"}
