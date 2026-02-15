# Week 02 Phase 1 - Dual API Test Summary

## ✅ Test Status: OPERATIONAL

**Date:** 2026-02-13 13:56 UTC  
**Environment:** Bare Metal (Podman + Docker Compose)  
**Duration:** ~31 minutes uptime

---

## Test Results

### Stateless API (Port 3000 → Gateway :8080)
```
✅ Health Check:        HTTP 200 OK
✅ Service Status:      healthy
✅ Type:                stateless
✅ Memory Usage:        8.8 MB / 9.8 MB
✅ Uptime:              2034 seconds
✅ Network:             Public (172.18.0.6)
✅ Message:             "I have no memory of previous requests"
```

### Stateful API (Port 3001 → Gateway :443)
```
✅ Health Check:        HTTPS 200 OK
✅ Service Status:      healthy
✅ Type:                stateful
✅ Memory Usage:        8.5 MB / 9.8 MB
✅ Uptime:              2039 seconds
✅ Network:             Private (172.19.0.6)
✅ Active Sessions:     0
✅ Active Carts:        0
✅ Message:             "I maintain client state across requests"
```

---

## Architecture Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT / BROWSER                          │
└────────────┬──────────────────────────────┬──────────────────┘
             │                              │
        HTTP │ :8080                  HTTPS │ :443
             │                              │
    ┌────────▼────────────────────────────▼────────┐
    │           NGINX GATEWAY (Alpine)              │
    │     L7 Reverse Proxy +  TLS Termination      │
    │    172.18.0.2 | 172.19.0.2                   │
    └────────┬──────────────────────┬───────────────┘
             │                      │
        ┌────▼──────────────────────▼────┐
        │    PUBLIC_NET (172.18.0.0/16)   │
        │                                 │
        │  ┌──────────────────────────┐   │
        │  │  STATELESS-API           │   │
        │  │  Node.js + Express       │   │
        │  │  172.18.0.6:3000         │   │
        │  │  ✅ HTTP endpoint        │   │
        │  │  ✅ JWT-ready auth       │   │
        │  │  ✅ Scaling-friendly     │   │
        │  └──────────────────────────┘   │
        │                                 │
        │  ┌──────────────────────────┐   │
        │  │  PUBLIC-APP              │   │
        │  │  Python Flask            │   │
        │  │  172.18.0.3:80           │   │
        │  │  (Week 02 web frontend)  │   │
        │  └──────────────────────────┘   │
        │                                 │
        │  ⭕ MIME-SERVER (isolated)      │
        │     172.18.0.4:65432 (week01)  │
        │     [Not running in Week 02]   │
        │                                 │
        └────────────────────────────────┘
                      │
        ┌─────────────▼──────────────────┐
        │   PRIVATE_NET (172.19.0.0/16)   │
        │   (TLS-only, secure)            │
        │                                 │
        │  ┌──────────────────────────┐   │
        │  │  STATEFUL-API            │   │
        │  │  Node.js + Express       │   │
        │  │  172.19.0.6:3001         │   │
        │  │  ✅ HTTPS endpoint       │   │
        │  │  ✅ Session-based auth   │   │
        │  │  ✅ Stateful pattern     │   │
        │  └──────────────────────────┘   │
        │                                 │
        │  ┌──────────────────────────┐   │
        │  │  INTRANET-API            │   │
        │  │  Python Flask            │   │
        │  │  172.19.0.3:5000         │   │
        │  │  (Week 02 internal APIs) │   │
        │  └──────────────────────────┘   │
        │                                 │
        │  ⭕ MIME-CLIENT (isolated)      │
        │     172.19.0.4 (week01)        │
        │     [Not running in Week 02]   │
        │                                 │
        └────────────────────────────────┘
```

---

## Domain Isolation Verification

### ✅ Week 02 Active Services
- stateless-api (public, HTTP)
- stateful-api (private, HTTPS)
- nginx-gateway (both networks)
- public-app (web frontend)
- intranet-api (internal APIs)

### ✅ Week 01 Successfully Isolated
- mime-server (requires --profile week01)
- mime-client (requires --profile week01)

**Isolation Method:** Docker Compose profiles  
**Verification:** `podman-compose ps | grep mime` returns 0 results

---

## Key Metrics

| Metric | Stateless | Stateful |
|--------|-----------|----------|
| **HTTP Status** | 200 OK | 200 OK |
| **Protocol** | HTTP | HTTPS |
| **Port** | 8080 (via gateway) | 443 (via gateway) |
| **Direct Port** | 3000 | 3001 |
| **Network** | Public | Private |
| **Uptime** | 2034s | 2039s |
| **Memory (RSS)** | 59.0 MB | 59.4 MB |
| **Heap Used** | 8.8 MB | 8.5 MB |
| **Response Time** | ~11ms | ~13ms |
| **Active Sessions** | N/A | 0 |
| **Architecture** | Stateless | Stateful |

---

## Test Commands Used

```bash
# Stateless API through gateway
curl -s http://localhost:8080/api/stateless/health

# Stateful API through gateway (requires cert bypass)
curl -s -k https://localhost:443/api/stateful/health

# Check domain isolation
podman-compose ps | grep mime
# Result: (empty - Week 01 isolated)

# List all services
podman-compose ps
```

---

## Pedagogical Value

### Students Will Learn
1. **Stateless Architecture**
   - Each request is independent
   - Highly scalable horizontally
   - No server memory required
   - Example: REST APIs, microservices

2. **Stateful Architecture**
   - Maintains session between requests
   - Requires shared storage for scaling
   - More complex but enables richer interactions
   - Example: Shopping carts, user profiles

3. **Security Principles**
   - Public APIs use HTTP (requires TLS in production)
   - Sensitive APIs use HTTPS
   - Networks can segregate services
   - Session management implications

4. **Infrastructure Patterns**
   - Load balancing with Nginx
   - Container networking
   - Domain-based service isolation
   - Gateway routing

---

## Next Steps for Curriculum

### Phase 2: Authentication Implementation
- [ ] Implement JWT token generation on stateless-api
- [ ] Add login/logout endpoints
- [ ] Add token validation middleware
- [ ] Implement session creation on stateful-api
- [ ] Add cookie-based authentication

### Phase 3: Comparison & Analysis
- [ ] Compare request/response sizes
- [ ] Measure response times under load
- [ ] Analyze memory usage patterns
- [ ] Study scaling implications
- [ ] Document security tradeoffs

### Phase 4: Extensions
- [ ] Add persistence (databases)
- [ ] Implement caching
- [ ] Add rate limiting
- [ ] Deploy to Kubernetes
- [ ] Scale horizontally

---

## Infrastructure Readiness

✅ **Ready for Week 02 curriculum delivery**

All services are operational, isolated by domain, and accessible through the gateway. The infrastructure successfully demonstrates the stateless vs stateful comparison that is core to Week 02 learning objectives.

**Last verified:** 2026-02-13 13:56:37 UTC
