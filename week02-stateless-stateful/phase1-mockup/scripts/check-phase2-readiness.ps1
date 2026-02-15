# Phase 2 Readiness Check Script
# Validates Phase 2 production implementation readiness

param(
    [switch]$Verbose,
    [switch]$Detailed
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

class Phase2ReadinessChecker {
    [string]$RootDir
    [string]$Phase2Dir
    [hashtable]$ReadinessResults
    
    Phase2ReadinessChecker() {
        $this.RootDir = $PSScriptRoot | Split-Path -Parent
        $this.Phase2Dir = Join-Path (Split-Path $this.RootDir -Parent) "phase2-production"
        $this.ReadinessResults = @{
            Structure = 0
            Configuration = 0
            Dependencies = 0
            Documentation = 0
            Migration = 0
            Total = 0
            Ready = $false
            Issues = @()
        }
    }

    [void] CheckPhase2Readiness() {
        Write-Section "🔮 Phase 2 Readiness Assessment"
        
        # Check directory structure
        $this.ValidateDirectoryStructure()
        
        # Check configuration files
        $this.ValidateConfiguration()
        
        # Check dependencies
        $this.ValidateDependencies()
        
        # Check documentation
        $this.ValidateDocumentation()
        
        # Check migration readiness
        $this.ValidateMigrationReadiness()
        
        # Generate readiness report
        $this.GenerateReadinessReport()
    }

    [void] ValidateDirectoryStructure() {
        Write-ColorOutput "📁 Validating Phase 2 directory structure..." "Blue"
        
        $requiredStructure = @(
            "app/api/stateless",
            "app/api/stateful", 
            "app/api/shared",
            "app/core/config",
            "app/core/database",
            "app/core/redis",
            "app/core/security",
            "app/models",
            "app/schemas",
            "app/services",
            "deployment/docker",
            "deployment/kubernetes",
            "deployment/helm",
            "migrations",
            "tests/unit",
            "tests/integration",
            "tests/performance",
            "docs/api",
            "docs/deployment",
            "docs/architecture",
            "scripts"
        )
        
        foreach ($dir in $requiredStructure) {
            $dirPath = Join-Path $this.Phase2Dir $dir
            if (Test-Path $dirPath) {
                $this.ReadinessResults.Structure++
                Write-ColorOutput "✅ Directory exists: $dir" "Green"
            } else {
                $this.AddIssue("Required directory missing: $dir", "Structure")
                Write-ColorOutput "❌ Directory missing: $dir" "Red"
            }
        }
        
        $this.ReadinessResults.Total += $requiredStructure.Count
    }

    [void] ValidateConfiguration() {
        Write-ColorOutput "⚙️ Validating configuration files..." "Blue"
        
        # Check for main application file
        $mainAppPath = Join-Path $this.Phase2Dir "app/main.py"
        if (Test-Path $mainAppPath) {
            $this.ReadinessResults.Configuration++
            Write-ColorOutput "✅ Main application file exists" "Green"
        } else {
            $this.AddIssue("Main FastAPI application missing: app/main.py", "Configuration")
            Write-ColorOutput "❌ Main application file missing" "Red"
        }
        
        # Check for configuration files
        $configFiles = @(
            "app/core/config/settings.py",
            "app/core/config/database.py",
            "app/core/config/redis.py"
        )
        
        foreach ($file in $configFiles) {
            $filePath = Join-Path $this.Phase2Dir $file
            if (Test-Path $filePath) {
                $this.ReadinessResults.Configuration++
                Write-ColorOutput "✅ Config file exists: $file" "Green"
            } else {
                $this.AddIssue("Configuration file missing: $file", "Configuration")
                Write-ColorOutput "⚠️  Config file missing: $file" "Yellow"
            }
        }
        
        $this.ReadinessResults.Total += $configFiles.Count + 1
    }

    [void] ValidateDependencies() {
        Write-ColorOutput "📦 Validating dependencies..." "Blue"
        
        $requirementsPath = Join-Path $this.Phase2Dir "requirements.txt"
        
        if (-not (Test-Path $requirementsPath)) {
            $this.AddIssue("requirements.txt missing", "Dependencies")
            Write-ColorOutput "❌ requirements.txt missing" "Red"
            return
        }
        
        try {
            $requirements = Get-Content $requirementsPath
            $requiredPackages = @(
                "fastapi",
                "uvicorn",
                "sqlalchemy",
                "alembic",
                "psycopg2-binary",
                "redis",
                "pydantic",
                "pytest"
            )
            
            foreach ($package in $requiredPackages) {
                if ($requirements -match "^$package==") {
                    $this.ReadinessResults.Dependencies++
                    Write-ColorOutput "✅ Package specified: $package" "Green"
                } else {
                    $this.AddIssue("Required package missing: $package", "Dependencies")
                    Write-ColorOutput "❌ Package missing: $package" "Red"
                }
            }
            
        } catch {
            $this.AddIssue("Error reading requirements.txt: $($_.Exception.Message)", "Dependencies")
            Write-ColorOutput "❌ Error reading requirements.txt" "Red"
        }
        
        $this.ReadinessResults.Total += $requiredPackages.Count
    }

    [void] ValidateDocumentation() {
        Write-ColorOutput "📚 Validating documentation..." "Blue"
        
        $requiredDocs = @(
            "README.md",
            "docs/api/README.md",
            "docs/deployment/README.md",
            "docs/architecture/README.md",
            "docs/migration-guide.md"
        )
        
        foreach ($doc in $requiredDocs) {
            $docPath = Join-Path $this.Phase2Dir $doc
            if (Test-Path $docPath) {
                $this.ReadinessResults.Documentation++
                Write-ColorOutput "✅ Documentation exists: $doc" "Green"
            } else {
                $this.AddIssue("Documentation missing: $doc", "Documentation")
                Write-ColorOutput "⚠️  Documentation missing: $doc" "Yellow"
            }
        }
        
        $this.ReadinessResults.Total += $requiredDocs.Count
    }

    [void] ValidateMigrationReadiness() {
        Write-ColorOutput "🔄 Validating migration readiness..." "Blue"
        
        # Check for migration scripts
        $migrationFiles = @(
            "migrations/env.py",
            "migrations/script.py.mako",
            "migrations/alembic.ini"
        )
        
        foreach ($file in $migrationFiles) {
            $filePath = Join-Path $this.Phase2Dir $file
            if (Test-Path $filePath) {
                $this.ReadinessResults.Migration++
                Write-ColorOutput "✅ Migration file exists: $file" "Green"
            } else {
                $this.AddIssue("Migration file missing: $file", "Migration")
                Write-ColorOutput "⚠️  Migration file missing: $file" "Yellow"
            }
        }
        
        # Check for data migration utilities
        $migrationUtils = Join-Path $this.Phase2Dir "scripts/migrate-data.py"
        if (Test-Path $migrationUtils) {
            $this.ReadinessResults.Migration++
            Write-ColorOutput "✅ Data migration utility exists" "Green"
        } else {
            $this.AddIssue("Data migration utility missing", "Migration")
            Write-ColorOutput "⚠️  Data migration utility missing" "Yellow"
        }
        
        $this.ReadinessResults.Total += $migrationFiles.Count + 1
    }

    [void] AddIssue([string]$Message, [string]$Category) {
        $this.ReadinessResults.Issues += @{
            Message = $Message
            Category = $Category
            Severity = if ($Category -eq "Structure") { "Critical" } elseif ($Category -eq "Configuration") { "High" } elseif ($Category -eq "Dependencies") { "High" } elseif ($Category -eq "Migration") { "Medium" } else { "Low" }
        }
    }

    [void] GenerateReadinessReport() {
        Write-Section "📊 Phase 2 Readiness Report"
        
        # Calculate readiness percentage
        $totalChecks = $this.ReadinessResults.Structure + $this.ReadinessResults.Configuration + $this.ReadinessResults.Dependencies + $this.ReadinessResults.Documentation + $this.ReadinessResults.Migration
        $passedChecks = $this.ReadinessResults.Structure + $this.ReadinessResults.Configuration + $this.ReadinessResults.Dependencies + $this.ReadinessResults.Documentation + $this.ReadinessResults.Migration
        
        if ($totalChecks -gt 0) {
            $readinessPercentage = [math]::Round(($passedChecks / $totalChecks) * 100, 1)
        } else {
            $readinessPercentage = 0
        }
        
        # Determine overall readiness
        $this.ReadinessResults.Ready = $readinessPercentage -ge 75
        
        Write-ColorOutput "Readiness Assessment:" "Yellow"
        Write-ColorOutput "  📁 Structure: $($this.ReadinessResults.Structure)/$($requiredStructure.Count) checks passed" "Cyan"
        Write-ColorOutput "  ⚙️  Configuration: $($this.ReadinessResults.Configuration)/$($configFiles.Count + 1) checks passed" "Cyan"
        Write-ColorOutput "  📦 Dependencies: $($this.ReadinessResults.Dependencies)/$($requiredPackages.Count) checks passed" "Cyan"
        Write-ColorOutput "  📚 Documentation: $($this.ReadinessResults.Documentation)/$($requiredDocs.Count) checks passed" "Cyan"
        Write-ColorOutput "  🔄 Migration: $($this.ReadinessResults.Migration)/$($migrationFiles.Count + 1) checks passed" "Cyan"
        Write-Host ""
        Write-ColorOutput "  📈 Overall Readiness: $readinessPercentage%" "Magenta"
        
        # Issues summary
        if ($this.ReadinessResults.Issues.Count -gt 0) {
            Write-Host ""
            Write-ColorOutput "🚨 Issues Found:" "Red"
            
            $groupedIssues = $this.ReadinessResults.Issues | Group-Object -Property Category
            
            foreach ($category in $groupedIssues.GetEnumerator()) {
                Write-ColorOutput "  $($category.Name):" "Yellow"
                foreach ($issue in $category.Group) {
                    Write-ColorOutput "    • $($issue.Message)" "Red"
                }
            }
        }
        
        # Overall assessment
        Write-Host ""
        if ($this.ReadinessResults.Ready) {
            Write-ColorOutput "🎉 PHASE 2 IS READY FOR IMPLEMENTATION!" "Green"
            Write-ColorOutput "✅ Directory structure complete" "Green"
            Write-ColorOutput "✅ Dependencies specified" "Green"
            Write-ColorOutput "✅ Migration path clear" "Green"
        } elseif ($readinessPercentage -ge 50) {
            Write-ColorOutput "⚠️  PHASE 2 PARTIALLY READY" "Yellow"
            Write-ColorOutput "🔧 Some components need attention before implementation" "Yellow"
        } else {
            Write-ColorOutput "❌ PHASE 2 NOT READY" "Red"
            Write-ColorOutput "🚧 Significant setup required before implementation" "Red"
        }
        
        # Recommendations
        Write-Host ""
        Write-ColorOutput "📋 Recommendations:" "Blue"
        
        if ($this.ReadinessResults.Structure -lt $requiredStructure.Count) {
            Write-ColorOutput "  • Complete directory structure setup" "Yellow"
        }
        
        if ($this.ReadinessResults.Configuration -lt ($configFiles.Count + 1)) {
            Write-ColorOutput "  • Create FastAPI application structure" "Yellow"
        }
        
        if ($this.ReadinessResults.Dependencies -lt $requiredPackages.Count) {
            Write-ColorOutput "  • Review and complete requirements.txt" "Yellow"
        }
        
        if ($this.ReadinessResults.Migration -lt ($migrationFiles.Count + 1)) {
            Write-ColorOutput "  • Develop migration utilities and scripts" "Yellow"
        }
        
        Write-ColorOutput "  • Begin with core FastAPI application" "Green"
        Write-ColorOutput "  • Implement database models and migrations" "Green"
        Write-ColorOutput "  • Set up Redis session management" "Green"
        Write-ColorOutput "  • Create Docker containerization" "Green"
        
        # Save readiness report
        $report = @{
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            readiness = @{
                percentage = $readinessPercentage
                structure = @{
                    passed = $this.ReadinessResults.Structure
                    total = $requiredStructure.Count
                }
                configuration = @{
                    passed = $this.ReadinessResults.Configuration
                    total = $configFiles.Count + 1
                }
                dependencies = @{
                    passed = $this.ReadinessResults.Dependencies
                    total = $requiredPackages.Count
                }
                documentation = @{
                    passed = $this.ReadinessResults.Documentation
                    total = $requiredDocs.Count
                }
                migration = @{
                    passed = $this.ReadinessResults.Migration
                    total = $migrationFiles.Count + 1
                }
            }
            issues = $this.ReadinessResults.Issues
            ready = $this.ReadinessResults.Ready
            recommendations = @(
                "Start with FastAPI application skeleton",
                "Implement database models using SQLAlchemy",
                "Set up Redis for session management",
                "Create Docker containerization",
                "Develop migration utilities"
            )
        }
        
        $reportPath = Join-Path $this.RootDir "phase2-readiness-report.json"
        $report | ConvertTo-Json -Depth 10 | Set-Content -Path $reportPath
        
        Write-ColorOutput "📄 Readiness report saved: $reportPath" "Blue"
    }
}

# Main execution
try {
    $checker = [Phase2ReadinessChecker]::new()
    $checker.CheckPhase2Readiness()
} catch {
    Write-ColorOutput "❌ Readiness check failed: $($_.Exception.Message)" "Red"
    exit 1
}
