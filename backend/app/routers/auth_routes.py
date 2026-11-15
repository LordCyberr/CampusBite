"""
Authentication and Role-Verification Routes for CampusBite.
Provides /register, /login, /me, and role-guarded demo endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import (
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)
from ..database import get_db
from ..models import User, UserRole
from ..schemas import TokenResponse, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

ALLOWED_ROLES = {role.value for role in UserRole}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user (Customer, Restaurant Owner, or Delivery Partner).
    Rejects unauthorized roles and duplicate emails (409 Conflict).
    """
    if user_in.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles are: {', '.join(sorted(ALLOWED_ROLES))}",
        )

    # Check for existing account by email
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Store encrypted password with bcrypt
    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pwd,
        role=user_in.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user with email and password.
    Returns signed JWT token and user's role.
    """
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Encode user email and role inside the JWT token
    token_data = {"sub": user.email, "role": user.role, "user_id": user.id}
    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user (excluding password hash)."""
    return current_user


# --- Role-Guarded Demonstration Routes ---

@router.get("/customer-only")
def customer_only_route(current_user: User = Depends(require_role(UserRole.CUSTOMER.value))):
    """Accessible exclusively by authenticated Customers."""
    return {"message": f"Welcome customer {current_user.name}", "role": current_user.role}


@router.get("/owner-only")
def owner_only_route(current_user: User = Depends(require_role(UserRole.RESTAURANT_OWNER.value))):
    """Accessible exclusively by authenticated Restaurant Owners."""
    return {"message": f"Welcome restaurant owner {current_user.name}", "role": current_user.role}


@router.get("/delivery-only")
def delivery_only_route(current_user: User = Depends(require_role(UserRole.DELIVERY_PARTNER.value))):
    """Accessible exclusively by authenticated Delivery Partners."""
    return {"message": f"Welcome delivery partner {current_user.name}", "role": current_user.role}
