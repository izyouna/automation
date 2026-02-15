# Architecture Evolution Plan: Phase 1 Execution

**Date Created:** February 13, 2026  
**Current State:** Production-grade stateful monolith (30% cloud-native ready)  
**Target:** Foundation for enterprise scaling

---

## Phase 1: Foundation (2-4 weeks)

### Objectives
Transform current docker-compose architecture into enterprise-ready foundation with:
- ✅ Health checks for all services (liveness + readiness)
- ✅ Infrastructure as Code with Terraform
- ✅ Prometheus monitoring + Grafana dashboards
- ✅ CI/CD pipeline (GitHub Actions)

---

## Phase 1 Deliverables

### 1️⃣ Health Checks Implementation

**Target Services:**
- mockup-gateway (Nginx)
- public_app (Python HTTP)
- intranet_api (Flask)
- mime-server (Socket service)
- mime-client (On-demand)

**Health Check Types:**
- **Liveness:** Is the service alive? (restart if failing)
- **Readiness:** Is the service ready to accept traffic?
- **Startup:** Is the service initializing?

**Files to Create:**
```
├── health-checks/
│   ├── gateway-health.sh          # Nginx health check
│   ├── app-health.py              # Python app health endpoint
│   ├── api-health.py              # Flask health endpoint
│   ├── mime-server-health.py      # Socket service health check
│   └── healthcheck-config.yml     # Docker health config
```

---

### 2️⃣ Terraform Infrastructure as Code

**Objective:** Replace hardcoded docker-compose with Terraform

**File Structure:**
```
├── terraform/
│   ├── main.tf                    # Main infrastructure
│   ├── variables.tf               # Input variables
│   ├── outputs.tf                 # Output values
│   ├── networks.tf                # Network definitions
│   ├── services.tf                # Service definitions
│   ├── environments/
│   │   ├── dev.tfvars             # Development variables
│   │   ├── staging.tfvars         # Staging variables
│   │   └── prod.tfvars            # Production variables
│   └── modules/
│       ├── network/
│       ├── service/
│       └── monitoring/
```

**Key Features:**
- Multi-environment support (dev/staging/prod)
- State management
- Variable parameterization (no hardcoded IPs)
- Output documentation
- Drift detection

---

### 3️⃣ Monitoring Stack (Prometheus + Grafana)

**Architecture:**
```
Services (with metrics exporters)
        ↓
   Prometheus (scrapes metrics)
        ↓
   Grafana (visualizes metrics)
        ↓
   Alerts (PagerDuty/Slack)
```

**Files to Create:**
```
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml         # Prometheus config
│   │   └── rules.yml              # Alert rules
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   ├── mime-transfer.json
│   │   │   ├── gateway.json
│   │   │   └── system-health.json
│   │   └── provisioning/
│   │       └── datasources.yml
│   └── docker-compose.monitoring.yml
```

**Metrics to Collect:**
- Service uptime/downtime
- Request latency (p50, p95, p99)
- File transfer success rate
- Gateway error rates (4xx, 5xx)
- Storage volume usage
- Network throughput
- CPU/Memory per service

---

### 4️⃣ CI/CD Pipeline (GitHub Actions)

**Workflow Stages:**
```
Code Push → Lint → Test → Build → Registry → Deploy
```

**Files to Create:**
```
├── .github/workflows/
│   ├── test.yml                   # Run tests on PR
│   ├── build.yml                  # Build containers
│   ├── deploy.yml                 # Deploy to staging/prod
│   └── health-check.yml           # Post-deploy verification
```

**Pipeline Steps:**
1. **Lint:** Code quality checks (pylint, shellcheck)
2. **Test:** Unit tests + integration tests
3. **Build:** Create container images
4. **Push:** Push to registry (Docker/GitHub Container Registry)
5. **Deploy:** Deploy via podman-compose / Kubernetes
6. **Verify:** Health checks + smoke tests

---

## Phase 1.5: Architecture Decision Records (ADRs)

**Objective:** Document key architectural decisions to ensure clarity and consistency.

**File Structure:**
```
├── docs/
│   └── architecture/
│       └── decisions/
│           ├── 0001-record-architecture-decisions.md
│           ├── 0002-dual-network-mime-server.md
│           ├── 0003-nginx-as-l7-gateway.md
│           ├── 0004-comprehensive-observability-stack.md
│           ├── 0005-infrastructure-as-code-with-terraform.md
│           └── README.md
```

