import json
import math
import shutil
import time
import uuid
from pathlib import Path
from pydantic import BaseModel

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from app.core.config import get_settings
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.core.rbac import CurrentUser, require_editor, require_viewer
from app.core.upload_validation import validate_upload_header, _MAGIC_CHECKS
from app.repositories.media import MediaRepository
from app.services.media_service import MediaService
from app.services.storage import generate_filename, get_storage_adapter
from app.utils.envelope import ApiError, data, paginated

router = APIRouter(prefix="/admin/media", tags=["admin:media"])


def _media_service() -> MediaService:
    db = get_db()
    return MediaService(MediaRepository(db), get_storage_adapter())


def _serialize(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id"))
    storage = get_storage_adapter()
    out["url"] = storage.public_url(out["key"])
    return out


_upload_rate_limit = Depends(rate_limit("media-upload", 100))
_sess_rate_limit = Depends(rate_limit("media-sess", 60))
_chunk_rate_limit = Depends(rate_limit("media-chunk", 1200))

CHUNK_SIZE_BYTES = 3 * 1024 * 1024  # 3 MB per chunk for serverless/local fallback (Vercel payload limit is 4.5MB)
MULTIPART_PART_SIZE_BYTES = 5 * 1024 * 1024  # 5 MiB minimum per part for direct R2 upload


def _temp_chunks_dir() -> Path:
    import tempfile
    base = Path(tempfile.gettempdir()) / "mirabilis_temp_chunks"
    try:
        base.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    return base


def _cleanup_abandoned_chunks() -> None:
    """Deletes temporary chunk session directories older than 2 hours."""
    try:
        base = _temp_chunks_dir()
        now = time.time()
        for item in base.iterdir():
            if item.is_dir() and item.name.startswith("sess_"):
                if now - item.stat().st_mtime > 7200:
                    shutil.rmtree(item, ignore_errors=True)
    except Exception:
        pass


class PresignUploadRequest(BaseModel):
    filename: str
    fileSize: int
    mimeType: str = ""
    altText: str = ""


class FinalizeUploadRequest(BaseModel):
    key: str
    filename: str
    fileSize: int
    mimeType: str = ""
    altText: str = ""


class UploadInitRequest(BaseModel):
    filename: str
    fileSize: int
    mimeType: str = ""
    altText: str = ""


class PartUrlRequest(BaseModel):
    uploadId: str
    key: str
    partNumber: int


class PartInfo(BaseModel):
    PartNumber: int
    ETag: str


class UploadCompleteRequest(BaseModel):
    uploadId: str = ""
    key: str = ""
    parts: list[dict] = []
    filename: str = ""
    mimeType: str = ""
    altText: str = ""
    fileSize: int = 0


@router.post("/upload/presign", dependencies=[_sess_rate_limit])
async def presign_single_upload(
    req: PresignUploadRequest,
    user: CurrentUser = Depends(require_editor),
):
    ext, category = validate_upload_header(
        filename=req.filename,
        declared_mime=req.mimeType,
        first_bytes=b"",
        file_size_bytes=req.fileSize,
    )
    storage = get_storage_adapter()
    if storage.is_direct_upload_supported():
        key, upload_url = await storage.create_presigned_put_url(
            category=category, extension=ext, mime_type=req.mimeType or "application/octet-stream"
        )
        return data({
            "isDirect": True,
            "key": key,
            "uploadUrl": upload_url,
            "category": category,
            "ext": ext,
        })
    else:
        return data({
            "isDirect": False,
            "category": category,
            "ext": ext,
        })


@router.post("/upload/finalize", dependencies=[_upload_rate_limit])
async def finalize_single_upload(
    req: FinalizeUploadRequest,
    user: CurrentUser = Depends(require_editor),
):
    ext, category = validate_upload_header(
        filename=req.filename,
        declared_mime=req.mimeType,
        first_bytes=b"",
        file_size_bytes=req.fileSize,
    )
    if ".." in req.key or req.key.startswith("/") or "\\" in req.key:
        raise ApiError(400, "INVALID_KEY", "Invalid object key format")

    storage = get_storage_adapter()
    head = await storage.head_object(req.key)
    file_size = head.get("content_length") if head else req.fileSize

    db = get_db()
    media_repo = MediaRepository(db)
    doc = await media_repo.create(
        key=req.key,
        category=category,
        mime_type=req.mimeType or f"image/{ext}",
        size=file_size or req.fileSize,
        alt_text=req.altText or req.filename,
        uploaded_by=user.user_id,
        width=None,
        height=None,
    )
    return data(_serialize(doc))


from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import Response

@router.options("/upload/init")
@router.options("/upload/init/")
@router.options("/upload/chunk")
@router.options("/upload/chunk/")
@router.options("/upload/complete")
@router.options("/upload/complete/")
@router.options("/upload/presign")
@router.options("/upload/finalize")
@router.options("/upload/part-url")
@router.options("/upload")
async def options_upload_preflight():
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )

