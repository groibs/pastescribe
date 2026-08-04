from __future__ import annotations

import asyncio
from collections.abc import Iterator
from pathlib import Path

import pytest

from pastescribe_worker.models import MediaAsset
from pastescribe_worker.storage import LocalMediaStorage, MediaStorageError, S3MediaStorage


class FakeBody:
    def __init__(self, chunks: list[bytes]) -> None:
        self._chunks = chunks
        self.closed = False

    def iter_chunks(self, chunk_size: int = 1024) -> Iterator[bytes]:
        del chunk_size
        yield from self._chunks

    def close(self) -> None:
        self.closed = True


class FakeS3Client:
    def __init__(self, body: FakeBody, content_length: int) -> None:
        self.body = body
        self.content_length = content_length

    def get_object(self, *, Bucket: str, Key: str) -> dict[str, object]:
        assert Bucket == "media"
        assert Key == "uploads/input.mp4"
        return {"ContentLength": self.content_length, "Body": self.body}


def _asset(storage_key: str = "uploads/input.mp4") -> MediaAsset:
    return MediaAsset("asset-1", storage_key, "validated", 6, "video/mp4")


def test_local_storage_acquires_inside_root(tmp_path: Path) -> None:
    root = tmp_path / "storage"
    source = root / "uploads/input.mp4"
    source.parent.mkdir(parents=True)
    source.write_bytes(b"abcdef")
    destination = tmp_path / "work/input.mp4"
    acquired = asyncio.run(LocalMediaStorage(root).acquire(_asset(), destination, 10))
    assert acquired.bytes_downloaded == 6
    assert destination.read_bytes() == b"abcdef"


def test_local_storage_rejects_traversal(tmp_path: Path) -> None:
    with pytest.raises(MediaStorageError, match="invalid_storage_key"):
        asyncio.run(
            LocalMediaStorage(tmp_path / "storage").acquire(
                _asset("../outside.mp4"),
                tmp_path / "work/input.mp4",
                10,
            )
        )


def test_s3_storage_streams_and_closes_body(tmp_path: Path) -> None:
    body = FakeBody([b"abc", b"def"])
    storage = S3MediaStorage(FakeS3Client(body, 6), "media")
    destination = tmp_path / "input.mp4"
    acquired = asyncio.run(storage.acquire(_asset(), destination, 10))
    assert acquired.bytes_downloaded == 6
    assert destination.read_bytes() == b"abcdef"
    assert body.closed is True


def test_s3_storage_enforces_stream_limit(tmp_path: Path) -> None:
    body = FakeBody([b"abcdef"])
    storage = S3MediaStorage(FakeS3Client(body, 6), "media")
    with pytest.raises(MediaStorageError, match="input_size_exceeded"):
        asyncio.run(storage.acquire(_asset(), tmp_path / "input.mp4", 5))
    assert body.closed is False
