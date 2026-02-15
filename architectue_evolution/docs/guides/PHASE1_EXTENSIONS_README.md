# Phase 1 Extensions: Advanced Monitoring & Automation

**Added to base Phase 1:** Distributed tracing, log aggregation, SLA/SLO tracking, automation

---

## Extensions Overview

### 1. Distributed Tracing (Jaeger)
**Purpose:** Track request flows across services

```bash
# Deploy Jaeger
cd monitoring/jaeger
docker-compose -f docker-compose.jaeger.yml up -d

# Access UI: http://localhost:16686
```

**Capabilities:**
- End-to-end request tracing
- Service dependency discovery
- Latency analysis
- Error correlation

**Integration:**
Add to week01-mime-typing/server.py:
```python
from jaeger_client import Config

tracer = init_tracer('mime-server')

with tracer.start_active_span('operation'):
    # Your code here
    pass
```

---

### 2. Log Aggregation (Loki + Promtail)
**Purpose:** Centralized log storage and querying

```bash
# Deploy Loki stack
cd monitoring/loki
docker-compose -f docker-compose.loki.yml up -d

# Query logs in Grafana:
# Add Loki datasource:
#   URL: http://loki:3100
#   Then use: {service="mime-server"}
```

**Capabilities:**
- Log collection from containers
- Efficient log storage
- Query via LogQL language
- Integration with Grafana

**Query Examples:**
```
{service="mime-server"} | json | status="error"
{container="mockup-gateway"} | json level="warn" | stats count()
```

---

### 3. SLA/SLO Monitoring
**Purpose:** Track service level commitments

**SLA Definition:**
- Availability: 99.9% uptime/month
- Error Rate: < 0.1%
- Latency (p95): < 1 second

**SLO Targets:**
- Availability: 99.95%
- Error Rate: < 0.01%
- Latency (p95): < 500ms

**Error Budget:**
- Allowed errors/month: 0.1% × 43,200 min = 43.2 min
- If exceeded: SLA violation, trigger incident response

**Monitor:**
```bash
# Access SLA/SLO dashboard in Grafana
# Look for "Error Budget Remaining" metric
# Alert triggers at 50% budget consumed
```

---

### 4. Automation Scripts
**Purpose:** Operational automation

```bash
# Health check all services
bash automation/health-check-all.sh

# Backup MIME storage
bash automation/backup-mime-storage.sh

# Load testing (replay traffic)
python automation/replay-traffic.py

# Export metrics to CSV
bash automation/export-metrics.sh > metrics.csv
```

**Backup Strategy:**
- Daily backups of mime_storage volume
- Compressed tar.gz format
- Supports S3 upload (optional)
- Retention policy configurable

---

### 5. Advanced Alerting (Alertmanager)
**Purpose:** Intelligent alert routing and deduplication

```bash
# Deploy Alertmanager
cd monitoring/alertmanager
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export PAGERDUTY_KEY="pagerduty_integration_key"
docker-compose -f docker-compose.alertmanager.yml up -d

# Access: http://localhost:9093
```

**Alert Routing:**
- Critical → PagerDuty (on-call)
- Warning → Slack #alerts
- MIME ServerDown → Slack #ops-critical

**Features:**
- Alert deduplication
- Grouping by alertname/service
- Inhibit rules (suppress secondary alerts)

---

## Deployment Order

### 1. Core Monitoring (if not already done)
```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d   # Prometheus + Grafana
```

### 2. Add Distributed Tracing
```bash
cd monitoring/jaeger
docker-compose -f docker-compose.jaeger.yml up -d
```

### 3. Add Log Aggregation
```bash
cd monitoring/loki
docker-compose -f docker-compose.loki.yml up -d
```

### 4. Add Alertmanager
```bash
cd monitoring/alertmanager
export SLACK_WEBHOOK_URL="..."
docker-compose -f docker-compose.alertmanager.yml up -d
```

### 5. Validate All Services
```bash
bash automation/health-check-all.sh
```

---

## Integration with Base Phase 1

These extensions enhance but don't replace core Phase 1:
- ✅ Terraform module still manages core infrastructure
- ✅ Health checks still functional
- ✅ CI/CD pipeline unchanged
- ✅ All additive (non-breaking changes)

---

## Resource Requirements

| Component | Memory | Storage | Notes |
|-----------|--------|---------|-------|
| Jaeger | 200MB | 1GB | Trace storage |
| Loki | 200MB | 5GB | Log storage (7-day default) |
| Alertmanager | 50MB | 100MB | State only |
| Promtail | 50MB | - | No disk usage |
| **Total Additional** | **500MB** | **6GB** | Beyond base Phase 1 |

---

## Monitoring the Extensions

### Jaeger Metrics
```
jaeger_traces_received_total
jaeger_traces_dropped_total
jaeger_sampling_strategy_updated_total
```

### Loki Metrics
```
loki_log_entries_received_total
loki_log_bytes_received_total
loki_distributor_chunks_per_stream
```

### Alertmanager Metrics
```
alertmanager_alerts
alertmanager_alerts_received_total
alertmanager_notifications_total
```

---

## Troubleshooting

**Jaeger not receiving traces?**
```bash
# Check tracer is initialized and sending to localhost:6831
# Verify JAEGER_AGENT_HOST and JAEGER_AGENT_PORT env vars
docker logs jaeger | grep "listening"
```

**Loki not receiving logs?**
```bash
# Verify Promtail can reach Loki
curl http://loki:3100/loki/api/v1/status
docker logs promtail | grep error
```

**Alerts not firing?**
```bash
# Check Prometheus alert rules loaded
curl http://localhost:9090/api/v1/rules | jq .
# Verify Alertmanager endpoints in Prometheus config
curl http://localhost:9090/api/v1/status
```

---

## Next Steps

1. **Deploy extensions** following deployment order
2. **Configure integrations** (Slack, PagerDuty webhooks)
3. **Test alerts** by triggering test rules
4. **Load testing** using replay-traffic.py
5. **Review SLA/SLO dashboards** daily
6. **Validate backups** weekly
7. **Iterate** based on operational experience

---

## Metrics for Success

✅ **Observability:**
- Tracing: 100% of requests traced
- Logging: 100% of errors logged
- Metrics: All services emitting > 50 metrics

✅ **Operational Excellence:**
- MTTR: < 5 minutes (with automated alerts)
- False alert rate: < 5%
- Alert acknowledgment: < 2 minutes

✅ **SLA Compliance:**
- Monthly availability: > 99.9%
- Error rate: < 0.1%
- p95 latency: < 1 second

---

**Extensions Ready for Deployment** ✅  
**Cloud-Readiness: 60% → 70%** (approximate)
