"""
Delivery Partner Order Management Routes for CampusBite.
Provides active and historical order tracking for campus student couriers,
and status transitions for OUT_FOR_DELIVERY and DELIVERED.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..auth import require_role
from ..database import get_db
from ..models import Order, OrderStatus, User, UserRole
from ..order_rules import change_status
from ..schemas import OrderResponse, OrderStatusUpdate, PaginatedResponse

router = APIRouter(prefix="/delivery/orders", tags=["Delivery Partner Orders"])


@router.get("", response_model=PaginatedResponse[OrderResponse])
def get_delivery_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by order status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_role(UserRole.DELIVERY_PARTNER.value)),
    db: Session = Depends(get_db),
):
    """
    List orders assigned to the authenticated delivery partner.
    Includes active orders and completed deliveries (delivery history).
    Returns delivery address and customer name.
    """
    query = db.query(Order).filter(Order.delivery_partner_id == current_user.id)

    if status_filter:
        query = query.filter(Order.status == status_filter)

    total_count = query.count()
    items = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_delivery_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    current_user: User = Depends(require_role(UserRole.DELIVERY_PARTNER.value)),
    db: Session = Depends(get_db),
):
    """
    Advance order status to OUT_FOR_DELIVERY or DELIVERED.
    Enforces that only the assigned courier may update the order via change_status.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    allowed_targets = {
        OrderStatus.OUT_FOR_DELIVERY.value,
        OrderStatus.DELIVERED.value,
    }
    if status_in.status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Delivery partners may only transition orders to: {', '.join(sorted(allowed_targets))}",
        )

    updated_order = change_status(order, status_in.status, current_user, db=db)
    return updated_order
