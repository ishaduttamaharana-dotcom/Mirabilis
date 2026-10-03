import os
import secrets
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import get_settings
from app.core.db import get_db


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

    def is_direct_upload_supported(self) -> bool:
        return False

    async def create_presigned_put_url(
        self, category: str, extension: str, mime_type: str
    ) -> tuple[str, str]:
        raise NotImplementedError("Presigned PUT is not supported by this storage driver.")

    async def init_multipart_upload(
        self, category: str, extension: str, mime_type: str
    ) -> tuple[str, str]:
        raise NotImplementedError("Multipart upload is not supported by this storage driver.")

    async def create_presigned_part_url(
        self, key: str, upload_id: str, part_number: int
    ) -> str:
        raise NotImplementedError("Presigned part URL is not supported by this storage driver.")

    async def complete_multipart_upload(
        self, key: str, upload_id: str, parts: list[dict]
    ) -> None:
        raise NotImplementedError("Complete multipart upload is not supported by this storage driver.")

    async def abort_multipart_upload(
        self, key: str, upload_id: str
    ) -> None:
        pass

    async def head_object(self, key: str) -> dict | None:
        return None


def generate_filename(extension: str) -> str:
    """Server-generated filenames only — never trust a client-supplied name."""
    return f"{uuid.uuid4().hex}{secrets.token_hex(4)}.{extension}"


class LocalStorageAdapter(StorageAdapter):
    """Development/default adapter: backend/uploads/<category>/<generated>."""

    def __init__(self, base_path: str | None = None):
        settings = get_settings()
        self._base = Path(base_path or settings.storage_local_path)

    async def save(self, category: str, extension: str, content: bytes) -> str:
        category = category.replace("..", "").strip("/")
        filename = generate_filename(extension)
        key = f"{category}/{filename}"

        # 1. Save locally if writable
        try:
            target_dir = self._base / category
            target_dir.mkdir(parents=True, exist_ok=True)
            target_path = target_dir / filename
            target_path.write_bytes(content)
        except Exception:
            pass

        # 2. Always persist to GridFS so uploads survive container cold-starts and restarts
        try:
            gridfs = GridFSStorageAdapter()
            await gridfs.save_with_key(key, content)
        except Exception as err:
            print(f"[STORAGE GRIDFS WARNING] Could not persist to GridFS: {err}")

        return key

    async def delete(self, key: str) -> None:
        path = self._base / key
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass
        try:
            gridfs = GridFSStorageAdapter()
            await gridfs.delete(key)
        except Exception:
            pass

    def public_url(self, key: str) -> str:
        settings = get_settings()
        backend_base = getattr(settings, "backend_base_url", None)
        if backend_base:
            return f"{backend_base.rstrip('/')}/uploads/{key.lstrip('/')}"
        return f"/uploads/{key.lstrip('/')}"


class GridFSStorageAdapter(StorageAdapter):
    """Fallback adapter — stores uploads directly inside MongoDB GridFS."""

    def _get_bucket(self):
        from motor.motor_asyncio import AsyncIOMotorGridFSBucket
        db = get_db()
        return AsyncIOMotorGridFSBucket(db)

    async def save_with_key(self, key: str, content: bytes) -> str:
        category = key.split("/", 1)[0] if "/" in key else "images"
        ext = key.rsplit(".", 1)[-1] if "." in key else "png"
        bucket = self._get_bucket()
        upload_stream = bucket.open_upload_stream(
            key,
            metadata={"category": category, "extension": ext}
        )
        await upload_stream.write(content)
        await upload_stream.close()
        return key

    async def save(self, category: str, extension: str, content: bytes) -> str:
        category = category.replace("..", "").strip("/")
        filename = generate_filename(extension)
        key = f"{category}/{filename}"
        return await self.save_with_key(key, content)

    async def delete(self, key: str) -> None:
        try:
            bucket = self._get_bucket()
            cursor = bucket.find({"filename": key})
            async for grid_out in cursor:
                await bucket.delete(grid_out._id)
        except Exception:
            pass

    def public_url(self, key: str) -> str:
        settings = get_settings()
        backend_base = getattr(settings, "backend_base_url", None)
        if backend_base:
            return f"{backend_base.rstrip('/')}/uploads/{key.lstrip('/')}"
        return f"/uploads/{key.lstrip('/')}"



