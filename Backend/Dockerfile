FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Install build and runtime dependencies for PostgreSQL and healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create a non-privileged user and group for security
RUN groupadd -g 1001 appuser && \
    useradd -u 1001 -g appuser -s /bin/sh -m appuser

# Copy source code and set ownership
COPY --chown=appuser:appuser . .

# Ensure start.sh has executable permissions and Unix line endings
RUN chmod +x /app/start.sh

# Switch to non-root user
USER appuser

# Expose FastAPI port
EXPOSE 8000

# Health check to ensure the application is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command to start server using start.sh (auto-switches dev vs prod)
CMD ["sh", "start.sh"]
