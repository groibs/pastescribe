from __future__ import annotations

import json
import logging

from pastescribe_worker.observability import JsonFormatter


def test_formatter_redacts_prohibited_fields() -> None:
    record = logging.LogRecord("worker", logging.INFO, __file__, 1, "event", (), None)
    record.fields = {
        "job_id": "job-1",
        "email": "person@example.com",
        "transcript": "private content",
        "nested": {"source_url": "https://private.example/video"},
    }
    payload = json.loads(JsonFormatter().format(record))
    assert payload["job_id"] == "job-1"
    assert payload["email"] == "[redacted]"
    assert payload["transcript"] == "[redacted]"
    assert payload["nested"]["source_url"] == "[redacted]"
