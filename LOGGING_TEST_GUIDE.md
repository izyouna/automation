# Testing Nginx Logging: Quick Start Guide

## 🚀 Quick Test (5 minutes)

### Step 1: Start the Services
```bash
cd d:\boonsup\automation\mockup-infra
docker-compose up -d
```

### Step 2: Wait for Startup
```bash
# Wait ~5 seconds
sleep 5

# Verify nginx is running
docker-compose ps | grep mockup-gateway
```

### Step 3: Generate Test Traffic

#### Success Request (HTTP 200 - Will be logged)
```bash
# From host
curl -s http://localhost:8080/ | head -20

# Or from container
docker exec mime-client curl -s http://mockup-gateway:80/
```

#### Success Request (HTTPS 200)
```bash
# From host (ignore cert warning)
curl -k https://localhost/status | head -20

# Or from container
docker exec mime-client curl -k https://mockup-gateway:443/status
```

#### Failure Request (404 - Will be logged to connection_error.log)
```bash
# From host
curl -s http://localhost:8080/invalid-path

# From container
docker exec mime-client curl http://mockup-gateway/invalid
```

### Step 4: View the Logs

#### View Main Access Log (Real-time)
```bash
docker exec mockup-gateway tail -f /var/log/nginx/access.log
```

#### View Audit Log (JSON Format)
```bash
docker exec mockup-gateway tail -f /var/log/nginx/audit.log | jq .
```

#### View Error Log
```bash
docker exec mockup-gateway tail -f /var/log/nginx/connection_error.log | jq .
```

#### View SSL Connections
```bash
docker exec mockup-gateway tail -f /var/log/nginx/intranet_ssl.log | jq .
```

---

## 🔍 Detailed Testing

### Test 1: HTTP Success Logging
```bash
# Make request
curl http://localhost:8080/

# Check all logs were written
docker exec mockup-gateway bash -c 'wc -l /var/log/nginx/*.log'

# View the audit entry
docker exec mockup-gateway tail -1 /var/log/nginx/public_app_audit.log | jq .
```

**Expected Result:** Entry with `"response_status": 200`

---

### Test 2: HTTPS Success with SSL Details
```bash
# Make HTTPS request (ignore self-signed warning)
curl -k https://localhost/status

# View audit log
docker exec mockup-gateway tail -1 /var/log/nginx/intranet_api_audit.log | jq .

# View SSL connection details
docker exec mockup-gateway tail -1 /var/log/nginx/intranet_ssl.log | jq .
```

**Expected Result:** 
- SSL log shows `"ssl_protocol": "TLSv1.3"`
- Audit log shows `"response_status": 200`

---

### Test 3: Failed Request (404 Error)
```bash
# Request non-existent endpoint
curl http://localhost:8080/nonexistent

# View error log
docker exec mockup-gateway grep "nonexistent" /var/log/nginx/connection_error.log | jq .

# Or check access log
docker exec mockup-gateway grep "nonexistent" /var/log/nginx/access.log
```

**Expected Result:** Error entry in `connection_error.log` with `"status": 404`

---

### Test 4: Service Failure (502 - Upstream Error)
```bash
# Stop the backend service
docker-compose stop public_app

# Make request (should fail)
curl http://localhost:8080/

# Check error log
docker exec mockup-gateway grep "502" /var/log/nginx/connection_error.log | jq .

# Restart service
docker-compose up -d public_app
```

**Expected Result:** Error log shows `"status": 502`, `"upstream_status": "0"` or timeout

---

### Test 5: Multiple Requests (Audit Trail)
```bash
# Generate 5 requests
for i in {1..5}; do 
  curl -s http://localhost:8080/ > /dev/null
done

# View all in audit log
docker exec mockup-gateway grep '200' /var/log/nginx/public_app_audit.log | \
  jq -s '.[].timestamp'
```

**Expected Result:** 5 consecutively timestamped entries

---

## 📊 Log File Verification

### Check All Log Files Exist
```bash
docker exec mockup-gateway bash -c 'echo "=== Log Files ===" && ls -lh /var/log/nginx/*.log 2>/dev/null | wc -l && echo "total files"'
```

**Expected:**
```
15 total files  # All log files created
```

### View File Sizes
```bash
docker exec mockup-gateway bash -c 'du -h /var/log/nginx/ | sort -h'
```

### Show Log File Names
```bash
docker exec mockup-gateway ls -1 /var/log/nginx/*.log
```

