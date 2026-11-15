"""
Customer Order Routes for CampusBite.
Handles order placement with atomic pricing snapshot, dummy payment ledger creation,
order history retrieval with date/status filters, single order view, and cancellation.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_role
from ..database import get_db
from ..models import MenuItem, Order, OrderItem, OrderStatus, PaymentLedger, PaymentType, Restaurant, User, UserRole
from ..order_rules import change_status
from ..schemas import OrderCreate, OrderResponse, PaginatedResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate,
    current_user: User = Depends(require_role(UserRole.CUSTOMER.value)),
    db: Session = Depends(get_db),
):
    """
    Place a new food order in an atomic database transaction.
    - Verifies all dishes belong to the chosen restaurant and are available.
    - Computes server-side total amount (client totals are never trusted).
    - Snapshots each dish's price_at_order.
    - Records order as PLACED with payment_status='mock_paid'.
    - Inserts a mock_payment entry in PaymentLedger.
    """
    # 1. Verify restaurant exists
    restaurant = db.query(Restaurant).filter(Restaurant.id == order_in.restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    # 2. Fetch and validate all ordered dishes
    menu_item_ids = [item.menu_item_id for item in order_in.items]
    dishes = db.query(MenuItem).filter(MenuItem.id.in_(menu_item_ids)).all()
    dish_map = {d.id: d for d in dishes}

    if len(dish_map) != len(set(menu_item_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected menu items do not exist",
        )

    for item in order_in.items:
        dish = dish_map[item.menu_item_id]
        if dish.restaurant_id != order_in.restaurant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dish '{dish.name}' does not belong to restaurant '{restaurant.name}'",
            )
        if not dish.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dish '{dish.name}' is currently unavailable",
            )

    # 3. Calculate server-side total amount
    total_amount = round(
        sum(dish_map[item.menu_item_id].price * item.quantity for item in order_in.items),
        2,
    )

    try:
        # 4. Create the Order
        new_order = Order(
            customer_id=current_user.id,
            restaurant_id=order_in.restaurant_id,
            delivery_address=order_in.delivery_address,
            status=OrderStatus.PLACED.value,
            payment_status="mock_paid",
            total_amount=total_amount,
        )
        db.add(new_order)
        db.flush()  # Generates new_order.id

        # 5. Create OrderItem rows with price_at_order snapshot
        for item in order_in.items:
            dish = dish_map[item.menu_item_id]
            order_item = OrderItem(
                order_id=new_order.id,
                menu_item_id=dish.id,
                quantity=item.quantity,
                price_at_order=dish.price,
            )
            db.add(order_item)

        # 6. Create initial PaymentLedger entry
        payment_entry = PaymentLedger(
            order_id=new_order.id,
            type=PaymentType.MOCK_PAYMENT.value,
            amount=total_amount,
            status="SUCCESS",
        )
        db.add(payment_entry)

        db.commit()
        db.refresh(new_order)
        return new_order

    except Exception:
        db.rollback()
        raise


@router.get("", response_model=PaginatedResponse[OrderResponse])
def list_my_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="Filter orders from date"),
    date_to: Optional[datetime] = Query(None, description="Filter orders to date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_role(UserRole.CUSTOMER.value)),
    db: Session = Depends(get_db),
):
    """
    List orders placed by the currently authenticated customer.
    Results are returned newest first with optional date and status filters.
    """
    query = db.query(Order).filter(Order.customer_id == current_user.id)

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


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve single order details.
    Accessible strictly to:
    1. The customer who placed it
    2. The restaurant owner fulfilling it
    3. The delivery partner assigned to deliver it
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    is_customer = order.customer_id == current_user.id
    is_owner = order.restaurant.owner_id == current_user.id
    is_delivery = order.delivery_partner_id == current_user.id

    if not (is_customer or is_owner or is_delivery):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this order",
        )

    return order


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    current_user: User = Depends(require_role(UserRole.CUSTOMER.value)),
    db: Session = Depends(get_db),
):
    """
    Cancel an order while still in PLACED state.
    Executes through change_status, records a refund in PaymentLedger,
    and updates payment_status to 'refunded'.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # 1. State machine transition check and update (enforces customer ownership and PLACED state)
    change_status(order, OrderStatus.CANCELLED.value, current_user, db=db)

    # 2. Record refund in payment ledger
    refund_ledger = PaymentLedger(
        order_id=order.id,
        type=PaymentType.REFUND.value,
        amount=order.total_amount,
        status="SUCCESS",
    )
    db.add(refund_ledger)
    order.payment_status = "refunded"
    db.commit()
    db.refresh(order)

    return order
