-- Migration 013: Rename intl_flight_info to flight_paths

-- Rename the table
ALTER TABLE intl_flight_info RENAME TO flight_paths;

-- Rename indexes for consistency
ALTER INDEX idx_intl_flight_info_route_id RENAME TO idx_flight_paths_route_id;
ALTER INDEX idx_intl_flight_info_airline_id RENAME TO idx_flight_paths_airline_id;
ALTER INDEX idx_intl_flight_info_departure_date RENAME TO idx_flight_paths_departure_date;
ALTER INDEX idx_intl_flight_info_dep_arr RENAME TO idx_flight_paths_dep_arr;

-- Update comments
COMMENT ON TABLE flight_paths IS 'Stores international flight information from various sources';
COMMENT ON COLUMN flight_paths.duration IS 'Duration of flight in minutes';
COMMENT ON COLUMN flight_paths.dep_airport IS 'Departure airport code (e.g. BKK)';
COMMENT ON COLUMN flight_paths.arr_airport IS 'Arrival airport code (e.g. NRT)';
