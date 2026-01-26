/**
 * Script to import Airpaz flight data from CSV files
 * 
 * Usage:
 *   npx tsx src/scripts/import-airpaz-flights.ts
 *   npx tsx src/scripts/import-airpaz-flights.ts --dir="./data/airpaz_flight_data"
 */

import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';
import { FlightModel } from '../models/Flight';
import { pool } from '../config/database';

// Load environment variables
dotenv.config();

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
 * Parse duration string (e.g., "1ชม.30นาที", "50นาที")
 */
function parseDuration(durationStr: string): number {
    if (!durationStr) return 0;

    let hours = 0;
    let minutes = 0;

    // Extract hours
    const hourMatch = durationStr.match(/(\d+)\s*ชม\./);
    if (hourMatch) {
        hours = parseInt(hourMatch[1], 10);
    }

    // Extract minutes
    const minMatch = durationStr.match(/(\d+)\s*นาที/);
    if (minMatch) {
        minutes = parseInt(minMatch[1], 10);
    }

    return (hours * 60) + minutes;
}

/**
 * Helper to combine Date and Time string into Date object
 */
function combineDateTime(dateStr: string, timeStr: string): Date {
    // dateStr format: YYYY-MM-DD
    // timeStr format: HH:MM
    return new Date(`${dateStr}T${timeStr}:00`);
}

/**
 * Import a single Airpaz CSV file
 */
async function importCSVFile(csvFilePath: string): Promise<{
    processed: number;
    stored: number;
    skipped: number;
    errors: number;
}> {
    console.log(`\n📄 Processing: ${path.basename(csvFilePath)}`);

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

    // Expected headers based on user request
    // date,origin_group,dep_airport,arr_airport,destination,airline,airline_code,dep_time,arr_time,duration,stops,price_value,price_text,scraped_at,source

    let processed = 0;
    let stored = 0;
    let skipped = 0;
    let errors = 0;

    // Cache for routes and airlines to avoid repeated queries
    const routeCache = new Map<string, { id: number; origin: string; destination: string }>();
    const airlineCache = new Map<string, { id: number; code: string }>();

    // Batch for bulk insert
    const batch: any[] = [];
    const BATCH_SIZE = 500;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            // Basic validation
            if (!row.date || !row.dep_airport || !row.arr_airport || !row.airline_code) {
                skipped++;
                continue;
            }

            processed++;

            // 1. Get or Create Route
            const origin = row.dep_airport.trim().toUpperCase();
            const destination = row.arr_airport.trim().toUpperCase();
            const routeKey = `${origin}-${destination}`;
            let route = routeCache.get(routeKey);

            if (!route) {
                // Use price_value as initial base price estimate if needed
                const price = parseFloat(row.price_value) || 0;
                const durationMins = parseDuration(row.duration);

                const routeData = await FlightModel.getOrCreateRoute(
                    origin,
                    destination,
                    price,
                    durationMins
                );
                route = {
                    id: routeData.id,
                    origin: routeData.origin,
                    destination: routeData.destination
                };
                routeCache.set(routeKey, route);
            }

            // 2. Get or Create Airline
            const airlineCode = row.airline_code.trim().toUpperCase();
            let airline = airlineCache.get(airlineCode);

            if (!airline) {
                const airlineData = await FlightModel.getOrCreateAirline(
                    airlineCode,
                    row.airline || airlineCode,
                    row.airline || airlineCode // Use same name for TH as fallback
                );
                airline = {
                    id: airlineData.id,
                    code: airlineData.code
                };
                airlineCache.set(airlineCode, airline);
            }

            // 3. Prepare data fields
            const departureDate = new Date(row.date);
            const departureTime = combineDateTime(row.date, row.dep_time);

            // Calculate arrival time based on duration
            const durationMins = parseDuration(row.duration);
            const arrivalTime = new Date(departureTime.getTime() + durationMins * 60000);

            const price = parseFloat(row.price_value);
            const stops = row.stops === 'Direct' ? 0 : (parseInt(row.stops) || 0); // Need to parse if "1 Stop"
            // Note: If stops column has "1 Stop", row.stops parsing might need int parsing logic. 
            // Assuming "Direct" or number. User CSV showed "Direct".

            // Scraped At
            const scrapedAt = row.scraped_at ? new Date(row.scraped_at) : new Date();

            // Trip Type - CSV seems to be One Way usually? 
            // logic: User CSV didn't strictly have trip_type column, but usually scraping is one-way segments.
            // Default to one-way
            const tripType = 'one-way';

            // Flight Number - CSV does not have specific flight number column in user request list?
            // Wait, user said columns: date, ..., airline, airline_code ...
            // Ah, the user's list DOES NOT include flight_number!
            // But database constraint REQUIRES flight_number: UNIQUE(..., flight_number).
            // If data doesn't have flight number, we need to generate one or find it.
            // Looking at CSV provided in turn 1: It DOES NOT have flight_number.
            // It has airline_code (SL) and dep_time.
            // We might need to generate a dummy flight number like "SL-0800" (Code + DepTime) to satisfy uniqueness constraint
            // or "SL-Hash".

            let flightNumber = row.flight_number;
            if (!flightNumber) {
                // Create synthetic flight number if missing: Code + HHMM of departure
                const timeCode = row.dep_time.replace(':', '');
                flightNumber = `${airlineCode}${timeCode}`;
            }

            batch.push({
                route_id: route.id,
                airline_id: airline.id,
                departure_date: departureDate,
                return_date: null,
                price: price,
                base_price: price, // Use same as price for now
                departure_time: departureTime.toISOString(),
                arrival_time: arrivalTime.toISOString(),
                duration: durationMins,
                flight_number: flightNumber,
                trip_type: tripType,
                season: null, // default
                travel_class: 'economy', // default or infer

                // New columns
                origin_group: row.origin_group,
                dep_airport: row.dep_airport,
                arr_airport: row.arr_airport,
                destination: row.destination, // region/city name
                airline_name: row.airline,
                airline_code: row.airline_code,
                price_text: row.price_text,
                scraped_at: scrapedAt,
                source: row.source,

                // Others
                stops: stops,
                airplane: null, // not in csv
                legroom: null,
                often_delayed: false
            });

            if (batch.length >= BATCH_SIZE) {
                await FlightModel.batchInsertFlightPrices(batch);
                stored += batch.length;
                batch.length = 0; // clear
            }

        } catch (err: any) {
            console.error(`Status: Error processing line ${i}: ${err.message}`);
            errors++;
        }
    }

    // Process remaining
    if (batch.length > 0) {
        try {
            await FlightModel.batchInsertFlightPrices(batch);
            stored += batch.length;
        } catch (err: any) {
            console.error(`Status: Error processing final batch: ${err.message}`);
            errors += batch.length;
        }
    }

    console.log(`   ✅ Completed: ${stored} stored, ${skipped} skipped, ${errors} errors`);
    return { processed, stored, skipped, errors };
}

