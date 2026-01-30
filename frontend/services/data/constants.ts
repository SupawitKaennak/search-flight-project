/**
 * Constants and utility data
 * Thai month names, provinces, airlines and other constants
 */

// Thai month abbreviations
export const thaiMonths = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

// Thai month full names
export const thaiMonthsFull = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

// Month order mapping for sorting
export const monthOrder: Record<string, number> = {
  'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
  'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
  'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
}

// Thai provinces with commercial airports for flight search
// Format: { value: string, label: string, airportCode: string }
// Note: Label shows only province name (airport codes shown in flight list)
export const PROVINCES = [
  // ภาคกลาง & ตะวันออก
  { value: 'bangkok', label: 'กรุงเทพมหานคร', airportCode: 'BKK' }, // มี 2 สนามบิน: BKK, DMK
  { value: 'rayong', label: 'ระยอง', airportCode: 'UTP' },
  { value: 'trat', label: 'ตราด', airportCode: 'TDX' },
  { value: 'prachuap-khiri-khan', label: 'ประจวบคีรีขันธ์', airportCode: 'HHQ' },

  // ภาคเหนือ
  { value: 'chiang-mai', label: 'เชียงใหม่', airportCode: 'CNX' },
  { value: 'chiang-rai', label: 'เชียงราย', airportCode: 'CEI' },
  { value: 'lampang', label: 'ลำปาง', airportCode: 'LPT' },
  { value: 'mae-hong-son', label: 'แม่ฮ่องสอน', airportCode: 'HGN' }, // มี 2 สนามบิน: HGN (แม่ฮ่องสอน), PYY (ปาย)
  { value: 'nan', label: 'น่าน', airportCode: 'NNT' },
  { value: 'phrae', label: 'แพร่', airportCode: 'PRH' },
  { value: 'phitsanulok', label: 'พิษณุโลก', airportCode: 'PHS' },
  { value: 'sukhothai', label: 'สุโขทัย', airportCode: 'THS' },
  { value: 'tak', label: 'ตาก', airportCode: 'MAQ' },

  // ภาคตะวันออกเฉียงเหนือ (อีสาน)
  { value: 'udon-thani', label: 'อุดรธานี', airportCode: 'UTH' },
  { value: 'khon-kaen', label: 'ขอนแก่น', airportCode: 'KKC' },
  { value: 'ubon-ratchathani', label: 'อุบลราชธานี', airportCode: 'UBP' },
  { value: 'nakhon-phanom', label: 'นครพนม', airportCode: 'KOP' },
  { value: 'sakon-nakhon', label: 'สกลนคร', airportCode: 'SNO' },
  { value: 'roi-et', label: 'ร้อยเอ็ด', airportCode: 'ROI' },
  { value: 'loei', label: 'เลย', airportCode: 'LOE' },
  { value: 'buri-ram', label: 'บุรีรัมย์', airportCode: 'BFV' },
  { value: 'nakhon-ratchasima', label: 'นครราชสีมา', airportCode: 'NAK' },

  // ภาคใต้
  { value: 'phuket', label: 'ภูเก็ต', airportCode: 'HKT' },
  { value: 'songkhla', label: 'สงขลา', airportCode: 'HDY' },
  { value: 'krabi', label: 'กระบี่', airportCode: 'KBV' },
  { value: 'surat-thani', label: 'สุราษฎร์ธานี', airportCode: 'URT' },
  { value: 'nakhon-si-thammarat', label: 'นครศรีธรรมราช', airportCode: 'NST' },
  { value: 'trang', label: 'ตรัง', airportCode: 'TST' },
  { value: 'ranong', label: 'ระนอง', airportCode: 'UNN' },
  { value: 'chumphon', label: 'ชุมพร', airportCode: 'CJM' },
  { value: 'narathiwat', label: 'นราธิวาส', airportCode: 'NAW' },
  { value: 'samui', label: 'เกาะสมุย', airportCode: 'USM' },
]

// Airport code mapping (province value -> airport code)
export const airportCodes: Record<string, string> = PROVINCES.reduce((acc, province) => {
  acc[province.value] = province.airportCode
  return acc
}, {} as Record<string, string>)

