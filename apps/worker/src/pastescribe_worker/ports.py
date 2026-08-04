from __future__ import annotations

from pathlib import Path
from typing import Protocol

from .models import MediaProbe, TranscriptFixture, TranscriptionJob


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


class JobSource(Protocol):
    async def claim_next_job(self) -> TranscriptionJob | None: ...
