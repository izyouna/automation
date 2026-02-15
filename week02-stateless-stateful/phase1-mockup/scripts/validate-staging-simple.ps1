# Simple Staging Validation Script

$RootDir = $PSScriptRoot | Split-Path -Parent
$StagingDir = Join-Path $RootDir ".staging"
$DeploymentDir = Join-Path $RootDir ".deployment"

Write-Host "🔍 Staging Configuration Review" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Validation counters
$Passed = 0
$Failed = 0
$Warnings = 0

function Test-File {
    param($Path, $Description)
    
    if (Test-Path $Path) {
        Write-Host "✅ $Description" -ForegroundColor Green
        $script:Passed++
        return $true
    } else {
        Write-Host "❌ $Description" -ForegroundColor Red
        $script:Failed++
        return $false
    }
}

function Test-Config {
    param($Path, $Description)
    
    if (Test-Path $Path) {
        try {
            $content = Get-Content $Path -Raw | ConvertFrom-Json
            Write-Host "✅ $Description" -ForegroundColor Green
            $script:Passed++
            return $content
        } catch {
            Write-Host "❌ $Description (Invalid JSON)" -ForegroundColor Red
            $script:Failed++
            return $null
        }
    } else {
        Write-Host "❌ $Description (Missing)" -ForegroundColor Red
        $script:Failed++
        return $null
    }
}

# Test staging configuration
Write-Host "`n📋 Validating staging configuration..." -ForegroundColor Blue
$config = Test-Config "$StagingDir\staging-config.json" "Staging configuration file"

if ($config) {
    if ($config.environment -eq "staging") {
        Write-Host "✅ Environment set to staging" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ Environment should be 'staging'" -ForegroundColor Red
        $Failed++
    }
    
    if ($config.servers.stateless.port -eq 3001) {
        Write-Host "✅ Stateless server port correct" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ Stateless server port should be 3001" -ForegroundColor Red
        $Failed++
    }
    
    if ($config.servers.stateful.port -eq 3002) {
        Write-Host "✅ Stateful server port correct" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ Stateful server port should be 3002" -ForegroundColor Red
        $Failed++
    }
}

# Test directory structure
Write-Host "`n📁 Validating staged application structure..." -ForegroundColor Blue

Test-File "$StagingDir\app\src" "Source directory"
Test-File "$StagingDir\app\config" "Config directory"
Test-File "$StagingDir\app\docs" "Docs directory"
Test-File "$StagingDir\app\tests" "Tests directory"
Test-File "$StagingDir\deployment\docker" "Docker directory"
Test-File "$StagingDir\deployment\scripts" "Scripts directory"

# Test critical files
Write-Host "`n📄 Validating critical files..." -ForegroundColor Blue

Test-File "$StagingDir\app\package.json" "Package.json"
Test-File "$StagingDir\app\server.js" "Server.js"
Test-File "$StagingDir\app\README.md" "README.md"

# Test deployment files
Write-Host "`n🚀 Validating deployment readiness..." -ForegroundColor Blue

$dockerfile = Test-File "$DeploymentDir\docker\Dockerfile" "Dockerfile"
if ($dockerfile) {
    $content = Get-Content "$DeploymentDir\docker\Dockerfile" -Raw
    if ($content -match "FROM node:24-alpine") {
        Write-Host "✅ Dockerfile uses Node.js 24-alpine" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ Dockerfile should use node:24-alpine" -ForegroundColor Red
        $Failed++
    }
    
    if ($content -match "EXPOSE 3001 3002") {
        Write-Host "✅ Dockerfile exposes correct ports" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ Dockerfile should expose ports 3001 and 3002" -ForegroundColor Red
        $Failed++
    }
}

Test-File "$DeploymentDir\docker-compose.yml" "Docker Compose file"
Test-File "$DeploymentDir\scripts\deploy.sh" "Deployment script"

# Test dependencies
Write-Host "`n📦 Validating dependencies..." -ForegroundColor Blue

$packagePath = "$StagingDir\app\package.json"
if (Test-Path $packagePath) {
    try {
        $package = Get-Content $packagePath -Raw | ConvertFrom-Json
        
        $requiredDeps = @("express", "cors", "helmet", "morgan", "uuid")
        foreach ($dep in $requiredDeps) {
            if ($package.dependencies.PSObject.Properties.Name -contains $dep) {
                Write-Host "✅ Dependency present: $dep" -ForegroundColor Green
                $Passed++
            } else {
                Write-Host "❌ Required dependency missing: $dep" -ForegroundColor Red
                $Failed++
            }
        }
    } catch {
        Write-Host "❌ Invalid package.json format" -ForegroundColor Red
        $Failed++
    }
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    $Failed++
}

# Generate report
Write-Host "`n📊 Staging Validation Report" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Write-Host "Results Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Passed: $Passed" -ForegroundColor Green
Write-Host "  ❌ Failed: $Failed" -ForegroundColor Red

$total = $Passed + $Failed
$successRate = if ($total -gt 0) { [math]::Round(($Passed / $total) * 100, 1) } else { 0 }

Write-Host "  📈 Success Rate: $successRate%" -ForegroundColor Cyan

if ($Failed -eq 0) {
    Write-Host "`n🎉 STAGING SETUP READY FOR DEPLOYMENT!" -ForegroundColor Green
} else {
    Write-Host "`n❌ STAGING SETUP NEEDS FIXES BEFORE DEPLOYMENT" -ForegroundColor Red
}

# Save report
$report = @{
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    validation = @{
        passed = $Passed
        failed = $Failed
        successRate = $successRate
    }
    ready = $Failed -eq 0
}

$reportPath = Join-Path $RootDir "staging-validation-report.json"
$report | ConvertTo-Json -Depth 10 | Set-Content -Path $reportPath

Write-Host "📄 Validation report saved: $reportPath" -ForegroundColor Blue
