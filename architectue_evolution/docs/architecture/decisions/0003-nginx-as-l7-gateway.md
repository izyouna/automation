# ADR-003: Nginx as L7 Gateway

**Date:** 2026-02-13

**Status:** Accepted

## Context

The system consists of multiple backend services (`public_app`, `intranet_api`, `mime-server`). Exposing each service directly to the internet would be insecure and unmanageable. We need a single, unified entry point to handle incoming requests, manage TLS, and route traffic appropriately.

We considered several options for this entry point:
- A cloud provider's load balancer (e.g., AWS ALB).
- A dedicated API Gateway service (e.g., Kong, Tyk).
- A reverse proxy like Nginx, HAProxy, or Traefik.

## Decision

We will use a self-hosted **Nginx container (`mockup-gateway`) as a Layer 7 reverse proxy and API gateway**.

**Justification:**
- **Flexibility & Control:** Nginx provides a high degree of control over routing, request/response modification, logging, and security policies directly within our configuration files.
- **Performance:** Nginx is renowned for its high performance and low resource consumption, making it ideal for a containerized environment.
- **Extensibility:** The Nginx ecosystem is vast, with numerous modules (like Lua scripting) and integrations (like the Nginx Prometheus Exporter) that we are already leveraging.
- **Cost-Effective:** As a self-hosted solution, it avoids the direct costs associated with managed cloud services, which is suitable for our current scale.
- **TLS Termination:** It provides a single, centralized point for managing TLS certificates and enforcing HTTPS, simplifying the security posture of backend services.

## Consequences

**Positive:**
- **Single Entry Point:** All public traffic is routed through a single, manageable gateway.
- **Centralized TLS Management:** Simplifies certificate issuance, rotation, and security policy enforcement.
- **Decoupling:** Backend services are decoupled from the public internet and don't need to handle TLS or complex routing logic.
- **Rich Logging:** Nginx's logging capabilities are highly configurable, enabling us to meet compliance requirements (like the Thailand DCA) and feed data into our observability stack.

**Negative:**
- **Single Point of Failure:** The gateway itself can become a bottleneck or a single point of failure. This will be mitigated in future phases with high-availability setups (e.g., multiple gateway instances).
- **Configuration Management:** Nginx configuration can become complex as the number of services grows. This requires disciplined management and testing.

**Neutral:**
- This decision establishes a pattern for edge routing that can be migrated to a more advanced API gateway or service mesh in the future (e.g., Kubernetes Ingress, Istio Gateway) while preserving the core routing logic.
