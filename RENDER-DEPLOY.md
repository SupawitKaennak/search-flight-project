# คู่มือการ Deploy บน Render.com

คู่มือนี้จะช่วยคุณ deploy โปรเจกต์ Flight Search บน Render.com

## 📋 สิ่งที่ต้องเตรียม

1. **บัญชี Render.com** - สมัครได้ที่ [render.com](https://render.com) (ใช้ GitHub/GitLab login)
2. **GitHub Repository** - โปรเจกต์ต้องอยู่ใน GitHub repo
3. **Environment Variables** - เตรียมค่า config ที่จำเป็น

---

## 🚀 วิธี Deploy (แบบ Blueprint - แนะนำ)

### ขั้นตอนที่ 1: Push โปรเจกต์ขึ้น GitHub

```bash
# ถ้ายังไม่ได้ push
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### ขั้นตอนที่ 2: สร้าง Blueprint บน Render

1. เข้า [Render Dashboard](https://dashboard.render.com)
2. คลิก **"New +"** → **"Blueprint"**
3. เชื่อมต่อ GitHub repository ของคุณ
4. Render จะอ่าน `render.yaml` อัตโนมัติ
5. คลิก **"Apply"** เพื่อ deploy

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

หลังจาก deploy แล้ว ให้ตั้งค่า environment variables เพิ่มเติม:

#### Backend Service:
1. ไปที่ Backend service → **Environment** tab
2. เพิ่ม/แก้ไข:
   ```
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```
   (รอให้ frontend deploy เสร็จก่อน แล้วค่อยมาแก้)

#### Frontend Service:
1. ไปที่ Frontend service → **Environment** tab
2. เพิ่ม/แก้ไข:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
   ```
   (ใช้ URL ที่ Render ให้ backend service)

3. (Optional) ถ้าต้องการใช้ Weather API:
   ```
   NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your-api-key-here
   ```

### ขั้นตอนที่ 4: รอ Deploy เสร็จ

- Database: ~2-3 นาที
- Backend: ~5-10 นาที (build Docker image)
- Frontend: ~5-10 นาที (build Docker image)

---

## 🔧 วิธี Deploy (แบบ Manual - แยกทีละ Service)

### 1. Deploy PostgreSQL Database

1. **New +** → **PostgreSQL**
2. ตั้งค่า:
   - **Name**: `flight-search-db`
   - **Database**: `flight_search`
   - **User**: `postgres`
   - **Plan**: Starter (Free tier: 90 days)
   - **Region**: เลือกที่ใกล้ที่สุด (Singapore recommended)
3. คลิก **Create Database**
4. **บันทึก Connection String** ไว้ใช้ตอนตั้งค่า backend

### 2. Deploy Backend

1. **New +** → **Web Service**
2. เชื่อมต่อ GitHub repository
3. ตั้งค่า:
   - **Name**: `flight-search-backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Context**: `./backend`
   - **Plan**: Free
   - **Region**: Same as database
4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   DB_HOST=<จาก database service>
   DB_PORT=5432
   DB_NAME=flight_search
   DB_USER=<จาก database service>
   DB_PASSWORD=<จาก database service>
   ENABLE_TIMESCALEDB=true
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=1000
   ENABLE_SCHEDULED_JOBS=false
   AUTO_MIGRATE=true
   ```
5. คลิก **Create Web Service**

### 3. Deploy Frontend

1. **New +** → **Web Service**
2. เชื่อมต่อ GitHub repository (เดียวกัน)
3. ตั้งค่า:
   - **Name**: `flight-search-frontend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Docker Context**: `./frontend`
   - **Plan**: Free
   - **Region**: Same as backend
4. **Environment Variables**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
   NEXT_PUBLIC_USE_MOCK_DATA=false
   NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=<optional>
   ```
5. คลิก **Create Web Service**

---

## 🔄 หลัง Deploy

### 1. Import Flight Data (ถ้าต้องการ)

หลังจาก backend deploy เสร็จแล้ว:

1. ไปที่ Backend service → **Shell** tab
2. รันคำสั่ง:
   ```bash
   node dist/scripts/import-flights-from-csv.js --dir=./data/flight_data
   ```

**หมายเหตุ**: ไฟล์ CSV ต้องอยู่ใน repo หรือใช้ volume mount

### 2. ตรวจสอบ Health Check

- Backend: `https://your-backend-url.onrender.com/api/health`
- Frontend: `https://your-frontend-url.onrender.com`

### 3. ตั้งค่า Custom Domain (Optional)

1. ไปที่ service → **Settings** → **Custom Domains**
2. เพิ่ม domain ของคุณ
3. ตั้งค่า DNS records ตามที่ Render แนะนำ

---

## ⚙️ Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | `production` | Environment mode |
| `PORT` | ✅ | `3001` | Server port |
| `DB_HOST` | ✅ | - | Database host (auto-set จาก Render) |
| `DB_PORT` | ✅ | `5432` | Database port |
| `DB_NAME` | ✅ | `flight_search` | Database name |
| `DB_USER` | ✅ | - | Database user (auto-set จาก Render) |
| `DB_PASSWORD` | ✅ | - | Database password (auto-set จาก Render) |
| `ENABLE_TIMESCALEDB` | ❌ | `true` | Enable TimescaleDB extension |
| `CORS_ORIGIN` | ✅ | - | Frontend URL (ต้องตั้งค่าเอง) |
| `RATE_LIMIT_WINDOW_MS` | ❌ | `60000` | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | `1000` | Max requests per window |
| `ENABLE_SCHEDULED_JOBS` | ❌ | `false` | Enable scheduled jobs |
| `AUTO_MIGRATE` | ❌ | `true` | Auto-run migrations on startup |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | `production` | Environment mode |
| `NEXT_PUBLIC_API_URL` | ✅ | - | Backend API URL (ต้องตั้งค่าเอง) |
| `NEXT_PUBLIC_USE_MOCK_DATA` | ❌ | `false` | Use mock data |
| `NEXT_PUBLIC_OPENWEATHERMAP_API_KEY` | ❌ | - | Weather API key (optional) |

---

## 🐛 Troubleshooting

### Backend ไม่สามารถเชื่อมต่อ Database

1. ตรวจสอบว่า database service ทำงานอยู่
2. ตรวจสอบ environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`)
3. ดู logs: Backend service → **Logs** tab

### Frontend ไม่สามารถเรียก API

1. ตรวจสอบ `NEXT_PUBLIC_API_URL` ว่าถูกต้อง
2. ตรวจสอบ `CORS_ORIGIN` ใน backend ว่าตรงกับ frontend URL
3. ตรวจสอบว่า backend service ทำงานอยู่

### Build ล้มเหลว

1. ตรวจสอบ Dockerfile ว่าถูกต้อง
2. ดู build logs ใน Render dashboard
3. ทดสอบ build local ก่อน:
   ```bash
   cd backend
   docker build -t test-backend .
   
   cd ../frontend
   docker build -t test-frontend .
   ```

### Database Migration ไม่ทำงาน

1. ตรวจสอบ `AUTO_MIGRATE=true` ใน backend environment
2. ดู logs เพื่อดู error message
3. รัน migration manual ผ่าน Shell:
   ```bash
   node dist/database/migrate.js up
   ```

### Service Sleep (Free Tier)

- Free tier จะ sleep หลังไม่ใช้งาน 15 นาที
- Request แรกหลังจาก sleep จะช้า (~30-60 วินาที)
- แก้ไข: Upgrade เป็น paid plan หรือใช้ cron job เพื่อ keep-alive

---

## 💰 Pricing (Free Tier)

### Free Tier Limits:

- **Web Services**: 750 hours/month (พอสำหรับ 1 service รัน 24/7)
- **PostgreSQL**: 90 days free trial (Starter plan)
- **Sleep**: Services จะ sleep หลังไม่ใช้งาน 15 นาที

### Tips:

- ใช้ 2 free web services (backend + frontend) = 375 hours/service/month
- Database ต้อง upgrade เป็น paid หลัง 90 วัน ($7/month)
- หรือใช้ external database (เช่น Supabase, Neon - มี free tier)

---

## 🔐 Security Best Practices

1. **อย่า commit `.env` files** - ใช้ environment variables ใน Render แทน
2. **ใช้ strong passwords** - สำหรับ database
3. **Enable HTTPS** - Render ให้ SSL certificate อัตโนมัติ
4. **Rate Limiting** - ตั้งค่า rate limit ใน backend
5. **CORS** - ตั้งค่า CORS ให้เฉพาะ domain ที่อนุญาต

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Render Docker Guide](https://render.com/docs/docker)
- [Render PostgreSQL Guide](https://render.com/docs/databases)

---

## ✅ Checklist

- [ ] Push code ขึ้น GitHub
- [ ] สร้าง Blueprint หรือ Deploy services แยก
- [ ] ตั้งค่า Environment Variables
- [ ] รอ deploy เสร็จ
- [ ] ตั้งค่า CORS_ORIGIN และ NEXT_PUBLIC_API_URL
- [ ] ทดสอบ health check endpoints
- [ ] Import flight data (ถ้าต้องการ)
- [ ] ทดสอบ frontend และ backend
- [ ] ตั้งค่า custom domain (optional)

---

**Happy Deploying! 🚀**
