from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI

from .config import WorkerConfig
from .ffmpeg import FfmpegRunner
from .observability import configure_logging
from .provider import FakeTranscriptionProvider
from .runtime import WorkerRuntime

configure_logging()
config = WorkerConfig.from_env()
runtime = WorkerRuntime(config, FfmpegRunner(config), FakeTranscriptionProvider())


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        yield
    finally:
        runtime.request_shutdown()


app = FastAPI(title="PasteScribe Worker", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "workerId": config.worker_id,
        "activeOperation": runtime.state.active_operation,
        "operationsCompleted": runtime.state.operations_completed,
        "lastErrorCode": runtime.state.last_error_code,
    }


@app.get("/ready")
async def ready() -> dict[str, Any]:
    return {
        "status": "ready",
        "ffprobe": config.ffprobe_binary,
        "ffmpeg": config.ffmpeg_binary,
        "autostart": config.autostart,
        "supabaseConfigured": config.supabase_configured,
        "storageProvider": config.storage_provider,
    }