@router.post("/upload/init", dependencies=[_sess_rate_limit])
@router.post("/upload/init/", dependencies=[_sess_rate_limit])
async def init_upload(
    req: UploadInitRequest,
    request: Request,
    user: CurrentUser = Depends(require_editor),
):
    auth_present = bool(request.headers.get("Authorization"))
    print(f"[MEDIA REQUEST DEBUG] method={request.method} path={request.url.path} authorizationHeaderPresent={auth_present}")
    ext, category = validate_upload_header(
        filename=req.filename,
        declared_mime=req.mimeType,
        first_bytes=b"",
        file_size_bytes=req.fileSize,
    )

    storage = get_storage_adapter()
    settings = get_settings()
    max_mb = settings.upload_max_video_mb if category == "videos" else settings.upload_max_image_mb

    if storage.is_direct_upload_supported():
        key, upload_id = await storage.init_multipart_upload(
            category=category, extension=ext, mime_type=req.mimeType or f"video/{ext}"
        )
        total_chunks = max(1, math.ceil(req.fileSize / MULTIPART_PART_SIZE_BYTES))
        return data({
            "isDirect": True,
            "uploadId": upload_id,
            "key": key,
            "chunkSize": MULTIPART_PART_SIZE_BYTES,
            "totalChunks": total_chunks,
            "maxSizeMb": max_mb,
        })
    else:
        _cleanup_abandoned_chunks()
        upload_id = f"sess_{uuid.uuid4().hex}"
        total_chunks = max(1, math.ceil(req.fileSize / CHUNK_SIZE_BYTES))
        meta = {
            "_id": upload_id,
            "uploadId": upload_id,
            "filename": req.filename,
            "fileSize": req.fileSize,
            "mimeType": req.mimeType,
            "category": category,
            "ext": ext,
            "altText": req.altText,
            "uploadedBy": user.user_id,
            "totalChunks": total_chunks,
            "chunkSize": CHUNK_SIZE_BYTES,
            "createdAt": time.time(),
        }

        # 1. Persist session statelessly in MongoDB for serverless instance resilience
        try:
            db = get_db()
            await db["upload_sessions"].replace_one({"_id": upload_id}, meta, upsert=True)
        except Exception as e:
            print(f"[MEDIA INIT DB WARNING] {e}")

        # 2. Local /tmp fallback
        try:
            sess_dir = _temp_chunks_dir() / upload_id
            sess_dir.mkdir(parents=True, exist_ok=True)
            (sess_dir / "session.json").write_text(json.dumps(meta), encoding="utf-8")
        except Exception:
            pass

        return data({
            "isDirect": False,
            "uploadId": upload_id,
            "chunkSize": CHUNK_SIZE_BYTES,
            "totalChunks": total_chunks,
            "maxSizeMb": max_mb,
        })


@router.post("/upload/part-url", dependencies=[_chunk_rate_limit])
async def get_part_presigned_url(
    req: PartUrlRequest,
    _: CurrentUser = Depends(require_editor),
):
    if ".." in req.key or req.key.startswith("/") or "\\" in req.key:
        raise ApiError(400, "INVALID_KEY", "Invalid object key format")

    storage = get_storage_adapter()
    if not storage.is_direct_upload_supported():
        raise ApiError(400, "INVALID_DRIVER", "Direct part URLs not supported in local driver mode")

    url = await storage.create_presigned_part_url(
        key=req.key, upload_id=req.uploadId, part_number=req.partNumber
    )
    return data({"url": url, "partNumber": req.partNumber})


@router.post("/upload/chunk", dependencies=[_chunk_rate_limit])
@router.post("/upload/chunk/", dependencies=[_chunk_rate_limit])
async def upload_chunk(
    uploadId: str = Form(...),
    chunkIndex: int = Form(...),
    file: UploadFile = File(...),
    _: CurrentUser = Depends(require_editor),
):
    chunk_content = await file.read()

    # 1. Store chunk binary statelessly in MongoDB
    try:
        db = get_db()
        await db["upload_chunks"].replace_one(
            {"uploadId": uploadId, "chunkIndex": chunkIndex},
            {
                "uploadId": uploadId,
                "chunkIndex": chunkIndex,
                "bytes": len(chunk_content),
                "data": chunk_content,
                "createdAt": time.time(),
            },
            upsert=True,
        )
    except Exception as e:
        print(f"[MEDIA CHUNK DB WARNING] {e}")

    # 2. Local /tmp fallback
    try:
        sess_dir = _temp_chunks_dir() / uploadId
        if sess_dir.exists():
            chunk_path = sess_dir / f"chunk_{chunkIndex}.bin"
            chunk_path.write_bytes(chunk_content)
    except Exception:
        pass

    return data({
        "uploadId": uploadId,
        "chunkIndex": chunkIndex,
        "received": True,
        "bytes": len(chunk_content),
    })


