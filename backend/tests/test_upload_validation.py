import pytest

from app.core.upload_validation import validate_upload
from app.utils.envelope import ApiError

# Minimal valid signatures for each allowed type.
_PNG_HEADER = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
_JPEG_HEADER = b"\xff\xd8\xff" + b"\x00" * 32
_PDF_HEADER = b"%PDF-1.4\n" + b"\x00" * 32


def test_rejects_disallowed_extension():
    with pytest.raises(ApiError) as exc_info:
        validate_upload("shell.php", "application/x-php", b"<?php system($_GET['c']); ?>")
    assert exc_info.value.code == "INVALID_FILE_TYPE"


def test_rejects_path_traversal_in_filename():
    with pytest.raises(ApiError) as exc_info:
        validate_upload("../../etc/passwd.png", "image/png", _PNG_HEADER)
    assert exc_info.value.code == "INVALID_FILENAME"


def test_rejects_mime_extension_mismatch():
    with pytest.raises(ApiError) as exc_info:
        validate_upload("photo.png", "application/pdf", _PNG_HEADER)
    assert exc_info.value.code == "MIME_MISMATCH"


def test_rejects_signature_mismatch_disguised_as_image():
    # A .png extension and correct declared MIME, but content is actually a PDF —
    # this is exactly the "mislabeled upload" threat security.md calls out.
    with pytest.raises(ApiError) as exc_info:
        validate_upload("fake.png", "image/png", _PDF_HEADER)
    assert exc_info.value.code == "SIGNATURE_MISMATCH"


def test_accepts_valid_jpeg():
    ext, category = validate_upload("photo.jpg", "image/jpeg", _JPEG_HEADER)
    assert ext == "jpg"
    assert category == "images"


def test_rejects_oversized_image():
    oversized = _PNG_HEADER + b"\x00" * (16 * 1024 * 1024)
    with pytest.raises(ApiError) as exc_info:
        validate_upload("big.png", "image/png", oversized)
    assert exc_info.value.code == "FILE_TOO_LARGE"
