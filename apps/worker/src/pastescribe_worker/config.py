from __future__ import annotations

import os
import socket
from dataclasses import dataclass
from pathlib import Path


class ConfigurationError(ValueError):
    """Raised when worker configuration is internally inconsistent."""


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw in {"1", "true", "TRUE"}


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    return default if raw is None else int(raw)


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    return default if raw is None else float(raw)


def _env_optional(name: str) -> str | None:
    raw = os.getenv(name)
    return raw if raw else None


@dataclass(frozen=True, slots=True)
class WorkerConfig:
    worker_id: str
    autostart: bool
    poll_interval_seconds: float
    lease_seconds: int
    heartbeat_interval_seconds: float
    job_timeout_seconds: float
    ffprobe_timeout_seconds: float
    ffmpeg_timeout_seconds: float
    max_input_bytes: int
    max_output_bytes: int
    max_duration_seconds: int
    max_memory_bytes: int
    max_cpu_seconds: int
    temp_root: Path
    ffprobe_binary: str
    ffmpeg_binary: str
    supabase_url: str | None
    supabase_service_role_key: str | None
    storage_provider: str
    local_storage_root: Path
    s3_endpoint: str | None
    s3_bucket: str | None
    s3_region: str
    s3_access_key_id: str | None
    s3_secret_access_key: str | None
    transcription_cost_micros_usd_per_second: int
    reserve_factor_bps: int
    planning_brl_per_usd_millis: int
    budget_envelope: str

    @classmethod
    def from_env(cls) -> WorkerConfig:
        worker_id = os.getenv("WORKER_ID") or f"{socket.gethostname()}:{os.getpid()}"
        config = cls(
            worker_id=worker_id,
            autostart=_env_bool("WORKER_AUTOSTART", False),
            poll_interval_seconds=_env_float("WORKER_POLL_INTERVAL_SECONDS", 2.0),
            lease_seconds=_env_int("WORKER_LEASE_SECONDS", 300),
            heartbeat_interval_seconds=_env_float("WORKER_HEARTBEAT_INTERVAL_SECONDS", 30.0),
            job_timeout_seconds=_env_float("WORKER_JOB_TIMEOUT_SECONDS", 900.0),
            ffprobe_timeout_seconds=_env_float("WORKER_FFPROBE_TIMEOUT_SECONDS", 30.0),
            ffmpeg_timeout_seconds=_env_float("WORKER_FFMPEG_TIMEOUT_SECONDS", 120.0),
            max_input_bytes=_env_int("WORKER_MAX_INPUT_BYTES", 2 * 1024**3),
            max_output_bytes=_env_int("WORKER_MAX_OUTPUT_BYTES", 2 * 1024**3),
            max_duration_seconds=_env_int("WORKER_MAX_DURATION_SECONDS", 4 * 60 * 60),
            max_memory_bytes=_env_int("WORKER_MAX_MEMORY_BYTES", 2 * 1024**3),
            max_cpu_seconds=_env_int("WORKER_MAX_CPU_SECONDS", 600),
            temp_root=Path(os.getenv("WORKER_TEMP_ROOT", "/tmp/pastescribe-worker")),
            ffprobe_binary=os.getenv("FFPROBE_BINARY", "ffprobe"),
            ffmpeg_binary=os.getenv("FFMPEG_BINARY", "ffmpeg"),
            supabase_url=_env_optional("NEXT_PUBLIC_SUPABASE_URL"),
            supabase_service_role_key=_env_optional("SUPABASE_SERVICE_ROLE_KEY"),
            storage_provider=os.getenv("STORAGE_PROVIDER", "local"),
            local_storage_root=Path(os.getenv("LOCAL_STORAGE_ROOT", ".local-storage")),
            s3_endpoint=_env_optional("S3_ENDPOINT"),
            s3_bucket=_env_optional("S3_BUCKET"),
            s3_region=os.getenv("S3_REGION", "auto"),
            s3_access_key_id=_env_optional("S3_ACCESS_KEY_ID"),
            s3_secret_access_key=_env_optional("S3_SECRET_ACCESS_KEY"),
            transcription_cost_micros_usd_per_second=_env_int(
                "WORKER_TRANSCRIPTION_COST_MICROS_USD_PER_SECOND",
                50,
            ),
            reserve_factor_bps=_env_int("WORKER_RESERVE_FACTOR_BPS", 15000),
            planning_brl_per_usd_millis=_env_int(
                "WORKER_PLANNING_BRL_PER_USD_MILLIS",
                5500,
            ),
            budget_envelope=os.getenv("WORKER_BUDGET_ENVELOPE", "free_ai"),
        )
        config.validate()
        return config

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    def validate(self) -> None:
        if self.poll_interval_seconds <= 0:
            raise ConfigurationError("WORKER_POLL_INTERVAL_SECONDS must be positive")
        if self.lease_seconds <= 0:
            raise ConfigurationError("WORKER_LEASE_SECONDS must be positive")
        if self.heartbeat_interval_seconds <= 0:
            raise ConfigurationError("WORKER_HEARTBEAT_INTERVAL_SECONDS must be positive")
        if self.heartbeat_interval_seconds >= self.lease_seconds / 2:
            raise ConfigurationError(
                "WORKER_HEARTBEAT_INTERVAL_SECONDS must be less than half the lease"
            )
        if self.job_timeout_seconds <= 0 or self.ffprobe_timeout_seconds <= 0:
            raise ConfigurationError("worker timeouts must be positive")
        if self.ffmpeg_timeout_seconds <= 0:
            raise ConfigurationError("WORKER_FFMPEG_TIMEOUT_SECONDS must be positive")
        for name, value in (
            ("WORKER_MAX_INPUT_BYTES", self.max_input_bytes),
            ("WORKER_MAX_OUTPUT_BYTES", self.max_output_bytes),
            ("WORKER_MAX_DURATION_SECONDS", self.max_duration_seconds),
            ("WORKER_MAX_MEMORY_BYTES", self.max_memory_bytes),
            ("WORKER_MAX_CPU_SECONDS", self.max_cpu_seconds),
            (
                "WORKER_TRANSCRIPTION_COST_MICROS_USD_PER_SECOND",
                self.transcription_cost_micros_usd_per_second,
            ),
            ("WORKER_RESERVE_FACTOR_BPS", self.reserve_factor_bps),
            ("WORKER_PLANNING_BRL_PER_USD_MILLIS", self.planning_brl_per_usd_millis),
        ):
            if value <= 0:
                raise ConfigurationError(f"{name} must be positive")
        if self.storage_provider not in {"local", "s3"}:
            raise ConfigurationError("STORAGE_PROVIDER must be local or s3")
        if self.storage_provider == "s3" and not all(
            (
                self.s3_endpoint,
                self.s3_bucket,
                self.s3_access_key_id,
                self.s3_secret_access_key,
            )
        ):
            raise ConfigurationError("S3 storage requires endpoint, bucket and credentials")
        if self.autostart and not self.supabase_configured:
            raise ConfigurationError(
                "WORKER_AUTOSTART requires Supabase service-role configuration"
            )
