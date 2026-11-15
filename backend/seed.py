"""
Seed script for CampusBite.
Populates demo users (Owners, Customer, Delivery Partner), restaurants, dishes,
and sample orders with delivery/return states for dashboard demonstrations.
Idempotent: Running multiple times does not produce duplicate records.
"""
from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import (
    MenuItem,
    Order,
    OrderItem,
    OrderStatus,
    PaymentLedger,
    PaymentType,
    Restaurant,
    Review,
    User,
    UserRole,
)

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

SEED_USERS = [
    {
        "name": "Mario Rossi",
        "email": "owner1@campusbite.com",
        "password": "password123",
        "role": UserRole.RESTAURANT_OWNER.value,
    },
    {
        "name": "Priya Sharma",
        "email": "owner2@campusbite.com",
        "password": "password123",
        "role": UserRole.RESTAURANT_OWNER.value,
    },
    {
        "name": "Alex Student",
        "email": "customer@campusbite.com",
        "password": "password123",
        "role": UserRole.CUSTOMER.value,
    },
    {
        "name": "Sam Courier",
        "email": "delivery@campusbite.com",
        "password": "password123",
        "role": UserRole.DELIVERY_PARTNER.value,
    },
]

SEED_RESTAURANTS = [
    {
        "owner_email": "owner1@campusbite.com",
        "name": "Mario's Campus Pizzeria",
        "description": "Artisan wood-fired pizzas, garlic breads, and Italian sodas.",
        "dishes": [
            {"name": "Margherita Pizza", "description": "Classic tomato sauce, mozzarella, and fresh basil", "price": 9.99, "is_available": True},
            {"name": "Pepperoni Feast", "description": "Spicy pepperoni with double mozzarella", "price": 12.49, "is_available": True},
            {"name": "BBQ Chicken Pizza", "description": "Grilled chicken breast, red onions, smoky BBQ sauce", "price": 13.99, "is_available": True},
            {"name": "Garlic Breadsticks", "description": "Warm garlic butter breadsticks with marinara dip", "price": 5.49, "is_available": True},
            {"name": "Truffle Mushroom Pizza", "description": "Wild portobello, white truffle oil, fontina", "price": 14.99, "is_available": False},
            {"name": "San Pellegrino Limonata", "description": "Chilled sparkling Italian citrus soda", "price": 3.50, "is_available": True},
        ],
    },
    {
        "owner_email": "owner2@campusbite.com",
        "name": "Spice Junction Canteen",
        "description": "Authentic campus curry bowls, rolls, and tandoori bites.",
        "dishes": [
            {"name": "Butter Chicken Bowl", "description": "Tender chicken in creamy tomato butter sauce over basmati", "price": 10.99, "is_available": True},
            {"name": "Paneer Tikka Roll", "description": "Char-grilled spiced paneer with mint chutney in paratha", "price": 7.99, "is_available": True},
            {"name": "Crispy Samosa (2 pcs)", "description": "Golden spiced potato pastries with tamarind chutney", "price": 4.50, "is_available": True},
            {"name": "Chicken Tikka Biryani", "description": "Fragrant long-grain rice layered with spiced chicken", "price": 12.99, "is_available": True},
            {"name": "Mango Lassi", "description": "Chilled sweet mango and yogurt smoothie", "price": 4.00, "is_available": True},
            {"name": "Gulab Jamun (2 pcs)", "description": "Warm milk dumplings in cardamom sugar syrup", "price": 3.99, "is_available": False},
        ],
    },
]


