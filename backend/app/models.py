from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


# --- Enums & Constants ---

class UserRole(str, Enum):
    CUSTOMER = "customer"
    RESTAURANT_OWNER = "restaurant_owner"
    DELIVERY_PARTNER = "delivery_partner"


class OrderStatus(str, Enum):
    PLACED = "PLACED"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY = "READY"
    ASSIGNED = "ASSIGNED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentType(str, Enum):
    MOCK_PAYMENT = "mock_payment"
    REFUND = "refund"


class ReturnStatus(str, Enum):
    NONE = "NONE"
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# --- Database Models ---

class User(Base):
    """User account model for Customers, Restaurant Owners, and Delivery Partners."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.CUSTOMER.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    restaurants = relationship("Restaurant", back_populates="owner")
    # Disambiguate User relationships to Order: one for placing, one for delivering
    orders = relationship("Order", foreign_keys="Order.customer_id", back_populates="customer")
    deliveries = relationship("Order", foreign_keys="Order.delivery_partner_id", back_populates="delivery_partner")
    reviews = relationship("Review", back_populates="customer")


class Restaurant(Base):
    """Restaurant profile owned by a restaurant_owner user."""
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="restaurants")
    menu_items = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="restaurant")
    reminder_logs = relationship("AdminReminderLog", back_populates="restaurant")


class MenuItem(Base):
    """Food items offered by a restaurant."""
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")


class Order(Base):
    """Customer order tracking full lifecycle and financial status."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    delivery_partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default=OrderStatus.PLACED.value, nullable=False)
    payment_status = Column(String, default=PaymentStatus.PENDING.value, nullable=False)
    return_status = Column(String, default=ReturnStatus.NONE.value, nullable=True)
    return_reason = Column(String, nullable=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    delivery_address = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
    delivery_partner = relationship("User", foreign_keys=[delivery_partner_id], back_populates="deliveries")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    # One review per order: unique constraint on Review.order_id enforces 1:1
    review = relationship("Review", back_populates="order", uselist=False)
    payment_ledgers = relationship("PaymentLedger", back_populates="order", cascade="all, delete-orphan")
    reminder_logs = relationship("AdminReminderLog", back_populates="order", cascade="all, delete-orphan")

    @property
    def customer_name(self) -> Optional[str]:
        return self.customer.name if self.customer else None

    @property
    def restaurant_name(self) -> Optional[str]:
        return self.restaurant.name if self.restaurant else None

    @property
    def has_review(self) -> bool:
        return self.review is not None


class OrderItem(Base):
    """Snapshot of ordered item quantity and price at time of purchase."""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    # Price saved at time of order in case restaurant changes menu item price later
    price_at_order = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")


class Review(Base):
    """Customer rating and comment for an order. Exactly one review per order."""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="review")
    customer = relationship("User", back_populates="reviews")

    @property
    def customer_name(self) -> Optional[str]:
        return self.customer.name if self.customer else None


class PaymentLedger(Base):
    """Ledger for all financial transactions (initial mock payment and any refund)."""
    __tablename__ = "payment_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    type = Column(String, nullable=False)  # mock_payment or refund
    amount = Column(Float, nullable=False)
    status = Column(String, default="SUCCESS", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="payment_ledgers")


class AdminReminderLog(Base):
    """Log entry generated when an order stays stuck in PLACED/ACCEPTED over 15 minutes."""
    __tablename__ = "admin_reminder_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="reminder_logs")
    restaurant = relationship("Restaurant", back_populates="reminder_logs")
