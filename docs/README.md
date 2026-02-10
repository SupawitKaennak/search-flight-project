# 📚 Flight Search Project Documentation

ยินดีต้อนรับสู่เอกสารโปรเจค Flight Search System - ระบบค้นหาและวิเคราะห์ราคาตั๋วเครื่องบินภายในประเทศไทย

---

## 📖 เอกสารทั้งหมด

### [01-GETTING-STARTED.md](./01-GETTING-STARTED.md)
**คู่มือเริ่มต้นใช้งานโปรเจค** 🚀

เหมาะสำหรับ: นักพัฒนาที่เข้ามาใหม่หรือต้องการ setup โปรเจคตั้งแต่เริ่มต้น

**เนื้อหา:**
- ✅ Prerequisites (Node.js, **Docker**, Git)
- ✅ Initial Setup (Clone, Install dependencies)
- ✅ **Database Setup (Docker Compose - ง่ายที่สุด!)** 🐳
- ✅ Environment Configuration (.env files)
- ✅ Running the Project (Backend + Frontend)
- ✅ Data Import (Weather, Holidays)
- ✅ Mock Data Generation (Flight prices)
- ✅ Development Workflow
- ✅ Troubleshooting (Common issues & solutions)

**เริ่มที่นี่:** [01-GETTING-STARTED.md](./01-GETTING-STARTED.md)

---

### [02-SQL-COMMANDS.md](./02-SQL-COMMANDS.md)
**รวมคำสั่ง SQL ทั้งหมด** 🗄️

เหมาะสำหรับ: นักพัฒนาที่ต้องการตรวจสอบหรือจัดการข้อมูลในฐานข้อมูล

**เนื้อหา:**
- 🔌 Database Connection (psql commands)
- ✅ Data Verification (Check tables, Count records)
- 🗑️ Data Cleanup (Clear flight prices, Reset database)
- 📊 Data Analysis (Price statistics, Route analysis)
- ⚡ Performance Optimization (Indexes, Vacuum)
- 💾 Backup & Restore (pg_dump, pg_restore)

**ตัวอย่างคำสั่งที่ใช้บ่อย:**

```sql
-- Count all flights
SELECT COUNT(*) FROM flight_prices;

-- Clear all flight prices
TRUNCATE TABLE flight_prices;

-- Check date range
SELECT MIN(departure_date), MAX(departure_date) FROM flight_prices;

-- Price by route
SELECT r.origin, r.destination, AVG(fp.price) as avg_price
FROM routes r
JOIN flight_prices fp ON r.id = fp.route_id
GROUP BY r.id, r.origin, r.destination;
```

**ดูเพิ่มเติม:** [02-SQL-COMMANDS.md](./02-SQL-COMMANDS.md)

---

### [03-SYSTEM-DOCUMENTATION.md](./03-SYSTEM-DOCUMENTATION.md)
**เอกสารระบบโดยละเอียด** 📚

เหมาะสำหรับ: นักพัฒนาที่ต้องการเข้าใจสถาปัตยกรรม, สูตรคำนวณ และ API

**เนื้อหา:**
- 🏗️ System Architecture (Tech stack, Architecture diagram)
- 🧮 Calculation Formulas (Price, Season, Distance, Duration)
- 🌐 API Documentation (All endpoints with examples)
- 💾 Data Models (Database schema, Table structures)
- 🔌 External APIs (Open-Meteo, iApp)
- 🎯 Season Calculation System (Multi-factor scoring)

**สูตรสำคัญ:**

#### 1. Mock Data Price
```
price = basePrice × seasonalMultiplier × tripTypeMultiplier × randomVariation
```

#### 2. Season (ระบบปัจจุบัน)
```
price_level = 'low' → Low Season
price_level = 'typical' → Normal Season
price_level = 'high' → High Season
```
(ใช้ค่าจากคอลัมน์ `price_level` ในตาราง `flight_prices` โดยตรง)

