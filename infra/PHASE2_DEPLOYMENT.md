# Phase 2: Backend Deployment - ECS Fargate

This guide covers Phase 2 of the AWS deployment: deploying the FastAPI backend to ECS Fargate with Application Load Balancer.

## 📋 Prerequisites

- ✅ Phase 1 completed (VPC, RDS, Ollama EC2 deployed)
- ✅ Docker installed locally
- ✅ AWS CLI configured
- ✅ Backend application ready in `/backend` directory

## 🏗️ Phase 2 Components

This phase deploys:
- ✅ ECR repository for Docker images
- ✅ Application Load Balancer (ALB) with health checks
- ✅ ECS Fargate cluster and task definition
- ✅ ECS service with 2 tasks (HA) and auto-scaling (2-4 tasks)
- ✅ CloudWatch logs and alarms
- ✅ IAM roles and Secrets Manager integration

## ⚙️ Configuration

### 1. Update Terraform Variables

Edit `infra/terraform.tfvars` and add Phase 2 variables:

```bash
# Generate a strong secret key
openssl rand -base64 32

# Add to terraform.tfvars
app_secret_key = "YOUR_GENERATED_SECRET_KEY"
backend_cors_origins = ["http://localhost:5173"]  # Update after frontend deployment
```

### 2. Apply Phase 2 Infrastructure

```bash
cd infra

# Review Phase 2 resources
terraform plan

# Apply (this will create ECR, ALB, ECS)
terraform apply
```

Expected resources: ~25-30 new resources
Time: ~5-10 minutes

### 3. Get Infrastructure Outputs

```bash
# Get ECR repository URL
terraform output ecr_repository_url

# Get ALB DNS name
terraform output alb_dns_name

# Get all outputs
terraform output
```

Save these outputs - you'll need them for deployment!

## 🐳 Docker Image Build & Push

### Option 1: Using the Build Script (Recommended)

```bash
cd ../backend

# Build and push Docker image to ECR
./build-and-push.sh
```

This script will:
1. Get ECR repository URL from Terraform
2. Authenticate with ECR
3. Build the Docker image
4. Tag with `latest` and git commit SHA
5. Push to ECR

### Option 2: Manual Build

```bash
cd backend

# Get ECR repository URL
ECR_REPO=$(cd ../infra && terraform output -raw ecr_repository_url)
AWS_REGION=$(echo $ECR_REPO | cut -d'.' -f4)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Build image
docker build -t financial-coach-backend:latest .

# Tag image
docker tag financial-coach-backend:latest $ECR_REPO:latest

# Push image
docker push $ECR_REPO:latest
```

## 🚀 Deploy to ECS

### Initial Deployment

The ECS service will automatically deploy when you apply Terraform. However, if the image wasn't in ECR yet, you may need to update the service:

```bash
cd infra

# Force new deployment with the Docker image
terraform apply -target=aws_ecs_service.backend

# Or use AWS CLI
aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service $(terraform output -raw ecs_service_name) \
  --force-new-deployment \
  --region us-east-1
```

### Monitor Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --services $(terraform output -raw ecs_service_name) \
  --region us-east-1

# List running tasks
aws ecs list-tasks \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --region us-east-1

# View logs in CloudWatch
aws logs tail /ecs/financial-coach-backend --follow --region us-east-1
```

## 🗄️ Database Migrations

### Option 1: Using the Migration Script (Recommended)

```bash
cd backend

# Run migrations and seed data
./run-migrations.sh
```

This script will:
1. Retrieve database credentials from Secrets Manager
2. Show current migration status
3. Prompt to upgrade to latest migration
4. Optionally run seed script for initial categories

### Option 2: Using ECS Task

Run migrations as a one-off ECS task:

```bash
cd backend

# Run migration command in ECS
./run-ecs-task.sh "alembic upgrade head"

# Run seed script
./run-ecs-task.sh "python -c 'from app.db.session import SessionLocal; from app.db.seed import seed_categories; db = SessionLocal(); seed_categories(db); db.close()'"
```

### Option 3: Direct Database Connection

If you have a bastion host or VPN to the private subnet:

```bash
# Get database URL
cd infra
export DATABASE_URL=$(terraform output -raw database_url)

# Run migrations
cd ../backend
alembic upgrade head

# Run seed script
python3 -c "from app.db.session import SessionLocal; from app.db.seed import seed_categories; db = SessionLocal(); seed_categories(db); db.close()"
```

## ✅ Verification

### 1. Check ALB Health

```bash
ALB_DNS=$(cd infra && terraform output -raw alb_dns_name)

# Test health endpoint
curl http://$ALB_DNS/health

# Expected response:
# {"status":"healthy"}

# Test readiness endpoint (checks DB + Ollama)
curl http://$ALB_DNS/ready

# Expected response:
# {"status":"ready","database":"connected","ai_service":"connected"}
```

### 2. Check ECS Tasks

```bash
# Get cluster and service info
cd infra
aws ecs describe-services \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --services $(terraform output -raw ecs_service_name) \
  --query 'services[0].{DesiredCount:desiredCount,RunningCount:runningCount,Status:status}' \
  --region us-east-1
```

Expected: DesiredCount = 2, RunningCount = 2, Status = ACTIVE

### 3. Test API Endpoints

```bash
ALB_DNS=$(cd infra && terraform output -raw alb_dns_name)

