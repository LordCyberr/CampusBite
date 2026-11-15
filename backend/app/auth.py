"""
Authentication utilities for CampusBite:
- Password hashing and verification with native bcrypt.
- JWT token generation and decoding.
- FastAPI dependencies for current user resolution and role-based access control (RBAC).
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .database import get_db
from .models import User

# --- Environment Configurations ---
INSECURE_PLACEHOLDER_KEYS = {
    "campusbite_super_secret_jwt_key_change_in_production",
    "supersecretkey_change_in_production",
    "change-me",
    "your_secret_key_here",
}

def validate_secret_key(app_env: Optional[str] = None, secret_key: Optional[str] = None) -> str:
    """
    Validates that SECRET_KEY is securely configured when APP_ENV is 'production'.
    In production: raises RuntimeError if SECRET_KEY is missing, empty, or a known placeholder.
    In development/test: falls back to default development key if missing.
    """
    env = (app_env if app_env is not None else os.getenv("APP_ENV", "development")).strip().lower()
    raw_secret = secret_key if secret_key is not None else os.getenv("SECRET_KEY")

    if env == "production":
        if not raw_secret or not raw_secret.strip():
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: APP_ENV is set to 'production' "
                "but SECRET_KEY is missing or empty. A secure, random SECRET_KEY must be configured."
            )
        if raw_secret.strip() in INSECURE_PLACEHOLDER_KEYS:
            raise RuntimeError(
                f"CRITICAL SECURITY CONFIGURATION ERROR: APP_ENV is set to 'production' "
                f"but SECRET_KEY is still set to insecure placeholder '{raw_secret.strip()}'. "
                f"Set a strong, random SECRET_KEY before starting in production."
            )
        return raw_secret.strip()

    if raw_secret and raw_secret.strip():
        return raw_secret.strip()
    return "campusbite_super_secret_jwt_key_change_in_production"


def get_secret_key() -> str:
    """Returns the validated secret key for token operations."""
    return validate_secret_key()


SECRET_KEY = validate_secret_key()
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# HTTP Bearer scheme with auto_error=False so we return explicit 401 errors
security_bearer = HTTPBearer(auto_error=False)


# --- Password Hashing (bcrypt) ---

def hash_password(password: str) -> str:
    """Hash plain text password with a fresh bcrypt salt."""
    salt = bcrypt.gensalt()
    # bcrypt operates on raw bytes; decode back to utf-8 string for DB storage
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a stored bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# --- JWT Token Management ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token containing subject and custom claims."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, get_secret_key(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    return jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])


# --- FastAPI Auth Dependencies ---

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Extract Bearer token from Authorization header, validate signature,
    and load the current User from the database. Raises 401 on any failure.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except (JWTError, Exception):
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*allowed_roles: str):
    """
    Dependency factory that enforces role-based access control (RBAC).
    Returns 403 Forbidden if the authenticated user's role is not permitted.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker
