# Staging Configuration Validation Script
# Reviews and validates the staging setup and deployment configuration

param(
    [switch]$Verbose,
    [switch]$Fix
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

class StagingValidator {
    [string]$RootDir
    [string]$StagingDir
    [string]$DeploymentDir
    [hashtable]$ValidationResults
    
    StagingValidator() {
        $this.RootDir = $PSScriptRoot | Split-Path -Parent
        $this.StagingDir = Join-Path $this.RootDir ".staging"
        $this.DeploymentDir = Join-Path $this.RootDir ".deployment"
        $this.ValidationResults = @{
            Passed = 0
            Failed = 0
            Warnings = 0
            Issues = @()
        }
    }

    [void] ValidateStagingSetup() {
        Write-Section "🔍 Staging Configuration Review"
        
        # Check staging configuration file
        $this.ValidateStagingConfig()
        
        # Check staged application structure
        $this.ValidateStagedApplication()
        
        # Check dependencies and compatibility
        $this.ValidateDependencies()
        
        # Check security configuration
        $this.ValidateSecurityConfig()
        
        # Check monitoring setup
        $this.ValidateMonitoringConfig()
        
        # Check deployment readiness
        $this.ValidateDeploymentReadiness()
    }

    [void] ValidateStagingConfig() {
        Write-ColorOutput "📋 Validating staging configuration..." "Blue"
        
        $configPath = Join-Path $this.StagingDir "staging-config.json"
        
        if (-not (Test-Path $configPath)) {
            $this.AddIssue("Staging config file missing", "Failed")
            return
        }
        
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            
            # Validate environment
            if ($config.environment -ne "staging") {
                $this.AddIssue("Environment should be 'staging'", "Failed")
            } else {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Environment configuration correct" "Green"
            }
            
            # Validate Node.js version
            if ($config.build.nodeVersion -notmatch "^2[4-9]\.") {
                $this.AddIssue("Node.js version should be 24.x or higher", "Warning")
            } else {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Node.js version compatible" "Green"
            }
            
            # Validate server configuration
            if ($config.servers.stateless.port -ne 3001) {
                $this.AddIssue("Stateless server port should be 3001", "Failed")
            } else {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Stateless server port correct" "Green"
            }
            
            if ($config.servers.stateful.port -ne 3002) {
                $this.AddIssue("Stateful server port should be 3002", "Failed")
            } else {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Stateful server port correct" "Green"
            }
            
            # Validate security settings
            if (-not $config.security.cors.enabled) {
                $this.AddIssue("CORS should be enabled in staging", "Warning")
            }
            
            if ($config.security.rateLimit.enabled) {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Rate limiting configured" "Green"
            } else {
                $this.AddIssue("Rate limiting should be enabled", "Warning")
            }
            
        } catch {
            $this.AddIssue("Invalid staging config JSON: $($_.Exception.Message)", "Failed")
        }
    }

    [void] ValidateStagedApplication() {
        Write-ColorOutput "📁 Validating staged application structure..." "Blue"
        
        $requiredDirs = @(
            "app/src",
            "app/config", 
            "app/docs",
            "app/tests",
            "deployment/docker",
            "deployment/scripts"
        )
        
        foreach ($dir in $requiredDirs) {
            $dirPath = Join-Path $this.StagingDir $dir
            if (Test-Path $dirPath) {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Directory exists: $dir" "Green"
            } else {
                $this.AddIssue("Required directory missing: $dir", "Failed")
            }
        }
        
        # Check critical files
        $requiredFiles = @(
            "app/package.json",
            "app/server.js",
            "app/README.md"
        )
        
        foreach ($file in $requiredFiles) {
            $filePath = Join-Path $this.StagingDir $file
            if (Test-Path $filePath) {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ File exists: $file" "Green"
            } else {
                $this.AddIssue("Required file missing: $file", "Failed")
            }
        }
    }

    [void] ValidateDependencies() {
        Write-ColorOutput "📦 Validating dependencies..." "Blue"
        
        $packagePath = Join-Path $this.StagingDir "app/package.json"
        
        if (-not (Test-Path $packagePath)) {
            $this.AddIssue("package.json not found in staging", "Failed")
            return
        }
        
        try {
            $package = Get-Content $packagePath -Raw | ConvertFrom-Json
            
            # Check required dependencies
            $requiredDeps = @("express", "cors", "helmet", "morgan", "uuid")
            foreach ($dep in $requiredDeps) {
                if ($package.dependencies.PSObject.Properties.Name -contains $dep) {
                    $this.ValidationResults.Passed++
                    Write-ColorOutput "✅ Dependency present: $dep" "Green"
                } else {
                    $this.AddIssue("Required dependency missing: $dep", "Failed")
                }
            }
            
            # Check Node.js engine compatibility
            if ($package.engines.node) {
                $nodeVersion = $package.engines.node
                if ($nodeVersion -match ">=18") {
                    $this.ValidationResults.Passed++
                    Write-ColorOutput "✅ Node.js engine requirement compatible" "Green"
                } else {
                    $this.AddIssue("Node.js engine should be >=18", "Warning")
                }
            } else {
                $this.AddIssue("Node.js engine requirement not specified", "Warning")
            }
            
        } catch {
            $this.AddIssue("Invalid package.json: $($_.Exception.Message)", "Failed")
        }
    }

    [void] ValidateSecurityConfig() {
        Write-ColorOutput "🔒 Validating security configuration..." "Blue"
        
        $configPath = Join-Path $this.StagingDir "staging-config.json"
        
        if (-not (Test-Path $configPath)) {
            $this.AddIssue("Cannot validate security - config missing", "Failed")
            return
        }
        
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            
            # Check CORS origins
            if ($config.security.cors.origins -contains "https://staging.example.com") {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Staging CORS origin configured" "Green"
            } else {
                $this.AddIssue("Staging CORS origin not configured", "Warning")
            }
            
            # Check rate limiting
            if ($config.security.rateLimit.enabled -and $config.security.rateLimit.max -le 100) {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Rate limiting appropriately configured" "Green"
            } else {
                $this.AddIssue("Rate limiting should be enabled with reasonable limits", "Warning")
            }
            
            # Check helmet security
            if ($config.security.helmet.enabled) {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Helmet security headers enabled" "Green"
            } else {
                $this.AddIssue("Helmet security headers should be enabled", "Warning")
            }
            
        } catch {
            $this.AddIssue("Security validation failed: $($_.Exception.Message)", "Failed")
        }
    }

    [void] ValidateMonitoringConfig() {
        Write-ColorOutput "📊 Validating monitoring configuration..." "Blue"
        
        $configPath = Join-Path $this.StagingDir "staging-config.json"
        
        if (-not (Test-Path $configPath)) {
            $this.AddIssue("Cannot validate monitoring - config missing", "Failed")
            return
        }
        
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            
            # Check metrics endpoint
            if ($config.monitoring.metrics.enabled) {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Metrics collection enabled" "Green"
            } else {
                $this.AddIssue("Metrics collection should be enabled in staging", "Warning")
            }
            
            # Check health checks
            if ($config.monitoring.healthChecks.enabled) {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Health checks configured" "Green"
            } else {
                $this.AddIssue("Health checks should be enabled", "Warning")
            }
            
            # Check logging configuration
            if ($config.logging.level -eq "info") {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Logging level appropriate for staging" "Green"
            } else {
                $this.AddIssue("Logging level should be 'info' for staging", "Warning")
            }
            
        } catch {
            $this.AddIssue("Monitoring validation failed: $($_.Exception.Message)", "Failed")
        }
    }

    [void] ValidateDeploymentReadiness() {
        Write-ColorOutput "🚀 Validating deployment readiness..." "Blue"
        
        # Check Dockerfile
        $dockerfilePath = Join-Path $this.DeploymentDir "docker/Dockerfile"
        if (Test-Path $dockerfilePath) {
            $dockerfile = Get-Content $dockerfilePath -Raw
            
            if ($dockerfile -match "FROM node:24-alpine") {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Dockerfile uses correct Node.js version" "Green"
            } else {
                $this.AddIssue("Dockerfile should use node:24-alpine", "Failed")
            }
            
            if ($dockerfile -match "EXPOSE 3001 3002") {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Dockerfile exposes correct ports" "Green"
            } else {
                $this.AddIssue("Dockerfile should expose ports 3001 and 3002", "Failed")
            }
            
            if ($dockerfile -match "HEALTHCHECK") {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Dockerfile includes health check" "Green"
            } else {
                $this.AddIssue("Dockerfile should include health check", "Warning")
            }
            
            if ($dockerfile -match "USER nodejs") {
                $this.ValidationResults.Passed++
                Write-ColorOutput "✅ Dockerfile runs as non-root user" "Green"
            } else {
                $this.AddIssue("Dockerfile should run as non-root user", "Warning")
            }
            
        } else {
            $this.AddIssue("Dockerfile not found", "Failed")
        }
        
        # Check docker-compose.yml
        $composePath = Join-Path $this.DeploymentDir "docker-compose.yml"
        if (Test-Path $composePath) {
            $this.ValidationResults.Passed++
            Write-ColorOutput "✅ Docker Compose file exists" "Green"
        } else {
            $this.AddIssue("Docker Compose file missing", "Warning")
        }
        
        # Check deployment scripts
        $deployScriptPath = Join-Path $this.DeploymentDir "scripts/deploy.sh"
        if (Test-Path $deployScriptPath) {
            $this.ValidationResults.Passed++
            Write-ColorOutput "✅ Deployment script exists" "Green"
        } else {
            $this.AddIssue("Deployment script missing", "Warning")
        }
    }

    [void] AddIssue([string]$Message, [string]$Severity) {
        $this.ValidationResults.Issues += @{
            Message = $Message
            Severity = $Severity
        }
        
        switch ($Severity) {
            "Failed" { 
                $this.ValidationResults.Failed++
                Write-ColorOutput "❌ $Message" "Red"
            }
            "Warning" { 
                $this.ValidationResults.Warnings++
                Write-ColorOutput "⚠️  $Message" "Yellow"
            }
        }
    }

    [void] GenerateReport() {
        Write-Section "📊 Staging Validation Report"
        
        Write-ColorOutput "Results Summary:" "Yellow"
        Write-ColorOutput "  ✅ Passed: $($this.ValidationResults.Passed)" "Green"
        Write-ColorOutput "  ⚠️  Warnings: $($this.ValidationResults.Warnings)" "Yellow"
        Write-ColorOutput "  ❌ Failed: $($this.ValidationResults.Failed)" "Red"
        
        $total = $this.ValidationResults.Passed + $this.ValidationResults.Warnings + $this.ValidationResults.Failed
        $successRate = if ($total -gt 0) { [math]::Round(($this.ValidationResults.Passed / $total) * 100, 1) } else { 0 }
        
        Write-ColorOutput "  📈 Success Rate: $successRate%" "Cyan"
        
        if ($this.ValidationResults.Failed -gt 0) {
            Write-Host ""
            Write-ColorOutput "❌ Failed Issues:" "Red"
            foreach ($issue in $this.ValidationResults.Issues | Where-Object { $_.Severity -eq "Failed" }) {
                Write-ColorOutput "  • $($issue.Message)" "Red"
            }
        }
        
        if ($this.ValidationResults.Warnings -gt 0) {
            Write-Host ""
            Write-ColorOutput "⚠️  Warnings:" "Yellow"
            foreach ($issue in $this.ValidationResults.Issues | Where-Object { $_.Severity -eq "Warning" }) {
                Write-ColorOutput "  • $($issue.Message)" "Yellow"
            }
        }
        
        # Overall assessment
        Write-Host ""
        if ($this.ValidationResults.Failed -eq 0) {
            if ($this.ValidationResults.Warnings -le 2) {
                Write-ColorOutput "🎉 STAGING SETUP READY FOR DEPLOYMENT!" "Green"
            } else {
                Write-ColorOutput "✅ Staging setup ready with minor warnings" "Green"
            }
        } else {
            Write-ColorOutput "❌ STAGING SETUP NEEDS FIXES BEFORE DEPLOYMENT" "Red"
        }
        
        # Save report
        $report = @{
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            validation = @{
                passed = $this.ValidationResults.Passed
                failed = $this.ValidationResults.Failed
                warnings = $this.ValidationResults.Warnings
                successRate = $successRate
            }
            issues = $this.ValidationResults.Issues
            ready = $this.ValidationResults.Failed -eq 0
        }
        
        $reportPath = Join-Path $this.RootDir "staging-validation-report.json"
        $report | ConvertTo-Json -Depth 10 | Set-Content -Path $reportPath
        
        Write-ColorOutput "📄 Validation report saved: $reportPath" "Blue"
    }
}

# Main execution
try {
    $validator = [StagingValidator]::new()
    $validator.ValidateStagingSetup()
    $validator.GenerateReport()
} catch {
    Write-ColorOutput "❌ Validation failed: $($_.Exception.Message)" "Red"
    exit 1
}
