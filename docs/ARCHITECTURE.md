# Architecture Overview

This document describes the architecture and design decisions for the AI Personal Finance & Spending Coach application.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│                 │         │                  │         │             │
│  React Frontend │────────▶│  FastAPI Backend │────────▶│ PostgreSQL  │
│  (TypeScript)   │         │    (Python)      │         │   Database  │
│                 │         │                  │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
                                     │
                                     │
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │  Ollama         │
                            │  (Local LLM)    │
                            │                 │
                            └─────────────────┘
```

## Backend Architecture

### Modular Monolith Pattern

The backend follows a modular monolith architecture with clear domain boundaries:

```
app/
├── api/              # API layer (routes/endpoints)
│   └── v1/
│       ├── endpoints/
│       └── api.py    # Router aggregation
├── core/             # Core utilities
│   ├── config.py     # Settings
│   ├── security.py   # Auth utilities
│   └── deps.py       # FastAPI dependencies
├── db/               # Database configuration
│   ├── session.py
│   └── seed.py
├── models/           # SQLAlchemy models
├── schemas/          # Pydantic schemas
├── services/         # Business logic layer
├── repositories/     # Data access layer
├── ai/               # AI/LLM integration
│   ├── ollama.py     # Ollama client
│   └── prompts.py    # Prompt templates
└── main.py           # Application entry point
```

### Layered Architecture

1. **API Layer** (`api/v1/endpoints/`)
   - Thin controllers
   - Input validation with Pydantic
   - Authentication & authorization
   - HTTP-specific concerns

2. **Service Layer** (`services/`)
   - Business logic
   - Orchestration between repositories
   - Transaction management
   - Domain rules and calculations

3. **Repository Layer** (`repositories/`)
   - Data access abstraction
   - Database queries
   - CRUD operations
   - Query builders

4. **Model Layer** (`models/`)
   - SQLAlchemy ORM models
   - Database schema definitions
   - Relationships

## Design Principles

### 1. Separation of Concerns

- API routes don't contain business logic
- Business logic doesn't know about HTTP
- Database access is abstracted through repositories

### 2. Dependency Injection

- Database sessions injected via FastAPI dependencies
- Services receive dependencies in constructors
- Makes testing easier with mocks

### 3. Data Flow

```
Request → API Endpoint → Service → Repository → Database
                ↓
            Response
```

### 4. AI Integration Pattern

All AI interactions follow this pattern:

1. **Calculate facts in backend** (deterministic)
2. **Format data for AI**
3. **Send to Ollama** (via abstraction layer)
4. **Store AI response**
5. **Track interaction** (for monitoring)

**NEVER** let AI:
- Calculate financial totals
- Be the source of truth
- Make decisions

## Key Design Decisions

### Authentication

- JWT-based authentication
- Tokens stored in localStorage on frontend
- All user data isolated by `user_id`
- Password hashing with bcrypt

### Database Design

- PostgreSQL as primary database
- No Neo4j unless specifically needed
- Normalized schema
- Alembic for migrations
- System categories vs user categories

### AI Safety

- System prompt enforces boundaries
- Only precomputed data sent to AI
- AI explains, doesn't calculate
- All interactions tracked
- No investment/legal/tax advice

### State Management

Frontend state:
- Server state: React Query
- UI state: Component state
- Auth state: Context API
- No global state unless needed

### API Design

- RESTful endpoints
- Versioned via `/api/v1`
- Consistent response format
- Proper HTTP status codes
- OpenAPI documentation

## Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **Authorization**: Per-user data isolation
3. **Input Validation**: Pydantic schemas
4. **SQL Injection**: ORM parameterization
5. **CORS**: Configured origins only
6. **Secrets**: Environment variables
7. **Password Storage**: Hashed with bcrypt

## Testing Strategy

### Backend Tests

- Unit tests for services
- API integration tests
- Repository tests with test DB
- AI service with mocked Ollama

### Frontend Tests

- Component tests
- API mock tests
- E2E tests (future)

## Scalability Considerations

The current architecture supports future scaling:

1. **Service Extraction**: Each module can become a microservice
2. **Caching**: Redis can be added for caching
3. **Queue**: Background jobs can use Celery/RQ
4. **Database**: Can add read replicas
5. **AI**: Can switch from local Ollama to cloud LLM

## Deployment Architecture (Future)

```
┌──────────────┐
│   Frontend   │─────▶ CDN/Static Hosting
└──────────────┘

┌──────────────┐
│   Backend    │─────▶ Container Platform
└──────────────┘       (Docker/K8s)

┌──────────────┐
│  PostgreSQL  │─────▶ Managed Database
└──────────────┘       (RDS/CloudSQL)

┌──────────────┐
│   Ollama     │─────▶ GPU Instance
└──────────────┘       or Cloud LLM API
```

## Error Handling

- FastAPI exception handlers
- Proper HTTP status codes
- User-friendly error messages
- Internal errors logged but not exposed

## Observability (Future)

Ready for:
- Structured logging
- APM integration (DataDog, New Relic)
- Health check endpoints
- Metrics collection

## Code Quality

- Type hints in Python
- TypeScript in frontend
- Linting (Black, Ruff, ESLint)
- Pre-commit hooks (future)
- CI/CD pipelines (future)
