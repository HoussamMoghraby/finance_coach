"""
Tests for account endpoints
"""
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from tests.test_auth import client, test_db


def get_auth_headers(client):
    """Helper to get authentication headers"""
    client.post(
        f"{settings.API_V1_PREFIX}/auth/register",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    login_response = client.post(
        f"{settings.API_V1_PREFIX}/auth/login",
        data={"username": "test@example.com", "password": "testpassword123"},
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_account(client):
    """Test creating an account"""
    headers = get_auth_headers(client)
    
    response = client.post(
        f"{settings.API_V1_PREFIX}/accounts",
        json={
            "name": "My Bank Account",
            "type": "bank",
            "currency": "USD",
            "opening_balance": 1000.0,
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Bank Account"
    assert data["type"] == "bank"
    assert data["current_balance"] == 1000.0


def test_get_accounts(client):
    """Test getting all accounts"""
    headers = get_auth_headers(client)
    
    # Create an account first
    client.post(
        f"{settings.API_V1_PREFIX}/accounts",
        json={"name": "Test Account", "type": "cash", "opening_balance": 500.0},
        headers=headers,
    )
    
    # Get all accounts
    response = client.get(f"{settings.API_V1_PREFIX}/accounts", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == "Test Account"


def test_update_account(client):
    """Test updating an account"""
    headers = get_auth_headers(client)
    
    # Create account
    create_response = client.post(
        f"{settings.API_V1_PREFIX}/accounts",
        json={"name": "Original Name", "type": "bank", "opening_balance": 100.0},
        headers=headers,
    )
    account_id = create_response.json()["id"]
    
    # Update account
    response = client.put(
        f"{settings.API_V1_PREFIX}/accounts/{account_id}",
        json={"name": "Updated Name"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


def test_delete_account(client):
    """Test deleting an account"""
    headers = get_auth_headers(client)
    
    # Create account
    create_response = client.post(
        f"{settings.API_V1_PREFIX}/accounts",
        json={"name": "To Delete", "type": "cash", "opening_balance": 0.0},
        headers=headers,
    )
    account_id = create_response.json()["id"]
    
    # Delete account
    response = client.delete(
        f"{settings.API_V1_PREFIX}/accounts/{account_id}",
        headers=headers,
    )
    assert response.status_code == 204