// Provinces with multiple airports (province value -> array of airport codes)
export const multiAirportProvinces: Record<string, string[]> = {
  'bangkok': ['BKK', 'DMK'], // กรุงเทพมี 2 สนามบิน: BKK (สุวรรณภูมิ), DMK (ดอนเมือง)
  'mae-hong-son': ['HGN', 'PYY'], // แม่ฮ่องสอนมี 2 สนามบิน: HGN (แม่ฮ่องสอน), PYY (ปาย)
}

// Thai airlines for flight search
// Thai and International airlines for flight search
export const THAI_AIRLINES = [
  { value: '9-air', label: '9 Air' },
  { value: 'ana', label: 'ANA' },
  { value: 'aeroflot', label: 'Aeroflot' },
  { value: 'air-arabia', label: 'Air Arabia' },
  { value: 'air-astana', label: 'Air Astana' },
  { value: 'air-austral', label: 'Air Austral' },
  { value: 'air-busan', label: 'Air Busan' },
  { value: 'air-cambodia', label: 'Air Cambodia' },
  { value: 'air-canada', label: 'Air Canada' },
  { value: 'air-china', label: 'Air China' },
  { value: 'air-france', label: 'Air France' },
  { value: 'air-india', label: 'Air India' },
  { value: 'air-india-express', label: 'Air India Express' },
  { value: 'air-japan', label: 'Air Japan' },
  { value: 'air-macau', label: 'Air Macau' },
  { value: 'air-premia', label: 'Air Premia' },
  { value: 'aircalin', label: 'Aircalin' },
  { value: 'arkia', label: 'Arkia' },
  { value: 'asiana', label: 'Asiana' },
  { value: 'austrian', label: 'Austrian' },
  { value: 'bangkok-airways', label: 'Bangkok Airways' },
  { value: 'bhutan-airlines', label: 'Bhutan Airlines' },
  { value: 'biman', label: 'Biman' },
  { value: 'british-airways', label: 'British Airways' },
  { value: 'cambodia-airways', label: 'Cambodia Airways' },
  { value: 'capital-airlines', label: 'Capital Airlines' },
  { value: 'cathay-pacific', label: 'Cathay Pacific' },
  { value: 'cebu-pacific', label: 'Cebu Pacific' },
  { value: 'chengdu-airlines', label: 'Chengdu Airlines' },
  { value: 'china-airlines', label: 'China Airlines' },
  { value: 'china-eastern', label: 'China Eastern' },
  { value: 'china-southern', label: 'China Southern' },
  { value: 'condor', label: 'Condor' },
  { value: 'drukair', label: 'Drukair' },
  { value: 'eva-air', label: 'EVA Air' },
  { value: 'eastar-jet', label: 'Eastar Jet' },
  { value: 'el-al', label: 'El Al' },
  { value: 'emirates', label: 'Emirates' },
  { value: 'ethiopian', label: 'Ethiopian' },
  { value: 'etihad', label: 'Etihad' },
  { value: 'finnair', label: 'Finnair' },
  { value: 'garuda-indonesia', label: 'Garuda Indonesia' },
  { value: 'greater-bay-airlines', label: 'Greater Bay Airlines' },
  { value: 'gulf-air', label: 'Gulf Air' },
  { value: 'hk-express', label: 'HK Express' },
  { value: 'hainan-airlines', label: 'Hainan Airlines' },
  { value: 'hong-kong-airlines', label: 'Hong Kong Airlines' },
  { value: 'ita-airways', label: 'ITA Airways' },
  { value: 'indigo', label: 'IndiGo' },
  { value: 'jal', label: 'JAL' },
  { value: 'jeju-air', label: 'Jeju Air' },
  { value: 'jetstar', label: 'Jetstar' },
  { value: 'jin-air', label: 'Jin Air' },
  { value: 'juneyao-airlines', label: 'Juneyao Airlines' },
  { value: 'klm', label: 'KLM' },
  { value: 'kenya-airways', label: 'Kenya Airways' },
  { value: 'korean-air', label: 'Korean Air' },
  { value: 'kunming-airlines', label: 'Kunming Airlines' },
  { value: 'kuwait-airways', label: 'Kuwait Airways' },
  { value: 'lao-airlines', label: 'Lao Airlines' },
  { value: 'loong-air', label: 'Loong Air' },
  { value: 'lufthansa', label: 'Lufthansa' },
  { value: 'mai', label: 'MAI' },
  { value: 'malaysia-airlines', label: 'Malaysia Airlines' },
  { value: 'miat-mongolian-airlines', label: 'Miat - Mongolian Airlines' },
  { value: 'myanmar-national-airlines', label: 'Myanmar National Airlines' },
  { value: 'norse', label: 'Norse' },
  { value: 'norse-atlantic-uk', label: 'Norse Atlantic UK' },
  { value: 'oman-air', label: 'Oman Air' },
  { value: 'pal', label: 'PAL' },
  { value: 'peach-aviation', label: 'Peach Aviation' },
  { value: 'qantas', label: 'Qantas' },
  { value: 'qatar-airways', label: 'Qatar Airways' },
  { value: 'qingdao-airlines', label: 'Qingdao Airlines' },
  { value: 'royal-brunei-airlines', label: 'Royal Brunei Airlines' },
  { value: 'royal-jordanian', label: 'Royal Jordanian' },
  { value: 'ruili-airlines', label: 'Ruili Airlines' },
  { value: 's7-airlines', label: 'S7 Airlines' },
  { value: 'sas', label: 'SAS' },
  { value: 'swiss', label: 'SWISS' },
  { value: 'salam-air', label: 'Salam Air' },
  { value: 'saudia', label: 'Saudia' },
  { value: 'scoot', label: 'Scoot' },
  { value: 'shandong-airlines', label: 'Shandong Airlines' },
  { value: 'shanghai-airlines', label: 'Shanghai Airlines' },
  { value: 'shenzhen-airlines', label: 'Shenzhen Airlines' },
  { value: 'sichuan-airlines', label: 'Sichuan Airlines' },
  { value: 'singapore-airlines', label: 'Singapore Airlines' },
  { value: 'spring-airlines', label: 'Spring Airlines' },
  { value: 'srilankan-airlines', label: 'SriLankan Airlines' },
  { value: 'starlux', label: 'Starlux' },
  { value: 'thai-airasia', label: 'Thai AirAsia' },
  { value: 'thai-airways', label: 'Thai Airways' },
  { value: 'thai-lion-air', label: 'Thai Lion Air' },
  { value: 'thai-vietjet', label: 'Thai Vietjet Air' },
  { value: 'turkish-airlines', label: 'Turkish Airlines' },
  { value: 'turkmenistan-airlines', label: 'Turkmenistan Airlines' },
  { value: 't-way-air', label: 'T´Way Air' },
  { value: 'us-bangla-airlines', label: 'US-Bangla Airlines' },
  { value: 'united', label: 'United' },
  { value: 'urumqi-airlines', label: 'Urumqi Airlines' },
  { value: 'vietjet', label: 'VietJet' },
  { value: 'vietnam-airlines', label: 'Vietnam Airlines' },
  { value: 'vietravel-airlines', label: 'Vietravel Airlines' },
  { value: 'xiamen-air', label: 'XiamenAir' },
  { value: 'zipair', label: 'Zipair' },
  { value: 'nok-air', label: 'Nok Air' },
]

