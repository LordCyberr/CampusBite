"""
Seed demo accounts for CampusBite so demo logins and walkthrough tests work seamlessly.
"""
from app.database import SessionLocal
from app.models import User, Restaurant, UserRole
from app.auth import hash_password

def seed_demo_accounts():
    db = SessionLocal()
    try:
        demo_accounts = [
            ("Alex Student", "customer@campusbite.com", "customer"),
            ("Student One", "student1@campusbite.com", "customer"),
            ("Mario Chef", "owner1@campusbite.com", "restaurant_owner"),
            ("Sam Courier", "delivery@campusbite.com", "delivery_partner"),
        ]

        created_users = {}
        for name, email, role in demo_accounts:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    name=name,
                    email=email,
                    hashed_password=hash_password("password123"),
                    role=role,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"Created {role} user: {email} (ID: {user.id})")
            else:
                user.hashed_password = hash_password("password123")
                db.commit()
                print(f"Updated password for {email} (ID: {user.id})")
            created_users[email] = user

        # Ensure all existing delivery partners and owners have known password
        all_couriers = db.query(User).filter(User.role == "delivery_partner").all()
        for c in all_couriers:
            c.hashed_password = hash_password("password123")
        db.commit()
        print(f"Set password123 for {len(all_couriers)} delivery partners.")
        mario = created_users["owner1@campusbite.com"]
        rest1 = db.query(Restaurant).filter(Restaurant.id == 1).first()
        if rest1:
            rest1.owner_id = mario.id
            db.commit()
            print(f"Assigned Restaurant #1 ({rest1.name}) to owner {mario.email} (ID: {mario.id})")

            # Seed classic menu items for Restaurant 1
            from app.models import MenuItem
            existing_dishes = db.query(MenuItem).filter(MenuItem.restaurant_id == 1).count()
            if existing_dishes == 0:
                sample_dishes = [
                    MenuItem(restaurant_id=1, name="Margherita Pizza", description="Fresh basil, mozzarella, and san marzano tomato sauce", price=12.99, is_available=True),
                    MenuItem(restaurant_id=1, name="Spicy Pepperoni Pizza", description="Artisan pepperoni with hot honey drizzle and mozzarella", price=15.49, is_available=True),
                    MenuItem(restaurant_id=1, name="Garlic Herb Breadsticks", description="Crispy oven-baked breadsticks with marinara dipping sauce", price=5.99, is_available=True),
                    MenuItem(restaurant_id=1, name="Classic Tiramisu Cup", description="Espresso-soaked ladyfingers with mascarpone cream", price=4.50, is_available=True),
                ]
                db.add_all(sample_dishes)
                db.commit()
                print("Seeded 4 menu items for Mario's Campus Pizzeria")

    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_accounts()
