# Security Issues Quick Reference

## Critical Issues Found

### Issue #1: Weak Error Handling

**Current Behavior:**
```json
POST /api/stateless/calculate
{"data": "invalid"}

Response: HTTP 500
{
  "status": "error",
  "message": "Internal server error"
}
```

**Problem:** Clients can't distinguish bad input from server errors

**Fix:** Add input validation returning 400
```javascript
// In stateless-server.js
const validation = validateRequestBody(req, ['operation', 'values']);
if (!validation.isValid) {
    return res.status(400).json({
        status: 'error',
        message: 'Invalid request',
        errors: validation.errors
    });
}
```

---

### Issue #2: No Rate Limiting

**Current Behavior:**
```bash
# Can hammer API unlimited times
for i in {1..10000}; do
  curl http://localhost:8080/api/stateless/health
done
# All successful, no throttling
```

**Problem:** DOS vulnerability, allows brute force attacks

**Fix:** Add express-rate-limit
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

**With Nginx:**
```nginx
# Add to nginx.conf
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/stateless/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://stateless_backend/;
}
```

---

### Issue #3: No Authentication

**Current Behavior:**
```bash
# Can create sessions for anyone
curl -X POST https://localhost:443/api/stateful/session \
  -d '{"userId": "attacker_user"}'
# Works! (after fixing app bug)
```

**Problem:** Account takeover possible, no user isolation

**Fix:** Implement JWT validation
```javascript
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch {
        return res.status(403).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

// Use on protected endpoints
app.post('/api/stateful/session', verifyToken, (req, res) => {
    // Only create session for authenticated user
});
```

---

### Issue #4: Large Payload DOS

**Current Behavior:**
```bash
curl -X POST http://localhost:8080/api/stateless/calculate \
  -d '{"operation": "add", "values": [' + ("1," * 1000000) + ']}'
# Returns 500, crashes or hangs
```

**Problem:** Memory exhaustion attack

**Fix:** Enforce payload size limits
```javascript
app.use(express.json({ limit: '1mb' }));  // Already in code!
```

**In Nginx:**
```nginx
http {
    client_max_body_size 1m;  # Add this
    
    location /api/ {
        proxy_pass http://backend/;
    }
}
```

---

### Issue #5: Permissive CORS

**Current Behavior:**
```javascript
cors({
    origin: '*',  // DANGEROUS!
    credentials: true
})
```

**Problem:** CSRF attacks, any site can make requests

**Fix:** Restrict to known origins
```javascript
cors({
    origin: ['http://localhost', 'https://localhost'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600
})
```

---

### Issue #6: Self-Signed Certificates

**Current Behavior:**
```bash
curl https://localhost:443/api/stateful/health
# curl: (60) SSL certificate problem: self signed certificate

curl -k https://localhost:443/api/stateful/health  # Need -k
# Works only with insecure flag
```

**Problem:** MITM attacks possible, browser warnings

**Fix:** Use proper certificates
```bash
# For development: Create CA-signed cert
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# For production: Get from Let's Encrypt
certbot certonly --standalone -d yourdomain.com
```

---

### Issue #7: Weak Error Messages

**Current Behavior:**
```json
{
  "status": "error",
  "message": "Internal server error"
  // No request ID for support lookup!
}
```

**Problem:** Hard to debug, may leak info

**Fix:** Better error responses
```javascript
const sendError = (res, message, status = 500, requestId = '') => {
    res.status(status).json({
        status: 'error',
        message: message,
        requestId: requestId || generateId(),
        timestamp: new Date().toISOString()
        // Don't include stack trace!
    });
};
```

---

## Testing Commands

### Test Error Handling
```bash
# Test malformed JSON
curl -X POST http://localhost:8080/api/stateless/calculate \
  -H "Content-Type: application/json" \
  -d '{invalid}'

# Expected: HTTP 400 (currently 500)
# Current response: "Internal server error"
```

### Test Rate Limiting
```bash
# Make 100 requests rapidly
for i in {1..100}; do
  curl http://localhost:8080/api/stateless/health &
done
wait

# Expected: Some 429 (Too Many Requests)
# Current: All successful
```

### Test CORS
```bash
# Test from different origin
curl -H "Origin: https://attacker.com" \
  http://localhost:8080/api/stateless/health -v

# Look for: Access-Control-Allow-Origin header
# Current: "*" (allows all)
# Safe: "http://localhost"
```

### Test Authentication
```bash
# Try to create session without token
curl -X POST https://localhost:443/api/stateful/session \
  -d '{"userId": "hacker"}'

# Expected: HTTP 401 (needs token)
# Current: HTTP 500 (app error) or 200 (not implemented)
```

---

## Security Checklist

- [ ] Input validation with proper error codes (400 for bad input)
- [ ] Rate limiting (10-100 req/sec per IP)
- [ ] Authentication on sensitive endpoints
- [ ] Payload size limits (1MB default)
- [ ] CORS restricted to known origins
- [ ] CA-signed (or at least self-signed with CA) certificates
- [ ] Security headers (CSP, HSTS, X-Frame-Options)
- [ ] Request ID correlation in logs
- [ ] Failed login attempt logging
- [ ] Account lockout after N failures
- [ ] Password minimum 12 characters
- [ ] Password hashing (bcrypt/argon2)
- [ ] HTTPS redirect from HTTP
- [ ] Security event logging separate
- [ ] No verbose error messages in production

---

## Implementation Priority

### Week 02 Phase 2 (Authentication)
1. Input validation (400 errors) - 2 hours
2. Rate limiting - 1 hour
3. JWT authentication - 4 hours
4. Password hashing - 2 hours

### Week 03 (Hardening)
1. CORS restriction - 1 hour
2. Security headers - 1 hour
3. Payload size limits - 30 min
4. Error message sanitization - 1 hour

### Week 04 (Production)
1. Certificate management - 2 hours
2. Request ID tracking - 2 hours
3. Security event logging - 3 hours
4. Account lockout - 2 hours

---

## For Instructors

### Discussion Topics
1. **Error Codes**: Why 400/500 distinction matters
2. **CORS**: Why `origin: '*'` is dangerous
3. **Rate Limiting**: Algorithm choices (token bucket vs sliding window)
4. **Authentication**: Stateless (JWT) vs stateful (sessions)
5. **Certificates**: Self-signed vs CA-signed vs Let's Encrypt

### Hands-On Exercises
1. Add validation to return 400 errors
2. Implement rate limiting middleware
3. Generate JWT tokens and validate them
4. Hash passwords using bcrypt
5. Write security test cases

### Assessment Questions
1. Why should we validate input?
2. What's the difference between 400 and 500 errors?
3. How does rate limiting prevent DOS?
4. What's safer: HTTP or HTTPS?
5. How do we store passwords securely?

---

## Resources

### OWASP Top 10
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A05: Security Misconfiguration

### Node.js Security
- express-rate-limit
- helmet.js
- bcryptjs
- jsonwebtoken

### Reading
- https://owasp.org/www-community/attacks/csrf
- https://cheatsheetseries.owasp.org
- https://nodejs.org/en/docs/guides/security/

---

**Last Updated:** 2026-02-13  
**Status:** Development/Learning Environment
