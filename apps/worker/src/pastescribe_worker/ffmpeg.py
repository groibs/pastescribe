from __future__ import annotations

import asyncio
import json
import math
import os
import resource
import signal
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

from .config import WorkerConfig
from .models import MediaProbe


class MediaProcessingError(RuntimeError):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class ProcessOutput:
    stdout: bytes
    stderr: bytes
    wall_time_seconds: float


def _parse_rate(raw: str | None) -> float | None:
    if not raw or raw in {"0/0", "N/A"}:
        return None
    if "/" in raw:
        numerator, denominator = raw.split("/", 1)
        denominator_value = float(denominator)
        if denominator_value == 0:
            return None
        return float(numerator) / denominator_value
    return float(raw)


def _limit_child_resources(config: WorkerConfig) -> None:
    resource.setrlimit(resource.RLIMIT_CPU, (config.max_cpu_seconds, config.max_cpu_seconds))
    resource.setrlimit(resource.RLIMIT_AS, (config.max_memory_bytes, config.max_memory_bytes))
    resource.setrlimit(resource.RLIMIT_FSIZE, (config.max_output_bytes, config.max_output_bytes))
    os.setsid()


class FfmpegRunner:
    def __init__(self, config: WorkerConfig) -> None:
        self._config = config

    async def _run(self, *args: str, timeout_seconds: float) -> ProcessOutput:
        started = time.monotonic()
        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            preexec_fn=lambda: _limit_child_resources(self._config),
        )
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout_seconds)
        except TimeoutError as error:
            self._kill_process_group(process)
            await process.wait()
            raise MediaProcessingError("media_timeout", f"command timed out: {args[0]}") from error
        except asyncio.CancelledError:
            self._kill_process_group(process)
            await process.wait()
            raise

        wall_time = time.monotonic() - started
        if process.returncode != 0:
            detail = stderr.decode("utf-8", errors="replace")[-2000:]
            raise MediaProcessingError("media_command_failed", detail)
        return ProcessOutput(stdout=stdout, stderr=stderr, wall_time_seconds=wall_time)

    @staticmethod
    def _kill_process_group(process: asyncio.subprocess.Process) -> None:
        if process.returncode is not None:
            return
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            return

    async def probe(self, media_path: Path) -> MediaProbe:
        output = await self._run(
            self._config.ffprobe_binary,
            "-v",
            "error",
            "-show_entries",
            "format=duration,size,format_name:stream=codec_type,codec_name,width,height,avg_frame_rate,r_frame_rate",
            "-of",
            "json",
            str(media_path),
            timeout_seconds=self._config.ffprobe_timeout_seconds,
        )
        try:
            payload = cast(dict[str, Any], json.loads(output.stdout))
        except json.JSONDecodeError as error:
            raise MediaProcessingError("invalid_probe_output", "ffprobe returned invalid JSON") from error

        raw_format = payload.get("format")
        format_data = raw_format if isinstance(raw_format, dict) else {}
        raw_streams = payload.get("streams")
        streams = (
            [item for item in raw_streams if isinstance(item, dict)]
            if isinstance(raw_streams, list)
            else []
        )
        try:
            duration = float(format_data["duration"])
            size_bytes = int(format_data.get("size") or media_path.stat().st_size)
        except (KeyError, TypeError, ValueError) as error:
            raise MediaProcessingError("invalid_media_metadata", "missing duration or size") from error
        if not math.isfinite(duration) or duration <= 0:
            raise MediaProcessingError("invalid_media_duration", "duration must be finite and positive")
        if duration > self._config.max_duration_seconds:
            raise MediaProcessingError("duration_exceeded", "media duration exceeds worker limit")
        if size_bytes > self._config.max_input_bytes:
            raise MediaProcessingError("size_exceeded", "media size exceeds worker limit")

        video_stream = next((item for item in streams if item.get("codec_type") == "video"), None)
        audio_stream = next((item for item in streams if item.get("codec_type") == "audio"), None)
        rate_raw = None
        if video_stream:
            candidate_rate = video_stream.get("avg_frame_rate") or video_stream.get("r_frame_rate")
            rate_raw = candidate_rate if isinstance(candidate_rate, str) else None

        video_codec = video_stream.get("codec_name") if video_stream else None
        audio_codec = audio_stream.get("codec_name") if audio_stream else None
        container_format = format_data.get("format_name")

        return MediaProbe(
            duration_seconds=duration,
            size_bytes=size_bytes,
            container_format=container_format if isinstance(container_format, str) else None,
            video_codec=video_codec if isinstance(video_codec, str) else None,
            audio_codec=audio_codec if isinstance(audio_codec, str) else None,
            width=int(video_stream["width"]) if video_stream and video_stream.get("width") else None,
            height=int(video_stream["height"]) if video_stream and video_stream.get("height") else None,
            frame_rate=_parse_rate(rate_raw),
        )

    async def burn_subtitles_fixture(
        self,
        media_path: Path,
        subtitles_path: Path,
        output_path: Path,
        *,
        max_seconds: float = 2.0,
    ) -> None:
        if max_seconds <= 0 or max_seconds > 15:
            raise ValueError("fixture render must be between 0 and 15 seconds")
        escaped_subtitles = str(subtitles_path).replace("\\", "\\\\").replace(":", "\\:")
        await self._run(
            self._config.ffmpeg_binary,
            "-y",
            "-t",
            f"{max_seconds:.3f}",
            "-i",
            str(media_path),
            "-vf",
            f"subtitles={escaped_subtitles}",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-c:a",
            "aac",
            str(output_path),
            timeout_seconds=self._config.ffmpeg_timeout_seconds,
        )
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise MediaProcessingError("missing_media_output", "ffmpeg did not produce an output")
