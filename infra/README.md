# Financial Coach - AWS Infrastructure (Phase 1)

This directory contains Terraform infrastructure-as-code for deploying the Financial Coach application to AWS.

## 📋 Deployment Phases

### Phase 1: Infrastructure Foundation ✅
- VPC with public/private subnets across 2 availability zones
- Internet Gateway and NAT Gateway
- Security groups for ALB, Backend, Ollama, and RDS
- Multi-AZ RDS PostgreSQL 15 instance
- EC2 GPU instance (g4dn.xlarge) for Ollama with llama3.2 model
- AWS Secrets Manager for database credentials
- CloudWatch monitoring and alarms
- IAM roles and policies

### Phase 2: Backend Deployment (ECS Fargate) ✅
- ECR repository for Docker images
- Application Load Balancer with health checks
- ECS Fargate cluster and task definition
- ECS service with auto-scaling (2-4 tasks)
- Docker containerized FastAPI backend
- Database migration scripts
- CloudWatch logs and monitoring

📖 **See [PHASE2_DEPLOYMENT.md](PHASE2_DEPLOYMENT.md) for detailed Phase 2 instructions**

### Phase 3: Frontend Deployment (Coming Next) ✅
- S3 bucket for static hosting
- CloudFront CDN distribution
- React/Ionic SPA deployment
- Optimized caching and compression

📖 **See [PHASE3_DEPLOYMENT.md](PHASE3_DEPLOYMENT.md) for detailed Phase 3 instructions**

### Phase 4: Configuration & Testing (Final)
- End-to-end verification
- Performance optimization
- Monitoring dashboard setup

## 🚀 Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.0 installed ([Download](https://www.terraform.io/downloads))
3. **AWS CLI** configured with credentials
   ```bash
   aws configure
   ```
4. **(Optional)** EC2 key pair for SSH access to Ollama instance

## 📁 File Structure

```
infra/
├── main.tf                 # Provider and backend configuration
├── variables.tf            # Input variables
├── outputs.tf             # Output values
├── vpc.tf                 # VPC and networking
├── security_groups.tf     # Security groups
├── rds.tf                 # RDS PostgreSQL database
├── ec2_ollama.tf          # EC2 instance for Ollama
├── terraform.tfvars.example  # Example variables file
└── README.md              # This file
```

## ⚙️ Setup Instructions

### 1. Configure Variables

Copy the example variables file and customize it:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `db_password`: Generate a strong password
  ```bash
  openssl rand -base64 32
  ```
- `ssh_key_name`: Your EC2 key pair name (optional, for SSH access)
- `allowed_ssh_cidr`: Your IP address for SSH access (optional)
- Other variables as needed

**Important:** `terraform.tfvars` contains sensitive information and is gitignored. Never commit it!

### 2. Initialize Terraform

```bash
terraform init
```

This downloads required providers and initializes the backend.

### 3. Review the Plan

```bash
terraform plan
```

Review the resources that will be created. Expected resources: ~40-50 resources.

### 4. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted. This will take approximately 15-20 minutes (RDS Multi-AZ takes the longest).

### 5. Retrieve Outputs

After successful apply, get important connection details:

```bash
# View all outputs
terraform output

# Get specific values
terraform output database_url
terraform output ollama_base_url
terraform output ollama_private_ip
```

## 📊 Cost Estimation

**Monthly costs (approximate):**

| Resource | Type | Monthly Cost |
|----------|------|--------------|
| **Phase 1** | | |
| RDS PostgreSQL | db.t3.micro Multi-AZ | ~$30 |
| EC2 Ollama | g4dn.xlarge | ~$360 |
| NAT Gateway | Single AZ | ~$32 |
| **Phase 2** | | |
| ECS Fargate | 2 tasks (0.5 vCPU, 1GB) | ~$30 |
| Application Load Balancer | Standard | ~$16 |
| **Phase 3** | | |
| S3 Storage | ~2GB | ~$0.05 |
| CloudFront | PriceClass_100 | ~$3-10 |
| CloudWatch Logs | 10 GB | ~$5 |
| Data Transfer | Varies | ~$5-10 |
| **Total** | | **~$490-520/month** |

**Cost Optimization Tips:**
- Stop Ollama instance during non-business hours (save ~50%)
- Use Spot Instances for Ollama (save up to 70%)
- Downgrade RDS to db.t3.micro Single-AZ for dev/test (save ~50%)

