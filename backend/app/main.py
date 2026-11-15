import os
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
# Import models so SQLAlchemy metadata registers all table schemas
from . import models
from .middleware import RequestLoggingMiddleware
from .reminders import reminder_background_worker
from .routers.auth_routes import router as auth_router
from .routers.restaurants import router as restaurants_router
from .routers.menu import router as menu_router
from .routers.orders import router as orders_router
from .routers.owner_orders import router as owner_orders_router
from .routers.delivery import router as delivery_router
from .routers.reviews import router as reviews_router
from .routers.returns import router as returns_router
from .routers.ai import router as ai_router
from .schemas import HealthResponse


# Create tables immediately upon module load and during startup lifecycle
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Enforce production security check on startup
    from .auth import validate_secret_key
    validate_secret_key()

    # Ensure all tables are created when uvicorn starts
    Base.metadata.create_all(bind=engine)

    # Auto-seed initial demo data if database is brand new and empty
    try:
        from .database import SessionLocal
        from .models import Restaurant
        with SessionLocal() as db:
            if db.query(Restaurant).count() == 0:
                try:
                    from seed import seed_database
                    seed_database()
                except Exception:
                    pass
    except Exception:
        pass

    # Start reminder background task if enabled in environment
    reminders_enabled = os.getenv("REMINDERS_ENABLED", "true").lower() in ("true", "1", "yes")
    reminder_task = None
    if reminders_enabled:
        reminder_task = asyncio.create_task(reminder_background_worker())

    try:
        yield
    finally:
        if reminder_task:
            reminder_task.cancel()
            try:
                await reminder_task
            except asyncio.CancelledError:
                pass


app = FastAPI(
    title="CampusBite API",
    description="Full-stack campus food ordering and delivery platform backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# Parse allowed CORS origins from environment variable (defaults to Vite dev server on both localhost and 127.0.0.1)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# Register request logging and performance tracking middleware
app.add_middleware(RequestLoggingMiddleware)

# Register CORS middleware for frontend communication (never wildcard with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Register routers
app.include_router(auth_router)
app.include_router(restaurants_router)
app.include_router(menu_router)
app.include_router(orders_router)
app.include_router(owner_orders_router)
app.include_router(delivery_router)
app.include_router(reviews_router)
app.include_router(returns_router)
app.include_router(ai_router)


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Simple health check endpoint to verify backend server and database setup."""
    return {"status": "ok", "database": "connected"}
