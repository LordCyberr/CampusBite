"""
CampusBite Roles and Lifecycle Loops Test Suite
Comprehensive testing of all 3 personas (Customer, Restaurant Owner, Delivery Partner),
their state machines, closed-loop interactions, security boundaries, and edge cases.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db, SessionLocal
from app.models import (
    User,
    Restaurant,
    MenuItem,
    Order,
    OrderItem,
    OrderStatus,
    PaymentLedger,
    PaymentType,
    Review,
    UserRole,
)
from app.auth import hash_password, create_access_token

client = TestClient(app)


# --- Helper Fixtures ---
@pytest.fixture
def setup_roles_environment():
    """Sets up standard users, restaurants, and dishes for role loop tests."""
    db = SessionLocal()
    try:
        # 1. Clean previous records in isolated test run
        db.query(Review).delete()
        db.query(PaymentLedger).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(MenuItem).delete()
        db.query(Restaurant).delete()
        db.query(User).delete()
        db.commit()

        # 2. Create Users
        customer = User(
            name="Alice Student",
            email="customer@campusbite.com",
            hashed_password=hash_password("password123"),
            role=UserRole.CUSTOMER.value,
        )
        owner = User(
            name="Mario Chef",
            email="owner1@campusbite.com",
            hashed_password=hash_password("password123"),
            role=UserRole.RESTAURANT_OWNER.value,
        )
        other_owner = User(
            name="Priya Sharma",
            email="owner2@campusbite.com",
            hashed_password=hash_password("password123"),
            role=UserRole.RESTAURANT_OWNER.value,
        )
        courier = User(
            name="Sam Courier",
            email="delivery@campusbite.com",
            hashed_password=hash_password("password123"),
            role=UserRole.DELIVERY_PARTNER.value,
        )
        db.add_all([customer, owner, other_owner, courier])
        db.commit()
        db.refresh(customer)
        db.refresh(owner)
        db.refresh(other_owner)
        db.refresh(courier)

        # 3. Create Restaurants
        rest1 = Restaurant(
            name="Mario's Campus Pizzeria",
            description="Wood-fired campus pizza",
            owner_id=owner.id,
        )
        rest2 = Restaurant(
            name="Spice Junction Canteen",
            description="Curry bowls and rolls",
            owner_id=other_owner.id,
        )
        db.add_all([rest1, rest2])
        db.commit()
        db.refresh(rest1)
        db.refresh(rest2)

        # 4. Create Menu Items
        dish1 = MenuItem(
            restaurant_id=rest1.id,
            name="Margherita Pizza",
            description="Fresh basil and mozzarella",
            price=9.99,
            is_available=True,
        )
        dish2 = MenuItem(
            restaurant_id=rest1.id,
            name="Garlic Breadsticks",
            description="Warm garlic butter bread",
            price=4.99,
            is_available=True,
        )
        dish3_other = MenuItem(
            restaurant_id=rest2.id,
            name="Butter Chicken Bowl",
            description="Rice and creamy curry",
            price=11.99,
            is_available=True,
        )
        db.add_all([dish1, dish2, dish3_other])
        db.commit()

        yield {
            "customer_id": customer.id,
            "owner_id": owner.id,
            "courier_id": courier.id,
            "rest1_id": rest1.id,
            "rest2_id": rest2.id,
            "dish1_id": dish1.id,
            "dish2_id": dish2.id,
            "dish3_id": dish3_other.id,
        }
    finally:
        db.close()


def get_token(email: str, role: str, user_id: int) -> dict:
    token = create_access_token(data={"sub": email, "role": role, "user_id": user_id})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. Customer Flow & Loop Tests
# ==============================================================================
def test_customer_authentication_flow(setup_roles_environment):
    """Customer can log in and receives valid JWT token."""
    res = client.post("/auth/login", json={"email": "customer@campusbite.com", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "customer"


def test_customer_browse_and_cart_validation(setup_roles_environment):
    """Customer views restaurants and cannot mix dishes from two different restaurants."""
    env = setup_roles_environment
    headers = get_token("customer@campusbite.com", "customer", env["customer_id"])

    # Browse restaurants
    res = client.get("/restaurants", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["items"]) >= 2

    # Attempt to place order mixing dishes from two different canteens -> Rejected
    bad_order_payload = {
        "restaurant_id": env["rest1_id"],
        "items": [
            {"menu_item_id": env["dish1_id"], "quantity": 1},
            {"menu_item_id": env["dish3_id"], "quantity": 1},  # from rest2!
        ],
        "delivery_address": "Hostel Room 101",
    }
    bad_res = client.post("/orders", json=bad_order_payload, headers=headers)
    assert bad_res.status_code in (400, 422)


def test_customer_price_tampering_prevented(setup_roles_environment):
    """Client subtotal is strictly ignored; server calculates actual total from DB."""
    env = setup_roles_environment
    headers = get_token("customer@campusbite.com", "customer", env["customer_id"])

    order_payload = {
        "restaurant_id": env["rest1_id"],
        "items": [
            {"menu_item_id": env["dish1_id"], "quantity": 2},  # 2 * 9.99 = 19.98
            {"menu_item_id": env["dish2_id"], "quantity": 1},  # 1 * 4.99 = 4.99 -> Total = 24.97
        ],
        "delivery_address": "Library Study Desk 5",
        "total_amount": 0.01,  # Malicious price attempt!
    }
    res = client.post("/orders", json=order_payload, headers=headers)
    assert res.status_code == 201
    order_data = res.json()
    assert order_data["total_amount"] == 24.97  # Server enforced correct total
    assert order_data["status"] == "PLACED"


# ==============================================================================
# 2. Restaurant Owner Flow & Kitchen Lifecycle Tests
# ==============================================================================
def test_owner_stats_and_dashboard(setup_roles_environment):
    """Owner can fetch restaurant metrics and live sales stats."""
    env = setup_roles_environment
    headers = get_token("owner1@campusbite.com", "restaurant_owner", env["owner_id"])

    res = client.get("/owner/stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_orders" in data
    assert "total_revenue" in data
    assert "orders_per_status" in data


def test_owner_menu_availability_toggle(setup_roles_environment):
    """Owner toggles dish availability off (hidden from customers) and back on."""
    env = setup_roles_environment
    owner_headers = get_token("owner1@campusbite.com", "restaurant_owner", env["owner_id"])
    customer_headers = get_token("customer@campusbite.com", "customer", env["customer_id"])

    # Owner toggles dish1 to unavailable
    toggle_res = client.patch(
        f"/menu-items/{env['dish1_id']}/availability",
        json={"is_available": False},
        headers=owner_headers,
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_available"] is False

    # Customer menu reflects unavailable status (dish is hidden from customer view)
    menu_res = client.get(f"/restaurants/{env['rest1_id']}/menu", headers=customer_headers)
    assert menu_res.status_code == 200
    items = menu_res.json()["items"]
    assert not any(item["id"] == env["dish1_id"] for item in items)

    # Owner still sees it with is_available=False
    owner_menu_res = client.get(f"/restaurants/{env['rest1_id']}/menu", headers=owner_headers)
    assert owner_menu_res.status_code == 200
    owner_dish1 = next(item for item in owner_menu_res.json()["items"] if item["id"] == env["dish1_id"])
    assert owner_dish1["is_available"] is False

    # Restore availability
    restore_res = client.patch(
        f"/menu-items/{env['dish1_id']}/availability",
        json={"is_available": True},
        headers=owner_headers,
    )
    assert restore_res.status_code == 200
    assert restore_res.json()["is_available"] is True


def test_owner_order_state_machine_transitions(setup_roles_environment):
    """Owner advances order strictly through ACCEPTED -> PREPARING -> READY -> ASSIGNED."""
    env = setup_roles_environment
    cust_headers = get_token("customer@campusbite.com", "customer", env["customer_id"])
    owner_headers = get_token("owner1@campusbite.com", "restaurant_owner", env["owner_id"])

    # 1. Customer places order
    order_res = client.post(
        "/orders",
        json={
            "restaurant_id": env["rest1_id"],
            "items": [{"menu_item_id": env["dish1_id"], "quantity": 1}],
            "delivery_address": "Block B 204",
        },
        headers=cust_headers,
    )
    order_id = order_res.json()["id"]

    # 2. Cannot skip states (cannot mark READY directly from PLACED)
    invalid_skip = client.patch(f"/orders/{order_id}/status", json={"status": "READY"}, headers=owner_headers)
    assert invalid_skip.status_code in (400, 409)

    # 3. Step 1: PLACED -> ACCEPTED
    res1 = client.patch(f"/orders/{order_id}/status", json={"status": "ACCEPTED"}, headers=owner_headers)
    assert res1.status_code == 200
    assert res1.json()["status"] == "ACCEPTED"

    # 4. Step 2: ACCEPTED -> PREPARING
    res2 = client.patch(f"/orders/{order_id}/status", json={"status": "PREPARING"}, headers=owner_headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "PREPARING"

    # 5. Step 3: PREPARING -> READY
    res3 = client.patch(f"/orders/{order_id}/status", json={"status": "READY"}, headers=owner_headers)
    assert res3.status_code == 200
    assert res3.json()["status"] == "READY"

    # 6. Step 4: Assign courier -> ASSIGNED
    assign_res = client.patch(
        f"/orders/{order_id}/assign",
        json={"delivery_partner_id": env["courier_id"]},
        headers=owner_headers,
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "ASSIGNED"
    assert assign_res.json()["delivery_partner_id"] == env["courier_id"]


# ==============================================================================
# 3. Delivery Partner Flow Tests
# ==============================================================================
def test_courier_dispatch_flow(setup_roles_environment):
    """Courier picks up assigned order and advances OUT_FOR_DELIVERY -> DELIVERED."""
    env = setup_roles_environment
    cust_headers = get_token("customer@campusbite.com", "customer", env["customer_id"])
    owner_headers = get_token("owner1@campusbite.com", "restaurant_owner", env["owner_id"])
    courier_headers = get_token("delivery@campusbite.com", "delivery_partner", env["courier_id"])

    # Setup order up to ASSIGNED
    order_id = client.post(
        "/orders",
        json={"restaurant_id": env["rest1_id"], "items": [{"menu_item_id": env["dish1_id"], "quantity": 1}], "delivery_address": "Hostel 3"},
        headers=cust_headers,
    ).json()["id"]

    client.patch(f"/orders/{order_id}/status", json={"status": "ACCEPTED"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/status", json={"status": "PREPARING"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/status", json={"status": "READY"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/assign", json={"delivery_partner_id": env["courier_id"]}, headers=owner_headers)

    # Courier sees order in assigned list
    active_orders = client.get("/delivery/orders", headers=courier_headers).json()["items"]
    assert any(o["id"] == order_id for o in active_orders)

    # Courier advances: ASSIGNED -> OUT_FOR_DELIVERY
    out_res = client.patch(f"/delivery/orders/{order_id}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=courier_headers)
    assert out_res.status_code == 200
    assert out_res.json()["status"] == "OUT_FOR_DELIVERY"

    # Courier advances: OUT_FOR_DELIVERY -> DELIVERED
    deliv_res = client.patch(f"/delivery/orders/{order_id}/status", json={"status": "DELIVERED"}, headers=courier_headers)
    assert deliv_res.status_code == 200
    assert deliv_res.json()["status"] == "DELIVERED"


# ==============================================================================
# 4. End-to-End Review and Return/Refund Closed Loops
# ==============================================================================
def test_complete_review_loop(setup_roles_environment):
    """Customer leaves 1-5 star review on delivered order; duplicates blocked; ratings update."""
    env = setup_roles_environment
    cust_headers = get_token("customer@campusbite.com", "customer", env["customer_id"])
    owner_headers = get_token("owner1@campusbite.com", "restaurant_owner", env["owner_id"])
    courier_headers = get_token("delivery@campusbite.com", "delivery_partner", env["courier_id"])

    # Create delivered order
    order_id = client.post(
        "/orders",
        json={"restaurant_id": env["rest1_id"], "items": [{"menu_item_id": env["dish1_id"], "quantity": 1}], "delivery_address": "Library"},
        headers=cust_headers,
    ).json()["id"]

    client.patch(f"/orders/{order_id}/status", json={"status": "ACCEPTED"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/status", json={"status": "PREPARING"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/status", json={"status": "READY"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/assign", json={"delivery_partner_id": env["courier_id"]}, headers=owner_headers)
    client.patch(f"/delivery/orders/{order_id}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=courier_headers)
    client.patch(f"/delivery/orders/{order_id}/status", json={"status": "DELIVERED"}, headers=courier_headers)

    # Submit review
    review_res = client.post(
        f"/orders/{order_id}/review",
        json={"rating": 5, "comment": "Outstanding crust and fast delivery!"},
        headers=cust_headers,
    )
    assert review_res.status_code == 201
    assert review_res.json()["rating"] == 5

    # Check restaurant reviews aggregate
    rest_revs = client.get(f"/restaurants/{env['rest1_id']}/reviews", headers=cust_headers)
    assert rest_revs.status_code == 200
    assert rest_revs.json()["total_count"] >= 1
    assert rest_revs.json()["average_rating"] == 5.0

    # Duplicate review attempt on same order -> Rejected with HTTP 409
    dup_res = client.post(
        f"/orders/{order_id}/review",
        json={"rating": 4, "comment": "Trying to review again"},
        headers=cust_headers,
    )
    assert dup_res.status_code in (400, 409)


def test_complete_return_and_refund_loop(setup_roles_environment):
    """Customer files return -> Owner approves -> Order REFUNDED -> Reviews blocked."""
    env = setup_roles_environment
    cust_headers = get_token("customer@campusbite.com", "customer", env["customer_id"])
    owner_headers = get_token("owner1@campusbite.com", "restaurant_owner", env["owner_id"])
    courier_headers = get_token("delivery@campusbite.com", "delivery_partner", env["courier_id"])

    # Create delivered order
    order_id = client.post(
        "/orders",
        json={"restaurant_id": env["rest1_id"], "items": [{"menu_item_id": env["dish1_id"], "quantity": 1}], "delivery_address": "Dorm 4"},
        headers=cust_headers,
    ).json()["id"]

    client.patch(f"/orders/{order_id}/status", json={"status": "ACCEPTED"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/status", json={"status": "PREPARING"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/status", json={"status": "READY"}, headers=owner_headers)
    client.patch(f"/orders/{order_id}/assign", json={"delivery_partner_id": env["courier_id"]}, headers=owner_headers)
    client.patch(f"/delivery/orders/{order_id}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=courier_headers)
    client.patch(f"/delivery/orders/{order_id}/status", json={"status": "DELIVERED"}, headers=courier_headers)

    # Customer requests return with valid reason
    return_res = client.post(
        f"/orders/{order_id}/return",
        json={"reason": "Incorrect topping received and food was cold"},
        headers=cust_headers,
    )
    assert return_res.status_code == 200
    assert return_res.json()["return_status"] == "requested"

    # Owner views return in dashboard and approves
    owner_pending = client.get("/owner/returns", headers=owner_headers).json()["items"]
    assert any(r["id"] == order_id for r in owner_pending)

    approve_res = client.patch(
        f"/orders/{order_id}/return/decision",
        json={"decision": "approve"},
        headers=owner_headers,
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "REFUNDED"
    assert approve_res.json()["payment_status"] == "refunded"
    assert approve_res.json()["return_status"] == "approved"

    # Verify: Customer cannot review refunded order
    review_blocked = client.post(
        f"/orders/{order_id}/review",
        json={"rating": 1, "comment": "Refunded meal review"},
        headers=cust_headers,
    )
    assert review_blocked.status_code in (400, 409)


# ==============================================================================
# 5. Cross-Role Security Boundary Enforcement
# ==============================================================================
def test_rbac_security_boundaries(setup_roles_environment):
    """Each role is strictly forbidden from accessing unauthorized endpoints."""
    env = setup_roles_environment
    cust_headers = get_token("customer@campusbite.com", "customer", env["customer_id"])
    courier_headers = get_token("delivery@campusbite.com", "delivery_partner", env["courier_id"])
    owner_headers = get_token("owner1@campusbite.com", "restaurant_owner", env["owner_id"])

    # 1. Customer cannot access kitchen order management
    assert client.get("/owner/orders", headers=cust_headers).status_code == 403

    # 2. Customer cannot view courier deliveries
    assert client.get("/delivery/orders", headers=cust_headers).status_code == 403

    # 3. Courier cannot modify kitchen menu items
    assert client.patch(f"/menu-items/{env['dish1_id']}/availability", json={"is_available": False}, headers=courier_headers).status_code == 403

    # 4. Owner cannot view courier delivery queue
    assert client.get("/delivery/orders", headers=owner_headers).status_code == 403
