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
        )
        config.validate()
        return config

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
        ):
            if value <= 0:
                raise ConfigurationError(f"{name} must be positive")
