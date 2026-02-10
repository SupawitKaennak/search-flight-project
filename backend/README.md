# Flight Search Backend API

Backend API สำหรับ Flight Search Application ใช้ Node.js + Express + TypeScript + PostgreSQL + TimescaleDB

## Features

- **RESTful API** — ค้นหาและวิเคราะห์ราคาตั๋วเครื่องบิน
- **Automatic Airport Code Conversion** — แปลงชื่อจังหวัด/ประเทศเป็น airport code
- **Seasonal Price Analysis** — วิเคราะห์ราคาตามฤดูกาลจาก `price_level` ใน DB
- **TypeScript** — type safety
- **Input Validation** — Zod
- **Rate Limiting** และ security middleware (Helmet, CORS)
- **Database Migrations** — SQL migrations ใน `src/database/migrations/`

## Prerequisites

- **Node.js** 18+
- **Docker & Docker Compose** (สำหรับ PostgreSQL + TimescaleDB) — ไฟล์ `docker-compose.yml` อยู่ที่ **root โปรเจค** ไม่ใช่ใน backend

คู่มือเริ่มต้นแบบละเอียด: [docs/01-GETTING-STARTED.md](../docs/01-GETTING-STARTED.md)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

คัดลอก `env.example` เป็น `.env` แล้วแก้ไข:

```bash
cp env.example .env
```

เมื่อรัน backend บนเครื่องและใช้ Docker สำหรับ DB ให้ตั้งค่าเชื่อมจาก host:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flight_search
DB_USER=postgres
DB_PASSWORD=postgres
ENABLE_TIMESCALEDB=true
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
ENABLE_SCHEDULED_JOBS=false
```

(ใช้ `DB_PORT=5432` — docker-compose ที่ root map port เป็น `5432:5432`)

### 3. Start Database

จาก **root โปรเจค** (ไม่ใช่จาก backend):

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
cd backend
npm run migrate
```

### 5. Run Server

```bash
npm run dev
```

Server: `http://localhost:3001`  
API: `http://localhost:3001/api`  
Health: `http://localhost:3001/api/health`

## Scripts

| Script | คำอธิบาย |
|--------|----------|
| `npm run dev` | Development (tsx watch) |
| `npm run build` | Build TypeScript |
| `npm start` | Production |
| `npm run migrate` | รัน migrations |
| `npm run migrate:up` / `migrate:down` | Migrate up/down |
| `npm run import-airports` | นำเข้ารายการสนามบินจาก CSV |
| `npm run import-airpaz-flights` | นำเข้าเที่ยวบิน AirPaz |
| `npm run import-intl-flights` | นำเข้าเที่ยวบินระหว่างประเทศ |
| `npm run import-flights-from-csv` | นำเข้าเที่ยวบินจาก CSV |
| `npm run generate:mock-flights` | สร้าง mock flight data |
| `npm run docker:up` | เริ่ม Docker — **รันจาก root โปรเจค** เพราะ docker-compose อยู่ที่ root |
| `npm run docker:down` | หยุด Docker |
| `npm run docker:logs` | ดู logs postgres |
| `npm run lint` | ESLint |

## API Endpoints (สรุป)

Base URL: `http://localhost:3001/api`

- **GET** `/health` — Health check
- **POST** `/flights/analyze` — วิเคราะห์ราคาตามฤดูกาลและแนะนำช่วงเวลาที่ดี
- **POST** `/flights/prices` — ราคาเที่ยวบินตามช่วงวันที่
- **POST** `/flights/cheapest-dates` — วันที่ถูกที่สุดสำหรับเส้นทาง
- **POST** `/flights/predict-price` — ทำนายราคา
- **POST** `/flights/price-trend` — แนวโน้มราคา
- **POST** `/flights/predict-price-range` — ทำนายราคาช่วงวันที่
- **GET** `/flights/airlines` — สายการบินที่มีให้เส้นทาง
- **GET** `/flights/airport-code` — แปลงชื่อจังหวัดเป็น airport code
- **GET** `/flights/analysis` — วิเคราะห์เส้นทางเที่ยวบิน
- **GET** `/airports/search` — ค้นหาสนามบิน
- **GET** `/airports/:code` — รายละเอียดสนามบิน
- **GET** `/airlines` — รายการสายการบิน
- **GET** `/airlines/:code` — รายละเอียดสายการบิน
- **POST** `/destinations/inspiration` — แนะนำปลายทางตามงบ
- **POST** `/statistics/search` — บันทึก/ดึงสถิติการค้นหา
- **POST** `/statistics/price` — สถิติราคา

รายละเอียด request/response: [docs/03-SYSTEM-DOCUMENTATION.md](../docs/03-SYSTEM-DOCUMENTATION.md)

## Project Structure

```
backend/
├── src/
│   ├── config/           # database.ts, server.ts
│   ├── controllers/      # flight, airport, airline, destination, health, statistics
│   ├── database/         # migrate.ts, migrations/*.sql
│   ├── middleware/       # errorHandler.ts, validation.ts
│   ├── models/           # Airport, Flight, RoutePriceStatistics, SearchStatistics
│   ├── routes/           # flight, airport, airline, destination, statistics, health, index
│   ├── services/         # flightAnalysisService, pricePredictionService, cacheService, schedulerService
│   ├── scripts/          # import-*, generate-mock-flights, test-api-endpoints, etc.
│   ├── types/
│   ├── utils/            # airportCodeConverter, errorLogger
│   └── server.ts
├── data/                 # CSV (airpaz_flight_data, intl_flight_data, flightsfrom_airport_codes_cleaned.csv)
├── env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Database (สรุป)

- **airlines** — สายการบิน  
- **airports** — สนามบิน  
- **routes** — เส้นทาง (origin, destination, base_price, avg_duration_minutes)  
- **flight_prices** — ราคาเที่ยวบิน (TimescaleDB hypertable เมื่อเปิดใช้)  
- **search_statistics** — สถิติการค้นหา  
- **price_statistics** — สถิติราคา  
- **route_price_statistics** — สถิติราคาต่อเส้นทาง  
- **flight_paths** — ข้อมูลเที่ยวบินระหว่างประเทศ  

## Troubleshooting

- **เชื่อม DB ไม่ได้** — ตรวจสอบว่า Docker รันแล้ว และถ้ารัน backend บนเครื่อง ให้ใช้ `DB_HOST=localhost`, `DB_PORT=5432`
- **ทดสอบเชื่อม DB:**  
  `docker exec -it flight_search_db psql -U postgres -d flight_search -c "SELECT 1;"`
- **Migration:** รัน `npm run migrate` จากโฟลเดอร์ backend

## Documentation

- [docs/01-GETTING-STARTED.md](../docs/01-GETTING-STARTED.md) — เริ่มต้นใช้งาน
- [docs/02-SQL-COMMANDS.md](../docs/02-SQL-COMMANDS.md) — คำสั่ง SQL
- [docs/03-SYSTEM-DOCUMENTATION.md](../docs/03-SYSTEM-DOCUMENTATION.md) — สถาปัตยกรรมและ API
- [docs/04-SCRIPTS-REFERENCE.md](../docs/04-SCRIPTS-REFERENCE.md) — สคริปต์และ workflow

## License

ISC
