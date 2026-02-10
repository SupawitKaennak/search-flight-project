# 🔧 Scripts Reference - Flight Search Project

เอกสารอธิบาย scripts ที่ใช้ในโปรเจค สำหรับ import ข้อมูลและจัดการระบบ

---

## 📋 Table of Contents

1. [Data Import Scripts](#data-import-scripts)
2. [Data Generation Scripts](#data-generation-scripts)
3. [Maintenance & Testing Scripts](#maintenance--testing-scripts)
4. [NPM Scripts Reference](#npm-scripts-reference)
5. [Common Workflows](#common-workflows)

---

## 📥 Data Import Scripts

ข้อมูลเที่ยวบินและสนามบินมาจากไฟล์ CSV ใน `backend/data/` — ไม่มีขั้นตอน fetch จาก API ในระบบปัจจุบัน

### 1. import-flights-from-csv.ts

**Purpose:** นำเข้าเที่ยวบินจากไฟล์ CSV ทั่วไป

**Location:** `backend/src/scripts/import-flights-from-csv.ts`

**Usage:**
```bash
cd backend
npm run import-flights-from-csv
```

---

### 2. import-airpaz-flights.ts

**Purpose:** นำเข้าข้อมูลเที่ยวบินจากชุดข้อมูล AirPaz

**Location:** `backend/src/scripts/import-airpaz-flights.ts`

**Data:** `backend/data/airpaz_flight_data/*.csv`

**Usage:**
```bash
cd backend
npm run import-airpaz-flights
```

---

### 3. import-intl-flights.ts

**Purpose:** นำเข้าข้อมูลเที่ยวบินระหว่างประเทศ

**Location:** `backend/src/scripts/import-intl-flights.ts`

**Data:** `backend/data/intl_flight_data/*.csv`

**Usage:**
```bash
cd backend
npm run import-intl-flights
```

---

### 4. import-airports.ts

**Purpose:** นำเข้ารายการสนามบินจาก CSV

**Location:** `backend/src/scripts/import-airports.ts`

**Data:** ใช้ข้อมูลเช่น `backend/data/flightsfrom_airport_codes_cleaned.csv`

**Usage:**
```bash
cd backend
npm run import-airports
```

---

## 🎲 Data Generation Scripts

### generate-mock-flights.ts

**Purpose:** สร้างข้อมูลเที่ยวบิน mock สำหรับพัฒนา/ทดสอบ

**Location:** `backend/src/scripts/generate-mock-flights.ts`

**Usage:**
```bash
cd backend
npm run generate:mock-flights -- --days-back=90 --days-forward=270
```

**Options:** `--days-back`, `--days-forward` กำหนดช่วงวันที่

---

## 🔄 Maintenance & Testing Scripts

Scripts ใน `backend/src/scripts/` ที่รันด้วย `npx tsx` โดยตรง (ไม่มี npm script ใน package.json):

### validatePriceConsistency.ts

**Purpose:** ตรวจสอบความสอดคล้องของราคาในระบบ

**Usage:**
```bash
cd backend
npx tsx src/scripts/validatePriceConsistency.ts
```

---

### test-api-endpoints.ts

**Purpose:** ทดสอบ API endpoints หลัก (health, flights/search, flights/analyze, airports, destinations, ฯลฯ)

**Usage:**
```bash
cd backend
npx tsx src/scripts/test-api-endpoints.ts
```

---

### Scripts อื่นๆ (ใช้ตามความจำเป็น)

- `calculate-route-price-statistics.ts` — คำนวณสถิติราคาต่อ route
- `check-duplicates.ts` — ตรวจสอบข้อมูลซ้ำ
- `migrate-intl-data.ts` — migrate ข้อมูลเที่ยวบินระหว่างประเทศ
- `verify-*.ts` — ใช้สำหรับ verify การ migrate / แก้ไขข้อมูล

---

## 📦 NPM Scripts Reference

### Backend (จาก `backend/package.json`)

| Script | คำอธิบาย |
|--------|----------|
| `npm run dev` | เริ่ม development server (tsx watch) |
| `npm run build` | Build TypeScript |
| `npm run start` | รัน production (node dist/server.js) |
| `npm run migrate` | รัน database migrations (`src/database/migrate.ts`) |
| `npm run import-flights-from-csv` | นำเข้าเที่ยวบินจาก CSV |
| `npm run import-airpaz-flights` | นำเข้า AirPaz flights |
| `npm run import-intl-flights` | นำเข้าเที่ยวบินระหว่างประเทศ |
| `npm run import-airports` | นำเข้ารายการสนามบิน |
| `npm run generate:mock-flights` | สร้าง mock flight data |
| `npm run docker:up` | เริ่ม Docker (จาก root: `docker-compose up -d`) |
| `npm run docker:down` | หยุด Docker |
| `npm run docker:down:volumes` | หยุดและลบ volumes |
| `npm run docker:logs` | ดู logs postgres |
| `npm run lint` | รัน ESLint |

**หมายเหตุ:** คำสั่ง `docker:*` เรียก `docker-compose` — ไฟล์ `docker-compose.yml` อยู่ที่ **root โปรเจค** ดังนั้นถ้ารันจาก backend อาจต้องรันจาก root: `docker-compose up -d`

---

## 🎯 Common Workflows

### Workflow 1: Setup โปรเจคใหม่

```bash
# 1. Clone & Install
git clone <repo-url>
cd search-flight-27
cd backend && npm install
cd ../frontend && npm install

# 2. Start Database (Docker — จาก root โปรเจค)
docker-compose up -d

# 3. Run Migrations
cd backend
npm run migrate

# 4. นำเข้าข้อมูล (เลือกอย่างใดอย่างหนึ่งหรือหลายอย่าง)
npm run import-airports
npm run import-airpaz-flights
# หรือ npm run import-intl-flights
# หรือ npm run import-flights-from-csv

# ถ้าไม่มีข้อมูลจริง — สร้าง mock
npm run generate:mock-flights -- --days-back=90 --days-forward=270

# 5. Start Backend
npm run dev
```

---

### Workflow 2: เคลียร์และนำเข้าเที่ยวบินใหม่

```bash
cd backend

# 1. เข้า DB (Docker)
docker exec -it flight_search_db psql -U postgres -d flight_search

# 2. เคลียร์ข้อมูลเที่ยวบิน (เก็บ routes/airlines ตามต้องการ)
TRUNCATE TABLE flight_prices;
# หรือ TRUNCATE TABLE flight_prices, route_price_statistics CASCADE;
\q

# 3. นำเข้าหรือ generate ใหม่
npm run import-airpaz-flights
# หรือ npm run generate:mock-flights -- --days-back=90 --days-forward=270
```

---

### Workflow 3: ทดสอบ API

```bash
cd backend
npx tsx src/scripts/test-api-endpoints.ts
```

---

## 🔍 Script Locations Summary

```
backend/src/
├── database/
│   └── migrate.ts              # รัน migrations
├── scripts/
│   ├── import-flights-from-csv.ts
│   ├── import-airpaz-flights.ts
│   ├── import-intl-flights.ts
│   ├── import-airports.ts
│   ├── generate-mock-flights.ts
│   ├── test-api-endpoints.ts
│   ├── validatePriceConsistency.ts
│   ├── calculate-route-price-statistics.ts
│   ├── check-duplicates.ts
│   ├── migrate-intl-data.ts
│   └── verify-*.ts
```

---

## 📚 Related Documentation

- [Getting Started](./01-GETTING-STARTED.md) — Setup โปรเจค
- [SQL Commands](./02-SQL-COMMANDS.md) — SQL สำหรับจัดการข้อมูล
- [System Documentation](./03-SYSTEM-DOCUMENTATION.md) — Architecture & APIs
- [Quick Reference](./QUICK-REFERENCE.md) — Cheat sheet

---

**Last Updated:** 2026-02-03  
**Version:** 1.2.0
