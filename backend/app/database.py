import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default to local SQLite database if DATABASE_URL is not set in environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./campusbite.db")

# SQLite requires check_same_thread=False because FastAPI handles requests across multiple threads
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Yield a database session per request and cleanly close it when finished."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
