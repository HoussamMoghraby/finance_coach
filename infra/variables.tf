# General Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "financial-coach"
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# RDS Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "financial_coach"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# EC2 Ollama Variables
variable "ollama_instance_type" {
  description = "EC2 instance type for Ollama (GPU instance)"
  type        = string
  default     = "g4dn.xlarge"
}

variable "ollama_ami_id" {
  description = "AMI ID for Ollama EC2 instance (Deep Learning AMI Ubuntu)"
  type        = string
  default     = "" # Will use data source to find latest
}

variable "ollama_volume_size" {
  description = "EBS volume size for Ollama instance in GB"
  type        = number
  default     = 100
}

variable "ssh_key_name" {
  description = "SSH key pair name for EC2 instances"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed to SSH to Ollama instance (for maintenance)"
  type        = list(string)
  default     = [] # Empty = no SSH access
}

# ECS Variables
variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = string
  default     = "512"
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = string
  default     = "1024"
}

variable "ecs_service_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_autoscaling_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_autoscaling_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 4
}

# Application Variables
variable "app_secret_key" {
  description = "Secret key for JWT token generation"
  type        = string
  sensitive   = true
}

variable "backend_cors_origins" {
  description = "List of allowed CORS origins for the backend API"
  type        = list(string)
  default     = ["http://localhost:5173", "http://localhost:3000"]
}

# CloudFront Variables
variable "cloudfront_price_class" {
  description = "CloudFront price class (PriceClass_All, PriceClass_200, PriceClass_100)"
  type        = string
  default     = "PriceClass_100"  # US, Canada, Europe (cheapest)
}
