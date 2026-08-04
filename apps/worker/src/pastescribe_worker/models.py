from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path


class JobState(StrEnum):
    QUEUED = "queued"
    ACQUIRING_MEDIA = "acquiring_media"
    TRANSCRIBING = "transcribing"
    POSTPROCESSING = "postprocessing"
    INDEXING = "indexing"
    COMPLETED = "completed"
    AWAITING_USER_CONFIRMATION = "awaiting_user_confirmation"
    CANCEL_REQUESTED = "cancel_requested"
    CANCELLED = "cancelled"
    FAILED = "failed"


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
