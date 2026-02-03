import { pool } from '../config/database';

async function checkDuplicates() {
    try {
        const date = '2026-04-18';
        const airport = 'BKK';

        console.log(`Checking for duplicates on ${date} for ${airport} arrivals...`);

        const duplicatesQuery = `
            SELECT dep_airport, arr_airport, airline_code, flight_number, COUNT(*)
            FROM flight_paths
            WHERE departure_date = $1 AND arr_airport = $2
            GROUP BY dep_airport, arr_airport, airline_code, flight_number
            HAVING COUNT(*) > 1
        `;

        const result = await pool.query(duplicatesQuery, [date, airport]);
        console.log('Duplicates found:', result.rows);

        if (result.rows.length > 0) {
            const firstDup = result.rows[0];
            const detailsQuery = `
                SELECT * FROM flight_paths
                WHERE departure_date = $1 
                  AND dep_airport = $2 
                  AND arr_airport = $3 
                  AND airline_code = $4 
                  AND flight_number = $5
            `;
            const details = await pool.query(detailsQuery, [
                date,
                firstDup.dep_airport,
                firstDup.arr_airport,
                firstDup.airline_code,
                firstDup.flight_number
            ]);
            console.log('Details for duplicate:', details.rows);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkDuplicates();
