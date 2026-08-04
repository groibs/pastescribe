from __future__ import annotations

import json
import logging
from collections.abc import Mapping
from typing import Any

_PROHIBITED_KEYS = {
    "transcript",
    "text",
    "email",
    "source_url",
    "signed_url",
    "authorization",
    "service_role_key",
}


def _sanitize(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            str(key): "[redacted]" if str(key).lower() in _PROHIBITED_KEYS else _sanitize(item)
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [_sanitize(item) for item in value]
    if isinstance(value, str) and len(value) > 500:
        return value[:500] + "…"
    return value


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "level": record.levelname.lower(),
            "message": record.getMessage(),
            "logger": record.name,
        }
        fields = getattr(record, "fields", None)
        if isinstance(fields, Mapping):
            payload.update(_sanitize(fields))
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level.upper())


def log_event(logger: logging.Logger, message: str, **fields: Any) -> None:
    logger.info(message, extra={"fields": fields})
