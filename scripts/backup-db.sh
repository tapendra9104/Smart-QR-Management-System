#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# QR Manager — Database Backup Script
# ═══════════════════════════════════════════════════════════════════════════════
#
# Backs up PostgreSQL (primary data) and ClickHouse (analytics data) to a
# timestamped directory. Designed to run as a cron job on the production server.
#
# USAGE:
#   ./scripts/backup-db.sh                    # Uses defaults from environment
#   ./scripts/backup-db.sh --dry-run          # Print commands without executing
#
# CRON EXAMPLE (daily at 2:00 AM):
#   0 2 * * * /home/deploy/qr-manager/scripts/backup-db.sh >> /var/log/qr-manager-backup.log 2>&1
#
# ENVIRONMENT VARIABLES (override defaults):
#   POSTGRES_HOST         default: localhost
#   POSTGRES_PORT         default: 5432
#   POSTGRES_DB           default: seqlams
#   POSTGRES_USER         default: postgres
#   PGPASSWORD            required for non-interactive auth
#   CLICKHOUSE_HOST       default: localhost
#   CLICKHOUSE_PORT       default: 8123
#   CLICKHOUSE_USER       default: default
#   CLICKHOUSE_PASSWORD   default: (empty)
#   BACKUP_DIR            default: /var/backups/qr-manager
#   RETENTION_DAYS        default: 30  (backups older than this are deleted)
#
# REQUIREMENTS:
#   - pg_dump  (postgresql-client package)
#   - curl     (for ClickHouse HTTP API)
#   - gzip
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-seqlams}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

CLICKHOUSE_HOST="${CLICKHOUSE_HOST:-localhost}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-8123}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-default}"
CLICKHOUSE_PASSWORD="${CLICKHOUSE_PASSWORD:-}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/qr-manager}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
DRY_RUN=false

# ── Parse arguments ────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

# ── Logging ────────────────────────────────────────────────────────────────────
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  $*"; }
warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  $*" >&2; }
err()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2; }

run() {
  if $DRY_RUN; then
    echo "[DRY-RUN] $*"
  else
    eval "$@"
  fi
}

# ── Pre-flight checks ──────────────────────────────────────────────────────────
log "Starting QR Manager backup (timestamp: ${TIMESTAMP})"
$DRY_RUN && log "DRY-RUN mode — no files will be written"

for cmd in pg_dump gzip curl; do
  if ! command -v "$cmd" &>/dev/null; then
    err "Required command not found: $cmd"
    exit 1
  fi
done

run mkdir -p "${BACKUP_PATH}"

# ── 1. PostgreSQL backup ───────────────────────────────────────────────────────
log "Backing up PostgreSQL database '${POSTGRES_DB}'..."

PG_DUMP_CMD="PGPASSWORD='${PGPASSWORD:-}' pg_dump \
  --host='${POSTGRES_HOST}' \
  --port='${POSTGRES_PORT}' \
  --username='${POSTGRES_USER}' \
  --dbname='${POSTGRES_DB}' \
  --format=custom \
  --no-password \
  --compress=9 \
  --file='${BACKUP_PATH}/postgres-${POSTGRES_DB}.dump'"

run "$PG_DUMP_CMD"
log "PostgreSQL backup complete: postgres-${POSTGRES_DB}.dump"

# ── 2. ClickHouse backup ───────────────────────────────────────────────────────
log "Backing up ClickHouse scan_events table..."

CH_AUTH=""
[ -n "${CLICKHOUSE_PASSWORD}" ] && CH_AUTH="--user ${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}"

CH_BACKUP_CMD="curl -sSf ${CH_AUTH} \
  'http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}/?query=SELECT+*+FROM+scan_events+FORMAT+Native' \
  | gzip > '${BACKUP_PATH}/clickhouse-scan-events.native.gz'"

run "$CH_BACKUP_CMD"
log "ClickHouse backup complete: clickhouse-scan-events.native.gz"

# ── 3. Write manifest ─────────────────────────────────────────────────────────
log "Writing backup manifest..."

if ! $DRY_RUN; then
  cat > "${BACKUP_PATH}/manifest.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "postgres_host": "${POSTGRES_HOST}",
  "postgres_db": "${POSTGRES_DB}",
  "clickhouse_host": "${CLICKHOUSE_HOST}",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "files": [
    "postgres-${POSTGRES_DB}.dump",
    "clickhouse-scan-events.native.gz"
  ]
}
EOF
fi

# ── 4. Verify backup sizes (sanity check) ────────────────────────────────────
if ! $DRY_RUN; then
  PG_SIZE=$(stat -c%s "${BACKUP_PATH}/postgres-${POSTGRES_DB}.dump" 2>/dev/null || echo 0)
  if [ "$PG_SIZE" -lt 1024 ]; then
    warn "PostgreSQL backup is suspiciously small (${PG_SIZE} bytes) — verify manually"
  fi
fi

# ── 5. Prune old backups ─────────────────────────────────────────────────────
log "Pruning backups older than ${RETENTION_DAYS} days..."
run "find '${BACKUP_DIR}' -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} +"

# ── Summary ───────────────────────────────────────────────────────────────────
if ! $DRY_RUN; then
  TOTAL_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)
  log "Backup complete. Location: ${BACKUP_PATH} | Size: ${TOTAL_SIZE}"
else
  log "Dry-run complete. No files were written."
fi
