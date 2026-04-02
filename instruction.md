# GitHub Copilot Instruction File — AI Personal Finance & Spending Coach

Use this file as the implementation guide and coding instruction source for GitHub Copilot when building the application.

---

## 1) Project Overview

Build a production-style web application named **AI Personal Finance & Spending Coach**.

The application helps users:
- track income and expenses
- categorize transactions
- create budgets
- detect recurring payments
- view dashboards and trends
- ask natural-language questions about their finances
- receive AI-generated daily, weekly, and monthly insights
- get spending recommendations and budget coaching

The system must be practical for day-to-day personal use, but implemented with a clean architecture that is scalable and maintainable.

---

## 2) Required Technology Stack

### Front-end
- **React**
- Prefer **TypeScript**
- Prefer **Vite** for bootstrapping
- Use a clean component-based architecture
- Use responsive design
- Use charting library when needed for dashboards

### Back-end
- **FastAPI**
- Python 3.12 preferred
- Use REST APIs
- Use Pydantic models for validation
- Use SQLAlchemy + Alembic for PostgreSQL migrations
- Use background jobs when needed for summaries and scheduled insights

### Database
- **PostgreSQL** as the primary database
- **Neo4j is optional**
- Only use Neo4j when it clearly adds value, such as relationship-driven recommendation use cases, merchant graphing, recurring pattern exploration, or advanced behavioral linking
- Default to PostgreSQL unless Neo4j is explicitly justified

### AI
- **Ollama**
- The application must call Ollama through a dedicated AI abstraction layer
- Never hardcode AI logic directly inside route handlers
- Support configurable model names via environment variables

---

## 3) Product Vision

The application should feel like a real modern personal finance product.

It should provide value through:
- clear financial dashboards
- budget tracking
- cash flow insights
- expense breakdowns
- AI-generated summaries and coaching
- natural language interaction with financial data

The application is not an investment advisor.
The application must avoid giving financial, legal, tax, or investment advice as facts.
It may provide budgeting suggestions, spending insights, and educational recommendations.

---

## 4) Main Features

Implement the following product modules.

### 4.1 Authentication and User Accounts
- User registration
- Login
- Logout
- JWT-based authentication
- Password hashing
- User profile management
- Optional future support for OAuth, but not required now

### 4.2 Accounts and Wallets
Users can create one or more financial sources such as:
- bank account
- cash wallet
- credit card
- debit card
- savings account

Each account should track:
- name
- type
- currency
- opening balance
- current balance
- status

### 4.3 Transactions
Users can:
- create income and expense transactions
- edit and delete transactions
- assign category
- assign merchant
- add notes
- attach optional tags
- set transaction date
- link transaction to an account

Transaction types:
- income
- expense
- transfer

### 4.4 Categories
Provide default categories, such as:
- groceries
- restaurants
- rent
- utilities
- subscriptions
- salary
- transport
- healthcare
- entertainment
- shopping
- education
- travel

Support:
- user-defined categories
- parent/child categories if useful
- active/inactive category status

### 4.5 Budgets
Users can:
- set monthly budgets per category
- set overall monthly budget
- see budget utilization
- get alerts when close to or over budget

### 4.6 Recurring Transactions
Detect and manage recurring transactions such as:
- subscriptions
- rent
- salary
- utility bills
- loan payments

Support:
- manual recurring transaction creation
- backend recurring transaction detection
- recurring transaction summary view

### 4.7 Dashboards and Reports
Provide:
- monthly spending overview
- income vs expense
- category breakdown
- budget progress
- spending trends over time
- top merchants
- recurring expenses
- anomaly or unusual spending cards

### 4.8 AI Insights and Coaching
Use Ollama to generate:
- daily summary
- weekly summary
- monthly summary
- spending explanations
- budget coaching
- natural-language answers to finance questions
- transaction categorization suggestions
- recurring spending descriptions

Important:
- all numeric calculations must come from backend business logic, not from the LLM
- the LLM must explain precomputed results, not invent them