@router.get("/upload/status/{upload_id}")
async def get_chunk_status(
    upload_id: str,
    _: CurrentUser = Depends(require_viewer),
):
    db = get_db()
    sess = await db["upload_sessions"].find_one({"_id": upload_id})
    if sess:
        chunks = await db["upload_chunks"].find({"uploadId": upload_id}).to_list(length=1000)
        completed = [c["chunkIndex"] for c in chunks]
        total = sess["totalChunks"]
        return data({
            "uploadId": upload_id,
            "totalChunks": total,
            "completedChunks": completed,
            "progressPercent": round((len(completed) / total) * 100) if total else 0,
        })

    sess_dir = _temp_chunks_dir() / upload_id
    meta_path = sess_dir / "session.json"
    if not sess_dir.exists() or not meta_path.exists():
        raise ApiError(404, "SESSION_NOT_FOUND", "Upload session not found")

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    completed = []
    for i in range(meta["totalChunks"]):
        if (sess_dir / f"chunk_{i}.bin").exists():
            completed.append(i)

    return data({
        "uploadId": upload_id,
        "totalChunks": meta["totalChunks"],
        "completedChunks": completed,
        "progressPercent": round((len(completed) / meta["totalChunks"]) * 100) if meta["totalChunks"] else 0,
    })


@router.post("/upload/cancel/{upload_id}")
@router.delete("/upload/cancel/{upload_id}")
async def cancel_upload(
    upload_id: str,
    key: str = Query(""),
    _: CurrentUser = Depends(require_editor),
):
    storage = get_storage_adapter()
    if storage.is_direct_upload_supported() and key:
        await storage.abort_multipart_upload(key=key, upload_id=upload_id)
    else:
        try:
            db = get_db()
            await db["upload_sessions"].delete_one({"_id": upload_id})
            await db["upload_chunks"].delete_many({"uploadId": upload_id})
        except Exception:
            pass
        sess_dir = _temp_chunks_dir() / upload_id
        if sess_dir.exists():
            shutil.rmtree(sess_dir, ignore_errors=True)
    return data({"cancelled": True})


