from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class BookingStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"

class SeatType(str, Enum):
    WORKSTATION = "workstation"
    CABIN = "cabin"
    MEETING_ROOM = "meeting_room"

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str
    role: UserRole = Field(default=UserRole.USER)
    gov_id_type: str
    gov_id_number: str  # In real app, this should be encrypted

class User(UserBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    bookings: List["Booking"] = Relationship(back_populates="user")

class SeatBase(SQLModel):
    code: str = Field(unique=True, index=True)
    type: SeatType = Field(default=SeatType.WORKSTATION)
    section: str
    price: float
    is_available: bool = Field(default=True)

class Seat(SeatBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    bookings: List["Booking"] = Relationship(back_populates="seat")

class BookingBase(SQLModel):
    booking_date: datetime
    status: BookingStatus = Field(default=BookingStatus.PENDING)

class Booking(BookingBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    seat_id: int = Field(foreign_key="seat.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    user: User = Relationship(back_populates="bookings")
    seat: Seat = Relationship(back_populates="bookings")
    payment: Optional["Payment"] = Relationship(back_populates="booking")

class PaymentBase(SQLModel):
    amount: float
    status: PaymentStatus = Field(default=PaymentStatus.COMPLETED)
    transaction_id: str

class Payment(PaymentBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    booking_id: UUID = Field(foreign_key="booking.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    booking: Booking = Relationship(back_populates="payment")