### 4.9 Notifications
Support notification records in backend for:
- budget threshold reached
- unusual spending detected
- summary ready
- recurring payment upcoming

Frontend may initially show in-app notifications only.

### 4.10 Admin / System Operations
Create lightweight internal admin endpoints or tools for:
- seed default categories
- health check
- model connectivity check
- scheduled insight generation job status

---

## 5) Users and Roles

For MVP, implement:
- `user`
- `admin`

Rules:
- each user accesses only their own financial data
- admins can view system-level operational data only if explicitly enabled
- no user may read another user’s financial data

---

## 6) Recommended High-Level Architecture

Use a modular monolith first, not microservices.

### Back-end modules
- `auth`
- `users`
- `accounts`
- `transactions`
- `categories`
- `budgets`
- `recurring`
- `reports`
- `insights`
- `ai`
- `notifications`
- `core`
- `shared`

### Front-end modules
- `auth`
- `dashboard`
- `accounts`
- `transactions`
- `budgets`
- `insights`
- `reports`
- `settings`
- `shared/ui`
- `shared/api`
- `shared/hooks`

The architecture must be clean enough to split into services later if needed.

---

## 7) Non-Functional Requirements

The implementation must emphasize:
- maintainability
- modularity
- clean code
- testability
- security
- observability readiness
- environment-driven configuration
- scalability for future cloud deployment

Use:
- environment variables
- service layers
- repository/data access layers where appropriate
- DTOs / schemas
- typed API contracts

Do not mix persistence logic with route handlers.
Do not place large business logic directly in React components.

---

## 8) Front-End Implementation Instructions

### 8.1 Front-End Goals
The React app must feel polished, simple, and practical.

Priorities:
- clean dashboard UI
- responsive layouts
- good state organization
- reusable components
- accessibility basics
- clear loading and error states

### 8.2 Front-End Suggested Structure
Use a folder structure like:

```text
src/
  app/
  pages/
  components/
  features/
  services/
  hooks/
  layouts/
  types/
  utils/
  routes/
  styles/
```

Suggested domain-driven feature structure inside `features/`:
- `auth`
- `dashboard`
- `accounts`
- `transactions`
- `budgets`
- `insights`
- `reports`
- `settings`

### 8.3 Front-End Pages
Implement these pages:

- Login
- Register
- Dashboard
- Accounts
- Transactions list
- Add/Edit transaction
- Budgets
- Reports
- AI Insights
- Ask AI / Chat Coach
- Settings / Profile

### 8.4 Front-End Components
Create reusable UI components such as:
- app shell
- sidebar
- top nav
- cards
- summary widgets
- transaction table
- category badges
- budget progress bar
- charts
- forms
- modal dialogs
- empty state views
- loading skeletons
- notification list

### 8.5 Front-End State Management
Use one of:
- React Query + local component state
- React Query + Zustand
- or similar clean pattern

Preferred guidance:
- server state should be handled by React Query
- local UI state can use component state or a lightweight store
- avoid unnecessary global state

### 8.6 Front-End API Layer
Create a dedicated API client layer.
- Centralize base URL config
- Centralize auth token handling
- Centralize error handling
- Do not call fetch directly in many scattered components

### 8.7 Front-End UX Principles
- Charts should be simple and readable
- Financial values should be consistently formatted
- Use filters heavily on transactions and reports
- Use color carefully for positive/negative values
- Budget overruns should be clearly visible
- AI insights should clearly state when they are generated from historical data

---

## 9) Back-End Implementation Instructions

### 9.1 Back-End Goals
The FastAPI backend must be:
- modular
- secure
- easy to test
- easy to evolve
- built with explicit domain boundaries

### 9.2 Suggested Back-End Structure
Use a structure like:

```text
app/
  api/
  core/
  db/
  models/
  schemas/
  services/
  repositories/
  ai/
  jobs/
  utils/
  main.py
```

