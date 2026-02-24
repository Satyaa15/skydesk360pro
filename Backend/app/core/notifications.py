from app.core.config import settings

def send_registration_email(email: str, name: str):
    """
    Mock function to simulate sending a registration email.
    In a real app, this would use an SMTP server.
    """
    subject = "SkyDesk Pro - Welcome!"
    body = f"Hello {name},\n\nWelcome to SkyDesk Pro! Your account has been successfully created. You can now log in and start booking your workstations."
    print(f"DEBUG: Sending email to {email}")
    print(f"DEBUG: Subject: {subject}")
    print(f"DEBUG: Body: {body}")
    # In a real implementation:
    # send_email(email, subject, body)

def send_booking_email(email: str, name: str, booking_details: dict):
    """
    Mock function to simulate sending a booking confirmation email.
    """
    subject = f"SkyDesk Pro - Booking Confirmed: {booking_details['seat_code']}"
    body = f"Hello {name},\n\nYour booking for {booking_details['seat_code']} on {booking_details['date']} has been confirmed.\nAmount Paid: {booking_details['amount']}\nTransaction ID: {booking_details['transaction_id']}\n\nThank you for choosing SkyDesk Pro!"
    print(f"DEBUG: Sending email to {email}")
    print(f"DEBUG: Subject: {subject}")
    print(f"DEBUG: Body: {body}")
