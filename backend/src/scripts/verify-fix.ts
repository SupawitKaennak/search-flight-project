import { pool } from '../config/database';
import { FlightModel } from '../models/Flight';
import { parseISO } from 'date-fns';

async function verify() {
    try {
        console.log('🚀 Verifying fix for Feb 8, 2026 (BKK Arrivals)...');

        const airportCode = 'BKK';
        const isDeparture = false;
        const selectedDate = parseISO('2026-02-08T00:00:00.000Z');

        const startDate = new Date(selectedDate);
        startDate.setUTCDate(1);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setUTCMonth(endDate.getUTCMonth() + 1);
        endDate.setUTCDate(0);
        endDate.setUTCHours(23, 59, 59, 999);

        console.log(`Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        console.log(`Selected Date: ${selectedDate.toISOString()}`);

        const analysis = await FlightModel.getIntlFlightAnalysis(
            airportCode,
            isDeparture,
            startDate,
            endDate,
            selectedDate
        );

        console.log('\n📊 Analysis Result:');
        console.log('Total Flights (Day):', analysis.summary.totalFlights);
        console.log('Unique Routes (Day):', analysis.routes.length);
        console.log('Avg Flights/Day (Month):', analysis.summary.avgFlightsPerDay);
        console.log('Peak Hour Range:', analysis.summary.peakHourRange);

        if (analysis.summary.totalFlights === 38) {
            console.log('\n✅ SUCCESS: Total flights matches DB count (38)');
        } else {
            console.log(`\n❌ FAILURE: Total flights (${analysis.summary.totalFlights}) does not match DB count (38)`);
        }

        if (analysis.routes.length === 38) {
            console.log('✅ SUCCESS: Unique routes matches expected daily count (38)');
        } else {
            console.log(`❌ FAILURE: Unique routes (${analysis.routes.length}) does not match expected daily count (38)`);
        }

    } catch (error: any) {
        console.error('❌ Verification failed:', error.message);
    } finally {
        await pool.end();
    }
}

verify();
