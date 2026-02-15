# ADR-008: Docker Compose Profiles for Domain Isolation

**Date:** 2026-02-13

**Status:** Accepted

## Context

Following ADR-007 (Curriculum-Based Domain Separation), we needed a concrete mechanism to enforce these domain boundaries at the infrastructure level. During Week 02 development, we identified a critical issue: the mime-server (Week 01 service) was running unconditionally whenever the infrastructure was started, even though students in Week 02 should only see Week 02 services.

The problem:
- Week 01 and Week 02 services coexisted in docker-compose.yml without explicit separation
- No way to "opt-in" to Week 01 services; they were always present
- Cross-domain boundary violation: mime-server was accessible during Week 02 lessons
- Students could accidentally (or intentionally) explore services outside their curriculum scope

We considered:
- **Separate docker-compose files per week** - High maintenance burden, duplicate configuration
- **Conditional service startup scripts** - Complex Shell logic, fragile
- **Kubernetes namespaces** - Over-engineered for current scale
- **Docker Compose profiles** - Native feature, simple, self-documenting, already in compose v2+

## Decision

We implement **Docker Compose service profiles** to enforce domain boundaries:

1. **Profile definition:**
   - `week01`: Services from curriculum week 01 (mime-server, mime-client)
   - `week02`: Default, always-active (stateless-api, stateful-api, nginx-gateway, public_app, intranet_api)
   - `week03`, `week04`, etc.: Future curriculum weeks
   - `reference`: Historical/reference implementations (mime-server, mime-client)
   - `client-manual`: Manual testing utilities (mime-client)

2. **Implementation in docker-compose.yml:**
   ```yaml
   services:
     mime-server:
       profiles: [week01, reference]
       # ... rest of config
     
     mime-client:
       profiles: [week01, reference, client-manual]
       # ... rest of config
   ```

3. **Usage patterns:**
   - **Week 02 (default):** `podman-compose up -d` → Only Week 02 services active
   - **Week 01 review:** `podman-compose --profile week01 up -d` → Week 01 + Week 02 services
   - **Full reference:** `podman-compose --profile reference up -d` → All historical services
   - **Manual testing:** `podman-compose --profile client-manual run mime-client` → Utilities only

**Justification:**
- **Native feature:** Docker Compose profiles are first-class citizens, not hacks
- **Clear intent:** Service ownership is visible in the configuration file
- **Flexible:** Supports multiple classification schemes (week-based, feature-based, manual, reference)
- **Low overhead:** No additional infrastructure or orchestration required
- **Reproducible:** Consistent behavior across development and production environments
- **Self-documenting:** The profiles themselves document the curriculum structure

## Consequences

**Positive:**
- Cross-domain boundary violations are **prevented by default** (Week 01 services must be explicitly activated)
- Clear enforcement mechanism for pedagogical boundaries
- Students starting Week 02 won't accidentally see Week 01 services
- Easy to extend for Week 03, Week 04, etc. (just add a new profile)
- Minimal cognitive overhead for students understanding the infrastructure

**Negative:**
- Students in Week 01 must remember to use `--profile week01` flag (though this is self-documenting)
- If a service is needed across multiple weeks, it must be assigned multiple profiles (design question for those services)
- Debugging requires awareness that profiles affect which services are running

**Neutral:**
- Profile feature is available in docker-compose v1.28.0+, not relevant here (using podman-compose 1.5.0)
- Docker Swarm does not support profiles (but we're using Compose, not Swarm)
- Can be migrated to Kubernetes namespaces or service meshes in future orchestration systems

## Implementation Notes

### Current Profile Configuration (as of 2026-02-13)

Services by profile:

| Service | week01 | week02 | reference | client-manual |
|---------|--------|--------|-----------|---|
| mime-server | ✓ | - | ✓ | - |
| mime-client | ✓ | - | ✓ | ✓ |
| stateless-api | - | ✓ | - | - |
| stateful-api | - | ✓ | - | - |
| nginx-gateway | - | ✓ | - | - |
| public_app | - | ✓ | - | - |
| intranet_api | - | ✓ | - | - |

### Verification

Verify domain isolation with:
```bash
# Only Week 02 services (default)
podman-compose ps

# Include Week 01 services
podman-compose --profile week01 ps

# All services (reference set)
podman-compose --profile reference ps
```

## Related Decisions

- **ADR-007:** Curriculum-Based Domain Separation (conceptual framework)
- **ADR-009:** Stateless vs Stateful API Pattern (Week 02 specific implementation)

## References

- [Docker Compose documentation: Profiles](https://docs.docker.com/compose/features-use/)
- [DOMAIN_BOUNDARY_FIX.md](../../../mockup-infra/DOMAIN_BOUNDARY_FIX.md) - Detailed implementation and fix process
- [docker-compose.yml](../../../mockup-infra/docker-compose.yml) - Source configuration (lines 85-107)
