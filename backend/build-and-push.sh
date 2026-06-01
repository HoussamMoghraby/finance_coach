#!/bin/bash
set -e

# Financial Coach Backend - Build and Push Script
# This script builds the Docker image and pushes it to AWS ECR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Get ECR repository URL from Terraform output
echo -e "${YELLOW}Getting ECR repository URL...${NC}"
cd ../infra
ECR_REPO=$(terraform output -raw ecr_repository_url 2>/dev/null)
if [ -z "$ECR_REPO" ]; then
    echo -e "${RED}Error: Could not get ECR repository URL from Terraform${NC}"
    echo "Make sure you have run 'terraform apply' in the infra directory"
    exit 1
fi
cd ../backend

AWS_REGION=$(echo $ECR_REPO | cut -d'.' -f4)
AWS_ACCOUNT_ID=$(echo $ECR_REPO | cut -d'.' -f1 | cut -d'/' -f3)

echo -e "${GREEN}ECR Repository: ${ECR_REPO}${NC}"
echo -e "${GREEN}AWS Region: ${AWS_REGION}${NC}"

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t financial-coach-backend:latest .

# Tag image
echo -e "${YELLOW}Tagging image...${NC}"
docker tag financial-coach-backend:latest $ECR_REPO:latest
docker tag financial-coach-backend:latest $ECR_REPO:$(git rev-parse --short HEAD 2>/dev/null || echo "manual")

# Push image
echo -e "${YELLOW}Pushing image to ECR...${NC}"
docker push $ECR_REPO:latest
docker push $ECR_REPO:$(git rev-parse --short HEAD 2>/dev/null || echo "manual")

echo -e "${GREEN}✓ Successfully built and pushed Docker image${NC}"
echo -e "${GREEN}Image: ${ECR_REPO}:latest${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update ECS service to deploy the new image:"
echo "   cd ../infra && terraform apply -target=aws_ecs_service.backend"
echo "2. Or force a new deployment:"
echo "   aws ecs update-service --cluster \$(terraform output -raw ecs_cluster_name) --service \$(terraform output -raw ecs_service_name) --force-new-deployment --region $AWS_REGION"
