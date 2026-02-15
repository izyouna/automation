#!/usr/bin/env node

/**
 * Codebase Cleanup Script
 * Prepares Phase 1 for staging deployment and Phase 2 transition
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSection(title) {
    log('\n' + '='.repeat(60), 'cyan');
    log(title, 'bright');
    log('='.repeat(60), 'cyan');
}

// Cleanup tasks
class CodebaseCleanup {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.backupDir = path.join(this.rootDir, '.backup');
        this.stagingDir = path.join(this.rootDir, '.staging');
        this.deploymentDir = path.join(this.rootDir, '.deployment');
    }

    async performCleanup() {
        printSection('🧹 Phase 1 Codebase Cleanup');
        
        log('🔧 Starting comprehensive cleanup process...', 'yellow');
        
        try {
            await this.createBackup();
            await this.cleanupDevelopmentArtifacts();
            await this.organizeForStaging();
            await this.prepareDeployment();
            await this.createPhase2Placeholders();
            await this.generateCleanupReport();
            
            printSection('✅ Cleanup Complete');
            log('🎉 Codebase successfully cleaned and organized!', 'green');
            
        } catch (error) {
            log(`❌ Cleanup failed: ${error.message}`, 'red');
            process.exit(1);
        }
    }

    async createBackup() {
        printSection('📦 Creating Backup');
        
        log('🔄 Backing up current state...', 'yellow');
        
        // Create backup directory
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
        
        // Copy important files
        const filesToBackup = [
            'package.json',
            'server.js',
            'README.md',
            'config/',
            'src/',
            'docs/',
            'tests/',
            'examples/',
            '.roo/'
        ];
        
        for (const file of filesToBackup) {
            const srcPath = path.join(this.rootDir, file);
            const destPath = path.join(backupPath, file);
            
            if (fs.existsSync(srcPath)) {
                this.copyRecursive(srcPath, destPath);
                log(`✅ Backed up: ${file}`, 'green');
            }
        }
        
        log(`📦 Backup created: ${backupPath}`, 'blue');
    }

    async cleanupDevelopmentArtifacts() {
        printSection('🧹 Cleaning Development Artifacts');
        
        const cleanupTasks = [
            {
                name: 'Node modules',
                path: 'node_modules',
                action: 'remove'
            },
            {
                name: 'Test coverage reports',
                path: 'coverage',
                action: 'remove'
            },
            {
                name: 'Build artifacts',
                path: 'dist',
                action: 'remove'
            },
            {
                name: 'Log files',
                pattern: '*.log',
                action: 'remove'
            },
            {
                name: 'Temporary files',
                pattern: '*.tmp',
                action: 'remove'
            },
            {
                name: 'IDE files',
                pattern: '.vscode/settings.json',
                action: 'remove'
            }
        ];
        
        for (const task of cleanupTasks) {
            try {
                if (task.path) {
                    const fullPath = path.join(this.rootDir, task.path);
                    if (fs.existsSync(fullPath)) {
                        this.removeRecursive(fullPath);
                        log(`✅ Removed: ${task.name}`, 'green');
                    }
                } else if (task.pattern) {
                    const files = this.findFiles(this.rootDir, task.pattern);
                    for (const file of files) {
                        fs.unlinkSync(file);
                        log(`✅ Removed: ${task.name} - ${path.basename(file)}`, 'green');
                    }
                }
            } catch (error) {
                log(`⚠️  Could not remove ${task.name}: ${error.message}`, 'yellow');
            }
        }
    }

    async organizeForStaging() {
        printSection('📋 Organizing for Staging');
        
        // Create staging directory structure
        const stagingStructure = {
            'app': {
                'src': {},
                'config': {},
                'docs': {},
                'tests': {}
            },
            'deployment': {
                'scripts': {},
                'configs': {},
                'docker': {}
            },
            'monitoring': {
                'logs': {},
                'metrics': {}
            }
        };
        
        this.createDirectoryStructure(this.stagingDir, stagingStructure);
        
        // Copy organized files
        const stagingCopies = [
            { src: 'src', dest: 'app/src' },
            { src: 'config', dest: 'app/config' },
            { src: 'docs', dest: 'app/docs' },
            { src: 'tests', dest: 'app/tests' },
            { src: 'package.json', dest: 'app/package.json' },
            { src: 'server.js', dest: 'app/server.js' },
            { src: 'README.md', dest: 'app/README.md' }
        ];
        
        for (const copy of stagingCopies) {
            const srcPath = path.join(this.rootDir, copy.src);
            const destPath = path.join(this.stagingDir, copy.dest);
            
            if (fs.existsSync(srcPath)) {
                this.copyRecursive(srcPath, destPath);
                log(`✅ Staged: ${copy.src}`, 'green');
            }
        }
        
        // Create staging configuration
        const stagingConfig = {
            environment: 'staging',
            version: '1.0.0',
            buildDate: new Date().toISOString(),
            nodeVersion: process.version,
            dependencies: this.getPackageDependencies(),
            healthChecks: {
                stateless: '/health',
                stateful: '/health'
            },
            ports: {
                stateless: 3001,
                stateful: 3002
            }
        };
        
        fs.writeFileSync(
            path.join(this.stagingDir, 'staging-config.json'),
            JSON.stringify(stagingConfig, null, 2)
        );
        
        log('✅ Staging configuration created', 'green');
    }

    async prepareDeployment() {
        printSection('🚀 Preparing Deployment');
        
        // Create deployment directory structure
        const deploymentStructure = {
            'docker': {},
            'kubernetes': {},
            'scripts': {},
            'configs': {},
            'monitoring': {}
        };
        
        this.createDirectoryStructure(this.deploymentDir, deploymentStructure);
        
        // Create Dockerfile
        const dockerfile = `# Phase 1 Mockup - Stateless vs Stateful Server
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
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3001/health && curl -f http://localhost:3002/health

# Start servers
CMD ["node", "server.js"]
`;
        
        fs.writeFileSync(path.join(this.deploymentDir, 'docker', 'Dockerfile'), dockerfile);
        
        // Create docker-compose for deployment
        const dockerCompose = `version: '3.8'

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
`;
        
        fs.writeFileSync(path.join(this.deploymentDir, 'docker-compose.yml'), dockerCompose);
        
        // Create deployment scripts
        const deployScript = `#!/bin/bash
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
`;
        
        fs.writeFileSync(path.join(this.deploymentDir, 'scripts', 'deploy.sh'), deployScript);
        fs.chmodSync(path.join(this.deploymentDir, 'scripts', 'deploy.sh'), '755');
        
        log('✅ Deployment preparation completed', 'green');
    }

    async createPhase2Placeholders() {
        printSection('🔮 Creating Phase 2 Placeholders');
        
        const phase2Dir = path.join(this.rootDir, '..', 'phase2-production');
        
        // Create Phase 2 directory structure
        const phase2Structure = {
            'app': {
                'api': {
                    'stateless': {},
                    'stateful': {},
                    'shared': {}
                },
                'core': {
                    'config': {},
                    'database': {},
                    'redis': {},
                    'security': {}
                },
                'models': {},
                'schemas': {},
                'services': {}
            },
            'deployment': {
                'docker': {},
                'kubernetes': {},
                'helm': {}
            },
            'migrations': {},
            'tests': {
                'unit': {},
                'integration': {},
                'performance': {}
            },
            'docs': {
                'api': {},
                'deployment': {},
                'architecture': {}
            },
            'scripts': {}
        };
        
        this.createDirectoryStructure(phase2Dir, phase2Structure);
        
        // Create Phase 2 README placeholder
        const phase2Readme = `# Phase 2 Production Implementation

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
`;
        
        fs.writeFileSync(path.join(phase2Dir, 'README.md'), phase2Readme);
        
        // Create requirements.txt placeholder
        const requirements = `# Phase 2 Production Requirements
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
`;
        
        fs.writeFileSync(path.join(phase2Dir, 'requirements.txt'), requirements);
        
        // Create main FastAPI application placeholder
        const mainApp = `"""
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
`;
        
        fs.writeFileSync(path.join(phase2Dir, 'app', 'main.py'), mainApp);
        
        // Create migration guide placeholder
        const migrationGuide = `# Phase 1 to Phase 2 Migration Guide

## Overview
This guide provides step-by-step instructions for migrating from the Phase 1 mockup to the Phase 2 production implementation.

## Migration Checklist

### Pre-Migration
- [ ] Backup Phase 1 data and configurations
- [ ] Review Phase 1 functionality and customizations
- [ ] Set up Phase 2 development environment
- [ ] Plan data migration strategy

### Data Migration
- [ ] Export users from Phase 1 mock data
- [ ] Export products from Phase 1 mock data
- [ ] Migrate to PostgreSQL database
- [ ] Validate data integrity

### API Migration
- [ ] Review Phase 1 API endpoints
- [ ] Implement equivalent FastAPI endpoints
- [ ] Ensure backward compatibility
- [ ] Update client applications

### Session Migration
- [ ] Review Phase 1 session structure
- [ ] Implement Redis-based session storage
- [ ] Migrate active sessions (if needed)
- [ ] Test session functionality

### Testing
- [ ] Run Phase 1 compatibility tests
- [ ] Perform integration testing
- [ ] Load testing and performance validation
- [ ] Security testing

### Deployment
- [ ] Set up production environment
- [ ] Configure monitoring and logging
- [ ] Deploy Phase 2 application
- [ ] Perform smoke tests

## Rollback Plan
If migration fails:
1. Stop Phase 2 services
2. Restore Phase 1 backup
3. Restart Phase 1 services
4. Investigate failure causes

## Timeline
Estimated migration time: 2-3 weeks

## Resources
- Phase 1 documentation: \`../phase1-mockup/docs/\`
- Phase 2 API documentation: \`docs/api/\`
- Troubleshooting guide: \`docs/troubleshooting.md\`
`;
        
        fs.writeFileSync(path.join(phase2Dir, 'docs', 'migration-guide.md'), migrationGuide);
        
        log('✅ Phase 2 placeholders created', 'green');
    }

    async generateCleanupReport() {
        printSection('📊 Generating Cleanup Report');
        
        const report = {
            timestamp: new Date().toISOString(),
            phase: 'Phase 1 Cleanup Complete',
            actions: [
                'Created backup of current state',
                'Cleaned development artifacts',
                'Organized staging structure',
                'Prepared deployment configuration',
                'Created Phase 2 placeholders'
            ],
            directories: {
                backup: this.backupDir,
                staging: this.stagingDir,
                deployment: this.deploymentDir,
                phase2: path.join(this.rootDir, '..', 'phase2-production')
            },
            nextSteps: [
                'Review staging configuration',
                'Test deployment scripts',
                'Begin Phase 2 implementation',
                'Plan data migration strategy'
            ],
            readiness: {
                staging: true,
                deployment: true,
                phase2Transition: true
            }
        };
        
        const reportPath = path.join(this.rootDir, 'cleanup-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        log(`📄 Cleanup report generated: ${reportPath}`, 'blue');
        
        // Print summary
        log('\n📋 Cleanup Summary:', 'yellow');
        log(`   • Backup: ${this.backupDir}`, 'cyan');
        log(`   • Staging: ${this.stagingDir}`, 'cyan');
        log(`   • Deployment: ${this.deploymentDir}`, 'cyan');
        log(`   • Phase 2: ${path.join(this.rootDir, '..', 'phase2-production')}`, 'cyan');
    }

    // Helper methods
    copyRecursive(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                this.copyRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    removeRecursive(dir) {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }

    findFiles(dir, pattern) {
        const results = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                results.push(...this.findFiles(filePath, pattern));
            } else if (file.match(pattern)) {
                results.push(filePath);
            }
        }
        
        return results;
    }

    createDirectoryStructure(baseDir, structure) {
        for (const [key, value] of Object.entries(structure)) {
            const dirPath = path.join(baseDir, key);
            fs.mkdirSync(dirPath, { recursive: true });
            
            if (typeof value === 'object' && value !== null) {
                this.createDirectoryStructure(dirPath, value);
            }
        }
    }

    getPackageDependencies() {
        const packagePath = path.join(this.rootDir, 'package.json');
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return {
                dependencies: packageJson.dependencies || {},
                devDependencies: packageJson.devDependencies || {}
            };
        }
        return { dependencies: {}, devDependencies: {} };
    }
}

// Main execution
if (require.main === module) {
    const cleanup = new CodebaseCleanup();
    cleanup.performCleanup().catch(console.error);
}

module.exports = CodebaseCleanup;
