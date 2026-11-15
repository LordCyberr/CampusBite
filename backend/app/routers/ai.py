"""
AI Insights API routes for CampusBite.
Provides smart natural language summaries and queries of customer order histories.
Restricted exclusively to customers for their own orders.
"""
import time
from collections import defaultdict
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import require_role
from ..database import get_db
from ..models import Order, User, UserRole
from ..schemas import AIInsightsRequest, AIInsightsResponse
from ..ai_insights import generate_order_insights

router = APIRouter(tags=["AI Insights"])

# In-memory sliding window rate limiter: 10 requests per minute per user ID
_user_request_timestamps: Dict[int, List[float]] = defaultdict(list)


def check_user_ai_rate_limit(user_id: int, limit: int = 10, window_seconds: float = 60.0):
    """Enforces max 10 requests per minute per authenticated customer."""
    now = time.time()
    cutoff = now - window_seconds
    timestamps = [t for t in _user_request_timestamps[user_id] if t > cutoff]
    if len(timestamps) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 10 AI requests per minute.",
        )
    timestamps.append(now)
    _user_request_timestamps[user_id] = timestamps


def reset_user_ai_rate_limits():
    """Helper used during testing to clear rate limiter history."""
    _user_request_timestamps.clear()


@router.post("/ai/insights", response_model=AIInsightsResponse)
async def get_ai_insights(
    payload: AIInsightsRequest = AIInsightsRequest(),
    current_user: User = Depends(require_role(UserRole.CUSTOMER.value)),
    db: Session = Depends(get_db),
):
    """
    AI-powered order insights for authenticated customers only.
    Analyzes only the calling customer's own past orders (up to 50 most recent).
    Pre-calculates all numerical aggregations in Python.
    """
    # 1. Enforce per-user rate limit (10 requests / minute)
    check_user_ai_rate_limit(current_user.id, limit=10, window_seconds=60.0)

    # 2. Determine question (default if empty or whitespace)
    question = (payload.question or "").strip()
    if not question:
        question = "Summarize my last five orders."

    # 3. Retrieve only this customer's orders (never from body/URL)
    orders = (
        db.query(Order)
        .filter(Order.customer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .limit(50)
        .all()
    )

    # 4. If customer has zero orders, return friendly message without calling OpenAI
    if not orders:
        return AIInsightsResponse(
            answer="You haven't placed any orders yet on CampusBite! Browse our campus canteens and place your first meal to get personalized order insights.",
            orders_considered=0,
        )

    # 5. Generate AI insights with Python-calculated facts and OpenAI
    answer = await generate_order_insights(orders=orders, question=question)

    return AIInsightsResponse(
        answer=answer,
        orders_considered=len(orders),
    )
