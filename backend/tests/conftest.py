import pytest
from app.database import SessionLocal
from app.models import User, Restaurant, MenuItem, Order, OrderItem, Review, PaymentLedger, AdminReminderLog


@pytest.fixture(scope="session", autouse=True)
def clean_db_session():
    """Ensure clean database state before test suite runs."""
    db = SessionLocal()
    try:
        db.query(Review).delete()
        db.query(PaymentLedger).delete()
        db.query(AdminReminderLog).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(MenuItem).delete()
        db.query(Restaurant).delete()
        db.query(User).delete()
        db.commit()
    finally:
        db.close()
    yield
