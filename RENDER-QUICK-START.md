# 🚀 Render Quick Start Guide

คู่มือเริ่มต้นใช้งาน Render.com สำหรับโปรเจกต์ Flight Search

## ⚡ Quick Deploy (5 นาที)

### 1. สร้างบัญชี Render
- ไปที่ [render.com](https://render.com)
- Login ด้วย GitHub/GitLab

### 2. Deploy ด้วย Blueprint

1. คลิก **"New +"** → **"Blueprint"**
2. เชื่อมต่อ GitHub repository
3. Render จะอ่าน `render.yaml` อัตโนมัติ
4. คลิก **"Apply"**

### 3. ตั้งค่า Environment Variables

**หลัง deploy เสร็จ (รอ ~10-15 นาที):**

#### Backend Service:
```
CORS_ORIGIN=https://flight-search-frontend.onrender.com
```
(ใช้ URL ที่ Render ให้ frontend service)

#### Frontend Service:
```
NEXT_PUBLIC_API_URL=https://flight-search-backend.onrender.com/api
```
(ใช้ URL ที่ Render ให้ backend service)

### 4. Restart Services

หลังจากตั้งค่า environment variables:
- ไปที่ Backend service → **Manual Deploy** → **Deploy latest commit**
- ไปที่ Frontend service → **Manual Deploy** → **Deploy latest commit**

### 5. ทดสอบ

- Frontend: `https://your-frontend-url.onrender.com`
- Backend Health: `https://your-backend-url.onrender.com/api/health`

---

## 📝 Checklist

- [ ] Push code ขึ้น GitHub
- [ ] สร้าง Blueprint บน Render
- [ ] รอ deploy เสร็จ (~15 นาที)
- [ ] ตั้งค่า `CORS_ORIGIN` ใน backend
- [ ] ตั้งค่า `NEXT_PUBLIC_API_URL` ใน frontend
- [ ] Restart services
- [ ] ทดสอบ endpoints

---

## 🔧 Import Flight Data (Optional)

หลัง deploy เสร็จ ถ้าต้องการ import flight data:

1. ไปที่ Backend service → **Shell** tab
2. รันคำสั่ง:
   ```bash
   node dist/scripts/import-flights-from-csv.js --dir=./data/flight_data
   ```

**หมายเหตุ**: ไฟล์ CSV ต้องอยู่ใน repository หรือใช้ volume mount

---

## ⚠️ ข้อควรระวัง

### Free Tier Limitations:
- **Sleep Mode**: Services จะ sleep หลังไม่ใช้งาน 15 นาที
- **Request แรกหลัง sleep**: จะช้า (~30-60 วินาที)
- **Database**: 90 วัน free trial หลังนั้นต้อง upgrade ($7/month)

### Tips:
- ใช้ cron job เพื่อ keep-alive (เช่น [cron-job.org](https://cron-job.org))
- หรือ upgrade เป็น paid plan ($7/service/month)

---

## 🆘 Troubleshooting

### Service ไม่ทำงาน
1. ดู **Logs** tab ใน Render dashboard
2. ตรวจสอบ environment variables
3. ตรวจสอบ health check endpoint

### Frontend ไม่เชื่อมต่อ Backend
1. ตรวจสอบ `NEXT_PUBLIC_API_URL` ว่าถูกต้อง
2. ตรวจสอบ `CORS_ORIGIN` ใน backend
3. ตรวจสอบว่า backend service ทำงานอยู่

### Database Connection Error
1. ตรวจสอบ database service ทำงานอยู่
2. ตรวจสอบ environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`)
3. ดู backend logs

---

## 📚 เอกสารเพิ่มเติม

ดู [RENDER-DEPLOY.md](./RENDER-DEPLOY.md) สำหรับรายละเอียดเพิ่มเติม

---

**Happy Deploying! 🎉**
