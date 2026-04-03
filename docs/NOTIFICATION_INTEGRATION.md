# Notification Integration Guide

This document explains how the notification system is integrated throughout the application and how to test it.

## Overview

The notification system automatically triggers notifications for the following events:
1. **Budget Threshold Reached** - When spending reaches 80%, 90%, or exceeds budget
2. **Unusual Spending Detected** - When a transaction is 2x the category average
3. **Summary Ready** - When AI insights are generated
4. **Recurring Payment Upcoming** - When recurring payments are due soon

## Integration Points

### 1. Budget Threshold Notifications

**Trigger Location:** `app/services/transaction.py` → `create_transaction()`

**How it works:**
- When a new **expense** transaction is created with a category
- The system automatically checks budget thresholds for that category
- If spending has reached 80%, 90%, or 100% of budget, a notification is created

**Implementation:**
```python
# In TransactionService.create_transaction()
if transaction_data.type == "expense" and transaction_data.category_id:
    self._check_budget_thresholds(user_id, transaction_data.category_id)
```

**Testing:**
1. Create a budget for a category (e.g., $100 for groceries)
2. Create expense transactions in that category
3. When total spending reaches $80, $90, or $100, notifications will be created
4. Check notifications via GET `/api/v1/notifications`

---

### 2. Unusual Spending Notifications

**Trigger Location:** `app/services/transaction.py` → `create_transaction()`

**How it works:**
- When a new **expense** transaction is created with a category
- The system calculates the average amount for that category (last 90 days)
- If the new transaction is **more than 2x the average**, it's flagged as unusual
- Requires at least 5 previous transactions to establish a pattern

**Implementation:**
```python
# In TransactionService.create_transaction()
if transaction_data.type == "expense" and transaction_data.category_id:
    self._check_unusual_spending(user_id, transaction)
```

**Testing:**
1. Create 5+ expense transactions in a category (e.g., groceries at $50 each)
2. Create a new transaction in the same category for $150 (more than 2x $50)
3. An unusual spending notification will be created
4. Check notifications via GET `/api/v1/notifications`

---

### 3. Summary Ready Notifications

**Trigger Location:** `app/api/v1/endpoints/insights.py` → `generate_insight()`

**How it works:**
- When a daily, weekly, or monthly AI insight is generated
- After the insight is saved to the database
- A notification is created to inform the user their summary is ready

**Implementation:**
```python
# In insights endpoint after saving insight
notification_service.create_summary_ready_notification(
    user_id=current_user.id,
    summary_type=request.type.capitalize(),
    period=f"{start_date.isoformat()} to {end_date.isoformat()}",
)
```

**Testing:**
1. Generate an insight via POST `/api/v1/insights/generate`
   ```json
   {
     "type": "daily",
     "end_date": "2026-04-03"
   }
   ```
2. A "Summary Ready" notification will be created
3. Check notifications via GET `/api/v1/notifications`

---

### 4. Recurring Payment Upcoming Notifications

**Trigger Location:** `app/services/recurring_transaction.py` → `check_and_notify_upcoming_payments()`

**How it works:**
- Checks for active recurring payments due in the next X days (default: 7)
- Creates notifications for payments due in 1, 3, or 7 days
- Designed to be called periodically (e.g., daily via scheduler)

**Implementation:**
```python
# In RecurringTransactionService
def check_and_notify_upcoming_payments(user_id, days_ahead=7):
    upcoming = self.repo.get_upcoming(user_id, target_date, active_only=True)
    for recurring in upcoming:
        if days_until in [1, 3, 7]:
            notification_service.create_recurring_upcoming_notification(...)
```

**API Endpoint:** POST `/api/v1/recurring-transactions/check-upcoming?days_ahead=7`

**Testing:**
1. Create a recurring transaction with `next_expected_date` in the next 7 days
2. Call POST `/api/v1/recurring-transactions/check-upcoming`
3. A recurring payment notification will be created
4. Check notifications via GET `/api/v1/notifications`

