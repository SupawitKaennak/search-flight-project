import { pool } from '../config/database';
import { FlightModel } from '../models/Flight';
import { parseISO } from 'date-fns';

async function verify() {
    try {
        const date = '2026-04-18';
        const airportCode = 'BKK';
        const isDeparture = false;
        const selectedDate = parseISO(`${date}T00:00:00.000Z`);

        const startDate = new Date(selectedDate);
        startDate.setUTCDate(1);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setUTCMonth(endDate.getUTCMonth() + 1);
        endDate.setUTCDate(0);
        endDate.setUTCHours(23, 59, 59, 999);

        console.log(`Verifying fix for ${date} (BKK Arrivals)...`);

        const analysis = await FlightModel.getIntlFlightAnalysis(
            airportCode,
            isDeparture,
            startDate,
            endDate,
            selectedDate
        );

        console.log('\n📊 Analysis Result:');
        console.log('Total Flights (Summary):', analysis.summary.totalFlights);
        console.log('Routes List Length:', analysis.routes.length);

        if (analysis.summary.totalFlights === 43 && analysis.routes.length === 43) {
            console.log('\n✅ SUCCESS: Counts are consistent and match expected total (43)');
        } else {
            console.log(`\n❌ FAILURE: Inconsistency or unexpected count. Total: ${analysis.summary.totalFlights}, Routes: ${analysis.routes.length}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

verify();
