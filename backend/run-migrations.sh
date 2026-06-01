#!/bin/bash
set -e

# Financial Coach Backend - Database Migration Script
# This script runs Alembic migrations on the production database

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Financial Coach - Database Migration${NC}"
echo ""

# Check if we're in the backend directory
if [ ! -f "alembic.ini" ]; then
    echo -e "${RED}Error: alembic.ini not found. Please run this script from the backend directory.${NC}"
    exit 1
fi

# Get database connection string
echo -e "${YELLOW}Getting database connection string from AWS Secrets Manager...${NC}"
cd ../infra
DB_SECRET_ARN=$(terraform output -raw db_secret_arn 2>/dev/null)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
cd ../backend

if [ -z "$DB_SECRET_ARN" ]; then
    echo -e "${RED}Error: Could not get database secret ARN from Terraform${NC}"
    echo "Make sure you have run 'terraform apply' in the infra directory"
    exit 1
fi

# Retrieve secret from AWS Secrets Manager
echo -e "${YELLOW}Retrieving database credentials...${NC}"
DB_SECRET=$(aws secretsmanager get-secret-value --secret-id $DB_SECRET_ARN --region $AWS_REGION --query SecretString --output text)
DATABASE_URL=$(echo $DB_SECRET | python3 -c "import sys, json; print(json.load(sys.stdin)['dbConnectionString'])")

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: Could not retrieve database connection string${NC}"
    exit 1
fi

export DATABASE_URL=$DATABASE_URL

# Show current migration status
echo -e "${YELLOW}Current migration status:${NC}"
alembic current

echo ""
echo -e "${YELLOW}Available migrations:${NC}"
alembic history

echo ""
read -p "$(echo -e ${YELLOW}Do you want to upgrade to the latest migration? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Running migrations...${NC}"
    alembic upgrade head
    echo -e "${GREEN}✓ Migrations completed successfully${NC}"
    
    echo ""
    read -p "$(echo -e ${YELLOW}Do you want to run the seed script? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Running seed script...${NC}"
        python3 -c "
from app.db.session import SessionLocal
from app.db.seed import seed_categories
db = SessionLocal()
try:
    seed_categories(db)
    print('${GREEN}✓ Seed data created successfully${NC}')
except Exception as e:
    print('${RED}Error: {e}${NC}')
finally:
    db.close()
"
    fi
else
    echo -e "${YELLOW}Migration cancelled${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
