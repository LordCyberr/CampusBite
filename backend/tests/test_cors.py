"""
CORS Middleware Verification Tests for CampusBite.
Proves that requests from allowed origins (e.g. Vite frontend) receive Access-Control-Allow-Origin headers,
while unauthorized origins do not receive CORS authorization headers.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_cors_allowed_origin_gets_header():
    """Request with allowed Origin gets access-control-allow-origin response header."""
    headers = {"Origin": "http://localhost:5173"}
    resp = client.get("/health", headers=headers)
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert resp.headers.get("access-control-allow-credentials") == "true"


def test_cors_random_origin_does_not_get_header():
    """Request with unauthorized random Origin does not get access-control-allow-origin header."""
    headers = {"Origin": "http://random-unauthorized-site.com"}
    resp = client.get("/health", headers=headers)
    assert resp.status_code == 200
    assert "access-control-allow-origin" not in resp.headers
