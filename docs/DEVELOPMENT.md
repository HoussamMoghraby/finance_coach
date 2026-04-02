# Development Guide

This guide will help you set up and develop the AI Personal Finance Coach application.

## Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 15+
- Ollama (for AI features)
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd financial_coach
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb financial_coach

# Run migrations
alembic upgrade head

# Seed default categories
python -m app.db.seed
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with backend URL
```

### 5. Ollama Setup

```bash
# Install Ollama from https://ollama.ai
# Pull a model
ollama pull llama3.2

# Start Ollama server
ollama serve
```

## Running the Application

### Development Mode

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Workflow

### Making Database Changes

1. Modify models in `app/models/`
2. Generate migration:
   ```bash
   alembic revision --autogenerate -m "Description of change"
   ```
3. Review the generated migration in `alembic/versions/`
4. Apply migration:
   ```bash
   alembic upgrade head
   ```

### Adding New Endpoints

1. Create schemas in `app/schemas/`
2. Create repository in `app/repositories/` (if needed)
3. Create service in `app/services/`
4. Create endpoint in `app/api/v1/endpoints/`
5. Register router in `app/api/v1/api.py`
6. Write tests in `tests/`

### Frontend Development

1. Create component in `src/components/` or `src/pages/`
2. Create API service in `src/services/` (if needed)
3. Use React Query for server state
4. Add routes in `App.tsx`

## Code Quality

### Backend

```bash
# Format code
black .

# Lint
ruff check .

# Type check
mypy .

# Run tests
pytest
pytest -v  # Verbose output
pytest tests/test_auth.py  # Specific test file
```

### Frontend

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Format (if configured)
npm run format
```

## Common Tasks

### Creating a New User

```bash
# Via API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Testing AI Integration

```bash
# Check Ollama health
curl http://localhost:8000/api/v1/insights/health

# Generate daily summary (requires auth token)
curl -X POST http://localhost:8000/api/v1/insights/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"daily"}'
```

### Resetting Database

```bash
cd backend
alembic downgrade base
alembic upgrade head
python -m app.db.seed
```

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/financial_coach

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:5173"]

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_TIMEOUT_SECONDS=30

# Application
API_V1_PREFIX=/api/v1
ENVIRONMENT=development
DEBUG=True
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

## Debugging

### Backend Debugging

1. Add breakpoints in your IDE
2. Use FastAPI's interactive docs: http://localhost:8000/docs
3. Check logs in terminal
4. Use `print()` or `logging` for debug output

### Frontend Debugging

1. Use React DevTools
2. Use browser DevTools Network tab
3. Check console for errors
4. Use React Query DevTools (can be added)

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Ollama Connection Issues

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Test model
ollama run llama3.2 "Hello"
```

### Python Import Errors

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Project Structure Reference

```
financial_coach/
├── backend/
│   ├── alembic/          # Database migrations
│   ├── app/
│   │   ├── ai/           # AI/Ollama integration
│   │   ├── api/          # API routes
│   │   ├── core/         # Core utilities
│   │   ├── db/           # Database setup
│   │   ├── models/       # Database models
│   │   ├── repositories/ # Data access
│   │   ├── schemas/      # Pydantic models
│   │   ├── services/     # Business logic
│   │   └── main.py       # Application entry
│   ├── tests/            # Backend tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── App.tsx       # Main app component
│   └── package.json
└── docs/                 # Documentation
```

## Best Practices

1. **Always activate virtual environment** before backend work
2. **Run tests** before committing
3. **Keep migrations** in version control
4. **Use type hints** in Python
5. **Use TypeScript** in frontend
6. **Write tests** for new features
7. **Update documentation** when needed
8. **Keep secrets in .env** files
9. **Never commit .env** files
10. **Review API docs** after changes

## Getting Help

- Check API documentation: http://localhost:8000/docs
- Review architecture docs: `docs/ARCHITECTURE.md`
- Check issues and discussions on GitHub
- Review test files for examples
