# Phase 1 Codebase Cleanup Script (Simplified PowerShell)
# Prepares Phase 1 for staging deployment and Phase 2 transition

param(
    [switch]$Force,
    [switch]$Verbose
)

# Colors for console output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $colors = @{
        "Red" = "Red"
        "Green" = "Green" 
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "Cyan" = "Cyan"
        "Magenta" = "Magenta"
    }
    
    if ($colors.ContainsKey($Color)) {
        Write-Host $Message -ForegroundColor $colors[$Color]
    } else {
        Write-Host $Message
    }
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor White -BackgroundColor DarkBlue
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

# Main cleanup
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
            @{ Name = "Node modules"; Path = "node_modules" },
            @{ Name = "Test coverage reports"; Path = "coverage" },
            @{ Name = "Build artifacts"; Path = "dist" }
        )
        
        foreach ($task in $cleanupTasks) {
            try {
                $fullPath = Join-Path $this.RootDir $task.Path
                if (Test-Path $fullPath) {
                    Remove-Item -Path $fullPath -Recurse -Force
                    Write-ColorOutput "✅ Removed: $($task.Name)" "Green"
                }
            } catch {
                Write-ColorOutput "⚠️  Could not remove $($task.Name): $($_.Exception.Message)" "Yellow"
            }
        }
        
        # Remove log and temp files
        Get-ChildItem -Path $this.RootDir -Filter "*.log" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
        Get-ChildItem -Path $this.RootDir -Filter "*.tmp" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
    }

    [void] OrganizeForStaging() {
        Write-Section "📋 Organizing for Staging"
        
        # Create staging directories
        $stagingDirs = @(
            ".staging/app/src",
            ".staging/app/config", 
            ".staging/app/docs",
            ".staging/app/tests",
            ".staging/deployment/scripts",
            ".staging/deployment/configs",
            ".staging/deployment/docker",
            ".staging/monitoring/logs",
            ".staging/monitoring/metrics"
        )
        
        foreach ($dir in $stagingDirs) {
            $fullPath = Join-Path $this.RootDir $dir
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        }
        
        # Copy organized files
        $stagingCopies = @(
            @{ Src = "src"; Dest = ".staging/app/src" },
            @{ Src = "config"; Dest = ".staging/app/config" },
            @{ Src = "docs"; Dest = ".staging/app/docs" },
            @{ Src = "tests"; Dest = ".staging/app/tests" },
            @{ Src = "package.json"; Dest = ".staging/app/package.json" },
            @{ Src = "server.js"; Dest = ".staging/app/server.js" },
            @{ Src = "README.md"; Dest = ".staging/app/README.md" }
        )
        
        foreach ($copy in $stagingCopies) {
            $srcPath = Join-Path $this.RootDir $copy.Src
            $destPath = Join-Path $this.RootDir $copy.Dest
            
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
        $stagingConfigPath = Join-Path $this.RootDir ".staging/staging-config.json"
        Set-Content -Path $stagingConfigPath -Value $stagingConfigJson
        
        Write-ColorOutput "✅ Staging configuration created" "Green"
    }

    [void] PrepareDeployment() {
        Write-Section "🚀 Preparing Deployment"
        
        # Create deployment directories
        $deploymentDirs = @(
            ".deployment/docker",
            ".deployment/kubernetes", 
            ".deployment/scripts",
            ".deployment/configs",
            ".deployment/monitoring"
        )
        
        foreach ($dir in $deploymentDirs) {
            $fullPath = Join-Path $this.RootDir $dir
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        }
        
        # Create Dockerfile (simplified version)
        $dockerfileLines = @(
            "# Phase 1 Mockup - Stateless vs Stateful Server",
            "FROM node:24-alpine",
            "",
            "# Set working directory",
            "WORKDIR /app",
            "",
            "# Copy package files",
            "COPY app/package*.json ./",
            "",
            "# Install dependencies", 
            "RUN npm ci --only=production",
            "",
            "# Copy application code",
            "COPY app/ .",
            "",
            "# Create non-root user",
            "RUN addgroup -g 1001 -S nodejs",
            "RUN adduser -S nodejs -u 1001",
            "",
            "# Change ownership",
            "RUN chown -R nodejs:nodejs /app",
            "USER nodejs",
            "",
            "# Expose ports",
            "EXPOSE 3001 3002",
            "",
            "# Health check",
            "HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:3001/health",
            "",
            "# Start servers",
            'CMD ["node", "server.js"]'
        )
        
        $dockerfilePath = Join-Path $this.RootDir ".deployment/docker/Dockerfile"
        Set-Content -Path $dockerfilePath -Value ($dockerfileLines -join "`r`n")
        
        # Create docker-compose.yml (simplified)
        $dockerComposeLines = @(
            "version: '3.8'",
            "",
            "services:",
            "  phase1-mockup:",
            "    build:",
            "      context: .",
            "      dockerfile: docker/Dockerfile",
            "    ports:",
            "      - '3001:3001'",
            "      - '3002:3002'",
            "    environment:",
            "      - NODE_ENV=production",
            "      - LOG_LEVEL=info",
            "    restart: unless-stopped",
            "    healthcheck:",
            "      test: ['CMD', 'curl', '-f', 'http://localhost:3001/health']",
            "      interval: 30s",
            "      timeout: 10s",
            "      retries: 3",
            "      start_period: 40s"
        )
        
        $dockerComposePath = Join-Path $this.RootDir ".deployment/docker-compose.yml"
        Set-Content -Path $dockerComposePath -Value ($dockerComposeLines -join "`r`n")
        
        # Create deployment script
        $deployScriptLines = @(
            "#!/bin/bash",
            "# Phase 1 Deployment Script",
            "",
            "set -e",
            "",
            'echo "🚀 Starting Phase 1 deployment..."',
            "",
            "# Build and start services",
            "docker-compose down",
            "docker-compose build --no-cache",
            "docker-compose up -d",
            "",
            "# Wait for services to be ready",
            'echo "⏳ Waiting for services to start..."',
            "sleep 30",
            "",
            "# Health checks",
            'echo "🔍 Performing health checks..."',
            "if curl -f http://localhost:3001/health; then",
            '    echo "✅ Deployment successful!"',
            '    echo "🌐 Stateless Server: http://localhost:3001"',
            '    echo "🌐 Stateful Server: http://localhost:3002"',
            "else",
            '    echo "❌ Health checks failed!"',
            "    docker-compose logs",
            "    exit 1",
            "fi",
            "",
            'echo "📊 Deployment completed at $(date)"'
        )
        
        $deployScriptPath = Join-Path $this.RootDir ".deployment/scripts/deploy.sh"
        Set-Content -Path $deployScriptPath -Value ($deployScriptLines -join "`r`n")
        
        Write-ColorOutput "✅ Deployment preparation completed" "Green"
    }

    [void] CreatePhase2Placeholders() {
        Write-Section "🔮 Creating Phase 2 Placeholders"
        
        $phase2Dir = Join-Path $this.RootDir ".." "phase2-production"
        
        # Create Phase 2 directory structure
        $phase2Dirs = @(
            "phase2-production/app/api/stateless",
            "phase2-production/app/api/stateful", 
            "phase2-production/app/api/shared",
            "phase2-production/app/core/config",
            "phase2-production/app/core/database",
            "phase2-production/app/core/redis",
            "phase2-production/app/core/security",
            "phase2-production/app/models",
            "phase2-production/app/schemas",
            "phase2-production/app/services",
            "phase2-production/deployment/docker",
            "phase2-production/deployment/kubernetes",
            "phase2-production/deployment/helm",
            "phase2-production/migrations",
            "phase2-production/tests/unit",
            "phase2-production/tests/integration",
            "phase2-production/tests/performance",
            "phase2-production/docs/api",
            "phase2-production/docs/deployment",
            "phase2-production/docs/architecture",
            "phase2-production/scripts"
        )
        
        foreach ($dir in $phase2Dirs) {
            $fullPath = Join-Path $this.RootDir ".." $dir
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        }
        
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
See docs/migration-guide.md for detailed migration instructions.

## Documentation
- API Documentation: docs/api/
- Deployment Guide: docs/deployment/
- Architecture: docs/architecture/
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
}

# Main execution
try {
    $cleanup = [CodebaseCleanup]::new()
    $cleanup.PerformCleanup()
} catch {
    Write-ColorOutput "❌ Cleanup failed: $($_.Exception.Message)" "Red"
    exit 1
}
