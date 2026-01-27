/**
 * Script to import Airport data from CSV file
 * 
 * Usage:
 *   npx tsx src/scripts/import-airports.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';
import { AirportModel, AirportInput } from '../models/Airport';
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
 * Import Airport CSV file
 */
async function importAirportsCSV(csvFilePath: string): Promise<{
    processed: number;
    errors: number;
}> {
    console.log(`\n📄 Processing: ${path.basename(csvFilePath)}`);

    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ CSV file not found: ${csvFilePath}`);
        return { processed: 0, errors: 1 };
    }

    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length <= 1) {
        console.warn(`⚠️  CSV file is empty or has no data rows`);
        return { processed: 0, errors: 0 };
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    // Expected: iata_code,airport_name,city,country_code,country_name,airport_type,coordinates

    let processed = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            const code = row.iata_code || '';
            if (!code || code.length !== 3) {
                // Skip if no IATA code or invalid
                continue;
            }

            // Parse coordinates: "24.261699676513672, 55.60919952392578"
            let latitude: number | null = null;
            let longitude: number | null = null;
            if (row.coordinates) {
                const coords = row.coordinates.split(',').map((c: string) => parseFloat(c.trim()));
                if (coords.length === 2) {
                    latitude = coords[0];
                    longitude = coords[1];
                }
            }

            const airportData: AirportInput = {
                code: code.toUpperCase(),
                name: row.airport_name,
                city: row.city || null,
                country: row.country_code || null, // Keeping legacy country column as country_code
                country_code: row.country_code,
                country_name: row.country_name,
                airport_type: row.airport_type,
                latitude,
                longitude
            };

            await AirportModel.upsertAirport(airportData);
            processed++;

            if (processed % 100 === 0) {
                process.stdout.write(`.`);
            }

        } catch (err: any) {
            console.error(`\n❌ Error processing line ${i + 1}: ${err.message}`);
            errors++;
        }
    }

    console.log(`\n✅ Completed: ${processed} processed, ${errors} errors`);
    return { processed, errors };
}

/**
 * Main
 */
async function main() {
    const defaultPath = './data/flightsfrom_airport_codes_cleaned.csv';
    const csvFilePath = path.isAbsolute(defaultPath) ? defaultPath : path.join(process.cwd(), defaultPath);

    console.log('='.repeat(50));
    console.log(`✈️  Airport Data Importer`);
    console.log(`📂 File: ${csvFilePath}`);
    console.log('='.repeat(50));

    try {
        await importAirportsCSV(csvFilePath);
    } catch (err: any) {
        console.error(`❌ Fatal error: ${err.message}`);
    } finally {
        await pool.end();
    }

    console.log('\n✅ Import finished.');
}

// Run
if (require.main === module) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
