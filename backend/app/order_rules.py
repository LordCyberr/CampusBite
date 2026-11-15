"""
Centralized Order Lifecycle Rules for CampusBite.
Enforces the valid state machine transitions, role authorizations, and ownership checks.
Every route that changes order status MUST call change_status().
"""
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .models import Order, OrderStatus, User, UserRole

# (current_status, target_status) -> required_user_role
ALLOWED_TRANSITIONS = {
    (OrderStatus.PLACED.value, OrderStatus.ACCEPTED.value): UserRole.RESTAURANT_OWNER.value,
    (OrderStatus.ACCEPTED.value, OrderStatus.PREPARING.value): UserRole.RESTAURANT_OWNER.value,
    (OrderStatus.PREPARING.value, OrderStatus.READY.value): UserRole.RESTAURANT_OWNER.value,
    (OrderStatus.READY.value, OrderStatus.ASSIGNED.value): UserRole.RESTAURANT_OWNER.value,
    (OrderStatus.ASSIGNED.value, OrderStatus.OUT_FOR_DELIVERY.value): UserRole.DELIVERY_PARTNER.value,
    (OrderStatus.OUT_FOR_DELIVERY.value, OrderStatus.DELIVERED.value): UserRole.DELIVERY_PARTNER.value,
    (OrderStatus.PLACED.value, OrderStatus.CANCELLED.value): UserRole.CUSTOMER.value,
    # Phase 5: Return approval advances DELIVERED to REFUNDED
    (OrderStatus.DELIVERED.value, OrderStatus.REFUNDED.value): UserRole.RESTAURANT_OWNER.value,
}


def change_status(
    order: Order,
    new_status: str,
    user: User,
    delivery_partner_id: Optional[int] = None,
    db: Optional[Session] = None,
) -> Order:
    """
    Central function to validate and execute order status transitions.
    Enforces role checks, restaurant ownership, delivery partner assignment, and sequence validity.
    """
    # 1. Terminal / cancellation checks
    if order.status == OrderStatus.CANCELLED.value or order.status == OrderStatus.REFUNDED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An order in {order.status} state cannot be modified",
        )

    if order.status == OrderStatus.DELIVERED.value and new_status == OrderStatus.CANCELLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A delivered order cannot be transitioned or cancelled",
        )

    # 2. Check transition validity against state machine table
    transition = (order.status, new_status)
    if transition not in ALLOWED_TRANSITIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid order status transition from {order.status} to {new_status}",
        )

    required_role = ALLOWED_TRANSITIONS[transition]

    # 3. Role check
    if user.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted. Required role: {required_role}",
        )

    # 4. Role-specific ownership & assignment checks
    if required_role == UserRole.RESTAURANT_OWNER.value:
        # Verify the owner owns the restaurant fulfilling this order
        if order.restaurant.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own the restaurant fulfilling this order",
            )

        # Transitioning to ASSIGNED requires a valid delivery partner
        if new_status == OrderStatus.ASSIGNED.value:
            if not delivery_partner_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A delivery partner ID is required to assign an order",
                )
            if db:
                partner = db.query(User).filter(
                    User.id == delivery_partner_id,
                    User.role == UserRole.DELIVERY_PARTNER.value,
                ).first()
                if not partner:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Selected user is not a valid delivery partner",
                    )
            order.delivery_partner_id = delivery_partner_id

    elif required_role == UserRole.DELIVERY_PARTNER.value:
        # Verify this delivery partner is specifically assigned to this order
        if order.delivery_partner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the delivery partner assigned to this order",
            )

    elif required_role == UserRole.CUSTOMER.value:
        # Verify the customer placed this order
        if order.customer_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this order",
            )

    # 5. Apply state change
    order.status = new_status
    order.updated_at = datetime.utcnow()

    if db:
        db.commit()
        db.refresh(order)

    return order