class R2StorageAdapter(StorageAdapter):
    """Production Cloudflare R2 storage adapter — S3-compatible direct browser uploads."""

    def __init__(self) -> None:
        settings = get_settings()
        self.account_id = settings.r2_account_id or ""
        self.bucket = settings.r2_bucket or ""
        self.access_key = settings.r2_access_key_id or ""
        self.secret_key = settings.r2_secret_access_key or ""
        self.public_base_url = settings.r2_public_base_url or ""
        self.region = settings.r2_region or "auto"

        missing = []
        if not self.account_id:
            missing.append("R2_ACCOUNT_ID")
        if not self.bucket:
            missing.append("R2_BUCKET")
        if not self.access_key:
            missing.append("R2_ACCESS_KEY_ID")
        if not self.secret_key:
            missing.append("R2_SECRET_ACCESS_KEY")
        if not self.public_base_url:
            missing.append("R2_PUBLIC_BASE_URL")

        if missing:
            raise RuntimeError(
                f"STORAGE_DRIVER=r2 configuration error: Missing required setting(s): {', '.join(missing)}"
            )

        self.endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"

    def _get_client(self):
        try:
            import boto3
            from botocore.config import Config
        except ImportError:
            raise RuntimeError("STORAGE_DRIVER=r2 requires 'boto3' library to be installed.")

        return boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
            config=Config(signature_version="s3v4"),
        )

    def is_direct_upload_supported(self) -> bool:
        return True

    def public_url(self, key: str) -> str:
        return f"{self.public_base_url.rstrip('/')}/{key.lstrip('/')}"

    async def save(self, category: str, extension: str, content: bytes) -> str:
        category = category.replace("..", "").strip("/")
        filename = generate_filename(extension)
        key = f"{category}/{filename}"
        s3 = self._get_client()
        s3.put_object(Bucket=self.bucket, Key=key, Body=content)
        return key

    async def delete(self, key: str) -> None:
        try:
            s3 = self._get_client()
            s3.delete_object(Bucket=self.bucket, Key=key)
        except Exception:
            pass

    async def create_presigned_put_url(
        self, category: str, extension: str, mime_type: str
    ) -> tuple[str, str]:
        category = category.replace("..", "").strip("/")
        filename = generate_filename(extension)
        key = f"{category}/{filename}"
        s3 = self._get_client()
        url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": self.bucket, "Key": key, "ContentType": mime_type},
            ExpiresIn=900,  # 15 minutes
        )
        return key, url

    async def init_multipart_upload(
        self, category: str, extension: str, mime_type: str
    ) -> tuple[str, str]:
        category = category.replace("..", "").strip("/")
        filename = generate_filename(extension)
        key = f"{category}/{filename}"
        s3 = self._get_client()
        res = s3.create_multipart_upload(
            Bucket=self.bucket, Key=key, ContentType=mime_type
        )
        return key, res["UploadId"]

    async def create_presigned_part_url(
        self, key: str, upload_id: str, part_number: int
    ) -> str:
        s3 = self._get_client()
        url = s3.generate_presigned_url(
            "upload_part",
            Params={
                "Bucket": self.bucket,
                "Key": key,
                "UploadId": upload_id,
                "PartNumber": part_number,
            },
            ExpiresIn=900,  # 15 minutes
        )
        return url

    async def complete_multipart_upload(
        self, key: str, upload_id: str, parts: list[dict]
    ) -> None:
        s3 = self._get_client()
        formatted_parts = []
        for p in parts:
            part_num = p.get("PartNumber") or p.get("partNumber")
            etag = p.get("ETag") or p.get("etag")
            if etag and not etag.startswith('"') and not etag.endswith('"'):
                etag = f'"{etag}"'
            formatted_parts.append({"PartNumber": int(part_num), "ETag": etag})

        formatted_parts.sort(key=lambda x: x["PartNumber"])

        s3.complete_multipart_upload(
            Bucket=self.bucket,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={"Parts": formatted_parts},
        )

    async def abort_multipart_upload(
        self, key: str, upload_id: str
    ) -> None:
        try:
            s3 = self._get_client()
            s3.abort_multipart_upload(
                Bucket=self.bucket, Key=key, UploadId=upload_id
            )
        except Exception:
            pass

    async def head_object(self, key: str) -> dict | None:
        try:
            s3 = self._get_client()
            res = s3.head_object(Bucket=self.bucket, Key=key)
            return {
                "content_length": res.get("ContentLength"),
                "content_type": res.get("ContentType"),
                "etag": res.get("ETag"),
            }
        except Exception:
            return None


class S3StorageAdapter(StorageAdapter):
    """Production AWS S3 adapter."""

    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.s3_bucket or ""
        self.region = settings.s3_region or "us-east-1"
        self.access_key = settings.s3_access_key_id
        self.secret_key = settings.s3_secret_access_key
        self.endpoint_url = getattr(settings, "s3_endpoint_url", None)
        self.public_domain = getattr(settings, "s3_public_domain", None)
        if not self.bucket:
            raise RuntimeError("S3StorageAdapter requires S3_BUCKET to be configured")

    async def save(self, category: str, extension: str, content: bytes) -> str:
        category = category.replace("..", "").strip("/")
        filename = generate_filename(extension)
        key = f"{category}/{filename}"

        try:
            import boto3
            client_kwargs = {
                "service_name": "s3",
                "region_name": self.region,
                "aws_access_key_id": self.access_key,
                "aws_secret_access_key": self.secret_key,
            }
            if self.endpoint_url:
                client_kwargs["endpoint_url"] = self.endpoint_url

            s3_client = boto3.client(**client_kwargs)
            s3_client.put_object(Bucket=self.bucket, Key=key, Body=content)
            return key
        except Exception:
            gridfs = GridFSStorageAdapter()
            return await gridfs.save(category, extension, content)

    async def delete(self, key: str) -> None:
        try:
            import boto3
            client_kwargs = {
                "service_name": "s3",
                "region_name": self.region,
                "aws_access_key_id": self.access_key,
                "aws_secret_access_key": self.secret_key,
            }
            if self.endpoint_url:
                client_kwargs["endpoint_url"] = self.endpoint_url

            s3_client = boto3.client(**client_kwargs)
            s3_client.delete_object(Bucket=self.bucket, Key=key)
        except Exception:
            pass

    def public_url(self, key: str) -> str:
        if self.public_domain:
            return f"{self.public_domain.rstrip('/')}/{key.lstrip('/')}"
        if self.endpoint_url:
            return f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{key.lstrip('/')}"
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"


def get_storage_adapter() -> StorageAdapter:
    settings = get_settings()
    driver = (settings.storage_driver or "").lower()
    if driver == "r2":
        return R2StorageAdapter()
    if driver == "s3" and settings.s3_bucket:
        return S3StorageAdapter()
    if driver == "gridfs":
        return GridFSStorageAdapter()
    return LocalStorageAdapter()