@router.post("/upload/complete", dependencies=[_upload_rate_limit])
@router.post("/upload/complete/", dependencies=[_upload_rate_limit])
async def complete_upload(
    req: UploadCompleteRequest,
    user: CurrentUser = Depends(require_editor),
):
    import traceback
    storage = get_storage_adapter()
    print(f"[MEDIA COMPLETE DEBUG] upload_id={req.uploadId} key={req.key} is_direct={storage.is_direct_upload_supported()}")

    if storage.is_direct_upload_supported() and req.key:
        if ".." in req.key or req.key.startswith("/") or "\\" in req.key:
            raise ApiError(400, "INVALID_KEY", "Invalid object key format")

        if not req.parts:
            raise ApiError(400, "INVALID_PART", "Completed parts list cannot be empty")

        await storage.complete_multipart_upload(key=req.key, upload_id=req.uploadId, parts=req.parts)

        category = req.key.split("/", 1)[0] if "/" in req.key else "videos"
        ext = req.key.rsplit(".", 1)[-1] if "." in req.key else "mp4"

        head = await storage.head_object(req.key)
        file_size = head.get("content_length") if head else req.fileSize

        db = get_db()
        media_repo = MediaRepository(db)
        doc = await media_repo.create(
            key=req.key,
            category=category,
            mime_type=req.mimeType or f"video/{ext}",
            size=file_size or req.fileSize,
            alt_text=req.altText or req.filename,
            uploaded_by=user.user_id,
            width=None,
            height=None,
        )
        return data(_serialize(doc))
    else:
        # Stateless MongoDB chunk complete (with local /tmp fallback)
        db = get_db()
        meta = None

        # 1. Retrieve session from MongoDB
        try:
            sess_doc = await db["upload_sessions"].find_one({"_id": req.uploadId})
            if sess_doc:
                meta = sess_doc
        except Exception as e:
            print(f"[MEDIA COMPLETE SESSION DB SEARCH WARNING] {e}")

        # 2. Fallback to local /tmp session
        sess_dir = _temp_chunks_dir() / req.uploadId
        if not meta and sess_dir.exists():
            meta_path = sess_dir / "session.json"
            if meta_path.exists():
                try:
                    meta = json.loads(meta_path.read_text(encoding="utf-8"))
                except Exception:
                    pass

        if not meta:
            raise ApiError(404, "SESSION_NOT_FOUND", "Upload session expired or invalid")

        total_chunks = meta.get("totalChunks", 1)

        # Retrieve chunks from MongoDB
        chunk_map: dict[int, bytes] = {}
        try:
            db_chunks = await db["upload_chunks"].find({"uploadId": req.uploadId}).to_list(length=1000)
            for c in db_chunks:
                chunk_map[c["chunkIndex"]] = c["data"]
        except Exception as e:
            print(f"[MEDIA COMPLETE CHUNKS DB SEARCH WARNING] {e}")

        # Fallback to local /tmp chunk files
        if sess_dir.exists():
            for i in range(total_chunks):
                if i not in chunk_map:
                    chunk_path = sess_dir / f"chunk_{i}.bin"
                    if chunk_path.exists():
                        chunk_map[i] = chunk_path.read_bytes()

        missing = [i for i in range(total_chunks) if i not in chunk_map]
        if missing:
            raise ApiError(400, "INCOMPLETE_UPLOAD", f"Upload incomplete: chunk {missing[0]} is missing.")

        # Assemble file sequentially in exact index order (0..total_chunks - 1)
        full_bytes = bytearray()
        for i in range(total_chunks):
            full_bytes.extend(chunk_map[i])

        ext = meta.get("ext", "mp4")
        first_chunk = bytes(full_bytes[:512])
        from app.core.upload_validation import _MAGIC_CHECKS, _VIDEO_EXTS
        mime_meta = (meta.get("mimeType") or "").lower()
        if first_chunk and ext in _MAGIC_CHECKS and not _MAGIC_CHECKS[ext](first_chunk):
            if not (ext in _VIDEO_EXTS and (not mime_meta or mime_meta.startswith("video/") or "video" in mime_meta or "octet-stream" in mime_meta or mime_meta.startswith("application/"))):
                raise ApiError(400, "SIGNATURE_MISMATCH", f"File signature does not match expected '.{ext}' format")

        try:
            # Store assembled media using storage adapter (local or GridFS)
            category = meta.get("category", "videos")
            key = await storage.save(category, ext, bytes(full_bytes))
            file_size = len(full_bytes)

            # Cleanup temporary session & chunks
            try:
                await db["upload_sessions"].delete_one({"_id": req.uploadId})
                await db["upload_chunks"].delete_many({"uploadId": req.uploadId})
            except Exception:
                pass
            if sess_dir.exists():
                shutil.rmtree(sess_dir, ignore_errors=True)

            media_repo = MediaRepository(db)
            doc = await media_repo.create(
                key=key,
                category=category,
                mime_type=meta.get("mimeType") or f"video/{ext}",
                size=file_size,
                alt_text=meta.get("altText", ""),
                uploaded_by=meta.get("uploadedBy", "admin"),
                width=None,
                height=None,
            )
            return data(_serialize(doc))
        except ApiError:
            raise
        except Exception as err:
            print(f"[MEDIA COMPLETE ERROR TRACEBACK]\n{traceback.format_exc()}")
            raise ApiError(500, "COMPLETE_FAILED", f"Upload completion failed: {str(err)}")


@router.post("/upload", dependencies=[_upload_rate_limit])
@router.post("", dependencies=[_upload_rate_limit])
async def upload_media(
    file: UploadFile = File(...),
    alt_text: str = Form(""),
    user: CurrentUser = Depends(require_editor),
):
    content = await file.read()
    doc = await _media_service().upload(
        filename=file.filename or "upload",
        declared_mime=file.content_type or "",
        content=content,
        alt_text=alt_text,
        uploaded_by=user.user_id,
    )
    return data(_serialize(doc))


@router.get("")
async def list_media(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    category: str | None = None,
    _: CurrentUser = Depends(require_viewer),
):
    items, total = await _media_service().list(page, page_size, category)
    return paginated([_serialize(i) for i in items], page, page_size, total)


@router.get("/{media_id}")
async def get_media(media_id: str, _: CurrentUser = Depends(require_viewer)):
    doc = await _media_service().get_or_404(media_id)
    return data(_serialize(doc))


@router.delete("/{media_id}")
async def delete_media(media_id: str, _: CurrentUser = Depends(require_editor)):
    await _media_service().delete_with_reference_check(media_id)
    return data({"deleted": True})
