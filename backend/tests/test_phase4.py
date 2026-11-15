import uuid
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Order, PaymentLedger

client = TestClient(app)


def helper_user(name: str, email: str, role: str) -> str:
    """Helper to register and login a user, returning access token."""
    client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": "password123", "role": role},
    )
    res = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"},
    )
    return res.json()["access_token"]


def setup_restaurant_and_menu():
    """Helper to set up a unique owner, restaurant, and dishes for ordering tests."""
    uid = uuid.uuid4().hex[:6]
    token = helper_user(f"Chef {uid}", f"rosa_{uid}@kitchen.edu", "restaurant_owner")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post(
        "/restaurants",
        headers=headers,
        json={"name": f"Rosa Trattoria {uid}", "description": "Italian food"},
    ).json()
    rest_id = r["id"]

    d1 = client.post(
        f"/restaurants/{rest_id}/menu",
        headers=headers,
        json={"name": "Lasagna", "price": 10.0, "is_available": True},
    ).json()
    d2 = client.post(
        f"/restaurants/{rest_id}/menu",
        headers=headers,
        json={"name": "Garlic Bread", "price": 5.0, "is_available": True},
    ).json()
    d3 = client.post(
        f"/restaurants/{rest_id}/menu",
        headers=headers,
        json={"name": "Tiramisu", "price": 6.0, "is_available": False},
    ).json()

    return token, rest_id, d1["id"], d2["id"], d3["id"]


def test_place_order_server_total_and_ledger():
    """Verify order placement, server total calculation, price_at_order snapshot, and payment ledger."""
    owner_token, rest_id, d1_id, d2_id, _ = setup_restaurant_and_menu()
    cust_token = helper_user("Order Placer", "placer@student.edu", "customer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    order_payload = {
        "restaurant_id": rest_id,
        "delivery_address": "Dorm Hall B, Room 402",
        "items": [
            {"menu_item_id": d1_id, "quantity": 2},  # 2 x 10 = 20.0
            {"menu_item_id": d2_id, "quantity": 1},  # 1 x 5 = 5.0
        ],
    }

    res = client.post("/orders", headers=headers, json=order_payload)
    assert res.status_code == 201
    order_data = res.json()

    assert order_data["total_amount"] == 25.0
    assert order_data["status"] == "PLACED"
    assert order_data["payment_status"] == "mock_paid"
    assert order_data["delivery_address"] == "Dorm Hall B, Room 402"
    assert len(order_data["items"]) == 2

    # Verify price snapshot
    item_prices = {item["menu_item_id"]: item["price_at_order"] for item in order_data["items"]}
    assert item_prices[d1_id] == 10.0
    assert item_prices[d2_id] == 5.0

    # Verify PaymentLedger entry
    db = SessionLocal()
    try:
        ledgers = db.query(PaymentLedger).filter(PaymentLedger.order_id == order_data["id"]).all()
        assert len(ledgers) == 1
        assert ledgers[0].type == "mock_payment"
        assert ledgers[0].amount == 25.0
        assert ledgers[0].status == "SUCCESS"
    finally:
        db.close()


