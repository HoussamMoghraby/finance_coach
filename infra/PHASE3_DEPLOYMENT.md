# Phase 3: Frontend Deployment - S3 + CloudFront

This guide covers Phase 3 of the AWS deployment: deploying the React/Ionic frontend to S3 with CloudFront CDN.

## 📋 Prerequisites

- ✅ Phase 1 completed (Infrastructure foundation)
- ✅ Phase 2 completed (Backend API deployed)
- ✅ Node.js and npm installed locally
- ✅ AWS CLI configured
- ✅ Frontend application in `/frontend` directory

## 🏗️ Phase 3 Components

This phase deploys:
- ✅ S3 bucket for static file hosting (with versioning and encryption)
- ✅ CloudFront distribution with HTTPS and global CDN
- ✅ CloudFront Origin Access Identity (OAI) for secure S3 access
- ✅ Custom error pages for SPA routing (404 → index.html)
- ✅ CloudWatch monitoring and alarms
- ✅ Optimized caching policies for static assets

## ⚙️ Configuration

### 1. Apply Phase 3 Infrastructure

```bash
cd infra

# Review Phase 3 resources
terraform plan

# Apply (creates S3 bucket and CloudFront distribution)
terraform apply
```

Expected resources: ~10-15 new resources
Time: ~10-15 minutes (CloudFront takes the longest)

### 2. Get Infrastructure Outputs

```bash
# Get S3 bucket name
terraform output frontend_bucket_name

# Get CloudFront URL
terraform output cloudfront_url

# Get all outputs
terraform output
```

Save the CloudFront URL - this is your frontend application URL!

## 🎨 Frontend Build

### Option 1: Using the Build Script (Recommended)

```bash
cd ../frontend

# Build production bundle
./build.sh
```

This script will:
1. Get the backend API URL from Terraform (ALB DNS)
2. Create `.env.production` with the correct API URL
3. Run TypeScript type checking
4. Build the production bundle to `dist/`
5. Show build size and breakdown

### Option 2: Manual Build

```bash
cd frontend

# Get backend API URL
ALB_DNS=$(cd ../infra && terraform output -raw alb_dns_name)

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=http://$ALB_DNS
EOF

# Install dependencies (if needed)
npm install

# Type check
npm run type-check

# Build
npm run build
```

### Build Output

The build creates a `dist/` directory with:
- `index.html` - Main HTML file
- `assets/` - JavaScript, CSS, images, fonts
- Optimized and minified for production
- Typical size: 1-3 MB

## 🚀 Deploy to S3 + CloudFront

### Option 1: Using the Deploy Script (Recommended)

```bash
cd frontend

# Deploy to S3 and invalidate CloudFront cache
./deploy-to-s3.sh
```

This script will:
1. Get S3 bucket and CloudFront distribution from Terraform
2. Upload all files to S3 with optimized cache headers
3. Set long cache for static assets (1 year)
4. Set short cache for HTML files (must-revalidate)
5. Create CloudFront cache invalidation
6. Display the frontend URL

### Option 2: Manual Deployment

```bash
cd frontend

# Get infrastructure info
S3_BUCKET=$(cd ../infra && terraform output -raw frontend_bucket_name)
CLOUDFRONT_ID=$(cd ../infra && terraform output -raw cloudfront_distribution_id)

# Upload static assets with long cache
aws s3 sync dist/ s3://$S3_BUCKET \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML/JSON with short cache
aws s3 sync dist/ s3://$S3_BUCKET \
    --cache-control "public, max-age=0, must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --include "*.json"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_ID \
    --paths "/*"
```

### Deployment Notes

- **Cache Invalidation**: Takes 1-2 minutes to propagate globally
- **First Deployment**: CloudFront may take up to 15 minutes to fully propagate
- **Subsequent Deployments**: Near-instant with cache invalidation

## 🔧 Update Backend CORS

After deployment, update the backend to allow requests from CloudFront:

```bash
cd infra

# Get CloudFront URL
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
echo "CloudFront URL: $CLOUDFRONT_URL"

# Edit terraform.tfvars and add CloudFront URL to CORS origins
# backend_cors_origins = ["https://your-cloudfront-domain.cloudfront.net"]
```

Edit `infra/terraform.tfvars`:
```hcl
backend_cors_origins = ["https://d1234567890abc.cloudfront.net"]  # Your CloudFront domain
```

Apply the changes:
```bash
terraform apply

# This will redeploy the ECS service with updated CORS settings
```

## ✅ Verification

### 1. Check S3 Upload

```bash
# List files in S3 bucket
S3_BUCKET=$(cd infra && terraform output -raw frontend_bucket_name)
aws s3 ls s3://$S3_BUCKET --recursive --human-readable

# Check total size
aws s3 ls s3://$S3_BUCKET --recursive --summarize | tail -2
```

### 2. Check CloudFront Status

```bash
# Get distribution status
CLOUDFRONT_ID=$(cd infra && terraform output -raw cloudfront_distribution_id)
aws cloudfront get-distribution --id $CLOUDFRONT_ID \
    --query 'Distribution.Status' \
    --output text
```

Expected: `Deployed`

### 3. Test Frontend Access

```bash
CLOUDFRONT_URL=$(cd infra && terraform output -raw cloudfront_url)

# Test main page
curl -I $CLOUDFRONT_URL

# Expected: HTTP/2 200, content-type: text/html
```

### 4. Test in Browser

1. Open CloudFront URL in browser
2. Verify login page loads
3. Check browser console for errors
4. Test authentication flow
5. Verify API calls work (check Network tab)

### 5. Test SPA Routing

Navigate to a deep link directly:
```
https://your-cloudfront-domain.cloudfront.net/dashboard
```

Should load successfully (not 404) - this verifies SPA routing works.