**ดูเพิ่มเติม:** [03-SYSTEM-DOCUMENTATION.md](./03-SYSTEM-DOCUMENTATION.md)

---

### [04-SCRIPTS-REFERENCE.md](./04-SCRIPTS-REFERENCE.md) ⭐ NEW!
**คู่มือ Scripts ทั้งหมด** 🔧

เหมาะสำหรับ: นักพัฒนาที่ต้องการ fetch ข้อมูล, import ข้อมูล หรือจัดการระบบ

**เนื้อหา:**
- 📥 **Data Import Scripts**
  - `import-flights-from-csv.ts` - นำเข้าเที่ยวบินจาก CSV
  - `import-airpaz-flights.ts` - นำเข้า AirPaz
  - `import-intl-flights.ts` - นำเข้าเที่ยวบินระหว่างประเทศ
  - `import-airports.ts` - นำเข้ารายการสนามบิน
- 🎲 **Data Generation**
  - `generate-mock-flights.ts` - สร้าง mock flights
- 🧪 **Testing**
  - `test-api-endpoints.ts` - ทดสอบ API (รันด้วย `npx tsx src/scripts/test-api-endpoints.ts`)

**ตัวอย่างคำสั่งสำคัญ:**

```bash
cd backend
npm run import-flights-from-csv
npm run import-airpaz-flights
npm run import-airports
npm run generate:mock-flights -- --days-back=90 --days-forward=270
```

**ดูเพิ่มเติม:** [04-SCRIPTS-REFERENCE.md](./04-SCRIPTS-REFERENCE.md)

---

## 🎯 Quick Start Guide

### สำหรับนักพัฒนาใหม่

1. **อ่านเอกสารตามลำดับ:**
   ```
   01-GETTING-STARTED.md → Setup โปรเจค
   02-SQL-COMMANDS.md → เรียนรู้คำสั่ง SQL
   03-SYSTEM-DOCUMENTATION.md → เข้าใจระบบ
   ```

2. **Setup โปรเจค:**
   ```bash
   # 1. Clone repository
   git clone <repo-url>
   cd search-flight-27
   
   # 2. Install dependencies
   cd backend && npm install
   cd ../frontend && npm install
   
   # 3. Start database (Docker — จาก root โปรเจค)
   docker-compose up -d
   cd backend && npm run migrate
   
   # 4. นำเข้าข้อมูลหรือสร้าง mock data
   npm run import-airports
   npm run import-airpaz-flights
   # หรือ npm run generate:mock-flights -- --days-back=90 --days-forward=270
   
   # 5. Run servers
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

3. **ทดสอบระบบ:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001/api/health

---

## 📂 Project Structure

```
search-flight-27/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API endpoint handlers
│   │   ├── services/         # Business logic
│   │   ├── models/           # Database models
│   │   ├── database/         # Migrations
│   │   ├── scripts/          # 🔧 Utility scripts (see 04-SCRIPTS-REFERENCE.md)
│   │   └── server.ts         # Entry point
│   ├── data/                 # CSV files (flights, airports)
│   └── package.json
├── frontend/
│   ├── app/                  # Next.js app router
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   └── package.json
├── docker-compose.yml        # 🐳 PostgreSQL + TimescaleDB (ที่ root)
└── docs/                     # 📚 You are here!
    ├── README.md             # This file
    ├── 01-GETTING-STARTED.md # Setup guide with Docker
    ├── 02-SQL-COMMANDS.md    # SQL reference
    ├── 03-SYSTEM-DOCUMENTATION.md  # Architecture & APIs
    ├── 04-SCRIPTS-REFERENCE.md     # Scripts guide
    └── QUICK-REFERENCE.md    # Cheat sheet
```

---

## 🔧 Common Tasks

### Generate Mock Data
```bash
cd backend
npm run generate:mock-flights -- --days-back=90 --days-forward=270
```

### Clear Flight Data
```sql
TRUNCATE TABLE flight_prices;
```

### Import ข้อมูลเที่ยวบิน / สนามบิน
```bash
cd backend
npm run import-airports
npm run import-airpaz-flights
# หรือ npm run import-flights-from-csv
```

### Check Database
```bash
# Connect (Docker)
docker exec -it flight_search_db psql -U postgres -d flight_search
```
```sql
-- Count records
SELECT COUNT(*) FROM flight_prices;

