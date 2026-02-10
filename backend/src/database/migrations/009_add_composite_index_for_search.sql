-- Migration 009: Add composite index for optimized search
-- This index covers the most common filter pattern used in analyzeFlightPrices

CREATE INDEX IF NOT EXISTS idx_flight_prices_search_composite 
ON flight_prices(route_id, departure_date, trip_type, travel_class);

-- Index for price analysis before/after queries
CREATE INDEX IF NOT EXISTS idx_flight_prices_date_trip_class 
ON flight_prices(departure_date, trip_type, travel_class);
