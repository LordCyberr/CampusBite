import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import OrderItem, Order

client = TestClient(app)


def helper_register_and_login(name: str, email: str, role: str) -> str:
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


def test_owner_create_restaurant_and_duplicate_returns_409():
    """Verify restaurant owner can create one restaurant, and second attempt returns 409."""
    token = helper_register_and_login("Mario Chef", "mario@pizza.edu", "restaurant_owner")
    headers = {"Authorization": f"Bearer {token}"}

    # First restaurant creation succeeds
    res1 = client.post(
        "/restaurants",
        headers=headers,
        json={"name": "Mario's Campus Pizzeria", "description": "Authentic woodfired pizza"},
    )
    assert res1.status_code == 201
    rest_data = res1.json()
    assert rest_data["name"] == "Mario's Campus Pizzeria"
    assert "id" in rest_data

    # Second restaurant creation returns 409
    res2 = client.post(
        "/restaurants",
        headers=headers,
        json={"name": "Mario's Second Stall", "description": "Another shop"},
    )
    assert res2.status_code == 409
    assert "already has a registered restaurant" in res2.json()["detail"]


def test_customer_create_restaurant_returns_403():
    """Verify Customers cannot create restaurants (403 Forbidden)."""
    token = helper_register_and_login("Dan Customer", "dan@student.edu", "customer")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/restaurants",
        headers=headers,
        json={"name": "Illegal Student Stall", "description": "Not allowed"},
    )
    assert res.status_code == 403
    assert "Operation not permitted" in res.json()["detail"]


def test_cross_owner_editing_forbidden():
    """Verify Owner A cannot edit Owner B's restaurant or dishes."""
    # Owner A creates restaurant and dish
    token_a = helper_register_and_login("Owner A", "ownera@eats.edu", "restaurant_owner")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    res_rest_a = client.post(
        "/restaurants",
        headers=headers_a,
        json={"name": "Restaurant A", "description": "Stall A"},
    )
    rest_a_id = res_rest_a.json()["id"]

    res_dish_a = client.post(
        f"/restaurants/{rest_a_id}/menu",
        headers=headers_a,
        json={"name": "Dish A", "description": "Tasty A", "price": 9.99},
    )
    dish_a_id = res_dish_a.json()["id"]

    # Owner B creates their own restaurant
    token_b = helper_register_and_login("Owner B", "ownerb@eats.edu", "restaurant_owner")
    headers_b = {"Authorization": f"Bearer {token_b}"}
    client.post(
        "/restaurants",
        headers=headers_b,
        json={"name": "Restaurant B", "description": "Stall B"},
    )

    # Owner B attempts to edit Restaurant A -> 403
    res_edit_rest = client.put(
        f"/restaurants/{rest_a_id}",
        headers=headers_b,
        json={"name": "Hacked Restaurant Name"},
    )
    assert res_edit_rest.status_code == 403

    # Owner B attempts to edit Dish A -> 403
    res_edit_dish = client.put(
        f"/menu-items/{dish_a_id}",
        headers=headers_b,
        json={"name": "Hacked Dish Name", "price": 1.00},
    )
    assert res_edit_dish.status_code == 403

    # Owner B attempts to patch availability of Dish A -> 403
    res_avail = client.patch(
        f"/menu-items/{dish_a_id}/availability",
        headers=headers_b,
        json={"is_available": False},
    )
    assert res_avail.status_code == 403

    # Owner B attempts to delete Dish A -> 403
    res_del = client.delete(f"/menu-items/{dish_a_id}", headers=headers_b)
    assert res_del.status_code == 403


def test_customers_do_not_see_unavailable_dishes_and_owner_does():
    """Verify customers only see available dishes, while the owner sees all."""
    token_owner = helper_register_and_login("Chef Luigi", "luigi@pasta.edu", "restaurant_owner")
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    res_rest = client.post(
        "/restaurants",
        headers=headers_owner,
        json={"name": "Luigi's Trattoria", "description": "Fresh pasta"},
    )
    rest_id = res_rest.json()["id"]

    # Dish 1: Available
    client.post(
        f"/restaurants/{rest_id}/menu",
        headers=headers_owner,
        json={"name": "Spaghetti Bolognese", "price": 12.50, "is_available": True},
    )
    # Dish 2: Unavailable (Sold out)
    client.post(
        f"/restaurants/{rest_id}/menu",
        headers=headers_owner,
        json={"name": "Truffle Ravioli", "price": 18.00, "is_available": False},
    )

    # Customer viewing menu
    token_customer = helper_register_and_login("Eve Student", "eve@student.edu", "customer")
    res_cust = client.get(
        f"/restaurants/{rest_id}/menu",
        headers={"Authorization": f"Bearer {token_customer}"},
    )
    cust_items = res_cust.json()["items"]
    assert len(cust_items) == 1
    assert cust_items[0]["name"] == "Spaghetti Bolognese"

    # Owner viewing menu -> sees both available and unavailable
    res_own = client.get(f"/restaurants/{rest_id}/menu", headers=headers_owner)
    own_items = res_own.json()["items"]
    assert len(own_items) == 2


