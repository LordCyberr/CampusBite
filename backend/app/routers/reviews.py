"""
Customer Review Routes for CampusBite.
Allows customers to review delivered orders (1 review per order)
and provides paginated restaurant reviews with aggregated ratings.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_role
from ..database import get_db
from ..models import Order, OrderStatus, Restaurant, Review, User, UserRole
from ..schemas import RestaurantReviewsResponse, ReviewCreate, ReviewResponse

router = APIRouter(tags=["Reviews"])


@router.post("/orders/{order_id}/review", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_order_review(
    order_id: int,
    review_in: ReviewCreate,
    current_user: User = Depends(require_role(UserRole.CUSTOMER.value)),
    db: Session = Depends(get_db),
):
    """
    Submit a 1-to-5 star review and comment for an order.
    Enforces:
    - Customer role and order ownership.
    - Order must be in DELIVERED status.
    - Refunded orders cannot be reviewed.
    - Exactly one review per order (subsequent attempts return 409 Conflict).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # 1. Ownership check
    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this order",
        )

    # 2. Refund check
    if order.status == OrderStatus.REFUNDED.value or order.payment_status == "refunded":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refunded orders cannot be reviewed",
        )

    # 3. Delivery check
    if order.status != OrderStatus.DELIVERED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only delivered orders can be reviewed",
        )

    # 4. Single review enforcement
    existing_review = db.query(Review).filter(Review.order_id == order_id).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This order has already been reviewed",
        )

    new_review = Review(
        order_id=order.id,
        customer_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


@router.get("/restaurants/{restaurant_id}/reviews", response_model=RestaurantReviewsResponse)
def get_restaurant_reviews(
    restaurant_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve paginated reviews for a restaurant, ordered newest first.
    Includes aggregated average rating and total review count.
    Accessible to all authenticated users.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    # Calculate average rating and total count across all reviews for this restaurant
    stats = (
        db.query(
            func.count(Review.id),
            func.coalesce(func.avg(Review.rating), 0.0),
        )
        .join(Order, Review.order_id == Order.id)
        .filter(Order.restaurant_id == restaurant_id)
        .first()
    )

    total_reviews = stats[0] or 0
    average_rating = round(float(stats[1] or 0.0), 2)

    # Paginated review rows
    reviews = (
        db.query(Review)
        .join(Order, Review.order_id == Order.id)
        .filter(Order.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return RestaurantReviewsResponse(
        items=reviews,
        total_count=total_reviews,
        page=page,
        page_size=page_size,
        average_rating=average_rating,
        total_reviews=total_reviews,
    )
