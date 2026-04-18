"""
Email notifications for SkyDesk360.
Sends via SMTP (STARTTLS on port 587 by default).
Falls back to logging if SMTP is not configured.
"""
from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Brand colours (used inline in HTML emails) ────────────────────────────────
_CYAN   = "#00f2fe"
_PURPLE = "#a855f7"
_DARK   = "#0a0a14"
_CARD   = "#0f172a"
_BORDER = "rgba(255,255,255,0.08)"
_TEXT   = "#e2e8f0"
_MUTED  = "#64748b"


# ─────────────────────────────────────────────────────────────────────────────
# SMTP helper
# ─────────────────────────────────────────────────────────────────────────────

def _smtp_configured() -> bool:
    return bool(
        settings.MAIL_SERVER
        and settings.MAIL_USERNAME
        and settings.MAIL_PASSWORD
        and settings.MAIL_FROM
    )


def _send(to: str | list[str], subject: str, html: str, text: str = "") -> None:
    """Send an email.  Raises on SMTP errors so callers can catch + warn."""
    if not _smtp_configured():
        logger.warning(
            "SMTP not configured — email NOT sent to %s | Subject: %s", to, subject
        )
        logger.debug("Email body (text): %s", text or html[:300])
        return

    recipients = [to] if isinstance(to, str) else to

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{settings.MAIL_FROM_NAME or 'SkyDesk360'} <{settings.MAIL_FROM}>"
    msg["To"]      = ", ".join(recipients)

    if text:
        msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        smtp.sendmail(settings.MAIL_FROM, recipients, msg.as_string())

    logger.info("Email sent to %s | Subject: %s", recipients, subject)


# ─────────────────────────────────────────────────────────────────────────────
# Shared layout helpers
# ─────────────────────────────────────────────────────────────────────────────

