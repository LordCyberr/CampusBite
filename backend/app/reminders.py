"""
Background reminders for orders stuck in PLACED or ACCEPTED status.
Automatically detects stalled kitchen orders, logs admin alerts, and exposes
a background worker task managed by FastAPI's lifespan lifecycle.
"""
import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import AdminReminderLog, Order, OrderStatus

logger = logging.getLogger("campusbite.reminders")


def check_stuck_orders(db: Session, threshold_minutes: int = 15) -> List[AdminReminderLog]:
    """
    Checks for orders currently in PLACED or ACCEPTED state whose updated_at
    is older than threshold_minutes.

    Avoids duplicates without schema changes:
    - If a reminder was already created *after* the order's last updated_at, skip it.
    - If the order is updated (e.g. status changed or touched) and gets stuck again,
      order.updated_at becomes newer than the old reminder, so a new reminder will be issued.
    """
    now = datetime.utcnow()
    cutoff_time = now - timedelta(minutes=threshold_minutes)

    stuck_orders = (
        db.query(Order)
        .filter(
            Order.status.in_([OrderStatus.PLACED.value, OrderStatus.ACCEPTED.value]),
            Order.updated_at <= cutoff_time,
        )
        .all()
    )

    created_reminders: List[AdminReminderLog] = []

    for order in stuck_orders:
        # Check if a reminder has already been created since the last update to this order
        latest_reminder = (
            db.query(AdminReminderLog)
            .filter(AdminReminderLog.order_id == order.id)
            .order_by(AdminReminderLog.created_at.desc())
            .first()
        )

        if latest_reminder and latest_reminder.created_at >= order.updated_at:
            # Already alerted for this stuck state; avoid duplicate spam
            continue

        # Calculate how long the order has been in this state (in minutes)
        elapsed_minutes = int((now - order.updated_at).total_seconds() // 60)
        if elapsed_minutes < threshold_minutes:
            elapsed_minutes = threshold_minutes

        message = f"Order {order.id} has been in {order.status} for {elapsed_minutes} minutes."

        reminder = AdminReminderLog(
            order_id=order.id,
            restaurant_id=order.restaurant_id,
            message=message,
            created_at=datetime.utcnow(),
        )
        db.add(reminder)
        created_reminders.append(reminder)

    if created_reminders:
        db.commit()
        for r in created_reminders:
            db.refresh(r)
        logger.info(f"Created {len(created_reminders)} reminders for stuck orders.")

    return created_reminders


async def reminder_background_worker():
    """
    Periodic asyncio background worker that runs for the lifetime of the application.
    Checks for stuck orders every REMINDER_CHECK_SECONDS using a dedicated SessionLocal.
    """
    threshold_minutes = int(os.getenv("REMINDER_THRESHOLD_MINUTES", "15"))
    check_seconds = int(os.getenv("REMINDER_CHECK_SECONDS", "60"))

    logger.info(
        f"Reminder background worker started: running every {check_seconds}s with {threshold_minutes}m threshold."
    )

    while True:
        try:
            await asyncio.sleep(check_seconds)
            with SessionLocal() as db:
                check_stuck_orders(db, threshold_minutes=threshold_minutes)
        except asyncio.CancelledError:
            logger.info("Reminder background worker task was cancelled cleanly.")
            break
        except Exception as exc:
            # Catch all unexpected errors so the background loop never dies
            logger.error(f"Error in reminder background worker: {exc}", exc_info=True)
