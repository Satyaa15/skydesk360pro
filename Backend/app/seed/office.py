from __future__ import annotations

from sqlmodel import Session, select

from app.models.models import Seat
from app.core.pricing import SEAT_PRICES


def get_office_seats() -> list[Seat]:
    """
    The `price` field stores the monthly rate for display purposes.
    Actual booking amounts are computed via pricing.SEAT_PRICES lookup.
    """
    seats: list[Seat] = []

    # Dedicated desks — ₹100/hr · ₹400/day · ₹7,000/mo
    monthly_ws = SEAT_PRICES["workstation"]["monthly"]
    for i in range(1, 7):
        seats.append(Seat(code=f"WS-A{i}", type="workstation", section="Workstations Row A", price=monthly_ws))
    for i in range(1, 7):
        seats.append(Seat(code=f"WS-B{i}", type="workstation", section="Workstations Row B", price=monthly_ws))
    for i in range(1, 4):
        seats.append(Seat(code=f"WS-R{i}", type="workstation", section="Reception Workstations", price=monthly_ws))

    # Conference room — ₹550/hr · ₹4,500/day · ₹60,000/mo
    monthly_conf = SEAT_PRICES["conference"]["monthly"]
    for i in range(1, 11):
        seats.append(Seat(code=f"CONF-{i}", type="conference", section="Convertible 10 Seater Conference", price=monthly_conf))

    # Private cabins — ₹400/hr · ₹2,500/day · ₹35,000/mo
    monthly_cabin = SEAT_PRICES["cabin"]["monthly"]
    for i in range(1, 4):
        seats.append(Seat(code=f"CEO-{i}", type="cabin", section="CEO's Cabin", price=monthly_cabin))
    for i in range(1, 6):
        seats.append(Seat(code=f"DIR-{i}", type="cabin", section="Director's Cabin", price=monthly_cabin))

    # Meeting rooms — same rate as conference
    monthly_mr = SEAT_PRICES["meeting_room"]["monthly"]
    for i in range(1, 3):
        seats.append(Seat(code=f"MR-{i}", type="meeting_room", section="2 Seater Meeting Room", price=monthly_mr))

    return seats


def seed_office_if_empty(session: Session) -> int:
    existing = session.exec(select(Seat)).first()
    if existing:
        return 0
    seats = get_office_seats()
    for seat in seats:
        session.add(seat)
    session.commit()
    return len(seats)
