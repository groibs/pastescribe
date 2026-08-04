from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Protocol

from .models import (
    AcquiredMedia,
    CostEstimate,
    JobState,
    MediaAsset,
    MediaProbe,
    TranscriptFixture,
    TranscriptionJob,
)


class MediaRunner(Protocol):
    async def probe(self, media_path: Path) -> MediaProbe: ...

    async def burn_subtitles_fixture(
        self,
        media_path: Path,
        subtitles_path: Path,
        output_path: Path,
        *,
        max_seconds: float = 2.0,
    ) -> None: ...


class TranscriptionProvider(Protocol):
    async def transcribe(self, media_path: Path, probe: MediaProbe) -> TranscriptFixture: ...


class MediaStorage(Protocol):
    async def acquire(
        self,
        asset: MediaAsset,
        destination: Path,
        max_bytes: int,
    ) -> AcquiredMedia: ...


class JobRepository(Protocol):
    async def claim_next_job(self) -> TranscriptionJob | None: ...

    async def heartbeat_job(self, job_id: str) -> TranscriptionJob: ...

    async def get_media_asset(self, job: TranscriptionJob) -> MediaAsset: ...

    async def reserve_job_budget(
        self,
        job_id: str,
        estimate: CostEstimate,
        period_start: date,
        period_end: date,
        identity_key: str,
        envelope: str,
    ) -> TranscriptionJob: ...

    async def advance_job_step(
        self,
        job_id: str,
        to_state: JobState,
        detail: str | None = None,
    ) -> TranscriptionJob: ...

    async def complete_job(
        self,
        job_id: str,
        model: str,
        estimate: CostEstimate,
        actual_cost_micros_usd: int = 0,
        actual_cost_cents_brl: int = 0,
    ) -> TranscriptionJob: ...

    async def fail_job(
        self,
        job_id: str,
        error_code: str,
        error_detail: str | None = None,
    ) -> TranscriptionJob: ...
