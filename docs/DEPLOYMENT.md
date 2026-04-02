# Deployment Guide

This guide covers deploying the AI Personal Finance Coach application to production.

## Prerequisites

- Docker & Docker Compose (recommended)
- PostgreSQL 15+ (managed or self-hosted)
- Ollama server (GPU instance recommended)
- Domain name (optional, for HTTPS)
- SSL certificate (Let's Encrypt recommended)

## Environment Setup

### Production Environment Variables

Create production `.env` files:

**Backend `.env`:**
```bash
# Database - Use managed PostgreSQL in production
DATABASE_URL=postgresql://user:password@db-host:5432/financial_coach

# Security - MUST CHANGE
SECRET_KEY=<generate-strong-random-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS - Set to your frontend domain
BACKEND_CORS_ORIGINS=["https://your-domain.com"]

# Ollama
OLLAMA_BASE_URL=http://ollama-host:11434
OLLAMA_MODEL=llama3.2
OLLAMA_TIMEOUT_SECONDS=30

# Application
API_V1_PREFIX=/api/v1
ENVIRONMENT=production
DEBUG=False
```

**Frontend `.env`:**
```bash
VITE_API_URL=https://api.your-domain.com
```

### Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Docker Deployment (Recommended)

### 1. Create Docker Compose File

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: financial_coach
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/financial_coach
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    restart: unless-stopped

volumes:
  postgres_data:
```

### 2. Create Dockerfiles

**Backend Dockerfile:**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18 as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Deploy with Docker Compose

```bash
docker-compose up -d
```

## Manual Deployment

### Backend Deployment

```bash
cd backend

# Set up virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed categories
python -m app.db.seed

# Run with gunicorn (production WSGI server)
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment

```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Serve with nginx or any static file server
# The build output is in the `dist/` directory
```

## Cloud Platform Deployment

### AWS

**Backend (Elastic Beanstalk or ECS):**
- Deploy Docker container
- Use RDS for PostgreSQL
- Use EC2 with GPU for Ollama
- Use ALB for load balancing

**Frontend (S3 + CloudFront):**
```bash
aws s3 sync dist/ s3://your-bucket
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

### Google Cloud Platform

**Backend (Cloud Run):**
```bash
gcloud run deploy financial-coach-api \
  --image gcr.io/PROJECT_ID/backend \
  --platform managed \
  --region us-central1
```

**Frontend (Cloud Storage + CDN):**
```bash
gsutil -m rsync -r dist/ gs://your-bucket
```

### Heroku

**Backend:**
```bash
heroku create financial-coach-api
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

## Database Setup

### Initial Migration

```bash
alembic upgrade head
python -m app.db.seed
```

### Backup Strategy

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Automated Backups

Set up daily backups using cron or cloud provider tools.

## Ollama Setup

### Self-Hosted Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama3.2

# Run as service
sudo systemctl start ollama
sudo systemctl enable ollama
```

### GPU Instance

- Use AWS P3/G4 instances or similar
- Install CUDA drivers
- Allocate sufficient memory (16GB+ recommended)

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## SSL/HTTPS Setup

### Using Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring & Logging

### Application Logs

```bash
# View backend logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f db
```

### Health Checks

Set up monitoring for:
- `/health` - Application health
- `/ready` - Database connectivity
- `/insights/health` - AI service availability

### Recommended Tools

- **Uptime monitoring**: UptimeRobot, Better Uptime
- **Error tracking**: Sentry
- **Logging**: CloudWatch, Stackdriver, Papertrail
- **APM**: New Relic, DataDog

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Enable SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Set DEBUG=False in production
- [ ] Use environment variables for secrets
- [ ] Set up database backups
- [ ] Enable firewall rules
- [ ] Keep dependencies updated
- [ ] Implement rate limiting (future)
- [ ] Set up security headers

## Performance Optimization

### Backend

- Use connection pooling
- Enable gzip compression
- Cache frequently accessed data
- Use database indexes

### Frontend

- Enable gzip/brotli compression
- Use CDN for static assets
- Implement lazy loading
- Optimize images

### Database

- Create indexes on foreign keys
- Analyze and vacuum regularly
- Monitor slow queries
- Use read replicas if needed

## Scaling

### Horizontal Scaling

- Deploy multiple backend instances
- Use load balancer (ALB, NLB, GCP LB)
- Separate Ollama service

### Database Scaling

- Use managed PostgreSQL service
- Enable connection pooling
- Add read replicas
- Consider sharding (future)

## Rollback Procedure

```bash
# Rollback database migration
alembic downgrade -1

# Rollback Docker deployment
docker-compose down
git checkout previous-tag
docker-compose up -d
```

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review logs weekly
- Check backup integrity
- Monitor disk space
- Update SSL certificates (auto-renewed)

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Backend updates
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart backend

# Frontend updates
cd frontend
npm ci
npm run build
# Deploy new build
```

## Troubleshooting

### Backend Won't Start

- Check DATABASE_URL is correct
- Verify PostgreSQL is accessible
- Check logs for errors
- Ensure SECRET_KEY is set

### Frontend Can't Connect to Backend

- Check CORS settings
- Verify API URL in .env
- Check network connectivity
- Review nginx configuration

### AI Insights Not Working

- Verify Ollama is running
- Check OLLAMA_BASE_URL
- Test Ollama connection
- Review AI service logs

## Support

For deployment issues:
1. Check application logs
2. Review error messages
3. Consult documentation
4. Open GitHub issue
