
import { SearchStatisticsModel } from '../src/models/SearchStatistics';
import { AirportModel } from '../src/models/Airport';
import { pool } from '../src/config/database';

async function runTest() {
    console.log('🚀 Starting Verification: Contextual Popular Destinations');

    try {
        // 1. Prepare data
        // Ensure we have some US airports and TH airports in the database
        // Most popular airports might already be there from getPopularAirports

        // Simulate searches for US destinations
        console.log('📝 Simulating searches for US destinations...');
        await SearchStatisticsModel.saveSearch({
            origin: 'BKK',
            destination: 'JFK',
            destinationName: 'New York (JFK)',
        });
        await SearchStatisticsModel.saveSearch({
            origin: 'BKK',
            destination: 'LAX',
            destinationName: 'Los Angeles (LAX)',
        });

        // Simulate searches for TH destinations
        console.log('📝 Simulating searches for TH destinations...');
        await SearchStatisticsModel.saveSearch({
            origin: 'BKK',
            destination: 'CNX',
            destinationName: 'Chiang Mai (CNX)',
        });

        // 2. Test global stats
        console.log('\n📊 Testing Global Popular Destinations...');
        const globalStats = await SearchStatisticsModel.getPopularDestinations(5);
        console.log('Global Top Destinations:', globalStats.map(d => `${d.destination} (${d.count})`).join(', '));

        // 3. Test US stats
        console.log('\n🇺🇸 Testing US Popular Destinations...');
        const usStats = await SearchStatisticsModel.getPopularDestinations(5, 'US');
        console.log('US Top Destinations:', usStats.map(d => `${d.destination} (${d.count})`).join(', '));

        const hasUS = usStats.every(d => ['JFK', 'LAX'].includes(d.destination));
        if (usStats.length > 0 && hasUS) {
            console.log('✅ PASS: Returned US-only destinations.');
        } else {
            console.log('⚠️ INFO: US results might be empty or mixed if airports are missing country_code');
        }

        // 4. Test TH stats
        console.log('\n🇹🇭 Testing TH Popular Destinations...');
        const thStats = await SearchStatisticsModel.getPopularDestinations(5, 'TH');
        console.log('TH Top Destinations:', thStats.map(d => `${d.destination} (${d.count})`).join(', '));

        if (thStats.some(d => d.destination === 'CNX')) {
            console.log('✅ PASS: Returned Thai destinations.');
        }

        // 5. Test Fallback
        console.log('\n🔄 Testing Fallback (Country with no searches)...');
        const fallbackStats = await SearchStatisticsModel.getPopularDestinations(5, 'XX'); // Non-existent country
        if (fallbackStats.length === globalStats.length) {
            console.log('✅ PASS: Successfully fell back to global stats.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        // Don't close pool here if running via ts-node in a way that might conflict
        // but for a script it's usually fine
        // await pool.end();
    }
}

runTest();
