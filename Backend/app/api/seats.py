from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.models import Seat, SeatType
from app.core.auth import admin_required
from typing import List

router = APIRouter(prefix="/seats", tags=["seats"])

@router.get("/", response_model=List[Seat])
def get_seats(session: Session = Depends(get_session)):
    statement = select(Seat)
    return session.exec(statement).all()

@router.get("/available", response_model=List[Seat])
def get_available_seats(session: Session = Depends(get_session)):
    statement = select(Seat).where(Seat.is_available == True)
    return session.exec(statement).all()

@router.post("/initialize-office", dependencies=[Depends(admin_required)])
def initialize_office(session: Session = Depends(get_session)):
    # Check if already initialized
    if session.exec(select(Seat)).first():
        return {"message": "Office already initialized"}
        
    # Example data based on provided blueprint
    # Workstations (Top)
    workstations = []
    for row in range(1, 3):
        for i in range(1, 7):
            workstations.append(Seat(
                code=f"WS-{row}{chr(64+i)}",
                type=SeatType.WORKSTATION,
                section="Main Area",
                price=500.0
            ))
            
    # Cabins
    cabins = [
        Seat(code="CEO-1", type=SeatType.CABIN, section="CEO Cabin", price=2000.0),
        Seat(code="DIR-1", type=SeatType.CABIN, section="Director Cabin", price=1500.0)
    ]
    
    # Meeting Rooms
    meeting_rooms = [
        Seat(code="MR-1", type=SeatType.MEETING_ROOM, section="2-Seater Meeting Room", price=800.0),
        Seat(code="CONF-1", type=SeatType.MEETING_ROOM, section="10-Seater Conf", price=3000.0)
    ]
    
    all_seats = workstations + cabins + meeting_rooms
    for seat in all_seats:
        session.add(seat)
    
    session.commit()
    return {"message": f"Initialized {len(all_seats)} seats"}
