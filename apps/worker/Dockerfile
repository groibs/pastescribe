FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir uv==0.11.18

WORKDIR /app
COPY pyproject.toml ./
COPY src ./src
RUN uv sync --no-dev

RUN useradd --create-home --uid 10001 worker \
    && mkdir -p /tmp/pastescribe-worker \
    && chown -R worker:worker /app /tmp/pastescribe-worker
USER worker

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl --fail http://127.0.0.1:8001/health || exit 1

CMD ["uv", "run", "uvicorn", "pastescribe_worker.app:app", "--host", "0.0.0.0", "--port", "8001"]
