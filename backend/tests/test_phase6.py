"""
Phase 6 Automated Test Suite for CampusBite.
Covers:
1. Request Logging Middleware (X-Request-ID, X-Process-Time-ms, logs/app.log, sanitization, 500 handling)
2. Background Reminders (check_stuck_orders threshold, deduplication, updated_at logic)
3. Owner Reminders API (GET /owner/reminders, RBAC, is_still_pending, include_resolved)
4. AI Order Insights (RBAC, privacy isolation, zero orders, facts block math, error handling, rate limiting)
"""
import os
import time
import uuid
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.main import app
from app.models import AdminReminderLog, MenuItem, Order, OrderItem, OrderStatus, PaymentStatus, Restaurant, User, UserRole
from app.reminders import check_stuck_orders
from app.ai_insights import (
    calculate_order_facts,
    set_openai_client_override,
)
from app.routers.ai import reset_user_ai_rate_limits

client = TestClient(app, raise_server_exceptions=False)


# --- Mock Objects for OpenAI Testing ---

class MockMessage:
    def __init__(self, content: str):
        self.content = content


class MockChoice:
    def __init__(self, content: str):
        self.message = MockMessage(content)


class MockCompletion:
    def __init__(self, content: str):
        self.choices = [MockChoice(content)]


class FakeOpenAIClient:
    def __init__(self, response_text: str = "This is a simulated AI summary of your orders."):
        self.response_text = response_text
        self.calls = []
        self.chat = self.Chat(self)

    class Chat:
        def __init__(self, outer):
            self.completions = outer.Completions(outer)

    class Completions:
        def __init__(self, outer):
            self.outer = outer

        def create(self, model, messages, **kwargs):
            self.outer.calls.append({"model": model, "messages": messages, "kwargs": kwargs})
            return MockCompletion(self.outer.response_text)


class SimulatedRateLimitException(Exception):
    pass


class SimulatedTimeoutException(Exception):
    pass


class RateLimitClient:
    def __init__(self):
        self.calls = 0
        self.chat = self.Chat(self)

    class Chat:
        def __init__(self, outer):
            self.completions = outer.Completions(outer)

    class Completions:
        def __init__(self, outer):
            self.outer = outer

        def create(self, **kwargs):
            self.outer.calls += 1
            raise SimulatedRateLimitException("Simulated RateLimitError from OpenAI")


class TimeoutClient:
    def __init__(self):
        self.calls = 0
        self.chat = self.Chat(self)

    class Chat:
        def __init__(self, outer):
            self.completions = outer.Completions(outer)

    class Completions:
        def __init__(self, outer):
            self.outer = outer

        def create(self, **kwargs):
            self.outer.calls += 1
            raise SimulatedTimeoutException("Simulated APITimeoutError from OpenAI")


# --- Helper Fixtures ---

def get_auth_token(email: str, password: str = "password123", role: str = "customer", name: str = "Test User") -> str:
    """Registers user if not present, then returns JWT bearer token."""
    client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": password, "role": role},
    )
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


# --- 1. Middleware Tests ---

