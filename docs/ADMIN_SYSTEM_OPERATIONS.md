# Admin & System Operations Documentation

This document describes the admin and system operations endpoints implemented in section 4.10 of the application.

## Overview

The application provides lightweight internal admin endpoints and system health checks for:
- Health and readiness monitoring
- AI service connectivity verification
- Default category seeding
- Insight generation job status monitoring
- System information reporting

## Public Health Endpoints

### GET /health

Basic health check endpoint that returns 200 OK if the application is running.

**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "app": "AI Personal Finance & Spending Coach",
  "version": "0.1.0"
}
```

**Example**:
```bash
curl http://localhost:8000/health
```

---

### GET /ready

Comprehensive readiness check that verifies:
- Application status
- Database connectivity
- AI service availability

**Authentication**: None required

**Response**:
```json
{
  "status": "ready",  // or "degraded" if any check fails
  "checks": {
    "application": "ready",
    "database": "connected",  // or "error: ..."
    "ai_service": "connected"  // or "not responding" or "error: ..."
  }
}
```

**Example**:
```bash
curl http://localhost:8000/ready
```

---

## Admin Endpoints

All admin endpoints require authentication and admin privileges.

**Base URL**: `/api/v1/admin`

### Authentication

All admin endpoints require:
1. Valid JWT token in Authorization header
2. User must have `is_admin=true` flag

**Example Authorization**:
```bash
# Login
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@test.com&password=admin123456" | jq -r .access_token)

# Use token in requests
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/admin/...
```

---

### GET /api/v1/admin/system/info

Get system configuration and feature information.

**Authentication**: Admin required

**Response**:
```json
{
  "app": "AI Personal Finance & Spending Coach",
  "version": "0.1.0",
  "environment": "development",
  "database": {
    "type": "PostgreSQL",
    "url": "postgresql://***@localhost:5432/financial_coach"
  },
  "ai": {
    "provider": "Ollama",
    "model": "llama3.2"
  },
  "features": {
    "accounts": true,
    "transactions": true,
    "budgets": true,
    "recurring_detection": true,
    "insights": true,
    "notifications": true,
    "ai_chat": true
  }
}
```

**Example**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/system/info
```

---

### GET /api/v1/admin/ai/health

Check AI model connectivity and availability.

**Authentication**: Admin required

**Response** (healthy):
```json
{
  "status": "healthy",
  "service": "ollama",
  "message": "AI service is connected and responding"
}
```

**Response** (unhealthy):
```json
{
  "status": "unhealthy",
  "service": "ollama",
  "message": "AI service is not responding"
}
```

**Response** (error):
```json
{
  "status": "error",
  "service": "ollama",
  "message": "Error checking AI health: connection refused"
}
```

**Example**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/ai/health
```

---

### POST /api/v1/admin/seed-categories

Seed default system categories for expense and income tracking.

This endpoint is **idempotent** - it will skip seeding if categories already exist.

**Authentication**: Admin required

**Response**:
```json
{
  "status": "success",
  "message": "Default categories seeded successfully"
}
```

**Categories Created**:

*Expense Categories*:
- Groceries
- Restaurants
- Rent
- Utilities
- Subscriptions
- Transport
- Healthcare
- Entertainment
- Shopping
- Education
- Travel
- Insurance
- Gifts
- Personal Care
- Home Maintenance

*Income Categories*:
- Salary
- Freelance
- Investment
- Gift
- Refund
- Other Income

**Example**:
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/seed-categories
```

---

### GET /api/v1/admin/insights/job-status

Get insight generation statistics and job status monitoring.

**Authentication**: Admin required

**Response**:
```json
{
  "status": "operational",
  "statistics": {
    "last_30_days": {
      "daily_insights": 2,
      "weekly_insights": 2,
      "monthly_insights": 1,
      "total": 5
    },
    "last_generated": {
      "daily": "2026-04-03T07:48:43.865934",
      "weekly": "2026-04-03T07:00:04.617700",
      "monthly": "2026-04-03T07:20:31.850525"
    }
  },
  "message": "Insight generation is handled on-demand via API endpoints",
  "note": "For production deployment, consider implementing scheduled jobs using APScheduler, Celery, or cloud-native schedulers"
}
```

**Example**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/insights/job-status
```

---

## Creating Admin Users

### Method 1: Using the Helper Script

```bash
cd backend

# Register a new user via API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"securepass","full_name":"Admin User"}'

# Make them an admin
source venv/bin/activate
python make_admin.py admin@example.com
```

### Method 2: Direct Database Update

```sql
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to seed categories: database connection error"
}
```

---

## Deployment Considerations

### Health Check Integration

The `/health` and `/ready` endpoints are designed for:
- **Kubernetes liveness probes**: Use `/health`
- **Kubernetes readiness probes**: Use `/ready`
- **Load balancer health checks**: Use `/health`
- **Monitoring systems**: Use `/ready` for comprehensive checks

### Example Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Scheduled Jobs

The `/admin/insights/job-status` endpoint currently reports on-demand generation.

For production, consider implementing:

1. **APScheduler** (simple, in-process)
2. **Celery** (distributed, scalable)
3. **Cloud-native schedulers** (AWS EventBridge, GCP Cloud Scheduler)

Example scheduled tasks:
- Daily insights: 6:00 AM every day
- Weekly insights: Monday 7:00 AM
- Monthly insights: 1st of month, 8:00 AM
- Recurring payment checks: Daily at 9:00 AM

---

## Testing

### Quick Test Script

```bash
#!/bin/bash

# Test public health endpoints
echo "Testing /health..."
curl -s http://localhost:8000/health | jq .

echo "\nTesting /ready..."
curl -s http://localhost:8000/ready | jq .

# Login and get admin token
echo "\nLogging in..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@test.com&password=admin123456" | jq -r .access_token)

# Test admin endpoints
echo "\nTesting admin/system/info..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/system/info | jq .

echo "\nTesting admin/ai/health..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/ai/health | jq .

echo "\nTesting admin/insights/job-status..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/insights/job-status | jq .

echo "\nAll tests complete!"
```

---

## Security Notes

1. **Admin endpoints are protected** - Only users with `is_admin=true` can access
2. **Credentials are masked** - Database URLs hide sensitive information
3. **No data exposure** - System info doesn't reveal user data
4. **Rate limiting recommended** - Consider adding rate limits for production
5. **Audit logging recommended** - Log all admin endpoint access

---

## Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Instruction File**: `/instruction.md` (Section 4.10)
- **Notification Integration**: `/docs/NOTIFICATION_INTEGRATION.md`
