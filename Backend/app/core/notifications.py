import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_registration_email(email: str, name: str):
    subject = "SkyDesk Pro - Welcome!"
    body = (
        f"Hello {name},\n\n"
        "Welcome to SkyDesk Pro! Your account has been successfully created. "
        "You can now log in and start booking your workstations."
    )
    logger.info("Registration email queued for %s | Subject: %s", email, subject)
    logger.debug("Email body: %s", body)


def send_booking_email(email: str, name: str, booking_details: dict):
    subject = f"SkyDesk Pro - Booking Confirmed: {booking_details['seat_code']}"
    body = (
        f"Hello {name},\n\n"
        f"Your booking for {booking_details['seat_code']} on {booking_details['date']} has been confirmed.\n"
        f"Amount Paid: {booking_details['amount']}\n"
        f"Transaction ID: {booking_details['transaction_id']}\n\n"
        "Thank you for choosing SkyDesk Pro!"
    )
    logger.info("Booking confirmation email queued for %s | Subject: %s", email, subject)
    logger.debug("Email body: %s", body)