**Key Decisions Captured:**
- **ADR-001:** Formal adoption of ADRs for decision logging.
- **ADR-002:** Use of a dual-network design for security and performance.
- **ADR-003:** Selection of Nginx as the L7 gateway for flexibility and control.
- **ADR-004:** Choice of a self-hosted observability stack (Prometheus, Loki, Jaeger).
- **ADR-005:** Adoption of Terraform for Infrastructure as Code.

---

## Phase 1 Execution Steps

### Step 1: Health Checks (Day 1-2)

#### Create health check endpoints

**gateway-health.sh** - Check Nginx is responding
```bash
#!/bin/bash
curl -sf http://localhost/health || exit 1
curl -sf https://localhost/health --insecure || exit 1
```

**app-health.py** - Add health endpoint to public_app
```python
from flask import Flask, jsonify

@app.route('/health/live', methods=['GET'])
def liveness():
    """Liveness check - is service running?"""
    return jsonify(status='alive'), 200

@app.route('/health/ready', methods=['GET'])
def readiness():
    """Readiness check - can accept traffic?"""
    if is_db_connected():
        return jsonify(status='ready'), 200
    return jsonify(status='not ready'), 503
```

#### Update docker-compose.yml with health checks
```yaml
services:
  mockup-gateway:
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mime-server:
    healthcheck:
      test: ["CMD", "python", "/app/health-check.py"]
      interval: 30s
      timeout: 5s
      retries: 2
```

---

### Step 2: Terraform Infrastructure (Day 3-5)

#### Convert docker-compose to Terraform

**terraform/main.tf**
```hcl
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "docker" {
  host = "unix:///var/run/podman/podman.sock"
}

resource "docker_network" "public_net" {
  name     = "public_net"
  driver   = "bridge"
  ipam_config {
    subnet = "172.18.0.0/16"
  }
}

resource "docker_network" "private_net" {
  name     = "private_net"
  driver   = "bridge"
  ipam_config {
    subnet = "172.19.0.0/16"
  }
}

resource "docker_container" "mime_server" {
  image = docker_image.mime_server.image_id
  name  = "mime-server"
  
  networks_advanced {
    name         = docker_network.public_net.name
    ipv4_address = var.mime_server_public_ip
  }
  
  networks_advanced {
    name         = docker_network.private_net.name
    ipv4_address = var.mime_server_private_ip
  }
  
  ports {
    internal = 65432
    external = var.mime_server_port
  }
  
  volumes {
    volume_name    = docker_volume.mime_storage.name
    container_path = "/storage"
  }
  
  env = [
    "PYTHONIOENCODING=utf-8",
    "STORAGE_DIR=/storage"
  ]
  
  healthcheck {
    test     = ["CMD", "python", "/app/health-check.py"]
    interval = "30s"
    timeout  = "5s"
    retries  = 2
  }
}
```

**terraform/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "mime_server_replicas" {
  description = "Number of MIME server replicas"
  type        = number
  default     = 1
}

variable "mime_server_public_ip" {
  description = "MIME server IP on public_net"
  type        = string
  default     = "172.18.0.4"
}

variable "mime_server_private_ip" {
  description = "MIME server IP on private_net"
  type        = string
  default     = "172.19.0.5"
}

variable "enable_monitoring" {
  description = "Enable Prometheus/Grafana"
  type        = bool
  default     = true
}
```

#### Deploy with Terraform
```bash
cd terraform
terraform init
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

---

### Step 3: Monitoring Stack (Day 5-7)

#### Create Prometheus config
**monitoring/prometheus/prometheus.yml**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']

  - job_name: 'mime-server'
    static_configs:
      - targets: ['mime-server:8000']
    metrics_path: '/metrics'

  - job_name: 'gateway'
    static_configs:
      - targets: ['mockup-gateway:9113']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

alert_rules:
  - /etc/prometheus/rules.yml
