from __future__ import annotations

import asyncio
import logging
import shutil
import tempfile
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

from .config import WorkerConfig
from .models import MediaProbe, TranscriptFixture
from .observability import log_event
from .ports import MediaRunner, TranscriptionProvider

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class RuntimeState:
    started_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    active_operation: str | None = None
    operations_completed: int = 0
    last_error_code: str | None = None


@dataclass(frozen=True, slots=True)
class PreparedFixture:
    probe: MediaProbe
    transcript: TranscriptFixture


class WorkerRuntime:
    """Owns operation-scoped temp space and reusable media/provider ports."""

    def __init__(
        self,
        config: WorkerConfig,
        media_runner: MediaRunner,
        provider: TranscriptionProvider,
    ) -> None:
        self.config = config
        self.media_runner = media_runner
        self.provider = provider
        self.state = RuntimeState()
        self._shutdown = asyncio.Event()

    async def prepare_fixture(self, media_path: Path, operation_id: str) -> PreparedFixture:
        self.config.temp_root.mkdir(parents=True, exist_ok=True)
        operation_dir = Path(
            tempfile.mkdtemp(prefix=f"operation-{operation_id}-", dir=self.config.temp_root)
        )
        self.state.active_operation = operation_id
        copied_media = operation_dir / "input.bin"
        try:
            size = media_path.stat().st_size
            if size > self.config.max_input_bytes:
                raise ValueError("input exceeds WORKER_MAX_INPUT_BYTES")
            await asyncio.to_thread(shutil.copyfile, media_path, copied_media)
            async with asyncio.timeout(self.config.job_timeout_seconds):
                probe = await self.media_runner.probe(copied_media)
                transcript = await self.provider.transcribe(copied_media, probe)
            self.state.operations_completed += 1
            self.state.last_error_code = None
            log_event(
                logger,
                "worker_fixture_prepared",
                operation_id=operation_id,
                duration_seconds=round(probe.duration_seconds, 3),
                bytes=probe.size_bytes,
                video_codec=probe.video_codec,
                audio_codec=probe.audio_codec,
                width=probe.width,
                height=probe.height,
                frame_rate=probe.frame_rate,
            )
            return PreparedFixture(probe=probe, transcript=transcript)
        except TimeoutError:
            self.state.last_error_code = "job_timeout"
            raise
        except Exception as error:
            self.state.last_error_code = type(error).__name__
            raise
        finally:
            self.state.active_operation = None
            await asyncio.to_thread(shutil.rmtree, operation_dir, True)

    def request_shutdown(self) -> None:
        self._shutdown.set()

    @property
    def shutdown_requested(self) -> bool:
        return self._shutdown.is_set()
