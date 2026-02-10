# 📚 System Documentation - Flight Search Project

เอกสารเกี่ยวกับสถาปัตยกรรมระบบ, สูตรการคำนวณ, API และข้อมูลที่ใช้งาน

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Calculation Formulas](#calculation-formulas)
3. [API Documentation](#api-documentation)
4. [Data Models](#data-models)
5. [External APIs](#external-apis)
6. [Season Calculation System](#season-calculation-system)

---

## 🏗️ System Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 18+ with TimescaleDB (optional)
- **ORM**: None (Raw SQL queries via `pg` library)
- **Scheduler**: node-cron (optional, via `ENABLE_SCHEDULED_JOBS`)

#### Frontend
- **Framework**: Next.js 14+ (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    (Next.js + React)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Search Form  │  │ Results Grid │  │ Season Chart │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────┴────────────────────────────────────┐
│                         BACKEND                              │
│                   (Express.js + TypeScript)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Controllers Layer                        │  │
│  │  - flightController                                   │  │
│  │  - destinationController                              │  │
│  │  - airportController                                  │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────┴─────────────────────────────────────┐  │
│  │              Services Layer                           │  │
│  │  - flightAnalysisService (Season Calculation)        │  │
│  │  - pricePredictionService                             │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────┴─────────────────────────────────────┐  │
│  │              Models Layer                             │  │
│  │  - Flight Model                                       │  │
│  │  - WeatherStatistics Model                            │  │
│  │  - HolidayStatistics Model                            │  │
│  │  - DemandStatistics Model                             │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
└───────────────────┼──────────────────────────────────────────┘
                    │
┌───────────────────┴──────────────────────────────────────────┐
│                    DATABASE LAYER                            │
│                PostgreSQL + TimescaleDB                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Airlines   │  │    Routes    │  │Flight Prices │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Airports   │  │   Search     │  │   Route      │     │
│  │              │  │  Statistics  │  │Price Stats   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Price Stats  │  │ Flight Paths │  (international)       │
│  └──────────────┘  └──────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

---





## 🧮 Calculation Formulas


### 1. Database Price Calculation (Real Data)


**Location:** `backend/src/scripts/generate-mock-flights.ts` (if using mock data)  
**Location:** `backend/src/scripts/seed.ts` (if seeding real data)


#### Base Price with Seasonal Multipliers


```typescript
// Real price calculation from database seeds
price = basePrice × seasonMultiplier × holidayMultiplier × priceVariation


Where:
- basePrice: Route-specific base price (from routes table)
- seasonMultiplier: Based on month (high: 1.3-1.5x, normal: 1.0x, low: 0.7-0.9x)
- holidayMultiplier: 1.1-1.3x for holiday periods
- priceVariation: 0.98-1.02 (±2% for realism)
```


**Note:** For production, actual prices come from real flight data APIs and are stored in the `flight_prices` table.


#### Travel Class Pricing


```typescript
// Applied when querying database
queryPrice = basePrice × travelClassMultiplier


Where travelClassMultiplier:
- Economy: 1.0x
- Business: 2.5x (typically 2.5× economy)
- First Class: 4.0x (typically 4× economy)
```


**Example Query:** When user selects Business class, database query filters by `travel_class = 'business'` and returns prices that already include the business class multiplier.


---


### 2. Season Calculation (Simplified - Using price_level)


**Location:** `backend/src/services/flightAnalysisService.ts`


#### Direct Database-Driven Season Classification


```typescript
// OLD COMPLEX METHOD (DEPRECATED)
seasonScore = (pricePercentile × 0.6) + (holidayScore × 0.3) + (weatherScore × 0.1)


// NEW SIMPLIFIED METHOD (CURRENT)
season = price_level from flight_prices table


Where price_level is:
- 'low' → Low Season
- 'typical' → Normal Season  
- 'high' → High Season
```


#### Season Data Generation


```typescript
// Seasons are determined by grouping flights by price_level
lowSeasonFlights = filter flights where price_level = 'low'
normalSeasonFlights = filter flights where price_level = 'typical'
highSeasonFlights = filter flights where price_level = 'high'


// Months for each season are dynamically determined from flight dates
season.months = unique months from flights in that price_level group
```


**Key Changes:**
- ✅ **No complex calculations** - Uses pre-determined `price_level` from database
- ✅ **No weather/holiday data** - Season purely based on price level
- ✅ **Dynamic month assignment** - Months assigned based on actual flight data
- ✅ **Simpler maintenance** - Just update `price_level` in database


---


### 3. Price Prediction (XGBoost Machine Learning)


**Location:** `backend/src/services/pricePredictionService.ts`


#### XGBoost Model Training


```typescript
// Features for price prediction
features = [
  'day_of_month',      // 1-31
  'day_of_week',       // 0-6 (Monday-Sunday)
  'month',             // 1-12
  'days_until_flight', // How far in advance
  'route_base_price',  // Base price from routes table
  'historical_avg',    // 30-day average price
  'price_level',       // low/typical/high
  'is_weekend',        // 0 or 1
  'is_holiday'         // 0 or 1
]


// Model predicts price based on historical patterns
predictedPrice = xgboost.predict(features)
```


#### Price Trend Analysis


```typescript
// 30-day trend calculation
priceTrend = {
  direction: 'up' | 'down' | 'stable',
  percentage: currentAvgPrice / previousAvgPrice,
  change: currentAvgPrice - previousAvgPrice
}
```


---


### 4. Passenger Price Calculation


**Location:** `backend/src/services/flightAnalysisService.ts`


#### Discount Application


```typescript
totalPrice = (adultPrice × adults) + (childPrice × children × 0.75) + (infantPrice × infants × 0.1)


Where:
- adults: Full price
- children: 25% discount (pay 75%)
- infants: 90% discount (pay 10%)
```


#### Trip Type Adjustment


```typescript
// For one-way trips (compared to round-trip in database)
oneWayPrice = roundTripPrice × 0.5
```


---


### 5. Best Deal Recommendation


**Location:** `backend/src/services/flightAnalysisService.ts`


#### Best Price with Duration Range


```typescript
// For round-trip: Finds cheapest combination within duration range
for duration in [minDuration...maxDuration]:
  departurePrice = priceForDate(departureDate)
  returnPrice = priceForDate(departureDate + duration)
  totalPrice = departurePrice + returnPrice
  
  if totalPrice < bestPrice:
    bestPrice = totalPrice
    bestDuration = duration
```


#### Season-Based Recommendation


```typescript
// System always recommends the best deal across all seasons
bestDeal = seasons.find(season => season.bestDeal.price is minimum)


// If user selects a date, calculate savings
savings = userSelectedDatePrice - bestDealPrice
```


---


### 6. Flight Duration Estimation


```typescript
// Actual duration from database (real flight data)
duration = arrival_time - departure_time


// For mock data generation:
duration_minutes = (distance_km / 800) × 60 + 30


Where:
- 800 km/h: Average cruising speed
- +30 minutes: Taxi, takeoff, landing buffer
```


---


## 📊 Data Flow Summary


1. **Real Prices** → From APIs to `flight_prices` table with `price_level`
2. **Season Calculation** → Direct mapping: `price_level` → Season Type
3. **Price Prediction** → XGBoost model using historical patterns
4. **Recommendation** → Find cheapest flight considering duration range
5. **Final Price** → Apply passenger discounts and trip type multipliers


## 🔄 Migration Notes


**Before:** Complex season calculation with 60% price + 30% holiday + 10% weather  
**After:** Simple lookup of `price_level` column from database


---

## 🌐 API Documentation

### Internal REST API Endpoints

**Base URL:** `http://localhost:3001/api`

#### 1. Flight Search

```http
POST /flights/search
Content-Type: application/json

{
  "origin": "bangkok",
  "destination": "chiang-mai",
  "departureDate": "2025-12-30",
  "returnDate": "2026-01-05", // optional
  "tripType": "one-way", // or "round-trip"
  "adults": 1,
  "airlinePreference": [], // optional
  "maxStops": 0,
  "durationRange": {
    "min": 0,
    "max": 720
  }
}

Response:
{
  "success": true,
  "data": [
    {
      "id": "123",
      "origin": "BKK",
      "destination": "CNX",
      "departureDate": "2025-12-30",
      "price": 1500,
      "airline": {
        "code": "TG",
        "name": "Thai Airways"
      },
      "duration": 75,
      "stops": 0
    }
  ],
  "meta": {
    "count": 25,
    "cheapest": 1200,
    "fastest": 65
  }
}
```

#### 2. Flight Price Analysis

```http
POST /flights/analyze
Content-Type: application/json

{
  "origin": "bangkok",
  "destination": "chiang-mai",
  "departureDate": "2025-12-30",
  "returnDate": null,
  "tripType": "one-way",
  "durationRange": {
    "min": 0,
    "max": 720
  }
}

Response:
{
  "success": true,
  "data": {
    "seasons": [
      {
        "type": "low",
        "months": ["กุมภาพันธ์", "มีนาคม", "กันยายน"],
        "priceRange": {
          "min": 741,
          "max": 16400
        },
        "bestDeal": {
          "date": "2026-03-15",
          "price": 741
        },
        "description": "ราคาถูกที่สุดของปี เหมาะสำหรับผู้ที่มีความยืดหยุ่นในการเดินทาง"
      },
      {
        "type": "normal",
        "months": ["มกราคม", "เมษายน", ...],
        "priceRange": { "min": 982, "max": 16000 }
      },
      {
        "type": "high",
        "months": ["ตุลาคม", "พฤศจิกายน", "ธันวาคม"],
        "priceRange": { "min": 696, "max": 1788 }
      }
    ],
    "priceComparison": {
      "userSelectedPrice": 1500,
      "bestDealPrice": 741,
      "savings": 759,
      "percentageDifference": 50.6
    },
    "recommendation": {
      "date": "2026-03-15",
      "price": 741,
      "reason": "ราคาถูกกว่าที่คุณเลือก 759 บาท (50.6%)"
    }
  }
}
```

#### 3. Cheapest Dates

```http
POST /flights/cheapest-dates
Content-Type: application/json

{
  "origin": "BKK",
  "destination": "CNX",
  "departureDate": "2025-12-30"
}

Response:
{
  "success": true,
  "data": [
    {
      "date": "2025-12-28",
      "price": 1200
    },
    {
      "date": "2025-12-29",
      "price": 1250
    },
    {
      "date": "2025-12-30",
      "price": 1500
    }
  ]
}
```

#### 4. Destination Inspiration

```http
POST /destinations/inspiration
Content-Type: application/json

{
  "origin": "BKK",
  "maxPrice": 3000
}

Response:
{
  "success": true,
  "data": [
    {
      "destination": "CNX",
      "destinationName": "Chiang Mai",
      "price": 1200,
      "departureDate": "2025-12-30",
      "returnDate": "2026-01-05"
    }
  ]
}
```

#### 5. Airport Search

```http
GET /airports/search?keyword=bangkok&subType=AIRPORT

Response:
{
  "success": true,
  "data": [
    {
      "iataCode": "BKK",
      "name": "Suvarnabhumi Airport",
      "cityName": "Bangkok",
      "countryCode": "TH"
    }
  ]
}
```

---

## 💾 Data Models

### Airlines Table

```sql
CREATE TABLE airlines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,        -- IATA code (e.g., 'TG')
  name VARCHAR(255) NOT NULL,              -- English name
  name_th VARCHAR(255),                    -- Thai name
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Data:**
- TG - Thai Airways (การบินไทย)
- FD - Thai AirAsia (แอร์เอเชีย)
- SL - Thai Lion Air (ไทยไลอ้อนแอร์)
- VZ - Thai Vietjet Air (ไทยเวียตเจ็ทแอร์)
- PG - Bangkok Airways (บางกอกแอร์เวย์ส)
- DD - Nok Air (นกแอร์)

---

### Routes Table

```sql
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  origin VARCHAR(50) NOT NULL,
  destination VARCHAR(50) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_duration_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(origin, destination)
);
```

**Data:** มาจาก import (AirPaz, CSV, international) — origin/destination เป็น airport code หรือชื่อ

---

### Flight Prices Table

ตารางหลักเก็บราคาเที่ยวบิน (schema จาก migration 001 และ 009):

- `id`, `route_id`, `airline_id`, `departure_date`, `return_date`, `price`, `base_price`
- `trip_type` ('one-way', 'round-trip', 'One way', 'Round trip')
- `travel_class` ('economy', 'business', 'first')
- `departure_time`, `arrival_time`, `duration` (นาที), `flight_number`
- `season` ('high', 'normal', 'low'), `price_level` ('typical', 'low', 'high')
- `dep_airport`, `arr_airport`, `airline_name`, `airline_code`, `source`, `scraped_at`

**TimescaleDB:** ใช้ hypertable บน `departure_date` (เมื่อ ENABLE_TIMESCALEDB=true)

**Data Volume:** มาจาก import (import-flights-from-csv, import-airpaz-flights, import-intl-flights) หรือ generate-mock-flights

---

### Airports Table

```sql
CREATE TABLE airports (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  city VARCHAR(100),
  country VARCHAR(10),
  country_code VARCHAR(10),
  country_name VARCHAR(100),
  airport_type VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Data Source:** `npm run import-airports` (จาก CSV)

---

### Search Statistics & Price Statistics

- **search_statistics** — เก็บการค้นหาของผู้ใช้ (origin, destination, trip_type, ฯลฯ)
- **price_statistics** — เก็บราคาแนะนำและ season ต่อ route
- **route_price_statistics** — สถิติราคาต่อ route (จาก migration 008)

---

### Flight Paths (International)

ตาราง **flight_paths** (เดิมชื่อ intl_flight_info) เก็บข้อมูลเที่ยวบินระหว่างประเทศ แยกจาก flight_prices ภายในประเทศ

---

## 🔌 External APIs / Data Sources

ข้อมูลเที่ยวบินในระบบมาจาก:

- **CSV import** — `import-flights-from-csv.ts` อ่านจาก `backend/data/`
- **AirPaz** — `import-airpaz-flights.ts` จากข้อมูลใน `backend/data/airpaz_flight_data/`
- **International flights** — `import-intl-flights.ts` จาก `backend/data/intl_flight_data/`
- **Airports** — `import-airports.ts` จาก `backend/data/flightsfrom_airport_codes_cleaned.csv`

ไม่มี External API สำหรับ weather หรือ holidays ใน schema ปัจจุบัน ฤดูกาลคำนวณจาก `price_level` ในตาราง `flight_prices`

---

## 🎯 Season Calculation System

### Overview (ระบบปัจจุบัน)

ระบบใช้ค่าจากคอลัมน์ **price_level** ในตาราง `flight_prices` โดยตรง (ไม่ใช้ weather/holiday):

- **price_level = 'low'** → Low Season
- **price_level = 'typical'** → Normal Season
- **price_level = 'high'** → High Season

**Location:** `backend/src/services/flightAnalysisService.ts`

เดือนในแต่ละ season มาจากการจัดกลุ่มเที่ยวบินตาม `price_level` จากข้อมูลจริงใน DB

---

## 📊 Data Sources Summary

| Data Type | Source | Update Frequency |
|-----------|--------|------------------|
| Flight Prices | import-flights-from-csv, import-airpaz-flights, import-intl-flights, generate-mock-flights | ตามการ import/รัน script |
| Airlines | มาจาก import เที่ยวบิน / seed | ตามการ import |
| Routes | มาจาก import เที่ยวบิน | ตามการ import |
| Airports | import-airports (CSV) | Manual |
| Search/Price Statistics | API + scheduler | รันไทม์ |

---

## 🔐 Environment Variables Reference

### Backend `.env`

```env
# Database (เมื่อรัน backend บนเครื่อง + Docker DB: ใช้ localhost และ 5432)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flight_search
DB_USER=postgres
DB_PASSWORD=postgres

# TimescaleDB (แนะนำเมื่อใช้ Docker)
ENABLE_TIMESCALEDB=true

# Server
PORT=3001
NODE_ENV=development

# Scheduled Jobs (Optional)
ENABLE_SCHEDULED_JOBS=false  # Set to 'true' to enable scheduled tasks

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_MAX_REQUESTS=1000  # Development: 1000, Production: 300

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 📈 Performance Considerations

### Database Indexes

Critical indexes for query performance:

```sql
-- Flight prices by date
CREATE INDEX idx_flight_prices_departure_date 
  ON flight_prices(departure_date);

-- Flight prices by route and date
CREATE INDEX idx_flight_prices_route_date 
  ON flight_prices(route_id, departure_date);

```

### TimescaleDB Benefits (Optional)

TimescaleDB เป็น optional extension ที่สามารถเปิดใช้งานได้ผ่าน environment variable:

```env
ENABLE_TIMESCALEDB=true
```

**Benefits:**
- **Efficient time-series queries** - `flight_prices` can be a hypertable
- **Automatic data partitioning** by date
- **Better compression** for historical data
- **Faster aggregations** on time ranges

**Note:** ระบบทำงานได้ปกติโดยไม่ต้องใช้ TimescaleDB

---

## 🚀 Scaling Considerations

### Current Features

1. **Scheduled Jobs** (Optional)
   - Enable via `ENABLE_SCHEDULED_JOBS=true`
   - Background tasks for data sync
   - Pre-calculate popular routes

2. **Rate Limiting**
   - Configurable per environment
   - Separate limits for statistics endpoints
   - Production: 300 requests/minute
   - Development: 1000 requests/minute

### Current Limitations

1. **Single database** - No read replicas
2. **No caching layer** - Every request hits database
3. **No CDN** - Static assets served from Next.js

### Future Improvements

1. **Add Redis caching**
   - Cache flight search results (5-15 min)
   - Cache season calculations (1 day)
   
2. **Database read replicas**
   - Separate read/write operations
   - Load balance read queries

3. **CDN for frontend**
   - Vercel/Cloudflare
   - Edge caching

4. **Background jobs** (Partially implemented)
   - Pre-calculate popular routes

---

## ✈️ Travel Class Support

### Overview

ระบบรองรับการคำนวณราคาตามชั้นโดยสาร (Travel Class) 3 ระดับ:

1. **Economy Class** (ชั้นประหยัด) - Multiplier: 1.0x
2. **Business Class** (ชั้นธุรกิจ) - Multiplier: 2.5x
3. **First Class** (ชั้นหนึ่ง) - Multiplier: 4.0x

### Price Calculation with Travel Class

```typescript
finalPrice = basePrice × 
             seasonalMultiplier × 
             tripTypeMultiplier × 
             travelClassMultiplier × 
             passengerCount

Where:
- travelClassMultiplier:
  - economy: 1.0x
  - business: 2.5x
  - first: 4.0x
```

### Database Storage

- คอลัมน์ `travel_class` ในตาราง `flight_prices` เก็บข้อมูลชั้นโดยสาร
- Default value: `'economy'`
- ถ้า database มีข้อมูล travel_class อยู่แล้ว ใช้ราคานั้นเลย
- ถ้าไม่มี (มีแค่ economy) ระบบจะคูณด้วย multiplier อัตโนมัติ

### API Usage

```typescript
// Request
{
  "origin": "bangkok",
  "destination": "chiang-mai",
  "travelClass": "business", // Optional, default: "economy"
  "passengerCount": 2,
  // ... other params
}

// Response price will be calculated with travel class multiplier
```

---

**Last Updated:** 2026-02-03
**Version:** 1.2.0

