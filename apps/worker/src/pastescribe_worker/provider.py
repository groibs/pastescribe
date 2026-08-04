from __future__ import annotations

from pathlib import Path

from .models import MediaProbe, TranscriptFixture, TranscriptSegment


class FakeTranscriptionProvider:
    """Deterministic provider used until the OpenAI gate in Wave 5."""

    model = "fake-transcriber-v1"

    async def transcribe(self, media_path: Path, probe: MediaProbe) -> TranscriptFixture:
        del media_path
        duration_ms = max(1, round(probe.duration_seconds * 1000))
        segment_end = min(duration_ms, 5000)
        text = "PasteScribe fake transcript fixture."
        return TranscriptFixture(
            language="en",
            model=self.model,
            text=text,
            segments=(
                TranscriptSegment(
                    position=0,
                    start_ms=0,
                    end_ms=segment_end,
                    text=text,
                ),
            ),
        )
