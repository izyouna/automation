#!/bin/bash

# Phase 2: Kubernetes Migration Execution Script
# This script automates the creation of all necessary Kubernetes manifests
# and configuration files for migrating the application to Kubernetes.

set -e

K8S_DIR="kubernetes"
BASE_DIR="$K8S_DIR/base"
OVERLAYS_DIR="$K8S_DIR/overlays"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  PHASE 2: KUBERNETES MIGRATION                             ║"
echo "║  Generating all required manifests and configurations      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# STEP 1: CREATE DIRECTORY STRUCTURE
# ============================================================================

echo "▶ STEP 1: Creating Kubernetes directory structure"
mkdir -p "$BASE_DIR"
mkdir -p "$OVERLAYS_DIR/dev"
mkdir -p "$OVERLAYS_DIR/staging"
mkdir -p "$OVERLAYS_DIR/prod"
echo "✓ Directory structure created"
echo ""

# ============================================================================
# STEP 2: CREATE BASE MANIFESTS
# ============================================================================

echo "▶ STEP 2: Generating Base Kubernetes Manifests"

# --- Namespace ---
cat > "$BASE_DIR/namespace.yml" << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: mime-infra
EOF

# --- Gateway Deployment ---
cat > "$BASE_DIR/gateway-deployment.yml" << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
  labels:
    app: gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        - containerPort: 443
        volumeMounts:
        - name: nginx-config
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf
        - name: tls-certs
          mountPath: /etc/nginx/certs
          readOnly: true
      volumes:
      - name: nginx-config
        configMap:
          name: gateway-config
      - name: tls-certs
        secret:
          secretName: gateway-tls
EOF

# --- Gateway Service ---
cat > "$BASE_DIR/gateway-service.yml" << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: gateway
spec:
  type: LoadBalancer
  selector:
    app: gateway
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: https
    port: 443
    targetPort: 443
EOF

# --- MIME Server Deployment ---
cat > "$BASE_DIR/mime-server-deployment.yml" << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mime-server
  labels:
    app: mime-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mime-server
  template:
    metadata:
      labels:
        app: mime-server
    spec:
      containers:
      - name: mime-server
        image: boonsup/mime-server:latest
        ports:
        - containerPort: 8000
        volumeMounts:
        - name: mime-storage
          mountPath: /storage
        env:
        - name: STORAGE_DIR
          value: "/storage"
      volumes:
      - name: mime-storage
        persistentVolumeClaim:
          claimName: mime-storage-pvc
EOF

# --- MIME Server Service ---
cat > "$BASE_DIR/mime-server-service.yml" << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: mime-server
spec:
  selector:
    app: mime-server
  ports:
  - port: 8000
    targetPort: 8000
EOF

# --- Persistent Volume Claim for MIME Storage ---
cat > "$BASE_DIR/mime-storage-pvc.yml" << 'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mime-storage-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF

# --- Public App Deployment ---
cat > "$BASE_DIR/public-app-deployment.yml" << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: public-app
  labels:
    app: public-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: public-app
  template:
    metadata:
      labels:
        app: public-app
    spec:
      containers:
      - name: public-app
        image: boonsup/public-app:latest
        ports:
        - containerPort: 5000
EOF

# --- Public App Service ---
cat > "$BASE_DIR/public-app-service.yml" << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: public-app
spec:
  selector:
    app: public-app
  ports:
  - port: 5000
    targetPort: 5000
EOF

# --- Network Policy ---
cat > "$BASE_DIR/network-policy.yml" << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-gateway-to-services
spec:
  podSelector:
    matchLabels:
      app: mime-server
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: gateway
    ports:
    - port: 8000
EOF

echo "✓ Base manifests created"
echo ""

# ============================================================================
# STEP 3: CREATE KUSTOMIZATION FILES
# ============================================================================

echo "▶ STEP 3: Generating Kustomization Files"

