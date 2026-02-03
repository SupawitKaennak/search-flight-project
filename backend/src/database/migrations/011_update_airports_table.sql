-- Migration to update airports table with more detailed information from CSV
-- Adds country_code, country_name, and airport_type columns

ALTER TABLE airports 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS country_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS airport_type VARCHAR(50);

-- Update existing column constraints if needed (optional, keeping it flexible)
ALTER TABLE airports ALTER COLUMN city DROP NOT NULL;
ALTER TABLE airports ALTER COLUMN country DROP NOT NULL;
