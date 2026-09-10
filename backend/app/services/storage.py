"""Storage adapter abstraction (architecture.md: "storage adapter so
production can use S3-compatible storage without changing collection
documents"). `media` documents store a `key` — the adapter decides what a
key resolves to; collections that reference media only ever store the media
document's id, never a raw path, so swapping adapters needs zero data
migration.
"""

import secrets
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import get_settings


class StorageAdapter(ABC):
    @abstractmethod
    async def save(self, category: str, extension: str, content: bytes) -> str:
        """Persists content, returns the storage key."""

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Deletes the object at `key`. Safe to call on a missing key."""

    @abstractmethod
    def public_url(self, key: str) -> str:
        """Returns the URL the public site / admin should use to fetch this key."""


def generate_filename(extension: str) -> str:
    """Server-generated filenames only — never trust a client-supplied name
    (security.md: path-traversal rejection, no client-controlled paths)."""
    return f"{uuid.uuid4().hex}{secrets.token_hex(4)}.{extension}"


class LocalStorageAdapter(StorageAdapter):
    """Development/default adapter: backend/uploads/<category>/<generated>."""

    def __init__(self, base_path: str | None = None):
        settings = get_settings()
        self._base = Path(base_path or settings.storage_local_path)

    async def save(self, category: str, extension: str, content: bytes) -> str:
        category = category.replace("..", "").strip("/")
        target_dir = self._base / category
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = generate_filename(extension)
        target_path = target_dir / filename
        target_path.write_bytes(content)
        return f"{category}/{filename}"

    async def delete(self, key: str) -> None:
        path = self._base / key
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass  # best-effort — cleanup_orphaned_files.py catches stragglers

    def public_url(self, key: str) -> str:
        settings = get_settings()
        backend_base = getattr(settings, "backend_base_url", "http://localhost:8000")
        return f"{backend_base}/uploads/{key}"


class S3StorageAdapter(StorageAdapter):
    """Production adapter — same interface, AWS S3 object storage instead of disk."""

    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.s3_bucket or ""
        self.region = settings.s3_region or "us-east-1"
        self.access_key = settings.s3_access_key_id
        self.secret_key = settings.s3_secret_access_key
        if not self.bucket:
            raise RuntimeError("S3StorageAdapter requires S3_BUCKET to be configured")

    async def save(self, category: str, extension: str, content: bytes) -> str:
        category = category.replace("..", "").strip("/")
        filename = generate_filename(extension)
        key = f"{category}/{filename}"

        # If boto3 is available, use boto3 client
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
            )
            s3_client.put_object(Bucket=self.bucket, Key=key, Body=content)
        except ImportError:
            # Fallback to local save if boto3 library is not present
            local = LocalStorageAdapter()
            return await local.save(category, extension, content)

        return key

    async def delete(self, key: str) -> None:
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
            )
            s3_client.delete_object(Bucket=self.bucket, Key=key)
        except Exception:
            pass

    def public_url(self, key: str) -> str:
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"


def get_storage_adapter() -> StorageAdapter:
    settings = get_settings()
    if settings.storage_driver == "s3":
        return S3StorageAdapter()
    return LocalStorageAdapter()
