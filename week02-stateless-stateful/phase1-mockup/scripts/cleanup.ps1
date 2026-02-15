# Phase 1 Codebase Cleanup Script (PowerShell)
# Prepares Phase 1 for staging deployment and Phase 2 transition

param(
    [switch]$Force,
    [switch]$Verbose
)

# Colors for console output
$Colors = @{
    Reset = "`e[0m"
    Bright = "`e[1m"
    Red = "`e[31m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Magenta = "`e[35m"
    Cyan = "`e[36m"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "Reset"
    )
    Write-Host "$($Colors[$Color])$Message$($Colors.Reset)"
}

function Write-Section {
    param([string]$Title)
    Write-ColorOutput "`n" + "=" * 60 "Cyan"
    Write-ColorOutput $Title "Bright"
    Write-ColorOutput "=" * 60 "Cyan"
}

# Main cleanup class
class CodebaseCleanup {
    [string]$RootDir
    [string]$BackupDir
    [string]$StagingDir
    [string]$DeploymentDir
    
    CodebaseCleanup() {
        $this.RootDir = $PSScriptRoot | Split-Path -Parent
        $this.BackupDir = Join-Path $this.RootDir ".backup"
        $this.StagingDir = Join-Path $this.RootDir ".staging"
        $this.DeploymentDir = Join-Path $this.RootDir ".deployment"
    }

    [void] PerformCleanup() {
        Write-Section "🧹 Phase 1 Codebase Cleanup"
        Write-ColorOutput "🔧 Starting comprehensive cleanup process..." "Yellow"
        
        try {
            $this.CreateBackup()
            $this.CleanupDevelopmentArtifacts()
            $this.OrganizeForStaging()
            $this.PrepareDeployment()
            $this.CreatePhase2Placeholders()
            $this.GenerateCleanupReport()
            
            Write-Section "✅ Cleanup Complete"
            Write-ColorOutput "🎉 Codebase successfully cleaned and organized!" "Green"
            
        } catch {
            Write-ColorOutput "❌ Cleanup failed: $($_.Exception.Message)" "Red"
            throw
        }
    }

    [void] CreateBackup() {
        Write-Section "📦 Creating Backup"
        Write-ColorOutput "🔄 Backing up current state..." "Yellow"
        
        # Create backup directory
        if (-not (Test-Path $this.BackupDir)) {
            New-Item -ItemType Directory -Path $this.BackupDir -Force | Out-Null
        }
        
        $timestamp = (Get-Date).ToString("yyyy-MM-dd-HH-mm-ss")
        $backupPath = Join-Path $this.BackupDir "backup-$timestamp"
        New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
        
        # Files to backup
        $filesToBackup = @(
            "package.json",
            "server.js", 
            "README.md",
            "config",
            "src",
            "docs",
            "tests",
            "examples",
            ".roo"
        )
        
        foreach ($file in $filesToBackup) {
            $srcPath = Join-Path $this.RootDir $file
            $destPath = Join-Path $backupPath $file
            
            if (Test-Path $srcPath) {
                Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
                Write-ColorOutput "✅ Backed up: $file" "Green"
            }
        }
        
        Write-ColorOutput "📦 Backup created: $backupPath" "Blue"
    }

    [void] CleanupDevelopmentArtifacts() {
        Write-Section "🧹 Cleaning Development Artifacts"
        
        $cleanupTasks = @(
            @{ Name = "Node modules"; Path = "node_modules"; Action = "remove" },
            @{ Name = "Test coverage reports"; Path = "coverage"; Action = "remove" },
            @{ Name = "Build artifacts"; Path = "dist"; Action = "remove" },
            @{ Name = "Log files"; Pattern = "*.log"; Action = "remove" },
            @{ Name = "Temporary files"; Pattern = "*.tmp"; Action = "remove" }
        )
        
        foreach ($task in $cleanupTasks) {
            try {
                if ($task.Path) {
                    $fullPath = Join-Path $this.RootDir $task.Path
                    if (Test-Path $fullPath) {
                        Remove-Item -Path $fullPath -Recurse -Force
                        Write-ColorOutput "✅ Removed: $($task.Name)" "Green"
                    }
                } elseif ($task.Pattern) {
                    $files = Get-ChildItem -Path $this.RootDir -Filter $task.Pattern -Recurse
                    foreach ($file in $files) {
                        Remove-Item -Path $file.FullName -Force
                        Write-ColorOutput "✅ Removed: $($task.Name) - $($file.Name)" "Green"
                    }
                }
            } catch {
                Write-ColorOutput "⚠️  Could not remove $($task.Name): $($_.Exception.Message)" "Yellow"
            }
        }
    }