-- Check date range
SELECT MIN(departure_date), MAX(departure_date) FROM flight_prices;
```

### Restart Backend
```bash
# Kill process on port 3001
$process = Get-NetTCPConnection -LocalPort 3001 | 
           Select-Object -ExpandProperty OwningProcess -First 1
Stop-Process -Id $process -Force

# Start backend
cd backend && npm run dev
```

---

## 🐛 Troubleshooting

### Backend ไม่ start
- **ปัญหา:** Port 3001 ถูกใช้งานอยู่
- **แก้ไข:** ดู [01-GETTING-STARTED.md](./01-GETTING-STARTED.md#troubleshooting)

### Database connection failed
- **ปัญหา:** ไม่สามารถเชื่อมต่อ PostgreSQL
- **แก้ไข:** ตรวจสอบ `.env` และ PostgreSQL service

### ไม่มีข้อมูลเที่ยวบิน
- **ปัญหา:** Search ไม่เจออะไร
- **แก้ไข:** นำเข้าข้อมูล `npm run import-airpaz-flights` หรือ `npm run import-flights-from-csv` หรือสร้าง mock: `npm run generate:mock-flights -- --days-back=90 --days-forward=270`

### Season ไม่แสดงสี
- **ปัญหา:** Timeline แสดงสีเดียว
- **แก้ไข:** ตรวจสอบว่ามีข้อมูลอย่างน้อย 180 วัน

---

## 📊 Key Features

### ✅ Implemented

1. **Flight Search**
   - Search by origin, destination, date
   - Filter by airline, price, duration
   - One-way and round-trip support

2. **Price Analysis**
   - Season จาก price_level (low/typical/high)
   - Price comparison
   - Best time to fly recommendation

3. **Seasonal Breakdown**
   - Visual timeline with 3 colors
   - Low/Normal/High season classification
   - Price range for each season

4. **Mock Data Generator**
   - Realistic price variation
   - Seasonal patterns
   - 130,000+ flight records

### 🚧 Future Enhancements

1. **Caching Layer** (Redis)
2. **Read Replicas** (PostgreSQL)
3. **Background Jobs** (Bull/Agenda)
4. **Real-time Updates** (WebSocket)
5. **User Accounts** (Authentication)
6. **Price Alerts** (Email/Push notifications)

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit: `git commit -m "feat: your feature"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

### Coding Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Conventional Commits** for commit messages

---

## 📞 Support

### Need Help?

1. **Check documentation** in this folder
2. **Review error logs** in terminal/console
3. **Check database** with SQL commands
4. **Consult codebase** comments and types

### Common Resources

- PostgreSQL Docs: https://www.postgresql.org/docs/
- TimescaleDB Docs: https://docs.timescale.com/
- Next.js Docs: https://nextjs.org/docs
- Express.js Docs: https://expressjs.com/

---

## 📝 Version History

### v1.1.0 (2026-02-03)
- ✅ อัปเดต docs ให้ตรงกับระบบปัจจุบัน
- ✅ Schema: airlines, airports, routes, flight_prices, search_statistics, price_statistics, route_price_statistics, flight_paths
- ✅ Data import: import-flights-from-csv, import-airpaz-flights, import-intl-flights, import-airports
- ✅ Season จาก price_level (ไม่ใช้ weather/holiday)
- ✅ Docker ที่ root โปรเจค, port 5432 สำหรับ host

---

## 📄 License

[Add your license here]

---

## 👥 Team

[Add your team members here]

---

**Last Updated:** 2026-02-03  
**Documentation Version:** 1.1.0  
**Project Version:** 1.0.0

---

<div align="center">

**Happy Coding! ✈️**

Made with ❤️ for Thai travelers

</div>

