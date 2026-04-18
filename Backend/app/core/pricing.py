from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta

from app.models.models import BookingDuration

# ── Official rate card ───────────────────────────────────────────────────────
# All amounts in INR.  Yearly = monthly × 12 × 10% discount.
SEAT_PRICES: dict[str, dict[str, float]] = {
    "workstation": {"hourly": 100.0,  "daily": 400.0,   "monthly": 7_000.0},
    "cabin":       {"hourly": 400.0,  "daily": 2_500.0,  "monthly": 35_000.0},
    "conference":  {"hourly": 550.0,  "daily": 4_500.0,  "monthly": 90_000.0},
    "meeting_room":{"hourly": 550.0,  "daily": 4_500.0,  "monthly": 90_000.0},
}
_DEFAULT_TYPE = "workstation"
_YEARLY_DISCOUNT = Decimal("0.90")


def _to_decimal(value: float | int | str) -> Decimal:
    return Decimal(str(value))


def compute_amount(seat_type: str, duration_unit: BookingDuration, quantity: int = 1) -> float:
    """Return the total booking amount for the given seat type, duration, and quantity."""
    prices = SEAT_PRICES.get(seat_type, SEAT_PRICES[_DEFAULT_TYPE])

    if duration_unit == BookingDuration.HOURLY:
        rate = _to_decimal(prices["hourly"])
    elif duration_unit == BookingDuration.DAILY:
        rate = _to_decimal(prices["daily"])
    elif duration_unit == BookingDuration.YEARLY:
        rate = _to_decimal(prices["monthly"]) * Decimal("12") * _YEARLY_DISCOUNT
    else:  # MONTHLY (default)
        rate = _to_decimal(prices["monthly"])

    total = rate * _to_decimal(quantity)
    return float(total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def to_paise(amount: float) -> int:
    return int((_to_decimal(amount) * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def compute_end_time(start_time: datetime, duration_unit: BookingDuration, quantity: int = 1) -> datetime:
    if duration_unit == BookingDuration.HOURLY:
        return start_time + timedelta(hours=quantity)
    if duration_unit == BookingDuration.DAILY:
        return start_time + timedelta(days=quantity)
    if duration_unit == BookingDuration.YEARLY:
        return start_time + timedelta(days=360 * quantity)
    return start_time + timedelta(days=30 * quantity)
