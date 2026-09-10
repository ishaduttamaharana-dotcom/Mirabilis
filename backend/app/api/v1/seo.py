from datetime import datetime
from typing import Any

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.core.content_registry import COLLECTIONS
from app.core.db import get_db
from app.repositories.content_repository import ContentRepository
from app.repositories.site_settings import SiteSettingsRepository

router = APIRouter(tags=["seo"])

# Static public routes from webflow.md that aren't backed by a CMS collection.
_STATIC_ROUTES = ["/", "/about", "/services", "/work", "/pricing", "/blog", "/contact", "/privacy", "/terms"]

# collection name -> (url prefix, whether it has a slug)
_SLUGGED_PUBLIC_COLLECTIONS = [
    ("services", "/services"),
    ("projects", "/work"),
    ("industries", "/industries"),
    ("blog_posts", "/blog"),
]


async def _frontend_base_url() -> str:
    from app.core.config import get_settings

    settings_doc = await SiteSettingsRepository(get_db()).get()
    if settings_doc and settings_doc.get("frontendBaseUrl"):
        return str(settings_doc["frontendBaseUrl"]).rstrip("/")
    return get_settings().frontend_base_url.rstrip("/")


@router.get("/sitemap.xml")
async def sitemap() -> PlainTextResponse:
    base = await _frontend_base_url()
    db = get_db()
    urls: list[dict[str, Any]] = [{"loc": f"{base}{p}"} for p in _STATIC_ROUTES]

    for collection_name, url_prefix in _SLUGGED_PUBLIC_COLLECTIONS:
        spec = COLLECTIONS[collection_name]
        repo = ContentRepository(db, collection_name)
        items, _total = await repo.list(
            page=1, page_size=1000, sort=("updatedAt", -1), filters=dict(spec["public_filter"])
        )
        for item in items:
            slug = item.get("slug")
            if not slug:
                continue
            entry: dict[str, Any] = {"loc": f"{base}{url_prefix}/{slug}"}
            updated_at = item.get("updatedAt")
            if isinstance(updated_at, datetime):
                entry["lastmod"] = updated_at.date().isoformat()
            urls.append(entry)

    body_lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for entry in urls:
        body_lines.append("  <url>")
        body_lines.append(f"    <loc>{entry['loc']}</loc>")
        if "lastmod" in entry:
            body_lines.append(f"    <lastmod>{entry['lastmod']}</lastmod>")
        body_lines.append("  </url>")
    body_lines.append("</urlset>")

    return PlainTextResponse("\n".join(body_lines), media_type="application/xml")


@router.get("/robots.txt")
async def robots() -> PlainTextResponse:
    base = await _frontend_base_url()
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        f"Sitemap: {base}/sitemap.xml",
    ]
    return PlainTextResponse("\n".join(lines), media_type="text/plain")
