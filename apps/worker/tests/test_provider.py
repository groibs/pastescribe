from __future__ import annotations

import asyncio
from pathlib import Path

from pastescribe_worker.models import MediaProbe
from pastescribe_worker.provider import FakeTranscriptionProvider


def test_fake_provider_is_deterministic(tmp_path: Path) -> None:
    media = tmp_path / "input.bin"
    media.write_bytes(b"fixture")
    probe = MediaProbe(10.0, 7, None, None, "pcm_s16le", None, None, None)
    result = asyncio.run(FakeTranscriptionProvider().transcribe(media, probe))
    assert result.model == "fake-transcriber-v1"
    assert result.segments[0].start_ms == 0
    assert result.segments[0].end_ms == 5000
    assert result.text == result.segments[0].text
