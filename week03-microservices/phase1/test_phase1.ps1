$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Phase 1 Services for Testing..."

# Start services in background jobs
$upload = Start-Job -ScriptBlock { python -m uvicorn services.upload.app.main:app --port 8001 --host 0.0.0.0 }
$processing = Start-Job -ScriptBlock { python -m uvicorn services.processing.app.main:app --port 8002 --host 0.0.0.0 }
$ai = Start-Job -ScriptBlock { python -m uvicorn services.ai.app.main:app --port 8003 --host 0.0.0.0 }
$gateway = Start-Job -ScriptBlock { python -m uvicorn services.gateway.app.main:app --port 8090 --host 0.0.0.0 }

try {
    Write-Host "⏳ Waiting for services to initialize (10s)..."
    Start-Sleep -Seconds 10
    
    Write-Host "🧪 Running Tests..."
    python -m pytest tests/ -v
}
finally {
    Write-Host "🛑 Stopping Services..."
    Stop-Job $upload
    Stop-Job $processing
    Stop-Job $ai
    Stop-Job $gateway
    Remove-Job $upload
    Remove-Job $processing
    Remove-Job $ai
    Remove-Job $gateway
    Write-Host "✅ Done."
}
