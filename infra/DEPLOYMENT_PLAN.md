# Deployment Plan: Financial Coach to AWS Cloud

Deploy the AI Personal Finance Coach application to AWS with cost-optimized production setup supporting <1000 users. Architecture: S3+CloudFront (frontend), ECS Fargate (backend API), Multi-AZ RDS PostgreSQL (database), EC2 GPU instance (Ollama AI model).

## Deployment Phases

### Phase 1: Infrastructure Foundation ✅ COMPLETE
1. Create VPC with public/private subnets across 2 AZs (10.0.0.0/16)
   - Public subnets: 10.0.1.0/24, 10.0.2.0/24 (for ALB, NAT Gateway)
   - Private subnets: 10.0.10.0/24, 10.0.11.0/24 (for ECS, RDS, Ollama)
   - Internet Gateway + NAT Gateway in 1 AZ (cost optimization)
2. Create security groups:
   - `alb-sg`: Allows 443 (HTTPS), 80 (HTTP) from 0.0.0.0/0
   - `backend-sg`: Allows 8000 from `alb-sg`
   - `ollama-sg`: Allows 11434 from `backend-sg` only
   - `rds-sg`: Allows 5432 from `backend-sg`
3. Create RDS Multi-AZ PostgreSQL 15 instance
   - Instance class: db.t3.micro or db.t3.small
   - Storage: 20GB GP3 with autoscaling enabled
   - Database name: `financial_coach`
   - Credentials: Store in AWS Secrets Manager
   - Backup retention: 7 days
   - Enable automated backups and monitoring
4. Create EC2 GPU instance for Ollama (*parallel with step 3*)
   - Instance type: g4dn.xlarge (1 NVIDIA T4 GPU, ~$0.50/hr)
   - AMI: Deep Learning AMI (Ubuntu)
   - Private subnet placement
   - Install Ollama, pull llama3.2 model
   - Create systemd service for auto-start
   - Configure health check endpoint

**Files**: [vpc.tf](vpc.tf), [security_groups.tf](security_groups.tf), [rds.tf](rds.tf), [ec2_ollama.tf](ec2_ollama.tf)

### Phase 2: Backend Deployment (ECS Fargate) ✅ COMPLETE
5. Create ECR repository `financial-coach-backend`
6. Build and push backend Docker image:
   - Create Dockerfile in [backend/](../backend/) directory
   - Multi-stage build: Python 3.12 slim base
   - Install dependencies from [requirements.txt](../backend/requirements.txt)
   - Copy app code, expose port 8000
   - CMD: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
7. Create ECS cluster `financial-coach-cluster`
8. Create task definition `backend-task`:
   - Fargate launch type, 0.5 vCPU, 1GB memory
   - Environment variables from Secrets Manager (DATABASE_URL, SECRET_KEY, OLLAMA_BASE_URL)
   - CloudWatch logs enabled
   - Health check: `/health` endpoint
9. Create Application Load Balancer (ALB):
   - Public subnets, `alb-sg` security group
   - Target group: ECS tasks on port 8000, health check `/health`
   - Listener: HTTP 80 (HTTPS 443 optional later)
10. Create ECS Service `backend-service`:
    - Desired count: 2 (for HA across AZs)
    - Load balancer: ALB target group
    - Auto-scaling: CPU 70% threshold, min 2, max 4
11. Run database migrations:
    - Execute `alembic upgrade head` via ECS task or bastion host
    - Run seed script [app/db/seed.py](../backend/app/db/seed.py) for initial categories

**Files**: [ecr.tf](ecr.tf), [alb.tf](alb.tf), [ecs.tf](ecs.tf)  
**Documentation**: [PHASE2_DEPLOYMENT.md](PHASE2_DEPLOYMENT.md)

### Phase 3: Frontend Deployment (S3 + CloudFront) ✅ COMPLETE
12. Create S3 bucket `financial-coach-frontend`
    - Block public access, enable versioning
    - Bucket policy: Allow CloudFront OAI only
13. Build frontend with production API URL:
    - Set `VITE_API_URL=<ALB-DNS>` in `.env.production`
    - Run `npm run build` in [frontend/](../frontend/) directory
    - Output: [frontend/dist/](../frontend/dist/)
14. Create CloudFront distribution:
    - Origin: S3 bucket with OAI (Origin Access Identity)
    - Default root object: index.html
    - Error pages: 404 → /index.html (for SPA routing)
    - Cache policy: CachingOptimized
    - Compress objects enabled
15. Upload frontend build to S3:
    - Sync [frontend/dist/](../frontend/dist/) to S3 bucket
    - Invalidate CloudFront cache

**Files**: [s3.tf](s3.tf), [cloudfront.tf](cloudfront.tf)  
**Documentation**: [PHASE3_DEPLOYMENT.md](PHASE3_DEPLOYMENT.md)

### Phase 4: Configuration & Testing (TODO)
16. Update backend CORS settings:
    - Add CloudFront domain to `BACKEND_CORS_ORIGINS` in task definition
    - Redeploy ECS service
17. Verify end-to-end functionality:
    - Health checks: Backend `/ready` endpoint (checks DB + Ollama)
    - Authentication: Register/login user
    - API calls: Create account, transaction
    - AI functionality: Query AI coach, verify Ollama integration