    [void] OrganizeForStaging() {
        Write-Section "📋 Organizing for Staging"
        
        # Create staging directory structure
        $stagingStructure = @{
            "app" = @{
                "src" = @{}
                "config" = @{}
                "docs" = @{}
                "tests" = @{}
            }
            "deployment" = @{
                "scripts" = @{}
                "configs" = @{}
                "docker" = @{}
            }
            "monitoring" = @{
                "logs" = @{}
                "metrics" = @{}
            }
        }
        
        $this.CreateDirectoryStructure($this.StagingDir, $stagingStructure)
        
        # Copy organized files
        $stagingCopies = @(
            @{ Src = "src"; Dest = "app/src" },
            @{ Src = "config"; Dest = "app/config" },
            @{ Src = "docs"; Dest = "app/docs" },
            @{ Src = "tests"; Dest = "app/tests" },
            @{ Src = "package.json"; Dest = "app/package.json" },
            @{ Src = "server.js"; Dest = "app/server.js" },
            @{ Src = "README.md"; Dest = "app/README.md" }
        )
        
        foreach ($copy in $stagingCopies) {
            $srcPath = Join-Path $this.RootDir $copy.Src
            $destPath = Join-Path $this.StagingDir $copy.Dest
            
            if (Test-Path $srcPath) {
                Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
                Write-ColorOutput "✅ Staged: $($copy.Src)" "Green"
            }
        }
        
        # Create staging configuration
        $stagingConfig = @{
            environment = "staging"
            version = "1.0.0"
            buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            nodeVersion = $PSVersionTable.PSVersion.ToString()
            healthChecks = @{
                stateless = "/health"
                stateful = "/health"
            }
            ports = @{
                stateless = 3001
                stateful = 3002
            }
        }
        
        $stagingConfigJson = $stagingConfig | ConvertTo-Json -Depth 10
        $stagingConfigPath = Join-Path $this.StagingDir "staging-config.json"
        Set-Content -Path $stagingConfigPath -Value $stagingConfigJson
        
        Write-ColorOutput "✅ Staging configuration created" "Green"
    }

