const fs = require('fs');
const path = require('path');

function findDuplicates(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    // Parse header and clean up BOM if present
    const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().toLowerCase());

    // date,origin_group,dep_airport,arr_airport,destination,airline,airline_code,dep_time,arr_time,duration,stops,price_value,price_text,scraped_at,source
    const dateIdx = headers.indexOf('date');
    const airCodeIdx = headers.indexOf('airline_code');
    const depTimeIdx = headers.indexOf('dep_time');
    const depAirIdx = headers.indexOf('dep_airport');
    const arrAirIdx = headers.indexOf('arr_airport');
    const priceIdx = headers.indexOf('price_value');

    const flightMap = new Map();
    const duplicates = [];

    console.log(`Analyzing indices: date=${dateIdx}, airline_code=${airCodeIdx}, dep_time=${depTimeIdx}, dep_airport=${depAirIdx}, arr_airport=${arrAirIdx}, price_value=${priceIdx}`);

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Proper CSV split to handle quotes
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else current += char;
        }
        values.push(current.trim());

        if (values.length < headers.length) {
            console.warn(`Skipping line ${i + 1} due to insufficient columns. Expected ${headers.length}, got ${values.length}. Line: "${line.substring(0, 100)}..."`);
            continue;
        }

        // Log sample parsing for the first few lines to debug
        if (i < 5) {
            console.log(`Line ${i + 1} values: ${values.slice(0, 5).join(', ')}...`);
            console.log(`  Key parts: date=${values[dateIdx]}, airline_code=${values[airCodeIdx]}, dep_time=${values[depTimeIdx]}, dep_airport=${values[depAirIdx]}, arr_airport=${values[arrAirIdx]}`);
        }

        const key = `${values[dateIdx]}|${values[airCodeIdx]}|${values[depTimeIdx]}|${values[depAirIdx]}|${values[arrAirIdx]}`;
        const lineNum = i + 1;
        const price = values[priceIdx];

        if (flightMap.has(key)) {
            const firstMention = flightMap.get(key);
            duplicates.push({
                key,
                original: firstMention,
                duplicate: { lineNum, price }
            });
        } else {
            flightMap.set(key, { lineNum, price });
        }
    }
    return duplicates;
}

const files = process.argv.slice(2).map(f => path.resolve(process.cwd(), f));

if (files.length === 0) {
    // Default files if none provided
    files.push(
        '/Users/minthutanaing/trinityproject/28/search-flight-project/backend/data/airpaz_flight_data/airpaz_BKKA_to_TST_tabs.csv',
        '/Users/minthutanaing/trinityproject/28/search-flight-project/backend/data/airpaz_flight_data/airpaz_BKKA_to_USM_tabs.csv'
    );
}

files.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`\n❌ File not found: ${file}`);
        return;
    }
    console.log(`\nResults for ${path.basename(file)}:`);
    const dupes = findDuplicates(file);
    if (dupes.length === 0) {
        console.log('✅ No duplicates found.');
    } else {
        dupes.forEach(d => {
            console.log(`- Duplicate found: Flight on ${d.key.split('|')[0]} at ${d.key.split('|')[2]} (${d.key.split('|')[1]})`);
            console.log(`  Row ${d.original.lineNum}: ฿${d.original.price}`);
            console.log(`  Row ${d.duplicate.lineNum}: ฿${d.duplicate.price}`);
        });
        console.log(`Total duplicates: ${dupes.length}`);
    }
});
