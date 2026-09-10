from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        uri = settings.mongodb_uri
        if ("localhost" in uri or "127.0.0.1" in uri) and not uri.startswith("mongodb+srv"):
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            is_open = (sock.connect_ex(('127.0.0.1', 27017)) == 0)
            sock.close()
            if not is_open:
                import mongomock_motor
                print("[DB Info] Local MongoDB (27017) is offline. Using in-memory MongoMock database.")
                _client = mongomock_motor.AsyncMongoMockClient()
                return _client
        _client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    settings = get_settings()
    return get_client()[settings.db_name]


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


INDEXES: dict[str, list[tuple[list[tuple[str, int]], dict]]] = {
    "users": [([("email", 1)], {"unique": True})],
    "refresh_tokens": [
        ([("expiresAt", 1)], {"expireAfterSeconds": 0}),
        ([("userId", 1)], {}),
    ],
    "password_reset_tokens": [([("expiresAt", 1)], {"expireAfterSeconds": 0})],
    "leads": [([("status", 1)], {}), ([("createdAt", -1)], {})],
    "services": [([("slug", 1)], {"unique": True}), ([("state", 1)], {})],
    "projects": [([("slug", 1)], {"unique": True}), ([("state", 1)], {})],
    "products": [([("slug", 1)], {"unique": True}), ([("state", 1)], {})],
    "industries": [([("slug", 1)], {"unique": True}), ([("state", 1)], {})],
    "categories": [([("type", 1), ("slug", 1)], {"unique": True})],
    "blog_posts": [
        ([("slug", 1)], {"unique": True}),
        ([("externalId", 1)], {"unique": True, "sparse": True}),
        ([("state", 1)], {}),
    ],
    "media": [([("category", 1)], {}), ([("referenceCount", 1)], {})],
    "clients": [([("visible", 1)], {})],
    "partners": [([("visible", 1)], {})],
    "team_members": [([("visible", 1)], {})],
    "testimonials": [([("visible", 1)], {})],
    "pricing_plans": [([("visible", 1)], {})],
    "hero_slides": [([("visible", 1)], {}), ([("sortOrder", 1)], {})],
    "gallery_items": [([("visible", 1)], {}), ([("categories", 1)], {})],
    "faqs": [([("visible", 1)], {}), ([("group", 1)], {})],
    "statistics": [([("visible", 1)], {})],
    "lead_notes": [([("leadId", 1)], {})],
    "blogger_sync_runs": [([("startedAt", -1)], {})],
    "notifications": [([("userId", 1), ("read", 1)], {})],
    "activity_logs": [([("createdAt", -1)], {}), ([("actorId", 1)], {})],
}


async def ensure_indexes() -> None:
    """Create all indexes declared in INDEXES. Safe to call repeatedly (idempotent)."""
    global _client
    client = get_client()
    try:
        await client.admin.command('ping')
    except Exception:
        import mongomock_motor
        print("[DB Info] Local MongoDB not reachable. Using in-memory MongoMock fallback.")
        _client = mongomock_motor.AsyncMongoMockClient()
        client = _client

    db = get_db()
    for collection_name, specs in INDEXES.items():
        collection = db[collection_name]
        for keys, options in specs:
            try:
                await collection.create_index(keys, **options)
            except Exception:
                pass
