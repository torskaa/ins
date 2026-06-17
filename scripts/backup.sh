#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_PATH="${DB_PATH:-./prisma/dev.db}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ins_backup_$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$BACKUP_FILE"
  echo "Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "Database not found at $DB_PATH"
  exit 1
fi

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/ins_backup_*.db 2>/dev/null | tail -n +31 | xargs -r rm
echo "Cleaned old backups (kept last 30)"
