#!/bin/bash
# Nginx Gateway Health Check
# Tests HTTP and HTTPS endpoints

echo "Checking Nginx gateway..."

# HTTP health check
if curl -sf http://localhost:80/status > /dev/null 2>&1; then
    echo "[OK] HTTP health check passed"
else
    echo "[FAIL] HTTP health check failed"
    exit 1
fi

# HTTPS health check
if curl -sf https://localhost:443/status --insecure > /dev/null 2>&1; then
    echo "[OK] HTTPS health check passed"
else
    echo "[FAIL] HTTPS health check failed"
    exit 1
fi

echo "[OK] Gateway health verified"
exit 0
