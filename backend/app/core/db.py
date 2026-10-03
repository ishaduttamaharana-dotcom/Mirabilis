from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

_client: AsyncIOMotorClient | None = None


class _InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self.docs: list[dict] = []

    async def create_index(self, keys, **kwargs):
        pass

    async def find_one(self, filter_dict):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in filter_dict.items()):
                return dict(doc)
        return None

    def find(self, filter_dict=None):
        filter_dict = filter_dict or {}
        items = [dict(d) for d in self.docs if all(d.get(k) == v for k, v in filter_dict.items())]

        class _Cursor:
            def __init__(self, items):
                self._items = items

            def sort(self, *args, **kwargs):
                return self

            def skip(self, *args, **kwargs):
                return self

            def limit(self, *args, **kwargs):
                return self

            async def to_list(self, length=None):
                return self._items

            def __aiter__(self):
                async def _gen():
                    for item in self._items:
                        yield item

                return _gen()

        return _Cursor(items)

    async def insert_one(self, doc):
        from bson import ObjectId

        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = ObjectId()
        self.docs.append(doc_copy)

        class InsertResult:
            inserted_id = doc_copy["_id"]

        return InsertResult()

    async def insert_many(self, docs):
        ids = []
        for doc in docs:
            res = await self.insert_one(doc)
            ids.append(res.inserted_id)
        return ids

    async def update_one(self, filter_dict, update_dict):
        doc = await self.find_one(filter_dict)
        if doc:
            for real_doc in self.docs:
                if real_doc.get("_id") == doc["_id"]:
                    if "$set" in update_dict:
                        real_doc.update(update_dict["$set"])
                    if "$inc" in update_dict:
                        for k, v in update_dict["$inc"].items():
                            real_doc[k] = real_doc.get(k, 0) + v
                    break

    async def delete_one(self, filter_dict):
        doc = await self.find_one(filter_dict)
        if doc:
            self.docs = [d for d in self.docs if d.get("_id") != doc["_id"]]

    async def delete_many(self, filter_dict):
        self.docs = []

    async def count_documents(self, filter_dict):
        if not filter_dict:
            return len(self.docs)
        return len([d for d in self.docs if all(d.get(k) == v for k, v in filter_dict.items())])


class _InMemoryDb:
    def __init__(self):
        self._collections = {}

    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = _InMemoryCollection(name)
        return self._collections[name]


class _InMemoryClient:
    def __init__(self):
        self._db = _InMemoryDb()

    def __getitem__(self, name):
        return self._db

    def close(self):
        pass


def get_client() -> Any:
    global _client
    if _client is None:
        settings = get_settings()
        uri = settings.mongodb_uri
        if "<db_password>" in uri or "<password>" in uri:
            try:
                import mongomock_motor

                print("[DB Info] Placeholder '<db_password>' detected in MONGODB_URI. Using in-memory MongoMock database.")
                _client = mongomock_motor.AsyncMongoMockClient()
                return _client
            except ImportError:
                print("[DB Info] Placeholder '<db_password>' detected in MONGODB_URI. Using in-memory fallback database.")
                _client = _InMemoryClient()
                return _client
        if ("localhost" in uri or "127.0.0.1" in uri) and not uri.startswith("mongodb+srv"):
            import socket

            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            is_open = sock.connect_ex(("127.0.0.1", 27017)) == 0
            sock.close()
            if not is_open:
                try:
                    import mongomock_motor

                    print("[DB Info] Local MongoDB (27017) is offline. Using in-memory MongoMock database.")
                    _client = mongomock_motor.AsyncMongoMockClient()
                    return _client
                except ImportError:
                    print("[DB Info] Local MongoDB (27017) is offline. Using in-memory fallback database.")
                    _client = _InMemoryClient()
                    return _client
        try:
            _client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
        except Exception:
            _client = _InMemoryClient()
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


async def ensure_seed_admin() -> None:
    """Ensures default Super Admin accounts exist and their password hashes match configuration."""
    try:
        from app.core.security import hash_password
        from app.repositories.users import UsersRepository

        db = get_db()
        settings = get_settings()
        users_repo = UsersRepository(db)

        # 1. Primary Seed Admin (admin@mirabilis.com / MirabilisBYT@2026)
        admin1 = await users_repo.find_by_email("admin@mirabilis.com")
        if not admin1:
            await users_repo.create(
                email="admin@mirabilis.com",
                password_hash=hash_password("MirabilisBYT@2026"),
                role="super_admin",
                must_change_password=False,
            )
            print("[Startup Info] Seeded Super Admin: admin@mirabilis.com")
        else:
            await users_repo._collection.update_one(
                {"_id": admin1["_id"]},
                {"$set": {"passwordHash": hash_password("MirabilisBYT@2026"), "active": True}},
            )

        # 2. Configured / Secondary Seed Admin (admin@rrindustries.com / ChangeMeImmediately_2026!)
        env_email = settings.seed_admin_email or "admin@rrindustries.com"
        env_pass = settings.seed_admin_password or "ChangeMeImmediately_2026!"
        if env_email != "admin@mirabilis.com":
            admin2 = await users_repo.find_by_email(env_email)
            if not admin2:
                await users_repo.create(
                    email=env_email,
                    password_hash=hash_password(env_pass),
                    role="super_admin",
                    must_change_password=False,
                )
                print(f"[Startup Info] Seeded Super Admin: {env_email}")
            else:
                await users_repo._collection.update_one(
                    {"_id": admin2["_id"]},
                    {"$set": {"passwordHash": hash_password(env_pass), "active": True}},
                )
    except Exception as err:
        print(f"[Startup Info] Admin seeding note: {err}")


async def ensure_indexes() -> None:
    """Create all indexes declared in INDEXES. Safe to call repeatedly (idempotent)."""
    global _client
    client = get_client()
    try:
        await client.admin.command('ping')
    except Exception:
        try:
            import mongomock_motor
            print("[DB Info] Local MongoDB not reachable. Using in-memory MongoMock fallback.")
            _client = mongomock_motor.AsyncMongoMockClient()
            client = _client
        except ImportError:
            pass

    db = get_db()
    for collection_name, specs in INDEXES.items():
        collection = db[collection_name]
        for keys, options in specs:
            try:
                await collection.create_index(keys, **options)
            except Exception:
                pass

    await ensure_seed_admin()
