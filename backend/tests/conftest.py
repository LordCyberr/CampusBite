import pytest
from app.database import SessionLocal
from app.models import User, Restaurant, MenuItem, Order, OrderItem, Review, PaymentLedger, AdminReminderLog


@pytest.fixture(scope="session", autouse=True)
def clean_db_session():
    """Ensure clean database state before test suite runs, and re-seed demo data after tests finish."""
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

    # Automatically re-seed the live database after tests complete so UI and demo logins always work
    try:
        from seed import seed_database
        from seed_demo_users import seed_demo_accounts
        seed_database()
        seed_demo_accounts()
    except Exception as e:
        print(f"Error re-seeding demo database after tests: {e}")
