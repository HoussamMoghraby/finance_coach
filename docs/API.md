# API Documentation

Complete API reference for the AI Personal Finance Coach backend.

Base URL: `http://localhost:8000/api/v1`

## Authentication

All endpoints except registration and login require authentication via JWT Bearer token.

Include the token in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Authentication Endpoints

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true,
  "is_admin": false,
  "created_at": "2026-03-31T10:00:00",
  "updated_at": "2026-03-31T10:00:00"
}
```

### Login

```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Get Current User

```http
GET /auth/me
Authorization: Bearer {token}
```

**Response (200 OK):** Same as register response.

## Accounts

### List Accounts

```http
GET /accounts?include_inactive=false
Authorization: Bearer {token}
```

### Get Account

```http
GET /accounts/{id}
Authorization: Bearer {token}
```

### Create Account

```http
POST /accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Checking Account",
  "type": "bank",
  "currency": "USD",
  "opening_balance": 5000.00
}
```

### Update Account

```http
PUT /accounts/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Delete Account

```http
DELETE /accounts/{id}
Authorization: Bearer {token}
```

## Categories

### List Categories

```http
GET /categories
Authorization: Bearer {token}
```

Returns both system categories and user's custom categories.

### Create Category

```http
POST /categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Custom Category",
  "type": "expense",
  "parent_id": null
}
```

## Transactions

### List Transactions

```http
GET /transactions?skip=0&limit=100&type=expense
Authorization: Bearer {token}
```

Query Parameters:
- `skip`: Pagination offset (default: 0)
- `limit`: Results per page (default: 100, max: 1000)
- `account_id`: Filter by account
- `category_id`: Filter by category
- `type`: Filter by type (income/expense/transfer)

### Create Transaction

```http
POST /transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_id": 1,
  "category_id": 2,
  "type": "expense",
  "amount": 50.00,
  "description": "Grocery shopping",
  "transaction_date": "2026-03-31"
}
```

### Update Transaction

```http
PUT /transactions/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 55.00
}
```

### Delete Transaction

```http
DELETE /transactions/{id}
Authorization: Bearer {token}
```

## Budgets

### List Budgets

```http
GET /budgets
Authorization: Bearer {token}
```

### Get Budget Status

```http
GET /budgets/status?target_date=2026-03-31
Authorization: Bearer {token}
```

Returns overall budget status with spending breakdown.

### Create Budget

```http
POST /budgets
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_id": 2,
  "amount": 500.00,
  "period_type": "monthly",
  "start_date": "2026-03-01",
  "end_date": "2026-03-31"
}
```

## Reports

### Financial Overview

```http
GET /reports/overview?start_date=2026-03-01&end_date=2026-03-31
Authorization: Bearer {token}
```

### Category Breakdown

```http
GET /reports/category-breakdown?transaction_type=expense
Authorization: Bearer {token}
```

### Top Merchants

```http
GET /reports/top-merchants?limit=10
Authorization: Bearer {token}
```

### Monthly Trends

```http
GET /reports/monthly-trend?months=6
Authorization: Bearer {token}
```

### Dashboard Data

```http
GET /reports/dashboard
Authorization: Bearer {token}
```

Returns combined overview, category breakdown, top merchants, and trends.

### Recurring Transactions

```http
GET /reports/recurring?min_occurrences=3
Authorization: Bearer {token}
```

Detects potential recurring transactions (subscriptions, bills, etc.).

## AI Insights

### List Insights

```http
GET /insights?limit=20
Authorization: Bearer {token}
```

### Generate Insight

```http
POST /insights/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "monthly",
  "start_date": "2026-03-01",
  "end_date": "2026-03-31"
}
```

Types: `daily`, `weekly`, `monthly`

### Ask AI Question

```http
POST /insights/ask
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "How much did I spend on groceries this month?"
}
```

### AI Health Check

```http
GET /insights/health
```

Checks if Ollama is available.

## Error Responses

### 401 Unauthorized

```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 400 Bad Request

```json
{
  "detail": "Validation error message"
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting implemented. Future versions may add limits.

## API Versioning

The API is versioned via URL path (`/api/v1`). Breaking changes will increment the version number.

## Interactive Documentation

The API provides interactive Swagger documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
