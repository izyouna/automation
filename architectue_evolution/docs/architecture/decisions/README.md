# Architecture Decision Records (ADRs)

This directory contains the Architecture Decision Records for the MIME infrastructure project. ADRs are used to document significant architectural decisions, the context in which they were made, and their consequences.

## Index of Decisions

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-001](0001-record-architecture-decisions.md) | Record Architecture Decisions | Accepted | 2026-02-13 |
| [ADR-002](0002-dual-network-mime-server.md) | Dual-Network Design for MIME Server | Accepted | 2026-02-13 |
| [ADR-003](0003-nginx-as-l7-gateway.md) | Nginx as L7 Gateway | Accepted | 2026-02-13 |
| [ADR-004](0004-comprehensive-observability-stack.md) | Comprehensive Observability Stack | Accepted | 2026-02-13 |
| [ADR-005](0005-infrastructure-as-code-with-terraform.md) | Infrastructure as Code with Terraform | Accepted | 2026-02-13 |
| [ADR-006](ADR-006-kubernetes-orchestration.md) | Kubernetes for Container Orchestration | Proposed | 2026-02-13 |
| [ADR-007](0007-curriculum-based-domain-separation.md) | Curriculum-Based Domain Separation | Accepted | 2026-02-13 |
| [ADR-008](0008-docker-compose-profiles-domain-isolation.md) | Docker Compose Profiles for Domain Isolation | Accepted | 2026-02-13 |
| [ADR-009](0009-stateless-vs-stateful-api-pattern.md) | Stateless vs Stateful API Pattern | Accepted | 2026-02-13 |

---

## How to Create a New ADR

1.  **Copy the template:** Use `template.md` as a starting point.
2.  **Choose a filename:** Use the format `NNNN-short-description.md`, where `NNNN` is the next sequential number.
3.  **Fill out the ADR:**
    *   **Title:** A concise summary of the decision.
    *   **Status:** Start with `Proposed`.
    *   **Context:** Describe the problem and the constraints.
    *   **Decision:** Clearly state the decision and why it was chosen over alternatives.
    *   **Consequences:** List the positive and negative outcomes.
4.  **Submit a Pull Request:** The ADR will be reviewed and discussed by the team.
5.  **Update Status:** Once approved, change the status to `Accepted`.
