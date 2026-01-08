/**
 * Airport Code Converter Utility
 * Converts province/country names to airport codes
 * Uses database cache and fallback mapping for Thai provinces
 */

import { AirportModel } from '../models/Airport';

/**
 * Mapping for Thai provinces to airport codes
 */
const PROVINCE_TO_AIRPORT_CODE: Record<string, string> = {
  'bangkok': 'BKK',
  'chiang-mai': 'CNX',
  'chiang-rai': 'CEI',
  'phuket': 'HKT',
  'krabi': 'KBV',
  'samui': 'USM',
  'hat-yai': 'HDY',
  'songkhla': 'HDY',
  'udon-thani': 'UTH',
  'khon-kaen': 'KKC',
  'ubon-ratchathani': 'UBP',
  'nakhon-phanom': 'KOP',
  'nakhon-ratchasima': 'NAK',
  'sakon-nakhon': 'SNO',
  'roi-et': 'ROI',
  'loei': 'LOE',
  'buri-ram': 'BFV',
  'rayong': 'UTP',
  'trat': 'TDX',
  'prachuap-khiri-khan': 'HHQ',
  'lampang': 'LPT',
  'mae-hong-son': 'HGN',
  'nan': 'NNT',
  'phrae': 'PRH',
  'phitsanulok': 'PHS',
  'sukhothai': 'THS',
  'tak': 'MAQ',
  'surat-thani': 'URT',
  'nakhon-si-thammarat': 'NST',
  'trang': 'TST',
  'ranong': 'UNN',
  'chumphon': 'CJM',
  'narathiwat': 'NAW',
};

/**
 * Convert location (province, city, country, or airport code) to airport code
 * 
 * @param location - Can be:
 *   - Airport code (3 uppercase letters, e.g., "BKK")
 *   - Province name (e.g., "chiang-mai", "phuket")
 *   - City name (e.g., "Bangkok", "Chiang Mai")
 *   - Country name (e.g., "Thailand")
 * 
 * @returns Airport IATA code (e.g., "BKK", "CNX", "HKT")
 * 
 * @throws Error if airport code cannot be found
 */
export async function convertToAirportCode(
  location: string
): Promise<string> {
  if (!location || typeof location !== 'string') {
    throw new Error('Location must be a non-empty string');
  }

  const locationLower = location.toLowerCase().trim();
  
  // 1. Check if already airport code (3 uppercase letters)
  if (/^[A-Z]{3}$/.test(location.toUpperCase())) {
    // Verify it exists in database
    const airport = await AirportModel.getAirportByCode(location.toUpperCase());
    if (airport) {
      return location.toUpperCase();
    }
    // If not in database but looks like a valid code, return it anyway
    // (some codes might not be in our database yet)
    return location.toUpperCase();
  }

  // 2. Try fallback mapping for Thai provinces first (fastest, no API call)
  const normalizedLocation = locationLower.replace(/\s+/g, '-');
  if (PROVINCE_TO_AIRPORT_CODE[normalizedLocation]) {
    const airportCode = PROVINCE_TO_AIRPORT_CODE[normalizedLocation];
    // Verify it exists in database
    const airport = await AirportModel.getAirportByCode(airportCode);
    if (airport) {
      return airportCode;
    }
    // Return the code anyway (from our mapping) even if not in database
    return airportCode;
  }

  // 3. Try database cache (search by name, city, or code)
  const cachedAirports = await AirportModel.searchAirports(location);
  if (cachedAirports.length > 0) {
    // Prefer exact code match, then name match
    const exactMatch = cachedAirports.find(a => 
      a.code.toLowerCase() === locationLower ||
      a.name.toLowerCase() === locationLower ||
      a.city.toLowerCase() === locationLower
    );
    
    if (exactMatch) {
      return exactMatch.code;
    }
    
    // Return first result if no exact match
    return cachedAirports[0].code;
  }

  // 4. If still no match, throw error
  const fallbackCode = PROVINCE_TO_AIRPORT_CODE[normalizedLocation];
  if (fallbackCode) {
    return fallbackCode;
  }
  
  throw new Error(`Could not find airport code for location: ${location}. Please use airport code (e.g., BKK, CNX) or a Thai province name.`);
}

/**
 * Convert multiple locations to airport codes
 * Useful for batch processing
 */
export async function convertToAirportCodes(
  locations: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  for (const location of locations) {
    try {
      results[location] = await convertToAirportCode(location);
    } catch (error: any) {
      console.error(`[AirportCodeConverter] Failed to convert "${location}":`, error.message);
      // Continue with other locations
    }
  }
  
  return results;
}

