"""
Database seeding script for default categories and sample data
"""
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.repositories.category import CategoryRepository
from app.repositories.user import UserRepository
from app.repositories.account import AccountRepository


DEFAULT_EXPENSE_CATEGORIES = [
    "Groceries",
    "Restaurants",
    "Rent",
    "Utilities",
    "Subscriptions",
    "Transport",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Education",
    "Travel",
    "Insurance",
    "Gifts",
    "Personal Care",
    "Home Maintenance",
]

DEFAULT_INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Investment",
    "Gift",
    "Refund",
    "Other Income",
]

SAMPLE_ACCOUNTS = [
    {
        "name": "Main Checking",
        "type": "bank",
        "currency": "USD",
        "opening_balance": 5000.0,
    },
    {
        "name": "Savings Account",
        "type": "savings",
        "currency": "USD",
        "opening_balance": 15000.0,
    },
    {
        "name": "Cash Wallet",
        "type": "cash",
        "currency": "USD",
        "opening_balance": 300.0,
    },
    {
        "name": "Credit Card",
        "type": "credit_card",
        "currency": "USD",
        "opening_balance": 0.0,
    },
    {
        "name": "Debit Card",
        "type": "debit_card",
        "currency": "USD",
        "opening_balance": 2000.0,
    },
]


def seed_categories(db: Session):
    """Seed default system categories"""
    repo = CategoryRepository(db)
    
    # Check if categories already exist
    existing_categories = repo.get_system_categories()
    if existing_categories:
        print(f"System categories already exist ({len(existing_categories)} found). Skipping seed.")
        return
    
    print("Seeding system categories...")
    
    # Create expense categories
    for name in DEFAULT_EXPENSE_CATEGORIES:
        repo.create_system_category(name=name, type="expense")
        print(f"  Created expense category: {name}")
    
    # Create income categories
    for name in DEFAULT_INCOME_CATEGORIES:
        repo.create_system_category(name=name, type="income")
        print(f"  Created income category: {name}")
    
    print("System categories seeded successfully!")


def get_or_create_demo_user(db: Session):
    """Get or create a demo user for seeding"""
    user_repo = UserRepository(db)
    
    # Try to get existing demo user
    demo_email = "demo@financial-coach.com"
    user = user_repo.get_by_email(demo_email)
    
    if user:
        print(f"Using existing demo user: {demo_email}")
        return user
    
    # Create demo user
    print(f"Creating demo user: {demo_email}")
    user = user_repo.create(email=demo_email, password="demo123456")
    print(f"  Demo user created with ID: {user.id}")
    return user


def seed_accounts(db: Session):
    """Seed sample accounts for demo user"""
    account_repo = AccountRepository(db)
    
    # Get or create demo user
    user = get_or_create_demo_user(db)
    
    # Check if user already has accounts
    existing_accounts = account_repo.get_all_for_user(user.id, include_inactive=True)
    if existing_accounts:
        print(f"User already has accounts ({len(existing_accounts)} found). Skipping account seed.")
        return
    
    print(f"Seeding sample accounts for user {user.email}...")
    
    # Create sample accounts
    for account_data in SAMPLE_ACCOUNTS:
        account = account_repo.create(user_id=user.id, **account_data)
        print(f"  Created {account.type} account: {account.name} (Balance: ${account.current_balance:.2f})")
    
    print("Sample accounts seeded successfully!")


def main():
    """Main seeding function"""
    db = SessionLocal()
    try:
        seed_categories(db)
        seed_accounts(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
