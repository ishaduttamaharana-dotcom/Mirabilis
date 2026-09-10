from typing import Any

from fastapi import HTTPException
from fastapi.requests import Request
from fastapi.responses import JSONResponse


class ApiError(HTTPException):
    """Raise this for any handled application error so the response body
    matches the envelope defined in techspec.md."""

    def __init__(self, status_code: int, code: str, message: str, fields: dict[str, str] | None = None):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.fields = fields or {}


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    body: dict[str, Any] = {"error": {"code": exc.code, "message": exc.message}}
    if exc.fields:
        body["error"]["fields"] = exc.fields
    return JSONResponse(status_code=exc.status_code, content=body)


def data(payload: Any) -> dict[str, Any]:
    return {"data": payload}


def paginated(items: list[Any], page: int, page_size: int, total: int) -> dict[str, Any]:
    return {"items": items, "page": page, "pageSize": page_size, "total": total}
