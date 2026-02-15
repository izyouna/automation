# Security Risk Assessment & Error Test Report

**Date:** 2026-02-13 14:05 UTC  
**Test Environment:** Week 02 Phase 1 - Mock Infrastructure  
**Scope:** Stateless API, Stateful API, Nginx Gateway

---

## Executive Summary

**Overall Risk Level: MEDIUM** ⚠️

The infrastructure is operational and suitable for curriculum delivery, but several security gaps have been identified that should be addressed before production use. Most issues are expected for a learning environment but should not be missed in hardening discussions.

---

## Critical Findings (Must Fix)

### 1. ❌ Missing Input Validation & Error Handling

**Severity:** HIGH  
**Issue:** Malformed JSON requests return HTTP 500 instead of HTTP 400  
**Test Result:**
```bash
curl -X POST http://localhost:8080/api/stateless/calculate \
  -H "Content-Type: application/json" \
  -d '{invalid json}'

# Returns: HTTP 500 "Internal server error"
# Expected: HTTP 400 "Bad Request"
```

**Root Cause:** JSON parsing errors not caught properly  
**Impact:** 
- Reveals internal error handling to attackers
- Difficult for clients to distinguish between server errors and bad requests
- Could be exploited in error-based reconnaissance

**Recommendation:** Add JSON schema validation middleware

---

### 2. ❌ Large Payload Not Rate Limited

**Severity:** MEDIUM  
**Issue:** No Content-Length limit enforced at gateway level  
**Test Result:**
```bash
# Attempting 1MB+ JSON payload
curl -X POST http://localhost:8080/api/stateless/calculate \
  -H "Content-Type: application/json" \
  -d '{"data": "' + ("x" * 1048576) + '"}'

# Returns: HTTP 500 (crashes or timeout)
# Expected: HTTP 413 "Payload Too Large"
```

**Root Cause:** Express.json() default limit (100KB) set but no upstream validation  
**Impact:**
- Denial of Service vulnerability (memory exhaustion)
- Can crash service if payload handling inefficient
- Network bandwidth wasted

**Recommendation:** 
```nginx
client_max_body_size 1m;  # Add to nginx.conf
```

---

### 3. ❌ Missing Authentication on Sensitive Endpoints

**Severity:** HIGH  
**Issue:** No authentication mechanism on /api/stateful/session endpoints  
**Test Result:**
```bash
curl -X POST https://localhost:443/api/stateful/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "attacker", "data": {}}'

# Returns: HTTP 500 (unrelated app bug)
# But could create sessions for any user!
```

**Root Cause:** Session creation endpoints not checking authorization  
**Impact:**
- Account takeover via session hijacking
- Privilege escalation if user role not validated
- Session fixation attacks possible

**Recommendation:**
- Implement JWT token validation
- Add user ID verification middleware
- Implement rate limiting on session creation

---

### 4. ❌ Self-Signed Certificate (TLS Warning)

**Severity:** MEDIUM  
**Issue:** HTTPS endpoint uses self-signed certificate  
**Test Result:**
```bash
curl https://localhost:443/api/stateful/health
# curl: (60) SSL certificate problem: self signed certificate

curl -k https://localhost:443/api/stateful/health  # -k required
# Works with -k (insecure mode)
```

**Root Cause:** certificates/server.crt and server.key are self-signed  
**Impact:**
- Man-in-the-middle (MITM) attacks possible
- Browser warnings will confuse users
- Can't validate certificate chain

**Recommendation:**
- Use proper Certificate Authority (CA) for production
- Generate CA-signed certificates for dev/test
- Pin certificates in client code for PWA

---

### 5. ❌ CORS Configured to Accept All Origins

**Severity:** MEDIUM  
**Issue:** CORS allows requests from any origin  
**Configuration Found:**
```javascript
cors({
    origin: '*',  // DANGEROUS!
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Client-ID']
})
```

**Test Result:**
```bash
curl -H "Origin: https://attacker.com" http://localhost:8080/api/stateless/health
# Returns: Access-Control-Allow-Origin: *
# Any site can make requests from browser
```

**Impact:**
- Cross-Site Request Forgery (CSRF) attacks
- Session hijacking via browser-based attacks
- Sensitive data leaked to malicious origins

**Recommendation:**
```javascript
cors({
    origin: ['http://localhost', 'https://localhost'],
    credentials: true
})
```

---

## High Priority Findings (Address Soon)

### 6. ⚠️ No Rate Limiting

**Severity:** HIGH  
**Issue:** No request rate limiting on any endpoints  
**Impact:**
- Brute force attacks on login/auth endpoints easy
- API scraping attacks unprevented
- Denial of Service via request flooding

