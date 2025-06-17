FROM python:3.12-slim-bookworm AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy only dependency files first for better caching
COPY pyproject.toml uv.lock ./

# Install dependencies (no dev, no project install)
RUN uv sync --locked --no-install-project --no-dev

# Now copy the rest of the code
COPY . .

# Install the project itself (if needed, e.g., if using poetry/pyproject with [project])
# RUN uv pip install --editable .

FROM python:3.12-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app

COPY --from=builder /app /app

ENV PATH="/app/.venv/bin:$PATH"
ENV S2_ANALYZER_CONF=./deployment/config.yaml

EXPOSE 8001/tcp


# CMD ["ls"]
# CMD ["python3", "-m", "s2_analyzer_backend.main"]
# CMD ["uv", "run", "--system", "s2_analyzer_backend/main.py"]
# CMD ["uv", "pip", "run", "python3", "-m", "s2_analyzer_backend.main"]
CMD ["./docker_run.sh"]