## 🔐 Security Features

- ✅ All resources in private subnets (except ALB)
- ✅ Security groups with least-privilege access
- ✅ Database credentials in AWS Secrets Manager
- ✅ RDS storage encryption enabled
- ✅ Multi-AZ for high availability
- ✅ IAM roles with minimal permissions
- ✅ IMDSv2 enforced on EC2
- ✅ CloudWatch monitoring and alarms

## 📝 Important Notes

### Database
- **Multi-AZ enabled** for automatic failover
- **Deletion protection enabled** - must disable before destroying
- **Automated backups** retained for 7 days
- **Final snapshot** created automatically on deletion

### Ollama Instance
- Deploys in **private subnet** - no direct internet access
- Accessible only from backend ECS tasks
- **User data script** automatically:
  - Installs Ollama
  - Pulls llama3.2 model (~2GB download)
  - Sets up systemd service
  - Configures CloudWatch agent
- First boot takes ~10-15 minutes for setup

### SSH Access
- By default, **SSH is disabled**
- To enable: Set `ssh_key_name` and `allowed_ssh_cidr` in terraform.tfvars
- Use AWS Systems Manager Session Manager as alternative (no SSH key needed)

## 🔍 Verification

### Check Ollama Instance Status

Using AWS Systems Manager Session Manager (no SSH key needed):

```bash
# Start session
aws ssm start-session --target <instance-id>

# Check Ollama service
systemctl status ollama

# Test Ollama API
curl http://localhost:11434/api/tags

# Check setup completion
cat /var/lib/cloud/instance/ollama-setup-complete
```

### Test Database Connection

From a bastion host or ECS task:

```bash
psql "$(terraform output -raw database_url)"
```

## 🔄 Updating Infrastructure

To update the infrastructure:

```bash
# See what will change
terraform plan

# Apply changes
terraform apply
```

## 🗑️ Destroying Infrastructure

**Warning:** This will delete all resources including the database!

```bash
# First, disable deletion protection on RDS (if enabled)
# Edit rds.tf and set deletion_protection = false, then apply

# Destroy all resources
terraform destroy
```
Deployment Steps

### Phase 1 - Infrastructure Foundation
See instructions above in this README.

### Phase 2 - Backend Deployment
See [PHASE2_DEPLOYMENT.md](PHASE2_DEPLOYMENT.md) for:
1. Building and pushing Docker images to ECR
2. Deploying backend to ECS Fargate
3. Running database migrations
See [PHASE3_DEPLOYMENT.md](PHASE3_DEPLOYMENT.md) for:
1. Deploying S3 bucket and CloudFront distribution
2. Building React/Ionic frontend for production
3. Uploading to S3 and invalidating CloudFront cache
4. Updating backend CORS settings
5. End-to-end testing

### Phase 4 - Final Configuration (Next)
1. Complete end-to-end verification
2. Performance testing and optimization
3. Setup monitoring dashboard
4. Optional: Custom domain and SSLfrontend
2. Deploy to S3 + CloudFront
3. Update CORS settings
4. End-to-end testing
2. Create Application Load Balancer
3. Run database migrations
4. Configure backend environment variables

## 🐛 Troubleshooting

### Terraform State Lock

If Terraform is interrupted, you may need to unlock the state:
```bash
# If using S3 backend with DynamoDB locking
terraform force-unlock <lock-id>
```

### RDS Creation Timeout

RDS Multi-AZ can take 15-20 minutes. If it times out:
- Check AWS Console to see if RDS is still creating
- Wait for completion and run `terraform apply` again

### Ollama Not Responding

SSH/SSM into the instance and check:
```bash
# Check user data execution
tail -f /var/log/cloud-init-output.log

# Check Ollama service
systemctl status ollama
journalctl -u ollama -f

# Check if model is downloaded
ollama list
```

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [RDS PostgreSQL Documentation](https://docs.aws.amazon.com/rds/postgresql/)
- [Ollama Documentation](https://github.com/ollama/ollama)

## 🤝 Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review AWS Console for resource status
3. Check Terraform state: `terraform show`
4. Review this README and inline code comments

---

**Last Updated:** May 28, 2026  
**Terraform Version:** >= 1.0  
**AWS Provider Version:** ~> 5.0
