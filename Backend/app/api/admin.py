from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel
from app.db.database import get_session
from app.models.models import Booking, User, Seat
from app.core.auth import admin_required
from typing import List
from datetime import datetime

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


class AdminStats(BaseModel):
    total_users: int
    total_bookings: int
    total_seats: int
    available_seats: int


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
            "date": booking.booking_date
        })
    return formatted_results


@router.get("/stats", response_model=AdminStats)
def get_stats(session: Session = Depends(get_session)):
    users_count = len(session.exec(select(User)).all())
    bookings_count = len(session.exec(select(Booking)).all())
    seats_count = len(session.exec(select(Seat)).all())
    available_seats = len(session.exec(select(Seat).where(Seat.is_available.is_(True))).all())
    
    return {
        "total_users": users_count,
        "total_bookings": bookings_count,
        "total_seats": seats_count,
        "available_seats": available_seats
    }