18. Configure monitoring and alarms:
    - CloudWatch dashboard: ECS CPU/memory, RDS connections, ALB response times
    - Alarms: ECS service unhealthy, RDS CPU >80%, Ollama EC2 status checks
    - SNS topic for alarm notifications

## Relevant Application Files

- [frontend/vite.config.ts](../frontend/vite.config.ts) — Vite build configuration, outputs to dist/
- [frontend/package.json](../frontend/package.json) — Build script: `npm run build`
- [backend/app/main.py](../backend/app/main.py) — FastAPI app, CORS configuration, health endpoints
- [backend/app/core/config.py](../backend/app/core/config.py) — Environment variables: DATABASE_URL, SECRET_KEY, OLLAMA_BASE_URL, BACKEND_CORS_ORIGINS
- [backend/requirements.txt](../backend/requirements.txt) — Python dependencies for Docker image
- [backend/app/db/session.py](../backend/app/db/session.py) — Database connection with SQLAlchemy
- [backend/alembic/env.py](../backend/alembic/env.py) — Alembic configuration for migrations
- [backend/app/db/seed.py](../backend/app/db/seed.py) — Initial data seeding (categories, demo user)
- [backend/app/ai/ollama.py](../backend/app/ai/ollama.py) — Ollama integration, health check endpoint

## Verification Checklist

1. **Infrastructure**: Verify VPC, subnets, security groups, NAT gateway in AWS Console
2. **Database**: Connect to RDS from bastion/ECS task using psql, verify migrations: `SELECT * FROM alembic_version;`
3. **Ollama**: SSH to EC2 instance, test: `curl http://localhost:11434/api/tags` (should return llama3.2)
4. **Backend Health**: `curl http://<ALB-DNS>/ready` (should return 200 with DB and AI service status)
5. **Frontend**: Visit CloudFront URL, verify static assets load, check browser console for API errors
6. **End-to-End**: Complete user flow: register → create account → add transaction → query AI coach
7. **Load Testing**: Use Apache Bench or Locust to verify auto-scaling triggers at expected thresholds
8. **Monitoring**: Check CloudWatch metrics and logs for all services

## Architecture Decisions

- **Scale**: Small production setup optimized for <1000 users with basic HA
- **Cost Trade-offs**: 
  - Single NAT Gateway (not HA) to reduce costs (~$32/month savings)
  - Ollama on single EC2 instance (no auto-scaling) with manual recovery
  - ECS Fargate min 2 tasks for HA, auto-scale to 4 max
- **Network Isolation**: Ollama and RDS in private subnets, only accessible from backend
- **No Custom Domain**: Using default ALB/CloudFront URLs; can add Route53 + ACM SSL later
- **Database**: Multi-AZ RDS for automatic failover, 7-day backup retention
- **Security**: All secrets in AWS Secrets Manager, minimal IAM permissions, security groups enforce least privilege
- **Monitoring**: CloudWatch for metrics/logs, SNS for alerts (requires email subscription setup)

## Cost Breakdown

| Phase | Resource | Configuration | Monthly Cost |
|-------|----------|---------------|--------------|
| **Phase 1** | | | |
| | RDS PostgreSQL | db.t3.micro Multi-AZ | ~$30 |
| | EC2 Ollama | g4dn.xlarge | ~$360 |
| | NAT Gateway | Single AZ | ~$32 |
| **Phase 2** | | | |
| | ECS Fargate | 2 tasks (0.5 vCPU, 1GB) | ~$30 |
| | Application Load Balancer | Standard | ~$16 |
| **Phase 3** | | | |
| | S3 Storage | ~2GB | ~$0.05 |
| | CloudFront | PriceClass_100 | ~$3-10 |
| | CloudWatch Logs | 10 GB | ~$5 |
| | Data Transfer | Varies | ~$5-10 |
| **Total** | | | **~$490-520/month** |

## Excluded from Scope

- Custom domain and SSL certificates (can be added later with Route53 + ACM)
- CI/CD pipeline (manual deployment for now)
- WAF/DDoS protection (can add AWS WAF to ALB later)
- Advanced monitoring (X-Ray tracing, detailed APM)
- Database read replicas (not needed for <1000 users)
- Multi-region deployment
- Backup/disaster recovery procedures (uses RDS automated backups only)

## Future Considerations

### 1. Ollama High Availability
Current plan uses single EC2 instance. Consider:
- **(A)** Auto-recovery with CloudWatch alarms + Lambda
- **(B)** ECS + GPU AMI for auto-scaling
- **(C)** Replace with managed API (OpenAI/Anthropic) for simplified operations

### 2. Cost Optimization
GPU instance is most expensive component (~$360/month continuous). Options:
- **(A)** Stop instance during low-usage hours with scheduler
- **(B)** Use Spot Instances (up to 70% savings)
- **(C)** Migrate to smaller model on CPU-only instance if performance acceptable

### 3. CI/CD Pipeline
Manual deployment is error-prone. Recommend adding:
- **(A)** GitHub Actions for automated builds
- **(B)** ECR image scanning
- **(C)** ECS rolling updates on git push to main

---

**Last Updated**: May 28, 2026  
**Status**: Phases 1-3 Complete, Phase 4 Pending
