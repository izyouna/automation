# SLA/SLO Definitions for Phase 1

## Service Level Agreement (SLA)
**Commitment to customers/users about availability**

### MIME Transfer Service SLA
- **Availability:** 99.9% uptime per month
- **Error Rate:** < 0.1% of requests fail
- **Response Time:** p95 latency < 1 second
- **Support:** Best-effort within 4 hours

## Service Level Objectives (SLO)
**Internal goals that drive how we operate**

### MIME Server SLO
- **Availability:** 99.95% (gives 0.05% buffer vs 99.9% SLA)
- **Error Rate:** < 0.01% (gives 0.09% buffer vs 0.1% SLA)
- **Latency (p95):** < 500ms (gives 500ms buffer vs 1s SLA)

### Gateway SLO
- **Availability:** 99.99%
- **Request throughput:** > 100 req/s
- **Connection errors:** < 0.001%

## Error Budget
**How much "error" is acceptable per month while still meeting SLA**

```
SLA allows: 0.1% errors
SLO target: 0.01% errors
Error budget per month: 0.1% × 60 × 24 × 30 = 432 minutes (7.2 hours)

If we use the budget:
- 90% in first week → 43.2 minutes available rest of month
- 50% in first two weeks → 216 minutes available
- 100% used → SLA violation → incident response required
```

## Monitoring & Alerting
- **Real-time dashboards:** Grafana (SLA/SLO dashboard)
- **Thresholds:** Auto-alert when 50% of error budget consumed
- **Incident trigger:** When SLA threshold likely to be breached
- **Postmortem trigger:** Every SLA violation triggers postmortem

## Example Calculation

Monitor this metric:
```
sla_violation_detected = (
  error_rate > 0.001 OR 
  availability < 0.9995 OR 
  latency_p95 > 0.5
)
```

Alert when:
```
error_budget_remaining < 50%
```