# Get API documentation
curl http://$ALB_DNS/docs

# Test categories endpoint (no auth required)
curl http://$ALB_DNS/api/v1/categories

# Test auth endpoint
curl -X POST http://$ALB_DNS/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","full_name":"Test User"}'
```

### 4. Check CloudWatch Logs

```bash
# View recent logs
aws logs tail /ecs/financial-coach-backend --follow --region us-east-1

# Check for errors
aws logs filter-log-events \
  --log-group-name /ecs/financial-coach-backend \
  --filter-pattern "ERROR" \
  --region us-east-1
```

## 🔄 Updating the Application

### 1. Make Code Changes

Edit your backend code in `/backend`

### 2. Build and Push New Image

```bash
cd backend
./build-and-push.sh
```

### 3. Deploy Updated Image

```bash
cd infra

# Option A: Force new deployment (no downtime)
aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service $(terraform output -raw ecs_service_name) \
  --force-new-deployment \
  --region us-east-1

# Option B: Update task definition (if you changed task config)
terraform apply -target=aws_ecs_task_definition.backend
terraform apply -target=aws_ecs_service.backend
```

### 4. Monitor Rolling Deployment

```bash
aws ecs describe-services \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --services $(terraform output -raw ecs_service_name) \
  --query 'services[0].deployments' \
  --region us-east-1
```

ECS will:
1. Start 2 new tasks with the updated image
2. Wait for health checks to pass
3. Stop the old tasks
4. Zero-downtime deployment complete!

## 📊 Monitoring

### CloudWatch Metrics

- **ECS Service**: CPU, Memory, Task count
- **ALB**: Request count, Response time, 4xx/5xx errors
- **Target Group**: Healthy/Unhealthy hosts

Access in AWS Console → CloudWatch → Dashboards

### Alarms Configured

1. **ECS High CPU** (>85%)
2. **ECS High Memory** (>85%)
3. **ALB Unhealthy Hosts** (>0)
4. **ALB High Response Time** (>1s)

Configure SNS notifications by adding topic ARN to alarm actions.

## 🐛 Troubleshooting

### Tasks Keep Failing

```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster $(cd infra && terraform output -raw ecs_cluster_name) \
  --tasks <task-arn> \
  --region us-east-1

# Common issues:
# 1. Image not found in ECR → Run build-and-push.sh
# 2. Database connection failed → Check RDS security group allows backend SG
# 3. Ollama unreachable → Check EC2 instance is running
# 4. Secrets not found → Check Secrets Manager ARNs in task definition
```

### Health Checks Failing

```bash
# Connect to ECS task for debugging
aws ecs execute-command \
  --cluster $(cd infra && terraform output -raw ecs_cluster_name) \
  --task <task-arn> \
  --container backend \
  --interactive \
  --command "/bin/bash" \
  --region us-east-1

# Inside container, test manually:
curl http://localhost:8000/health
```

### Database Connection Issues

```bash
# Verify database is accessible from backend
# Get a task ARN
TASK_ARN=$(aws ecs list-tasks --cluster $(cd infra && terraform output -raw ecs_cluster_name) --query 'taskArns[0]' --output text --region us-east-1)

# Execute command to test DB
aws ecs execute-command \
  --cluster $(cd infra && terraform output -raw ecs_cluster_name) \
  --task $TASK_ARN \
  --container backend \
  --interactive \
  --command "python -c 'from app.db.session import SessionLocal; db = SessionLocal(); print(\"Connected!\"); db.close()'" \
  --region us-east-1
```

### Check Ollama Connectivity

```bash
# From ECS task or bastion
OLLAMA_IP=$(cd infra && terraform output -raw ollama_private_ip)
curl http://$OLLAMA_IP:11434/api/tags
```

## 📈 Auto-Scaling

ECS service is configured to auto-scale based on:
- **CPU**: Target 70% (scale out at 70%, scale in below 70%)
- **Memory**: Target 80%
- **Min tasks**: 2
- **Max tasks**: 4

Scaling cooldowns:
- Scale out: 60 seconds
- Scale in: 300 seconds (5 minutes)

## 💰 Cost Breakdown (Phase 2)

| Resource | Configuration | Monthly Cost |
|----------|---------------|--------------|
| ECS Fargate | 2 tasks (0.5 vCPU, 1GB each) | ~$30 |
| Application Load Balancer | Standard | ~$16 |
| CloudWatch Logs | 5GB | ~$2.50 |
| Data Transfer | Varies | ~$5 |
| **Total** | | **~$53-55/month** |

**Combined with Phase 1: ~$485-505/month**

## 🎯 Next Steps (Phase 3)

After Phase 2 is complete and verified:

1. **Deploy Frontend** (S3 + CloudFront)
2. **Update CORS** settings with CloudFront domain
3. **Add Custom Domain** (optional - Route53 + ACM)
4. **Setup CI/CD** (optional - GitHub Actions)

---

**Phase 2 Complete!** 🎉

Your backend API is now running on AWS with:
- ✅ High availability (2 AZs)
- ✅ Auto-scaling (2-4 tasks)
- ✅ Load balancing
- ✅ Zero-downtime deployments
- ✅ CloudWatch monitoring

API URL: `http://<your-alb-dns>/docs`
