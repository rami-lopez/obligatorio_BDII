#!/bin/bash
DB_NAME="obligatorio_bdii"
DB_USER="postgres"

echo "Recreando base de datos $DB_NAME..."
psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
psql -U $DB_USER -d $DB_NAME -f 01_schema.sql
psql -U $DB_USER -d $DB_NAME -f 02_inserts.sql
echo "Listo."
