import pytest
from unittest.mock import MagicMock, patch

from app.core.config import Settings
from app.services.storage import R2StorageAdapter, get_storage_adapter
from app.utils.envelope import ApiError


def test_r2_storage_adapter_fails_when_missing_config():
    # If STORAGE_DRIVER=r2 but R2 settings are missing, R2StorageAdapter must fail clearly.
    with patch("app.services.storage.get_settings") as mock_settings:
        mock_settings.return_value = Settings(
            storage_driver="r2",
            r2_account_id="",
            r2_bucket="",
            r2_access_key_id="",
            r2_secret_access_key="",
            r2_public_base_url="",
        )
        with pytest.raises(RuntimeError) as exc_info:
            R2StorageAdapter()
        assert "STORAGE_DRIVER=r2 configuration error" in str(exc_info.value)


def test_r2_storage_adapter_initializes_with_valid_config():
    with patch("app.services.storage.get_settings") as mock_settings:
        mock_settings.return_value = Settings(
            storage_driver="r2",
            r2_account_id="test-account-id",
            r2_bucket="test-bucket",
            r2_access_key_id="test-key-id",
            r2_secret_access_key="test-secret-key",
            r2_public_base_url="https://media.example.com",
        )
        adapter = R2StorageAdapter()
        assert adapter.is_direct_upload_supported() is True
        assert adapter.public_url("images/test.webp") == "https://media.example.com/images/test.webp"


@pytest.mark.asyncio
async def test_r2_presigned_put_generation():
    with patch("app.services.storage.get_settings") as mock_settings:
        mock_settings.return_value = Settings(
            storage_driver="r2",
            r2_account_id="test-account-id",
            r2_bucket="test-bucket",
            r2_access_key_id="test-key-id",
            r2_secret_access_key="test-secret-key",
            r2_public_base_url="https://media.example.com",
        )
        adapter = R2StorageAdapter()

        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = "https://test-account-id.r2.cloudflarestorage.com/test-bucket/images/abc.jpg?presigned"
        with patch.object(adapter, "_get_client", return_value=mock_s3):
            key, url = await adapter.create_presigned_put_url("images", "jpg", "image/jpeg")
            assert key.startswith("images/")
            assert key.endswith(".jpg")
            assert url.startswith("https://")
            mock_s3.generate_presigned_url.assert_called_once()


@pytest.mark.asyncio
async def test_r2_multipart_upload_flow():
    with patch("app.services.storage.get_settings") as mock_settings:
        mock_settings.return_value = Settings(
            storage_driver="r2",
            r2_account_id="test-account-id",
            r2_bucket="test-bucket",
            r2_access_key_id="test-key-id",
            r2_secret_access_key="test-secret-key",
            r2_public_base_url="https://media.example.com",
        )
        adapter = R2StorageAdapter()

        mock_s3 = MagicMock()
        mock_s3.create_multipart_upload.return_value = {"UploadId": "upload-123"}
        mock_s3.generate_presigned_url.return_value = "https://part-url.example.com"
        mock_s3.complete_multipart_upload.return_value = {}

        with patch.object(adapter, "_get_client", return_value=mock_s3):
            # Init
            key, upload_id = await adapter.init_multipart_upload("videos", "mp4", "video/mp4")
            assert key.startswith("videos/")
            assert upload_id == "upload-123"

            # Part URL
            part_url = await adapter.create_presigned_part_url(key, upload_id, 1)
            assert part_url == "https://part-url.example.com"

            # Complete
            parts = [{"PartNumber": 1, "ETag": "etag1"}, {"PartNumber": 2, "ETag": "etag2"}]
            await adapter.complete_multipart_upload(key, upload_id, parts)
            mock_s3.complete_multipart_upload.assert_called_once()

            # Abort
            await adapter.abort_multipart_upload(key, upload_id)
            mock_s3.abort_multipart_upload.assert_called_once_with(
                Bucket="test-bucket", Key=key, UploadId="upload-123"
            )
