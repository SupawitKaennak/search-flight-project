-- Migration 009: Add new columns to flight_prices table
-- Adds origin_group, dep_airport, arr_airport, destination, airline info, price_text, scraped_at, source

ALTER TABLE flight_prices
ADD COLUMN IF NOT EXISTS origin_group VARCHAR(50),
ADD COLUMN IF NOT EXISTS dep_airport VARCHAR(10),
ADD COLUMN IF NOT EXISTS arr_airport VARCHAR(10),
ADD COLUMN IF NOT EXISTS destination VARCHAR(50),
ADD COLUMN IF NOT EXISTS airline_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS airline_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS price_text VARCHAR(50),
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- Add comments
COMMENT ON COLUMN flight_prices.dep_airport IS 'Departure airport code (e.g. BKK)';
COMMENT ON COLUMN flight_prices.arr_airport IS 'Arrival airport code (e.g. NRT)';
COMMENT ON COLUMN flight_prices.price_text IS 'Formatted price string';
COMMENT ON COLUMN flight_prices.scraped_at IS 'Time when the data was scraped';
