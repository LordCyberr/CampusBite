# ==============================================================================
# CampusBite Backend Dockerfile
# Multi-stage / optimized slim Python build for production deployment
# Base image matches local Python 3.11.9 runtime
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-privileged user and group for running the application securely.
# Running as root inside a container violates the principle of least privilege.
RUN addgroup --system --gid 10001 appgroup && \
    adduser --system --uid 10001 --gid 10001 --no-create-home appuser

# Install dependencies first to leverage Docker layer caching.
# If application code changes, this step is skipped on rebuilds.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code and database seeders
COPY app ./app
COPY seed.py .
COPY seed_demo_users.py .

# Create directories for persistent database storage and application logs.
# Set ownership to the non-root appuser so SQLite and logging can write safely.
RUN mkdir -p /data /app/logs && \
    chown -R appuser:appgroup /data /app/logs /app

# Switch to the non-root user
USER appuser

# Expose internal API port
EXPOSE 8000

# Container healthcheck:
# Uses Python's standard library urllib.request rather than curl,
# because python:3.11-slim omits curl to minimize image size and CVE surface.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').getcode() == 200 else 1)"

# Start Uvicorn ASGI server:
# Note on --host 0.0.0.0: Inside a Docker container, binding to 127.0.0.1 (localhost)
# would restrict traffic to processes inside the container only. Binding to 0.0.0.0
# tells Uvicorn to listen on all container network interfaces, allowing Docker's port
# forwarding from the host machine (e.g. 8000:8000) to successfully reach the app.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
