# Obligatorio BDII - 2026

**Integrantes:** Andrea Gonzalez, Nicolas Lenzuen, Ramiro Lopez

# Ticketing Mundial 2026 — API

API REST con FastAPI + MySQL  para el sistema
de ticketing del Mundial 2026.

## Requisitos

- Python 3.12+
- Docker y Docker Compose
- Archivo `.env.local` con las variables de entorno,
  incluyendo configuración de Auth0 y conexión a la base de datos.

---

## Modo 1 — Desarrollo (solo backend, base en Docker)

Para desarrollar con recarga automática (`--reload`), conviene correr la
base en Docker y la API directo en tu máquina.

### Levantar solo la base de datos

```bash
docker compose up -d mysql_local
```

Esto levanta MySQL en `localhost:3306` con la base `ticketing_mundial` ya
inicializada con el DDL.

### Levantar la API en local

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

APP_ENV=local uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`, con Swagger en
`http://localhost:8000/docs`.

### Bajar la base

```bash
docker compose down            # los datos persisten
docker compose down -v         # borra también los datos
```

---

## Modo 2 — Todo en Docker (API + base)

Para correr el stack completo containerizado:

```bash
docker compose up --build -d
```

**Importante:** si modificás código y volvés a levantar el stack, tenés
que usar `--build` para que la imagen de la API se reconstruya con los
cambios. Si solo hacés `docker compose up -d`, Docker reutiliza la imagen
vieja y no vas a ver tus cambios reflejados.

```bash
docker compose up --build -d
```

La API queda en `http://localhost:8000` y la base en `localhost:3306`.

### Ver logs

```bash
docker compose logs -f api
```

### Bajar todo

```bash
docker compose down            # los datos de la base persisten
docker compose down -v         # borra también los datos
```

---

## Conectarse a la base desde DataGrip / cliente MySQL

- **Host**: `localhost`
- **Port**: `3306`
- **Database**: `ticketing_mundial`
- **User**: `ticketing_user`
- **Password**: `ticketing_pass`

El container de la base tiene que estar corriendo (`docker compose up -d mysql_local`
o `docker compose up -d`).

---

## Entornos

La variable `APP_ENV` determina qué archivo de configuración se carga
(`.env.{APP_ENV}`):

- `APP_ENV=local` → base de datos local en Docker
- `APP_ENV=facultad` → base de datos remota de la facultad

En el `docker-compose.yml`, el servicio `api` ya tiene `APP_ENV=local`
configurado para apuntar a `mysql_local`.

Para correr la API en local apuntando a la base de la facultad:

```bash
APP_ENV=facultad uvicorn app.main:app --reload
```

---

## Autenticación

La autenticación la maneja Auth0. Las variables necesarias
(`AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_ALGORITHMS`)
ya están incluidas en el `.env.local` / `.env.facultad` provisto.

Para probar los endpoints protegidos desde Swagger (`/docs`):

1. Click en **Authorize** (arriba a la derecha)
2. Iniciar sesión con un usuario de Auth0
3. Los endpoints que requieran autenticación van a incluir el token
   automáticamente al usar **Try it out**

Para cambiar de usuario, abrir otra pestaña en incognito
