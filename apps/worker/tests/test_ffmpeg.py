from __future__ import annotations

import asyncio
import shutil
from dataclasses import replace
from pathlib import Path

import pytest

from pastescribe_worker.config import WorkerConfig
from pastescribe_worker.ffmpeg import FfmpegRunner, MediaProcessingError


def _config(tmp_path: Path) -> WorkerConfig:
    return replace(
        WorkerConfig.from_env(),
        temp_root=tmp_path / "temp",
        max_duration_seconds=30,
        ffprobe_timeout_seconds=10,
        ffmpeg_timeout_seconds=20,
    )


async def _create_sample(runner: FfmpegRunner, output: Path) -> None:
    await runner._run(
        runner._config.ffmpeg_binary,
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:s=320x180:d=1",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=1",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        str(output),
        timeout_seconds=20,
    )


@pytest.mark.skipif(
    not shutil.which("ffmpeg") or not shutil.which("ffprobe"),
    reason="ffmpeg missing",
)
def test_probe_and_caption_fixture(tmp_path: Path) -> None:
    async def scenario() -> None:
        runner = FfmpegRunner(_config(tmp_path))
        media = tmp_path / "sample.mp4"
        await _create_sample(runner, media)
        probe = await runner.probe(media)
        assert 0.8 <= probe.duration_seconds <= 1.2
        assert probe.video_codec == "h264"
        assert probe.audio_codec == "aac"
        assert probe.width == 320
        assert probe.height == 180

        subtitles = tmp_path / "fixture.srt"
        subtitles.write_text(
            "1\n00:00:00,000 --> 00:00:00,800\nFixture caption\n",
            encoding="utf-8",
        )
        output = tmp_path / "captioned.mp4"
        await runner.burn_subtitles_fixture(media, subtitles, output, max_seconds=1)
        assert output.stat().st_size > 0

    asyncio.run(scenario())


@pytest.mark.skipif(not shutil.which("ffprobe"), reason="ffprobe missing")
def test_rejects_corrupt_media(tmp_path: Path) -> None:
    corrupt = tmp_path / "corrupt.mp4"
    corrupt.write_bytes(b"not a media container")
    runner = FfmpegRunner(_config(tmp_path))
    with pytest.raises(MediaProcessingError, match="Invalid data"):
        asyncio.run(runner.probe(corrupt))