```

#### Create Grafana dashboards
**monitoring/grafana/dashboards/mime-transfer.json**
```json
{
  "dashboard": {
    "title": "MIME Transfer Service",
    "refresh": "10s",
    "panels": [
      {
        "title": "File Transfer Rate",
        "targets": [
          {
            "expr": "rate(file_transfers_total[5m])"
          }
        ]
      },
      {
        "title": "Average Transfer Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, transfer_duration_seconds)"
          }
        ]
      },
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "active_connections"
          }
        ]
      }
    ]
  }
}
```

#### Deploy monitoring
```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana: http://localhost:3000
# Default: admin/admin
```

---

### Step 4: CI/CD Pipeline (Day 7-9)

#### Create GitHub Actions workflow
**.github/workflows/test.yml**
```yaml
name: Test & Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      docker:
        image: docker:latest
        options: --privileged

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Lint with pylint
      run: |
        pylint mockup-infra/gateway/ week01-mime-typing/
    
    - name: Run unit tests
      run: |
        pytest tests/ -v --cov=. --cov-report=xml
    
    - name: Run integration tests
      run: |
        docker-compose -f docker-compose.test.yml up --abort-on-container-exit
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build services
      run: |
        docker build -f mockup-infra/gateway/Dockerfile -t mime-gateway:latest .
        docker build -f week01-mime-typing/Dockerfile.server -t mime-server:latest .
        docker build -f week01-mime-typing/Dockerfile.client -t mime-client:latest .
    
    - name: Push to registry
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      run: |
        echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login -u "${{ secrets.REGISTRY_USERNAME }}" --password-stdin
        docker tag mime-gateway:latest registry.example.com/mime-gateway:${{ github.sha }}
        docker push registry.example.com/mime-gateway:${{ github.sha }}
```

**.github/workflows/deploy.yml**
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      run: |
        cd terraform
        terraform init
        terraform apply -auto-approve -var-file=environments/staging.tfvars
    
    - name: Run health checks
      run: |
        bash tests/health-check.sh
    
    - name: Deploy to production
      if: success()
      run: |
        cd terraform
        terraform apply -auto-approve -var-file=environments/prod.tfvars
    
    - name: Notify deployment
      if: always()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Deployment status: ${{ job.status }}'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Phase 1 Deliverables Checklist

- [ ] Health checks added to all services
- [ ] Health check endpoints implemented
- [ ] docker-compose.yml updated with healthcheck configs
- [ ] Terraform infrastructure created (main.tf, variables.tf, etc.)
- [ ] Multi-environment setup (dev/staging/prod)
- [ ] Terraform deployment verified
- [ ] Prometheus configured and running
- [ ] Grafana dashboards created
- [ ] GitHub Actions workflows added
- [ ] CI/CD pipeline tested
- [ ] Monitoring dashboards accessible
- [ ] Alerts configured
- [ ] Documentation updated

---

## Success Criteria

✅ **Health Checks:**
- All services respond to health probes within 5s
- Docker reports correct health status
- Restarted services are detected automatically

✅ **Terraform:**
- Infrastructure codified
- `terraform plan` shows correct resources
- Multiple environments deployable
- State file properly managed

✅ **Monitoring:**
- Prometheus scrapes all targets
- Grafana dashboards display metrics
- Alert rules trigger on thresholds
- Historical data available for 30 days

✅ **CI/CD:**
- Tests pass on every push
- Build artifacts created
- Deployment occurs on main branch push
- Rollback available via terraform

---

## Timeline

| Week | Task | Deliverable |
|------|------|------------|
| 1 (Days 1-2) | Health checks | All services reporting health |
| 1 (Days 3-5) | Terraform | Multi-environment infrastructure |
| 1 (Days 5-7) | Monitoring | Prometheus + Grafana operational |
| 2 (Days 7-9) | CI/CD | GitHub Actions pipelines |
| 2 (Days 9-14) | Integration & testing | Full phase validation |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Terraform state corruption | Regular backups, use terraform remote state |
| Health check false positives | Tune intervals and thresholds |
| Monitoring data explosion | Configure retention policies, metric filtering |
| CI/CD slowdown | Parallel jobs, caching, artifact caching |

---

## Next Phases Preview

**Phase 2 (4-6 weeks):** Kubernetes migration, horizontal scaling
**Phase 3 (6-8 weeks):** Event-driven architecture (Kafka)
**Phase 4 (4-6 weeks):** Policy enforcement (OPA, service mesh)

---

**Ready to Execute Phase 1? Run: `evolution_phase1.sh`**
