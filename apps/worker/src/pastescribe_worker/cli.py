from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from .config import WorkerConfig
from .ffmpeg import FfmpegRunner
from .observability import configure_logging
from .provider import FakeTranscriptionProvider
from .runtime import WorkerRuntime


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PasteScribe worker utilities")
    parser.add_argument("media", nargs="?", type=Path, help="media file for a local fixture run")
    parser.add_argument("--operation-id", default="local-fixture")
    return parser


async def _run(media: Path, operation_id: str) -> int:
    config = WorkerConfig.from_env()
    runtime = WorkerRuntime(config, FfmpegRunner(config), FakeTranscriptionProvider())
    result = await runtime.prepare_fixture(media, operation_id)
    print(
        {
            "durationSeconds": round(result.probe.duration_seconds, 3),
            "segments": len(result.transcript.segments),
            "model": result.transcript.model,
        }
    )
    return 0


def main() -> None:
    configure_logging()
    args = build_parser().parse_args()
    if args.media is None:
        raise SystemExit("media path is required until the queue adapter lands in 4.2c-b")
    raise SystemExit(asyncio.run(_run(args.media, args.operation_id)))
