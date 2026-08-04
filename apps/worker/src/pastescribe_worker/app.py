from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast

from fastapi import FastAPI

from .config import WorkerConfig
from .ffmpeg import FfmpegRunner
from .observability import configure_logging
from .orchestrator import WorkerOrchestrator
from .provider import FakeTranscriptionProvider
from .runtime import WorkerRuntime
from .storage import create_media_storage
from .supabase import SupabaseJobRepository

configure_logging()
config = WorkerConfig.from_env()
media_runner = FfmpegRunner(config)
provider = FakeTranscriptionProvider()
runtime = WorkerRuntime(config, media_runner, provider)
worker_loop_task: asyncio.Task[None] | None = None


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    global worker_loop_task
    repository: SupabaseJobRepository | None = None

    if config.autostart:
        repository = SupabaseJobRepository(
            cast(str, config.supabase_url),
            cast(str, config.supabase_service_role_key),
            config.worker_id,
            config.lease_seconds,
        )
        orchestrator = WorkerOrchestrator(
            config,
            runtime,
            repository,
            create_media_storage(config),
            media_runner,
            provider,
        )
        worker_loop_task = asyncio.create_task(orchestrator.run_forever())

    try:
        yield
    finally:
        runtime.request_shutdown()
        if worker_loop_task is not None:
            await worker_loop_task
            worker_loop_task = None
        if repository is not None:
            await repository.close()


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
        "workerLoopRunning": worker_loop_task is not None and not worker_loop_task.done(),
    }
