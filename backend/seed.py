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
        "name": "Ramesh Kaka (Chai Tapri)",
        "email": "owner_chai@campusbite.com",
        "password": "password123",
        "role": UserRole.RESTAURANT_OWNER.value,
    },
    {
        "name": "Anna Murugan (South Tiffins)",
        "email": "owner_anna@campusbite.com",
        "password": "password123",
        "role": UserRole.RESTAURANT_OWNER.value,
    },
    {
        "name": "Biplab Da (Kathi Rolls)",
        "email": "owner_rolls@campusbite.com",
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
        "name": "Mario's Desi Pizza & Cafe",
        "description": "Desi-Italian fusion wood-fired pizzas, cheesy garlic breads, and cold brews.",
        "dishes": [
            {"name": "Tandoori Paneer Makhani Pizza", "description": "Wood-fired crust with rich makhani gravy, paneer tikka, capsicum, red onions & mozzarella", "price": 11.99, "is_available": True},
            {"name": "Chicken Tikka Feast Pizza", "description": "Tandoori chicken tikka, spiced paprika, jalapeños, onions and double mozzarella", "price": 12.49, "is_available": True},
            {"name": "Classic Margherita Pizza", "description": "Fresh tomato herb sauce, melted mozzarella, and fresh basil leaves", "price": 9.99, "is_available": True},
            {"name": "Cheesy Garlic Stuffed Bread", "description": "Warm garlic butter bread stuffed with gooey mozzarella and sweet corn", "price": 5.49, "is_available": True},
            {"name": "Peri-Peri Paneer Pizza", "description": "Spicy peri-peri seasoned paneer chunks, bell peppers and molten cheese", "price": 13.99, "is_available": True},
            {"name": "Chocolate Brownie with Hot Fudge", "description": "Warm fudgy walnut brownie served with hot chocolate syrup", "price": 4.50, "is_available": True},
        ],
    },
    {
        "owner_email": "owner2@campusbite.com",
        "name": "Spice Junction • Desi Dhaba & Canteen",
        "description": "Authentic North Indian student thalis, fragrant biryanis, parathas, and homestyle dal.",
        "dishes": [
            {"name": "Student Special Desi Thali", "description": "Dal Tadka, Paneer Butter Masala, 2 Butter Rotis, Steamed Jeera Rice & Gulab Jamun", "price": 7.99, "is_available": True},
            {"name": "Chicken Tikka Biryani", "description": "Aromatic long-grain basmati layered with tender spiced chicken & boondi raita", "price": 8.99, "is_available": True},
            {"name": "Butter Chicken & Naan Combo", "description": "Creamy rich butter chicken served with 2 hot butter naans", "price": 9.49, "is_available": True},
            {"name": "Paneer Butter Masala Bowl", "description": "Soft cottage cheese in rich tomato-cashew gravy with jeera rice", "price": 7.49, "is_available": True},
            {"name": "Rajma Chawal Desi Bowl", "description": "Slow-cooked spiced Punjabi rajma served over piping hot basmati rice", "price": 5.49, "is_available": True},
            {"name": "Chole Bhature Combo (2 pcs)", "description": "Fluffy golden bhaturas with spicy Amritsari chole, pickled onions & green chilli", "price": 5.99, "is_available": True},
            {"name": "Patiala Sweet Lassi", "description": "Thick churned sweet yogurt topped with malai and saffron cardamom", "price": 2.99, "is_available": True},
            {"name": "Garam Gulab Jamun (2 pcs)", "description": "Soft fried milk dumplings soaked in warm rose-cardamom sugar syrup", "price": 2.49, "is_available": True},
        ],
    },
    {
        "owner_email": "owner_chai@campusbite.com",
        "name": "Chai Tapri & Nescafe Corner",
        "description": "Campus landmark for midnight study breaks, kadak tapri chai, steaming Maggi, and bun maska.",
        "dishes": [
            {"name": "Kadak Masala Kulhad Chai", "description": "Slow-brewed strong tea infused with crushed ginger, cardamom and cloves in earthen kulhad", "price": 0.99, "is_available": True},
            {"name": "Double Masala Cheese Maggi", "description": "Late-night classic Maggi noodles with double tastemaker, sweet corn and grated Amul cheese", "price": 2.49, "is_available": True},
            {"name": "Butter Egg Maggi", "description": "Spicy Maggi noodles tossed with scrambled egg and a dollop of melted butter", "price": 2.29, "is_available": True},
            {"name": "Classic Bun Maska", "description": "Warm toasted sweet bakery bun generously slathered with salted Amul butter", "price": 1.49, "is_available": True},
            {"name": "Crispy Aloo Samosa (2 pcs)", "description": "Piping hot golden potato-pea pastries served with tangy tamarind & mint chutney", "price": 1.29, "is_available": True},
            {"name": "Paneer Bread Pakora", "description": "Spiced potato and paneer slab stuffed in bread, gram-flour battered and deep fried", "price": 1.89, "is_available": True},
            {"name": "Iced Nescafe Cold Coffee", "description": "Thick blended creamy cold coffee with chocolate syrup and vanilla scoop", "price": 2.49, "is_available": True},
        ],
    },
    {
        "owner_email": "owner_anna@campusbite.com",
        "name": "Anna's South Indian Tiffin Center",
        "description": "Crispy ghee roast dosas, steaming hot idlis, medu vadas, and authentic degree filter coffee.",
        "dishes": [
            {"name": "Crispy Ghee Masala Dosa", "description": "Golden thin crepe roasted with pure desi ghee, stuffed with aloo masala, 3 chutneys & piping sambar", "price": 3.99, "is_available": True},
            {"name": "Steamed Idli-Vada Combo", "description": "2 soft steamed rice cakes + 1 crispy medu vada with fresh coconut chutney and hot sambar", "price": 2.99, "is_available": True},
            {"name": "Mysore Masala Dosa", "description": "Crisp dosa smeared with spicy red garlic-chilli chutney and mashed potato bhaji", "price": 4.49, "is_available": True},
            {"name": "Onion Rava Masala Dosa", "description": "Lacy semolina crepe with chopped green chillies, onions, coriander and cumin", "price": 4.29, "is_available": True},
            {"name": "Madras Degree Filter Coffee", "description": "Freshly brewed chicory coffee frothed with boiling whole milk in traditional brass davarah", "price": 1.49, "is_available": True},
        ],
    },
    {
        "owner_email": "owner_rolls@campusbite.com",
        "name": "Kolkata Kathi Rolls & Street Bites",
        "description": "Legendary flaky paratha rolls stuffed with tandoori tikka, crunchy onions, and lemon chaat masala.",
        "dishes": [
            {"name": "Paneer Tikka Kathi Roll", "description": "Char-grilled marinated paneer cubes wrapped in layered flaky paratha with mint chutney and onions", "price": 3.99, "is_available": True},
            {"name": "Double Egg Chicken Roll", "description": "Pan-fried paratha layered with 2 beaten eggs, stuffed with juicy spiced chicken bhuna", "price": 4.79, "is_available": True},
            {"name": "Aloo Tikki Desi Burger", "description": "Crispy spiced potato patty burger with tandoori mayo, onion rings and mint spread", "price": 2.49, "is_available": True},
            {"name": "Peri-Peri Masala Fries", "description": "Crispy golden potato fries generously tossed in spicy Indian peri-peri seasoning", "price": 2.29, "is_available": True},
            {"name": "Masala Lemon Chaat Soda", "description": "Fizzy chilled soda with fresh lemon juice, roasted cumin, black salt and mint", "price": 1.49, "is_available": True},
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
            else:
                restaurant.name = r_data["name"]
                restaurant.description = r_data["description"]
                db.commit()
                db.refresh(restaurant)
            rest_map[r_data["name"]] = restaurant
            rest_map[owner.email] = restaurant

            # Seed / update Menu Items for this restaurant
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
                else:
                    existing_dish.description = d["description"]
                    existing_dish.price = d["price"]
                    existing_dish.is_available = d["is_available"]
            db.commit()

        # 3. Seed Sample Orders for Dashboard Demonstration
        alex = user_map.get("customer@campusbite.com")
        sam = user_map.get("delivery@campusbite.com")
        mario_rest = rest_map.get("Mario's Desi Pizza & Cafe") or rest_map.get("owner1@campusbite.com")

        if alex and sam and mario_rest:
            dishes = db.query(MenuItem).filter(MenuItem.restaurant_id == mario_rest.id).all()
            dish_margherita = next((d for d in dishes if "Margherita" in d.name), dishes[0])
            dish_pepperoni = next((d for d in dishes if "Tikka" in d.name or ("Pizza" in d.name and d.id != dish_margherita.id)), dishes[1] if len(dishes) > 1 else dish_margherita)

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