# --- Base Kustomization ---
cat > "$BASE_DIR/kustomization.yml" << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: mime-infra

resources:
- namespace.yml
- gateway-deployment.yml
- gateway-service.yml
- mime-server-deployment.yml
- mime-server-service.yml
- mime-storage-pvc.yml
- public-app-deployment.yml
- public-app-service.yml
- network-policy.yml

configMapGenerator:
- name: gateway-config
  files:
  - nginx.conf=./nginx.conf
EOF

# --- Nginx Config for Base ---
cat > "$BASE_DIR/nginx.conf" << 'EOF'
worker_processes 1;
events { worker_connections 1024; }
http {
    server {
        listen 80;
        location / {
            proxy_pass http://public-app:5000;
        }
        location /upload {
            proxy_pass http://mime-server:8000;
        }
    }
}
EOF

# --- Dev Overlay ---
cat > "$OVERLAYS_DIR/dev/kustomization.yml" << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base

patchesStrategicMerge:
- |-
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: mime-server
  spec:
    replicas: 1
EOF

# --- Staging Overlay ---
cat > "$OVERLAYS_DIR/staging/kustomization.yml" << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base

replicas:
- name: gateway
  count: 2
- name: mime-server
  count: 3
- name: public-app
  count: 2
EOF

# --- Prod Overlay ---
cat > "$OVERLAYS_DIR/prod/kustomization.yml" << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base

replicas:
- name: gateway
  count: 3
- name: mime-server
  count: 5
- name: public-app
  count: 3

patchesStrategicMerge:
- |-
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: mime-storage-pvc
  spec:
    resources:
      requests:
        storage: 100Gi
EOF

echo "✓ Kustomization files created for dev, staging, and prod"
echo ""

# ============================================================================
# STEP 4: CREATE HELM CONFIGURATIONS FOR OBSERVABILITY
# ============================================================================

echo "▶ STEP 4: Generating Helm Configurations for Observability"

mkdir -p "$K8S_DIR/helm"

# --- Prometheus Values ---
cat > "$K8S_DIR/helm/prometheus-values.yml" << 'EOF'
# values.yaml for kube-prometheus-stack
grafana:
  enabled: true
  adminPassword: "admin"

prometheus:
  prometheusSpec:
    scrapeInterval: "15s"
    evaluationInterval: "15s"
    serviceMonitorSelector:
      matchLabels:
        release: prometheus
EOF

# --- Loki Values ---
cat > "$K8S_DIR/helm/loki-values.yml" << 'EOF'
# values.yaml for loki-stack
loki:
  persistence:
    enabled: true
    size: 20Gi

promtail:
  enabled: true
EOF

# --- Jaeger Values ---
cat > "$K8S_DIR/helm/jaeger-values.yml" << 'EOF'
# values.yaml for jaeger
provisionDataStore:
  cassandra: false
  elasticsearch: false
storage:
  type: memory
EOF

echo "✓ Helm values files created for Prometheus, Loki, and Jaeger"
echo ""

# ============================================================================
# STEP 5: CREATE DEPLOYMENT GUIDE
# ============================================================================

echo "▶ STEP 5: Generating Deployment Guide"

cat > "$K8S_DIR/README.md" << 'EOF'
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
EOF

echo "✓ Deployment guide created"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  PHASE 2 EXECUTION SCRIPT COMPLETE                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📦 ARTIFACTS CREATED:"
echo "  ✓ Kubernetes base manifests for all services"
echo "  ✓ Kustomize overlays for dev, staging, and prod environments"
echo "  ✓ Helm values files for Prometheus, Loki, and Jaeger"
echo "  ✓ A comprehensive deployment guide (kubernetes/README.md)"
echo ""
echo "🚀 NEXT STEPS:"
echo "  1. Review the generated manifests in the 'kubernetes' directory."
echo "  2. Follow the instructions in 'kubernetes/README.md' to deploy to a cluster."
echo ""
