#!/bin/bash
DB_NAME="obligatorio_bdii"
DB_USER="root"

echo "Recreando base de datos $DB_NAME..."
mysql -u $DB_USER -p -e "DROP DATABASE IF EXISTS $DB_NAME;"
mysql -u $DB_USER -p -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u $DB_USER -p $DB_NAME < 01_schema.sql
mysql -u $DB_USER -p $DB_NAME < 02_inserts.sql
echo "Listo"