## 🔄 Updating the Frontend

### 1. Make Code Changes

Edit your frontend code in `/frontend/src`

### 2. Rebuild and Deploy

```bash
cd frontend

# Option A: Build and deploy in one go
./build.sh && ./deploy-to-s3.sh

# Option B: Build, test locally, then deploy
./build.sh
npm run preview  # Test locally at http://localhost:4173
./deploy-to-s3.sh
```

### 3. Verify Changes

Wait 1-2 minutes for cache invalidation, then refresh your browser.

**Tip**: Use hard refresh (Cmd+Shift+R or Ctrl+Shift+R) to bypass browser cache.

## 📊 Monitoring

### CloudWatch Metrics

Monitor in AWS Console → CloudFront → Your Distribution → Monitoring:

- **Requests**: Total requests per minute
- **Data Transfer**: Bytes downloaded
- **Error Rate**: 4xx and 5xx errors
- **Cache Hit Rate**: Percentage of requests served from cache

### Alarms Configured

1. **High 4xx Error Rate** (>5%)
   - Indicates routing or missing file issues

Configure SNS notifications by adding topic ARN to alarm actions.

### CloudFront Logs (Optional)

Enable access logs for detailed analytics:

```hcl
# In cloudfront.tf, add to aws_cloudfront_distribution
logging_config {
  include_cookies = false
  bucket          = "your-logs-bucket.s3.amazonaws.com"
  prefix          = "cloudfront/"
}
```

## 🐛 Troubleshooting

### CloudFront Returns 403 Forbidden

**Cause**: S3 bucket policy not allowing CloudFront OAI

**Solution**:
```bash
cd infra
terraform apply -target=aws_s3_bucket_policy.frontend
```

### Changes Not Appearing

**Cause**: CloudFront cache not invalidated

**Solution**:
```bash
CLOUDFRONT_ID=$(cd infra && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
```

### API Calls Failing (CORS Errors)

**Cause**: Backend CORS not updated with CloudFront URL

**Solution**:
```bash
# Update backend CORS as described in "Update Backend CORS" section above
cd infra
# Edit terraform.tfvars to add CloudFront URL
terraform apply
```

### 404 Errors on Direct Navigation

**Cause**: CloudFront error pages not configured properly

**Solution**: Already configured in Terraform (404 → index.html). Check:
```bash
CLOUDFRONT_ID=$(cd infra && terraform output -raw cloudfront_distribution_id)
aws cloudfront get-distribution-config --id $CLOUDFRONT_ID \
    --query 'DistributionConfig.CustomErrorResponses'
```

### Slow Load Times

**Cause**: Assets not being cached properly

**Check cache headers**:
```bash
curl -I https://your-cloudfront-domain.cloudfront.net/assets/index-abc123.js
```

Look for: `cache-control: public, max-age=31536000, immutable`

## 🎯 Optimization Tips

### 1. Enable Compression

Already enabled in Terraform:
- Gzip compression for text files
- Reduces transfer size by ~60-80%

### 2. Optimize Cache Hit Rate

- Static assets (JS, CSS, images): 1 year cache
- HTML files: No cache (always fresh)
- Use content hashing in filenames (Vite does this automatically)

### 3. Monitor Build Size

```bash
# Analyze bundle size
cd frontend
npm run build

# Check for large dependencies
du -sh dist/assets/* | sort -h

# Consider code splitting if bundles are >500KB
```

### 4. Use Image Optimization

- Compress images before committing
- Use WebP format for modern browsers
- Lazy load images below the fold

## 💰 Cost Breakdown (Phase 3)

| Resource | Configuration | Monthly Cost |
|----------|---------------|--------------|
| S3 Storage | ~2GB | ~$0.05 |
| S3 Requests | ~100K requests | ~$0.05 |
| CloudFront | PriceClass_100 | ~$1-5 (varies with traffic) |
| Data Transfer | First 10TB: $0.085/GB | ~$2-10 |
| CloudFront Requests | $0.01/10K | ~$0.10 |
| **Total** | | **~$3-15/month** |

**Combined Cost (All Phases): ~$490-520/month**

### Cost Optimization

- Use PriceClass_100 (US, Canada, Europe only) instead of PriceClass_All
- Enable compression to reduce data transfer
- Optimize image sizes
- Set long cache TTLs for static assets

## 🎯 Next Steps (Phase 4)

After Phase 3 is complete and verified:

1. **End-to-End Testing** - Complete user flow testing
2. **Performance Optimization** - Lighthouse audit and optimization
3. **Custom Domain** (optional) - Route53 + ACM SSL certificate
4. **CI/CD Pipeline** (optional) - Automate build and deployment
5. **Monitoring Dashboard** - Unified CloudWatch dashboard

## 🔒 Security Features

- ✅ HTTPS enforced via CloudFront
- ✅ S3 bucket not publicly accessible (OAI only)
- ✅ Versioning enabled for rollback capability
- ✅ Server-side encryption at rest (AES-256)
- ✅ CloudFront automatically protects against DDoS (AWS Shield Standard)

## 📈 Performance Features

- ✅ Global CDN with 400+ edge locations
- ✅ HTTP/2 and HTTP/3 support
- ✅ Gzip/Brotli compression
- ✅ Long cache TTLs for static assets
- ✅ Edge caching reduces origin load
- ✅ Optimized cache policies per file type

---

**Phase 3 Complete!** 🎉

Your frontend is now deployed with:
- ✅ Global CDN for fast delivery worldwide
- ✅ HTTPS by default
- ✅ Automatic scaling (infinite capacity)
- ✅ Zero server maintenance
- ✅ Cost-effective hosting (~$3-15/month)

Frontend URL: Get with `cd infra && terraform output cloudfront_url`
