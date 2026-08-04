from __future__ import annotations

from datetime import date
from typing import Final, cast

import httpx

from .models import CostEstimate, JobState, MediaAsset, TranscriptionJob

JsonObject = dict[str, object]


class SupabaseRepositoryError(RuntimeError):
    def __init__(self, code: str, status_code: int | None = None) -> None:
        super().__init__(code)
        self.code = code
        self.status_code = status_code


def _required_str(payload: JsonObject, key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value:
        raise SupabaseRepositoryError(f"invalid_{key}")
    return value


def _optional_str(payload: JsonObject, key: str) -> str | None:
    value = payload.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise SupabaseRepositoryError(f"invalid_{key}")
    return value


def _required_int(payload: JsonObject, key: str) -> int:
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, int):
        raise SupabaseRepositoryError(f"invalid_{key}")
    return value


def _optional_int(payload: JsonObject, key: str) -> int | None:
    value = payload.get(key)
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise SupabaseRepositoryError(f"invalid_{key}")
    return value


def _as_object(value: object, code: str) -> JsonObject:
    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise SupabaseRepositoryError(code)
    return cast(JsonObject, value)


def _parse_job(value: object) -> TranscriptionJob:
    payload = _as_object(value, "invalid_job_payload")
    raw_state = _required_str(payload, "state")
    try:
        state = JobState(raw_state)
    except ValueError as error:
        raise SupabaseRepositoryError("invalid_job_state") from error
    return TranscriptionJob(
        id=_required_str(payload, "id"),
        workspace_id=_required_str(payload, "workspace_id"),
        created_by=_required_str(payload, "created_by"),
        source_kind=_required_str(payload, "source_kind"),
        state=state,
        media_asset_id=_optional_str(payload, "media_asset_id"),
        source_url=_optional_str(payload, "source_url"),
        retry_count=_required_int(payload, "retry_count"),
        max_retries=_required_int(payload, "max_retries"),
        duration_seconds=_optional_int(payload, "duration_seconds"),
        budget_reservation_id=_optional_str(payload, "budget_reservation_id"),
        cancel_requested_at=_optional_str(payload, "cancel_requested_at"),
    )


def _parse_media_asset(value: object) -> MediaAsset:
    payload = _as_object(value, "invalid_media_asset_payload")
    return MediaAsset(
        id=_required_str(payload, "id"),
        storage_key=_required_str(payload, "storage_key"),
        status=_required_str(payload, "status"),
        size_bytes=_optional_int(payload, "actual_size_bytes"),
        content_type=_optional_str(payload, "actual_content_type"),
    )


class SupabaseJobRepository:
    _SELECT_ASSET: Final = (
        "id,storage_key,status,actual_size_bytes,actual_content_type,workspace_id"
    )

    def __init__(
        self,
        base_url: str,
        service_role_key: str,
        worker_id: str,
        lease_seconds: int,
        *,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.worker_id = worker_id
        self.lease_seconds = lease_seconds
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=base_url.rstrip("/") + "/rest/v1/",
            timeout=httpx.Timeout(30.0),
            headers={
                "apikey": service_role_key,
                "authorization": f"Bearer {service_role_key}",
                "content-type": "application/json",
            },
        )

    async def close(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def _rpc(self, function_name: str, payload: JsonObject) -> object:
        response = await self._client.post(f"rpc/{function_name}", json=payload)
        if response.is_error:
            raise SupabaseRepositoryError(
                f"rpc_{function_name}_failed",
                response.status_code,
            )
        try:
            return cast(object, response.json())
        except ValueError as error:
            raise SupabaseRepositoryError(f"rpc_{function_name}_invalid_json") from error

    async def claim_next_job(self) -> TranscriptionJob | None:
        value = await self._rpc(
            "claim_next_job",
            {
                "p_worker_id": self.worker_id,
                "p_capabilities": ["upload", "ffprobe", "fake_transcription"],
                "p_lease_seconds": self.lease_seconds,
            },
        )
        return None if value is None else _parse_job(value)

    async def heartbeat_job(self, job_id: str) -> TranscriptionJob:
        value = await self._rpc(
            "heartbeat_job",
            {
                "p_job_id": job_id,
                "p_worker_id": self.worker_id,
                "p_lease_seconds": self.lease_seconds,
            },
        )
        return _parse_job(value)

    async def get_media_asset(self, job: TranscriptionJob) -> MediaAsset:
        if job.media_asset_id is None:
            raise SupabaseRepositoryError("job_has_no_media_asset")
        response = await self._client.get(
            "media_assets",
            params={
                "id": f"eq.{job.media_asset_id}",
                "workspace_id": f"eq.{job.workspace_id}",
                "status": "eq.validated",
                "select": self._SELECT_ASSET,
                "limit": "1",
            },
        )
        if response.is_error:
            raise SupabaseRepositoryError("media_asset_query_failed", response.status_code)
        try:
            value = cast(object, response.json())
        except ValueError as error:
            raise SupabaseRepositoryError("media_asset_invalid_json") from error
        if not isinstance(value, list) or len(value) != 1:
            raise SupabaseRepositoryError("media_asset_not_found")
        return _parse_media_asset(value[0])

    async def reserve_job_budget(
        self,
        job_id: str,
        estimate: CostEstimate,
        period_start: date,
        period_end: date,
        identity_key: str,
        envelope: str,
    ) -> TranscriptionJob:
        value = await self._rpc(
            "reserve_job_budget",
            {
                "p_job_id": job_id,
                "p_worker_id": self.worker_id,
                "p_duration_seconds": estimate.duration_seconds,
                "p_envelope": envelope,
                "p_period_start": period_start.isoformat(),
                "p_period_end": period_end.isoformat(),
                "p_identity_key": identity_key,
                "p_estimated_cost_cents_brl": estimate.reserved_cost_cents_brl,
                "p_idempotency_key": f"transcription-budget:{job_id}",
            },
        )
        return _parse_job(value)

    async def advance_job_step(
        self,
        job_id: str,
        to_state: JobState,
        detail: str | None = None,
    ) -> TranscriptionJob:
        value = await self._rpc(
            "advance_job_step",
            {
                "p_job_id": job_id,
                "p_worker_id": self.worker_id,
                "p_to_state": to_state.value,
                "p_detail": detail,
            },
        )
        return _parse_job(value)

    async def complete_job(
        self,
        job_id: str,
        model: str,
        estimate: CostEstimate,
        actual_cost_micros_usd: int = 0,
        actual_cost_cents_brl: int = 0,
    ) -> TranscriptionJob:
        value = await self._rpc(
            "complete_job",
            {
                "p_job_id": job_id,
                "p_worker_id": self.worker_id,
                "p_model": model,
                "p_seconds_processed": estimate.duration_seconds,
                "p_actual_cost_cents_brl": actual_cost_cents_brl,
                "p_estimated_cost_micros_usd": estimate.estimated_cost_micros_usd,
                "p_actual_cost_micros_usd": actual_cost_micros_usd,
            },
        )
        return _parse_job(value)

    async def fail_job(
        self,
        job_id: str,
        error_code: str,
        error_detail: str | None = None,
    ) -> TranscriptionJob:
        value = await self._rpc(
            "fail_job",
            {
                "p_job_id": job_id,
                "p_worker_id": self.worker_id,
                "p_error_code": error_code,
                "p_error_detail": error_detail,
            },
        )
        return _parse_job(value)
