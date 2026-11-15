from fastapi.testclient import TestClient
from sqlalchemy import inspect
from app.main import app
from app.database import engine, Base


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"


def test_tables_created():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    expected_tables = {
        "users",
        "restaurants",
        "menu_items",
        "orders",
        "order_items",
        "reviews",
        "payment_ledgers",
        "admin_reminder_logs",
    }
    assert expected_tables.issubset(set(tables))


def test_user_columns():
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("users")}
    expected = {"id", "name", "email", "hashed_password", "role", "created_at"}
    assert expected.issubset(columns)


def test_order_columns():
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("orders")}
    expected = {
        "id",
        "customer_id",
        "restaurant_id",
        "delivery_partner_id",
        "status",
        "payment_status",
        "return_status",
        "return_reason",
        "total_amount",
        "delivery_address",
        "created_at",
        "updated_at",
    }
    assert expected.issubset(columns)
