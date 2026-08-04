from __future__ import annotations

import asyncio
from dataclasses import replace
from datetime import date
from pathlib import Path

from pastescribe_worker.config import WorkerConfig
from pastescribe_worker.models import (
    AcquiredMedia,
    CostEstimate,
    JobState,
    MediaAsset,
    MediaProbe,
    TranscriptFixture,
    TranscriptionJob,
    TranscriptSegment,
)
from pastescribe_worker.orchestrator import WorkerOrchestrator
from pastescribe_worker.runtime import WorkerRuntime


def _job(state: JobState = JobState.ACQUIRING_MEDIA) -> TranscriptionJob:
    return TranscriptionJob(
        id="job-1",
        workspace_id="workspace-1",
        created_by="user-1",
        source_kind="upload",
        state=state,
        media_asset_id="asset-1",
        source_url=None,
        retry_count=0,
        max_retries=3,
    )


def _transcript() -> TranscriptFixture:
    return TranscriptFixture(
        language="en",
        model="fake-transcriber-v1",
        text="Fixture transcript.",
        segments=(TranscriptSegment(0, 0, 1000, "Fixture transcript."),),
    )


class FakeRunner:
    async def probe(self, media_path: Path) -> MediaProbe:
        assert media_path.exists()
        return MediaProbe(2.0, media_path.stat().st_size, "mp4", "h264", "aac", 320, 180, 30.0)

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


class FakeStorage:
    async def acquire(
        self,
        asset: MediaAsset,
        destination: Path,
        max_bytes: int,
    ) -> AcquiredMedia:
        assert asset.id == "asset-1"
        assert max_bytes > 6
        destination.write_bytes(b"media!")
        return AcquiredMedia(destination, 6)


class FakeProvider:
    def __init__(self, block: bool = False) -> None:
        self.called = False
        self._block = block
        self._release = asyncio.Event()

    async def transcribe(self, media_path: Path, probe: MediaProbe) -> TranscriptFixture:
        self.called = True
        assert media_path.exists()
        assert probe.duration_seconds == 2.0
        if self._block:
            await self._release.wait()
        return _transcript()


class FakeRepository:
    def __init__(
        self,
        *,
        reserve_state: JobState = JobState.TRANSCRIBING,
        heartbeat_state: JobState = JobState.ACQUIRING_MEDIA,
    ) -> None:
        self.reserve_state = reserve_state
        self.heartbeat_state = heartbeat_state
        self.complete_called = False
        self.cancel_called = False
        self.fail_code: str | None = None
        self.advance_states: list[JobState] = []
        self.claimed = False

    async def claim_next_job(self) -> TranscriptionJob | None:
        if self.claimed:
            return None
        self.claimed = True
        return _job()

    async def heartbeat_job(self, job_id: str) -> TranscriptionJob:
        assert job_id == "job-1"
        return _job(self.heartbeat_state)

    async def get_media_asset(self, job: TranscriptionJob) -> MediaAsset:
        assert job.id == "job-1"
        return MediaAsset("asset-1", "uploads/input.mp4", "validated", 6, "video/mp4")

    async def reserve_job_budget(
        self,
        job_id: str,
        estimate: CostEstimate,
        period_start: date,
        period_end: date,
        identity_key: str,
        envelope: str,
    ) -> TranscriptionJob:
        assert job_id == "job-1"
        assert estimate.duration_seconds == 2
        assert period_start <= period_end
        assert identity_key == "user:user-1"
        assert envelope == "free_ai"
        return _job(self.reserve_state)

    async def advance_job_step(
        self,
        job_id: str,
        to_state: JobState,
        detail: str | None = None,
    ) -> TranscriptionJob:
        del detail
        assert job_id == "job-1"
        self.advance_states.append(to_state)
        return _job(to_state)

    async def complete_transcription_job(
        self,
        job_id: str,
        transcript: TranscriptFixture,
        estimate: CostEstimate,
        actual_cost_micros_usd: int = 0,
        actual_cost_cents_brl: int = 0,
    ) -> TranscriptionJob:
        assert job_id == "job-1"
        assert transcript.text == "Fixture transcript."
        assert estimate.duration_seconds == 2
        assert actual_cost_micros_usd == 0
        assert actual_cost_cents_brl == 0
        self.complete_called = True
        return _job(JobState.COMPLETED)

    async def cancel_job(self, job_id: str, detail: str | None = None) -> TranscriptionJob:
        del detail
        assert job_id == "job-1"
        self.cancel_called = True
        return _job(JobState.CANCELLED)

    async def fail_job(
        self,
        job_id: str,
        error_code: str,
        error_detail: str | None = None,
    ) -> TranscriptionJob:
        del error_detail
        assert job_id == "job-1"
        self.fail_code = error_code
        return _job(JobState.QUEUED)