def test_order_validation_failures():
    """Verify orders with unavailable items, foreign dishes, 0 quantity, or empty cart fail cleanly."""
    owner_token, rest_id, d1_id, d2_id, unavail_id = setup_restaurant_and_menu()
    cust_token = helper_user("Fault Tester", "fault@student.edu", "customer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Unavailable dish -> 400
    res_unavail = client.post(
        "/orders",
        headers=headers,
        json={
            "restaurant_id": rest_id,
            "delivery_address": "Campus Library",
            "items": [{"menu_item_id": unavail_id, "quantity": 1}],
        },
    )
    assert res_unavail.status_code == 400
    assert "currently unavailable" in res_unavail.json()["detail"]

    # 2. Dish from another restaurant -> 400
    owner_b = helper_user("Other Owner", "other@owner.edu", "restaurant_owner")
    rest_b = client.post(
        "/restaurants",
        headers={"Authorization": f"Bearer {owner_b}"},
        json={"name": "Other Bistro"},
    ).json()
    dish_b = client.post(
        f"/restaurants/{rest_b['id']}/menu",
        headers={"Authorization": f"Bearer {owner_b}"},
        json={"name": "Foreign Burger", "price": 8.0},
    ).json()

    res_foreign = client.post(
        "/orders",
        headers=headers,
        json={
            "restaurant_id": rest_id,  # Restaurant Rosa
            "delivery_address": "Campus Library",
            "items": [{"menu_item_id": dish_b["id"], "quantity": 1}],  # Foreign dish
        },
    )
    assert res_foreign.status_code == 400
    assert "does not belong to restaurant" in res_foreign.json()["detail"]

    # 3. Quantity zero -> 422
    res_zero = client.post(
        "/orders",
        headers=headers,
        json={
            "restaurant_id": rest_id,
            "delivery_address": "Campus Library",
            "items": [{"menu_item_id": d1_id, "quantity": 0}],
        },
    )
    assert res_zero.status_code == 422

    # 4. Empty cart -> 422
    res_empty = client.post(
        "/orders",
        headers=headers,
        json={"restaurant_id": rest_id, "delivery_address": "Campus Library", "items": []},
    )
    assert res_empty.status_code == 422


def test_customer_cannot_see_another_customer_order():
    """Verify Customer A cannot access Customer B's order (403 Forbidden)."""
    _, rest_id, d1_id, _, _ = setup_restaurant_and_menu()
    cust_a = helper_user("Customer A", "ca@student.edu", "customer")
    cust_b = helper_user("Customer B", "cb@student.edu", "customer")

    res_order = client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_a}"},
        json={
            "restaurant_id": rest_id,
            "delivery_address": "Dorm A",
            "items": [{"menu_item_id": d1_id, "quantity": 1}],
        },
    ).json()

    res_forbidden = client.get(
        f"/orders/{res_order['id']}",
        headers={"Authorization": f"Bearer {cust_b}"},
    )
    assert res_forbidden.status_code == 403
    assert "permission to view this order" in res_forbidden.json()["detail"]


def test_full_happy_path_lifecycle():
    """Verify end-to-end order lifecycle: PLACED -> ACCEPTED -> PREPARING -> READY -> ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED."""
    owner_token, rest_id, d1_id, _, _ = setup_restaurant_and_menu()
    cust_token = helper_user("Happy Customer", "happy@student.edu", "customer")
    courier_token = helper_user("Campus Runner", "runner@campus.edu", "delivery_partner")

    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    courier_headers = {"Authorization": f"Bearer {courier_token}"}

    # 1. Place Order (PLACED)
    res_order = client.post(
        "/orders",
        headers=cust_headers,
        json={
            "restaurant_id": rest_id,
            "delivery_address": "Science Center Lab 3",
            "items": [{"menu_item_id": d1_id, "quantity": 1}],
        },
    ).json()
    order_id = res_order["id"]
    assert res_order["status"] == "PLACED"

    # 2. Owner accepts (ACCEPTED)
    res_accept = client.patch(
        f"/orders/{order_id}/status",
        headers=owner_headers,
        json={"status": "ACCEPTED"},
    )
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "ACCEPTED"

    # 3. Owner prepares (PREPARING)
    res_prep = client.patch(
        f"/orders/{order_id}/status",
        headers=owner_headers,
        json={"status": "PREPARING"},
    )
    assert res_prep.status_code == 200
    assert res_prep.json()["status"] == "PREPARING"

    # 4. Owner marks food ready (READY)
    res_ready = client.patch(
        f"/orders/{order_id}/status",
        headers=owner_headers,
        json={"status": "READY"},
    )
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "READY"

    # Get courier user ID
    partners = client.get("/owner/delivery-partners", headers=owner_headers).json()
    courier_user = next(p for p in partners if p["email"] == "runner@campus.edu")

    # 5. Owner assigns delivery partner (ASSIGNED)
    res_assign = client.patch(
        f"/orders/{order_id}/assign",
        headers=owner_headers,
        json={"delivery_partner_id": courier_user["id"]},
    )
    assert res_assign.status_code == 200
    assert res_assign.json()["status"] == "ASSIGNED"
    assert res_assign.json()["delivery_partner_id"] == courier_user["id"]

    # 6. Delivery partner marks out for delivery (OUT_FOR_DELIVERY)
    res_out = client.patch(
        f"/delivery/orders/{order_id}/status",
        headers=courier_headers,
        json={"status": "OUT_FOR_DELIVERY"},
    )
    assert res_out.status_code == 200
    assert res_out.json()["status"] == "OUT_FOR_DELIVERY"

    # 7. Delivery partner marks delivered (DELIVERED)
    res_delivered = client.patch(
        f"/delivery/orders/{order_id}/status",
        headers=courier_headers,
        json={"status": "DELIVERED"},
    )
    assert res_delivered.status_code == 200
    assert res_delivered.json()["status"] == "DELIVERED"