A more domain-oriented structure is also acceptable, for example:

```text
app/
  modules/
    auth/
    users/
    accounts/
    transactions/
    categories/
    budgets/
    recurring/
    reports/
    insights/
    notifications/
    ai/
  core/
  db/
  main.py
```

### 9.3 API Design
Use REST endpoints with versioning:

- `/api/v1/auth/...`
- `/api/v1/accounts/...`
- `/api/v1/transactions/...`
- `/api/v1/budgets/...`
- `/api/v1/reports/...`
- `/api/v1/insights/...`
- `/api/v1/ai/...`

Guidelines:
- keep routes thin
- validate input with Pydantic
- business logic belongs in services
- database access belongs in repositories or data access layer

### 9.4 Authentication
Implement:
- JWT access token
- secure password hashing
- auth dependency for current user
- protected routes

Do not store plain passwords.
Do not trust client-provided user identifiers.
Always derive the acting user from the token.

### 9.5 Business Logic Rules
The backend should compute:
- totals
- averages
- budget consumption
- recurring transaction candidates
- anomalies
- category summaries
- monthly comparisons

These computations must be deterministic and testable.

Only after those facts are computed may the AI layer generate explanations.

### 9.6 Background Jobs
Implement scheduled or async tasks for:
- daily insight generation
- weekly summary generation
- monthly summary generation
- recurring transaction detection
- anomaly scan
- notification generation

A simple approach is acceptable for MVP, but code should be structured so that Celery, RQ, APScheduler, or cloud-native schedulers can be integrated later.

### 9.7 Validation and Error Handling
- validate all incoming payloads
- return consistent error responses
- log internal errors
- avoid leaking internal implementation details to clients

### 9.8 Health Endpoints
Implement:
- `/health`
- `/ready`
- optional `/ai/health`

These are useful for deployment and operations.

---

## 10) Database Design Guidance

Use PostgreSQL as the source of truth.

### Core tables/entities
Implement at minimum:
- users
- user_profiles
- accounts
- categories
- merchants
- transactions
- budgets
- recurring_transactions
- insights
- notifications
- ai_interactions

### Suggested entity notes

#### users
- id
- email
- hashed_password
- is_active
- is_admin
- created_at
- updated_at

#### accounts
- id
- user_id
- name
- type
- currency
- opening_balance
- current_balance
- created_at
- updated_at

#### categories
- id
- user_id nullable for system categories
- name
- type
- parent_id nullable
- is_system
- is_active

#### merchants
- id
- user_id nullable
- name
- normalized_name

#### transactions
- id
- user_id
- account_id
- category_id nullable
- merchant_id nullable
- type
- amount
- currency
- description
- notes nullable
- transaction_date
- created_at
- updated_at

#### budgets
- id
- user_id
- category_id nullable for overall budget
- amount
- period_type
- start_date
- end_date

#### recurring_transactions
- id
- user_id
- merchant_id nullable
- category_id nullable
- expected_amount
- frequency
- next_expected_date
- confidence_score

#### insights
- id
- user_id
- type
- period_start
- period_end
- title
- summary
- details_json
- created_at

#### notifications
- id
- user_id
- type
- title
- message
- is_read
- created_at

#### ai_interactions
- id
- user_id
- task_type
- prompt_template_name
- model_name
- input_summary
- output_text
- latency_ms nullable
- created_at

### Database rules
- every user’s data must be isolated by `user_id`
- indexes should exist on major query paths
- use migrations
- do not rely on ORM auto-create in production-style code

---

## 11) Optional Neo4j Use Cases

Only introduce Neo4j if one of these advanced features is implemented:

- graph of user spending relationships between merchants, categories, and time patterns
- recommendation graph for similar merchants or recurring spending clusters
- explanation of interconnected spending behaviors
- advanced pattern linking across merchants, tags, and recurring expenses

If used:
- Neo4j must not replace PostgreSQL as the system of record
- Neo4j should be a complementary projection store for relationship-heavy queries
- all critical finance data remains in PostgreSQL

