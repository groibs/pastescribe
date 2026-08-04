from __future__ import annotations

import asyncio
import json
from datetime import date

import httpx

from pastescribe_worker.models import CostEstimate, JobState
from pastescribe_worker.supabase import SupabaseJobRepository


def _job_payload(state: str = "acquiring_media") -> dict[str, object]:
    return {
        "id": "job-1",
        "workspace_id": "workspace-1",
        "created_by": "user-1",
        "source_kind": "upload",
        "state": state,
        "media_asset_id": "asset-1",
        "source_url": None,
        "retry_count": 0,
        "max_retries": 3,
        "duration_seconds": None,
        "budget_reservation_id": None,
        "cancel_requested_at": None,
    }


def test_claim_asset_and_budget_rpc_contracts() -> None:
    requests: list[tuple[str, object]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content) if request.content else None
        requests.append((request.url.path, payload))
        if request.url.path.endswith("/rpc/claim_next_job"):
            return httpx.Response(200, json=_job_payload())
        if request.url.path.endswith("/media_assets"):
            assert request.url.params["id"] == "eq.asset-1"
            assert request.url.params["workspace_id"] == "eq.workspace-1"
            return httpx.Response(
                200,
                json=[
                    {
                        "id": "asset-1",
                        "storage_key": "uploads/workspace-1/input.mp4",
                        "status": "validated",
                        "actual_size_bytes": 1024,
                        "actual_content_type": "video/mp4",
                        "workspace_id": "workspace-1",
                    }
                ],
            )
        if request.url.path.endswith("/rpc/reserve_job_budget"):
            reserved = _job_payload("transcribing")
            reserved["duration_seconds"] = 120
            reserved["budget_reservation_id"] = "reservation-1"
            return httpx.Response(200, json=reserved)
        raise AssertionError(f"unexpected request: {request.url}")

    async def scenario() -> None:
        client = httpx.AsyncClient(
            base_url="https://project.supabase.co/rest/v1/",
            transport=httpx.MockTransport(handler),
            headers={"apikey": "service-role", "authorization": "Bearer service-role"},
        )
        repository = SupabaseJobRepository(
            "https://project.supabase.co",
            "service-role",
            "worker-1",
            300,
            client=client,
        )
        job = await repository.claim_next_job()
        assert job is not None
        assert job.state is JobState.ACQUIRING_MEDIA
        asset = await repository.get_media_asset(job)
        assert asset.storage_key == "uploads/workspace-1/input.mp4"
        reserved = await repository.reserve_job_budget(
            job.id,
            CostEstimate(120, 6000, 9000, 5),
            date(2026, 8, 1),
            date(2026, 8, 31),
            "user:user-1",
            "free_ai",
        )
        assert reserved.state is JobState.TRANSCRIBING
        await client.aclose()

    asyncio.run(scenario())
    claim_payload = requests[0][1]
    assert isinstance(claim_payload, dict)
    assert claim_payload["p_worker_id"] == "worker-1"
    reserve_payload = requests[2][1]
    assert isinstance(reserve_payload, dict)
    assert reserve_payload["p_estimated_cost_cents_brl"] == 5
    assert reserve_payload["p_idempotency_key"] == "transcription-budget:job-1"


def test_rpc_failure_is_reduced_to_stable_error_code() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"message": "database detail must not escape"})

    async def scenario() -> None:
        client = httpx.AsyncClient(
            base_url="https://project.supabase.co/rest/v1/",
            transport=httpx.MockTransport(handler),
        )
        repository = SupabaseJobRepository(
            "https://project.supabase.co",
            "service-role",
            "worker-1",
            300,
            client=client,
        )
        try:
            await repository.claim_next_job()
        except RuntimeError as error:
            assert str(error) == "rpc_claim_next_job_failed"
        else:
            raise AssertionError("expected repository failure")
        await client.aclose()

    asyncio.run(scenario())
