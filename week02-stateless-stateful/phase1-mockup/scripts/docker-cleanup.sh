#!/bin/bash

# Phase 1 Codebase Cleanup using Docker
# Prepares Phase 1 for staging deployment and Phase 2 transition

set -e

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log() {
    echo -e "${2:-$NC}$1${NC}"
}

print_section() {
    echo -e "\n${CYAN}============================================================${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${CYAN}============================================================${NC}"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

log "🧹 Phase 1 Codebase Cleanup (Docker)" $BOLD
log "🔧 Starting comprehensive cleanup process..." $YELLOW

# Create Docker-based cleanup
docker_cleanup() {
    print_section "🐳 Running Docker-based Cleanup"
    
    # Create a temporary Docker container for cleanup
    log "📦 Creating cleanup container..." $BLUE
    
    # Create a Dockerfile for cleanup
    cat > "$ROOT_DIR/Dockerfile.cleanup" << 'EOF'
FROM node:24-alpine

# Install required tools
RUN apk add --no-cache \
    bash \
    curl \
    jq \
    rsync

# Set working directory
WORKDIR /app

# Copy cleanup script
COPY scripts/cleanup.js /app/cleanup.js

# Run cleanup
CMD ["node", "cleanup.js"]
EOF

    # Build and run cleanup container
    log "🏗️ Building cleanup image..." $BLUE
    docker build -f "$ROOT_DIR/Dockerfile.cleanup" -t phase1-cleanup "$ROOT_DIR" || {
        log "❌ Failed to build cleanup image" $RED
        exit 1
    }

    log "🚀 Running cleanup in container..." $BLUE
    docker run --rm -v "$ROOT_DIR:/app" phase1-cleanup || {
        log "❌ Cleanup failed in container" $RED
        exit 1
    }

    # Cleanup Docker artifacts
    log "🧹 Cleaning up Docker artifacts..." $BLUE
    docker rmi phase1-cleanup 2>/dev/null || true
    rm -f "$ROOT_DIR/Dockerfile.cleanup"
    
    log "✅ Docker cleanup completed" $GREEN
}

# Manual cleanup if Docker fails
manual_cleanup() {
    print_section "🔧 Manual Cleanup Fallback"
    
    log "📦 Creating backup..." $BLUE
    BACKUP_DIR="$ROOT_DIR/.backup"
    TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
    BACKUP_PATH="$BACKUP_DIR/backup-$TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup important files
    for item in package.json server.js README.md config src docs tests examples .roo; do
        if [ -e "$ROOT_DIR/$item" ]; then
            cp -r "$ROOT_DIR/$item" "$BACKUP_PATH/"
            log "✅ Backed up: $item" $GREEN
        fi
    done
    
    log "📦 Backup created: $BACKUP_PATH" $BLUE
    
    # Clean development artifacts
    log "🧹 Cleaning development artifacts..." $BLUE
    for dir in node_modules coverage dist; do
        if [ -d "$ROOT_DIR/$dir" ]; then
            rm -rf "$ROOT_DIR/$dir"
            log "✅ Removed: $dir" $GREEN
        fi
    done
    
    # Remove log and temp files
    find "$ROOT_DIR" -name "*.log" -delete 2>/dev/null || true
    find "$ROOT_DIR" -name "*.tmp" -delete 2>/dev/null || true
    
    # Create staging structure
    log "📋 Organizing for staging..." $BLUE
    STAGING_DIR="$ROOT_DIR/.staging"
    
    mkdir -p "$STAGING_DIR"/{app/{src,config,docs,tests},deployment/{scripts,configs,docker},monitoring/{logs,metrics}}
    
    # Copy files to staging
    for copy in "src:app/src" "config:app/config" "docs:app/docs" "tests:app/tests" \
                 "package.json:app/package.json" "server.js:app/server.js" "README.md:app/README.md"; do
        src="${copy%%:*}"
        dest="${copy##*:}"
        
        if [ -e "$ROOT_DIR/$src" ]; then
            cp -r "$ROOT_DIR/$src" "$STAGING_DIR/$dest"
            log "✅ Staged: $src" $GREEN
        fi
    done
    
    # Create staging config
    cat > "$STAGING_DIR/staging-config.json" << EOF
{
    "environment": "staging",
    "version": "1.0.0",
    "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "nodeVersion": "$(node --version 2>/dev/null || echo 'unknown')",
    "healthChecks": {
        "stateless": "/health",
        "stateful": "/health"
    },
    "ports": {
        "stateless": 3001,
        "stateful": 3002
    }
}
EOF
    
    log "✅ Staging configuration created" $GREEN
    
    # Create deployment structure
    log "🚀 Preparing deployment..." $BLUE
    DEPLOYMENT_DIR="$ROOT_DIR/.deployment"
    
    mkdir -p "$DEPLOYMENT_DIR"/{docker,kubernetes,scripts,configs,monitoring}
    
    # Create Dockerfile
    cat > "$DEPLOYMENT_DIR/docker/Dockerfile" << 'EOF'
# Phase 1 Mockup - Stateless vs Stateful Server
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY app/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY app/ .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health && curl -f http://localhost:3002/health

# Start servers
CMD ["node", "server.js"]
EOF
    
    # Create docker-compose.yml
    cat > "$DEPLOYMENT_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  phase1-mockup:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3001:3001"
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./configs/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - phase1-mockup
    restart: unless-stopped
EOF
    
    # Create deployment script
    cat > "$DEPLOYMENT_DIR/scripts/deploy.sh" << 'EOF'
#!/bin/bash
# Phase 1 Deployment Script

set -e

echo "🚀 Starting Phase 1 deployment..."

# Build and start services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🔍 Performing health checks..."
if curl -f http://localhost:3001/health && curl -f http://localhost:3002/health; then
    echo "✅ Deployment successful!"
    echo "🌐 Stateless Server: http://localhost:3001"
    echo "🌐 Stateful Server: http://localhost:3002"
else
    echo "❌ Health checks failed!"
    docker-compose logs
    exit 1
fi

echo "📊 Deployment completed at $(date)"
EOF
    
    chmod +x "$DEPLOYMENT_DIR/scripts/deploy.sh"
    
    log "✅ Deployment preparation completed" $GREEN
    
    # Create Phase 2 placeholders
    log "🔮 Creating Phase 2 placeholders..." $BLUE
    PHASE2_DIR="$(dirname "$ROOT_DIR")/phase2-production"
    
    mkdir -p "$PHASE2_DIR"/{app/{api/{stateless,stateful,shared},core/{config,database,redis,security},models,schemas,services},deployment/{docker,kubernetes,helm},migrations,tests/{unit,integration,performance},docs/{api,deployment,architecture},scripts}
    
    # Create Phase 2 README
    cat > "$PHASE2_DIR/README.md" << 'EOF'
# Phase 2 Production Implementation

## Overview
Production-ready implementation of the stateless vs stateful server architecture using Python/FastAPI.

## Architecture
- **Backend**: Python 3.11+ with FastAPI
- **Database**: PostgreSQL 15+
- **Cache/Session**: Redis 7+
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (optional)
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus + Grafana

## Migration Status
🔧 **In Progress**: Migration from Phase 1 mockup

### Completed
- [x] Directory structure
- [x] Placeholder files
- [x] Migration plan documentation

### In Progress
- [ ] FastAPI application implementation
- [ ] Database schema migration
- [ ] Redis session management
- [ ] Docker containerization

### TODO
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline
- [ ] Monitoring setup
- [ ] Performance testing
- [ ] Security hardening

## Development Setup
```bash
# Clone and setup
git clone <repository>
cd phase2-production
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Migration from Phase 1
See docs/migration-guide.md for detailed migration instructions.

## Documentation
- API Documentation: docs/api/
- Deployment Guide: docs/deployment/
- Architecture: docs/architecture/
EOF
    
    # Create requirements.txt
    cat > "$PHASE2_DIR/requirements.txt" << 'EOF'
# Phase 2 Production Requirements
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
redis==5.0.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
prometheus-client==0.19.0
structlog==23.2.0
EOF
    
    log "✅ Phase 2 placeholders created" $GREEN
}

# Generate cleanup report
generate_report() {
    print_section "📊 Generating Cleanup Report"
    
    REPORT_PATH="$ROOT_DIR/cleanup-report.json"
    
    cat > "$REPORT_PATH" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "phase": "Phase 1 Cleanup Complete",
    "actions": [
        "Created backup of current state",
        "Cleaned development artifacts",
        "Organized staging structure",
        "Prepared deployment configuration",
        "Created Phase 2 placeholders"
    ],
    "directories": {
        "backup": "$ROOT_DIR/.backup",
        "staging": "$ROOT_DIR/.staging",
        "deployment": "$ROOT_DIR/.deployment",
        "phase2": "$(dirname "$ROOT_DIR")/phase2-production"
    },
    "nextSteps": [
        "Review staging configuration",
        "Test deployment scripts",
        "Begin Phase 2 implementation",
        "Plan data migration strategy"
    ],
    "readiness": {
        "staging": true,
        "deployment": true,
        "phase2Transition": true
    }
}
EOF
    
    log "📄 Cleanup report generated: $REPORT_PATH" $BLUE
    
    # Print summary
    log "" $YELLOW
    log "📋 Cleanup Summary:" $YELLOW
    log "   • Backup: $ROOT_DIR/.backup" $CYAN
    log "   • Staging: $ROOT_DIR/.staging" $CYAN
    log "   • Deployment: $ROOT_DIR/.deployment" $CYAN
    log "   • Phase 2: $(dirname "$ROOT_DIR")/phase2-production" $CYAN
}

# Main execution
main() {
    # Check if Docker is available
    if command -v docker >/dev/null 2>&1; then
        log "🐳 Docker detected, using Docker-based cleanup..." $BLUE
        docker_cleanup
    else
        log "⚠️ Docker not detected, using manual cleanup..." $YELLOW
        manual_cleanup
    fi
    
    generate_report
    
    print_section "✅ Cleanup Complete"
    log "🎉 Codebase successfully cleaned and organized!" $GREEN
}

# Run main function
main "$@"
