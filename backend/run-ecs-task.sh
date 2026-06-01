#!/bin/bash
set -e

# Financial Coach Backend - ECS Task Runner
# This script runs one-off tasks in the ECS cluster (e.g., migrations)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get cluster info from Terraform
cd ../infra
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null)
ECS_TASK_DEF=$(terraform output -raw ecs_task_definition_arn 2>/dev/null)
PRIVATE_SUBNETS=$(terraform output -json private_subnet_ids | jq -r '.[]' | tr '\n' ',' | sed 's/,$//')
BACKEND_SG=$(terraform output -raw backend_security_group_id 2>/dev/null)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
cd ../backend

if [ -z "$ECS_CLUSTER" ] || [ -z "$ECS_TASK_DEF" ]; then
    echo -e "${RED}Error: Could not get ECS information from Terraform${NC}"
    exit 1
fi

# Command to run (default: migrations)
COMMAND=${1:-"alembic upgrade head"}

echo -e "${YELLOW}Running command in ECS task: ${COMMAND}${NC}"
echo ""

# Run ECS task
TASK_ARN=$(aws ecs run-task \
    --cluster $ECS_CLUSTER \
    --task-definition $ECS_TASK_DEF \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNETS],securityGroups=[$BACKEND_SG],assignPublicIp=DISABLED}" \
    --overrides "{\"containerOverrides\":[{\"name\":\"backend\",\"command\":[\"sh\",\"-c\",\"$COMMAND\"]}]}" \
    --region $AWS_REGION \
    --query 'tasks[0].taskArn' \
    --output text)

if [ -z "$TASK_ARN" ]; then
    echo -e "${RED}Error: Failed to start ECS task${NC}"
    exit 1
fi

echo -e "${GREEN}Task started: ${TASK_ARN}${NC}"
echo -e "${YELLOW}Waiting for task to complete...${NC}"

# Wait for task to finish
aws ecs wait tasks-stopped \
    --cluster $ECS_CLUSTER \
    --tasks $TASK_ARN \
    --region $AWS_REGION

# Get task status
EXIT_CODE=$(aws ecs describe-tasks \
    --cluster $ECS_CLUSTER \
    --tasks $TASK_ARN \
    --region $AWS_REGION \
    --query 'tasks[0].containers[0].exitCode' \
    --output text)

if [ "$EXIT_CODE" == "0" ]; then
    echo -e "${GREEN}✓ Task completed successfully${NC}"
else
    echo -e "${RED}✗ Task failed with exit code: ${EXIT_CODE}${NC}"
    echo -e "${YELLOW}Check CloudWatch logs for details${NC}"
    exit 1
fi
