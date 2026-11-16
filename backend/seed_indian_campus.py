"""
Populates CampusBite with authentic Indian Campus Canteens, Cafeterias, Tapris and Stalls.
"""
from app.database import SessionLocal
from app.models import User, Restaurant, MenuItem, UserRole
from app.auth import hash_password

INDIAN_OWNERS = [
    {"name": "Mario Rossi", "email": "owner1@campusbite.com", "password": "password123"},
    {"name": "Priya Sharma (Spice Junction)", "email": "owner2@campusbite.com", "password": "password123"},
    {"name": "Ramesh Kaka (Chai Tapri)", "email": "owner_chai@campusbite.com", "password": "password123"},
    {"name": "Anna Murugan (South Tiffins)", "email": "owner_anna@campusbite.com", "password": "password123"},
    {"name": "Biplab Da (Kathi Rolls)", "email": "owner_rolls@campusbite.com", "password": "password123"},
]

INDIAN_RESTAURANTS = [
    {
        "id": 1,
        "name": "Mario's Desi Pizza & Cafe",
        "description": "Desi-Italian fusion wood-fired pizzas, cheesy garlic breads, and cold brews.",
        "owner_email": "owner1@campusbite.com",
        "dishes": [
            {"name": "Tandoori Paneer Makhani Pizza", "description": "Wood-fired crust with rich makhani gravy, paneer tikka, capsicum, red onions & mozzarella", "price": 2.38, "is_available": True},
            {"name": "Chicken Tikka Feast Pizza", "description": "Tandoori chicken tikka, spiced paprika, jalapeños, onions and double mozzarella", "price": 2.69, "is_available": True},
            {"name": "Classic Margherita Pizza", "description": "Fresh tomato herb sauce, melted mozzarella, and fresh basil leaves", "price": 1.78, "is_available": True},
            {"name": "Cheesy Garlic Stuffed Bread", "description": "Warm garlic butter bread stuffed with gooey mozzarella and sweet corn", "price": 1.02, "is_available": True},
            {"name": "Peri-Peri Paneer Pizza", "description": "Spicy peri-peri seasoned paneer chunks, bell peppers and molten cheese", "price": 2.26, "is_available": True},
            {"name": "Chocolate Brownie with Hot Fudge", "description": "Warm fudgy walnut brownie served with hot chocolate syrup", "price": 0.90, "is_available": True},
        ]
    },
    {
        "id": 2,
        "name": "Spice Junction • Desi Dhaba & Canteen",
        "description": "Authentic North Indian student thalis, fragrant biryanis, parathas, and homestyle dal.",
        "owner_email": "owner2@campusbite.com",
        "dishes": [
            {"name": "Student Special Desi Thali", "description": "Dal Tadka, Paneer Butter Masala, 2 Butter Rotis, Steamed Jeera Rice & Gulab Jamun", "price": 1.68, "is_available": True},
            {"name": "Chicken Tikka Biryani", "description": "Aromatic long-grain basmati layered with tender spiced chicken & boondi raita", "price": 1.92, "is_available": True},
            {"name": "Butter Chicken & Naan Combo", "description": "Creamy rich butter chicken served with 2 hot butter naans", "price": 2.10, "is_available": True},
            {"name": "Paneer Butter Masala Bowl", "description": "Soft cottage cheese in rich tomato-cashew gravy with jeera rice", "price": 1.62, "is_available": True},
            {"name": "Rajma Chawal Desi Bowl", "description": "Slow-cooked spiced Punjabi rajma served over piping hot basmati rice", "price": 1.14, "is_available": True},
            {"name": "Chole Bhature Combo (2 pcs)", "description": "Fluffy golden bhaturas with spicy Amritsari chole, pickled onions & green chilli", "price": 1.32, "is_available": True},
            {"name": "Patiala Sweet Lassi", "description": "Thick churned sweet yogurt topped with malai and saffron cardamom", "price": 0.60, "is_available": True},
            {"name": "Garam Gulab Jamun (2 pcs)", "description": "Soft fried milk dumplings soaked in warm rose-cardamom sugar syrup", "price": 0.48, "is_available": True},
        ]
    },
    {
        "name": "Chai Tapri & Nescafe Corner",
        "description": "Campus landmark for midnight study breaks, kadak tapri chai, steaming Maggi, and bun maska.",
        "owner_email": "owner_chai@campusbite.com",
        "dishes": [
            {"name": "Kadak Masala Kulhad Chai", "description": "Slow-brewed strong tea infused with crushed ginger, cardamom and cloves in earthen kulhad", "price": 0.24, "is_available": True},
            {"name": "Double Masala Cheese Maggi", "description": "Late-night classic Maggi noodles with double tastemaker, sweet corn and grated Amul cheese", "price": 0.78, "is_available": True},
            {"name": "Butter Egg Maggi", "description": "Spicy Maggi noodles tossed with scrambled egg and a dollop of melted butter", "price": 0.72, "is_available": True},
            {"name": "Classic Bun Maska", "description": "Warm toasted sweet bakery bun generously slathered with salted Amul butter", "price": 0.42, "is_available": True},
            {"name": "Crispy Aloo Samosa (2 pcs)", "description": "Piping hot golden potato-pea pastries served with tangy tamarind & mint chutney", "price": 0.36, "is_available": True},
            {"name": "Paneer Bread Pakora", "description": "Spiced potato and paneer slab stuffed in bread, gram-flour battered and deep fried", "price": 0.54, "is_available": True},
            {"name": "Iced Nescafe Cold Coffee", "description": "Thick blended creamy cold coffee with chocolate syrup and vanilla scoop", "price": 0.78, "is_available": True},
        ]
    },
    {
        "name": "Anna's South Indian Tiffin Center",
        "description": "Crispy ghee roast dosas, steaming hot idlis, medu vadas, and authentic degree filter coffee.",
        "owner_email": "owner_anna@campusbite.com",
        "dishes": [
            {"name": "Crispy Ghee Masala Dosa", "description": "Golden thin crepe roasted with pure desi ghee, stuffed with aloo masala, 3 chutneys & piping sambar", "price": 1.02, "is_available": True},
            {"name": "Steamed Idli-Vada Combo", "description": "2 soft steamed rice cakes + 1 crispy medu vada with fresh coconut chutney and hot sambar", "price": 0.78, "is_available": True},
            {"name": "Mysore Masala Dosa", "description": "Crisp dosa smeared with spicy red garlic-chilli chutney and mashed potato bhaji", "price": 1.14, "is_available": True},
            {"name": "Onion Rava Masala Dosa", "description": "Lacy semolina crepe with chopped green chillies, onions, coriander and cumin", "price": 1.08, "is_available": True},
            {"name": "Madras Degree Filter Coffee", "description": "Freshly brewed chicory coffee frothed with boiling whole milk in traditional brass davarah", "price": 0.36, "is_available": True},
        ]
    },
    {
        "name": "Kolkata Kathi Rolls & Street Bites",
        "description": "Legendary flaky paratha rolls stuffed with tandoori tikka, crunchy onions, and lemon chaat masala.",
        "owner_email": "owner_rolls@campusbite.com",
        "dishes": [
            {"name": "Paneer Tikka Kathi Roll", "description": "Char-grilled marinated paneer cubes wrapped in layered flaky paratha with mint chutney and onions", "price": 1.14, "is_available": True},
            {"name": "Double Egg Chicken Roll", "description": "Pan-fried paratha layered with 2 beaten eggs, stuffed with juicy spiced chicken bhuna", "price": 1.44, "is_available": True},
            {"name": "Aloo Tikki Desi Burger", "description": "Crispy spiced potato patty burger with tandoori mayo, onion rings and mint spread", "price": 0.66, "is_available": True},
            {"name": "Peri-Peri Masala Fries", "description": "Crispy golden potato fries generously tossed in spicy Indian peri-peri seasoning", "price": 0.72, "is_available": True},
            {"name": "Masala Lemon Chaat Soda", "description": "Fizzy chilled soda with fresh lemon juice, roasted cumin, black salt and mint", "price": 0.42, "is_available": True},
        ]
    }
]