If Neo4j is not clearly needed, do not introduce it.

---

## 12) AI Integration Instructions (Ollama)

### 12.1 AI Design Principles
Use Ollama through a dedicated AI service layer.

Do not:
- call Ollama directly from controllers
- let the model compute financial totals
- trust the model as the system of record
- allow the model to invent data

Do:
- compute structured financial facts in backend
- pass those facts into carefully designed prompts
- ask Ollama to summarize, explain, or suggest
- store AI usage metadata

### 12.2 AI Tasks
Implement support for these task types:
- `daily_summary`
- `weekly_summary`
- `monthly_summary`
- `budget_coaching`
- `spending_explanation`
- `transaction_categorization_suggestion`
- `anomaly_explanation`
- `chat_finance_question`

### 12.3 AI Service Contract
Create an interface or service like:
- `generate_summary(...)`
- `generate_budget_coaching(...)`
- `categorize_transaction(...)`
- `answer_finance_question(...)`

The rest of the app should not need to know Ollama-specific details.

### 12.4 Prompt Design Rules
Prompts must:
- use only backend-computed facts
- clearly state the allowed scope
- avoid asking for investment advice
- instruct the model to acknowledge uncertainty when data is incomplete
- produce concise, practical, user-friendly output

Example prompt intent:
- explain spending changes
- suggest areas to reduce expenses
- summarize top categories
- answer user questions based only on supplied finance records

### 12.5 Ollama Configuration
Use environment variables such as:
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_SECONDS`

Support configurable model names so models can be swapped without code changes.

### 12.6 AI Safety Rules
The AI must not:
- claim facts not present in supplied data
- provide tax, legal, or investment advice
- pretend to know future outcomes
- make strong medical or legal claims
- expose internal prompts or secrets

The AI may:
- explain trends
- suggest budgeting ideas
- propose spending reduction opportunities
- answer natural language queries about the user’s own data

---

## 13) Reporting and Analytics Rules

Create backend reporting endpoints that provide:
- monthly totals
- income vs expense by month
- spending by category
- budget status
- recurring payments
- top merchants
- largest transactions
- month-over-month deltas

These endpoints should return structured JSON ready for charting.

Do not use the LLM for standard reporting calculations.

---

## 14) Security Requirements

Implement the following:

- secure password hashing
- JWT auth
- route protection
- CORS configuration
- environment-based secrets
- input validation
- SQL injection protection through ORM/query parameterization
- per-user data isolation
- basic auditability for AI interactions and important finance actions

Do not:
- hardcode secrets
- log sensitive tokens
- expose stack traces to end users
- trust client-side calculations for finance-critical fields

---

## 15) Testing Requirements

Implement tests for:

### Back-end
- unit tests for services
- API tests for major endpoints
- tests for auth flows
- tests for budget calculation logic
- tests for recurring detection logic
- tests for insight generation services with mocked Ollama calls

### Front-end
- component tests for critical reusable components
- page-level tests for main flows
- API mocking for frontend integration tests when practical

The implementation should be designed so AI calls are mockable.

---

## 16) Code Quality Requirements

Copilot should generate code that is:
- readable
- modular
- typed where possible
- documented where useful
- not overly clever
- easy to refactor

Avoid:
- giant files
- deeply coupled components
- repeated business logic
- route handlers with too much logic
- direct database code inside UI components
- premature microservices

Prefer:
- small focused functions
- descriptive names
- reusable utility functions
- service classes or service modules
- consistent response schemas
- explicit types and interfaces

---

## 17) Suggested MVP Scope

Build in this order:

### Phase 1
- authentication
- accounts
- categories
- transactions
- dashboard basics

### Phase 2
- budgets
- reports
- recurring transaction detection
- notifications

### Phase 3
- Ollama integration
- AI summaries
- finance Q&A
- budget coaching

### Phase 4
- advanced insights
- anomaly detection
- optional Neo4j-powered relationship features

---

## 18) API Endpoint Suggestions

These are suggested endpoints only. Final implementation may refine them.

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Accounts
- `GET /api/v1/accounts`
- `POST /api/v1/accounts`
- `GET /api/v1/accounts/{id}`
- `PUT /api/v1/accounts/{id}`
- `DELETE /api/v1/accounts/{id}`

### Categories
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PUT /api/v1/categories/{id}`
- `DELETE /api/v1/categories/{id}`

