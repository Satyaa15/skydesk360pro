from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Text


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class BookingStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"

class BookingDuration(str, Enum):
    HOURLY = "hourly"
    DAILY = "daily"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class PaymentStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"

class RazorpayPaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class SeatType(str, Enum):
    WORKSTATION = "workstation"
    CABIN = "cabin"
    MEETING_ROOM = "meeting_room"
    CONFERENCE = "conference"


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str
    role: UserRole = Field(default=UserRole.USER)
    gov_id_type: str
    gov_id_number: str
    # KYC fields (optional for backward compat with existing users)
    mobile: Optional[str] = Field(default=None)
    occupation_sector: Optional[str] = Field(default=None)
    occupation_role: Optional[str] = Field(default=None)
    kyc_document_name: Optional[str] = Field(default=None)


class User(UserBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Stored as TEXT to hold base64-encoded document (up to ~2 MB)
    kyc_document_data: Optional[str] = Field(
        default=None,
        sa_column=Column("kyc_document_data", Text, nullable=True),
    )

    bookings: List["Booking"] = Relationship(back_populates="user")


class SeatBase(SQLModel):
    code: str = Field(unique=True, index=True)
    section: str
    price: float
    is_available: bool = Field(default=True)


class Seat(SeatBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # Stored as plain VARCHAR — avoids PostgreSQL native enum limitations.
    # SeatType is used only for Python-level validation.
    type: str = Field(
        default=SeatType.WORKSTATION.value,
        sa_column=Column("type", String, nullable=False, default="workstation"),
    )

    bookings: List["Booking"] = Relationship(back_populates="seat")


class BookingBase(SQLModel):
    booking_date: datetime
    status: BookingStatus = Field(default=BookingStatus.PENDING)
    duration_unit: BookingDuration = Field(default=BookingDuration.MONTHLY)
    duration_quantity: int = Field(default=1)
    price_amount: float = Field(default=0)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class Booking(BookingBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    seat_id: int = Field(foreign_key="seat.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    payment_status: str = Field(default=RazorpayPaymentStatus.PENDING.value)
    razorpay_order_id: Optional[str] = Field(default=None, index=True)
    razorpay_payment_id: Optional[str] = Field(default=None)

    user: "User" = Relationship(back_populates="bookings")
    seat: "Seat" = Relationship(back_populates="bookings")
    payment: Optional["Payment"] = Relationship(back_populates="booking")


class PaymentBase(SQLModel):
    amount: float
    status: PaymentStatus = Field(default=PaymentStatus.COMPLETED)
    transaction_id: str


class Payment(PaymentBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    booking_id: UUID = Field(foreign_key="booking.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    booking: "Booking" = Relationship(back_populates="payment")
