# Obligatorio BDII - 2026

**Integrantes:** Andrea Gonzalez, Nicolas Lenzuen, Ramiro Lopez

## Stack
- **Base de datos:** MySQL + InnoDB
- **Backend:** Python + FastAPI + aiomysql
- **Frontend:** React + Vite

## Setup (como correr)

### Base de datos
```bash
cd sql
./reset_db.sh
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # completar con tus credenciales
uvicorn app.main:app --reload
```

### Alternar entre bases de datos MySQL
- Local con Docker: `uvicorn app.main:app --reload`
- Facultad: `APP_ENV=facultad uvicorn app.main:app --reload`
- Levantar Docker: `docker compose up -d`  
	El contenedor publica MySQL en `localhost:3307` para evitar choques con una instancia local en `3306`.
- Bajar Docker: `docker compose down`
- Borrar datos persistidos: `docker compose down -v`

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
