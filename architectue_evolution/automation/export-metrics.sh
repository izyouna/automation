#!/bin/bash
# Export Prometheus metrics to CSV for analysis

INTERVAL=${1:-60}  # Default 60 seconds
OUTPUT="metrics-export-$(date +%Y%m%d_%H%M%S).csv"
PROMETHEUS_URL="http://localhost:9090"

echo "timestamp,metric_name,value" > "$OUTPUT"

while true; do
  # Query current metrics
  curl -s "$PROMETHEUS_URL/api/v1/query" \
    --data-urlencode 'query=up' \
    --data-urlencode 'time='$(date +%s) | jq -r '.data.result[] | "\(now | floor),\(.metric.__name__),\(.value[1])"' >> "$OUTPUT"
  
  echo "Metrics exported to: $OUTPUT"
  sleep "$INTERVAL"
done
