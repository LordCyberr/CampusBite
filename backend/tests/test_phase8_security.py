"""
Phase 8 Security Tests:
Validates production startup enforcement for SECRET_KEY and APP_ENV.
"""
import pytest
from app.auth import validate_secret_key, INSECURE_PLACEHOLDER_KEYS


def test_production_secret_key_missing_raises_error():
    """APP_ENV=production must refuse to start if SECRET_KEY is missing or empty."""
    with pytest.raises(RuntimeError) as exc_info:
        validate_secret_key(app_env="production", secret_key="")
    assert "CRITICAL SECURITY CONFIGURATION ERROR" in str(exc_info.value)
    assert "missing or empty" in str(exc_info.value)

    with pytest.raises(RuntimeError) as exc_info2:
        validate_secret_key(app_env="production", secret_key=None)
    assert "CRITICAL SECURITY CONFIGURATION ERROR" in str(exc_info2.value)


def test_production_secret_key_placeholder_raises_error():
    """APP_ENV=production must refuse to start if SECRET_KEY is a placeholder."""
    for placeholder in INSECURE_PLACEHOLDER_KEYS:
        with pytest.raises(RuntimeError) as exc_info:
            validate_secret_key(app_env="production", secret_key=placeholder)
        assert "CRITICAL SECURITY CONFIGURATION ERROR" in str(exc_info.value)
        assert "insecure placeholder" in str(exc_info.value)


def test_production_secret_key_valid_succeeds():
    """APP_ENV=production succeeds when given a strong, non-placeholder secret key."""
    strong_key = "a_very_secure_and_random_production_secret_key_32bytes"
    result = validate_secret_key(app_env="production", secret_key=strong_key)
    assert result == strong_key


def test_development_mode_allows_default_and_placeholders():
    """APP_ENV=development allows missing keys and placeholders for developer convenience."""
    # Empty falls back to dev default
    dev_default = validate_secret_key(app_env="development", secret_key="")
    assert dev_default == "campusbite_super_secret_jwt_key_change_in_production"

    # Placeholder is accepted in development
    placeholder_val = validate_secret_key(app_env="development", secret_key="change-me")
    assert placeholder_val == "change-me"


@pytest.mark.anyio
async def test_fastapi_lifespan_enforces_production_check():
    """FastAPI startup lifespan must raise RuntimeError when misconfigured in production."""
    import os
    from app.main import lifespan, app

    old_env = os.environ.get("APP_ENV")
    old_secret = os.environ.get("SECRET_KEY")

    try:
        os.environ["APP_ENV"] = "production"
        os.environ["SECRET_KEY"] = "change-me"

        with pytest.raises(RuntimeError) as exc_info:
            async with lifespan(app):
                pass
        assert "CRITICAL SECURITY CONFIGURATION ERROR" in str(exc_info.value)
    finally:
        if old_env is not None:
            os.environ["APP_ENV"] = old_env
        else:
            os.environ.pop("APP_ENV", None)

        if old_secret is not None:
            os.environ["SECRET_KEY"] = old_secret
        else:
            os.environ.pop("SECRET_KEY", None)
