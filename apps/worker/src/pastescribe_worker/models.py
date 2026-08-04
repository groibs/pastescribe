from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path


class JobState(StrEnum):
    CREATED = "created"
    VALIDATING = "validating"
    AWAITING_USER_CONFIRMATION = "awaiting_user_confirmation"
    QUEUED = "queued"
    RESOLVING_METADATA = "resolving_metadata"
    FETCHING_CAPTIONS = "fetching_captions"
    ACQUIRING_MEDIA = "acquiring_media"
    EXTRACTING_AUDIO = "extracting_audio"
    NORMALIZING_AUDIO = "normalizing_audio"
    TRANSCRIBING = "transcribing"
    DIARIZING = "diarizing"
    POSTPROCESSING = "postprocessing"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCEL_REQUESTED = "cancel_requested"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


@dataclass(frozen=True, slots=True)
class TranscriptionJob:
    id: str
    workspace_id: str
    created_by: str
    source_kind: str
    state: JobState
    media_asset_id: str | None
    source_url: str | None
    retry_count: int
    max_retries: int
    duration_seconds: int | None = None
    budget_reservation_id: str | None = None
    cancel_requested_at: str | None = None


@dataclass(frozen=True, slots=True)
class MediaAsset:
    id: str
    storage_key: str
    status: str
    size_bytes: int | None
    content_type: str | None


@dataclass(frozen=True, slots=True)
class MediaProbe:
    duration_seconds: float
    size_bytes: int
    container_format: str | None
    video_codec: str | None
    audio_codec: str | None
    width: int | None
    height: int | None
    frame_rate: float | None


@dataclass(frozen=True, slots=True)
class TranscriptSegment:
    position: int
    start_ms: int
    end_ms: int
    text: str
    speaker_label: str | None = None


@dataclass(frozen=True, slots=True)
class TranscriptFixture:
    language: str
    model: str
    text: str
    segments: tuple[TranscriptSegment, ...]


@dataclass(frozen=True, slots=True)
class AcquiredMedia:
    path: Path
    bytes_downloaded: int


@dataclass(frozen=True, slots=True)
class CostEstimate:
    duration_seconds: int
    estimated_cost_micros_usd: int
    reserved_cost_micros_usd: int
    reserved_cost_cents_brl: int