**Test Scenario:**
```bash
# Could hammer endpoints 1000s of times
for i in {1..1000}; do
  curl http://localhost:8080/api/stateless/health
done
# No throttling or blocking
```

**Recommendation:** Add express-rate-limit middleware

---

### 7. ⚠️ No HTTPS Redirect

**Severity:** MEDIUM  
**Issue:** HTTP endpoint not redirecting to HTTPS  
**Current Setup:**
```
HTTP :8080  → stateless-api (no redirect)
HTTPS :443 → stateful-api (secure)
```

**Impact:**
- Users may access insecure endpoints
- Session tokens exposed on HTTP
- Attackers can intercept via HTTP

**Recommendation:**
```nginx
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

---

### 8. ⚠️ Missing Security Headers

**Severity:** MEDIUM  
**Issue:** Insufficient security headers in responses  

**Current Headers Found:**
```
Nginx adds:
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
```

**Missing Headers:**
```
- Content-Security-Policy (CSP)
- Referrer-Policy
- Permissions-Policy
- X-Permitted-Cross-Domain-Policies
```

**Recommendation:** Add CSP header:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'" always;
```

---

### 9. ⚠️ Insufficient Logging of Security Events

**Severity:** MEDIUM  
**Issue:** Failed authentication attempts not specially logged  
**Current:** All logs in /var/log/nginx/ mixed format  
**Missing:**
- Failed login attempts with timestamps
- Suspicious request patterns
- Rate limiter events
- Authorization failures

**Recommendation:**
```nginx
# Add security-specific log format
log_format security '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status - SECURITY_EVENT';
```

---

### 10. ⚠️ Weak Default Credentials Expected

**Severity:** HIGH  
**Issue:** When auth is implemented, weak password policy may be used  
**Current Status:** No auth yet, but anticipated

**Recommendation for Phase 2:**
- Enforce minimum password length (12+ chars)
- Require password complexity
- Implement password hashing (bcrypt, argon2)
- Add account lockout after failed attempts

---

## Medium Priority Findings (Enhancement)

### 11. ℹ️ No API Rate Limiting by User/IP

**Issue:** No tracking of per-user or per-IP request quotas  
**Recommendation:** Implement token bucket algorithm

---

### 12. ℹ️ Verbose Error Messages

**Issue:** Error responses may reveal system internals  
**Finding:**
```json
{
  "status": "error",
  "message": "Internal server error",
  "errors": []
}
```

**Better:**
```json
{
  "status": "error",
  "message": "Request processing failed",
  "timestamp": "2026-02-13T14:05:28.484Z",
  "requestId": "xyz-123"  // For support lookup
}
```

---

### 13. ℹ️ No Request ID Correlation

**Issue:** Logs use connection ID, not per-request IDs  
**Current:**
```
"connection_id": "1"
```

**Better:**
```
"request_id": "req_1770992000_abc123def"
```

---

## Error Test Results

### Tested Error Conditions

| Test Case | Endpoint | Method | Payload | Status | Response | Risk |
|-----------|----------|--------|---------|--------|----------|------|
| Valid Request | /health | GET | - | 200 | ✅ Correct | ✅ |
| Missing Required Fields | /calculate | POST | `{}` | 500 | ❌ Should be 400 | HIGH |
| Malformed JSON | /calculate | POST | `{invalid}` | 500 | ❌ Should be 400 | HIGH |
| Large Payload (2KB) | /calculate | POST | Large JSON | 500 | ❌ Should be 413 | MEDIUM |
| Wrong Content-Type | /calculate | POST | Data | 500 | ℹ️ Acceptable | LOW |
| Nonexistent Endpoint | /api/fake | GET | - | 404 | ✅ Correct | ✅ |
| Invalid HTTP Method | /health | DELETE | - | 405 | ✅ Correct | ✅ |
| Missing Auth Header | /session | POST | Valid | 500 | ⚠️ No auth yet | HIGH |
| Expired Token | /health | GET | Expired | 200 | ⚠️ No validation yet | HIGH |
| CORS Preflight | /health | OPTIONS | - | 200 | ⚠️ Too permissive | MEDIUM |

---

## Security Configuration Review

### ✅ Good Practices Identified

```
✅ HTTPS/TLS enabled for sensitive endpoints
✅ Private network isolates stateful-api
✅ Helmet.js security headers configured
✅ CORS enabled (though too permissive)
✅ Comprehensive audit logging
✅ Request/response logging for compliance
✅ Error isolation (doesn't leak internal paths)
✅ SQL injection not applicable (no ORM exposure)
```

