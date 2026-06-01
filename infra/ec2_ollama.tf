# Data source to get latest Deep Learning AMI
data "aws_ami" "deep_learning_ubuntu" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 20.04)*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# IAM Role for Ollama EC2 Instance
resource "aws_iam_role" "ollama_instance" {
  name_prefix = "${var.project_name}-ollama-role-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ollama-instance-role"
  }
}

# Attach SSM policy for Session Manager access
resource "aws_iam_role_policy_attachment" "ollama_ssm" {
  role       = aws_iam_role.ollama_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Attach CloudWatch policy for logs and metrics
resource "aws_iam_role_policy_attachment" "ollama_cloudwatch" {
  role       = aws_iam_role.ollama_instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance Profile
resource "aws_iam_instance_profile" "ollama" {
  name_prefix = "${var.project_name}-ollama-profile-"
  role        = aws_iam_role.ollama_instance.name

  tags = {
    Name = "${var.project_name}-ollama-instance-profile"
  }
}

# User data script to setup Ollama
locals {
  ollama_user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    apt-get update
    apt-get upgrade -y
    
    # Install Docker (if not already installed)
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        usermod -aG docker ubuntu
    fi
    
    # Install Ollama
    curl -fsSL https://ollama.com/install.sh | sh
    
    # Configure Ollama to listen on all interfaces
    mkdir -p /etc/systemd/system/ollama.service.d
    cat > /etc/systemd/system/ollama.service.d/override.conf <<EOL
    [Service]
    Environment="OLLAMA_HOST=0.0.0.0:11434"
    EOL
    
    # Reload systemd and restart Ollama
    systemctl daemon-reload
    systemctl enable ollama
    systemctl restart ollama
    
    # Wait for Ollama to start
    sleep 10
    
    # Pull the llama3.2 model
    ollama pull llama3.2
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
    dpkg -i -E ./amazon-cloudwatch-agent.deb
    
    # Configure CloudWatch agent for Ollama logs
    cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOL
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/ollama.log",
                "log_group_name": "/aws/ec2/ollama",
                "log_stream_name": "{instance_id}"
              }
            ]
          }
        }
      },
      "metrics": {
        "namespace": "FinancialCoach/Ollama",
        "metrics_collected": {
          "disk": {
            "measurement": [
              {"name": "used_percent", "rename": "DiskUsedPercent"}
            ],
            "metrics_collection_interval": 60
          },
          "mem": {
            "measurement": [
              {"name": "mem_used_percent", "rename": "MemoryUsedPercent"}
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
    EOL
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
        -a fetch-config \
        -m ec2 \
        -s \
        -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
    
    # Create a health check endpoint
    cat > /usr/local/bin/ollama-health-check.sh <<EOL
    #!/bin/bash
    curl -s http://localhost:11434/api/tags > /dev/null
    EOL
    chmod +x /usr/local/bin/ollama-health-check.sh
    
    # Setup completion marker
    touch /var/lib/cloud/instance/ollama-setup-complete
    
    echo "Ollama setup completed successfully"
  EOF
}

# EC2 Instance for Ollama
resource "aws_instance" "ollama" {
  ami           = var.ollama_ami_id != "" ? var.ollama_ami_id : data.aws_ami.deep_learning_ubuntu.id
  instance_type = var.ollama_instance_type
  key_name      = var.ssh_key_name != "" ? var.ssh_key_name : null

  # Network
  subnet_id                   = aws_subnet.private[0].id
  vpc_security_group_ids      = [aws_security_group.ollama.id]
  associate_public_ip_address = false

  # IAM
  iam_instance_profile = aws_iam_instance_profile.ollama.name

  # Storage
  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.ollama_volume_size
    encrypted             = true
    delete_on_termination = true
  }

  # User data
  user_data = local.ollama_user_data

  # Metadata options (IMDSv2)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Monitoring
  monitoring = true

  tags = {
    Name = "${var.project_name}-ollama"
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

# CloudWatch Log Group for Ollama
resource "aws_cloudwatch_log_group" "ollama" {
  name              = "/aws/ec2/ollama"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-ollama-logs"
  }
}

# CloudWatch Alarms for Ollama EC2
resource "aws_cloudwatch_metric_alarm" "ollama_status_check" {
  alarm_name          = "${var.project_name}-ollama-status-check"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors Ollama instance status checks"
  alarm_actions       = [] # Add SNS topic ARN here for notifications

  dimensions = {
    InstanceId = aws_instance.ollama.id
  }

  tags = {
    Name = "${var.project_name}-ollama-status-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "ollama_cpu" {
  alarm_name          = "${var.project_name}-ollama-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "This metric monitors Ollama instance CPU utilization"
  alarm_actions       = [] # Add SNS topic ARN here for notifications

  dimensions = {
    InstanceId = aws_instance.ollama.id
  }

  tags = {
    Name = "${var.project_name}-ollama-cpu-alarm"
  }
}