def test_skipping_steps_rejected_with_400():
    """Verify invalid state skips return 400 Bad Request."""
    owner_token, rest_id, d1_id, _, _ = setup_restaurant_and_menu()
    cust_token = helper_user("Skip Customer", "skip@student.edu", "customer")
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    res_order = client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={
            "restaurant_id": rest_id,
            "delivery_address": "Dorm 5",
            "items": [{"menu_item_id": d1_id, "quantity": 1}],
        },
    ).json()
    order_id = res_order["id"]

    # Attempt to skip from PLACED directly to READY -> 400
    res_skip = client.patch(
        f"/orders/{order_id}/status",
        headers=owner_headers,
        json={"status": "READY"},
    )
    assert res_skip.status_code == 400
    assert "Invalid order status transition" in res_skip.json()["detail"]


def test_cancellation_rules_and_refund_ledger():
    """Verify customer can only cancel in PLACED, refund ledger created, and DELIVERED cannot be cancelled."""
    owner_token, rest_id, d1_id, _, _ = setup_restaurant_and_menu()
    cust_token = helper_user("Cancel Customer", "cancel@student.edu", "customer")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Order 1: Cancel while PLACED
    order1 = client.post(
        "/orders",
        headers=cust_headers,
        json={
            "restaurant_id": rest_id,
            "delivery_address": "Gym Lobby",
            "items": [{"menu_item_id": d1_id, "quantity": 1}],
        },
    ).json()

    res_cancel = client.post(f"/orders/{order1['id']}/cancel", headers=cust_headers)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "CANCELLED"
    assert res_cancel.json()["payment_status"] == "refunded"

    # Verify refund in ledger
    db = SessionLocal()
    try:
        ledgers = db.query(PaymentLedger).filter(PaymentLedger.order_id == order1["id"]).all()
        assert len(ledgers) == 2
        types = [l.type for l in ledgers]
        assert "mock_payment" in types
        assert "refund" in types
    finally:
        db.close()

    # Attempting to cancel an already cancelled order returns 400
    res_recancel = client.post(f"/orders/{order1['id']}/cancel", headers=cust_headers)
    assert res_recancel.status_code == 400

    # Order 2: Try to cancel a DELIVERED order
    order2 = client.post(
        "/orders",
        headers=cust_headers,
        json={
            "restaurant_id": rest_id,
            "delivery_address": "Gym Lobby",
            "items": [{"menu_item_id": d1_id, "quantity": 1}],
        },
    ).json()
    # Force DELIVERED directly for test
    db = SessionLocal()
    try:
        ord_obj = db.query(Order).filter(Order.id == order2["id"]).first()
        ord_obj.status = "DELIVERED"
        db.commit()
    finally:
        db.close()

    res_del_cancel = client.post(f"/orders/{order2['id']}/cancel", headers=cust_headers)
    assert res_del_cancel.status_code == 400
    assert "delivered order cannot be transitioned or cancelled" in res_del_cancel.json()["detail"]