def _wrap_layout(body_html: str) -> str:
    """Wrap a body fragment in the full branded email shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SkyDesk360</title>
</head>
<body style="margin:0;padding:0;background:{_DARK};font-family:'Helvetica Neue',Arial,sans-serif;color:{_TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:{_DARK};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header logo bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#00111a,#0f0020);border-radius:20px 20px 0 0;padding:32px 40px;text-align:center;border-bottom:1px solid rgba(0,242,254,0.15);">
              <div style="display:inline-block;">
                <span style="font-size:22px;font-weight:900;font-style:italic;letter-spacing:-0.03em;color:#ffffff;">
                  Sky<span style="background:linear-gradient(135deg,{_CYAN},{_PURPLE});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Desk360</span>
                </span>
                <span style="display:block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.35em;color:{_MUTED};margin-top:4px;">Premium Coworking Spaces</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:{_CARD};padding:40px;border-left:1px solid rgba(255,255,255,0.05);border-right:1px solid rgba(255,255,255,0.05);">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#070712;border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;border:1px solid rgba(255,255,255,0.04);border-top:1px solid rgba(0,242,254,0.08);">
              <p style="margin:0 0 6px;font-size:11px;color:{_MUTED};">SkyDesk360 &mdash; Modern Coworking</p>
              <p style="margin:0 0 6px;font-size:11px;color:#334155;">
                <a href="mailto:info@skydesk360.com" style="color:{_CYAN};text-decoration:none;">info@skydesk360.com</a>
              </p>
              <p style="margin:12px 0 0;font-size:10px;color:#1e293b;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _detail_row(label: str, value: str) -> str:
    return f"""<tr>
      <td style="padding:10px 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:{_MUTED};white-space:nowrap;border-bottom:1px solid rgba(255,255,255,0.04);">{label}</td>
      <td style="padding:10px 16px;font-size:13px;font-weight:600;color:{_TEXT};border-bottom:1px solid rgba(255,255,255,0.04);">{value}</td>
    </tr>"""


def _detail_table(rows: list[tuple[str, str]]) -> str:
    rows_html = "".join(_detail_row(k, v) for k, v in rows)
    return f"""<table width="100%" cellpadding="0" cellspacing="0"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:12px;border-collapse:separate;overflow:hidden;margin:24px 0;">
      {rows_html}
    </table>"""


def _section_heading(text: str, accent: str = _CYAN) -> str:
    return f"""<p style="margin:0 0 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;color:{accent};">{text}</p>"""


def _divider() -> str:
    return '<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,242,254,0.15),transparent);margin:28px 0;"></div>'


def _badge(text: str, color: str = _CYAN) -> str:
    return f'<span style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;background:{color}18;border:1px solid {color}40;color:{color};">{text}</span>'


# ─────────────────────────────────────────────────────────────────────────────
# Registration email
# ─────────────────────────────────────────────────────────────────────────────

def send_registration_email(email: str, name: str) -> None:
    subject = "Welcome to SkyDesk360 — Your Account is Ready"

    body = f"""
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-0.02em;color:#ffffff;">
        Welcome aboard, {name.split()[0]}!
      </h2>
      <p style="margin:0 0 24px;font-size:14px;color:{_MUTED};line-height:1.7;">
        Your SkyDesk360 account has been created successfully. You're now part of a premium coworking community designed for focus, collaboration, and growth.
      </p>

      {_section_heading("What's next?")}
      <table cellpadding="0" cellspacing="0" style="margin:12px 0 28px;">
        <tr>
          <td style="padding:8px 0;">
            <span style="color:{_CYAN};font-weight:800;margin-right:10px;">01</span>
            <span style="font-size:13px;color:{_TEXT};">Browse available desks, cabins &amp; conference rooms</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <span style="color:{_CYAN};font-weight:800;margin-right:10px;">02</span>
            <span style="font-size:13px;color:{_TEXT};">Choose your duration — hourly, daily, or monthly</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <span style="color:{_CYAN};font-weight:800;margin-right:10px;">03</span>
            <span style="font-size:13px;color:{_TEXT};">Complete payment securely via Razorpay</span>
          </td>
        </tr>
      </table>

      {_divider()}

      <p style="margin:0;font-size:12px;color:{_MUTED};line-height:1.7;">
        Questions? Reach us at
        <a href="mailto:info@skydesk360.com" style="color:{_CYAN};text-decoration:none;font-weight:700;">info@skydesk360.com</a>
        — we're happy to help.
      </p>
    """

    text = (
        f"Welcome to SkyDesk360, {name}!\n\n"
        "Your account has been created successfully. Log in and start booking your workspace.\n\n"
        "For any questions, contact us at info@skydesk360.com\n\n"
        "— The SkyDesk360 Team"
    )

    try:
        _send(email, subject, _wrap_layout(body), text)
    except Exception as exc:
        logger.warning("Registration email failed for %s: %s", email, exc)


# ─────────────────────────────────────────────────────────────────────────────
# Booking confirmation (to customer)
# ─────────────────────────────────────────────────────────────────────────────

def send_booking_confirmation_email(email: str, name: str, details: dict[str, Any]) -> None:
    """
    details keys: seat_code, seat_type, section, duration_unit, duration_quantity,
                  amount, transaction_id, start_time, end_time, booking_date
    """
    seat_code       = details.get("seat_code", "—")
    seat_type       = (details.get("seat_type") or "workstation").replace("_", " ").title()
    section         = details.get("section", "—")
    duration_unit   = (details.get("duration_unit") or "monthly").capitalize()
    duration_qty    = details.get("duration_quantity", 1)
    amount          = details.get("amount", 0)
    txn_id          = details.get("transaction_id", "—")
    start_time      = details.get("start_time")
    end_time        = details.get("end_time")

    def _fmt(dt: Any) -> str:
        if not dt:
            return "—"
        if isinstance(dt, str):
            from datetime import datetime as _dt
            try:
                dt = _dt.fromisoformat(dt.replace("Z", "+00:00"))
            except Exception:
                return dt
        return dt.strftime("%d %b %Y, %I:%M %p")

    subject = f"Booking Confirmed — Seat {seat_code} | SkyDesk360"

    body = f"""
      <div style="margin-bottom:6px;">{_badge("Booking Confirmed", _CYAN)}</div>
      <h2 style="margin:16px 0 8px;font-size:26px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-0.02em;color:#ffffff;">
        Your seat is ready,<br/>{name.split()[0]}!
      </h2>
      <p style="margin:0 0 28px;font-size:14px;color:{_MUTED};line-height:1.7;">
        Thank you for choosing SkyDesk360. Your booking has been confirmed and payment received. Here are your booking details:
      </p>

      {_section_heading("Booking Details")}
      {_detail_table([
          ("Seat",        f"<strong style='color:{_CYAN};'>{seat_code}</strong> &mdash; {seat_type}"),
          ("Section",     section),
          ("Duration",    f"{duration_qty} {duration_unit}{'s' if duration_qty > 1 else ''}"),
          ("Check-In",    _fmt(start_time)),
          ("Check-Out",   _fmt(end_time)),
          ("Amount Paid", f"<strong style='color:#4ade80;'>&#8377;{float(amount):,.2f}</strong>"),
          ("Transaction", f"<span style='font-family:monospace;font-size:11px;color:{_MUTED};'>{txn_id}</span>"),
      ])}

      {_divider()}

      {_section_heading("Workspace Guidelines", _PURPLE)}
      <table cellpadding="0" cellspacing="0" style="margin:12px 0 28px;">
        <tr><td style="padding:6px 0;font-size:13px;color:{_TEXT};">&#x2713;&nbsp; Arrive at your desk on time</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:{_TEXT};">&#x2713;&nbsp; High-speed Wi-Fi access included</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:{_TEXT};">&#x2713;&nbsp; Bring your ID proof for verification</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:{_TEXT};">&#x2713;&nbsp; For support, contact info@skydesk360.com</td></tr>
      </table>

      <p style="margin:0;font-size:12px;color:{_MUTED};line-height:1.7;">
        Need to make changes or have questions?<br/>
        Reach us at <a href="mailto:info@skydesk360.com" style="color:{_CYAN};text-decoration:none;font-weight:700;">info@skydesk360.com</a>
      </p>
    """

    text = (
        f"Booking Confirmed — SkyDesk360\n\n"
        f"Hi {name},\n\n"
        f"Your booking has been confirmed.\n\n"
        f"Seat      : {seat_code} ({seat_type})\n"
        f"Section   : {section}\n"
        f"Duration  : {duration_qty} {duration_unit}\n"
        f"Check-In  : {_fmt(start_time)}\n"
        f"Check-Out : {_fmt(end_time)}\n"
        f"Amount    : INR {float(amount):,.2f}\n"
        f"Txn ID    : {txn_id}\n\n"
        "Thank you for choosing SkyDesk360!\n"
        "Contact us: info@skydesk360.com"
    )

    try:
        _send(email, subject, _wrap_layout(body), text)
    except Exception as exc:
        logger.warning("Booking confirmation email failed for %s: %s", email, exc)


# ─────────────────────────────────────────────────────────────────────────────
# Admin notification (to info@skydesk360.com)
# ─────────────────────────────────────────────────────────────────────────────

def send_admin_booking_notification(details: dict[str, Any]) -> None:
    """
    details keys: user_name, user_email, user_mobile, gov_id,
                  seat_code, seat_type, section, duration_unit, duration_quantity,
                  amount, transaction_id, start_time, end_time
    """
    admin_email = settings.ADMIN_EMAIL or "info@skydesk360.com"

    user_name   = details.get("user_name", "—")
    user_email  = details.get("user_email", "—")
    user_mobile = details.get("user_mobile") or "—"
    gov_id      = details.get("gov_id", "—")
    seat_code   = details.get("seat_code", "—")
    seat_type   = (details.get("seat_type") or "workstation").replace("_", " ").title()
    section     = details.get("section", "—")
    duration_unit = (details.get("duration_unit") or "monthly").capitalize()
    duration_qty  = details.get("duration_quantity", 1)
    amount        = details.get("amount", 0)
    txn_id        = details.get("transaction_id", "—")
    start_time    = details.get("start_time")
    end_time      = details.get("end_time")

    def _fmt(dt: Any) -> str:
        if not dt:
            return "—"
        if isinstance(dt, str):
            from datetime import datetime as _dt
            try:
                dt = _dt.fromisoformat(dt.replace("Z", "+00:00"))
            except Exception:
                return dt
        return dt.strftime("%d %b %Y, %I:%M %p")

    subject = f"New Booking — {seat_code} by {user_name}"

    body = f"""
      <div style="margin-bottom:6px;">{_badge("New Booking Alert", _PURPLE)}</div>
      <h2 style="margin:16px 0 8px;font-size:24px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-0.02em;color:#ffffff;">
        Seat {seat_code} Just Booked
      </h2>
      <p style="margin:0 0 28px;font-size:14px;color:{_MUTED};line-height:1.7;">
        A new booking has been confirmed and payment received. Details are below.
      </p>

      {_section_heading("Customer Details")}
      {_detail_table([
          ("Name",   user_name),
          ("Email",  f"<a href='mailto:{user_email}' style='color:{_CYAN};text-decoration:none;'>{user_email}</a>"),
          ("Mobile", user_mobile),
          ("Gov ID", f"<span style='font-family:monospace;font-size:12px;color:{_MUTED};'>{gov_id}</span>"),
      ])}

      {_section_heading("Booking Details")}
      {_detail_table([
          ("Seat",        f"<strong style='color:{_CYAN};'>{seat_code}</strong> &mdash; {seat_type}"),
          ("Section",     section),
          ("Duration",    f"{duration_qty} {duration_unit}{'s' if duration_qty > 1 else ''}"),
          ("Check-In",    _fmt(start_time)),
          ("Check-Out",   _fmt(end_time)),
          ("Amount",      f"<strong style='color:#4ade80;'>&#8377;{float(amount):,.2f}</strong>"),
          ("Transaction", f"<span style='font-family:monospace;font-size:11px;color:{_MUTED};'>{txn_id}</span>"),
      ])}

      {_divider()}
      <p style="margin:0;font-size:12px;color:{_MUTED};">
        Log in to the admin panel to view all bookings and manage seats.
      </p>
    """

    text = (
        f"New Booking — SkyDesk360 Admin\n\n"
        f"Customer  : {user_name} ({user_email})\n"
        f"Mobile    : {user_mobile}\n"
        f"Gov ID    : {gov_id}\n\n"
        f"Seat      : {seat_code} ({seat_type})\n"
        f"Section   : {section}\n"
        f"Duration  : {duration_qty} {duration_unit}\n"
        f"Check-In  : {_fmt(start_time)}\n"
        f"Check-Out : {_fmt(end_time)}\n"
        f"Amount    : INR {float(amount):,.2f}\n"
        f"Txn ID    : {txn_id}\n"
    )

    try:
        _send(admin_email, subject, _wrap_layout(body), text)
    except Exception as exc:
        logger.warning("Admin booking notification email failed: %s", exc)


# ─────────────────────────────────────────────────────────────────────────────
# Legacy shim — kept so existing callers (payment.py) don't break
# ─────────────────────────────────────────────────────────────────────────────

def send_booking_email(email: str, name: str, booking_details: dict[str, Any]) -> None:
    """
    Legacy wrapper called from payment.py verify endpoint.
    Delegates to the new split functions.
    """
    send_booking_confirmation_email(email, name, booking_details)
    send_admin_booking_notification(booking_details)
