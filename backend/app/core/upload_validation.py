"""Upload validation per security.md: extension -> declared MIME -> magic-byte
signature -> size -> dimensions, in that order. No dependency on libmagic —
signatures for the fixed allowlist below are simple enough to check directly,
which also avoids adding a system-level dependency to the Docker image.
"""

import re

from app.core.config import get_settings
from app.utils.envelope import ApiError

# extension -> (declared content-types accepted, magic-byte signature checker)
_MAGIC_CHECKS = {
    "jpg": lambda b: len(b) >= 3 and b[:3] == b"\xff\xd8\xff",
    "jpeg": lambda b: len(b) >= 3 and b[:3] == b"\xff\xd8\xff",
    "png": lambda b: len(b) >= 8 and b[:8] == b"\x89PNG\r\n\x1a\n",
    "webp": lambda b: len(b) >= 12 and b[:4] == b"RIFF" and b[8:12] == b"WEBP",
    "avif": lambda b: len(b) >= 12 and b[4:8] == b"ftyp" and b[8:12] in (b"avif", b"avis"),
    "mp4": lambda b: len(b) >= 8 and (b[4:8] == b"ftyp" or b[:4] == b"ftyp"),
    "mov": lambda b: len(b) >= 8 and (b[4:8] in (b"ftyp", b"moov", b"wide", b"mdat", b"free") or b[:4] in (b"moov", b"wide", b"mdat", b"free", b"ftyp")),
    "webm": lambda b: len(b) >= 4 and b[:4] == b"\x1a\x45\xdf\xa3",
    "pdf": lambda b: len(b) >= 5 and b[:5] == b"%PDF-",
}

_MIME_BY_EXT = {
    "jpg": ["image/jpeg"],
    "jpeg": ["image/jpeg"],
    "png": ["image/png"],
    "webp": ["image/webp"],
    "avif": ["image/avif"],
    "mp4": ["video/mp4", "video/x-m4v", "application/octet-stream"],
    "mov": ["video/quicktime", "video/mov", "video/mp4", "application/octet-stream"],
    "webm": ["video/webm", "application/octet-stream"],
    "pdf": ["application/pdf"],
}

_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "avif"}
_VIDEO_EXTS = {"mp4", "mov", "webm"}

_SAFE_FILENAME_RE = re.compile(r"^[A-Za-z0-9._ -]+$")


def _extension(filename: str) -> str:
    if "/" in filename or "\\" in filename or ".." in filename:
        raise ApiError(400, "INVALID_FILENAME", "Filename contains path-traversal characters")
    if not _SAFE_FILENAME_RE.match(filename):
        raise ApiError(400, "INVALID_FILENAME", "Filename contains disallowed characters")
    if "." not in filename:
        raise ApiError(400, "INVALID_FILE_TYPE", "File has no extension")
    return filename.rsplit(".", 1)[-1].lower()


def validate_upload_header(
    filename: str, declared_mime: str, first_bytes: bytes, file_size_bytes: int
) -> tuple[str, str]:
    """Validates filename, extension, MIME, magic bytes signature, and max size.
    Does NOT require buffering full file in memory."""
    ext = _extension(filename)
    if ext not in _MAGIC_CHECKS:
        raise ApiError(
            400,
            "INVALID_FILE_TYPE",
            f"'.{ext}' is not an allowed upload type (jpg, jpeg, png, webp, avif, mp4, mov, webm, pdf)",
        )

    expected_mimes = _MIME_BY_EXT[ext]
    if declared_mime and declared_mime.lower() not in expected_mimes and declared_mime != "application/octet-stream":
        raise ApiError(
            400, "MIME_MISMATCH", f"Declared type '{declared_mime}' does not match extension '.{ext}'"
        )

    if first_bytes and not _MAGIC_CHECKS[ext](first_bytes):
        raise ApiError(400, "SIGNATURE_MISMATCH", "File content signature does not match declared file type")

    settings = get_settings()
    size_mb = file_size_bytes / (1024 * 1024)
    if ext in _IMAGE_EXTS and size_mb > settings.upload_max_image_mb:
        raise ApiError(400, "FILE_TOO_LARGE", f"Image is too large ({size_mb:.1f}MB). Maximum allowed is {settings.upload_max_image_mb}MB.")
    if ext in _VIDEO_EXTS and size_mb > settings.upload_max_video_mb:
        raise ApiError(400, "FILE_TOO_LARGE", f"Video is too large ({size_mb:.1f}MB). Maximum allowed is {settings.upload_max_video_mb}MB.")
    if ext == "pdf" and size_mb > settings.upload_max_pdf_mb:
        raise ApiError(400, "FILE_TOO_LARGE", f"PDF is too large ({size_mb:.1f}MB). Maximum allowed is {settings.upload_max_pdf_mb}MB.")

    category = "images" if ext in _IMAGE_EXTS else "videos" if ext in _VIDEO_EXTS else "documents"
    return ext, category


def validate_upload(filename: str, declared_mime: str, content: bytes) -> tuple[str, str]:
    """Legacy helper for full content byte buffers."""
    return validate_upload_header(filename, declared_mime, content, len(content))


def strip_image_metadata(content: bytes, ext: str) -> bytes:
    """Re-saves image bytes without EXIF/metadata. No-op for non-images or if
    Pillow can't parse the buffer (caller already validated the signature, so
    a parse failure here means a corrupt-but-signature-valid file — better to
    fall back to the original bytes than hard-fail the upload)."""
    if ext not in {"jpg", "jpeg", "png", "webp"}:  # Pillow's avif support is optional/plugin-based
        return content
    try:
        import io

        from PIL import Image

        img = Image.open(io.BytesIO(content))
        img.load()
        clean = Image.new(img.mode, img.size)
        clean.putdata(list(img.getdata()))
        out = io.BytesIO()
        fmt = "JPEG" if ext in ("jpg", "jpeg") else ext.upper()
        clean.save(out, format=fmt)
        return out.getvalue()
    except Exception:
        return content


def probe_dimensions(content: bytes, ext: str) -> tuple[int | None, int | None]:
    if ext not in {"jpg", "jpeg", "png", "webp", "avif"}:
        return None, None
    try:
        import io

        from PIL import Image

        img = Image.open(io.BytesIO(content))
        return img.width, img.height
    except Exception:
        return None, None
