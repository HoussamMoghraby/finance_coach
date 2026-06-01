#!/bin/bash
set -e

# Financial Coach Frontend - Build Script
# This script builds the React/Ionic frontend for production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Financial Coach - Frontend Build${NC}"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the frontend directory.${NC}"
    exit 1
fi

# Get ALB DNS from Terraform (if available)
if [ -d "../infra" ]; then
    echo -e "${YELLOW}Getting backend API URL from Terraform...${NC}"
    cd ../infra
    ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    cd ../frontend

    if [ -n "$ALB_DNS" ]; then
        API_URL="http://$ALB_DNS"
        echo -e "${GREEN}Backend API URL: ${API_URL}${NC}"
    else
        echo -e "${YELLOW}Warning: Could not get ALB DNS from Terraform${NC}"
        echo -e "${YELLOW}Using default API URL. You can override with: export VITE_API_URL=<your-url>${NC}"
        API_URL="${VITE_API_URL:-http://localhost:8000}"
    fi
else
    echo -e "${YELLOW}Terraform directory not found. Using environment variable or default.${NC}"
    API_URL="${VITE_API_URL:-http://localhost:8000}"
fi

# Create .env.production file
echo -e "${YELLOW}Creating .env.production file...${NC}"
cat > .env.production << EOF
VITE_API_URL=$API_URL
EOF

echo -e "${GREEN}✓ Created .env.production${NC}"
cat .env.production
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run type check
echo -e "${YELLOW}Running TypeScript type check...${NC}"
npm run type-check

# Build for production
echo -e "${YELLOW}Building production bundle...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed - dist directory not created${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo -e "${GREEN}Output directory: $(pwd)/dist${NC}"
echo ""

# Show build size
echo -e "${YELLOW}Build size:${NC}"
du -sh dist
echo ""
echo -e "${YELLOW}Detailed breakdown:${NC}"
du -sh dist/* 2>/dev/null || echo "No files in dist"

echo ""
echo -e "${GREEN}✓ Frontend build complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy to S3: ./deploy-to-s3.sh"
echo "2. Or manually: aws s3 sync dist/ s3://\$(cd ../infra && terraform output -raw frontend_bucket_name)"
