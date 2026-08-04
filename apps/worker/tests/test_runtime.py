from __future__ import annotations

import asyncio
from dataclasses import replace
from pathlib import Path

from pastescribe_worker.config import WorkerConfig
from pastescribe_worker.models import MediaProbe, TranscriptFixture, TranscriptSegment
from pastescribe_worker.runtime import WorkerRuntime


class StubRunner:
    async def probe(self, media_path: Path) -> MediaProbe:
        return MediaProbe(2.0, media_path.stat().st_size, "fixture", None, "pcm", None, None, None)

    async def burn_subtitles_fixture(
        self,
        media_path: Path,
        subtitles_path: Path,
        output_path: Path,
        *,
        max_seconds: float = 2.0,
    ) -> None:
        del media_path, subtitles_path, max_seconds
        output_path.write_bytes(b"fixture")


class StubProvider:
    async def transcribe(self, media_path: Path, probe: MediaProbe) -> TranscriptFixture:
        assert media_path.exists()
        assert probe.duration_seconds == 2.0
        return TranscriptFixture(
            language="en",
            model="stub",
            text="fixture",
            segments=(TranscriptSegment(0, 0, 2000, "fixture"),),
        )


def test_runtime_cleans_operation_directory(tmp_path: Path) -> None:
    media = tmp_path / "input.wav"
    media.write_bytes(b"123456")
    config = replace(WorkerConfig.from_env(), temp_root=tmp_path / "operations")
    runtime = WorkerRuntime(config, StubRunner(), StubProvider())
    result = asyncio.run(runtime.prepare_fixture(media, "job-1"))
    assert result.transcript.text == "fixture"
    assert runtime.state.operations_completed == 1
    assert list(config.temp_root.iterdir()) == []
