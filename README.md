# Mirabilis Data API

mongodb+srv://<db_username>:<password@mirabilis.sc5wiil.mongodb.net/?appName=Mirabilis
use this api

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/be2e46c5-738b-43f9-969a-811425eb8a0b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Backend (FastAPI + MongoDB)

The admin/content API lives in `backend/`. It's a separate Python service —
run it alongside `npm run dev` for the admin experience under `/admin/*` to work.

```sh
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # then edit JWT_SECRET / SECRETS_ENCRYPTION_KEY for anything beyond local dev

# requires a local Mongo (or `docker compose up mongo` from the repo root)
python -m scripts.seed_admin   # creates the initial super_admin from SEED_ADMIN_EMAIL/PASSWORD

uvicorn app.main:app --reload --port 8000
```

Or everything at once via Docker:

```sh
docker compose up --build
```

API docs: `http://localhost:8000/docs`. Full endpoint list, schema, and
architecture notes are in `docs/` (`techspec.md`, `schema.md`, `security.md`,
`architecture.md`). `docs/tracker.md` is the up-to-date build-progress
checklist — read that first to see what's implemented vs. still open.

**Tests / lint:**

```sh
cd backend
pytest -q            # 43 tests
ruff check app/ scripts/ tests/
mypy --explicit-package-bases app/
```

**First login:** the seeded super_admin has `mustChangePassword: true` — call
`POST /api/v1/auth/change-password` (or use the admin UI) before relying on
that account for anything beyond initial setup.
