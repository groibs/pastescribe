from __future__ import annotations

import math
from datetime import UTC, date, datetime, timedelta

from .config import WorkerConfig
from .models import CostEstimate, MediaProbe


def _ceil_div(numerator: int, denominator: int) -> int:
    return -(-numerator // denominator)


def current_month_window(now: datetime | None = None) -> tuple[date, date]:
    current = now or datetime.now(UTC)
    period_start = date(current.year, current.month, 1)
    if current.month == 12:
        next_month = date(current.year + 1, 1, 1)
    else:
        next_month = date(current.year, current.month + 1, 1)
    return period_start, next_month - timedelta(days=1)


def estimate_transcription_cost(probe: MediaProbe, config: WorkerConfig) -> CostEstimate:
    duration_seconds = max(1, math.ceil(probe.duration_seconds))
    estimated_micros = duration_seconds * config.transcription_cost_micros_usd_per_second
    reserved_micros = _ceil_div(estimated_micros * config.reserve_factor_bps, 10_000)

    # micros USD → BRL mills/USD → centavos BRL:
    # micros / 1e6 * mills / 1e3 * 100 = micros * mills / 1e7.
    reserved_cents_brl = max(
        1,
        _ceil_div(reserved_micros * config.planning_brl_per_usd_millis, 10_000_000),
    )
    return CostEstimate(
        duration_seconds=duration_seconds,
        estimated_cost_micros_usd=estimated_micros,
        reserved_cost_micros_usd=reserved_micros,
        reserved_cost_cents_brl=reserved_cents_brl,
    )
