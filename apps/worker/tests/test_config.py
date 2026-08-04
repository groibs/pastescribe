from __future__ import annotations

import os

import pytest

from pastescribe_worker.config import ConfigurationError, WorkerConfig


def test_defaults_are_safe(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in list(os.environ):
        if key.startswith("WORKER_") or key in {"FFMPEG_BINARY", "FFPROBE_BINARY"}:
            monkeypatch.delenv(key, raising=False)
    config = WorkerConfig.from_env()
    assert config.autostart is False
    assert config.heartbeat_interval_seconds < config.lease_seconds / 2
    assert config.max_duration_seconds == 4 * 60 * 60


def test_rejects_heartbeat_too_close_to_lease(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("WORKER_LEASE_SECONDS", "20")
    monkeypatch.setenv("WORKER_HEARTBEAT_INTERVAL_SECONDS", "10")
    with pytest.raises(ConfigurationError, match="less than half"):
        WorkerConfig.from_env()
