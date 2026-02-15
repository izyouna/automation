# Week 02 Phase 1 on Mockup-Infra: Quick Reference

**Status:** ✅ INTEGRATION COMPLETE  
**Date:** February 13, 2026  

---

## What Was Done

| Component | Change | Status |
|-----------|--------|--------|
| Dockerfiles | Created for stateless + stateful servers | ✅ |
| docker-compose.yml | Added 2 new services | ✅ |
| Nginx config | Added routing blocks for both APIs | ✅ |
| Documentation | Created 3 comprehensive guides | ✅ |

---

## Quick Start (Copy & Paste)

```bash
# 1. Navigate
cd d:\boonsup\automation\mockup-infra

# 2. Build
docker-compose build

# 3. Run
docker-compose up -d

# 4. Verify
docker-compose ps
curl http://localhost:8080/api/stateless/health
curl -k https://localhost/api/stateful/health
```

Expected output: Both return `{"status":"healthy"}` or similar.

---

## Service Locations

### Stateless API (JWT)
- **Network:** public_net (172.18.0.6)
- **Port:** 3000 (internal)
- **Gateway Route:** `http://localhost:8080/api/stateless/`
- **Protocol:** HTTP

### Stateful API (Sessions)
- **Network:** private_net (172.19.0.6)
- **Port:** 3001 (internal)
- **Gateway Route:** `https://localhost/api/stateful/`
- **Protocol:** HTTPS

---

## Test Commands

### Stateless (JWT)
```bash
# Login → get token
curl -X POST http://localhost:8080/api/stateless/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret"}'

# Use token
curl http://localhost:8080/api/stateless/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

### Stateful (Sessions)
```bash
# Login → get session ID
curl -k -X POST https://localhost/api/stateful/session/start \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"secret"}'

# Use session
curl -k https://localhost/api/stateful/dashboard \
  -H "X-Session-ID: <SESSION_ID>"
```

---

## View Logs

```bash
# Real-time logs
docker-compose logs -f stateless-api
docker-compose logs -f stateful-api

# Nginx audit trail (JSON)
docker exec mockup-gateway tail -f /var/log/nginx/stateless_api_audit.log | jq .
docker exec mockup-gateway tail -f /var/log/nginx/stateful_api_audit.log | jq .
```

---

## Directory Structure

```
mockup-infra/
├── docker-compose.yml           ✅ Updated
├── gateway/nginx.conf           ✅ Updated
├── WEEK02_ON_MOCKUP_INFRA.md   ✅ New

week02-stateless-stateful/
├── phase1-mockup/
│   ├── Dockerfile.stateless    ✅ New
│   ├── Dockerfile.stateful     ✅ New
│   ├── src/
│   │   ├── stateless-server.js (unchanged)
│   │   └── stateful-server.js  (unchanged)
│   └── docs/
│       ├── concepts.md         (study material)
│       └── api-reference.md    (study material)
├── REFRAMING_SUMMARY.md        ✅ New
├── WEEK02_TRANSITION.md        ✅ Updated
└── BRANCH_TRANSITION_GUIDE.md  ✅ Updated
```

---

## Key Differences: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Run Command** | `npm run server:*` | `docker-compose up -d` |
| **Stateless URL** | `http://localhost:3000/` | `http://localhost:8080/api/stateless/` |
| **Stateful URL** | `http://localhost:3001/` | `https://localhost/api/stateful/` |
| **Port Mapping** | Direct | Via Nginx gateway |
| **Logs** | Console | Nginx audit trail |
| **Networks** | localhost | public_net / private_net |

---

## Troubleshooting

### Services not starting?
```bash
docker-compose logs <service_name>
docker-compose build --no-cache
```

### Port already in use?
```bash
# Free ports 8080 and 443
# Or modify docker-compose.yml port mappings
```

### can't connect to services?
```bash
# Check if running
docker-compose ps

# Check network connectivity
docker exec mockup-gateway ping stateless-api
docker exec mockup-gateway ping stateful-api
```

### JWT/Session not working?
```bash
# Check request format in concepts.md
# Review request headers in docs/api-reference.md
```

---

## File References

| File | Purpose |
|------|---------|
| [WEEK02_ON_MOCKUP_INFRA.md](../../mockup-infra/WEEK02_ON_MOCKUP_INFRA.md) | Complete mockup-infra integration guide |
| [REFRAMING_SUMMARY.md](./REFRAMING_SUMMARY.md) | Detailed explanation of changes |
| [WEEK02_TRANSITION.md](./WEEK02_TRANSITION.md) | Week 02 learning path (updated) |
| [BRANCH_TRANSITION_GUIDE.md](./BRANCH_TRANSITION_GUIDE.md) | Week 02 status and timeline |
| [phase1-mockup/docs/concepts.md](./phase1-mockup/docs/concepts.md) | Theory and deep dive |
| [phase1-mockup/docs/api-reference.md](./phase1-mockup/docs/api-reference.md) | API endpoints documentation |

---

## Next Actions

1. **Today:** `cd mockup-infra && docker-compose build && docker-compose up -d`
2. **Tomorrow:** Read `phase1-mockup/docs/concepts.md`
3. **This Week:** Test both APIs, understand differences
4. **Next Week:** Move to Phase 2 (Python + Redis)

---

## Summary

✅ Week 02 Phase 1 now runs on mockup-infra  
✅ Integrated into dual-network architecture  
✅ Full docker-compose orchestration  
✅ Comprehensive Nginx logging  
✅ Production-grade deployment  
✅ Same learning objectives  
✅ Plus real deployment skills  

**Ready?** `cd mockup-infra && docker-compose up -d` 🚀

---

**Quick Links:**
- Full guide: [WEEK02_ON_MOCKUP_INFRA.md](../../mockup-infra/WEEK02_ON_MOCKUP_INFRA.md)
- Details: [REFRAMING_SUMMARY.md](./REFRAMING_SUMMARY.md)
- Learning: [phase1-mockup/docs/concepts.md](./phase1-mockup/docs/concepts.md)

**Last Updated:** February 13, 2026