def seed_database():
    db = SessionLocal()
    try:
        user_map = {}
        # 1. Seed Users
        for u in SEED_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    name=u["name"],
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                user_map[u["email"]] = user
            else:
                user_map[u["email"]] = existing

        # 2. Seed Restaurants & Dishes
        rest_map = {}
        for r_data in SEED_RESTAURANTS:
            owner = user_map.get(r_data["owner_email"])
            if not owner:
                continue

            restaurant = db.query(Restaurant).filter(Restaurant.owner_id == owner.id).first()
            if not restaurant:
                restaurant = Restaurant(
                    name=r_data["name"],
                    description=r_data["description"],
                    owner_id=owner.id,
                )
                db.add(restaurant)
                db.commit()
                db.refresh(restaurant)
            rest_map[r_data["name"]] = restaurant

            # Seed Menu Items for this restaurant
            for d in r_data["dishes"]:
                existing_dish = db.query(MenuItem).filter(
                    MenuItem.restaurant_id == restaurant.id,
                    MenuItem.name == d["name"],
                ).first()
                if not existing_dish:
                    dish = MenuItem(
                        restaurant_id=restaurant.id,
                        name=d["name"],
                        description=d["description"],
                        price=d["price"],
                        is_available=d["is_available"],
                    )
                    db.add(dish)
            db.commit()

        # 3. Seed Sample Orders for Dashboard Demonstration
        alex = user_map.get("customer@campusbite.com")
        sam = user_map.get("delivery@campusbite.com")
        mario_rest = rest_map.get("Mario's Campus Pizzeria")

        if alex and sam and mario_rest:
            dishes = db.query(MenuItem).filter(MenuItem.restaurant_id == mario_rest.id).all()
            dish_margherita = next((d for d in dishes if "Margherita" in d.name), dishes[0])
            dish_pepperoni = next((d for d in dishes if "Pepperoni" in d.name), dishes[1])

            # Sample Order 1: DELIVERED with an existing 5-star Review
            order1 = db.query(Order).filter(Order.delivery_address == "Dorm Hall A, Room 101").first()
            if not order1:
                order1 = Order(
                    customer_id=alex.id,
                    restaurant_id=mario_rest.id,
                    delivery_partner_id=sam.id,
                    status=OrderStatus.DELIVERED.value,
                    payment_status="mock_paid",
                    delivery_address="Dorm Hall A, Room 101",
                    total_amount=round(dish_margherita.price * 2, 2),
                )
                db.add(order1)
                db.flush()
                db.add(OrderItem(order_id=order1.id, menu_item_id=dish_margherita.id, quantity=2, price_at_order=dish_margherita.price))
                db.add(PaymentLedger(order_id=order1.id, type=PaymentType.MOCK_PAYMENT.value, amount=order1.total_amount, status="SUCCESS"))
                db.add(Review(order_id=order1.id, customer_id=alex.id, rating=5, comment="Fresh hot pizza, fast campus delivery!"))
                db.commit()

            # Sample Order 2: DELIVERED with NO review yet (ready for student review demo)
            order2 = db.query(Order).filter(Order.delivery_address == "Library Study Room 4").first()
            if not order2:
                order2 = Order(
                    customer_id=alex.id,
                    restaurant_id=mario_rest.id,
                    delivery_partner_id=sam.id,
                    status=OrderStatus.DELIVERED.value,
                    payment_status="mock_paid",
                    delivery_address="Library Study Room 4",
                    total_amount=round(dish_pepperoni.price, 2),
                )
                db.add(order2)
                db.flush()
                db.add(OrderItem(order_id=order2.id, menu_item_id=dish_pepperoni.id, quantity=1, price_at_order=dish_pepperoni.price))
                db.add(PaymentLedger(order_id=order2.id, type=PaymentType.MOCK_PAYMENT.value, amount=order2.total_amount, status="SUCCESS"))
                db.commit()

            # Sample Order 3: DELIVERED with a PENDING return request (return_status='requested')
            order3 = db.query(Order).filter(Order.delivery_address == "Engineering Lab 2").first()
            if not order3:
                order3 = Order(
                    customer_id=alex.id,
                    restaurant_id=mario_rest.id,
                    delivery_partner_id=sam.id,
                    status=OrderStatus.DELIVERED.value,
                    payment_status="mock_paid",
                    return_status="requested",
                    return_reason="Pizza was cold and crust was burnt on arrival.",
                    delivery_address="Engineering Lab 2",
                    total_amount=round(dish_pepperoni.price, 2),
                )
                db.add(order3)
                db.flush()
                db.add(OrderItem(order_id=order3.id, menu_item_id=dish_pepperoni.id, quantity=1, price_at_order=dish_pepperoni.price))
                db.add(PaymentLedger(order_id=order3.id, type=PaymentType.MOCK_PAYMENT.value, amount=order3.total_amount, status="SUCCESS"))
                db.commit()

        print("\n" + "=" * 65)
        print(" CampusBite Demo Seed Completed Successfully! ")
        print("=" * 65)
        print("\n[Demo User Credentials (password: 'password123')]")
        print(" - Customer:         customer@campusbite.com (Alex Student)")
        print(" - Delivery Partner: delivery@campusbite.com (Sam Courier)")
        print(" - Owner 1:          owner1@campusbite.com (Mario Rossi)")
        print(" - Owner 2:          owner2@campusbite.com (Priya Sharma)")
        print("\n[Demo Restaurants & Menus]")
        print(" 1. Mario's Campus Pizzeria (6 dishes + 3 sample demo orders)")
        print("    - Order 1: DELIVERED (Reviewed 5★)")
        print("    - Order 2: DELIVERED (No review yet - ready for demo)")
        print("    - Order 3: DELIVERED (Pending return request: 'cold & burnt')")
        print(" 2. Spice Junction Canteen (6 dishes)")
        print("=" * 65 + "\n")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
