# SQL

Carpeta de referencia documental de la base de datos del sistema de ticketing para el Mundial 2026.
Incluye el DDL con la definición de todas las tablas, constraints y relaciones; los triggers que implementan las reglas de negocio a nivel de base de datos; las queries principales del sistema; y un conjunto de datos de prueba.

> Los scripts se ejecutan automáticamente al levantar el contenedor con `docker compose up`.

## Documentación de la API (Swagger)

La documentación interactiva de la API está disponible en:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Autenticación en Swagger

Todos los endpoints protegidos requieren un token JWT de Auth0. Para autorizarse en Swagger:

1. Hacé login en la aplicación frontend (`http://localhost:5173`)
2. Obtené el token de acceso desde las herramientas de desarrollo del navegador (localStorage o sessionStorage)
3. En Swagger UI, hacé clic en **"Authorize"** (arriba a la derecha)
4. Ingresá el token en el formato `Bearer <token>` (solo el token, sin "Bearer ")
5. Hacé clic en **"Authorize"** y cerrá el modal

También podés obtener un token desde el endpoint `/auth/login` enviando email y contraseña, que devuelve `access_token` y `refresh_token`.

### Archivos SQL

| Archivo | Contenido |
|---------|-----------|
| `01_schema.sql` | DDL: tablas, constraints, relaciones |
| `02_inserts.sql` | Datos de prueba |
| `03_queries.sql` | Queries de referencia |
| `04_stored_procedures.sql` | Stored procedures |
| `05_triggers.sql` | Triggers de reglas de negocio |
| `06_triggers_tests.sql` | Tests de triggers |
| `07_views.sql` | Vistas del sistema |
