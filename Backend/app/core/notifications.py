"""
Email notifications for SkyDesk360 — powered by Resend (resend.com).
Falls back to a warning log if RESEND_API_KEY is not set.
"""
from __future__ import annotations

import logging
from typing import Any

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Brand colours (inline HTML email) ────────────────────────────────────────
_CYAN   = "#00f2fe"
_PURPLE = "#a855f7"
_DARK   = "#0a0a14"
_CARD   = "#0f172a"
_TEXT   = "#e2e8f0"
_MUTED  = "#64748b"


def _resend_configured() -> bool:
    return bool(settings.RESEND_API_KEY)


def _send(to: str | list[str], subject: str, html: str, text: str = "") -> None:
    if not _resend_configured():
        logger.warning("RESEND_API_KEY not set — email NOT sent to %s | %s", to, subject)
        return

    resend.api_key = settings.RESEND_API_KEY
    from_addr = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    recipients = [to] if isinstance(to, str) else to

    params: resend.Emails.SendParams = {
        "from": from_addr,
        "to": recipients,
        "subject": subject,
        "html": html,
    }
    if text:
        params["text"] = text

    resp = resend.Emails.send(params)
    logger.info("Resend email sent to %s | id=%s | subject=%s", recipients, resp.get("id"), subject)


# ─────────────────────────────────────────────────────────────────────────────
# Shared layout helpers
# ─────────────────────────────────────────────────────────────────────────────

