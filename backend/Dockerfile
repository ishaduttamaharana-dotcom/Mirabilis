# --- Builder stage: install deps into a venv, keep build tools out of the runtime image ---
FROM python:3.12-slim AS builder

WORKDIR /app

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
# Runtime image doesn't need pytest/ruff/mypy — strip the dev-only block so
# production stays lean.
RUN grep -v -E "^(pytest|ruff|mypy)" requirements.txt > requirements.prod.txt \
    && pip install --no-cache-dir -r requirements.prod.txt

# --- Runtime stage ---
FROM python:3.12-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/false appuser

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY app ./app
COPY scripts ./scripts

# Local-dev media storage lives here (STORAGE_LOCAL_PATH); in production this
# should be a mounted volume or STORAGE_DRIVER=s3 instead — see storage.py.
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Multiple workers for production concurrency; override with $WEB_CONCURRENCY
# if the deployment target sizes CPU differently.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-2}"]
