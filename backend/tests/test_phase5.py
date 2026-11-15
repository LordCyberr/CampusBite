import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Order, PaymentLedger, OrderStatus, Review

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


def setup_delivered_order():
    """Helper to set up an owner, restaurant, courier, customer, and a DELIVERED order."""
    uid = uuid.uuid4().hex[:6]
    owner_token = helper_user(f"Chef {uid}", f"owner_{uid}@chef.edu", "restaurant_owner")
    courier_token = helper_user(f"Courier {uid}", f"courier_{uid}@runner.edu", "delivery_partner")
    cust_token = helper_user(f"Customer {uid}", f"cust_{uid}@student.edu", "customer")

    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    courier_headers = {"Authorization": f"Bearer {courier_token}"}
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Restaurant & Dish
    r = client.post(
        "/restaurants",
        headers=owner_headers,
        json={"name": f"Trattoria {uid}", "description": "Italian food"},
    ).json()
    rest_id = r["id"]

    dish = client.post(
        f"/restaurants/{rest_id}/menu",
        headers=owner_headers,
        json={"name": "Pasta Carbonara", "price": 15.0, "is_available": True},
    ).json()
    dish_id = dish["id"]

    # Place order
    order = client.post(
        "/orders",
        headers=cust_headers,
        json={"restaurant_id": rest_id, "delivery_address": "Dorm Hall C", "items": [{"menu_item_id": dish_id, "quantity": 1}]},
    ).json()
    order_id = order["id"]

    # Progress to DELIVERED
    client.patch(f"/orders/{order_id}/status", headers=owner_headers, json={"status": "ACCEPTED"})
    client.patch(f"/orders/{order_id}/status", headers=owner_headers, json={"status": "PREPARING"})
    client.patch(f"/orders/{order_id}/status", headers=owner_headers, json={"status": "READY"})

    partners = client.get("/owner/delivery-partners", headers=owner_headers).json()
    c_user = next(p for p in partners if f"courier_{uid}@runner.edu" in p["email"])
    client.patch(f"/orders/{order_id}/assign", headers=owner_headers, json={"delivery_partner_id": c_user["id"]})

    client.patch(f"/delivery/orders/{order_id}/status", headers=courier_headers, json={"status": "OUT_FOR_DELIVERY"})
    client.patch(f"/delivery/orders/{order_id}/status", headers=courier_headers, json={"status": "DELIVERED"})

    return owner_token, courier_token, cust_token, rest_id, order_id


def test_customer_review_delivered_order_and_duplicate_returns_409():
    """Verify customer can review a delivered order, and a second review returns 409."""
    _, _, cust_token, rest_id, order_id = setup_delivered_order()
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. First review succeeds
    res = client.post(
        f"/orders/{order_id}/review",
        headers=cust_headers,
        json={"rating": 5, "comment": "Delicious food and super quick delivery!"},
    )
    assert res.status_code == 201
    rev_data = res.json()
    assert rev_data["rating"] == 5
    assert rev_data["order_id"] == order_id
    assert rev_data["comment"] == "Delicious food and super quick delivery!"

    # 2. Second review on same order -> 409 Conflict
    res_dup = client.post(
        f"/orders/{order_id}/review",
        headers=cust_headers,
        json={"rating": 4, "comment": "Trying to review again"},
    )
    assert res_dup.status_code == 409
    assert "already been reviewed" in res_dup.json()["detail"]


