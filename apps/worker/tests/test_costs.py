from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime

from pastescribe_worker.config import WorkerConfig
from pastescribe_worker.costs import current_month_window, estimate_transcription_cost
from pastescribe_worker.models import MediaProbe


def test_cost_estimate() -> None:
    config = replace(
        WorkerConfig.from_env(),
        transcription_cost_micros_usd_per_second=50,
        reserve_factor_bps=15_000,
        planning_brl_per_usd_millis=5_500,
    )
    probe = MediaProbe(119.1, 1000, "mp4", "h264", "aac", 1920, 1080, 30.0)
    estimate = estimate_transcription_cost(probe, config)
    assert estimate.duration_seconds == 120
    assert estimate.estimated_cost_micros_usd == 6000
    assert estimate.reserved_cost_micros_usd == 9000
    assert estimate.reserved_cost_cents_brl == 5


def test_month_window() -> None:
    start, end = current_month_window(datetime(2026, 12, 15, tzinfo=UTC))
    assert start.isoformat() == "2026-12-01"
    assert end.isoformat() == "2026-12-31"
