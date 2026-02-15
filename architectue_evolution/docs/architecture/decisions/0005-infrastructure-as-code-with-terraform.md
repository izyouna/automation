# ADR-005: Infrastructure as Code with Terraform

**Date:** 2026-02-13

**Status:** Accepted

## Context

The initial infrastructure was defined imperatively using `docker-compose.yml`. While suitable for local development, this approach has several limitations for managing multiple environments (dev, staging, prod) and ensuring consistency:
- **Manual Changes:** Changes to the infrastructure are manual, error-prone, and not easily auditable.
- **Environment Drift:** It's easy for environments to become inconsistent over time.
- **No State Management:** There is no clear record of the intended state of the infrastructure versus its actual state.
- **Lack of Reusability:** Recreating the environment from scratch is a manual process.

## Decision

We will adopt **Terraform** as our Infrastructure as Code (IaC) tool to declaratively manage all infrastructure resources, including Docker networks, volumes, and containers.

**Justification:**
- **Declarative Syntax:** Terraform allows us to define the *desired state* of our infrastructure, and it handles the logic to achieve that state.
- **State Management:** It creates a state file that tracks the current state of managed resources, enabling planning and impact analysis before applying changes.
- **Multi-Environment Support:** Using variables and workspaces, we can manage multiple environments (dev, staging, prod) from a single, reusable codebase, preventing environment drift.
- **Provider Ecosystem:** While we are starting with the Docker provider, Terraform's extensive provider ecosystem means we can use the same workflow to manage cloud resources (e.g., on AWS, Azure, GCP) in the future.
- **Version Controlled:** Infrastructure code will be stored in Git, providing a full audit trail of all changes.

## Consequences

**Positive:**
- **Reproducibility:** Environments can be created and destroyed reliably and automatically.
- **Consistency:** Ensures that all environments are configured identically, reducing "it works on my machine" issues.
- **Auditable Changes:** All infrastructure changes are reviewed and approved through pull requests.
- **Disaster Recovery:** Greatly simplifies the process of rebuilding the entire infrastructure from scratch.
- **Enables Automation:** Forms the foundation for our CI/CD pipelines to automate deployments.

**Negative:**
- **Learning Curve:** The team needs to learn HCL (HashiCorp Configuration Language) and Terraform concepts.
- **State File Management:** The Terraform state file is critical and must be managed carefully (e.g., using a remote backend like S3 in the future).

**Neutral:**
- This shifts the responsibility of infrastructure management from manual operations to a code-based, engineering discipline.
