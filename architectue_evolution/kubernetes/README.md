# Phase 2: Kubernetes Deployment Guide

This guide provides instructions for deploying the application stack to a Kubernetes cluster.

## Prerequisites

1. A running Kubernetes cluster (e.g., Minikube, Kind, or a cloud provider's cluster).
2. `kubectl` configured to connect to your cluster.
3. `kustomize` installed.
4. `helm` installed.

## Deployment Steps

### 1. Deploy the Application Base

This will deploy all services into the `mime-infra` namespace.

```bash
# Preview the manifests
kustomize build kubernetes/overlays/dev

# Apply the manifests for the 'dev' environment
kubectl apply -k kubernetes/overlays/dev
```

To deploy for another environment, change `dev` to `staging` or `prod`.

### 2. Deploy the Observability Stack

We will use Helm to deploy Prometheus, Loki, and Jaeger.

```bash
# Add required Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update

# Deploy Prometheus and Grafana
helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace -f helm/prometheus-values.yml

# Deploy Loki and Promtail
helm install loki grafana/loki-stack --namespace monitoring -f helm/loki-values.yml

# Deploy Jaeger
helm install jaeger jaegertracing/jaeger --namespace monitoring -f helm/jaeger-values.yml
```

### 3. Verify the Deployment

```bash
# Check all pods in the namespace
kubectl get pods -n mime-infra

# Check services
kubectl get services -n mime-infra

# Check observability pods
kubectl get pods -n monitoring

# Port-forward to access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
# Access at http://localhost:3000 (admin/admin)
```

## Cleanup

```bash
# Delete application resources
kubectl delete -k kubernetes/overlays/dev

# Uninstall Helm charts
helm uninstall prometheus -n monitoring
helm uninstall loki -n monitoring
helm uninstall jaeger -n monitoring
```
