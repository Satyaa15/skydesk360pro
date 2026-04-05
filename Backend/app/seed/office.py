from __future__ import annotations

from sqlmodel import Session, select

from app.models.models import Seat


def get_office_seats() -> list[Seat]:
    seats: list[Seat] = []

    for i in range(1, 7):
        seats.append(Seat(code=f"WS-A{i}", type="workstation", section="Workstations Row A", price=500.0))

    for i in range(1, 7):
        seats.append(Seat(code=f"WS-B{i}", type="workstation", section="Workstations Row B", price=500.0))

    for i in range(1, 4):
        seats.append(Seat(code=f"WS-R{i}", type="workstation", section="Reception Workstations", price=550.0))

    for i in range(1, 11):
        seats.append(Seat(code=f"CONF-{i}", type="conference", section="Convertible 10 Seater Conference", price=3000.0))

    for i in range(1, 4):
        seats.append(Seat(code=f"CEO-{i}", type="cabin", section="CEO's Cabin", price=2200.0))

    for i in range(1, 6):
        seats.append(Seat(code=f"DIR-{i}", type="cabin", section="Director's Cabin", price=1800.0))

    for i in range(1, 3):
        seats.append(Seat(code=f"MR-{i}", type="meeting_room", section="2 Seater Meeting Room", price=900.0))

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
