"""
Menu and Dish Management Routes for CampusBite.
Handles catalog browsing, search, price filtering, and dish CRUD operations.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_role
from ..database import get_db
from ..models import MenuItem, OrderItem, Restaurant, User, UserRole
from ..schemas import (
    MenuItemAvailabilityUpdate,
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
    PaginatedResponse,
)

router = APIRouter(tags=["Menu Items"])


# --- Public / Customer & Owner Browsing Routes ---

@router.get("/restaurants/{restaurant_id}/menu", response_model=PaginatedResponse[MenuItemResponse])
def get_restaurant_menu(
    restaurant_id: int,
    q: Optional[str] = Query(None, description="Search by dish name"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve paginated menu for a specific restaurant.
    Customers only see items with is_available=True.
    The owner of this restaurant sees all items (including unavailable items).
    Supports keyword search and price range filtering.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    query = db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id)

    # Customers and other users only see available items; only the actual owner sees all items
    is_owner = restaurant.owner_id == current_user.id
    if not is_owner:
        query = query.filter(MenuItem.is_available == True)

    # Search by dish name
    if q:
        query = query.filter(MenuItem.name.ilike(f"%{q}%"))

    # Price range filters
    if min_price is not None:
        query = query.filter(MenuItem.price >= min_price)
    if max_price is not None:
        query = query.filter(MenuItem.price <= max_price)

    total_count = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get("/menu-items/{item_id}", response_model=MenuItemResponse)
def get_menu_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details for a single menu dish."""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )
    return item


# --- Restaurant Owner Management Routes ---

@router.post("/restaurants/{restaurant_id}/menu", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
def add_menu_item(
    restaurant_id: int,
    item_in: MenuItemCreate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Add a new dish to a restaurant's menu.
    Restricted to the verified owner of the target restaurant.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    # Ownership check
    if restaurant.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to add dishes to this restaurant",
        )

    new_item = MenuItem(
        restaurant_id=restaurant_id,
        name=item_in.name,
        description=item_in.description,
        price=item_in.price,
        is_available=item_in.is_available,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/menu-items/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: int,
    item_in: MenuItemUpdate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Update a menu item's name, description, or price.
    Restricted to the verified owner of the restaurant this item belongs to.
    """
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    restaurant = db.query(Restaurant).filter(Restaurant.id == item.restaurant_id).first()
    if not restaurant or restaurant.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this dish",
        )

    if item_in.name is not None:
        item.name = item_in.name
    if item_in.description is not None:
        item.description = item_in.description
    if item_in.price is not None:
        item.price = item_in.price

    db.commit()
    db.refresh(item)
    return item


@router.patch("/menu-items/{item_id}/availability", response_model=MenuItemResponse)
def update_menu_item_availability(
    item_id: int,
    avail_in: MenuItemAvailabilityUpdate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Toggle dish availability (in stock vs sold out).
    Restricted to the verified restaurant owner.
    """
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    restaurant = db.query(Restaurant).filter(Restaurant.id == item.restaurant_id).first()
    if not restaurant or restaurant.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify availability for this dish",
        )

    item.is_available = avail_in.is_available
    db.commit()
    db.refresh(item)
    return item


@router.delete("/menu-items/{item_id}")
def delete_menu_item(
    item_id: int,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Delete a menu item.
    Design Choice: If a dish has already been ordered (present in order_items),
    we soft-delete it by setting is_available=False instead of hard-deleting the row.
    This prevents foreign key constraint violations and keeps historical order receipts intact.
    """
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    restaurant = db.query(Restaurant).filter(Restaurant.id == item.restaurant_id).first()
    if not restaurant or restaurant.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this dish",
        )

    # Check if this menu item is linked to any past or active orders
    order_reference = db.query(OrderItem).filter(OrderItem.menu_item_id == item_id).first()
    if order_reference:
        # Soft delete: mark item unavailable to preserve past order history and invoice records
        item.is_available = False
        db.commit()
        return {
            "message": "Dish is linked to existing orders. Soft-deleted by marking unavailable.",
            "action": "soft_deleted",
            "item_id": item_id,
        }

    # Hard delete if it was never referenced in any orders
    db.delete(item)
    db.commit()
    return {
        "message": "Menu item permanently deleted.",
        "action": "hard_deleted",
        "item_id": item_id,
    }
