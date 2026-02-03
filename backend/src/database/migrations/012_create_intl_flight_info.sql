-- Migration 012: Create intl_flight_info table
-- This table stores international flight information separated from domestic flight prices

CREATE TABLE IF NOT EXISTS intl_flight_info (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    airline_id INTEGER NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
    departure_date DATE NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    flight_number VARCHAR(20) NOT NULL,
    trip_type VARCHAR(20) NOT NULL,
    travel_class VARCHAR(20) DEFAULT 'economy',
    stops INTEGER DEFAULT 0,
    dep_airport VARCHAR(10),
    arr_airport VARCHAR(10),
    destination VARCHAR(100),
    airline_name VARCHAR(100),
    airline_code VARCHAR(10),
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(route_id, airline_id, departure_date, trip_type, flight_number, departure_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intl_flight_info_route_id ON intl_flight_info(route_id);
CREATE INDEX IF NOT EXISTS idx_intl_flight_info_airline_id ON intl_flight_info(airline_id);
CREATE INDEX IF NOT EXISTS idx_intl_flight_info_departure_date ON intl_flight_info(departure_date);
CREATE INDEX IF NOT EXISTS idx_intl_flight_info_dep_arr ON intl_flight_info(dep_airport, arr_airport);

-- Add comments
COMMENT ON TABLE intl_flight_info IS 'Stores international flight information from various sources';
COMMENT ON COLUMN intl_flight_info.duration IS 'Duration of flight in minutes';
COMMENT ON COLUMN intl_flight_info.dep_airport IS 'Departure airport code (e.g. BKK)';
COMMENT ON COLUMN intl_flight_info.arr_airport IS 'Arrival airport code (e.g. NRT)';