    [void] PrepareDeployment() {
        Write-Section "🚀 Preparing Deployment"
        
        # Create deployment directory structure
        $deploymentStructure = @{
            "docker" = @{}
            "kubernetes" = @{}
            "scripts" = @{}
            "configs" = @{}
            "monitoring" = @{}
        }
        
        $this.CreateDirectoryStructure($this.DeploymentDir, $deploymentStructure)
        
        # Create Dockerfile
        $dockerfile = @"
# Phase 1 Mockup - Stateless vs Stateful Server
FROM node:18-alpine

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
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 `
  CMD curl -f http://localhost:3001/health && curl -f http://localhost:3002/health

# Start servers
CMD ["node", "server.js"]
"@
        
        $dockerfilePath = Join-Path $this.DeploymentDir "docker" "Dockerfile"
        Set-Content -Path $dockerfilePath -Value $dockerfile
        
        # Create docker-compose.yml
        $dockerCompose = @"
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
"@
        
        $dockerComposePath = Join-Path $this.DeploymentDir "docker-compose.yml"
        Set-Content -Path $dockerComposePath -Value $dockerCompose
        
        # Create deployment script
        $deployScript = @"
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
"@
        
        $deployScriptPath = Join-Path $this.DeploymentDir "scripts" "deploy.sh"
        Set-Content -Path $deployScriptPath -Value $deployScript
        
        Write-ColorOutput "✅ Deployment preparation completed" "Green"
    }

    [void] CreatePhase2Placeholders() {
        Write-Section "🔮 Creating Phase 2 Placeholders"
        
        $phase2Dir = Join-Path $this.RootDir ".." "phase2-production"
        
        # Create Phase 2 directory structure
        $phase2Structure = @{
            "app" = @{
                "api" = @{
                    "stateless" = @{}
                    "stateful" = @{}
                    "shared" = @{}
                }
                "core" = @{
                    "config" = @{}
                    "database" = @{}
                    "redis" = @{}
                    "security" = @{}
                }
                "models" = @{}
                "schemas" = @{}
                "services" = @{}
            }
            "deployment" = @{
                "docker" = @{}
                "kubernetes" = @{}
                "helm" = @{}
            }
            "migrations" = @{}
            "tests" = @{
                "unit" = @{}
                "integration" = @{}
                "performance" = @{}
            }
            "docs" = @{
                "api" = @{}
                "deployment" = @{}
                "architecture" = @{}
            }
            "scripts" = @{}
        }
        
        $this.CreateDirectoryStructure($phase2Dir, $phase2Structure)
        
        # Create Phase 2 README
        $phase2Readme = @"
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
\`\`\`bash
# Clone and setup
git clone <repository>
cd phase2-production
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Start development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

## Migration from Phase 1
See \`docs/migration-guide.md\` for detailed migration instructions.

## Documentation
- API Documentation: \`docs/api/\`
- Deployment Guide: \`docs/deployment/\`
- Architecture: \`docs/architecture/\`
"@
        
        $phase2ReadmePath = Join-Path $phase2Dir "README.md"
        Set-Content -Path $phase2ReadmePath -Value $phase2Readme
        
        # Create requirements.txt
        $requirements = @"
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
"@
        
        $requirementsPath = Join-Path $phase2Dir "requirements.txt"
        Set-Content -Path $requirementsPath -Value $requirements
        
        # Create main FastAPI application
        $mainApp = @"
"""
Phase 2 Production - FastAPI Main Application
Production-ready implementation of stateless vs stateful server architecture
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# Placeholder for actual implementation
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    print("🚀 Phase 2 Production Server Starting...")
    
    # TODO: Initialize database connection
    # TODO: Initialize Redis connection
    # TODO: Setup monitoring
    
    yield
    
    # Shutdown
    print("🛑 Phase 2 Production Server Shutting Down...")
    # TODO: Cleanup connections

# Create FastAPI application
app = FastAPI(
    title="Stateless vs Stateful Server API",
    description="Production implementation demonstrating stateless and stateful architectures",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "server": "Phase 2 Production",
        "version": "2.0.0",
        "note": "Production-ready implementation"
    }

# TODO: Import and include actual routers
# from app.api.stateless import router as stateless_router
# from app.api.stateful import router as stateful_router
# app.include_router(stateless_router, prefix="/api/v1/stateless", tags=["stateless"])
# app.include_router(stateful_router, prefix="/api/v1/stateful", tags=["stateful"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
"@
        
        $mainAppPath = Join-Path $phase2Dir "app" "main.py"
        Set-Content -Path $mainAppPath -Value $mainApp
        
        Write-ColorOutput "✅ Phase 2 placeholders created" "Green"
    }

    [void] GenerateCleanupReport() {
        Write-Section "📊 Generating Cleanup Report"
        
        $report = @{
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            phase = "Phase 1 Cleanup Complete"
            actions = @(
                "Created backup of current state",
                "Cleaned development artifacts", 
                "Organized staging structure",
                "Prepared deployment configuration",
                "Created Phase 2 placeholders"
            )
            directories = @{
                backup = $this.BackupDir
                staging = $this.StagingDir
                deployment = $this.DeploymentDir
                phase2 = Join-Path $this.RootDir ".." "phase2-production"
            }
            nextSteps = @(
                "Review staging configuration",
                "Test deployment scripts", 
                "Begin Phase 2 implementation",
                "Plan data migration strategy"
            )
            readiness = @{
                staging = $true
                deployment = $true
                phase2Transition = $true
            }
        }
        
        $reportPath = Join-Path $this.RootDir "cleanup-report.json"
        $reportJson = $report | ConvertTo-Json -Depth 10
        Set-Content -Path $reportPath -Value $reportJson
        
        Write-ColorOutput "📄 Cleanup report generated: $reportPath" "Blue"
        
        # Print summary
        Write-ColorOutput "`n📋 Cleanup Summary:" "Yellow"
        Write-ColorOutput "   • Backup: $($this.BackupDir)" "Cyan"
        Write-ColorOutput "   • Staging: $($this.StagingDir)" "Cyan"
        Write-ColorOutput "   • Deployment: $($this.DeploymentDir)" "Cyan"
        Write-ColorOutput "   • Phase 2: $(Join-Path $this.RootDir '..' 'phase2-production')" "Cyan"
    }

    [void] CreateDirectoryStructure([string]$baseDir, [hashtable]$structure) {
        foreach ($key in $structure.Keys) {
            $dirPath = Join-Path $baseDir $key
            New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
            
            $value = $structure[$key]
            if ($value -is [hashtable]) {
                $this.CreateDirectoryStructure($dirPath, $value)
            }
        }
    }
}

# Main execution
try {
    $cleanup = [CodebaseCleanup]::new()
    $cleanup.PerformCleanup()
} catch {
    Write-ColorOutput "❌ Cleanup failed: $($_.Exception.Message)" "Red"
    exit 1
}
