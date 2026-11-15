import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_register_and_login_success():
    """Verify user registration and token generation upon login."""
    reg_data = {
        "name": "Alice Customer",
        "email": "alice@campus.edu",
        "password": "alicepassword123",
        "role": "customer",
    }
    # Register
    reg_res = client.post("/auth/register", json=reg_data)
    assert reg_res.status_code == 201
    user_body = reg_res.json()
    assert user_body["email"] == "alice@campus.edu"
    assert user_body["role"] == "customer"
    assert "id" in user_body
    # Ensure password hash is NEVER exposed
    assert "hashed_password" not in user_body
    assert "password" not in user_body

    # Login
    login_data = {"email": "alice@campus.edu", "password": "alicepassword123"}
    login_res = client.post("/auth/login", json=login_data)
    assert login_res.status_code == 200
    token_body = login_res.json()
    assert "access_token" in token_body
    assert token_body["token_type"] == "bearer"
    assert token_body["role"] == "customer"


def test_login_wrong_password_returns_401():
    """Verify wrong password is rejected with 401 Unauthorized."""
    login_data = {"email": "alice@campus.edu", "password": "wrongpassword"}
    res = client.post("/auth/login", json=login_data)
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_missing_or_fake_token_returns_401():
    """Verify protected endpoints reject missing or fraudulent tokens with 401."""
    # Missing token
    res_missing = client.get("/auth/me")
    assert res_missing.status_code == 401

    # Fake malformed token
    res_fake = client.get("/auth/me", headers={"Authorization": "Bearer fake.token.here"})
    assert res_fake.status_code == 401


def test_customer_calling_owner_only_returns_403():
    """Verify RBAC: a Customer attempting to access Owner-only route receives 403 Forbidden."""
    # Login as customer
    login_res = client.post(
        "/auth/login",
        json={"email": "alice@campus.edu", "password": "alicepassword123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to hit owner-only route
    res = client.get("/auth/owner-only", headers=headers)
    assert res.status_code == 403
    assert "Operation not permitted" in res.json()["detail"]


def test_each_role_can_reach_its_own_route():
    """Verify each role can access its permitted endpoints."""
    # 1. Customer
    c_login = client.post(
        "/auth/login",
        json={"email": "alice@campus.edu", "password": "alicepassword123"},
    )
    c_token = c_login.json()["access_token"]
    c_res = client.get("/auth/customer-only", headers={"Authorization": f"Bearer {c_token}"})
    assert c_res.status_code == 200
    assert c_res.json()["role"] == "customer"

    # 2. Restaurant Owner
    client.post(
        "/auth/register",
        json={
            "name": "Bob Owner",
            "email": "bob@diner.edu",
            "password": "bobpassword123",
            "role": "restaurant_owner",
        },
    )
    o_login = client.post(
        "/auth/login",
        json={"email": "bob@diner.edu", "password": "bobpassword123"},
    )
    o_token = o_login.json()["access_token"]
    o_res = client.get("/auth/owner-only", headers={"Authorization": f"Bearer {o_token}"})
    assert o_res.status_code == 200
    assert o_res.json()["role"] == "restaurant_owner"

    # 3. Delivery Partner
    client.post(
        "/auth/register",
        json={
            "name": "Charlie Runner",
            "email": "charlie@courier.edu",
            "password": "charliepassword123",
            "role": "delivery_partner",
        },
    )
    d_login = client.post(
        "/auth/login",
        json={"email": "charlie@courier.edu", "password": "charliepassword123"},
    )
    d_token = d_login.json()["access_token"]
    d_res = client.get("/auth/delivery-only", headers={"Authorization": f"Bearer {d_token}"})
    assert d_res.status_code == 200
    assert d_res.json()["role"] == "delivery_partner"


def test_duplicate_email_registration_returns_409():
    """Verify duplicate email registration is rejected with 409 Conflict."""
    res = client.post(
        "/auth/register",
        json={
            "name": "Alice Duplicate",
            "email": "alice@campus.edu",
            "password": "somepassword123",
            "role": "customer",
        },
    )
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"]


def test_password_hash_never_exposed_in_me():
    """Verify /auth/me returns user data without exposing hashed_password."""
    login_res = client.post(
        "/auth/login",
        json={"email": "alice@campus.edu", "password": "alicepassword123"},
    )
    token = login_res.json()["access_token"]
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_body = me_res.json()
    assert "hashed_password" not in me_body
    assert "password" not in me_body
    assert "$2b$" not in str(me_body)
