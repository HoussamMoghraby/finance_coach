#!/bin/bash
set -e

# Financial Coach Frontend - Deploy to S3 Script
# This script uploads the built frontend to S3 and invalidates CloudFront cache

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Financial Coach - Frontend Deployment${NC}"
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist directory not found${NC}"
    echo "Please run ./build.sh first to build the frontend"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Get S3 bucket name and CloudFront distribution from Terraform
echo -e "${YELLOW}Getting S3 bucket and CloudFront info from Terraform...${NC}"
cd ../infra
S3_BUCKET=$(terraform output -raw frontend_bucket_name 2>/dev/null)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null)
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url 2>/dev/null)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
cd ../frontend

if [ -z "$S3_BUCKET" ]; then
    echo -e "${RED}Error: Could not get S3 bucket name from Terraform${NC}"
    echo "Make sure you have run 'terraform apply' in the infra directory for Phase 3"
    exit 1
fi

echo -e "${GREEN}S3 Bucket: ${S3_BUCKET}${NC}"
echo -e "${GREEN}CloudFront Distribution: ${CLOUDFRONT_ID}${NC}"
echo -e "${GREEN}CloudFront URL: ${CLOUDFRONT_URL}${NC}"
echo ""

# Sync files to S3
echo -e "${YELLOW}Uploading files to S3...${NC}"
aws s3 sync dist/ s3://$S3_BUCKET \
    --delete \
    --region $AWS_REGION \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML and JSON files with shorter cache
echo -e "${YELLOW}Uploading HTML and manifest files...${NC}"
aws s3 sync dist/ s3://$S3_BUCKET \
    --region $AWS_REGION \
    --cache-control "public, max-age=0, must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --include "*.json"

echo -e "${GREEN}✓ Files uploaded to S3${NC}"
echo ""

# Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_ID" ]; then
    echo -e "${YELLOW}Creating CloudFront invalidation...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)

    echo -e "${GREEN}✓ CloudFront invalidation created: ${INVALIDATION_ID}${NC}"
    echo -e "${YELLOW}Invalidation typically takes 1-2 minutes to complete${NC}"
else
    echo -e "${YELLOW}Warning: CloudFront distribution ID not found, skipping cache invalidation${NC}"
fi

echo ""
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Your application is now available at:${NC}"
echo -e "${GREEN}${CLOUDFRONT_URL}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update backend CORS settings to include: ${CLOUDFRONT_URL}"
echo "   - Edit infra/terraform.tfvars: backend_cors_origins = [\"${CLOUDFRONT_URL}\"]"
echo "   - Run: cd ../infra && terraform apply"
echo "2. Test your application at: ${CLOUDFRONT_URL}"