def seed():
    db = SessionLocal()
    try:
        user_map = {}
        for o in INDIAN_OWNERS:
            user = db.query(User).filter(User.email == o["email"]).first()
            if not user:
                user = User(
                    name=o["name"],
                    email=o["email"],
                    hashed_password=hash_password(o["password"]),
                    role=UserRole.RESTAURANT_OWNER.value,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            user_map[o["email"]] = user

        for r_data in INDIAN_RESTAURANTS:
            owner = user_map[r_data["owner_email"]]
            # Check if restaurant exists by ID (for 1 and 2) or by name
            rest = None
            if "id" in r_data:
                rest = db.query(Restaurant).filter(Restaurant.id == r_data["id"]).first()
            if not rest:
                rest = db.query(Restaurant).filter(Restaurant.name == r_data["name"]).first()

            if rest:
                rest.name = r_data["name"]
                rest.description = r_data["description"]
                rest.owner_id = owner.id
                db.commit()
                db.refresh(rest)
                print(f"Updated Restaurant: {rest.name} (ID: {rest.id})")
            else:
                rest = Restaurant(
                    name=r_data["name"],
                    description=r_data["description"],
                    owner_id=owner.id,
                )
                db.add(rest)
                db.commit()
                db.refresh(rest)
                print(f"Created Restaurant: {rest.name} (ID: {rest.id})")

            # Seed / update dishes for this restaurant
            for d in r_data["dishes"]:
                dish = db.query(MenuItem).filter(MenuItem.restaurant_id == rest.id, MenuItem.name == d["name"]).first()
                if not dish:
                    dish = MenuItem(
                        restaurant_id=rest.id,
                        name=d["name"],
                        description=d["description"],
                        price=d["price"],
                        is_available=d["is_available"],
                    )
                    db.add(dish)
                    db.commit()
                    print(f"  Added dish: {d['name']} (₹{round(d['price'] * 83.5)} / ${d['price']:.2f})")
                else:
                    dish.description = d["description"]
                    dish.price = d["price"]
                    dish.is_available = d["is_available"]
                    db.commit()
                    print(f"  Updated dish: {d['name']} (₹{round(d['price'] * 83.5)} / ${d['price']:.2f})")

        print("Successfully populated authentic Indian campus canteens and cafes!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
