"""
Restaurant Management Routes for CampusBite.
Provides listing, searching, creating, and updating restaurant profiles.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_role
from ..database import get_db
from ..models import Restaurant, User, UserRole
from ..schemas import PaginatedResponse, RestaurantCreate, RestaurantResponse, RestaurantUpdate

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("", response_model=PaginatedResponse[RestaurantResponse])
def list_restaurants(
    q: Optional[str] = Query(None, description="Search restaurant by name, description, or dishes"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List restaurants with optional name search and pagination. Accessible to all authenticated users."""
    query = db.query(Restaurant)
    if q and q.strip():
        term = f"%{q.strip()}%"
        from sqlalchemy import or_
        from ..models import MenuItem
        matching_dish_restaurant_ids = (
            db.query(MenuItem.restaurant_id)
            .filter(or_(MenuItem.name.ilike(term), MenuItem.description.ilike(term)))
        )
        query = query.filter(
            or_(
                Restaurant.name.ilike(term),
                Restaurant.description.ilike(term),
                Restaurant.id.in_(matching_dish_restaurant_ids),
            )
        )

    total_count = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get("/mine", response_model=RestaurantResponse)
def get_my_restaurant(
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """Retrieve the restaurant profile owned by the currently authenticated restaurant owner."""
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not registered a restaurant yet",
        )
    return restaurant


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant_by_id(
    restaurant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve single restaurant details by ID."""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )
    return restaurant


@router.post("", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    restaurant_in: RestaurantCreate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Create a new restaurant profile.
    Restricted to restaurant owners. Each owner is limited to one restaurant for demo clarity.
    """
    existing = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Restaurant owner already has a registered restaurant",
        )

    new_restaurant = Restaurant(
        name=restaurant_in.name,
        description=restaurant_in.description,
        owner_id=current_user.id,
    )
    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)
    return new_restaurant


@router.put("/{restaurant_id}", response_model=RestaurantResponse)
def update_restaurant(
    restaurant_id: int,
    restaurant_in: RestaurantUpdate,
    current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value)),
    db: Session = Depends(get_db),
):
    """
    Update restaurant profile details.
    Restricted to the verified owner of the target restaurant.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    # Ownership enforcement: reject if another owner attempts to modify
    if restaurant.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this restaurant",
        )

    if restaurant_in.name is not None:
        restaurant.name = restaurant_in.name
    if restaurant_in.description is not None:
        restaurant.description = restaurant_in.description

    db.commit()
    db.refresh(restaurant)
    return restaurant
