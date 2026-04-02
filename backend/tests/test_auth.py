"""
Tests for authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.core.config import settings


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(test_db):
    return TestClient(app)


def test_register_user(client):
    """Test user registration"""
    response = client.post(
        f"{settings.API_V1_PREFIX}/auth/register",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data


def test_login_user(client):
    """Test user login"""
    # First register
    client.post(
        f"{settings.API_V1_PREFIX}/auth/register",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    
    # Then login
    response = client.post(
        f"{settings.API_V1_PREFIX}/auth/login",
        data={"username": "test@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_current_user(client):
    """Test getting current user info"""
    # Register and login
    client.post(
        f"{settings.API_V1_PREFIX}/auth/register",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    login_response = client.post(
        f"{settings.API_V1_PREFIX}/auth/login",
        data={"username": "test@example.com", "password": "testpassword123"},
    )
    token = login_response.json()["access_token"]
    
    # Get current user
    response = client.get(
        f"{settings.API_V1_PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post(
        f"{settings.API_V1_PREFIX}/auth/login",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
