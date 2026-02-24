import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Session, select

from app.core.auth import create_access_token, get_password_hash, verify_password
from app.core.config import settings
from app.core.notifications import send_registration_email
from app.db.database import get_session
from app.models.models import User, UserRole

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    gov_id_type: str = Field(min_length=2, max_length=50)
    gov_id_number: str = Field(min_length=4, max_length=64)


class RegisterResponse(BaseModel):
    message: str
    user_id: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_session)):
    # Check if user already exists
    statement = select(User).where(User.email == payload.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    
    # Create new user
    hashed_pwd = get_password_hash(payload.password)
    db_user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=UserRole.USER,
        gov_id_type=payload.gov_id_type,
        gov_id_number=payload.gov_id_number,
        hashed_password=hashed_pwd
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # Send mock email
    try:
        send_registration_email(db_user.email, db_user.full_name)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to send registration email for %s: %s", db_user.email, exc)
    
    return {"message": "User created successfully", "user_id": str(db_user.id), "role": db_user.role.value}


@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}
