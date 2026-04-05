from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from app.models.models import BookingDuration
from datetime import datetime, timedelta

_DAYS_PER_MONTH = Decimal("30")
_HOURS_PER_DAY = Decimal("24")
_YEARLY_DISCOUNT = Decimal("0.90")


def _to_decimal(value: float | int | str) -> Decimal:
    return Decimal(str(value))


def compute_amount(base_monthly_price: float, duration_unit: BookingDuration, quantity: int = 1) -> float:
    base = _to_decimal(base_monthly_price)
    if duration_unit == BookingDuration.HOURLY:
        amount = base / _DAYS_PER_MONTH / _HOURS_PER_DAY
    elif duration_unit == BookingDuration.DAILY:
        amount = base / _DAYS_PER_MONTH
    elif duration_unit == BookingDuration.YEARLY:
        amount = base * Decimal("12") * _YEARLY_DISCOUNT
    else:
        amount = base

    amount = amount * _to_decimal(quantity)
    return float(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


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
