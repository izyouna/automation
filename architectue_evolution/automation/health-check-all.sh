#!/bin/bash
# Comprehensive health check for all services

echo "╔════════════════════════════════════════╗"
echo "║  COMPREHENSIVE HEALTH CHECK            ║"
echo "╚════════════════════════════════════════╝"
echo ""

SERVICES=("mockup-gateway" "mime-server" "public_app" "intranet_api")
FAILED=0

for service in "${SERVICES[@]}"; do
  echo -n "Checking $service... "
  
  if docker ps --filter "name=$service" --quiet > /dev/null; then
    status=$(docker inspect -f '{{.State.Running}}' $service)
    if [ "$status" = "true" ]; then
      echo "✓ Running"
    else
      echo "✗ Stopped"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "✗ Not found"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "Network Health:"
docker network inspect public_net --format='{{.Driver}}' > /dev/null 2>&1 && echo "✓ public_net" || echo "✗ public_net"
docker network inspect private_net --format='{{.Driver}}' > /dev/null 2>&1 && echo "✓ private_net" || echo "✗ private_net"

echo ""
echo "Storage Health:"
docker run --rm -v mime_storage:/storage busybox du -sh /storage

if [ $FAILED -eq 0 ]; then
  echo ""
  echo "✓ All checks passed"
  exit 0
else
  echo ""
  echo "✗ $FAILED checks failed"
  exit 1
fi