def test_review_invalid_scenarios():
    """Verify reviews fail on non-delivered orders, someone else's order, or refunded orders."""
    owner_token, _, cust_token, rest_id, delivered_id = setup_delivered_order()
    other_cust_token = helper_user("Other Customer", f"other_{uuid.uuid4().hex[:6]}@student.edu", "customer")

    # 1. Someone else's order -> 403
    res_other = client.post(
        f"/orders/{delivered_id}/review",
        headers={"Authorization": f"Bearer {other_cust_token}"},
        json={"rating": 5},
    )
    assert res_other.status_code == 403
    assert "do not own this order" in res_other.json()["detail"]

    # 2. Order not delivered (create a fresh PLACED order)
    dishes = client.get(f"/restaurants/{rest_id}/menu", headers={"Authorization": f"Bearer {cust_token}"}).json()["items"]
    placed_order = client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"restaurant_id": rest_id, "delivery_address": "Dorm C", "items": [{"menu_item_id": dishes[0]["id"], "quantity": 1}]},
    ).json()

    res_not_deliv = client.post(
        f"/orders/{placed_order['id']}/review",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"rating": 5},
    )
    assert res_not_deliv.status_code == 400
    assert "Only delivered orders can be reviewed" in res_not_deliv.json()["detail"]

    # 3. Refunded order -> 400
    # Deliver another order and refund it
    refunded_order = client.post(
        "/orders",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"restaurant_id": rest_id, "delivery_address": "Dorm C", "items": [{"menu_item_id": dishes[0]["id"], "quantity": 1}]},
    ).json()
    ref_id = refunded_order["id"]

    db = SessionLocal()
    try:
        o = db.query(Order).filter(Order.id == ref_id).first()
        o.status = "REFUNDED"
        o.payment_status = "refunded"
        db.commit()
    finally:
        db.close()

    res_ref = client.post(
        f"/orders/{ref_id}/review",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"rating": 5},
    )
    assert res_ref.status_code == 400
    assert "Refunded orders cannot be reviewed" in res_ref.json()["detail"]


def test_rating_boundaries_rejected():
    """Verify rating < 1 or > 5 returns 422 Unprocessable Entity."""
    _, _, cust_token, _, order_id = setup_delivered_order()
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Rating 0 -> 422
    assert client.post(f"/orders/{order_id}/review", headers=cust_headers, json={"rating": 0}).status_code == 422
    # Rating 6 -> 422
    assert client.post(f"/orders/{order_id}/review", headers=cust_headers, json={"rating": 6}).status_code == 422


def test_restaurant_reviews_and_average():
    """Verify restaurant review listing with average rating and total count."""
    _, _, cust_token, rest_id, order_id = setup_delivered_order()
    client.post(f"/orders/{order_id}/review", headers={"Authorization": f"Bearer {cust_token}"}, json={"rating": 4, "comment": "Good"})

    res = client.get(f"/restaurants/{rest_id}/reviews", headers={"Authorization": f"Bearer {cust_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_reviews"] == 1
    assert data["average_rating"] == 4.0
    assert len(data["items"]) == 1


def test_customer_return_request_and_duplicate_returns_409():
    """Verify return request workflow and duplicate rejection."""
    _, _, cust_token, _, order_id = setup_delivered_order()
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. First return request succeeds
    res = client.post(
        f"/orders/{order_id}/return",
        headers=cust_headers,
        json={"reason": "Food was completely spilled inside bag"},
    )
    assert res.status_code == 200
    assert res.json()["return_status"] == "requested"
    assert res.json()["return_reason"] == "Food was completely spilled inside bag"

    # 2. Second request returns 409 Conflict
    res_dup = client.post(
        f"/orders/{order_id}/return",
        headers=cust_headers,
        json={"reason": "Trying to request return a second time"},
    )
    assert res_dup.status_code == 409
    assert "already been submitted" in res_dup.json()["detail"]


def test_return_request_validation():
    """Verify return request reason must be at least 5 characters."""
    _, _, cust_token, _, order_id = setup_delivered_order()
    res = client.post(
        f"/orders/{order_id}/return",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"reason": "Bad"},  # Less than 5 characters
    )
    assert res.status_code == 422


def test_cross_owner_return_decision_forbidden():
    """Verify Owner B cannot approve/reject Owner A's return requests (403 Forbidden)."""
    owner_a, _, cust_token, _, order_id = setup_delivered_order()
    owner_b = helper_user("Rival Owner", f"rival_{uuid.uuid4().hex[:6]}@chef.edu", "restaurant_owner")

    # Request return
    client.post(
        f"/orders/{order_id}/return",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"reason": "Cold pasta and wrong sauce"},
    )

    # Owner B tries to decide -> 403
    res_forbidden = client.patch(
        f"/orders/{order_id}/return/decision",
        headers={"Authorization": f"Bearer {owner_b}"},
        json={"decision": "approve"},
    )
    assert res_forbidden.status_code == 403
    assert "You do not own the restaurant" in res_forbidden.json()["detail"]


