#!/bin/bash
set -euo pipefail

DB_NAME="${DB_NAME:-ticketing_mundial}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root_pass}"

echo "Recreando base de datos ${DB_NAME}..."
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "DROP DATABASE IF EXISTS ${DB_NAME};"
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < 01_schema.sql
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < 02_inserts.sql
echo "Listo"
