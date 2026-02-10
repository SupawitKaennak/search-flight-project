import { pool } from '../config/database';

async function verify() {
    try {
        const intlCount = await pool.query("SELECT count(*) FROM flight_paths");
        const priceCount = await pool.query("SELECT count(*) FROM flight_prices WHERE source = 'flightsfrom.com'");

        console.log(`✅ flight_paths count: ${intlCount.rows[0].count}`);
        console.log(`✅ flight_prices (flightsfrom.com) count: ${priceCount.rows[0].count}`);
    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await pool.end();
    }
}

verify();
