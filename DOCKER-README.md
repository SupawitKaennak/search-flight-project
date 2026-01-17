# Docker Setup Guide

คู่มือการใช้งาน Docker Compose แยกสำหรับ Frontend, Backend, และ Database

## โครงสร้างไฟล์

```
.
├── docker-compose.yml                    # รวมทุก service (ใช้เมื่อต้องการรันทั้งหมดพร้อมกัน)
├── docker-compose.database.yml          # Database เท่านั้น
├── .env.database                         # Database environment variables
├── .env.backend                          # Backend environment variables
├── .env.frontend                         # Frontend environment variables
├── .env.*.example                        # Example files (copy to .env.*)
├── backend/
│   ├── Dockerfile
│   └── docker-compose.backend.yml       # Backend เท่านั้น
└── frontend/
    ├── Dockerfile
    └── docker-compose.frontend.yml      # Frontend เท่านั้น
```

## การตั้งค่า Environment Variables

### 1. สร้าง .env files จาก example files

```bash
# จาก root directory
# Windows PowerShell
Copy-Item .env.database.example .env.database
Copy-Item .env.backend.example .env.backend
Copy-Item .env.frontend.example .env.frontend

# Linux/Mac
cp .env.database.example .env.database
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend
```

### 2. แก้ไขค่าใน .env files ตามต้องการ

- **`.env.database`**: Database credentials และ settings
- **`.env.backend`**: Backend configuration (DB connection, CORS, rate limiting)
- **`.env.frontend`**: Frontend configuration (API URL, API keys)

**หมายเหตุ:** `.env.*` files จะถูก gitignore และไม่ควร commit ลง repository

## วิธีใช้งาน

### วิธีที่ 1: แยก Compose แต่ละ Service (แนะนำ)

#### 1. สร้าง Network ก่อน (ครั้งเดียว)
```bash
docker network create flight_network
```

**หมายเหตุ:** Network นี้จะถูกใช้ร่วมกันโดยทุก service ดังนั้นต้องสร้างก่อนรัน services ใดๆ

#### 2. รัน Database
```bash
# จาก root directory
docker-compose -f docker-compose.database.yml up -d
```

#### 3. รัน Backend
```bash
# จาก root directory หรือ backend directory
docker-compose -f backend/docker-compose.backend.yml up -d --build
```

**หมายเหตุ:** ถ้า database อยู่ใน container อื่น ให้แก้ไข `DB_HOST` ใน `docker-compose.backend.yml` เป็นชื่อ container ของ database (เช่น `flight_search_db`)

#### 4. Import ข้อมูล (ถ้ายังไม่มี)
```bash

docker exec flight_search_backend node dist/scripts/import-flights-from-csv.js --dir=./data/flight_data
```

#### 5. รัน Frontend
```bash
# จาก root directory หรือ frontend directory
docker-compose -f frontend/docker-compose.frontend.yml up -d --build
```

### วิธีที่ 2: รันทั้งหมดพร้อมกัน

```bash
# จาก root directory
docker-compose up -d --build
```

## คำสั่งที่มีประโยชน์

### ดู Logs
```bash
# Database
docker-compose -f docker-compose.database.yml logs -f

# Backend
docker-compose -f backend/docker-compose.backend.yml logs -f

# Frontend
docker-compose -f frontend/docker-compose.frontend.yml logs -f

# ทั้งหมด (ถ้าใช้ docker-compose.yml)
docker-compose logs -f
```

### หยุด Services
```bash
# Database
docker-compose -f docker-compose.database.yml down

# Backend
docker-compose -f backend/docker-compose.backend.yml down

# Frontend
docker-compose -f frontend/docker-compose.frontend.yml down

# ทั้งหมด
docker-compose down
```

### หยุดและลบ Volumes
```bash
# Database (จะลบข้อมูลทั้งหมด!)
docker-compose -f docker-compose.database.yml down -v
```

