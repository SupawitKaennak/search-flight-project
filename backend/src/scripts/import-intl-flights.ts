/**
 * Script to import international flight data from FlightsFrom.com CSV format
 * 
 * Usage:
 *   npm run import-intl-flights
 *   npm run import-intl-flights -- --dir="./data/intl_flight_data"
 *   npm run import-intl-flights -- --file="./backend/data/intl_flight_data/flightsfrom_BKK_2026-01-31.csv"
 */

import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';
import { FlightModel } from '../models/Flight';
import { pool } from '../config/database';

// Load environment variables
const envPaths = [
    path.join(__dirname, '../../.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend/.env'),
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        break;
    }
}

/**
 * Parse CSV line (handles quoted values)
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, ''));
}

/**
 * Extract airline code from flight number (e.g., "TG483" -> "TG")
 */
function extractAirlineCodeFromFlight(flight: string): string {
    if (!flight) return '';
    // Check for leading letters (most common for airline codes like TG, VZ, FD)
    const match = flight.match(/^([A-Z]{2,3})/);
    if (match) {
        return match[1];
    }
    // Fallback for codes that might have numbers (less common but possible)
    const alphaNumericMatch = flight.match(/^([A-Z0-9]{2})/);
    return alphaNumericMatch ? alphaNumericMatch[1] : '';
}

/**
 * Convert duration string (e.g., "6h 54m", "10h 0m", "1h 20m") to total minutes
 */
function parseDurationToMinutes(durationStr: string): number {
    if (!durationStr) return 0;

    let totalMinutes = 0;

    const hMatch = durationStr.match(/(\d+)h/);
    if (hMatch) {
        totalMinutes += parseInt(hMatch[1], 10) * 60;
    }

    const mMatch = durationStr.match(/(\d+)m/);
    if (mMatch) {
        totalMinutes += parseInt(mMatch[1], 10);
    }

    return totalMinutes;
}

/**
 * Calculate arrival time based on departure date, time, and duration
 */
function calculateArrivalTime(dateStr: string, timeStr: string, durationMinutes: number): string {
    // Construct UTC date-time
    // timeStr format: HH:MM or H:MM
    let [hours, minutes] = timeStr.split(':');

    // Pad hours with leading zero if necessary
    if (hours.length === 1) {
        hours = '0' + hours;
    }

    const departure = new Date(`${dateStr}T${hours}:${minutes}:00Z`);
    if (isNaN(departure.getTime())) return '';

    const arrival = new Date(departure.getTime() + durationMinutes * 60000);
    return arrival.toISOString();
}

/**
 * Map Thai airline names to English names
 */
function getAirlineInfo(airlineName: string, airlineCode: string): { name: string; nameTh: string } {
    // This is a simplified map, can be expanded
    const airlineMap: Record<string, { name: string; nameTh: string }> = {
        'TG': { name: 'Thai Airways', nameTh: 'การบินไทย' },
        'PG': { name: 'Bangkok Airways', nameTh: 'บางกอกแอร์เวย์' },
        'FD': { name: 'Thai AirAsia', nameTh: 'ไทยแอร์เอเชีย' },
        'VZ': { name: 'Thai Vietjet Air', nameTh: 'ไทยเวียดเจ็ทแอร์' },
        'DD': { name: 'Nok Air', nameTh: 'นกแอร์' },
        'SL': { name: 'Thai Lion Air', nameTh: 'ไทยไลอ้อนแอร์' },
        'EK': { name: 'Emirates', nameTh: 'เอมิเรตส์' },
        'CX': { name: 'Cathay Pacific', nameTh: 'คาเธ่ย์ แปซิฟิค' },
        'QR': { name: 'Qatar Airways', nameTh: 'กาตาร์ แอร์เวย์' },
        'SQ': { name: 'Singapore Airlines', nameTh: 'สิงคโปร์แอร์ไลน์' },
    };

    if (airlineMap[airlineCode]) {
        return airlineMap[airlineCode];
    }

    return {
        name: airlineName || airlineCode,
        nameTh: airlineName || airlineCode,
    };
}

/**
 * Import flight data from a single CSV file (FlightsFrom.com format)
 */