def test_return_approval_flow():
    """Verify return approval creates refund ledger, updates status to REFUNDED, and marks payment refunded."""
    owner_token, _, cust_token, _, order_id = setup_delivered_order()

    # Request return
    client.post(
        f"/orders/{order_id}/return",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"reason": "Crushed box and spilled contents"},
    )

    # Approve return
    res_app = client.patch(
        f"/orders/{order_id}/return/decision",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"decision": "approve"},
    )
    assert res_app.status_code == 200
    ord_data = res_app.json()
    assert ord_data["status"] == "REFUNDED"
    assert ord_data["payment_status"] == "refunded"
    assert ord_data["return_status"] == "approved"

    # Verify refund ledger entry
    db = SessionLocal()
    try:
        ledgers = db.query(PaymentLedger).filter(PaymentLedger.order_id == order_id).all()
        types = [l.type for l in ledgers]
        assert "refund" in types
        refund_entry = next(l for l in ledgers if l.type == "refund")
        assert refund_entry.amount == 15.0
        assert refund_entry.status == "SUCCESS"
    finally:
        db.close()


def test_return_rejection_flow():
    """Verify return rejection sets return_status=rejected and changes nothing else."""
    owner_token, _, cust_token, _, order_id = setup_delivered_order()

    # Request return
    client.post(
        f"/orders/{order_id}/return",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"reason": "Food was too spicy for my taste"},
    )

    # Reject return
    res_rej = client.patch(
        f"/orders/{order_id}/return/decision",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"decision": "reject"},
    )
    assert res_rej.status_code == 200
    ord_data = res_rej.json()
    assert ord_data["return_status"] == "rejected"
    assert ord_data["status"] == "DELIVERED"
    assert ord_data["payment_status"] == "mock_paid"


def test_deciding_on_unrequested_return_returns_400():
    """Verify deciding on an order without a pending return request returns 400."""
    owner_token, _, _, _, order_id = setup_delivered_order()
    res = client.patch(
        f"/orders/{order_id}/return/decision",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"decision": "approve"},
    )
    assert res.status_code == 400
    assert "No pending return request" in res.json()["detail"]


def test_restaurant_stats_accuracy():
    """Verify stats calculations: total revenue includes only DELIVERED orders, status breakdown is correct."""
    owner_token, courier_token, cust_token, rest_id, deliv_order_id = setup_delivered_order()
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # deliv_order_id has total 15.0 and status DELIVERED. Review it 5 stars.
    client.post(f"/orders/{deliv_order_id}/review", headers=cust_headers, json={"rating": 5})

    # Add a CANCELLED order ($15.0) -> must be EXCLUDED from revenue
    dishes = client.get(f"/restaurants/{rest_id}/menu", headers=cust_headers).json()["items"]
    canc_order = client.post(
        "/orders",
        headers=cust_headers,
        json={"restaurant_id": rest_id, "delivery_address": "Dorm C", "items": [{"menu_item_id": dishes[0]["id"], "quantity": 1}]},
    ).json()
    client.post(f"/orders/{canc_order['id']}/cancel", headers=cust_headers)

    # Query stats
    res_stats = client.get("/owner/stats", headers=owner_headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()

    assert stats["total_orders"] == 2
    assert stats["total_revenue"] == 15.0  # Only the delivered order, cancelled is excluded!
    assert stats["orders_per_status"]["DELIVERED"] == 1
    assert stats["orders_per_status"]["CANCELLED"] == 1
    assert stats["average_rating"] == 5.0
    assert len(stats["top_three_dishes"]) >= 1
    assert stats["pending_return_requests"] == 0
