import logging

import sqlalchemy
from sqlmodel import create_engine, SQLModel, Session, select

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.SQL_ECHO,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"} if "neon.tech" in (settings.DATABASE_URL or "") else {},
)


def init_db():
    _run_migrations()
    SQLModel.metadata.create_all(engine)
    seed_admin()
    seed_office()


def _run_migrations():
    """
    Run schema migrations before create_all().
    Order matters: convert native enums to VARCHAR first so create_all()
    finds compatible column types on existing tables.
    """
    migrations = [
        # Convert seat.type from PostgreSQL native enum → plain VARCHAR.
        # Safe to run repeatedly: VARCHAR→VARCHAR cast is a no-op.
        "ALTER TABLE seat ALTER COLUMN type TYPE VARCHAR USING type::VARCHAR",
        # Booking columns
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS payment_status  VARCHAR DEFAULT 'pending'",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS razorpay_order_id  VARCHAR",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR",
        "CREATE INDEX IF NOT EXISTS ix_booking_razorpay_order_id ON booking(razorpay_order_id)",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS duration_unit     VARCHAR DEFAULT 'monthly'",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS duration_quantity INTEGER DEFAULT 1",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS price_amount      DOUBLE PRECISION DEFAULT 0",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS start_time        TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS end_time          TIMESTAMP WITH TIME ZONE",
        # KYC fields on user table
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS mobile              VARCHAR",
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS occupation_sector   VARCHAR",
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS occupation_role     VARCHAR",
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS kyc_document_name   VARCHAR",
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS kyc_document_data   TEXT",
    ]
    try:
        with engine.connect() as conn:
            for sql in migrations:
                try:
                    conn.execute(sqlalchemy.text(sql))
                    conn.commit()
                    logger.info("Migration OK: %.70s", sql)
                except Exception as exc:
                    conn.rollback()
                    logger.info("Migration skipped (%.60s): %s", sql, exc)
    except Exception as exc:
        # DB may not exist yet on very first deploy — create_all() will handle it
        logger.warning("Migration phase skipped (DB not ready?): %s", exc)


def seed_admin():
    """Auto-create default admin user from env vars if it doesn't exist."""
    from app.models.models import User, UserRole
    from app.core.auth import get_password_hash

    admin_email = settings.ADMIN_EMAIL
    admin_password = settings.ADMIN_PASSWORD

    if not admin_email or not admin_password:
        logger.warning("ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed.")
        return

    with Session(engine) as session:
        existing = session.exec(select(User).where(User.email == admin_email)).first()
        if existing:
            if existing.role != UserRole.ADMIN:
                existing.role = UserRole.ADMIN
                session.add(existing)
                session.commit()
                logger.info("Promoted %s to admin", admin_email)
            return

        admin_user = User(
            email=admin_email,
            full_name="SkyDesk Admin",
            role=UserRole.ADMIN,
            gov_id_type="PAN",
            gov_id_number="ADMIN00000",
            hashed_password=get_password_hash(admin_password),
        )
        session.add(admin_user)
        session.commit()
        logger.info("Default admin created: %s", admin_email)


def seed_office():
    """Auto-create default seats if none exist."""
    from app.seed.office import seed_office_if_empty
    with Session(engine) as session:
        created = seed_office_if_empty(session)
        if created:
            logger.info("Seeded %d seats", created)


def get_session():
    with Session(engine) as session:
        yield session
