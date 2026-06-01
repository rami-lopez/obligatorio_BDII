# Obligatorio BDII - 2026

**Integrantes:** Andrea Gonzalez, Nicolas Lenzuen, Ramiro Lopez

## Stack
- **Base de datos:** PostgreSQL
- **Backend:** Python + FastAPI
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

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