async function importIntlCSVFile(csvFilePath: string): Promise<{
    processed: number;
    stored: number;
    skipped: number;
    errors: number;
}> {
    console.log(`\n📄 Processing International Data: ${path.basename(csvFilePath)}`);

    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ CSV file not found: ${csvFilePath}`);
        return { processed: 0, stored: 0, skipped: 0, errors: 1 };
    }

    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length <= 1) {
        console.warn(`⚠️  CSV file is empty or has no data rows`);
        return { processed: 0, stored: 0, skipped: 0, errors: 0 };
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    // Expected headers: date,airport,direction,time,destination,flight,airline,duration,raw_text,scraped_at
    const expectedHeaders = ['date', 'airport', 'direction', 'time', 'destination', 'flight', 'duration'];

    // Validate headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        console.error(`❌ Missing required headers in international CSV: ${missingHeaders.join(', ')}`);
        console.error(`   Found headers: ${headers.join(', ')}`);
        return { processed: 0, stored: 0, skipped: 0, errors: 1 };
    }

    let totalProcessed = 0;
    let totalStored = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    const routeCache = new Map<string, any>();
    const airlineCache = new Map<string, any>();

    const BATCH_SIZE = 500;
    const batch: any[] = [];

    console.log(`   📊 Processing ${lines.length - 1} rows...`);

    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((h, idx) => row[h] = values[idx]);

            if (!row.flight || !row.time || !row.date || !row.destination) {
                totalSkipped++;
                continue;
            }

            // Extract other airport code (e.g., "PER Perth" -> "PER")
            const otherAirportMatch = row.destination.match(/^([A-Z0-9]{3})/);
            const otherAirport = otherAirportMatch ? otherAirportMatch[1] : '';
            if (!otherAirport) {
                totalSkipped++;
                continue;
            }

            const csvAirport = row.airport.trim().toUpperCase(); // e.g., BKK
            const direction = row.direction.toLowerCase();

            if (otherAirport === csvAirport) {
                totalSkipped++;
                continue;
            }
            const durationMinutes = parseDurationToMinutes(row.duration);

            let originCode, destinationCode, departureTimeUTC, arrivalTimeUTC, displayDestination;

            if (direction === 'arrival') {
                // Flight arriving at csvAirport (BKK) from otherAirport (PER)
                originCode = otherAirport;
                destinationCode = csvAirport;
                // For arrivals, the CSV time is the arrival time
                // timeStr format: HH:MM or H:MM
                let [hours, minutes] = row.time.split(':');
                if (hours.length === 1) hours = '0' + hours;

                arrivalTimeUTC = `${row.date}T${hours}:${minutes}:00Z`;
                const arrivalDate = new Date(arrivalTimeUTC);
                const departureDate = new Date(arrivalDate.getTime() - durationMinutes * 60000);
                departureTimeUTC = departureDate.toISOString();
                displayDestination = 'Bangkok (BKK)'; // Since they are arriving at BKK
            } else {
                // Flight departing from csvAirport (BKK) to otherAirport (PER)
                originCode = csvAirport;
                destinationCode = otherAirport;
                // For departures, the CSV time is the departure time
                // timeStr format: HH:MM or H:MM
                let [hours, minutes] = row.time.split(':');
                if (hours.length === 1) hours = '0' + hours;

                departureTimeUTC = `${row.date}T${hours}:${minutes}:00Z`;
                arrivalTimeUTC = calculateArrivalTime(row.date, row.time, durationMinutes);
                displayDestination = row.destination; // Keeps "PER Perth"
            }

            const routeKey = `${originCode}-${destinationCode}`;

            // Get or create route
            let route = routeCache.get(routeKey);
            if (!route) {
                route = await FlightModel.getOrCreateRoute(originCode, destinationCode, 0, 0);
                routeCache.set(routeKey, route);
            }

            // Extract airline code
            const airlineCode = extractAirlineCodeFromFlight(row.flight);
            if (!airlineCode) {
                totalSkipped++;
                continue;
            }

            // Get or create airline
            let airline = airlineCache.get(airlineCode);
            if (!airline) {
                const airlineInfo = getAirlineInfo(row.airline, airlineCode);
                airline = await FlightModel.getOrCreateAirline(airlineCode, airlineInfo.name, airlineInfo.nameTh);
                airlineCache.set(airlineCode, airline);
            }

            const departureDateObj = new Date(departureTimeUTC);
            departureDateObj.setUTCHours(0, 0, 0, 0);

            batch.push({
                route_id: route.id,
                airline_id: airline.id,
                departure_date: departureDateObj,
                departure_time: departureTimeUTC,
                arrival_time: arrivalTimeUTC,
                duration: durationMinutes,
                flight_number: row.flight,
                trip_type: 'one-way',
                travel_class: 'economy',
                source: 'flightsfrom.com',
                dep_airport: originCode,
                arr_airport: destinationCode,
                destination: displayDestination,
                airline_name: airline.name,
                airline_code: airlineCode,
                stops: 0
            });

            totalProcessed++;

            if (batch.length >= BATCH_SIZE) {
                // Deduplicate within the batch to avoid "affect row a second time" error
                // Unique key: route_id, airline_id, departure_date, trip_type, flight_number, departure_time
                const uniqueMap = new Map();
                for (const record of batch) {
                    const departureDateStr = record.departure_date.toISOString().split('T')[0];
                    const key = `${record.route_id}_${record.airline_id}_${departureDateStr}_${record.trip_type}_${record.flight_number}_${record.departure_time}`;
                    uniqueMap.set(key, record);
                }
                const deduplicatedBatch = Array.from(uniqueMap.values());

                await FlightModel.batchInsertFlightPaths(deduplicatedBatch);
                totalStored += deduplicatedBatch.length;
                batch.length = 0;
            }
        } catch (error: any) {
            totalErrors++;
            console.error(`   ❌ Error processing row ${i + 1}:`, error.message);
        }
    }

    if (batch.length > 0) {
        const uniqueMap = new Map();
        for (const record of batch) {
            const departureDateStr = record.departure_date.toISOString().split('T')[0];
            const key = `${record.route_id}_${record.airline_id}_${departureDateStr}_${record.trip_type}_${record.flight_number}_${record.departure_time}`;
            uniqueMap.set(key, record);
        }
        const deduplicatedBatch = Array.from(uniqueMap.values());
        await FlightModel.batchInsertFlightPaths(deduplicatedBatch);
        totalStored += deduplicatedBatch.length;
    }

    console.log(`   ✅ Completed: ${totalStored} stored, ${totalSkipped} skipped, ${totalErrors} errors`);
    return { processed: totalProcessed, stored: totalStored, skipped: totalSkipped, errors: totalErrors };
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    // Default directory logic: check both ./data/intl_flight_data and ./backend/data/intl_flight_data
    let defaultDir = './data/intl_flight_data';
    if (!fs.existsSync(path.join(process.cwd(), defaultDir)) && fs.existsSync(path.join(process.cwd(), './backend/data/intl_flight_data'))) {
        defaultDir = './backend/data/intl_flight_data';
    }

    const csvDir = args.find(arg => arg.startsWith('--dir='))?.split('=')[1] || defaultDir;
    const csvFile = args.find(arg => arg.startsWith('--file='))?.split('=')[1];

    console.log('\n' + '='.repeat(80));
    console.log('✈️  International Flight Data CSV Importer (FlightsFrom.com)');
    console.log('='.repeat(80));

    let csvFiles: string[] = [];

    if (csvFile) {
        const fullPath = path.isAbsolute(csvFile) ? csvFile : path.join(process.cwd(), csvFile);
        csvFiles = [fullPath];
    } else {
        const fullDir = path.isAbsolute(csvDir) ? csvDir : path.join(process.cwd(), csvDir);
        if (fs.existsSync(fullDir)) {
            const files = fs.readdirSync(fullDir);
            csvFiles = files.filter(f => f.endsWith('.csv')).map(f => path.join(fullDir, f));
        }
    }

    if (csvFiles.length === 0) {
        console.error(`❌ No CSV files found.`);
        process.exit(1);
    }

    let totalStored = 0;
    try {
        for (const file of csvFiles) {
            const result = await importIntlCSVFile(file);
            totalStored += result.stored;
        }
        console.log(`\n🎉 Total successfully stored: ${totalStored}`);
    } catch (error: any) {
        console.error(`❌ Fatal Error:`, error.message);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    main();
}