// Province names mapping (value -> label and airportCode -> label)
export const provinceNames: Record<string, string> = PROVINCES.reduce((acc, province) => {
  acc[province.value] = province.label
  acc[province.airportCode] = province.label
  return acc
}, {} as Record<string, string>)

/**
 * Get airport code for a province (returns default/primary airport)
 * 
 * @deprecated This function uses hardcoded mapping and should not be used in production.
 * For production, use the Backend API via services/api/airport-code-service.ts
 * 
 * This function is kept only for backward compatibility in mock data source.
 * 
 * For real API usage:
 * - Use: import { getAirportCode } from '@/services/api/airport-code-service'
 * - Backend API: GET /api/flights/airport-code?province=xxx
 */
export function getAirportCode(provinceValue: string): string {
  return airportCodes[provinceValue] || ''
}

/**
 * Get all airport codes for a province (returns array if multiple airports)
 * 
 * @deprecated This function uses hardcoded mapping and should not be used in production.
 * For production, use the Backend API via services/api/airport-code-service.ts
 * 
 * This function is kept only for backward compatibility in mock data source.
 */
export function getAllAirportCodes(provinceValue: string): string[] {
  if (multiAirportProvinces[provinceValue]) {
    return multiAirportProvinces[provinceValue]
  }
  const code = getAirportCode(provinceValue)
  return code ? [code] : []
}

