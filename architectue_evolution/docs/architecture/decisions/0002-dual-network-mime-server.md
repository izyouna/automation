# ADR-002: Dual-Network Design for MIME Server

**Date:** 2026-02-13

**Status:** Accepted

## Context

The MIME file transfer service has two primary access patterns:
1.  **Public Access:** External clients need to upload files through the public-facing gateway. This traffic is untrusted and must be filtered and controlled.
2.  **Internal Access:** Backend services, administrative scripts, or future data processing jobs may need to access the stored files directly for management, analysis, or retrieval. This traffic is considered trusted.

A single network interface would force all traffic through the same path, creating security risks (e.g., internal services exposed to public traffic) and operational complexity (e.g., routing rules to differentiate traffic).

## Decision

The `mime-server` container will be attached to two distinct Docker networks:
1.  `public_net`: A bridge network for communication with the Nginx gateway.
2.  `private_net`: An internal-only network for communication with other backend services or administrative tools.

The Nginx gateway will proxy public requests to the `mime-server`'s IP on the `public_net`. Internal services will connect directly to the `mime-server`'s IP on the `private_net`. The `private_net` is configured with `internal: true` in Docker, preventing any outbound traffic from it to the host or the internet.

## Consequences

**Positive:**
- **Enhanced Security:** Provides network-level isolation between public and internal traffic. Internal services are not exposed on the public network.
- **Simplified Routing:** The gateway only needs to handle public traffic. Internal communication is direct and doesn't require complex routing rules.
- **Performance:** Internal services can access the MIME storage with lower latency by bypassing the gateway proxy.
- **Flexibility:** Allows for different security policies or network configurations to be applied to each network.

**Negative:**
- **Increased Complexity:** The container has two network interfaces, which can be slightly more complex to manage and debug.
- **IP Management:** Requires careful management of IP addresses on two separate subnets.

**Neutral:**
- This design is a foundational pattern that will be replicated for other services requiring similar access controls.