def test_middleware_headers_and_logging():
    """Verify that all responses include X-Request-ID and X-Process-Time-ms headers."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "X-Request-ID" in resp.headers
    assert "X-Process-Time-ms" in resp.headers
    req_id = resp.headers["X-Request-ID"]
    assert len(req_id) >= 6

    # Verify log output in logs/app.log
    log_path = os.path.join("logs", "app.log")
    assert os.path.exists(log_path)
    with open(log_path, "r", encoding="utf-8") as f:
        log_content = f.read()
    assert req_id in log_content
    assert "/health" in log_content


def test_middleware_does_not_log_passwords_or_tokens():
    """Verify passwords, authorization tokens, and credentials never leak into app.log."""
    secret_pass = "UltraSecretPassword987!"
    unique_email = f"mid_sec_{uuid.uuid4().hex[:6]}@campus.edu"
    resp = client.post(
        "/auth/register",
        json={"name": "Log Test", "email": unique_email, "password": secret_pass, "role": "customer"},
    )
    assert resp.status_code == 201

    log_path = os.path.join("logs", "app.log")
    with open(log_path, "r", encoding="utf-8") as f:
        log_content = f.read()

    # Passwords and request bodies must NOT be logged
    assert secret_pass not in log_content


def test_middleware_unexpected_error_handling():
    """Verify that an unhandled route error returns a clean 500 with request_id."""
    # Temporarily define a failing endpoint to test the 500 middleware handler
    @app.get("/test-crash-endpoint")
    def crash_route():
        raise RuntimeError("Simulated internal server crash!")

    resp = client.get("/test-crash-endpoint")
    assert resp.status_code == 500
    assert "X-Request-ID" in resp.headers
    body = resp.json()
    assert "request_id" in body
    assert body["request_id"] == resp.headers["X-Request-ID"]
    assert "Something went wrong" in body["detail"]


# --- 2. Reminders Unit Tests ---

def test_stuck_orders_reminders_and_deduplication():
    """
    Test reminder creation and deduplication logic:
    - Stuck order (>15m) gets exactly 1 reminder
    - Second check does not duplicate it
    - Recent order (<15m) gets 0 reminders
    - DELIVERED order gets 0 reminders
    - Status change + getting stuck again gets a new reminder
    """
    db: Session = SessionLocal()
    try:
        # Create test owner & restaurant
        owner = User(
            name="Owner Remind",
            email=f"owner_rem_{uuid.uuid4().hex[:6]}@kitchen.edu",
            hashed_password="hash",
            role=UserRole.RESTAURANT_OWNER.value,
        )
        customer = User(
            name="Cust Remind",
            email=f"cust_rem_{uuid.uuid4().hex[:6]}@campus.edu",
            hashed_password="hash",
            role=UserRole.CUSTOMER.value,
        )
        db.add_all([owner, customer])
        db.commit()

        rest = Restaurant(name="Reminder Cafe", owner_id=owner.id)
        db.add(rest)
        db.commit()

        now = datetime.utcnow()

        # 1. Stuck in PLACED 20 minutes ago
        order_stuck = Order(
            customer_id=customer.id,
            restaurant_id=rest.id,
            status=OrderStatus.PLACED.value,
            delivery_address="Hostel 4",
            total_amount=25.0,
            created_at=now - timedelta(minutes=25),
            updated_at=now - timedelta(minutes=20),
        )

        # 2. Updated recently (5 minutes ago in PLACED)
        order_recent = Order(
            customer_id=customer.id,
            restaurant_id=rest.id,
            status=OrderStatus.PLACED.value,
            delivery_address="Hostel 4",
            total_amount=15.0,
            created_at=now - timedelta(minutes=5),
            updated_at=now - timedelta(minutes=5),
        )

        # 3. Stuck order in DELIVERED status (30 minutes ago)
        order_delivered = Order(
            customer_id=customer.id,
            restaurant_id=rest.id,
            status=OrderStatus.DELIVERED.value,
            delivery_address="Hostel 4",
            total_amount=35.0,
            created_at=now - timedelta(minutes=40),
            updated_at=now - timedelta(minutes=30),
        )

        db.add_all([order_stuck, order_recent, order_delivered])
        db.commit()

        # Run check
        reminders1 = check_stuck_orders(db, threshold_minutes=15)
        remind_order_ids = [r.order_id for r in reminders1]
        assert order_stuck.id in remind_order_ids
        assert order_recent.id not in remind_order_ids
        assert order_delivered.id not in remind_order_ids

        # Run check a second time -> should NOT duplicate
        reminders2 = check_stuck_orders(db, threshold_minutes=15)
        assert len(reminders2) == 0

        # Adjust the first reminder's timestamp to the past (35 mins ago) to reflect historical timeline
        for r in reminders1:
            r.created_at = now - timedelta(minutes=35)
        db.commit()

        # Now update order_stuck status to ACCEPTED 20 mins ago (which is AFTER reminder1 was issued)
        # and simulate it getting stuck again for 20 minutes (> 15m threshold)
        order_stuck.status = OrderStatus.ACCEPTED.value
        order_stuck.updated_at = now - timedelta(minutes=20)
        db.commit()

        reminders3 = check_stuck_orders(db, threshold_minutes=15)
        remind_order_ids3 = [r.order_id for r in reminders3]
        assert order_stuck.id in remind_order_ids3
        assert len(reminders3) == 1

    finally:
        db.close()


# --- 3. GET /owner/reminders API Tests ---

def test_get_owner_reminders_api_and_rbac():
    """Verify owner reminders API, RBAC, is_still_pending, and include_resolved query parameter."""
    db: Session = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        owner_email = f"owner_api_{suffix}@kitchen.edu"
        other_owner_email = f"other_owner_{suffix}@kitchen.edu"
        cust_email = f"cust_api_{suffix}@campus.edu"

        owner_token = get_auth_token(owner_email, role="restaurant_owner", name="Owner A")
        other_owner_token = get_auth_token(other_owner_email, role="restaurant_owner", name="Owner B")
        cust_token = get_auth_token(cust_email, role="customer", name="Customer A")

        # Create restaurants
        r1 = client.post("/restaurants", headers={"Authorization": f"Bearer {owner_token}"}, json={"name": "Rest A"}).json()
        r2 = client.post("/restaurants", headers={"Authorization": f"Bearer {other_owner_token}"}, json={"name": "Rest B"}).json()

        # Add an order and reminders directly
        owner_user = db.query(User).filter(User.email == owner_email).first()
        cust_user = db.query(User).filter(User.email == cust_email).first()

        order_pending = Order(
            customer_id=cust_user.id,
            restaurant_id=r1["id"],
            status=OrderStatus.PLACED.value,
            delivery_address="Room 101",
            total_amount=12.0,
            updated_at=datetime.utcnow() - timedelta(minutes=20),
        )
        order_resolved = Order(
            customer_id=cust_user.id,
            restaurant_id=r1["id"],
            status=OrderStatus.DELIVERED.value,
            delivery_address="Room 101",
            total_amount=18.0,
            updated_at=datetime.utcnow() - timedelta(minutes=20),
        )
        db.add_all([order_pending, order_resolved])
        db.commit()

        rem1 = AdminReminderLog(
            order_id=order_pending.id,
            restaurant_id=r1["id"],
            message=f"Order {order_pending.id} has been in PLACED for 20 minutes.",
        )
        rem2 = AdminReminderLog(
            order_id=order_resolved.id,
            restaurant_id=r1["id"],
            message=f"Order {order_resolved.id} has been in ACCEPTED for 25 minutes.",
        )
        db.add_all([rem1, rem2])
        db.commit()

        # 1. Customer calling /owner/reminders must get 403 Forbidden
        c_resp = client.get("/owner/reminders", headers={"Authorization": f"Bearer {cust_token}"})
        assert c_resp.status_code == 403

        # 2. Owner B sees 0 reminders for Owner A's restaurant
        b_resp = client.get("/owner/reminders", headers={"Authorization": f"Bearer {other_owner_token}"})
        assert b_resp.status_code == 200
        assert b_resp.json()["total_count"] == 0

        # 3. Owner A sees default (only pending reminders)
        a_resp = client.get("/owner/reminders", headers={"Authorization": f"Bearer {owner_token}"})
        assert a_resp.status_code == 200
        a_data = a_resp.json()
        assert a_data["total_count"] == 1
        assert a_data["items"][0]["order_id"] == order_pending.id
        assert a_data["items"][0]["is_still_pending"] is True
        assert a_data["items"][0]["order_status"] == OrderStatus.PLACED.value

        # 4. include_resolved=true returns both pending and resolved reminders
        all_resp = client.get("/owner/reminders?include_resolved=true", headers={"Authorization": f"Bearer {owner_token}"})
        assert all_resp.status_code == 200
        all_data = all_resp.json()
        assert all_data["total_count"] == 2
        order_statuses = {item["order_id"]: item["is_still_pending"] for item in all_data["items"]}
        assert order_statuses[order_pending.id] is True
        assert order_statuses[order_resolved.id] is False

    finally:
        db.close()


# --- 4. AI Order Insights Tests ---

def test_ai_facts_block_arithmetic():
    """Verify that Python correctly computes numerical facts and excludes cancelled/refunded."""
    now = datetime.utcnow()
    m1 = MenuItem(name="Veggie Burger", price=10.0, restaurant_id=1)
    m2 = MenuItem(name="French Fries", price=5.0, restaurant_id=1)

    # 5 test orders
    o1 = Order(
        id=1,
        status=OrderStatus.DELIVERED.value,
        total_amount=20.0,
        created_at=now - timedelta(days=2),
        items=[OrderItem(menu_item=m1, quantity=2, price_at_order=10.0)],
    )
    o2 = Order(
        id=2,
        status=OrderStatus.DELIVERED.value,
        total_amount=30.0,
        created_at=now - timedelta(days=10),
        items=[OrderItem(menu_item=m2, quantity=6, price_at_order=5.0)],
    )
    o3 = Order(
        id=3,
        status=OrderStatus.CANCELLED.value,  # Excluded from spend
        total_amount=15.0,
        created_at=now - timedelta(days=1),
        items=[OrderItem(menu_item=m1, quantity=1, price_at_order=10.0)],
    )
    o4 = Order(
        id=4,
        status=OrderStatus.REFUNDED.value,  # Excluded from spend
        total_amount=25.0,
        created_at=now - timedelta(days=3),
        items=[],
    )
    o5 = Order(
        id=5,
        status=OrderStatus.PLACED.value,
        total_amount=10.0,
        created_at=now - timedelta(hours=1),
        items=[OrderItem(menu_item=m1, quantity=1, price_at_order=10.0)],
    )

    facts = calculate_order_facts([o1, o2, o3, o4, o5])
    assert facts["total_orders"] == 5
    # Spend last 7 days: o1 ($20) + o5 ($10) = $30 (o2 is 10 days old, o3 cancelled, o4 refunded)
    assert facts["total_spent_last_7_days"] == 30.0
    # Total spend overall: o1 ($20) + o2 ($30) + o5 ($10) = $60.0
    assert facts["total_spent_overall"] == 60.0
    # Top dishes: Fries (6), Veggie Burger (2+1+1=4)
    top_dishes = {d["dish"]: d["quantity"] for d in facts["top_5_dishes"]}
    assert top_dishes["French Fries"] == 6
    assert top_dishes["Veggie Burger"] == 4
    # Undelivered orders: o3 (CANCELLED), o4 (REFUNDED), o5 (PLACED)
    undelivered_ids = [u["order_id"] for u in facts["undelivered_orders"]]
    assert 5 in undelivered_ids


def test_ai_rbac_and_zero_orders():
    """Verify owner/delivery get 403, and customer with zero orders gets friendly answer without calling OpenAI."""
    reset_user_ai_rate_limits()
    fake_client = FakeOpenAIClient()
    set_openai_client_override(fake_client)

    suffix = uuid.uuid4().hex[:6]
    owner_token = get_auth_token(f"ai_owner_{suffix}@kitchen.edu", role="restaurant_owner")
    courier_token = get_auth_token(f"ai_courier_{suffix}@campus.edu", role="delivery_partner")
    cust_token = get_auth_token(f"ai_cust_empty_{suffix}@campus.edu", role="customer")

    # Owners and delivery partners get 403
    assert client.post("/ai/insights", headers={"Authorization": f"Bearer {owner_token}"}).status_code == 403
    assert client.post("/ai/insights", headers={"Authorization": f"Bearer {courier_token}"}).status_code == 403

    # Customer with zero orders
    resp = client.post("/ai/insights", headers={"Authorization": f"Bearer {cust_token}"}, json={})
    assert resp.status_code == 200
    data = resp.json()
    assert data["orders_considered"] == 0
    assert "haven't placed any orders yet" in data["answer"]
    # Fake client must never have been called!
    assert len(fake_client.calls) == 0


def test_ai_privacy_isolation():
    """
    CRITICAL TEST: Ensure the prompt sent to OpenAI contains ONLY the calling customer's data
    and completely excludes any orders, totals, or dishes from other customers.
    """
    reset_user_ai_rate_limits()
    fake_client = FakeOpenAIClient(response_text="Customer A summary: you had the Special Samosa.")
    set_openai_client_override(fake_client)

    suffix = uuid.uuid4().hex[:6]
    cust_a_token = get_auth_token(f"cust_a_{suffix}@campus.edu", role="customer", name="Customer A")
    cust_b_token = get_auth_token(f"cust_b_{suffix}@campus.edu", role="customer", name="Customer B")
    owner_token = get_auth_token(f"owner_priv_{suffix}@kitchen.edu", role="restaurant_owner")

    # Setup restaurant and menu
    rest = client.post("/restaurants", headers={"Authorization": f"Bearer {owner_token}"}, json={"name": "Privacy Bistro"}).json()
    dish_a = client.post(f"/restaurants/{rest['id']}/menu", headers={"Authorization": f"Bearer {owner_token}"}, json={"name": "Special Samosa A", "price": 10.0}).json()
    dish_b = client.post(f"/restaurants/{rest['id']}/menu", headers={"Authorization": f"Bearer {owner_token}"}, json={"name": "Top Secret Biryani B", "price": 99.99}).json()

    # Customer A places an order
    client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_a_token}"},
        json={"restaurant_id": rest["id"], "delivery_address": "Hostel A", "items": [{"menu_item_id": dish_a["id"], "quantity": 1}]},
    )

    # Customer B places an order with distinct secret dish and price
    client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_b_token}"},
        json={"restaurant_id": rest["id"], "delivery_address": "Hostel B", "items": [{"menu_item_id": dish_b["id"], "quantity": 1}]},
    )

    # Customer A requests AI insights
    resp = client.post(
        "/ai/insights",
        headers={"Authorization": f"Bearer {cust_a_token}"},
        json={"question": "What have I eaten?"},
    )
    assert resp.status_code == 200
    assert len(fake_client.calls) == 1

    prompt_content = fake_client.calls[0]["messages"][1]["content"]

    # Prompt MUST contain Customer A's dish
    assert "Special Samosa A" in prompt_content
    # Prompt MUST NOT contain Customer B's confidential dish or prices
    assert "Top Secret Biryani B" not in prompt_content
    assert "99.99" not in prompt_content


def test_ai_error_handling_and_rate_limits(monkeypatch):
    """
    Test edge cases:
    - Missing OPENAI_API_KEY returns 503
    - Simulated RateLimitError retries once and returns 429
    - Simulated Timeout returns 504
    - 11th request in 1 minute returns 429
    - Question > 300 characters returns 422
    """
    reset_user_ai_rate_limits()
    suffix = uuid.uuid4().hex[:6]
    cust_token = get_auth_token(f"ai_err_cust_{suffix}@campus.edu", role="customer")
    owner_token = get_auth_token(f"ai_err_owner_{suffix}@kitchen.edu", role="restaurant_owner")

    # Seed 1 order for this customer so they pass the zero-orders check
    rest = client.post("/restaurants", headers={"Authorization": f"Bearer {owner_token}"}, json={"name": "Err Bistro"}).json()
    dish = client.post(f"/restaurants/{rest['id']}/menu", headers={"Authorization": f"Bearer {owner_token}"}, json={"name": "Tea", "price": 5.0}).json()
    client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"restaurant_id": rest["id"], "delivery_address": "Room 5", "items": [{"menu_item_id": dish["id"], "quantity": 1}]},
    )

    # 1. Question longer than 300 characters -> 422 Unprocessable Entity
    resp_long = client.post(
        "/ai/insights",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"question": "x" * 301},
    )
    assert resp_long.status_code == 422

    # 2. Missing API Key -> 503 Service Unavailable
    set_openai_client_override(None)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    resp_nokey = client.post("/ai/insights", headers={"Authorization": f"Bearer {cust_token}"}, json={})
    assert resp_nokey.status_code == 503
    assert "OPENAI_API_KEY is not configured" in resp_nokey.json()["detail"]

    # 3. Simulated RateLimitClient -> retries once and returns 429
    rate_client = RateLimitClient()
    set_openai_client_override(rate_client)
    resp_rl = client.post("/ai/insights", headers={"Authorization": f"Bearer {cust_token}"}, json={})
    assert resp_rl.status_code == 429
    assert rate_client.calls == 2  # Proves it retried once

    # 4. Simulated TimeoutClient -> returns 504
    timeout_client = TimeoutClient()
    set_openai_client_override(timeout_client)
    resp_to = client.post("/ai/insights", headers={"Authorization": f"Bearer {cust_token}"}, json={})
    assert resp_to.status_code == 504

    # 5. In-memory per-user rate limit: 10 requests per minute -> 11th returns 429
    fake_client = FakeOpenAIClient()
    set_openai_client_override(fake_client)
    reset_user_ai_rate_limits()

    # Send 10 successful requests
    for i in range(10):
        r = client.post("/ai/insights", headers={"Authorization": f"Bearer {cust_token}"}, json={})
        assert r.status_code == 200, f"Request {i+1} failed"

    # 11th request must fail with 429
    r_eleventh = client.post("/ai/insights", headers={"Authorization": f"Bearer {cust_token}"}, json={})
    assert r_eleventh.status_code == 429
    assert "Maximum 10 AI requests per minute" in r_eleventh.json()["detail"]