---

## Notification API Endpoints

### Get All Notifications
```
GET /api/v1/notifications?unread_only=false
```

### Get Notification Summary
```
GET /api/v1/notifications/summary
```
Response:
```json
{
  "total": 10,
  "unread": 3
}
```

### Mark as Read
```
PATCH /api/v1/notifications/{id}/read
```

### Mark All as Read
```
POST /api/v1/notifications/mark-all-read
```

### Delete Notification
```
DELETE /api/v1/notifications/{id}
```

---

## Frontend Integration

The `NotificationBell` component automatically polls for notifications every 30 seconds and displays them in the app header.

**Features:**
- Shows unread count badge
- Dropdown with notification list
- Click to mark as read
- Delete individual notifications
- Mark all as read button
- Type-specific icons (💰, ⚠️, 📊, 🔄)

**Location:** `frontend/src/components/NotificationBell.tsx`

**Integration:** Added to `MainLayout.tsx` header

---

## Testing Checklist

- [ ] **Budget Threshold**: Create expenses until budget reaches 80% → notification created
- [ ] **Budget Exceeded**: Create expenses beyond budget limit → notification created
- [ ] **Unusual Spending**: Create large transaction (2x average) → notification created
- [ ] **Daily Summary**: Generate daily insight → notification created
- [ ] **Weekly Summary**: Generate weekly insight → notification created
- [ ] **Monthly Summary**: Generate monthly insight → notification created
- [ ] **Recurring Upcoming**: Create recurring payment due soon → call check endpoint → notification created
- [ ] **Frontend Display**: Check notification bell shows unread count
- [ ] **Frontend Interaction**: Click notification → marks as read
- [ ] **Frontend Delete**: Delete notification → removes from list

---

## Scheduled Jobs (Future Enhancement)

For production, the recurring payment check should run automatically. Recommended approaches:

### Option 1: APScheduler (Simple)
```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(check_all_users_recurring_payments, 'cron', hour=8)  # Run daily at 8 AM
scheduler.start()
```

### Option 2: Celery (Scalable)
```python
@celery.task
def check_recurring_payments_task():
    # Check for all users
    pass

# Schedule in celerybeat
```

### Option 3: Cloud Scheduler (Cloud-Native)
- AWS EventBridge
- Google Cloud Scheduler
- Azure Logic Apps

---

## Error Handling

All notification triggers are wrapped in try-except blocks to ensure:
- Transaction creation never fails due to notification errors
- Insight generation continues even if notification fails
- System remains stable if notification service is temporarily unavailable

Example:
```python
try:
    self._check_budget_thresholds(user_id, transaction_data.category_id)
except Exception:
    # Don't fail transaction creation if notification fails
    pass
```

---

## Database Schema

Notifications are stored in the `notifications` table:

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR NOT NULL,  -- budget_threshold, unusual_spending, summary_ready, recurring_upcoming
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Indexes:
- `user_id` - for user-scoped queries
- `type` - for filtering by notification type
- `is_read` - for unread queries
- `created_at` - for ordering

---

## Configuration

No additional configuration needed. The notification system uses the existing database connection and session management.

**Customization Options:**
- Unusual spending threshold: Change `2x` multiplier in `transaction.py`
- Budget threshold levels: Modify 80%, 90%, 100% in `budget.py`
- Recurring payment notice days: Change `[1, 3, 7]` in `recurring_transaction.py`
- Polling interval: Modify `refetchInterval` in `NotificationBell.tsx`

---

## Next Steps

1. ✅ All notification triggers are implemented
2. ✅ Frontend notification bell is integrated
3. 🔲 Add scheduled job for recurring payment checks
4. 🔲 Add email notification option (future feature)
5. 🔲 Add push notification support (future feature)
6. 🔲 Add notification preferences in user settings
