"""
Restaurant Owner Order Fulfillment Routes for CampusBite.
Provides restaurant-level order management, status updates (ACCEPTED, PREPARING, READY),
delivery partner browsing, and courier assignment.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import require_role
from ..database import get_db
from ..models import (
    AdminReminderLog,
    MenuItem,
    Order,
    OrderItem,
    OrderStatus,
    Restaurant,
    Review,
    User,
    UserRole,
)
from ..order_rules import change_status
from ..schemas import (
    OrderAssignUpdate,
    OrderResponse,
    OrderStatusUpdate,
    PaginatedResponse,
    ReminderResponse,
    RestaurantStatsResponse,
    TopDishStat,
    UserResponse,
)

router = APIRouter(tags=["Owner Orders"])


@router.get("/owner/orders", response_model=PaginatedResponse[OrderResponse])
def get_owner_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="Filter orders from date"),
    date_to: Optional[datetime] = Query(None, description="Filter orders to date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    List orders for the authenticated owner's restaurant.
    Paginated, ordered newest first, with optional status and date filters.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        return PaginatedResponse(items=[], total_count=0, page=page, page_size=page_size)

    query = db.query(Order).filter(Order.restaurant_id == restaurant.id)

    if status_filter:
        query = query.filter(Order.status == status_filter)
    if date_from:
        query = query.filter(Order.created_at >= date_from)
    if date_to:
        query = query.filter(Order.created_at <= date_to)

    total_count = query.count()
    items = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status_by_owner(
    order_id: int,
    status_in: OrderStatusUpdate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Update order status to ACCEPTED, PREPARING, or READY.
    Restricted to the verified restaurant owner via change_status.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Restrict owner status transitions to kitchen phases
    allowed_owner_targets = {
        OrderStatus.ACCEPTED.value,
        OrderStatus.PREPARING.value,
        OrderStatus.READY.value,
    }
    if status_in.status not in allowed_owner_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This endpoint only allows transitions to: {', '.join(sorted(allowed_owner_targets))}",
        )

    updated_order = change_status(order, status_in.status, current_user, db=db)
    return updated_order


@router.get("/owner/delivery-partners", response_model=List[UserResponse])
def list_available_delivery_partners(
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    List all registered delivery partners so restaurant owners can select one for assignment.
    """
    partners = db.query(User).filter(User.role == UserRole.DELIVERY_PARTNER.value).all()
    return partners


@router.patch("/orders/{order_id}/assign", response_model=OrderResponse)
def assign_delivery_partner(
    order_id: int,
    assign_in: OrderAssignUpdate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Assign a delivery partner to an order and advance status from READY to ASSIGNED.
    Restricted to restaurant owners and validated by change_status.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # change_status validates order is READY, target is ASSIGNED, partner role is valid, and caller owns restaurant
    updated_order = change_status(
        order,
        OrderStatus.ASSIGNED.value,
        current_user,
        delivery_partner_id=assign_in.delivery_partner_id,
        db=db,
    )
    return updated_order


@router.get("/owner/stats", response_model=RestaurantStatsResponse)
def get_restaurant_stats(
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Retrieve real-time business and performance metrics for the authenticated owner's restaurant.
    Includes total order volume, breakdown by status, completed delivery revenue,
    average customer rating, top 3 bestselling dishes, and pending return count.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    rest_id = restaurant.id

    # 1. Total order volume count
    total_orders = db.query(func.count(Order.id)).filter(Order.restaurant_id == rest_id).scalar() or 0

    # 2. Count of orders grouped by status using SQL GROUP BY
    status_rows = (
        db.query(Order.status, func.count(Order.id))
        .filter(Order.restaurant_id == rest_id)
        .group_by(Order.status)
        .all()
    )
    orders_per_status = {status_str: count for status_str, count in status_rows}

    # 3. Total realized revenue: sum of DELIVERED order totals only (excludes cancelled/refunded)
    revenue_val = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(Order.restaurant_id == rest_id, Order.status == OrderStatus.DELIVERED.value)
        .scalar()
    )
    total_revenue = round(float(revenue_val or 0.0), 2)

    # 4. Average rating across all completed reviews for this restaurant
    rating_val = (
        db.query(func.coalesce(func.avg(Review.rating), 0.0))
        .join(Order, Review.order_id == Order.id)
        .filter(Order.restaurant_id == rest_id)
        .scalar()
    )
    average_rating = round(float(rating_val or 0.0), 2)

    # 5. Top 3 bestselling dishes ranked by sum of order quantities
    top_rows = (
        db.query(MenuItem.name, func.sum(OrderItem.quantity).label("total_qty"))
        .join(OrderItem, MenuItem.id == OrderItem.menu_item_id)
        .filter(MenuItem.restaurant_id == rest_id)
        .group_by(MenuItem.id, MenuItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(3)
        .all()
    )
    top_three_dishes = [TopDishStat(dish_name=row[0], quantity_sold=int(row[1])) for row in top_rows]

    # 6. Pending return requests currently awaiting owner resolution
    pending_returns = (
        db.query(func.count(Order.id))
        .filter(Order.restaurant_id == rest_id, Order.return_status == "requested")
        .scalar()
        or 0
    )

    return RestaurantStatsResponse(
        total_orders=total_orders,
        orders_per_status=orders_per_status,
        total_revenue=total_revenue,
        average_rating=average_rating,
        top_three_dishes=top_three_dishes,
        pending_return_requests=pending_returns,
    )


@router.get("/owner/reminders", response_model=PaginatedResponse[ReminderResponse])
def get_owner_reminders(
    include_resolved: bool = Query(False, description="Whether to include resolved reminders"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    List reminder logs for the authenticated owner's restaurant.
    Paginated, ordered newest first.
    By default returns only reminders where the associated order is still in PLACED or ACCEPTED state.
    When include_resolved=True, returns all reminders including resolved ones.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No restaurant found for current owner",
        )

    # Query reminder logs joined with the Order table to determine current order status
    query = (
        db.query(AdminReminderLog, Order.status.label("order_status"))
        .join(Order, AdminReminderLog.order_id == Order.id)
        .filter(AdminReminderLog.restaurant_id == restaurant.id)
    )

    if not include_resolved:
        # Default: filter to only pending orders (PLACED or ACCEPTED)
        query = query.filter(
            Order.status.in_([OrderStatus.PLACED.value, OrderStatus.ACCEPTED.value])
        )

    total_count = query.count()
    rows = (
        query.order_by(AdminReminderLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        ReminderResponse(
            id=reminder.id,
            order_id=reminder.order_id,
            restaurant_id=reminder.restaurant_id,
            message=reminder.message,
            created_at=reminder.created_at,
            order_status=order_status,
            is_still_pending=(
                order_status in [OrderStatus.PLACED.value, OrderStatus.ACCEPTED.value]
            ),
        )
        for reminder, order_status in rows
    ]

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


