# Phase 2: Kubernetes Migration Plan

**Date:** 2026-02-13

**Status:** Proposed

## Context

Phase 1 established a solid foundation with IaC, monitoring, and CI/CD. However, the current Podman/docker-compose deployment model has limitations for production-grade scalability, fault tolerance, and automated management. To achieve true cloud-native capabilities, we need a container orchestration platform.

**Limitations of Current State:**
- **No Auto-Scaling:** Scaling services requires manual intervention.
- **Limited Fault Tolerance:** If a container fails, it does not automatically restart or get replaced.
- **Complex Service Discovery:** Service-to-service communication relies on static IPs and Docker's DNS.
- **Manual Rollouts:** Deploying updates requires manual steps and potential downtime.

## Decision

We will migrate the entire application stack from Podman/docker-compose to **Kubernetes**. This will involve containerizing all services and defining their deployments, services, and configurations as Kubernetes manifests.

**Justification:**
- **Scalability:** Kubernetes provides horizontal pod autoscaling to automatically adjust the number of running containers based on CPU or memory usage.
- **Self-Healing:** It automatically restarts failed containers, replaces unhealthy nodes, and reschedules workloads, providing high availability.
- **Service Discovery & Load Balancing:** Kubernetes has built-in DNS for service discovery and can load balance traffic across multiple instances of a service.
- **Automated Rollouts & Rollbacks:** It supports declarative updates with strategies like rolling updates, enabling zero-downtime deployments and easy rollbacks.
- **Ecosystem:** As the de facto standard for container orchestration, Kubernetes has a vast and mature ecosystem of tools and integrations for networking, storage, security, and monitoring.

## Phase 2 Execution Plan

### 1. Kubernetes Manifests Creation (Week 1)

We will create Kubernetes YAML manifests for each component of our architecture.

**Directory Structure:**
```
kubernetes/
├── base/
│   ├── namespace.yml
│   ├── network-policy.yml
│   ├── gateway-deployment.yml
│   ├── gateway-service.yml
│   ├── mime-server-deployment.yml
│   ├── mime-server-service.yml
│   ├── public-app-deployment.yml
│   ├── ... (and so on for all services)
│   └── kustomization.yml
├── overlays/
│   ├── dev/
│   │   ├── configmap.yml
│   │   └── kustomization.yml
│   ├── staging/
│   │   ├── ...
│   └── prod/
│       ├── ...
└── README.md
```

We will use **Kustomize** for managing environment-specific configurations, which allows us to have a `base` set of manifests and apply patches for `dev`, `staging`, and `prod`.

### 2. CI/CD Pipeline Integration (Week 2)

The existing GitHub Actions workflow will be updated to build and push container images to a registry (e.g., GitHub Container Registry) and then apply the Kubernetes manifests.

**Updated `deploy.yml`:**
```yaml
jobs:
  deploy:
    steps:
    - name: Build and Push Docker Image
      # ... (existing build steps)

    - name: Configure Kubectl
      uses: azure/k8s-setup-kubectl@v3

    - name: Deploy to Kubernetes
      run: |
        kubectl apply -k kubernetes/overlays/staging
```

### 3. Observability Stack Migration (Week 3)

The existing observability stack (Prometheus, Grafana, Jaeger, Loki) will be migrated to run within the Kubernetes cluster, using community-standard Helm charts.

- **Prometheus:** Use the `kube-prometheus-stack` Helm chart for cluster-wide monitoring.
- **Loki:** Use the official Loki Helm chart for log aggregation.
- **Jaeger:** Use the Jaeger Operator to manage tracing components.
- **Grafana:** Included in the `kube-prometheus-stack` chart.

### 4. Ingress and TLS Management (Week 4)

We will replace the Nginx gateway container with a standard Kubernetes **Ingress Controller** (e.g., Nginx Ingress Controller) to manage external access to services.

**TLS certificates** will be automatically managed using **cert-manager**, which will provision and renew certificates from Let's Encrypt.

## Consequences

**Positive:**
- **Massive Scalability & Resilience:** The system will be able to handle significant load and recover automatically from failures.
- **Simplified Operations:** Automated rollouts, service discovery, and self-healing reduce the manual operational burden.
- **Cloud-Agnostic:** Kubernetes provides a consistent platform that can run on any major cloud provider or on-premises.
- **Increased Developer Velocity:** Developers can deploy and manage their services independently with greater confidence.

**Negative:**
- **Increased Complexity:** Kubernetes has a steep learning curve. The team will require training and time to become proficient.
- **Higher Resource Overhead:** A Kubernetes cluster requires more baseline resources (CPU/memory) for its control plane components compared to a simple Docker host.

**Neutral:**
- This is a significant step towards a fully cloud-native architecture, positioning the project for long-term growth and maintainability.
