"""Find and optionally delete media documents with referenceCount == 0.

Dry-run by default — reports what WOULD be deleted. Pass --apply to actually
delete physical files and documents (security.md / master prompt section 5).

Usage:
  python -m scripts.cleanup_orphaned_files            # dry run, reports only
  python -m scripts.cleanup_orphaned_files --apply     # actually deletes
"""

import argparse
import asyncio
import os

from app.core.config import get_settings
from app.core.db import get_db


async def main(apply: bool) -> None:
    settings = get_settings()
    db = get_db()
    cursor = db["media"].find({"referenceCount": {"$lte": 0}})

    orphans = [doc async for doc in cursor]
    print(f"Found {len(orphans)} orphaned media document(s).")

    for doc in orphans:
        key = doc.get("key", "")
        print(f"  - {doc['_id']}  key={key}")
        if apply:
            path = os.path.join(settings.storage_local_path, key)
            if settings.storage_driver == "local" and os.path.exists(path):
                os.remove(path)
            await db["media"].delete_one({"_id": doc["_id"]})

    if not apply:
        print("\nDry run only — no files or documents were deleted. Re-run with --apply to delete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Actually delete orphaned files/documents")
    args = parser.parse_args()
    asyncio.run(main(args.apply))