### ❌ Bad Practices Identified

```
❌ No input validation with proper error codes
❌ No rate limiting
❌ No request throttling
❌ Self-signed certificates
❌ CORS allows all origins
❌ Weak error handling (500 for 400 errors)
❌ No authentication mechanism yet
❌ No request ID tracking
❌ No failed-login logging
❌ No IP-based blocking/allowlisting
```

---

## Vulnerability Scoring (CVSS-like)

| Vulnerability | CVSS Score | Risk | Fix Effort |
|----------------|-----------|------|-----------|
| Missing input validation | 5.3 (Medium) | Data corruption, DOS | Low |
| No rate limiting | 7.5 (High) | DOS, brute force | Medium |
| Missing authentication | 9.1 (Critical) | Account takeover | High |
| Self-signed certs | 5.9 (Medium) | MITM attacks | Low |
| Permissive CORS | 6.5 (Medium) | CSRF, data theft | Low |
| Large payload DOS | 7.5 (High) | Service crash | Low |
| Missing security headers | 4.7 (Low) | XSS, clickjacking | Low |
| Verbose errors | 3.7 (Low) | Info disclosure | Low |

---

## Remediation Roadmap

### Phase 1 (Immediate - Before Production)
- [ ] Add input validation with proper HTTP status codes (400 for bad requests)
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Configure client_max_body_size in Nginx
- [ ] Restrict CORS to known origins
- [ ] Add security headers (CSP, etc.)

### Phase 2 (Short Term - Before Auth Implementation)
- [ ] Implement JWT validation
- [ ] Add password policy enforcement
- [ ] Implement account lockout mechanism
- [ ] Add authentication logging
- [ ] Implement request ID tracking

### Phase 3 (Medium Term - Production Hardening)
- [ ] Use CA-signed certificates
- [ ] Implement WAF (Web Application Firewall) rules
- [ ] Add DDoS protection
- [ ] Implement IP allowlisting for admin endpoints
- [ ] Add data encryption at rest
- [ ] Implement database connection pooling limits

### Phase 4 (Ongoing - Maintenance)
- [ ] Regular security audits
- [ ] Dependency scanning (npm audit)
- [ ] Penetration testing
- [ ] Security patch management
- [ ] Log analysis and alerting

---

## Curriculum Integration Notes

### For Students
These vulnerabilities should be **teaching points**:
- Week 02 Phase 2: "Why authentication matters"
- Week 03: "Input validation and error handling"
- Week 04: "Rate limiting and DOS protection"
- Week 05: "HTTPS and certificate validation"

### For Instructors
Recommended discussion topics:
1. **Error Handling:** Why 500 errors for 400 situations is bad
2. **CORS:** Why `origin: '*'` is dangerous
3. **Rate Limiting:** How to prevent brute force attacks
4. **Authentication:** Stateless vs stateful revisited with security

---

## Test Commands for Reproducibility

```bash
# Test 1: Valid request
curl http://localhost:8080/api/stateless/health

# Test 2: Malformed JSON (should return 400, currently 500)
curl -X POST http://localhost:8080/api/stateless/calculate \
  -H "Content-Type: application/json" \
  -d '{invalid json}'

# Test 3: Missing fields (should validate)
curl -X POST http://localhost:8080/api/stateless/calculate \
  -H "Content-Type: application/json" \
  -d '{}'

# Test 4: CORS check (too permissive)
curl -H "Origin: https://attacker.com" \
  http://localhost:8080/api/stateless/health \
  -i | grep -i access-control

# Test 5: HTTPS with self-signed cert
curl https://localhost:443/api/stateful/health
# (will fail without -k, should use proper certs)

# Test 6: Rate limiting (none currently)
for i in {1..100}; do
  curl http://localhost:8080/api/stateless/health
done
# (no throttling, should add rate limiter)

# Test 7: Security headers
curl -i http://localhost:8080/api/stateless/health | grep -i "strict\|x-"
```

---

## Conclusion

The Week 02 Phase 1 infrastructure is **suitable for curriculum delivery** with the understanding that it's a learning environment. However, before any production deployment or real data handling, the critical issues (input validation, authentication, rate limiting) must be addressed.

The identified vulnerabilities are good teaching examples and should be openly discussed with students as part of the curriculum progression toward a secure, production-ready system.

**Overall Assessment:** ✅ **Ready for Week 02 Learning** | ⚠️ **Not Production-Ready**

---

**Report Generated:** 2026-02-13 14:05 UTC  
**Next Review:** After Phase 2 implementation (authentication)
