from sqlmodel import create_engine, SQLModel, Session, select
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.SQL_ECHO,
    pool_pre_ping=True,
)

def init_db():
    SQLModel.metadata.create_all(engine)
    seed_admin()

def seed_admin():
    """Auto-create default admin user if it doesn't exist."""
    from app.models.models import User, UserRole
    from app.core.auth import get_password_hash

    ADMIN_EMAIL = "admin@skydesk360.com"
    ADMIN_PASSWORD = "SkyDesk@Admin2026"

    with Session(engine) as session:
        existing = session.exec(select(User).where(User.email == ADMIN_EMAIL)).first()
        if existing:
            # Ensure existing user has admin role
            if existing.role != UserRole.ADMIN:
                existing.role = UserRole.ADMIN
                session.add(existing)
                session.commit()
                logger.info("Promoted %s to admin", ADMIN_EMAIL)
            return

        admin_user = User(
            email=ADMIN_EMAIL,
            full_name="SkyDesk Admin",
            role=UserRole.ADMIN,
            gov_id_type="PAN",
            gov_id_number="ADMIN00000",
            hashed_password=get_password_hash(ADMIN_PASSWORD),
        )
        session.add(admin_user)
        session.commit()
        logger.info("Default admin created: %s", ADMIN_EMAIL)

def get_session():
    with Session(engine) as session:
        yield session
