# AI Personal Finance & Spending Coach

A production-style web application for tracking personal finances, managing budgets, and receiving AI-powered financial insights.

## Features

- 📊 **Dashboard**: View income, expenses, and spending trends
- 💰 **Accounts & Transactions**: Track multiple accounts and categorize transactions
- 📈 **Budgets**: Create and monitor budgets per category
- 🔄 **Recurring Transactions**: Detect and manage subscriptions and recurring payments
- 📉 **Reports**: Analyze spending patterns with interactive charts
- 🤖 **AI Insights**: Get daily, weekly, and monthly summaries with Ollama
- 💬 **AI Coach**: Ask natural language questions about your finances

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- React Query for server state
- React Router for navigation
- Recharts for data visualization
- Tailwind CSS for styling

### Backend
- FastAPI (Python 3.12)
- PostgreSQL with SQLAlchemy ORM
- Alembic for database migrations
- JWT authentication
- Pydantic for validation
- Ollama for AI features

## Project Structure

```
ai-personal-finance-coach/
├── frontend/          # React TypeScript application
├── backend/           # FastAPI application
├── docs/              # Documentation
├── scripts/           # Development and utility scripts
└── .github/           # CI/CD workflows
```

## Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 15+
- Ollama (for AI features)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd financial_coach
```

### 2. Set up Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
alembic upgrade head
python -m app.db.seed  # Optional: seed default data
uvicorn app.main:app --reload
```

Backend will run at http://localhost:8000

### 3. Set up Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev
```

Frontend will run at http://localhost:5173

### 4. Set up Ollama

```bash
# Install Ollama from https://ollama.ai
ollama pull llama3.2  # Or your preferred model
ollama serve
```

## Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `OLLAMA_BASE_URL`: Ollama API URL (default: http://localhost:11434)
- `OLLAMA_MODEL`: Model name (default: llama3.2)

### Frontend (.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)

## Development

### Run Tests

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm test
```

### Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Code Quality

```bash
# Backend
cd backend
black .
ruff check .

# Frontend
cd frontend
npm run lint
npm run type-check
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

This is a modular monolith architecture with clear separation of concerns:

- **Backend Modules**: auth, users, accounts, transactions, categories, budgets, recurring, reports, insights, ai
- **Service Layer**: Business logic isolated from API routes
- **Repository Pattern**: Database access abstraction
- **AI Abstraction**: Ollama integration through dedicated service layer

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Per-user data isolation
- Input validation with Pydantic
- CORS configuration
- Environment-based secrets

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
