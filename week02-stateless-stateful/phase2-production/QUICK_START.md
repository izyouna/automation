# Phase 2 Production - Quick Start Guide

## 🚀 Quick Deployment

### Prerequisites
- Docker and Docker Compose installed
- Ports 8000, 5432, 6379, 80, 443 available
- Git bash or similar terminal (for Windows users)

### Step 1: Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Review and update .env file if needed
# Default settings work for local development
```

### Step 2: Deploy Services
```bash
# Make deployment script executable (Linux/Mac)
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### Step 3: Test Deployment
```bash
# Make test script executable (Linux/Mac)
chmod +x scripts/test-deployment.sh

# Run tests
./scripts/test-deployment.sh
```

### Step 4: Access API
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/shared/health
- **Application Info**: http://localhost:8000/api/v1/shared/info

## 🧪 API Testing Examples

### Stateless API
```bash
# Health check
curl http://localhost:8000/api/v1/stateless/health

# Calculation
curl -X POST http://localhost:8000/api/v1/stateless/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "add", "operand1": 5, "operand2": 3}'

# Random data
curl "http://localhost:8000/api/v1/stateless/random?type=number&count=3"

# Get products
curl "http://localhost:8000/api/v1/stateless/products?limit=5"
```

### Stateful API
```bash
# Create session
curl -X POST "http://localhost:8000/api/v1/stateful/sessions?user_id=1"

# Add to cart (replace SESSION_ID)
curl -X POST "http://localhost:8000/api/v1/stateful/cart/SESSION_ID?product_id=1&quantity=2"

# Get cart (replace SESSION_ID)
curl "http://localhost:8000/api/v1/stateful/cart/SESSION_ID"
```

## 🔧 Management Commands

### Docker Compose
```bash
# View service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Scale API (load balancing)
docker-compose up -d --scale phase2-api=2
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d phase2_production

# Connect to Redis
docker-compose exec redis redis-cli
```

## 📊 Monitoring

### Health Checks
```bash
# Overall health
curl http://localhost:8000/api/v1/shared/health

# Metrics
curl http://localhost:8000/api/v1/shared/metrics
```

### Service Logs
```bash
# API logs
docker-compose logs -f phase2-api

# Database logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis
```

## 🔄 Data Migration (Phase 1 → Phase 2)

If you have Phase 1 data to migrate:

```bash
# Run migration utility
python scripts/migrate-data.py

# Verify migration
curl "http://localhost:8000/api/v1/stateless/users?limit=10"
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8000, 5432, 6379 are available
2. **Docker not running**: Start Docker Desktop/daemon
3. **Permission denied**: Use `chmod +x scripts/*.sh` on Linux/Mac
4. **API not responding**: Check logs with `docker-compose logs phase2-api`

### Reset Everything
```bash
# Stop and remove all containers
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild and start
./scripts/deploy.sh
```

## 📚 Documentation

- **API Reference**: http://localhost:8000/docs
- **Architecture**: docs/architecture/README.md
- **Deployment Guide**: docs/deployment/README.md
- **Migration Guide**: docs/migration-guide.md

## 🎯 Next Steps

1. **Explore API**: Visit http://localhost:8000/docs
2. **Run Tests**: Execute `./scripts/test-deployment.sh`
3. **Review Code**: Examine the implementation in `app/`
4. **Customize**: Modify `.env` for your environment
5. **Scale Up**: Use `docker-compose up -d --scale phase2-api=2`

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify service status: `docker-compose ps`
3. Run health checks: `curl http://localhost:8000/api/v1/shared/health`
4. Review the troubleshooting section above

**Phase 2 Production is now ready! 🎉**
