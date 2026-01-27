# วิธีสร้างไฟล์ .env ที่ Root ของโปรเจกต์

## 📍 Root ของโปรเจกต์คือไหน?

Root ของโปรเจกต์คือโฟลเดอร์ `search-flight-project/` ซึ่งมีไฟล์:
- `docker-compose.yml`
- `DOCKER-README.md`
- `docker-setup.ps1`
- `backend/`
- `frontend/`

## 🚀 วิธีสร้างไฟล์ .env

### วิธีที่ 1: ใช้ PowerShell (Windows)

```powershell
# ไปที่ root ของโปรเจกต์
cd "D:\test clone\search-flight-project"

# Copy จาก .env.example
Copy-Item .env.example .env

# แก้ไขไฟล์ .env ด้วย Notepad หรือ editor อื่น
notepad .env
```

### วิธีที่ 2: ใช้ Command Prompt (Windows)

```cmd
cd "D:\test clone\search-flight-project"
copy .env.example .env
notepad .env
```

### วิธีที่ 3: ใช้ Git Bash หรือ Terminal (Linux/Mac)

```bash
cd "D:\test clone\search-flight-project"
cp .env.example .env
nano .env
# หรือ
code .env  # ถ้าใช้ VS Code
```

### วิธีที่ 4: สร้างด้วยมือ

1. เปิดโฟลเดอร์ `search-flight-project` ใน File Explorer
2. สร้างไฟล์ใหม่ชื่อ `.env` (มีจุดหน้าชื่อไฟล์)
3. เปิดไฟล์ด้วย Notepad หรือ text editor
4. เพิ่มบรรทัดนี้:
   ```
   NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_actual_api_key_here
   ```
5. แทนที่ `your_actual_api_key_here` ด้วย API key จริงของคุณ
6. บันทึกไฟล์

## 📝 เนื้อหาในไฟล์ .env

ไฟล์ `.env` ควรมีเนื้อหาประมาณนี้:

```env
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=abc123xyz789your_actual_key_here
```

## ✅ ตรวจสอบว่าไฟล์ถูกสร้างแล้ว

```powershell
# ตรวจสอบว่าไฟล์มีอยู่
Test-Path .env

# ดูเนื้อหา (ระวัง: จะแสดง API key)
Get-Content .env
```

## 🔄 หลังจากสร้างไฟล์ .env แล้ว

1. **Restart Docker containers:**
   ```powershell
   docker-compose down
   docker-compose up -d --build
   ```

2. **หรือใช้ setup script:**
   ```powershell
   .\docker-setup.ps1
   ```

## 🔐 ข้อควรระวัง

- ⚠️ **อย่า commit ไฟล์ `.env` ลง Git** (ไฟล์นี้ถูก ignore แล้ว)
- ✅ **commit ไฟล์ `.env.example`** เพื่อเป็นตัวอย่าง
- 🔑 **เก็บ API key เป็นความลับ** อย่าแชร์ให้คนอื่น

## 📚 ข้อมูลเพิ่มเติม

- Get OpenWeatherMap API Key: https://openweathermap.org/api
- Docker Compose Environment Variables: https://docs.docker.com/compose/environment-variables/