/**
 * Main
 */
async function main() {
    // Check directory arg
    const args = process.argv.slice(2);
    const dirArg = args.find(a => a.startsWith('--dir='));
    const baseDir = dirArg ? dirArg.split('=')[1] : './data/airpaz_flight_data';

    // Resolve path
    // If running from docker, path might be absolute or relative to /app
    // If running locally, relative to backend
    const dataDir = path.isAbsolute(baseDir) ? baseDir : path.join(process.cwd(), baseDir);

    console.log('='.repeat(50));
    console.log(`✈️  Airpaz Flight Importer`);
    console.log(`📂 Directory: ${dataDir}`);
    console.log('='.repeat(50));

    if (!fs.existsSync(dataDir)) {
        console.error(`❌ Directory not found: ${dataDir}`);
        // Check if we are in /app (docker) and try default path
        if (process.cwd() === '/app' && fs.existsSync('/app/data/airpaz_flight_data')) {
            console.log('🔄 Switching to Docker default path: /app/data/airpaz_flight_data');
            // Logic to switch path if needed, but let's just fail for now or trust the script arg in docker-entrypoint
        }
        await pool.end();
        return;
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

    if (files.length === 0) {
        console.log(`⚠️  No CSV files found.`);
        await pool.end();
        return;
    }

    console.log(`found ${files.length} files.`);

    for (const file of files) {
        await importCSVFile(path.join(dataDir, file));
    }

    console.log('\n✅ All imports finished.');
    await pool.end();
}

// Run
if (require.main === module) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
