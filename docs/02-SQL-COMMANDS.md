# 🗄️ SQL Commands Reference

รวมคำสั่ง SQL ที่ใช้งานทั้งหมดสำหรับการจัดการข้อมูลในโปรเจค Flight Search System

---

## 📋 Table of Contents

1. [Database Connection](#database-connection)
2. [Data Verification](#data-verification)
3. [Data Cleanup](#data-cleanup)
4. [Data Analysis](#data-analysis)
5. [Performance Optimization](#performance-optimization)
6. [Backup & Restore](#backup--restore)

---

## 🔌 Database Connection

### Connect to Database

```bash
# Docker (จาก root โปรเจค) — port 5432
docker exec -it flight_search_db psql -U postgres -d flight_search

# Windows PowerShell (ติดตั้ง PostgreSQL เอง)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_search -p 5432 -h localhost

# macOS/Linux
psql -U postgres -d flight_search -p 5432 -h localhost
```

### Basic Connection Commands

```sql
-- List all databases
\l

-- Connect to flight_search database
\c flight_search

-- List all tables
\dt

-- Describe table structure
\d table_name

-- List all extensions
\dx

-- Exit psql
\q
```

---

## ✅ Data Verification

### Check All Tables

```sql
-- Count records in all tables (ตาม schema ปัจจุบัน)
SELECT 'airlines' as table_name, COUNT(*) as count FROM airlines
UNION ALL
SELECT 'airports', COUNT(*) FROM airports
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'flight_prices', COUNT(*) FROM flight_prices
UNION ALL
SELECT 'search_statistics', COUNT(*) FROM search_statistics
UNION ALL
SELECT 'price_statistics', COUNT(*) FROM price_statistics
UNION ALL
SELECT 'route_price_statistics', COUNT(*) FROM route_price_statistics
UNION ALL
SELECT 'flight_paths', COUNT(*) FROM flight_paths;
```

### Airlines

```sql
-- List all airlines
SELECT * FROM airlines ORDER BY code;

-- Count airlines
SELECT COUNT(*) FROM airlines;
-- Expected: 6 airlines (TG, FD, SL, VZ, PG, DD)

-- Check specific airline
SELECT * FROM airlines WHERE code = 'TG';
```

### Routes

```sql
-- List all routes
SELECT 
  id,
  origin,
  destination,
  base_price,
  avg_duration_minutes
FROM routes
ORDER BY origin, destination;

-- Count routes by origin
SELECT 
  origin, 
  COUNT(*) as route_count
FROM routes
GROUP BY origin
ORDER BY route_count DESC;

-- ตัวอย่าง: นับ routes ตาม origin
SELECT COUNT(*) FROM routes WHERE origin = 'BKK';
```

### Flight Prices

```sql
-- Count total flight prices
SELECT COUNT(*) FROM flight_prices;
-- Expected: ~130,000-140,000 records

-- Check date range
SELECT 
  MIN(departure_date) as earliest_date,
  MAX(departure_date) as latest_date,
  COUNT(*) as total_flights
FROM flight_prices;

-- Count flights by route
SELECT 
  r.origin,
  r.destination,
  COUNT(*) as flight_count,
  MIN(fp.price) as min_price,
  MAX(fp.price) as max_price,
  AVG(fp.price)::DECIMAL(10,2) as avg_price
FROM routes r
LEFT JOIN flight_prices fp ON r.id = fp.route_id
GROUP BY r.id, r.origin, r.destination
ORDER BY flight_count DESC;

-- Check flights for specific route
SELECT 
  fp.departure_date,
  fp.return_date,
  fp.price,
  fp.trip_type,
  COALESCE(a.name, fp.airline_name) as airline,
  r.origin || ' -> ' || r.destination as route
FROM flight_prices fp
JOIN routes r ON fp.route_id = r.id
LEFT JOIN airlines a ON fp.airline_id = a.id
WHERE r.origin = 'BKK' AND r.destination = 'CNX'
ORDER BY fp.departure_date
LIMIT 20;

-- Check price distribution by month
SELECT 
  TO_CHAR(departure_date, 'YYYY-MM') as month,
  COUNT(*) as flights,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price)::DECIMAL(10,2) as avg_price
FROM flight_prices fp
JOIN routes r ON fp.route_id = r.id
WHERE r.origin = 'BKK' AND r.destination = 'CNX'
GROUP BY TO_CHAR(departure_date, 'YYYY-MM')
ORDER BY month;
```

---

## 🗑️ Data Cleanup

### ⚠️ CAUTION: These commands will DELETE data!

### Clear Flight Prices Only

```sql
-- Clear all flight prices (keeps routes and airlines)
TRUNCATE TABLE flight_prices;

-- Clear flight prices for specific route
DELETE FROM flight_prices 
WHERE route_id IN (
  SELECT id FROM routes 
  WHERE origin = 'BKK' AND destination = 'CNX'
);

-- Clear old flight prices (older than 90 days)
DELETE FROM flight_prices 
WHERE departure_date < CURRENT_DATE - INTERVAL '90 days';

-- Clear future flight prices (beyond 1 year)
DELETE FROM flight_prices 
WHERE departure_date > CURRENT_DATE + INTERVAL '1 year';
```

### Clear Routes and Flight Prices

```sql
-- Clear all routes and related flight prices
TRUNCATE TABLE routes, flight_prices CASCADE;

-- Clear specific route
DELETE FROM routes WHERE origin = 'BKK' AND destination = 'CNX';
-- Flight prices will be deleted automatically (CASCADE)
```

### Clear All Mock Data

```sql
-- Clear all flight-related data (keeps airlines)
TRUNCATE TABLE flight_prices, routes CASCADE;

-- Verify
SELECT COUNT(*) FROM flight_prices; -- Should be 0
SELECT COUNT(*) FROM routes; -- Should be 0
```

### Clear Statistics Tables

```sql
-- Clear search statistics
TRUNCATE TABLE search_statistics;

-- Clear price statistics
TRUNCATE TABLE price_statistics;

-- Clear route price statistics
TRUNCATE TABLE route_price_statistics;
```

### Reset Entire Database

```sql
-- ⚠️ DANGER: This will delete ALL data!
TRUNCATE TABLE 
  flight_prices,
  flight_paths,
  route_price_statistics,
  search_statistics,
  price_statistics,
  routes,
  airlines,
  airports
CASCADE;

-- Verify main tables are empty
SELECT 'flight_prices', COUNT(*) FROM flight_prices
UNION ALL SELECT 'routes', COUNT(*) FROM routes
UNION ALL SELECT 'airlines', COUNT(*) FROM airlines;
```

### Drop and Recreate Database (Nuclear Option)

```bash
# ⚠️ EXTREME CAUTION: Deletes everything!
psql -U postgres -c "DROP DATABASE flight_search;"
psql -U postgres -c "CREATE DATABASE flight_search;"
psql -U postgres -d flight_search -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"

# Then re-run all migrations
cd backend
npm run migrate
```

---

## 📊 Data Analysis

### Flight Price Analysis

```sql
-- Overall price statistics
SELECT 
  COUNT(*) as total_flights,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price)::DECIMAL(10,2) as avg_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::DECIMAL(10,2) as median_price
FROM flight_prices;

-- Price by trip type
SELECT 
  trip_type,
  COUNT(*) as flights,
  AVG(price)::DECIMAL(10,2) as avg_price
FROM flight_prices
GROUP BY trip_type;

-- Price by airline
SELECT 
  COALESCE(a.name, fp.airline_name) as airline,
  COUNT(*) as flights,
  MIN(fp.price) as min_price,
  MAX(fp.price) as max_price,
  AVG(fp.price)::DECIMAL(10,2) as avg_price
FROM flight_prices fp
LEFT JOIN airlines a ON fp.airline_id = a.id
GROUP BY a.id, a.name, fp.airline_name
ORDER BY avg_price;

-- Price by season (based on month)
SELECT 
  CASE 
    WHEN EXTRACT(MONTH FROM departure_date) IN (11, 12, 1, 2) THEN 'High Season'
    WHEN EXTRACT(MONTH FROM departure_date) IN (5, 6, 7, 8, 9, 10) THEN 'Low Season'
    ELSE 'Normal Season'
  END as season,
  COUNT(*) as flights,
  AVG(price)::DECIMAL(10,2) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM flight_prices
GROUP BY 
  CASE 
    WHEN EXTRACT(MONTH FROM departure_date) IN (11, 12, 1, 2) THEN 'High Season'
    WHEN EXTRACT(MONTH FROM departure_date) IN (5, 6, 7, 8, 9, 10) THEN 'Low Season'
    ELSE 'Normal Season'
  END
ORDER BY avg_price DESC;
```

### Route Analysis

```sql
-- Most expensive routes
SELECT 
  r.origin || ' -> ' || r.destination as route,
  COUNT(*) as flights,
  AVG(fp.price)::DECIMAL(10,2) as avg_price,
  MIN(fp.price) as min_price,
  MAX(fp.price) as max_price,
  r.base_price,
  r.avg_duration_minutes
FROM routes r
JOIN flight_prices fp ON r.id = fp.route_id
GROUP BY r.id, r.origin, r.destination, r.base_price, r.avg_duration_minutes
ORDER BY avg_price DESC
LIMIT 10;
```

### Date Range Analysis

```sql
-- Flights per day
SELECT 
  departure_date,
  COUNT(*) as flights,
  AVG(price)::DECIMAL(10,2) as avg_price
FROM flight_prices
GROUP BY departure_date
ORDER BY departure_date;

-- Busiest days
SELECT 
  departure_date,
  COUNT(*) as flights
FROM flight_prices
GROUP BY departure_date
ORDER BY flights DESC
LIMIT 10;

-- Price trends over time
SELECT 
  DATE_TRUNC('week', departure_date) as week,
  COUNT(*) as flights,
  AVG(price)::DECIMAL(10,2) as avg_price
FROM flight_prices
WHERE departure_date >= CURRENT_DATE
GROUP BY DATE_TRUNC('week', departure_date)
ORDER BY week;
```

### Search Statistics

```sql
-- Most searched routes
SELECT 
  origin,
  destination,
  COUNT(*) as search_count
FROM search_statistics
GROUP BY origin, destination
ORDER BY search_count DESC
LIMIT 10;

-- Popular search dates
SELECT 
  departure_date,
  COUNT(*) as searches
FROM search_statistics
GROUP BY departure_date
ORDER BY searches DESC
LIMIT 10;
```

---

## ⚡ Performance Optimization

### Index Management

```sql
-- Check existing indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Indexes สร้างจาก migrations แล้ว; ตัวอย่างสำหรับ reference:
-- idx_flight_prices_departure_date, idx_flight_prices_route_id,
-- idx_flight_prices_airline_id, idx_routes_origin_destination

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Table Statistics

```sql
-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Row counts and sizes
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Vacuum and Analyze

```sql
-- Analyze tables for query optimization
ANALYZE flight_prices;
ANALYZE routes;
ANALYZE airlines;

-- Vacuum tables to reclaim space
VACUUM flight_prices;

-- Full vacuum (locks table)
VACUUM FULL flight_prices;
```

---

## 💾 Backup & Restore

### Backup Database

```bash
# Full database backup
pg_dump -U postgres -d flight_search -F c -f flight_search_backup.dump

# Backup specific tables
pg_dump -U postgres -d flight_search -t flight_prices -t routes -f mock_data_backup.sql

# Backup with compression
pg_dump -U postgres -d flight_search -F c -Z 9 -f flight_search_backup.dump.gz
```

### Restore Database

```bash
# Restore full database
pg_restore -U postgres -d flight_search -c flight_search_backup.dump

# Restore specific tables
psql -U postgres -d flight_search -f mock_data_backup.sql
```

### Export to CSV

```sql
-- Export flight prices to CSV
COPY (
  SELECT 
    fp.id,
    r.origin,
    r.destination,
    fp.departure_date,
    fp.return_date,
    fp.price,
    fp.trip_type,
    a.code as airline_code
  FROM flight_prices fp
  JOIN routes r ON fp.route_id = r.id
  JOIN airlines a ON fp.airline_id = a.id
) TO '/path/to/flight_prices_export.csv' WITH CSV HEADER;
```

---

## 🔍 Query Templates

### Find Cheapest Flights

```sql
-- Cheapest flights for specific route and date
SELECT 
  fp.departure_date,
  fp.price,
  COALESCE(a.name, fp.airline_name) as airline,
  fp.trip_type
FROM flight_prices fp
JOIN routes r ON fp.route_id = r.id
LEFT JOIN airlines a ON fp.airline_id = a.id
WHERE r.origin = 'BKK'
  AND r.destination = 'CNX'
  AND fp.departure_date BETWEEN '2025-12-01' AND '2025-12-31'
  AND fp.trip_type IN ('one-way', 'One way')
ORDER BY fp.price
LIMIT 10;
```

### Price Range for Date Range

```sql
-- Get min/max/avg prices for each day in date range
SELECT 
  departure_date,
  COUNT(*) as available_flights,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price)::DECIMAL(10,2) as avg_price
FROM flight_prices fp
JOIN routes r ON fp.route_id = r.id
WHERE r.origin = 'BKK'
  AND r.destination = 'CNX'
  AND departure_date >= '2025-12-01'
  AND departure_date <= '2025-12-31'
GROUP BY departure_date
ORDER BY departure_date;
```

---

## 📞 Quick Reference

### Common Commands Cheatsheet

```bash
# Connect
psql -U postgres -d flight_search

# Count all flights
SELECT COUNT(*) FROM flight_prices;

# Clear all flights
TRUNCATE TABLE flight_prices;

# Check data range
SELECT MIN(departure_date), MAX(departure_date) FROM flight_prices;

# Check route count
SELECT COUNT(*) FROM routes WHERE origin = 'BKK';

# Exit
\q
```

---

**Last Updated:** 2026-02-03
**Version:** 1.1.0