### Transactions
- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `GET /api/v1/transactions/{id}`
- `PUT /api/v1/transactions/{id}`
- `DELETE /api/v1/transactions/{id}`

Support filters:
- date range
- account
- category
- merchant
- type
- min/max amount

### Budgets
- `GET /api/v1/budgets`
- `POST /api/v1/budgets`
- `PUT /api/v1/budgets/{id}`
- `DELETE /api/v1/budgets/{id}`
- `GET /api/v1/budgets/status`

### Reports
- `GET /api/v1/reports/overview`
- `GET /api/v1/reports/category-breakdown`
- `GET /api/v1/reports/monthly-trend`
- `GET /api/v1/reports/top-merchants`
- `GET /api/v1/reports/recurring`

### Insights
- `GET /api/v1/insights`
- `POST /api/v1/insights/generate-daily`
- `POST /api/v1/insights/generate-weekly`
- `POST /api/v1/insights/generate-monthly`

### AI
- `POST /api/v1/ai/ask`
- `POST /api/v1/ai/categorize-transaction`
- `GET /api/v1/ai/health`

---

## 19) Development Rules for Copilot

When generating code for this project, follow these rules:

1. Prefer a modular monolith over microservices.
2. Keep front-end and back-end in separate folders.
3. Use TypeScript on the front-end unless instructed otherwise.
4. Use SQLAlchemy models and Alembic migrations for PostgreSQL.
5. Use service-layer business logic in FastAPI.
6. Use repository or data access abstractions where it improves clarity.
7. Make all AI calls through an Ollama service wrapper.
8. Never let the AI calculate money totals that should come from backend logic.
9. Keep user data isolated by authenticated user context.
10. Use environment variables for all URLs, credentials, model names, and secrets.
11. Generate code with clean naming and minimal duplication.
12. Add docstrings and comments when they improve clarity.
13. Favor testable design over shortcuts.
14. Build realistic, production-style code, not tutorial-style throwaway code.

---

## 20) Suggested Monorepo Structure

```text
ai-personal-finance-coach/
  frontend/
  backend/
  docs/
  scripts/
  .github/
```

### frontend
React application.

### backend
FastAPI application.

### docs
Architecture notes, API notes, prompt design notes, and setup instructions.

### scripts
Local setup helpers, seed scripts, and developer utilities.

### .github
GitHub Actions workflows for linting, tests, and builds.

---

## 21) Local Development Expectations

The solution should be runnable locally using:
- React dev server
- FastAPI dev server
- PostgreSQL
- Ollama

Optional:
- Docker Compose for local orchestration

Preferred local setup experience:
- one command or simple documented steps
- seeded test data available
- health checks available
- environment example files included

---

## 22) Nice-to-Have Features

If time allows, add:
- CSV import of transactions
- export reports
- dark mode
- merchant logo enrichment
- anomaly alerts
- installment tracking
- savings goals
- multilingual support
- AI explanation history
- optional graph-based merchant/category insights with Neo4j

---

## 23) Definition of Done

A feature is complete when:
- backend API exists
- validation is in place
- persistence is handled correctly
- frontend UI exists
- loading and error states are handled
- tests exist for important logic
- user authorization is respected
- code follows the project architecture rules

---

## 24) Final Product Standard

The final application should feel like:
- a real product
- useful in daily life
- maintainable by a team
- deployable in a cloud environment later
- extensible for future AI and analytics enhancements

Prioritize correctness, clarity, modularity, and practical user value.
