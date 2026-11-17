#!/usr/bin/env bash
set -euo pipefail

# Rotina automatizada de backup: PostgreSQL + MinIO (S3)
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/pmtb}"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

DB_CONTAINER="${DB_CONTAINER:-pmtb-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-pmtb}"

MINIO_ALIAS="${MINIO_ALIAS:-pmtb-minio}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
S3_BUCKET="${S3_BUCKET:-prefeitura}"

mkdir -p "${BACKUP_ROOT}/postgres" "${BACKUP_ROOT}/minio"

echo "[${TIMESTAMP}] 1/3 Gerando dump compactado do PostgreSQL..."
docker exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" -Fc \
  | gzip > "${BACKUP_ROOT}/postgres/${DB_NAME}_${TIMESTAMP}.dump.gz"

echo "[${TIMESTAMP}] 2/3 Sincronizando bucket ${S3_BUCKET} do MinIO..."
if command -v mc >/dev/null 2>&1; then
  mc alias set "${MINIO_ALIAS}" "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"
  mc mirror --overwrite "${MINIO_ALIAS}/${S3_BUCKET}" "${BACKUP_ROOT}/minio/${S3_BUCKET}"
else
  echo "Aviso: cliente 'mc' não encontrado no host; execute via container MinIO MC."
fi

echo "[${TIMESTAMP}] 3/3 Removendo dumps com mais de ${RETENTION_DAYS} dias..."
find "${BACKUP_ROOT}/postgres" -type f -name "*.dump.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[${TIMESTAMP}] Backup concluído com sucesso."