def _orchestrator(
    tmp_path: Path,
    repository: FakeRepository,
    provider: FakeProvider,
) -> tuple[WorkerOrchestrator, WorkerRuntime]:
    config = replace(
        WorkerConfig.from_env(),
        temp_root=tmp_path / "operations",
        heartbeat_interval_seconds=0.01,
        lease_seconds=10,
        job_timeout_seconds=5,
    )
    runner = FakeRunner()
    runtime = WorkerRuntime(config, runner, provider)
    return (
        WorkerOrchestrator(
            config,
            runtime,
            repository,
            FakeStorage(),
            runner,
            provider,
        ),
        runtime,
    )


def test_successful_job_persists_before_completion(tmp_path: Path) -> None:
    repository = FakeRepository()
    provider = FakeProvider()
    orchestrator, runtime = _orchestrator(tmp_path, repository, provider)
    result = asyncio.run(orchestrator.process_once())
    assert result is not None and result.state is JobState.COMPLETED
    assert repository.advance_states == [JobState.POSTPROCESSING]
    assert repository.complete_called is True
    assert runtime.state.operations_completed == 1
    assert list(runtime.config.temp_root.iterdir()) == []


def test_budget_gate_stops_before_provider(tmp_path: Path) -> None:
    repository = FakeRepository(reserve_state=JobState.AWAITING_USER_CONFIRMATION)
    provider = FakeProvider()
    orchestrator, _ = _orchestrator(tmp_path, repository, provider)
    result = asyncio.run(orchestrator.process_once())
    assert result is not None and result.state is JobState.AWAITING_USER_CONFIRMATION
    assert provider.called is False
    assert repository.complete_called is False


def test_heartbeat_cancellation_interrupts_safe_stage(tmp_path: Path) -> None:
    repository = FakeRepository(heartbeat_state=JobState.CANCEL_REQUESTED)
    provider = FakeProvider(block=True)
    orchestrator, _ = _orchestrator(tmp_path, repository, provider)
    result = asyncio.run(orchestrator.process_once())
    assert result is not None and result.state is JobState.CANCELLED
    assert provider.called is True
    assert repository.cancel_called is True
    assert repository.complete_called is False


def test_internal_failure_returns_job_to_retry_queue(tmp_path: Path) -> None:
    class BrokenRunner(FakeRunner):
        async def probe(self, media_path: Path) -> MediaProbe:
            del media_path
            raise RuntimeError("private detail")

    repository = FakeRepository()
    provider = FakeProvider()
    config = replace(
        WorkerConfig.from_env(),
        temp_root=tmp_path / "operations",
        heartbeat_interval_seconds=0.01,
        lease_seconds=10,
        job_timeout_seconds=5,
    )
    runner = BrokenRunner()
    runtime = WorkerRuntime(config, runner, provider)
    orchestrator = WorkerOrchestrator(
        config,
        runtime,
        repository,
        FakeStorage(),
        runner,
        provider,
    )
    result = asyncio.run(orchestrator.process_once())
    assert result is not None and result.state is JobState.QUEUED
    assert repository.fail_code == "internal_worker_error"
    assert runtime.state.last_error_code == "internal_worker_error"
