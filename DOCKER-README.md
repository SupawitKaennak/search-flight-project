# Docker Setup Guide

คู่มือการติดตั้งและใช้งานโปรเจกต์ Flight Search ด้วย Docker Desktop

## 📋 สิ่งที่ต้องมี

- Docker Desktop (Windows/Mac/Linux)
- Git (สำหรับ clone repository)

## 🚀 การติดตั้งแบบรวดเร็ว

### วิธีที่ 1: ใช้ Setup Script (แนะนำ)

**Windows (PowerShell):**
```powershell
.\docker-setup.ps1
```

**Linux/Mac:**
```bash
chmod +x docker-setup.sh
./docker-setup.sh
```

สคริปต์จะ:
- ตรวจสอบว่า Docker ทำงานอยู่
- สร้างไฟล์ .env อัตโนมัติ
- Build และ start containers
- แสดงสถานะและคำแนะนำ

### วิธีที่ 2: ติดตั้งด้วยตนเอง

### 1. Clone repository (ถ้ายังไม่ได้ clone)
```bash
git clone <repository-url>
cd search-flight-project
```

### 2. สร้างไฟล์ environment (ถ้ายังไม่มี)
```bash
# Windows PowerShell
Copy-Item backend\env.example backend\.env
Copy-Item frontend\env.example frontend\.env.local

# Linux/Mac
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env.local
```

### 3. รัน Docker Compose
```bash
docker-compose up -d --build
```

คำสั่งนี้จะ:
- ดาวน์โหลดและสร้าง images สำหรับ database, backend, และ frontend
- เริ่มต้น services ทั้งหมด
- สร้าง network และ volumes ที่จำเป็น

### 3. รอให้ services พร้อมใช้งาน
```bash
# ตรวจสอบสถานะ
docker-compose ps

# ดู logs
docker-compose logs -f
```

### 4. รัน database migrations (ครั้งแรกเท่านั้น)
```bash
# เข้าไปใน backend container
docker-compose exec backend sh

# รัน migrations
npm run migrate
```

หรือรันจากเครื่อง host:
```bash
docker-compose exec backend npm run migrate
```

## 🌐 การเข้าถึง Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5432
  - User: postgres
  - Password: postgres
  - Database: flight_search

## 📝 คำสั่งที่ใช้บ่อย

### เริ่มต้น services
```bash
docker-compose up -d
```

### หยุด services
```bash
docker-compose down
```

### หยุดและลบ volumes (ลบข้อมูลทั้งหมด)
```bash
docker-compose down -v
```

### ดู logs
```bash
# ทั้งหมด
docker-compose logs -f

# เฉพาะ service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild images (เมื่อมีการเปลี่ยนแปลง code)
```bash
docker-compose up -d --build
```

### Restart service
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### เข้าไปใน container
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec postgres psql -U postgres -d flight_search
```

## 🔧 การตั้งค่า Environment Variables

### Backend
สร้างไฟล์ `backend/.env` จาก `backend/env.example`:
```bash
cp backend/env.example backend/.env
```

สำหรับ Docker, `DB_HOST` ควรเป็น `postgres` (ชื่อ service ใน docker-compose)

### Frontend
สร้างไฟล์ `frontend/.env.local` จาก `frontend/env.example`:
```bash
cp frontend/env.example frontend/.env.local
```

**สำหรับ Weather Display:**
ถ้าต้องการให้แสดงข้อมูลสภาพอากาศ ต้องตั้งค่า OpenWeatherMap API Key:

1. สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:
```bash
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_actual_api_key_here
```

2. หรือตั้งค่าใน `docker-compose.yml` โดยแก้ไข:
```yaml
environment:
  NEXT_PUBLIC_OPENWEATHERMAP_API_KEY: your_actual_api_key_here
```

3. Get API key ฟรีได้ที่: https://openweathermap.org/api

**หมายเหตุ:** ถ้าไม่มี API key, Weather Display จะแสดงข้อความแจ้งเตือนแทนที่จะซ่อนไป

## 📦 Services ที่รัน

1. **postgres** - PostgreSQL 18 with TimescaleDB
   - Port: 5432
   - Data: เก็บใน Docker volume `postgres_data`

2. **backend** - Node.js/Express API
   - Port: 3001
   - Depends on: postgres

3. **frontend** - Next.js Application
   - Port: 3000
   - Depends on: backend

## 🐛 การแก้ปัญหา

### Database ไม่เชื่อมต่อ
```bash
# ตรวจสอบว่า postgres service รันอยู่
docker-compose ps

# ตรวจสอบ logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Backend ไม่เชื่อมต่อกับ Database
- ตรวจสอบว่า `DB_HOST=postgres` ใน environment variables
- ตรวจสอบว่า postgres service healthy แล้ว: `docker-compose ps`

### Frontend ไม่แสดงข้อมูล
- ตรวจสอบว่า backend รันอยู่: `docker-compose ps`
- ตรวจสอบ `NEXT_PUBLIC_API_URL` ใน frontend environment
- ดู logs: `docker-compose logs frontend`

### Port ถูกใช้งานแล้ว
ถ้า port 3000, 3001, หรือ 5432 ถูกใช้งานแล้ว:
1. หยุด service ที่ใช้ port นั้น
2. หรือแก้ไข port mapping ใน `docker-compose.yml`

### Rebuild เมื่อมีการเปลี่ยนแปลง code
```bash
# Rebuild และ restart
docker-compose up -d --build

# หรือ rebuild เฉพาะ service
docker-compose build backend
docker-compose up -d backend
```

## 🗑️ การลบทั้งหมด

```bash
# หยุดและลบ containers, networks
docker-compose down

# หยุดและลบทุกอย่างรวม volumes (ลบข้อมูล)
docker-compose down -v

# ลบ images
docker-compose down --rmi all
```

## 📚 ข้อมูลเพิ่มเติม

- Backend documentation: `docs/README.md`
- Frontend documentation: `frontend/README.md`
- Database scripts: `backend/scripts/`

## ⚠️ หมายเหตุ

- ข้อมูล database จะถูกเก็บใน Docker volume `postgres_data`
- ถ้าลบ volume (`docker-compose down -v`) ข้อมูลทั้งหมดจะหาย
- สำหรับ production, ควรใช้ environment variables ที่ปลอดภัยกว่า
- ควรเปลี่ยน default passwords ใน production
