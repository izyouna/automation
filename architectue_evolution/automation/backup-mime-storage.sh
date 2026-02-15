#!/bin/bash
# Backup MIME storage volume to timestamped archive

BACKUP_DIR="${BACKUP_DIR:-.}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mime-storage-backup-$TIMESTAMP.tar.gz"

echo "Starting MIME storage backup..."
echo "Target: $BACKUP_FILE"

# Create backup from running container
docker run --rm \
  -v mime_storage:/storage:ro \
  -v "$BACKUP_DIR":/backup \
  busybox tar czf /backup/mime-storage-backup-$TIMESTAMP.tar.gz -C / storage

if [ $? -eq 0 ]; then
  echo "✓ Backup successful: $BACKUP_FILE"
  echo "Size: $(du -h $BACKUP_FILE | cut -f1)"
  
  # Optional: Upload to S3
  # aws s3 cp "$BACKUP_FILE" "s3://my-bucket/backups/"
else
  echo "✗ Backup failed"
  exit 1
fi
