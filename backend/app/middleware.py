import os
import time
import uuid
import logging
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

# Set up logger for HTTP request logging
logger = logging.getLogger("campusbite.request")
logger.setLevel(logging.INFO)

# Ensure handlers are attached only once
if not logger.handlers:
    # Ensure logs directory exists in current working directory
    os.makedirs("logs", exist_ok=True)
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler: writes to logs/app.log
    file_handler = logging.FileHandler(os.path.join("logs", "app.log"), encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that tracks every HTTP request:
    - Generates a short unique request ID (X-Request-ID).
    - Measures request duration in milliseconds (X-Process-Time-ms).
    - Logs method, path, status, duration, and request ID.
    - Strictly avoids logging passwords, tokens, Authorization headers, or request bodies.
    - Catches unhandled exceptions, logs them with request ID, and returns a clean 500 response.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate an 8-character unique request ID
        request_id = uuid.uuid4().hex[:8]
        request.state.request_id = request_id
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            # Attach performance and tracing headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time-ms"] = f"{duration_ms:.2f}"

            # Log one clean line: method, path, status code, duration, request ID
            logger.info(
                f"[{request_id}] {request.method} {request.url.path} {response.status_code} {duration_ms:.2f}ms"
            )
            return response

        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            # Log the unexpected error with request ID and traceback
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} 500 {duration_ms:.2f}ms - Unhandled exception: {exc}",
                exc_info=True,
            )

            # Return a safe, sanitized 500 JSON response containing only the request ID
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error. Something went wrong.",
                    "request_id": request_id,
                },
                headers={
                    "X-Request-ID": request_id,
                    "X-Process-Time-ms": f"{duration_ms:.2f}",
                },
            )