def test_search_by_name_and_price_filtering():
    """Verify search by dish name and filtering by min/max price."""
    token_owner = helper_register_and_login("Burger Kingpin", "burger@campus.edu", "restaurant_owner")
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    res_rest = client.post(
        "/restaurants",
        headers=headers_owner,
        json={"name": "Campus Burger Bar", "description": "Gourmet burgers"},
    )
    rest_id = res_rest.json()["id"]

    client.post(f"/restaurants/{rest_id}/menu", headers=headers_owner, json={"name": "Classic Cheeseburger", "price": 8.50})
    client.post(f"/restaurants/{rest_id}/menu", headers=headers_owner, json={"name": "Double Bacon Burger", "price": 11.50})
    client.post(f"/restaurants/{rest_id}/menu", headers=headers_owner, json={"name": "Veggie Quinoa Salad", "price": 6.50})

    # Search keyword "Burger"
    res_search = client.get(f"/restaurants/{rest_id}/menu?q=Burger", headers=headers_owner)
    search_names = [i["name"] for i in res_search.json()["items"]]
    assert "Classic Cheeseburger" in search_names
    assert "Double Bacon Burger" in search_names
    assert "Veggie Quinoa Salad" not in search_names

    # Filter price: min=7.00, max=10.00
    res_price = client.get(f"/restaurants/{rest_id}/menu?min_price=7.00&max_price=10.00", headers=headers_owner)
    price_items = res_price.json()["items"]
    assert len(price_items) == 1
    assert price_items[0]["name"] == "Classic Cheeseburger"


def test_pagination_returns_correct_slices():
    """Verify pagination returns correct page_size and total_count."""
    token = helper_register_and_login("Paginator", "page@test.edu", "restaurant_owner")
    headers = {"Authorization": f"Bearer {token}"}
    res_rest = client.post("/restaurants", headers=headers, json={"name": "Paging Diner"})
    rest_id = res_rest.json()["id"]

    for i in range(5):
        client.post(f"/restaurants/{rest_id}/menu", headers=headers, json={"name": f"Dish {i+1}", "price": 5.0 + i})

    # Page 1, size 2
    res_p1 = client.get(f"/restaurants/{rest_id}/menu?page=1&page_size=2", headers=headers)
    p1_data = res_p1.json()
    assert p1_data["total_count"] == 5
    assert len(p1_data["items"]) == 2
    assert p1_data["page"] == 1
    assert p1_data["page_size"] == 2

    # Page 3, size 2 (should have 1 item left)
    res_p3 = client.get(f"/restaurants/{rest_id}/menu?page=3&page_size=2", headers=headers)
    p3_data = res_p3.json()
    assert p3_data["total_count"] == 5
    assert len(p3_data["items"]) == 1
    assert p3_data["page"] == 3


def test_invalid_prices_rejected():
    """Verify price <= 0 is rejected by validation."""
    token = helper_register_and_login("Price Tester", "price@test.edu", "restaurant_owner")
    headers = {"Authorization": f"Bearer {token}"}
    res_rest = client.post("/restaurants", headers=headers, json={"name": "Price Check Diner"})
    rest_id = res_rest.json()["id"]

    # Price = 0
    res_zero = client.post(
        f"/restaurants/{rest_id}/menu",
        headers=headers,
        json={"name": "Freebie Item", "price": 0.0},
    )
    assert res_zero.status_code == 422

    # Price = -4.50
    res_neg = client.post(
        f"/restaurants/{rest_id}/menu",
        headers=headers,
        json={"name": "Negative Item", "price": -4.50},
    )
    assert res_neg.status_code == 422


def test_soft_delete_preserves_ordered_items():
    """Verify deleting a dish already ordered marks is_available=False instead of deleting the row."""
    token = helper_register_and_login("Soft Delete Chef", "softdel@test.edu", "restaurant_owner")
    headers = {"Authorization": f"Bearer {token}"}
    res_rest = client.post("/restaurants", headers=headers, json={"name": "Historic Bistro"})
    rest_id = res_rest.json()["id"]

    res_dish = client.post(
        f"/restaurants/{rest_id}/menu",
        headers=headers,
        json={"name": "Heritage Stew", "price": 10.0},
    )
    dish_id = res_dish.json()["id"]

    # Simulate an existing order referencing this dish directly in database
    db = SessionLocal()
    try:
        # Create a mock order and order_item
        owner = db.query(OrderItem).first()
        dummy_order = Order(
            customer_id=1,
            restaurant_id=rest_id,
            status="PLACED",
            payment_status="PAID",
            total_amount=10.0,
            delivery_address="Dorm Room 101",
        )
        db.add(dummy_order)
        db.commit()
        db.refresh(dummy_order)

        order_item = OrderItem(
            order_id=dummy_order.id,
            menu_item_id=dish_id,
            quantity=1,
            price_at_order=10.0,
        )
        db.add(order_item)
        db.commit()
    finally:
        db.close()

    # Attempt DELETE on the ordered dish
    res_del = client.delete(f"/menu-items/{dish_id}", headers=headers)
    assert res_del.status_code == 200
    assert res_del.json()["action"] == "soft_deleted"

    # Verify dish still exists in DB, but is_available is now False
    res_get = client.get(f"/menu-items/{dish_id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["is_available"] is False
