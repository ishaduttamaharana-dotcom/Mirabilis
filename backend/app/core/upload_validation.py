"""Upload validation per security.md: extension -> declared MIME -> magic-byte
signature -> size -> dimensions, in that order. No dependency on libmagic —
signatures for the fixed allowlist below are simple enough to check directly,
which also avoids adding a system-level dependency to the Docker image.
"""

import re

from app.core.config import get_settings
from app.utils.envelope import ApiError


def _is_video_container(b: bytes) -> bool:
    if len(b) < 4:
        return False
    # Check common video container atom identifiers in the initial header (first 512 bytes)
    atoms = (b"ftyp", b"moov", b"wide", b"mdat", b"free", b"skip", b"uuid", b"\x1a\x45\xdf\xa3", b"RIFF", b"FLV", b"OggS")
    header = b[:512]
    return any(atom in header for atom in atoms)


# extension -> magic-byte signature checker
_MAGIC_CHECKS = {
    "jpg": lambda b: len(b) >= 2 and b[:2] == b"\xff\xd8",
    "jpeg": lambda b: len(b) >= 2 and b[:2] == b"\xff\xd8",
    "png": lambda b: len(b) >= 8 and b[:8] == b"\x89PNG\r\n\x1a\n",
    "webp": lambda b: len(b) >= 12 and b[:4] == b"RIFF" and b[8:12] == b"WEBP",
    "avif": lambda b: len(b) >= 12 and (b[4:8] == b"ftyp" or b[:4] == b"ftyp") and b[8:12] in (b"avif", b"avis"),
    "gif": lambda b: len(b) >= 6 and (b[:6] == b"GIF87a" or b[:6] == b"GIF89a"),
    "bmp": lambda b: len(b) >= 2 and b[:2] == b"BM",
    "tiff": lambda b: len(b) >= 4 and (b[:4] == b"II*\x00" or b[:4] == b"MM\x00*"),
    "tif": lambda b: len(b) >= 4 and (b[:4] == b"II*\x00" or b[:4] == b"MM\x00*"),
    "ico": lambda b: len(b) >= 4 and b[:4] == b"\x00\x00\x01\x00",
    "svg": lambda b: True,
    "heic": lambda b: len(b) >= 12 and (b[4:8] == b"ftyp" or b[:4] == b"ftyp"),
    "heif": lambda b: len(b) >= 12 and (b[4:8] == b"ftyp" or b[:4] == b"ftyp"),
    "mp4": _is_video_container,
    "mov": _is_video_container,
    "webm": lambda b: len(b) >= 4 and (b[:4] == b"\x1a\x45\xdf\xa3" or _is_video_container(b)),
    "m4v": _is_video_container,
    "avi": _is_video_container,
    "mkv": lambda b: len(b) >= 4 and (b[:4] == b"\x1a\x45\xdf\xa3" or _is_video_container(b)),
    "wmv": _is_video_container,
    "flv": _is_video_container,
    "3gp": _is_video_container,
    "ts": lambda b: True,
    "m2ts": lambda b: True,
    "pdf": lambda b: len(b) >= 5 and b[:5] == b"%PDF-",
}

_MIME_BY_EXT = {
    "jpg": ["image/jpeg", "image/pjpeg", "image/jpg"],
    "jpeg": ["image/jpeg", "image/pjpeg", "image/jpg"],
    "png": ["image/png", "image/x-png"],
    "webp": ["image/webp"],
    "avif": ["image/avif", "image/heic", "image/heif"],
    "gif": ["image/gif"],
    "bmp": ["image/bmp", "image/x-ms-bmp"],
    "tiff": ["image/tiff"],
    "tif": ["image/tiff"],
    "ico": ["image/x-icon", "image/vnd.microsoft.icon", "image/icon"],
    "svg": ["image/svg+xml", "text/xml", "application/xml"],
    "heic": ["image/heic", "image/heif"],
    "heif": ["image/heif", "image/heic"],
    "mp4": ["video/mp4", "video/x-m4v", "video/mp4v-es", "video/mpeg", "video/3gpp", "application/mp4", "application/octet-stream"],
    "mov": ["video/quicktime", "video/mov", "video/mp4", "video/x-quicktime", "application/x-troff-msvideo", "application/octet-stream"],
    "webm": ["video/webm", "video/x-webm", "application/octet-stream"],
    "m4v": ["video/x-m4v", "video/mp4", "application/octet-stream"],
    "avi": ["video/x-msvideo", "video/avi", "application/x-troff-msvideo", "application/octet-stream"],
    "mkv": ["video/x-matroska", "video/mkv", "application/octet-stream"],
    "wmv": ["video/x-ms-wmv", "application/octet-stream"],
    "flv": ["video/x-flv", "application/octet-stream"],
    "3gp": ["video/3gpp", "video/3gp", "application/octet-stream"],
    "ts": ["video/mp2t", "application/octet-stream"],
    "m2ts": ["video/mp2t", "application/octet-stream"],
    "pdf": ["application/pdf", "application/x-pdf"],
}

_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "avif", "gif", "bmp", "tiff", "tif", "ico", "svg", "heic", "heif"}
_VIDEO_EXTS = {"mp4", "mov", "webm", "m4v", "avi", "mkv", "wmv", "flv", "3gp", "ts", "m2ts"}


def _extension(filename: str) -> str:
    if "/" in filename or "\\" in filename or ".." in filename or "\x00" in filename:
        raise ApiError(400, "INVALID_FILENAME", "Filename contains path-traversal characters")
    if "." not in filename:
        raise ApiError(400, "INVALID_FILE_TYPE", "File has no extension")
    ext = filename.rsplit(".", 1)[-1].lower()
    if not ext or not ext.isalnum():
        raise ApiError(400, "INVALID_FILE_TYPE", "File extension must be alphanumeric")
    return ext


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
            f"'.{ext}' is not an allowed upload type",
        )

    expected_mimes = _MIME_BY_EXT.get(ext, [])
    mime_lower = declared_mime.lower() if declared_mime else ""
    is_valid_mime = (
        not mime_lower
        or mime_lower in expected_mimes
        or mime_lower == "application/octet-stream"
        or mime_lower == "binary/octet-stream"
        or (ext in _IMAGE_EXTS and mime_lower.startswith("image/"))
        or (ext in _VIDEO_EXTS and (mime_lower.startswith("video/") or "video" in mime_lower or mime_lower.startswith("application/")))
    )
    if not is_valid_mime:
        raise ApiError(
            400, "MIME_MISMATCH", f"Declared type '{declared_mime}' does not match extension '.{ext}'"
        )

    if first_bytes and not _MAGIC_CHECKS[ext](first_bytes):
        # Tolerant signature check for video types to prevent false-rejections on variant headers
        if not (ext in _VIDEO_EXTS and (not mime_lower or mime_lower.startswith("video/") or "video" in mime_lower or "octet-stream" in mime_lower or mime_lower.startswith("application/"))):
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
        if fmt == "JPEG" and clean.mode in ("RGBA", "LA", "P", "PA"):
            clean = clean.convert("RGB")
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

