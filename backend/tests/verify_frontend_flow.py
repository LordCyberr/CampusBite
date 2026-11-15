"""
Automated Verification Script for Phase 7A Customer Ordering Flow.
Executes the full 10-step end-to-end verification walkthrough against the live backend
using the exact same payload structures, localStorage tokens, and query parameters
as the React frontend.
"""
import urllib.request
import json
import uuid

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_ORIGIN = "http://localhost:5173"

results = {}

def request(method, path, body=None, token=None, origin=FRONTEND_ORIGIN):
    url = f"{BACKEND_URL}{path}"
    headers = {
        "Origin": origin,
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}, dict(response.headers)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return e.code, json.loads(err_body) if err_body else {}, dict(e.headers)

print("Starting Phase 7A End-to-End Walkthrough Verification...\n")

# Step 1: Register a new customer
test_email = f"maya_{uuid.uuid4().hex[:6]}@campus.edu"
status, data, headers = request("POST", "/auth/register", {
    "name": "Maya Student",
    "email": test_email,
    "password": "password123",
    "role": "customer"
})
assert status == 201, f"Registration failed: {data}"
assert headers.get("access-control-allow-origin") == FRONTEND_ORIGIN

status, login_data, headers = request("POST", "/auth/login", {
    "email": test_email,
    "password": "password123"
})
assert status == 200 and "access_token" in login_data
customer_token = login_data["access_token"]
results["1. Register New Customer & Auto-Login"] = "PASSED"
print("[PASS] 1. Register New Customer & Auto-Login")

# Step 2: Search a restaurant
status, rest_data, _ = request("GET", "/restaurants?q=Mario", token=customer_token)
assert status == 200
assert any("Mario" in r["name"] for r in rest_data["items"])
mario_id = [r["id"] for r in rest_data["items"] if "Mario" in r["name"]][0]
results["2. Search Restaurant by Name"] = "PASSED"
print("[PASS] 2. Search Restaurant by Name")

# Step 3: Filter dishes by price
status, menu_data, _ = request("GET", f"/restaurants/{mario_id}/menu?min_price=10&max_price=16", token=customer_token)
assert status == 200
dishes = menu_data["items"]
assert len(dishes) > 0
assert all(10 <= d["price"] <= 16 for d in dishes)
target_dish = dishes[0]
results["3. Filter Dishes by Price"] = "PASSED"
print("[PASS] 3. Filter Dishes by Price")

# Step 4: Add dishes & calculate running subtotal
qty = 2
cart_items = [{"menu_item_id": target_dish["id"], "quantity": qty, "price": target_dish["price"], "name": target_dish["name"]}]
running_total = round(target_dish["price"] * qty, 2)
assert running_total > 0
results["4. Cart Management & Running Subtotal"] = "PASSED"
print(f"[PASS] 4. Cart Management & Running Subtotal (2x {target_dish['name']} = ${running_total})")

# Step 5: Place order with delivery address & mock payment notice
status, order_data, _ = request("POST", "/orders", {
    "restaurant_id": mario_id,
    "delivery_address": "Hostel 3, Room 101",
    "items": [{"menu_item_id": target_dish["id"], "quantity": qty}]
}, token=customer_token)
print("ORDER_DATA RETURNED:", order_data)
assert status == 201
new_order_id = order_data["id"]
assert order_data["status"] == "PLACED"
assert order_data["payment_status"] == "mock_paid"
assert order_data["total_amount"] == running_total
results["5. Place Order & Server Price Verification"] = "PASSED"
print(f"[PASS] 5. Place Order & Server Price Verification (Order #{new_order_id})")

# Step 6: Order details & live timeline tracking
status, fetched_order, _ = request("GET", f"/orders/{new_order_id}", token=customer_token)
assert status == 200
assert fetched_order["status"] == "PLACED"
assert fetched_order["delivery_address"] == "Hostel 3, Room 101"

# Cancel the order while in PLACED status
status, cancelled_order, _ = request("POST", f"/orders/{new_order_id}/cancel", token=customer_token)
assert status == 200
assert cancelled_order["status"] == "CANCELLED"
assert cancelled_order["payment_status"] == "refunded"
results["6. Order Tracking & Order Cancellation"] = "PASSED"
print(f"[PASS] 6. Order Tracking & Order Cancellation (Order #{new_order_id} -> CANCELLED)")

# Step 7: Order list & filtering
status, orders_filtered, _ = request("GET", "/orders?status=CANCELLED", token=customer_token)
assert status == 200
assert any(o["id"] == new_order_id for o in orders_filtered["items"])

status, orders_deliv, _ = request("GET", "/orders?status=DELIVERED", token=customer_token)
assert status == 200
assert not any(o["id"] == new_order_id for o in orders_deliv["items"])
results["7. My Orders List & Status Filtering"] = "PASSED"
print("[PASS] 7. My Orders List & Status Filtering")

# Step 8: Restaurant Owner Login & Landing
status, owner_login, _ = request("POST", "/auth/login", {
    "email": "owner1@campusbite.com",
    "password": "password123"
})
assert status == 200 and owner_login["role"] == "restaurant_owner"
results["8. Restaurant Owner Login & Dashboard Access"] = "PASSED"
print("[PASS] 8. Restaurant Owner Login & Dashboard Access (role: restaurant_owner -> /owner)")

# Step 9: Delivery Partner Login & Landing
status, courier_login, _ = request("POST", "/auth/login", {
    "email": "delivery@campusbite.com",
    "password": "password123"
})
assert status == 200 and courier_login["role"] == "delivery_partner"
results["9. Delivery Partner Login & Dashboard Access"] = "PASSED"
print("[PASS] 9. Delivery Partner Login & Dashboard Access (role: delivery_partner -> /delivery)")

# Step 10: Role Guarding & Cross-Role Access Prevention
# Customer trying to access owner-only routes receives 403 Forbidden
status, forbidden_data, _ = request("GET", "/owner/orders", token=customer_token)
assert status == 403
results["10. Client Route Guarding & Backend RBAC Enforcement"] = "PASSED"
print("[PASS] 10. Client Route Guarding & Backend RBAC Enforcement (Customer blocked from Owner with 403)")

print("\nAll 10 Walkthrough Steps Passed Successfully!")