def _wrap_layout(body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>SkyDesk360</title>
</head>
<body style="margin:0;padding:0;background:{_DARK};font-family:'Helvetica Neue',Arial,sans-serif;color:{_TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:{_DARK};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#00111a,#0f0020);border-radius:20px 20px 0 0;padding:32px 40px;text-align:center;border-bottom:1px solid rgba(0,242,254,0.15);">
              <span style="font-size:24px;font-weight:900;font-style:italic;letter-spacing:-0.03em;color:#ffffff;">
                Sky<span style="color:{_CYAN};">Desk360</span>
              </span>
              <br/>
              <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.35em;color:{_MUTED};">Premium Coworking Spaces</span>
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
              <p style="margin:0 0 6px;font-size:11px;">
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
      <td style="padding:11px 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:{_MUTED};white-space:nowrap;border-bottom:1px solid rgba(255,255,255,0.04);width:130px;">{label}</td>
      <td style="padding:11px 16px;font-size:13px;font-weight:600;color:{_TEXT};border-bottom:1px solid rgba(255,255,255,0.04);">{value}</td>
    </tr>"""


def _detail_table(rows: list[tuple[str, str]]) -> str:
    rows_html = "".join(_detail_row(k, v) for k, v in rows)
    return f"""<table width="100%" cellpadding="0" cellspacing="0"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;margin:20px 0;">
      {rows_html}
    </table>"""


def _badge(text: str, color: str = _CYAN) -> str:
    return f'<span style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;background:{color}22;border:1px solid {color}55;color:{color};">{text}</span>'


def _divider() -> str:
    return '<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,242,254,0.2),transparent);margin:28px 0;"></div>'


def _fmt_dt(dt: Any) -> str:
    if not dt:
        return "—"
    if isinstance(dt, str):
        from datetime import datetime as _dt
        try:
            dt = _dt.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            return str(dt)
    return dt.strftime("%d %b %Y, %I:%M %p")


# ─────────────────────────────────────────────────────────────────────────────
# Registration welcome email
# ─────────────────────────────────────────────────────────────────────────────

def send_registration_email(email: str, name: str) -> None:
    subject = "Welcome to SkyDesk360 — Your Account is Ready"
    first_name = name.split()[0]

    body = f"""
      <h2 style="margin:0 0 8px;font-size:26px;font-weight:900;font-style:italic;text-transform:uppercase;color:#fff;">
        Welcome, {first_name}!
      </h2>
      <p style="margin:0 0 24px;font-size:14px;color:{_MUTED};line-height:1.7;">
        Your SkyDesk360 account has been created. You're now part of a premium coworking community built for focus, collaboration, and growth.
      </p>

      <p style="margin:0 0 12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;color:{_CYAN};">What's Next?</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr><td style="padding:8px 0;font-size:13px;color:{_TEXT};"><span style="color:{_CYAN};font-weight:800;margin-right:10px;">01</span> Browse desks, cabins &amp; conference rooms</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:{_TEXT};"><span style="color:{_CYAN};font-weight:800;margin-right:10px;">02</span> Choose your duration — hourly, daily, or monthly</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:{_TEXT};"><span style="color:{_CYAN};font-weight:800;margin-right:10px;">03</span> Pay securely via Razorpay &amp; get instant confirmation</td></tr>
      </table>

      {_divider()}

      <p style="margin:0;font-size:12px;color:{_MUTED};line-height:1.7;">
        Questions? Write to us at
        <a href="mailto:info@skydesk360.com" style="color:{_CYAN};text-decoration:none;font-weight:700;">info@skydesk360.com</a>
      </p>
    """

    text = (
        f"Welcome to SkyDesk360, {name}!\n\n"
        "Your account is ready. Log in and start booking your workspace.\n\n"
        "Contact: info@skydesk360.com\n— SkyDesk360 Team"
    )

    try:
        _send(email, subject, _wrap_layout(body), text)
    except Exception as exc:
        logger.warning("Registration email failed for %s: %s", email, exc)


# ─────────────────────────────────────────────────────────────────────────────
# Booking confirmation → customer
# ─────────────────────────────────────────────────────────────────────────────

def send_booking_confirmation_email(email: str, name: str, details: dict[str, Any]) -> None:
    seat_code     = details.get("seat_code", "—")
    seat_type     = (details.get("seat_type") or "workstation").replace("_", " ").title()
    section       = details.get("section", "—")
    dur_unit      = (details.get("duration_unit") or "monthly").capitalize()
    dur_qty       = details.get("duration_quantity", 1)
    amount        = details.get("amount", 0)
    txn_id        = details.get("transaction_id", "—")
    start_time    = details.get("start_time")
    end_time      = details.get("end_time")

    subject = f"Booking Confirmed — {seat_code} | SkyDesk360"

    body = f"""
      <div>{_badge("Booking Confirmed", _CYAN)}</div>
      <h2 style="margin:16px 0 8px;font-size:26px;font-weight:900;font-style:italic;text-transform:uppercase;color:#fff;">
        Your seat is booked,<br/>{name.split()[0]}!
      </h2>
      <p style="margin:0 0 28px;font-size:14px;color:{_MUTED};line-height:1.7;">
        Thank you for choosing SkyDesk360. Your booking is confirmed and payment received. See you at the space!
      </p>

      <p style="margin:0 0 4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;color:{_CYAN};">Booking Details</p>
      {_detail_table([
          ("Seat",        f"<strong style='color:{_CYAN};'>{seat_code}</strong> &nbsp;&#8212;&nbsp; {seat_type}"),
          ("Section",     section),
          ("Duration",    f"{dur_qty} {dur_unit}{'s' if dur_qty > 1 else ''}"),
          ("Check-In",    _fmt_dt(start_time)),
          ("Check-Out",   _fmt_dt(end_time)),
          ("Amount Paid", f"<strong style='color:#4ade80;'>&#8377;{float(amount):,.2f}</strong>"),
          ("Txn ID",      f"<span style='font-family:monospace;font-size:11px;color:{_MUTED};'>{txn_id}</span>"),
      ])}

      {_divider()}

      <p style="margin:0 0 12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;color:{_PURPLE};">Workspace Guidelines</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr><td style="padding:6px 0;font-size:13px;color:{_TEXT};">&#10003;&nbsp; Arrive on time with your booking confirmation</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:{_TEXT};">&#10003;&nbsp; Carry a valid photo ID for entry verification</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:{_TEXT};">&#10003;&nbsp; High-speed Wi-Fi &amp; power backup included</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:{_TEXT};">&#10003;&nbsp; Need help? Write to info@skydesk360.com</td></tr>
      </table>

      <p style="margin:0;font-size:12px;color:{_MUTED};">
        For any queries, reach us at
        <a href="mailto:info@skydesk360.com" style="color:{_CYAN};text-decoration:none;font-weight:700;">info@skydesk360.com</a>
      </p>
    """

    text = (
        f"Booking Confirmed — SkyDesk360\n\n"
        f"Hi {name},\n\n"
        f"Seat      : {seat_code} ({seat_type})\n"
        f"Section   : {section}\n"
        f"Duration  : {dur_qty} {dur_unit}\n"
        f"Check-In  : {_fmt_dt(start_time)}\n"
        f"Check-Out : {_fmt_dt(end_time)}\n"
        f"Amount    : INR {float(amount):,.2f}\n"
        f"Txn ID    : {txn_id}\n\n"
        "Thank you for choosing SkyDesk360!\n"
        "Contact: info@skydesk360.com"
    )

    try:
        _send(email, subject, _wrap_layout(body), text)
    except Exception as exc:
        logger.warning("Booking confirmation email failed for %s: %s", email, exc)


# ─────────────────────────────────────────────────────────────────────────────
# Admin notification → info@skydesk360.com
# ─────────────────────────────────────────────────────────────────────────────

def send_admin_booking_notification(details: dict[str, Any]) -> None:
    admin_email = settings.ADMIN_EMAIL or "info@skydesk360.com"

    user_name   = details.get("user_name", "—")
    user_email  = details.get("user_email", "—")
    user_mobile = details.get("user_mobile") or "—"
    gov_id      = details.get("gov_id", "—")
    seat_code   = details.get("seat_code", "—")
    seat_type   = (details.get("seat_type") or "workstation").replace("_", " ").title()
    section     = details.get("section", "—")
    dur_unit    = (details.get("duration_unit") or "monthly").capitalize()
    dur_qty     = details.get("duration_quantity", 1)
    amount      = details.get("amount", 0)
    txn_id      = details.get("transaction_id", "—")
    start_time  = details.get("start_time")
    end_time    = details.get("end_time")

    subject = f"New Booking: {seat_code} — {user_name}"

    body = f"""
      <div>{_badge("New Booking Alert", _PURPLE)}</div>
      <h2 style="margin:16px 0 8px;font-size:24px;font-weight:900;font-style:italic;text-transform:uppercase;color:#fff;">
        Seat {seat_code} Just Booked
      </h2>
      <p style="margin:0 0 28px;font-size:14px;color:{_MUTED};line-height:1.7;">
        A new booking has been confirmed and payment received. Full details below.
      </p>

      <p style="margin:0 0 4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;color:{_PURPLE};">Customer</p>
      {_detail_table([
          ("Name",   user_name),
          ("Email",  f"<a href='mailto:{user_email}' style='color:{_CYAN};text-decoration:none;'>{user_email}</a>"),
          ("Mobile", user_mobile),
          ("Gov ID", f"<span style='font-family:monospace;font-size:12px;color:{_MUTED};'>{gov_id}</span>"),
      ])}

      <p style="margin:0 0 4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;color:{_CYAN};">Booking</p>
      {_detail_table([
          ("Seat",      f"<strong style='color:{_CYAN};'>{seat_code}</strong> &nbsp;&#8212;&nbsp; {seat_type}"),
          ("Section",   section),
          ("Duration",  f"{dur_qty} {dur_unit}{'s' if dur_qty > 1 else ''}"),
          ("Check-In",  _fmt_dt(start_time)),
          ("Check-Out", _fmt_dt(end_time)),
          ("Amount",    f"<strong style='color:#4ade80;'>&#8377;{float(amount):,.2f}</strong>"),
          ("Txn ID",    f"<span style='font-family:monospace;font-size:11px;color:{_MUTED};'>{txn_id}</span>"),
      ])}

      {_divider()}
      <p style="margin:0;font-size:12px;color:{_MUTED};">
        Log in to the admin panel to manage seats and view all bookings.
      </p>
    """

    text = (
        f"New Booking — SkyDesk360 Admin\n\n"
        f"Customer : {user_name} ({user_email})\n"
        f"Mobile   : {user_mobile}\n"
        f"Gov ID   : {gov_id}\n\n"
        f"Seat     : {seat_code} ({seat_type})\n"
        f"Section  : {section}\n"
        f"Duration : {dur_qty} {dur_unit}\n"
        f"Check-In : {_fmt_dt(start_time)}\n"
        f"Check-Out: {_fmt_dt(end_time)}\n"
        f"Amount   : INR {float(amount):,.2f}\n"
        f"Txn ID   : {txn_id}\n"
    )

    try:
        _send(admin_email, subject, _wrap_layout(body), text)
    except Exception as exc:
        logger.warning("Admin booking notification failed: %s", exc)


# ─────────────────────────────────────────────────────────────────────────────
# Legacy shim — called from payment.py verify endpoint
# ─────────────────────────────────────────────────────────────────────────────

def send_booking_email(email: str, name: str, booking_details: dict[str, Any]) -> None:
    send_booking_confirmation_email(email, name, booking_details)
    send_admin_booking_notification(booking_details)