**Expected Output:**
```
access.log
audit.log
connection_error.log
error.log
ssl_connection.log
public_app.log
public_app_audit.log
public_app_error.log
intranet_api.log
intranet_api_audit.log
intranet_api_error.log
intranet_ssl.log
status_endpoint.log
status_endpoint_audit.log
data_endpoint.log
data_endpoint_audit.log
config_endpoint.log
config_endpoint_audit.log
health_check.log
health_check_https.log
not_found.log
```

---

## 🔎 Advanced Log Analysis

### Count Requests by Status Code
```bash
docker exec mockup-gateway jq '.response_status' /var/log/nginx/audit.log | sort | uniq -c
```

### Find Requests > 1 Second
```bash
docker exec mockup-gateway jq 'select(.request_time > 1.0)' /var/log/nginx/audit.log
```

### See All Client IPs
```bash
docker exec mockup-gateway jq -r '.client_ip' /var/log/nginx/audit.log | sort -u
```

### Failed Requests Only
```bash
docker exec mockup-gateway jq 'select(.response_status >= 400)' /var/log/nginx/audit.log | jq '.timestamp, .response_status, .request_uri'
```

### SSL Protocol Distribution
```bash
docker exec mockup-gateway jq -r '.ssl_protocol' /var/log/nginx/intranet_ssl.log | sort | uniq -c
```

### Top Endpoints
```bash
docker exec mockup-gateway jq -r '.request_uri' /var/log/nginx/audit.log | sort | uniq -c | sort -rn
```

---

## 🔧 Troubleshooting

### No Logs Being Created?
```bash
# Check if nginx container is running
docker-compose ps

# Check error log for startup issues
docker logs mockup-gateway

# Verify log directory permissions
docker exec mockup-gateway ls -la /var/log/nginx/
```

### Logs Not Updating?
```bash
# Check if nginx worker is running
docker exec mockup-gateway ps aux | grep nginx

# Reload nginx to apply config changes
docker exec mockup-gateway nginx -s reload

# Check nginx syntax
docker exec mockup-gateway nginx -t
```

### Permission Denied Writing Logs?
```bash
# Reset permissions
docker exec mockup-gateway chmod 777 /var/log/nginx

# Restart nginx
docker-compose restart mockup-gateway
```

---

## 📈 Monitoring Commands

### Real-time Request Rate
```bash
# Monitor for 10 seconds, update every 2 seconds
watch -n 2 'docker exec mockup-gateway wc -l /var/log/nginx/access.log'
```

### Live Tail of All Activity
```bash
docker exec mockup-gateway bash -c 'tail -f /var/log/nginx/audit.log' | jq '.client_ip, .request_method, .request_uri, .response_status'
```

### Error Rate Monitoring
```bash
# Count errors every 5 seconds
watch -n 5 'docker exec mockup-gateway bash -c "echo \"5xx: \$(grep -c \\"\\\"response_status\\\": 5\\" /var/log/nginx/audit.log || echo 0) | 4xx: \$(grep -c \\"\\\"response_status\\\": 4\\" /var/log/nginx/audit.log || echo 0)\""'
```

---

## 📋 Test Checklist

- [ ] HTTP success (200) logged to access.log
- [ ] HTTP success (200) logged to audit.log with full details
- [ ] HTTPS success (200) logged with SSL details
- [ ] 404 error logged to connection_error.log
- [ ] Upstream error (502) logged to connection_error.log
- [ ] Client IP correctly logged
- [ ] Timestamps in ISO 8601 format
- [ ] All log files created (15+ files)
- [ ] Audit.log entries are valid JSON
- [ ] Request IDs are unique and consistent
- [ ] Request times recorded accurately
- [ ] Upstream backend info captured
- [ ] SSL protocol and cipher logged
- [ ] Per-endpoint logs distinguish requests
- [ ] Error reasons clear in error log

---

## 🚀 Next Steps

1. **Deploy to Production:**
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

2. **Archive Logs Daily:**
   Create a cron job to backup logs (see LOGGING_COMPLIANCE.md)

3. **Monitor in Real-time:**
   ```bash
   docker exec mockup-gateway tail -f /var/log/nginx/audit.log | jq .
   ```

4. **Review Compliance:**
   ```bash
   cat mockup-infra/LOGGING_COMPLIANCE.md
   ```

---

**All logging configured and tested for Thailand Digital Crime Act compliance!** ✅
