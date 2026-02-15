# Mockup-Gateway Logging - Quick Reference

## View Logs in Real-Time

```bash
# Stateless API access logs
podman exec mockup-gateway tail -f /var/log/nginx/stateless_api.log

# Stateful API access logs
podman exec mockup-gateway tail -f /var/log/nginx/stateful_api.log

# Stateless API detailed audit (JSON)
podman exec mockup-gateway tail -f /var/log/nginx/stateless_api_audit.log

# Stateful API detailed audit (JSON)
podman exec mockup-gateway tail -f /var/log/nginx/stateful_api_audit.log

# All error logs
podman exec mockup-gateway tail -f /var/log/nginx/error.log
```

## View Logs (One-Time)

```bash
# List all log files
podman exec mockup-gateway ls -lah /var/log/nginx/

# Show stateless API log
podman exec mockup-gateway cat /var/log/nginx/stateless_api.log

# Show stateful API audit log (pretty-print)
podman exec mockup-gateway cat /var/log/nginx/stateful_api_audit.log | jq '.'

# Count requests
podman exec mockup-gateway wc -l /var/log/nginx/stateless_api.log
```

## Search & Filter

```bash
# Find 500 errors
podman exec mockup-gateway grep "500" /var/log/nginx/stateless_api.log

# Find slow requests (>50ms)
podman exec mockup-gateway grep -E "0\.[5-9][0-9]|[1-9][0-9]\." /var/log/nginx/stateless_api.log

# Find POST requests
podman exec mockup-gateway grep "POST" /var/log/nginx/stateful_api.log

# Count unique clients
podman exec mockup-gateway cut -d'|' -f1 /var/log/nginx/stateless_api.log | sort | uniq
```

## Log Format Reference

### Simple Log Format
```
172.18.0.1|-|[2026-02-13T13:56:31+00:00]|"GET /api/stateless/health HTTP/1.1"|200|413|"-"|"curl/8.16.0"|-|0.030|0.030|172.18.0.6:3000|200
```

**Fields:**
1. `172.18.0.1` - Client IP
2. `-` - Remote user
3. `[2026-02-13T13:56:31+00:00]` - Timestamp (ISO 8601)
4. `GET /api/stateless/health HTTP/1.1` - Request line
5. `200` - HTTP status
6. `413` - Response bytes sent
7. `-` - Referrer
8. `curl/8.16.0` - User agent
9. `-` - X-Forwarded-For
10. `0.030` - Request time (seconds)
11. `0.030` - Upstream response time
12. `172.18.0.6:3000` - Upstream address
13. `200` - Upstream status

### Audit Log Format (JSON)
```json
{
  "timestamp": "2026-02-13T13:56:31+00:00",
  "client_ip": "172.18.0.1",
  "request_method": "GET",
  "request_uri": "/api/stateless/health",
  "response_status": 200,
  "response_bytes_sent": 413,
  "request_time": 0.030,
  "upstream_addr": "172.18.0.6:3000",
  "upstream_status": "200",
  "ssl_protocol": "-",
  "ssl_cipher": "-"
}
```

## Current Log Volumes

| Log | Size | Requests |
|-----|------|----------|
| stateless_api.log | 896 B | 6 |
| stateless_api_audit.log | 3.0 KB | 6 |
| stateful_api.log | 958 B | 8 |
| stateful_api_audit.log | 3.6 KB | 8 |

## Nginx Configuration

**Location:** `/etc/nginx/nginx.conf`  
**Mounted from:** `./gateway/nginx.conf` in mockup-infra  

### Buffering Settings
```
buffer=32k flush=5s
```
- Logs are buffered in 32KB chunks
- Full buffer or 5 seconds triggers flush
- Optimizes I/O performance

### Log Level
```
error_log /var/log/nginx/error.log debug;
```
- Set to `debug` for maximum verbosity
- Can be changed to `info`, `warn`, `error`, `crit`, `alert`, `emerg`

## Common Issues & Solutions

**No logs appearing?**
```bash
# Check nginx process
podman exec mockup-gateway ps aux | grep nginx

# Reload configuration
podman exec mockup-gateway nginx -s reload

# Check for syntax errors
podman exec mockup-gateway nginx -t
```

**Logs too large?**
```bash
# Clear a log file (not recommended in production)
podman exec mockup-gateway sh -c "truncate -s 0 /var/log/nginx/stateless_api.log"

# Archive old logs
podman exec mockup-gateway tar czf logs-backup.tar.gz /var/log/nginx/
```

**Want to export logs?**
```bash
# Copy logs from container
podman cp mockup-gateway:/var/log/nginx/ ./nginx-logs/

# Export as file
podman exec mockup-gateway cat /var/log/nginx/stateless_api_audit.log > export.log
```

## Testing Request Flow

Make a request and watch the logs:

```bash
# Terminal 1: Watch logs
podman exec -it mockup-gateway tail -f /var/log/nginx/stateless_api.log

# Terminal 2: Make request
curl http://localhost:8080/api/stateless/health

# See request appear in real-time in Terminal 1
```

## Week 02 Specific Logs

### Stateless API Testing
```bash
podman exec mockup-gateway cat /var/log/nginx/stateless_api_audit.log | jq '.[] | {timestamp, request_method, response_status}'
```

### Stateful API Testing
```bash
podman exec mockup-gateway cat /var/log/nginx/stateful_api_audit.log | jq '.[] | {timestamp, request_uri, response_status, ssl_protocol}'
```

### Error Analysis
```bash
podman exec mockup-gateway grep -i error /var/log/nginx/intranet_api_error.log
```

## Compliance & Auditing

### Thailand DCA Compliance Check
✅ client_ip - Source identification  
✅ timestamp - ISO 8601 format  
✅ request_method - HTTP method recorded  
✅ request_uri - Full request path  
✅ response_status - HTTP response code  
✅ ssl_protocol - TLS version (for HTTPS)  
✅ ssl_cipher - Cipher suite (for HTTPS)  
✅ upstream_addr - Backend server tracking  

### Audit Trail Export
```bash
# Export JSON logs to file for archival
podman exec mockup-gateway cat /var/log/nginx/stateful_api_audit.log > stateful_api_audit_$(date +%Y%m%d_%H%M%S).jsonl
```

## Performance Monitoring

Extract timing data:
```bash
podman exec mockup-gateway sh -c "cat /var/log/nginx/stateless_api.log | cut -d'|' -f10 | tail -n +2 | sort -n | tail -5"
```

Shows slowest 5 requests (request_time field).

---

**Last Updated:** 2026-02-13 13:56:37 UTC
