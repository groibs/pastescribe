from __future__ import annotations

import asyncio
import shutil
from collections.abc import Iterator
from pathlib import Path
from typing import Protocol, cast

import boto3

from .config import WorkerConfig
from .models import AcquiredMedia, MediaAsset


class MediaStorageError(RuntimeError):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


class StreamingBody(Protocol):
    def iter_chunks(self, chunk_size: int = 1024) -> Iterator[bytes]: ...

    def close(self) -> None: ...


class S3Client(Protocol):
    def get_object(self, *, Bucket: str, Key: str) -> dict[str, object]: ...


def _safe_local_path(root: Path, storage_key: str) -> Path:
    resolved_root = root.resolve()
    candidate = (resolved_root / storage_key).resolve()
    if not candidate.is_relative_to(resolved_root):
        raise MediaStorageError("invalid_storage_key")
    return candidate


def _copy_bounded(source: Path, destination: Path, max_bytes: int) -> int:
    size = source.stat().st_size
    if size > max_bytes:
        raise MediaStorageError("input_size_exceeded")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with source.open("rb") as source_file, destination.open("wb") as destination_file:
        shutil.copyfileobj(source_file, destination_file, length=1024 * 1024)
    return size


class LocalMediaStorage:
    def __init__(self, root: Path) -> None:
        self._root = root

    async def acquire(
        self,
        asset: MediaAsset,
        destination: Path,
        max_bytes: int,
    ) -> AcquiredMedia:
        source = _safe_local_path(self._root, asset.storage_key)
        if not source.is_file():
            raise MediaStorageError("media_object_not_found")
        bytes_downloaded = await asyncio.to_thread(
            _copy_bounded,
            source,
            destination,
            max_bytes,
        )
        return AcquiredMedia(path=destination, bytes_downloaded=bytes_downloaded)


class S3MediaStorage:
    def __init__(self, client: S3Client, bucket: str) -> None:
        self._client = client
        self._bucket = bucket

    @classmethod
    def from_config(cls, config: WorkerConfig) -> S3MediaStorage:
        if not all(
            (
                config.s3_endpoint,
                config.s3_bucket,
                config.s3_access_key_id,
                config.s3_secret_access_key,
            )
        ):
            raise MediaStorageError("s3_not_configured")
        client = cast(
            S3Client,
            boto3.client(
                "s3",
                endpoint_url=config.s3_endpoint,
                region_name=config.s3_region,
                aws_access_key_id=config.s3_access_key_id,
                aws_secret_access_key=config.s3_secret_access_key,
            ),
        )
        return cls(client, cast(str, config.s3_bucket))

    def _download(self, asset: MediaAsset, destination: Path, max_bytes: int) -> int:
        try:
            response = self._client.get_object(Bucket=self._bucket, Key=asset.storage_key)
        except Exception as error:
            raise MediaStorageError("media_object_fetch_failed") from error

        raw_length = response.get("ContentLength")
        if isinstance(raw_length, bool) or not isinstance(raw_length, int):
            raise MediaStorageError("invalid_content_length")
        if raw_length > max_bytes:
            raise MediaStorageError("input_size_exceeded")

        body = response.get("Body")
        if body is None or not hasattr(body, "iter_chunks") or not hasattr(body, "close"):
            raise MediaStorageError("invalid_streaming_body")
        streaming_body = cast(StreamingBody, body)
        destination.parent.mkdir(parents=True, exist_ok=True)
        written = 0
        try:
            with destination.open("wb") as output:
                for chunk in streaming_body.iter_chunks(chunk_size=1024 * 1024):
                    if not chunk:
                        continue
                    written += len(chunk)
                    if written > max_bytes:
                        raise MediaStorageError("input_size_exceeded")
                    output.write(chunk)
        finally:
            streaming_body.close()

        if written != raw_length:
            raise MediaStorageError("content_length_mismatch")
        return written

    async def acquire(
        self,
        asset: MediaAsset,
        destination: Path,
        max_bytes: int,
    ) -> AcquiredMedia:
        bytes_downloaded = await asyncio.to_thread(
            self._download,
            asset,
            destination,
            max_bytes,
        )
        return AcquiredMedia(path=destination, bytes_downloaded=bytes_downloaded)


def create_media_storage(config: WorkerConfig) -> LocalMediaStorage | S3MediaStorage:
    if config.storage_provider == "local":
        return LocalMediaStorage(config.local_storage_root)
    if config.storage_provider == "s3":
        return S3MediaStorage.from_config(config)
    raise MediaStorageError("unsupported_storage_provider")
