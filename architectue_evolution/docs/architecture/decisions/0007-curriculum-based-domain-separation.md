# ADR-007: Curriculum-Based Domain Separation

**Date:** 2026-02-13

**Status:** Accepted

## Context

The MIME infrastructure project is designed to support a multi-week curriculum, where each week introduces new architectural patterns and services. Initially, all services were integrated into a single infrastructure without explicit domain boundaries between curriculum phases.

As Week 01 (MIME protocol fundamentals) and Week 02 (stateless vs stateful API architecture) were developed, we discovered that services from different weeks required clear separation:

- **Week 01 services** (mime-server, mime-client) focus on TCP/MIME protocol implementation
- **Week 02 services** (stateless-api, stateful-api) focus on HTTP API authentication patterns
- **Future weeks** (Week 03+) will introduce additional architectural patterns

Without explicit domain boundaries, we risked:
- Students accessing services outside their curriculum scope
- Confusion about which services belong to which week
- Potential "preview" of future topics (or pollution from past weeks)
- Difficulty managing deprecation of older week services

We considered:
- Separate Docker Compose files per week (high maintenance burden)
- Service filtering at the gateway level (complex routing logic)
- Namespace-based separation in infrastructure (requires advanced orchestration)
- **Curriculum-based domain boundaries with explicit service ownership**

## Decision

We adopt a **curriculum-based domain architecture** where:

1. **Each week is a domain:** Week 01, Week 02, Week 03, etc., are discrete architectural domains
2. **Services belong to exactly one domain:** Every service is owned by a single week
3. **Clear service inventories:** Each week documents which services are available and in scope
4. **Domain visibility:** Students can see what's available in their week without confusion

This decision manifests in:
- **APP_DOMAIN_BY_WEEK.md:** Central registry defining all services per curriculum week
- **SERVICE_DOMAINS.md:** Organizational mapping of services to their owning domain
- **Explicit documentation:** README files in each infrastructure reference their curriculum scope
- **Clean deprecation:** Services from past weeks are clearly marked as deprecated/historical

**Justification:**
- **Pedagogical clarity:** Students understand which services belong to their curriculum phase
- **Progressive disclosure:** Each week's services are introduced intentionally, not discovered accidentally
- **Maintainability:** Clear ownership prevents orphaned services and simplifies deprecation
- **Scalability:** Pattern extends naturally to Week 03, 04, etc.
- **Curriculum-driven design:** Architecture reflects the learning objectives, not the other way around

## Consequences

**Positive:**
- Students have a clear mental model of service ownership
- Each week's scope is explicitly documented and bounded
- Deprecation paths are clear (e.g., "Week 01 services are available with `--profile week01`")
- Future weeks can be added without redefining existing domains
- Documentation burden is reduced through centralized domain definition

**Negative:**
- Additional complexity if a service spans multiple weeks (would require redesign)
- Documentation must be maintained as services evolve
- Students must understand that week-based domains are intentional curriculum structure, not arbitrary restrictions

**Neutral:**
- This decision complements (rather than replaces) infrastructure-level isolation mechanisms like Docker Compose profiles
- The domain structure is independent of the container runtime (Podman, Docker, Kubernetes)
- Can be extended with role-based access control (RBAC) in future.

## Related Decisions

- **ADR-008:** Docker Compose Profiles for Domain Isolation (enforcement mechanism)
- **ADR-009:** Stateless vs Stateful API Pattern (Week 02 specific implementation)

## References

- [APP_DOMAIN_BY_WEEK.md](../../APP_DOMAIN_BY_WEEK.md) - Authoritative domain definitions
- [SERVICE_DOMAINS.md](../../../mockup-infra/SERVICE_DOMAINS.md) - Service organization by week
