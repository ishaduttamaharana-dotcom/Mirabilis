import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, health
from app.api.v1.activity_log import router as activity_log_router
from app.api.v1.blogger_sync import router as blogger_sync_router
from app.api.v1.contact import router as contact_router
from app.api.v1.content import all_admin_routers, all_public_routers
from app.api.v1.leads import router as leads_router
from app.api.v1.media import router as media_router
from app.api.v1.seo import router as seo_router
from app.api.v1.settings import router as settings_router
from app.core.config import get_settings
from app.core.db import close_client, ensure_indexes
from app.tasks.blogger_sync_loop import blogger_sync_loop
from app.utils.envelope import ApiError, api_error_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ensure_indexes()
    except Exception as err:
        print(f"[Startup Info] Database initialization note: {err}")
    yield
    await close_client()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
        openapi_url=f"{settings.api_prefix}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(ApiError, api_error_handler)  # type: ignore[arg-type]

    @app.get("/", response_class=HTMLResponse)
    @app.get("/admin", response_class=HTMLResponse)
    async def root_portal():
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mirabilis CMS Backend Portal</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }}
    .card {{
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
      max-width: 560px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }}
    .dot {{ width: 8px; height: 8px; background: #10b981; border-radius: 50%; }}
    h1 {{ font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }}
    p {{ color: #94a3b8; font-size: 15px; line-height: 1.5; margin-bottom: 28px; }}
    .grid {{ display: grid; gap: 12px; margin-bottom: 28px; }}
    .btn {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.2s ease;
    }}
    .btn-primary {{ background: #e11d48; color: #ffffff; }}
    .btn-primary:hover {{ background: #f43f5e; transform: translateY(-1px); }}
    .btn-secondary {{ background: #334155; color: #f8fafc; }}
    .btn-secondary:hover {{ background: #475569; transform: translateY(-1px); }}
    .creds {{
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 16px;
      font-size: 13px;
      color: #cbd5e1;
    }}
    .creds strong {{ color: #f43f5e; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Backend Active & Listening</div>
    <h1>Mirabilis CMS Backend</h1>
    <p>FastAPI server is running on <code>http://localhost:8000</code>. Access the admin dashboard or interactive API endpoints below.</p>
    
    <div class="grid">
      <a href="{settings.frontend_base_url}/admin" class="btn btn-primary">
        <span>🚀 Open Admin Dashboard</span>
        <span>→</span>
      </a>
      <a href="/docs" class="btn btn-secondary">
        <span>📖 Swagger API Documentation</span>
        <span>→</span>
      </a>
      <a href="/redoc" class="btn btn-secondary">
        <span>📚 ReDoc API Reference</span>
        <span>→</span>
      </a>
      <a href="/api/v1/health" class="btn btn-secondary">
        <span>🟢 Server Health Status</span>
        <span>→</span>
      </a>
    </div>

    <div class="creds">
      <div><strong>Default Admin Email:</strong> admin@rrindustries.com</div>
      <div style="margin-top: 4px;"><strong>Default Admin Password:</strong> ChangeMeImmediately_2026!</div>
    </div>
  </div>
</body>
</html>"""
        return HTMLResponse(content=html_content)

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(media_router, prefix=settings.api_prefix)
    app.include_router(leads_router, prefix=settings.api_prefix)
    app.include_router(contact_router, prefix=settings.api_prefix)
    app.include_router(activity_log_router, prefix=settings.api_prefix)
    app.include_router(settings_router, prefix=settings.api_prefix)
    app.include_router(blogger_sync_router, prefix=settings.api_prefix)
    # sitemap.xml / robots.txt are conventionally served from the site root,
    # not under /api/v1 — mounted separately, unprefixed.
    app.include_router(seo_router)

    for router in all_admin_routers():
        app.include_router(router, prefix=settings.api_prefix)
    for router in all_public_routers():
        app.include_router(router, prefix=settings.api_prefix)

    from fastapi.staticfiles import StaticFiles
    from pathlib import Path

    uploads_dir = Path(settings.storage_local_path)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
    app.mount("/api/v1/uploads", StaticFiles(directory=uploads_dir), name="api_v1_uploads")

    return app


app = create_app()
