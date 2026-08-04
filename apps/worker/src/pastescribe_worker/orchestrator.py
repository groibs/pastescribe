from __future__ import annotations

import asyncio
import logging
import shutil
import tempfile
import time
from collections.abc import Awaitable
from contextlib import suppress
from pathlib import Path
from typing import TypeVar

from .config import WorkerConfig
from .costs import current_month_window, estimate_transcription_cost
from .models import JobState, TranscriptionJob
from .observability import log_event
from .ports import JobRepository, MediaRunner, MediaStorage, TranscriptionProvider
from .runtime import WorkerRuntime

logger = logging.getLogger(__name__)
T = TypeVar("T")


class JobCancellationRequested(RuntimeError):
    pass


class WorkerPipelineError(RuntimeError):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def _error_code(error: BaseException) -> str:
    code = getattr(error, "code", None)
    if isinstance(code, str) and code:
        return code
    if isinstance(error, TimeoutError):
        return "job_timeout"
    return "internal_worker_error"


class WorkerOrchestrator:
    def __init__(
        self,
        config: WorkerConfig,
        runtime: WorkerRuntime,
        repository: JobRepository,
        storage: MediaStorage,
        media_runner: MediaRunner,
        provider: TranscriptionProvider,
    ) -> None:
        self._config = config
        self._runtime = runtime
        self._repository = repository
        self._storage = storage
        self._media_runner = media_runner
        self._provider = provider

    async def run_forever(self) -> None:
        while not self._runtime.shutdown_requested:
            try:
                job = await self.process_once()
            except Exception as error:
                self._runtime.state.last_error_code = _error_code(error)
                log_event(
                    logger,
                    "worker_poll_failed",
                    error_code=_error_code(error),
                    error_type=type(error).__name__,
                )
                job = None

            if job is None and not self._runtime.shutdown_requested:
                try:
                    await asyncio.wait_for(
                        self._runtime.wait_for_shutdown(),
                        timeout=self._config.poll_interval_seconds,
                    )
                except TimeoutError:
                    pass

    async def process_once(self) -> TranscriptionJob | None:
        job = await self._repository.claim_next_job()
        if job is None:
            return None

        self._runtime.state.active_operation = job.id
        control_event = asyncio.Event()
        cancel_requested = asyncio.Event()
        heartbeat_errors: list[Exception] = []
        heartbeat_task = asyncio.create_task(
            self._heartbeat(job.id, control_event, cancel_requested, heartbeat_errors)
        )

        try:
            result = await self._process_claimed_job(
                job,
                control_event,
                cancel_requested,
                heartbeat_errors,
            )
            if result.state is JobState.COMPLETED:
                self._runtime.state.operations_completed += 1
                self._runtime.state.last_error_code = None
            return result
        except JobCancellationRequested:
            cancelled = await self._repository.cancel_job(
                job.id,
                "cancelamento confirmado pelo heartbeat",
            )
            self._runtime.state.last_error_code = None
            log_event(logger, "worker_job_cancelled", job_id=job.id)
            return cancelled
        except Exception as error:
            error_code = _error_code(error)
            self._runtime.state.last_error_code = error_code
            log_event(
                logger,
                "worker_job_failed",
                job_id=job.id,
                error_code=error_code,
                error_type=type(error).__name__,
            )
            try:
                return await self._repository.fail_job(
                    job.id,
                    error_code,
                    type(error).__name__,
                )
            except Exception as fail_error:
                log_event(
                    logger,
                    "worker_fail_transition_failed",
                    job_id=job.id,
                    error_code=_error_code(fail_error),
                    error_type=type(fail_error).__name__,
                )
                raise
        finally:
            control_event.set()
            heartbeat_task.cancel()
            with suppress(asyncio.CancelledError):
                await heartbeat_task
            self._runtime.state.active_operation = None

    async def _heartbeat(
        self,
        job_id: str,
        control_event: asyncio.Event,
        cancel_requested: asyncio.Event,
        heartbeat_errors: list[Exception],
    ) -> None:
        while not control_event.is_set():
            await asyncio.sleep(self._config.heartbeat_interval_seconds)
            if control_event.is_set():
                return
            try:
                job = await self._repository.heartbeat_job(job_id)
            except Exception as error:
                heartbeat_errors.append(error)
                control_event.set()
                return
            if job.state is JobState.CANCEL_REQUESTED:
                cancel_requested.set()
                control_event.set()
                return

    @staticmethod
    def _raise_control(
        cancel_requested: asyncio.Event,
        heartbeat_errors: list[Exception],
    ) -> None:
        if heartbeat_errors:
            raise heartbeat_errors[0]
        if cancel_requested.is_set():
            raise JobCancellationRequested()

    async def _await_controlled(
        self,
        awaitable: Awaitable[T],
        control_event: asyncio.Event,
        cancel_requested: asyncio.Event,
        heartbeat_errors: list[Exception],
        timeout_seconds: float,
    ) -> T:
        self._raise_control(cancel_requested, heartbeat_errors)
        if timeout_seconds <= 0:
            raise TimeoutError("job deadline exceeded")

        operation = asyncio.create_task(awaitable)
        control = asyncio.create_task(control_event.wait())
        done, _ = await asyncio.wait(
            {operation, control},
            timeout=timeout_seconds,
            return_when=asyncio.FIRST_COMPLETED,
        )

        if operation in done:
            control.cancel()
            with suppress(asyncio.CancelledError):
                await control
            return await operation

        operation.cancel()
        with suppress(asyncio.CancelledError):
            await operation
        control.cancel()
        with suppress(asyncio.CancelledError):
            await control

        if control_event.is_set():
            self._raise_control(cancel_requested, heartbeat_errors)
        raise TimeoutError("job stage timed out")

    async def _process_claimed_job(
        self,
        job: TranscriptionJob,
        control_event: asyncio.Event,
        cancel_requested: asyncio.Event,
        heartbeat_errors: list[Exception],
    ) -> TranscriptionJob:
        if job.source_kind != "upload":
            raise WorkerPipelineError("unsupported_source_kind")

        deadline = time.monotonic() + self._config.job_timeout_seconds
        self._config.temp_root.mkdir(parents=True, exist_ok=True)
        operation_dir = Path(
            tempfile.mkdtemp(prefix=f"job-{job.id}-", dir=self._config.temp_root)
        )
        media_path = operation_dir / "input.media"

        try:
            asset = await self._await_controlled(
                self._repository.get_media_asset(job),
                control_event,
                cancel_requested,
                heartbeat_errors,
                self._remaining(deadline),
            )

            acquired = await self._storage.acquire(
                asset,
                media_path,
                self._config.max_input_bytes,
            )
            self._raise_control(cancel_requested, heartbeat_errors)
            if time.monotonic() >= deadline:
                raise TimeoutError("job deadline exceeded after media acquisition")

            probe = await self._await_controlled(
                self._media_runner.probe(acquired.path),
                control_event,
                cancel_requested,
                heartbeat_errors,
                self._remaining(deadline),
            )
            estimate = estimate_transcription_cost(probe, self._config)
            period_start, period_end = current_month_window()

            reserved_job = await self._await_controlled(
                self._repository.reserve_job_budget(
                    job.id,
                    estimate,
                    period_start,
                    period_end,
                    f"user:{job.created_by}",
                    self._config.budget_envelope,
                ),
                control_event,
                cancel_requested,
                heartbeat_errors,
                self._remaining(deadline),
            )
            if reserved_job.state is JobState.AWAITING_USER_CONFIRMATION:
                log_event(
                    logger,
                    "worker_job_awaiting_confirmation",
                    job_id=job.id,
                    duration_seconds=estimate.duration_seconds,
                )
                return reserved_job
            if reserved_job.state is not JobState.TRANSCRIBING:
                raise WorkerPipelineError("unexpected_state_after_budget")

            transcript = await self._await_controlled(
                self._provider.transcribe(acquired.path, probe),
                control_event,
                cancel_requested,
                heartbeat_errors,
                self._remaining(deadline),
            )
            await self._await_controlled(
                self._repository.advance_job_step(
                    job.id,
                    JobState.POSTPROCESSING,
                    "provider fake concluído",
                ),
                control_event,
                cancel_requested,
                heartbeat_errors,
                self._remaining(deadline),
            )
            completed = await self._await_controlled(
                self._repository.complete_transcription_job(
                    job.id,
                    transcript,
                    estimate,
                ),
                control_event,
                cancel_requested,
                heartbeat_errors,
                self._remaining(deadline),
            )
            log_event(
                logger,
                "worker_job_completed",
                job_id=job.id,
                duration_seconds=estimate.duration_seconds,
                bytes=acquired.bytes_downloaded,
                model=transcript.model,
            )
            return completed
        finally:
            await asyncio.to_thread(shutil.rmtree, operation_dir, True)

    @staticmethod
    def _remaining(deadline: float) -> float:
        return deadline - time.monotonic()