def test_cross_owner_and_cross_delivery_authorization():
    """Verify Owner B cannot touch Owner A's orders, and Courier B cannot touch Courier A's orders."""
    owner_a, rest_id, d1_id, _, _ = setup_restaurant_and_menu()
    owner_b = helper_user("Rival Chef", "rival@kitchen.edu", "restaurant_owner")
    cust_token = helper_user("Neutral Student", "neutral@student.edu", "customer")
    courier_a = helper_user("Courier One", "c1@courier.edu", "delivery_partner")
    courier_b = helper_user("Courier Two", "c2@courier.edu", "delivery_partner")

    order = client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"restaurant_id": rest_id, "delivery_address": "Dorm 1", "items": [{"menu_item_id": d1_id, "quantity": 1}]},
    ).json()
    order_id = order["id"]

    # Owner B tries to accept Owner A's order -> 403
    res_b_accept = client.patch(
        f"/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {owner_b}"},
        json={"status": "ACCEPTED"},
    )
    assert res_b_accept.status_code == 403
    assert "You do not own the restaurant" in res_b_accept.json()["detail"]

    # Progress order to ASSIGNED with Courier A
    client.patch(f"/orders/{order_id}/status", headers={"Authorization": f"Bearer {owner_a}"}, json={"status": "ACCEPTED"})
    client.patch(f"/orders/{order_id}/status", headers={"Authorization": f"Bearer {owner_a}"}, json={"status": "PREPARING"})
    client.patch(f"/orders/{order_id}/status", headers={"Authorization": f"Bearer {owner_a}"}, json={"status": "READY"})

    # Get courier A id
    partners = client.get("/owner/delivery-partners", headers={"Authorization": f"Bearer {owner_a}"}).json()
    c1_user = next(p for p in partners if p["email"] == "c1@courier.edu")
    client.patch(f"/orders/{order_id}/assign", headers={"Authorization": f"Bearer {owner_a}"}, json={"delivery_partner_id": c1_user["id"]})

    # Courier B tries to mark out for delivery on Courier A's order -> 403
    res_c2_touch = client.patch(
        f"/delivery/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {courier_b}"},
        json={"status": "OUT_FOR_DELIVERY"},
    )
    assert res_c2_touch.status_code == 403
    assert "not the delivery partner assigned" in res_c2_touch.json()["detail"]


def test_assign_non_delivery_partner_rejected():
    """Verify assigning a user without delivery_partner role is rejected with 400."""
    owner_token, rest_id, d1_id, _, _ = setup_restaurant_and_menu()
    cust_token = helper_user("Fake Runner", "fake@student.edu", "customer")
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    order = client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"restaurant_id": rest_id, "delivery_address": "Dorm 9", "items": [{"menu_item_id": d1_id, "quantity": 1}]},
    ).json()
    order_id = order["id"]

    client.patch(f"/orders/{order_id}/status", headers=owner_headers, json={"status": "ACCEPTED"})
    client.patch(f"/orders/{order_id}/status", headers=owner_headers, json={"status": "PREPARING"})
    client.patch(f"/orders/{order_id}/status", headers=owner_headers, json={"status": "READY"})

    # Try to assign the customer as courier
    db = SessionLocal()
    fake_user = db.query(Order).filter(Order.id == order_id).first().customer_id
    db.close()

    res_assign = client.patch(
        f"/orders/{order_id}/assign",
        headers=owner_headers,
        json={"delivery_partner_id": fake_user},
    )
    assert res_assign.status_code == 400
    assert "not a valid delivery partner" in res_assign.json()["detail"]


def test_filters_and_pagination_on_orders():
    """Verify status, date range filtering, and pagination on customer and owner orders."""
    owner_token, rest_id, d1_id, _, _ = setup_restaurant_and_menu()
    cust_token = helper_user("Multi Orderer", "multi@student.edu", "customer")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Place 3 orders
    for i in range(3):
        client.post(
            "/orders",
            headers=cust_headers,
            json={"restaurant_id": rest_id, "delivery_address": f"Hall {i}", "items": [{"menu_item_id": d1_id, "quantity": 1}]},
        )

    # Paginate: page 1, size 2
    res_page = client.get("/orders?page=1&page_size=2", headers=cust_headers)
    assert res_page.status_code == 200
    data = res_page.json()
    assert data["total_count"] == 3
    assert len(data["items"]) == 2
    assert data["page"] == 1

    # Filter status=PLACED
    res_filter = client.get("/orders?status=PLACED", headers=cust_headers)
    assert res_filter.status_code == 200
    assert res_filter.json()["total_count"] == 3

    # Date filter
    now = datetime.utcnow()
    past = (now - timedelta(days=1)).isoformat()
    future = (now + timedelta(days=1)).isoformat()
    res_date = client.get(f"/orders?date_from={past}&date_to={future}", headers=cust_headers)
    assert res_date.status_code == 200
    assert res_date.json()["total_count"] == 3
