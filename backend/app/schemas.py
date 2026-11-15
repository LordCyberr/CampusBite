"""
Pydantic schemas for request validation and response serialization.
Ensures strong typing, data integrity, and excludes sensitive fields like hashed_password.
"""
from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, EmailStr, Field

T = TypeVar("T")


# --- Health Schema ---

class HealthResponse(BaseModel):
    status: str
    database: str


# --- Auth Schemas ---

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="customer")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Pagination Schema ---

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total_count: int
    page: int
    page_size: int


# --- Restaurant Schemas ---

class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class RestaurantUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class RestaurantResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Menu Item Schemas ---

class MenuItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    price: float = Field(..., gt=0)
    is_available: bool = Field(default=True)


class MenuItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    price: Optional[float] = Field(default=None, gt=0)


class MenuItemAvailabilityUpdate(BaseModel):
    is_available: bool


class MenuItemResponse(BaseModel):
    id: int
    restaurant_id: int
    name: str
    description: Optional[str]
    price: float
    is_available: bool

    model_config = ConfigDict(from_attributes=True)


# --- Order Schemas ---

class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., ge=1, description="Quantity must be at least 1")


class OrderCreate(BaseModel):
    restaurant_id: int
    delivery_address: str = Field(..., min_length=1, max_length=255, description="Delivery address must not be empty")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one item")


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    quantity: int
    price_at_order: float

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    restaurant_id: int
    delivery_partner_id: Optional[int] = None
    status: str
    payment_status: str
    return_status: Optional[str] = None
    return_reason: Optional[str] = None
    has_review: bool = False
    total_amount: float
    delivery_address: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    customer_name: Optional[str] = None
    restaurant_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="Target order status")


class OrderAssignUpdate(BaseModel):
    delivery_partner_id: int = Field(..., description="ID of delivery partner user")


# --- Review Schemas ---

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Whole number rating from 1 to 5")
    comment: Optional[str] = Field(default=None, max_length=500)


class ReviewResponse(BaseModel):
    id: int
    order_id: int
    customer_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    customer_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RestaurantReviewsResponse(BaseModel):
    items: List[ReviewResponse]
    total_count: int
    page: int
    page_size: int
    average_rating: float
    total_reviews: int


# --- Return & Refund Schemas ---

class ReturnRequestCreate(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500, description="Reason for return request (min 5 characters)")


class ReturnDecisionUpdate(BaseModel):
    decision: str = Field(..., description="'approve' or 'reject'")


# --- Restaurant Analytics Schemas ---

class TopDishStat(BaseModel):
    dish_name: str
    quantity_sold: int


class RestaurantStatsResponse(BaseModel):
    total_orders: int
    orders_per_status: dict[str, int]
    total_revenue: float
    average_rating: float
    top_three_dishes: List[TopDishStat]
    pending_return_requests: int


# --- Phase 6: Reminder & AI Insights Schemas ---

class ReminderResponse(BaseModel):
    id: int
    order_id: int
    restaurant_id: int
    message: str
    created_at: datetime
    order_status: str
    is_still_pending: bool

    model_config = ConfigDict(from_attributes=True)


class AIInsightsRequest(BaseModel):
    question: Optional[str] = Field(default=None, max_length=300)


class AIInsightsResponse(BaseModel):
    answer: str
    orders_considered: int