### Rebuild Images
```bash
# Backend
docker-compose -f backend/docker-compose.backend.yml up -d --build

# Frontend
# 1. แก้ไข .env.frontend
# 2. Rebuild image
docker-compose -f frontend/docker-compose.frontend.yml build --build-arg NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=$(Get-Content .env.frontend | Select-String -Pattern "OPENWEATHERMAP" | ForEach-Object { $_.Line.Split('=')[1] })
# 3. Restart container
docker-compose -f frontend/docker-compose.frontend.yml up -d

```

## Ports

- **Database:** `5432`
- **Backend:** `3001`
- **Frontend:** `3000`

## Environment Variables

Docker Compose files ใช้ `.env.*` files เพื่อจัดการ environment variables

### Database (`.env.database`)
- `POSTGRES_USER`: Database user (default: `postgres`)
- `POSTGRES_PASSWORD`: Database password (default: `postgres`)
- `POSTGRES_DB`: Database name (default: `flight_search`)

### Backend (`.env.backend`)
- `DB_HOST`: ชื่อ container ของ database (default: `flight_search_db`)
- `DB_PORT`: Database port (default: `5432`)
- `DB_NAME`: Database name (default: `flight_search`)
- `DB_USER`: Database user (default: `postgres`)
- `DB_PASSWORD`: Database password (default: `postgres`)
- `CORS_ORIGIN`: URL ของ frontend (default: `http://localhost:3000`)
- `PORT`: Backend port (default: `3001`)
- `ENABLE_TIMESCALEDB`: Enable TimescaleDB extension (default: `true`)

### Frontend (`.env.frontend`)
- `NEXT_PUBLIC_API_URL`: URL ของ backend API (default: `http://localhost:3001/api`)
- `NEXT_PUBLIC_USE_MOCK_DATA`: ใช้ mock data หรือไม่ (default: `false`)
- `NEXT_PUBLIC_OPENWEATHERMAP_API_KEY`: API key สำหรับ weather (optional)

**หมายเหตุ:** 
- Docker Compose จะอ่านค่าจาก `.env.*` files อัตโนมัติ
- ถ้าไม่มี `.env.*` file จะใช้ค่า default ที่กำหนดไว้ใน docker-compose.yml
- แก้ไขค่าใน `.env.*` files แทนการแก้ไข docker-compose.yml โดยตรง

## Troubleshooting

### Backend ไม่สามารถเชื่อมต่อ Database ได้
1. ตรวจสอบว่า database container ทำงานอยู่: `docker ps`
2. ตรวจสอบว่า network ถูกต้อง: `docker network inspect flight_network`
3. ตรวจสอบ `DB_HOST` ใน backend compose file ว่าตรงกับชื่อ container ของ database

### Frontend ไม่สามารถเชื่อมต่อ Backend ได้
1. ตรวจสอบว่า backend container ทำงานอยู่
2. ตรวจสอบ `NEXT_PUBLIC_API_URL` ใน frontend compose file
3. ตรวจสอบ CORS settings ใน backend

### ต้องการลบทุกอย่างและเริ่มใหม่
```bash
# หยุดและลบ containers, networks, volumes
docker-compose down -v
docker-compose -f docker-compose.database.yml down -v
docker-compose -f backend/docker-compose.backend.yml down -v
docker-compose -f frontend/docker-compose.frontend.yml down -v

# ลบ network (ถ้าจำเป็น)
docker network rm flight_network
```

## Development Mode

สำหรับ development ที่ต้องการ hot-reload:

### Backend
แก้ไข `backend/docker-compose.backend.yml` เพิ่ม volumes:
```yaml
volumes:
  - ./src:/app/src
  - ./dist:/app/dist
```

และเปลี่ยน CMD เป็น:
```yaml
command: npm run dev
```

### Frontend
แก้ไข `frontend/docker-compose.frontend.yml` เพิ่ม volumes:
```yaml
volumes:
  - .:/app
  - /app/node_modules
  - /app/.next
```

และเปลี่ยน command เป็น:
```yaml
command: npm run dev
```

```bash

# ตรวจสอบ containers
docker ps

# ตรวจสอบ logs
docker logs flight_search_backend --tail 50
docker logs flight_search_db --tail 50
docker logs flight_search_frontend --tail 50

# ทดสอบ API
curl http://localhost:3001/api/health
```