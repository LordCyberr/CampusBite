"""
Return and Refund Routes for CampusBite.
Allows customers to request returns on delivered orders with a reason,
and allows restaurant owners to review, approve (triggering refund ledger), or reject requests.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..auth import require_role
from ..database import get_db
from ..models import Order, OrderStatus, PaymentLedger, PaymentType, Restaurant, User, UserRole
from ..order_rules import change_status
from ..schemas import OrderResponse, PaginatedResponse, ReturnDecisionUpdate, ReturnRequestCreate

router = APIRouter(tags=["Returns & Refunds"])


@router.post("/orders/{order_id}/return", response_model=OrderResponse)
def request_order_return(
    order_id: int,
    return_in: ReturnRequestCreate,
    current_user: User = Depends(require_role(UserRole.CUSTOMER.value)),
    db: Session = Depends(get_db),
):
    """
    Submit a return request for a delivered order.
    Enforces:
    - Customer must own the order.
    - Order must be in DELIVERED status.
    - Reason must be >= 5 characters.
    - Exactly one return request per order (subsequent attempts return 409 Conflict).
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

    # 2. Delivered status check
    if order.status != OrderStatus.DELIVERED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only delivered orders can be returned",
        )

    # 3. Duplicate request check
    if order.return_status in ("requested", "approved", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A return request has already been submitted for this order",
        )

    # 4. Save return request
    order.return_status = "requested"
    order.return_reason = return_in.reason
    db.commit()
    db.refresh(order)
    return order


@router.get("/owner/returns", response_model=PaginatedResponse[OrderResponse])
def get_owner_returns(
    return_status: Optional[str] = Query(None, description="Filter by return_status (e.g. requested, approved, rejected)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    List return requests for the authenticated owner's restaurant.
    Paginated, ordered by update timestamp descending.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        return PaginatedResponse(items=[], total_count=0, page=page, page_size=page_size)

    query = db.query(Order).filter(
        Order.restaurant_id == restaurant.id,
        Order.return_status.isnot(None),
        Order.return_status != "NONE",
    )

    if return_status:
        query = query.filter(Order.return_status == return_status)

    total_count = query.count()
    items = query.order_by(Order.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.patch("/orders/{order_id}/return/decision", response_model=OrderResponse)
def decide_order_return(
    order_id: int,
    decision_in: ReturnDecisionUpdate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Approve or reject a return request.
    Enforces:
    - Caller must own the restaurant fulfilling the order.
    - Return request must be in 'requested' state (otherwise 400).
    - If approved: creates refund in PaymentLedger, sets payment_status='refunded',
      return_status='approved', and advances order status to REFUNDED in one transaction.
    - If rejected: sets return_status='rejected' and leaves everything else unchanged.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # 1. Ownership check
    if order.restaurant.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own the restaurant for this order",
        )

    # 2. Return status check
    if order.return_status != "requested":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending return request for this order",
        )

    decision = decision_in.decision.strip().lower()
    if decision == "approve":
        try:
            # Atomic transaction: ledger refund + status changes
            refund_entry = PaymentLedger(
                order_id=order.id,
                type=PaymentType.REFUND.value,
                amount=order.total_amount,
                status="SUCCESS",
            )
            db.add(refund_entry)
            order.payment_status = "refunded"
            order.return_status = "approved"

            # Transition status via centralized state machine
            change_status(order, OrderStatus.REFUNDED.value, current_user, db=db)
            return order
        except Exception:
            db.rollback()
            raise

    elif decision == "reject":
        order.return_status = "rejected"
        db.commit()
        db.refresh(order)
        return order

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be 'approve' or 'reject'",
        )
