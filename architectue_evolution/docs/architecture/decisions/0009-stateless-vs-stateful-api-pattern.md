# ADR-009: Stateless vs Stateful API Pattern

**Date:** 2026-02-13

**Status:** Accepted

## Context

Week 02 of the curriculum introduces fundamental API authentication patterns. Students need to understand the architectural differences between two primary approaches:

1. **Stateless authentication:** Server doesn't store session data; client includes credentials (JWT tokens) with each request
2. **Stateful authentication:** Server maintains session data; client includes session identifier (cookie/session ID) with each request

Previously, these patterns were theoretical/documented only. During Week 02 Phase 1 implementation, we needed to create working, comparable implementations that students could:
- Deploy simultaneously
- Route to independently via the gateway
- Observe and measure the differences (network traffic, storage requirements, security implications)
- Modify and experiment with

We considered:
- **Single API with both patterns:** Complex service code, difficult to isolate behavior, hardened to simplify
- **Separate backend services per pattern:** Clear separation, students see real implementation differences
- **Microservices from the start:** Introduces container/orchestration complexity too early
- **Separate services with shared gateway:** Infrastructure teaches composition while pattern learning is isolated

## Decision

We implement **two parallel Web APIs in Week 02**, each demonstrating one authentication pattern:

### stateless-api (Port 3000, Public Network)

Demonstrates stateless JWT authentication:

- **Framework:** Node.js Express
- **Location:** TCP 0.0.0.0:3000 on public network (172.18.0.6)
- **Authentication:** JWT tokens in Authorization header
- **Session storage:** None (stateless)
- **Endpoints:**
  - `POST /login` - Issues JWT token
  - `GET /data` - Protected endpoint, validates token from header
  - `GET /health` - Health check
- **Lessons:** Token expiration, token refresh, CORS with token auth, stateless scaling

### stateful-api (Port 3001, Private Network)

Demonstrates stateful session-based authentication:

- **Framework:** Node.js Express
- **Location:** TCP 0.0.0.0:3001 on private network (172.19.0.6)
- **Authentication:** Session cookies (HttpOnly, Secure)
- **Session storage:** In-memory (similar to Redis in production)
- **Endpoints:**
  - `POST /login` - Creates server-side session, sets cookie
  - `GET /data` - Protected endpoint, validates cookie-based session
  - `GET /health` - Health check
- **Lessons:** Cookie security, session storage requirements, stateful scaling challenges, CSRF mitigation

### Parallel Infrastructure

Both APIs are:
- **Managed by Nginx gateway** for unified routing
- **Deployed as separate containers** (images: stateless-api:v2, stateful-api:v2)
- **Observable in real-time** - students can run both and compare

**Justification:**
- **Concrete learning:** Students see real code, not diagrams
- **Safe experimentation:** Separate services mean changes don't break the other pattern
- **Realistic complexity:** Reflects actual architectural decisions in production systems
- **Measurable differences:** Network timing, database queries, response sizes become observable
- **Extensible:** Students can modify either service to explore consequences (e.g., add caching, shared sessions)
- **Comparative analysis:** Running side-by-side enables direct comparison of security, performance, scalability

## Consequences

**Positive:**
- Students understand practical implications of authentication patterns, not just theory
- Both patterns are production-grade code, setting expectations for real implementations
- Nginx gateway becomes a teaching tool (students learn routing, L7 logic)
- Separated services allow independent modification and experimentation
- Real performance profiles: token validation timing vs. session lookup timing
- Security considerations are concrete (SSL-only cookies, token expiration, refresh mechanisms)

**Negative:**
- Increased infrastructure complexity (two services vs. one)
- Students may not immediately understand why separation is pedagogically necessary
- Debugging a multi-service week 02 system adds cognitive load initially
- Gateway configuration requires understanding HTTP routing semantics

**Neutral:**
- This pattern can be extended to Week 03 (Role-Based Access Control with both patterns)
- Both services are simplistic compared to production (no persistence, no clustering, no caching)
- Can be migrated to a microservices framework (Kong, Ambassador) in Week 04 if desired

## Implementation Notes

### Service Startup

Both services are started by docker-compose.yml:

```yaml
stateless-api:
  image: stateless-api:v2
  container_name: stateless-api
  environment:
    SERVICE_PORT: '3000'
  networks:
    - public_net
  # ...

stateful-api:
  image: stateful-api:v2
  container_name: stateful-api
  environment:
    SERVICE_PORT: '3001'
  networks:
    - private_net
  # ...
```

### Gateway Routing

Nginx routes to both:

```
http {
  upstream stateless_backend {
    server stateless-api:3000;
  }
  
  upstream stateful_backend {
    server stateful-api:3001;
  }
  
  server {
    listen 80;
    
    location /api/stateless {
      proxy_pass http://stateless_backend;
    }
    
    location /api/stateful {
      proxy_pass http://stateful_backend;
    }
  }
}
```

### Verification

Health checks confirm both APIs are running:

```bash
# Stateless API (JWT authentication)
curl http://localhost:3000/health
# Response: {"status": "success", "type": "stateless", "port": "3000"}

# Stateful API (Session-based authentication)
curl http://localhost:3001/health
# Response: {"status": "success", "type": "stateful", "port": "3001"}
```

### Student Workflow

1. Start the infrastructure: `podman-compose up -d`
2. Observe both services running: `podman-compose ps`
3. Login to stateless API: `curl -X POST http://localhost:3000/login`
4. Use JWT token to access protected endpoint
5. Login to stateful API: `curl -X POST http://localhost:3001/login`
6. Use session cookie to access protected endpoint
7. Compare response times, network traffic, security implications

## Related Decisions

- **ADR-007:** Curriculum-Based Domain Separation (Week 02 is one domain)
- **ADR-008:** Docker Compose Profiles for Domain Isolation (both APIs in Week 02 profile)
- **ADR-003:** Nginx as L7 Gateway (routes to both APIs)

## References

- [Week 02 Phase 1 Architecture](../../../WEEK02_ON_MOCKUP_INFRA.md)
- [APP_DOMAIN_BY_WEEK.md - Week 02 Services](../../../APP_DOMAIN_BY_WEEK.md#week-02-stateless-vs-stateful-api-architecture)
- [stateless-api implementation](../../../mockup-infra/services/phase1-mockup/start-stateless.js)
- [stateful-api implementation](../../../mockup-infra/services/phase1-mockup/start-stateful.js)

## Implementation Commits

- Added stateless-api and stateful-api image builds to docker-compose.yml
- Updated Nginx gateway configuration to route to both APIs
- Created startup scripts with correct PORT parameter passing
- Verified both services respond to health checks with correct ports
