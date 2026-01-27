import { pool } from '../config/database';

export interface Airport {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
  country_code: string | null;
  country_name: string | null;
  airport_type: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface AirportInput {
  code: string;
  name: string;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  airport_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export class AirportModel {
  /**
   * Get or create an airport
   */
  static async upsertAirport(input: AirportInput): Promise<Airport> {
    const query = `
      INSERT INTO airports (
        code, name, city, country, country_code, country_name, airport_type, 
        latitude, longitude, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        country_code = EXCLUDED.country_code,
        country_name = EXCLUDED.country_name,
        airport_type = EXCLUDED.airport_type,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [
      input.code,
      input.name,
      input.city || null,
      input.country || null,
      input.country_code || null,
      input.country_name || null,
      input.airport_type || null,
      input.latitude || null,
      input.longitude || null,
    ]);

    return result.rows[0];
  }

  /**
   * Search airports by keyword (code, name, city, or country)
   */
  static async searchAirports(keyword: string, limit: number = 20): Promise<Airport[]> {
    const query = `
      SELECT * FROM airports
      WHERE 
        code ILIKE $1 OR
        name ILIKE $1 OR
        city ILIKE $1 OR
        country_name ILIKE $1 OR
        country_code ILIKE $1
      ORDER BY 
        CASE 
          WHEN code ILIKE $1 THEN 1 
          WHEN city ILIKE $1 THEN 2
          WHEN name ILIKE $1 THEN 3
          ELSE 4 
        END,
        airport_type = 'large_airport' DESC,
        name
      LIMIT $2
    `;

    const result = await pool.query(query, [`%${keyword}%`, limit]);
    return result.rows;
  }

  /**
   * Get popular airports/destinations
   * For now, returns major international hubs
   * Ensures BKK and DMK are always included for Bangkok
   */
  static async getPopularAirports(limit: number = 10): Promise<Airport[]> {
    // First, get BKK and DMK separately to ensure they're included
    const bangkokQuery = `
      SELECT * FROM airports
      WHERE code IN ('BKK', 'DMK')
      ORDER BY code
    `;
    const bangkokResult = await pool.query(bangkokQuery);
    const bangkokAirports = bangkokResult.rows;

    // Then get other popular airports
    const otherQuery = `
      SELECT * FROM airports
      WHERE airport_type = 'large_airport'
      AND code NOT IN ('BKK', 'DMK')
      AND (
        code IN ('HKT', 'CNX', 'SIN', 'NRT', 'ICN', 'LHR', 'CDG', 'DXB', 'SYD', 'JFK')
        OR country_code = 'TH'
      )
      ORDER BY 
        CASE WHEN country_code = 'TH' THEN 1 ELSE 2 END,
        name
      LIMIT $1
    `;
    const otherResult = await pool.query(otherQuery, [limit - bangkokAirports.length]);
    const otherAirports = otherResult.rows;

    // Combine: BKK and DMK first, then others
    return [...bangkokAirports, ...otherAirports];
  }

  /**
   * Get airport by code
   */
  static async getAirportByCode(code: string): Promise<Airport | null> {
    const result = await pool.query(
      'SELECT * FROM airports WHERE code = $1',
      [code]
    );

    return result.rows[0] || null;
  }
}
