"""In-process sliding-window rate limiter.

Good enough for a single-instance deployment and for the dev/local case this
sandbox can actually exercise. It is NOT correct across multiple API
instances (each process has its own counters) — production with >1 replica
needs a shared store (Redis INCR+EXPIRE is the standard pattern). Documented
as a known limitation in security.md; swap `_HITS` for a Redis-backed
implementation before scaling horizontally.
"""

import time
from collections import defaultdict
from collections.abc import Callable

from fastapi import Request

from app.utils.envelope import ApiError

_HITS: dict[str, list[float]] = defaultdict(list)


def rate_limit(key_prefix: str, max_per_minute: int) -> Callable[[Request], None]:
    def dependency(request: Request) -> None:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.headers.get("x-real-ip"):
            client_ip = request.headers.get("x-real-ip", "").strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        key = f"{key_prefix}:{client_ip}"
        now = time.monotonic()
        window_start = now - 60
        hits = [t for t in _HITS[key] if t > window_start]
        if len(hits) >= max_per_minute:
            oldest_hit = hits[0]
            retry_after = max(1, int(60 - (now - oldest_hit)))
            raise ApiError(
                429,
                "RATE_LIMITED",
                f"Upload requests are temporarily rate limited — retry in {retry_after}s",
                fields={"retryAfter": str(retry_after)},
            )
        hits.append(now)
        _HITS[key] = hits

    return dependency
