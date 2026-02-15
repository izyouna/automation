#!/bin/bash
# Phase 2 Production Deployment Script

set -e  # Exit on any error

echo "🚀 Phase 2 Production Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed or not in PATH"
    exit 1
fi

print_status "docker-compose is available"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found, creating from template..."
    cp .env.example .env
    print_success ".env file created from template"
    print_warning "Please review and update .env file with your configuration"
fi

# Stop existing services
print_status "Stopping existing services..."
docker-compose down

# Build images
print_status "Building Docker images..."
docker-compose build --no-cache

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_error "PostgreSQL is not ready"
    exit 1
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_error "Redis is not ready"
    exit 1
fi

# Wait a bit more for the API to start
print_status "Waiting for API to start..."
sleep 15

# Check API health
if curl -f http://localhost:8000/api/v1/shared/health > /dev/null 2>&1; then
    print_success "API is healthy"
else
    print_error "API health check failed"
    print_status "Checking API logs..."
    docker-compose logs phase2-api
    exit 1
fi

# Show service status
print_status "Service Status:"
docker-compose ps

# Show API endpoints
print_success "Deployment completed successfully!"
echo ""
echo "🌐 API Endpoints:"
echo "   • Health Check: http://localhost:8000/api/v1/shared/health"
echo "   • API Documentation: http://localhost:8000/docs"
echo "   • ReDoc: http://localhost:8000/redoc"
echo "   • Application Info: http://localhost:8000/api/v1/shared/info"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo "   • Scale API: docker-compose up -d --scale phase2-api=2"
echo ""
echo "📊 Database Access:"
echo "   • PostgreSQL: localhost:5432"
echo "   • Redis: localhost:6379"
echo ""
print_success "Phase 2 Production is now running!"
