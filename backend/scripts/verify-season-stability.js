/**
 * Verification script for seasonal stability
 * This script imports the FlightAnalysisService and simulates selecting different months
 * to ensure that the seasonal breakdown remains consistent.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { FlightAnalysisService } = require('../dist/services/flightAnalysisService');
const { pool } = require('../dist/config/database');

async function verifyStability() {
    const service = new FlightAnalysisService();
    const baseParams = {
        origin: 'BKK',
        destination: 'KKC',
        durationRange: { min: 3, max: 7 },
        selectedAirlines: [],
        tripType: 'one-way',
        passengerCount: 1,
        passengers: { adults: 1, children: 0, infants: 0 },
        travelClass: 'economy',
        stops: 'all',
    };

    const testDates = ['2026-01-15', '2026-02-15', '2026-03-15'];
    const results = [];

    console.log('🚀 Starting Seasonal Stability Verification...\n');

    for (const date of testDates) {
        console.log(`📡 Analyzing for selected date: ${date}`);
        try {
            const result = await service.analyzeFlightPrices({
                ...baseParams,
                startDate: date,
            });

            const seasons = result.seasons.map(s => ({
                type: s.type,
                months: s.months.sort()
            }));

            results.push({ date, seasons });
            console.log(`   ✅ Analysis completed. Seasons found: ${result.seasons.map(s => `${s.type}: [${s.months.join(', ')}]`).join(' | ')}`);
        } catch (error) {
            console.error(`   ❌ Error for ${date}:`, error.message);
        }
    }

    console.log('\n📊 Stability Comparison:');
    console.log('='.repeat(80));

    let isStable = true;
    for (let i = 1; i < results.length; i++) {
        const prevSeasons = JSON.stringify(results[i - 1].seasons);
        const currSeasons = JSON.stringify(results[i].seasons);

        if (prevSeasons !== currSeasons) {
            console.log(`❌ INCONSISTENCY DETECTED between ${results[i - 1].date} and ${results[i].date}`);
            isStable = false;
        } else {
            console.log(`✅ Stable between ${results[i - 1].date} and ${results[i].date}`);
        }
    }

    if (isStable) {
        console.log('\n✨ SUCCESS: Seasonal classification is now stable across all tested months!');
    } else {
        console.log('\n⚠️ FAILURE: Seasonal classification is still inconsistent.');
    }

    await pool.end();
}

if (require.main === module) {
    verifyStability().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
