'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { statisticsApi } from '@/lib/api/statistics-api'
import { destinationApi } from '@/lib/api/destination-api'
import { flightApi } from '@/lib/api/flight-api'
import { airportApi } from '@/lib/api/airport-api'
import { PROVINCES, thaiMonths } from '@/services/data/constants'
import { FlightSearchParams } from '@/components/flight-search-form'
import { formatDateToUTCString } from '@/lib/utils'
import { translateCity } from '@/lib/services/thai-translation-service'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Mapping สำหรับรูปภาพของแต่ละจังหวัด (ใช้ province value)
// ใช้ชื่อไฟล์ตรงกับชื่อจังหวัด (province value) + '.jpg'
// ถ้าไม่มีรูปจริง จะ fallback ไปใช้ placeholder.svg ตาม logic ใน onError
const provinceImages: Record<string, string> = {
  // ภาคกลาง & ตะวันออก
  'bangkok': `${basePath}/thai/bangkok.jpg`,
  'rayong': `${basePath}/thai/rayong.jpg`,
  'trat': `${basePath}/thai/trat.jpg`,
  'prachuap-khiri-khan': `${basePath}/thai/prachuap-khiri-khan.jpg`,
  'chonburi': `${basePath}/thai/chonburi.jpg`,
  'kanchanaburi': `${basePath}/thai/kanchanaburi.jpg`,

  // ภาคเหนือ
  'chiang-mai': `${basePath}/thai/chiang-mai.jpg`,
  'chiang-rai': `${basePath}/thai/chiang-rai.jpg`,
  'lampang': `${basePath}/thai/lampang.jpg`,
  'mae-hong-son': `${basePath}/thai/mae-hong-son.jpg`,
  'nan': `${basePath}/thai/nan.jpg`,
  'phrae': `${basePath}/thai/phrae.jpg`,
  'phitsanulok': `${basePath}/thai/phitsanulok.jpg`,
  'sukhothai': `${basePath}/thai/sukhothai.jpg`,
  'tak': `${basePath}/thai/tak.jpg`,

  // ภาคตะวันออกเฉียงเหนือ (อีสาน)
  'udon-thani': `${basePath}/thai/udon-thani.jpg`,
  'khon-kaen': `${basePath}/thai/khon-kaen.jpg`,
  'nakhon-ratchasima': `${basePath}/thai/nakhon-ratchasima.jpg`,
  'ubon-ratchathani': `${basePath}/thai/ubon-ratchathani.jpg`,
  'nakhon-phanom': `${basePath}/thai/nakhon-phanom.jpg`,
  'sakon-nakhon': `${basePath}/thai/sakon-nakhon.jpg`,
  'roi-et': `${basePath}/thai/roi-et.jpg`,
  'loei': `${basePath}/thai/loei.jpg`,
  'buri-ram': `${basePath}/thai/buri-ram.jpg`,

  // ภาคใต้
  'phuket': `${basePath}/thai/phuket.jpg`,
  'krabi': `${basePath}/thai/krabi.jpg`,
  'songkhla': `${basePath}/thai/songkhla.jpg`,
  'hat-yai': `${basePath}/thai/hat-yai.jpg`,
  'surat-thani': `${basePath}/thai/surat-thani.jpg`,
  'nakhon-si-thammarat': `${basePath}/thai/nakhon-si-thammarat.jpg`,
  'trang': `${basePath}/thai/trang.jpg`,
  'ranong': `${basePath}/thai/ranong.jpg`,
  'chumphon': `${basePath}/thai/chumphon.jpg`,
  'narathiwat': `${basePath}/thai/narathiwat.jpg`,
  'samui': `${basePath}/thai/samui.jpg`,
}

// Mock average prices - ใช้ราคาเบื้องต้นที่หลากหลายขึ้น
// หมายเหตุ: สามารถดึงจาก API ได้ในอนาคตด้วย statisticsApi.getPriceStatistics(origin, destination)
const mockAveragePrices: Record<string, number> = {
  // ภาคเหนือ
  'chiang-mai': 3500,
  'chiang-rai': 3800,
  'lampang': 3200,
  'mae-hong-son': 4000,
  'nan': 3300,
  'phrae': 3100,
  'phitsanulok': 2900,
  'sukhothai': 3000,
  'tak': 2800,

  // ภาคอีสาน
  'khon-kaen': 2800,
  'udon-thani': 2700,
  'nakhon-ratchasima': 2600,
  'ubon-ratchathani': 3100,
  'nakhon-phanom': 3200,
  'sakon-nakhon': 3000,
  'roi-et': 2900,
  'loei': 3100,
  'buri-ram': 2700,

  // ภาคใต้
  'phuket': 3200,
  'songkhla': 2500,
  'hat-yai': 2500,
  'krabi': 3000,
  'surat-thani': 2800,
  'nakhon-si-thammarat': 2400,
  'trang': 2600,
  'ranong': 2900,
  'chumphon': 2700,
  'narathiwat': 3300,

  // ภาคกลางและตะวันออก
  'bangkok': 2000, // เที่ยวในประเทศจากกรุงเทพ
  'chonburi': 1800,
  'rayong': 2200,
  'trat': 2500,
  'prachuap-khiri-khan': 2300,
  'kanchanaburi': 2100,
}

// Mock trends - ใช้ค่าเบื้องต้นที่หลากหลาย
const mockTrends: Record<string, string> = {
  'chiang-mai': '+15%',
  'chiang-rai': '+12%',
  'phuket': '+22%',
  'krabi': '+8%',
  'songkhla': '+18%',
  'hat-yai': '+18%',
  'khon-kaen': '+12%',
  'udon-thani': '+10%',
  'nakhon-ratchasima': '+9%',
  'rayong': '+5%',
  'trat': '+7%',
  'prachuap-khiri-khan': '+6%',
}

interface PopularDestinationDisplay {
  destination: string
  destinationName: string | null
  count: number
  provinceValue: string
  image: string
  cheapestPrice: string
  airlineName: string | null
  cheapestDate: string | null // ✅ เพิ่มวันที่ของราคาต่ำสุด
  popular: boolean
}

interface PopularDestinationsProps {
  flightPrices?: Array<{
    id: number
    airline_id: number
    airline_code: string
    airline_name: string
    airline_name_th: string
    departure_date: Date | string
    return_date: Date | string | null
    price: number
    base_price: number
    departure_time: string
    arrival_time: string
    duration: number
    flight_number: string
    trip_type: 'one-way' | 'round-trip'
    season: 'high' | 'normal' | 'low'
    origin?: string
    destination?: string
  }> | null
  currentSearchParams?: FlightSearchParams | null
  onSearch?: (params: FlightSearchParams) => void
}

/**
 * Parse Thai date string to Date object
 * Format: "27 ม.ค. 2569" (Buddhist Era) -> Date(2026, 0, 27)
 */
function parseThaiDate(dateString: string): Date | null {
  try {
    // Format: "27 ม.ค. 2569" or "27 ม.ค. 2569" (Buddhist Era)
    const match = dateString.match(/(\d+)\s+([^\s]+)\s+(\d+)/)
    if (!match) return null

    const day = parseInt(match[1], 10)
    const monthAbbr = match[2].trim()
    const buddhistYear = parseInt(match[3], 10)

    // Convert Buddhist Era to AD (subtract 543)
    const adYear = buddhistYear - 543

    // Find month index from Thai month abbreviations
    const monthIndex = thaiMonths.findIndex(m => m === monthAbbr)
    if (monthIndex === -1) return null

    return new Date(adYear, monthIndex, day)
  } catch (error) {
    console.error('Error parsing Thai date:', error)
    return null
  }
}

/**
 * Extract price number from price string
 * Format: "฿880" or "฿1,128" -> 880 or 1128
 */
function extractPrice(priceString: string): number | null {
  try {
    // Remove ฿ and commas, then parse
    const cleaned = priceString.replace(/฿|,/g, '').trim()
    const price = parseInt(cleaned, 10)
    return isNaN(price) ? null : price
  } catch (error) {
    console.error('Error extracting price:', error)
    return null
  }
}

/**
 * Extract airport code from destination name or destination value
 * Format: "Khon Kaen (KKC)" -> "KKC" or "KKC" -> "KKC"
 */
function extractAirportCode(destination: string, destinationName: string | null): string {
  // If destination is already an airport code (3 uppercase letters)
  if (/^[A-Z]{3}$/.test(destination)) {
    return destination.toUpperCase()
  }

  // Try to extract from destination_name format: "City Name (CODE)"
  if (destinationName) {
    const match = destinationName.match(/\(([A-Z]{3})\)/)
    if (match && match[1]) {
      return match[1]
    }
  }

  // Fallback: use destination as is (might be airport code)
  return destination.toUpperCase()
}

/**
 * Convert city name to province value (kebab-case)
 * Format: "Khon Kaen" -> "khon-kaen", "Chiang Mai" -> "chiang-mai"
 */
function cityNameToProvinceValue(cityName: string): string {
  return cityName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Mapping from city names (from CSV) to province values
 * This helps match city names from airport data to our province image files
 */
const cityToProvinceMapping: Record<string, string> = {
  // Direct city name mappings (from CSV format)
  'khon-kaen': 'khon-kaen',
  'chiang-mai': 'chiang-mai',
  'chiang-rai': 'chiang-rai',
  'phuket': 'phuket',
  'krabi': 'krabi',
  'bangkok': 'bangkok',
  'rayong': 'rayong',
  'trat': 'trat',
  'udon-thani': 'udon-thani',
  'hat-yai': 'hat-yai',
  'songkhla': 'songkhla',
  'surat-thani': 'surat-thani',
  'samui': 'samui',
  'na-thon': 'samui',
  // Add more mappings as needed
}

/**
 * Get image path for destination using airport code
 * First tries to get city from airport API, then converts to province value
 */
async function getImagePathForDestination(
  destination: string,
  destinationName: string | null
): Promise<string> {
  try {
    // Extract airport code
    const airportCode = extractAirportCode(destination, destinationName)

    // Get airport details from API
    const airportDetails = await airportApi.getAirportDetails(airportCode)

    if (airportDetails) {
      // 1. If it's Thailand, use province-level images from /thai folder
      if (airportDetails.country_code === 'TH') {
        if (airportDetails.city) {
          // Convert city name to province value (kebab-case)
          const cityKey = cityNameToProvinceValue(airportDetails.city)

          // First, try direct mapping from cityToProvinceMapping
          const mappedProvinceValue = cityToProvinceMapping[cityKey]
          if (mappedProvinceValue && provinceImages[mappedProvinceValue]) {
            return provinceImages[mappedProvinceValue]
          }

          // Check if converted city name matches a province value directly
          if (provinceImages[cityKey]) {
            return provinceImages[cityKey]
          }

          // Try to find matching province by city name
          const matchingProvince = PROVINCES.find(p => {
            const provinceCityName = cityNameToProvinceValue(p.label)
            const airportCityName = cityNameToProvinceValue(airportDetails.city || '')
            return provinceCityName === airportCityName ||
              airportDetails.city?.toLowerCase().includes(p.label.toLowerCase()) ||
              p.label.toLowerCase().includes(airportDetails.city?.toLowerCase() || '')
          })

          if (matchingProvince && provinceImages[matchingProvince.value]) {
            return provinceImages[matchingProvince.value]
          }
        }

        // Fallback: try to find province by airport code
        const provinceByCode = PROVINCES.find(p => p.airportCode === airportCode)
        if (provinceByCode && provinceImages[provinceByCode.value]) {
          return provinceImages[provinceByCode.value]
        }
      }
      // 2. If it's international, use country-level images from /other_countries folder
      else if (airportDetails.country_name) {
        // Normalize country name: lowercase and remove spaces to match file names
        const normalizedCountry = airportDetails.country_name.toLowerCase().replace(/\s+/g, '')
        return `${basePath}/other_countries/${normalizedCountry}.jpg`
      }
    }

    // Final fallback: use placeholder
    return `${basePath}/placeholder.svg`
  } catch (error) {
    console.warn(`[PopularDestinations] Failed to get image for ${destination}:`, error)

    // Fallback: try to find province by destination value
    const province = PROVINCES.find(p =>
      p.value === destination ||
      p.airportCode === destination.toUpperCase()
    )

    if (province && provinceImages[province.value]) {
      return provinceImages[province.value]
    }

    return `${basePath}/placeholder.svg`
  }
}

export function PopularDestinations({ flightPrices, currentSearchParams, onSearch }: PopularDestinationsProps = {}) {
  const [destinations, setDestinations] = useState<PopularDestinationDisplay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopularDestinations = async () => {
      try {
        setLoading(true)
        const stats = await statisticsApi.getStatistics(currentSearchParams?.destination)

        // แปลงข้อมูลจาก API เป็นรูปแบบที่ต้องการ
        const destinationsDataPromises = stats.popularDestinations
          .slice(0, 4) // แสดงแค่ 4 อันดับแรก
          .map(async (dest, index) => {
            // ดึงข้อมูลรูปภาพจาก airport code
            const imagePath = await getImagePathForDestination(dest.destination, dest.destination_name)

            // หา province value จาก destination name หรือ destination value
            const province = PROVINCES.find(p =>
              p.label === dest.destination_name ||
              p.value === dest.destination ||
              p.airportCode === dest.destination.toUpperCase() ||
              dest.destination_name?.includes(p.label) ||
              p.label.includes(dest.destination_name || '')
            )

            const provinceValue = province?.value || dest.destination
            const displayName = dest.destination_name || province?.label || dest.destination

            // ดึงข้อมูลราคาต่ำสุดและสายการบิน
            let cheapestPrice: number | null = null
            let airlineName: string | null = null
            let cheapestDate: string | null = null // ✅ เพิ่มวันที่ของราคาต่ำสุด

            // ✅ ตรวจสอบว่ามีข้อมูล flightPrices จาก airline-flights หรือไม่ (ถ้าปลายทางตรงกัน)
            // เปรียบเทียบทั้ง destination value และ province value
            const searchDestinationProvince = currentSearchParams?.destination
              ? PROVINCES.find(p =>
                p.value === currentSearchParams.destination ||
                p.label === currentSearchParams.destination
              )
              : null
            const hasMatchingFlightPrices = flightPrices &&
              flightPrices.length > 0 &&
              currentSearchParams?.origin === 'bangkok' &&
              (currentSearchParams?.destination === dest.destination ||
                currentSearchParams?.destination === provinceValue ||
                searchDestinationProvince?.value === provinceValue ||
                searchDestinationProvince?.value === dest.destination)

            if (hasMatchingFlightPrices && flightPrices.length > 0) {
              // ✅ ใช้ข้อมูลจาก airline-flights (ราคาที่ถูกที่สุดจากที่แนะนำ)
              const toNum = (v: unknown): number | null => {
                if (typeof v === 'number' && !Number.isNaN(v)) return v
                if (typeof v === 'string') { const n = Number(v); return !Number.isNaN(n) ? n : null }
                return null
              }
              const cheapest = flightPrices.reduce((min, flight) => {
                const p = toNum((flight as any)?.price)
                const minP = toNum((min as any)?.price)
                if (p == null) return min
                if (minP == null) return flight
                return p < minP ? flight : min
              })
              const rawPrice = toNum((cheapest as any)?.price)
              cheapestPrice = rawPrice
              airlineName = cheapest.airline_name_th || cheapest.airline_name || null
              // ✅ เก็บวันที่ของเที่ยวบินที่ถูกที่สุด
              if (cheapest.departure_date) {
                const date = typeof cheapest.departure_date === 'string'
                  ? new Date(cheapest.departure_date)
                  : cheapest.departure_date
                cheapestDate = date.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              }

              console.log(`✅ [REAL DATA - AirlineFlights] ${dest.destination} (${displayName}): ${airlineName || 'Unknown'} - ฿${cheapestPrice}`, {
                totalFlights: flightPrices.length,
                cheapestFlight: cheapest
              })
            } else {
              // ✅ ถ้าไม่มีข้อมูลจาก airline-flights ให้ไปดึงข้อมูลใหม่
              try {
                const today = new Date()
                const futureDate = new Date()
                futureDate.setDate(futureDate.getDate() + 90) // ดูข้อมูล 90 วันข้างหน้า

                let rawResponse = await flightApi.getFlightPrices({
                  origin: 'bangkok',
                  destination: dest.destination,
                  startDate: today.toISOString().split('T')[0],
                  endDate: futureDate.toISOString().split('T')[0],
                  tripType: 'one-way',
                  passengerCount: 1,
                  selectedAirlines: [],
                  travelClass: 'economy',
                })
                // รองรับทั้ง array โดยตรง และรูปแบบห่อ เช่น { data: [...] }
                const fetchedFlightPrices = Array.isArray(rawResponse)
                  ? rawResponse
                  : (rawResponse as any)?.data && Array.isArray((rawResponse as any).data)
                    ? (rawResponse as any).data
                    : (rawResponse as any)?.flights && Array.isArray((rawResponse as any).flights)
                      ? (rawResponse as any).flights
                      : []

                // หาเที่ยวบินที่ถูกที่สุด
                if (fetchedFlightPrices.length > 0) {
                  const toNum = (v: unknown): number | null => {
                    if (typeof v === 'number' && !Number.isNaN(v)) return v
                    if (typeof v === 'string') { const n = Number(v); return !Number.isNaN(n) ? n : null }
                    return null
                  }
                  const cheapest = fetchedFlightPrices.reduce((min, flight) => {
                    const p = toNum((flight as any)?.price ?? (flight as any)?.total_price ?? (flight as any)?.totalPrice)
                    const minP = toNum((min as any)?.price ?? (min as any)?.total_price ?? (min as any)?.totalPrice)
                    if (p == null) return min
                    if (minP == null) return flight
                    return p < minP ? flight : min
                  })
                  const rawPrice = toNum((cheapest as any)?.price ?? (cheapest as any)?.total_price ?? (cheapest as any)?.totalPrice)
                  cheapestPrice = rawPrice
                  airlineName = cheapest.airline_name_th || cheapest.airline_name || (cheapest as any).airline || null
                  // ✅ เก็บวันที่ของเที่ยวบินที่ถูกที่สุด
                  if (cheapest.departureDate) {
                    const date = new Date(cheapest.departureDate)
                    cheapestDate = date.toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  } else {
                    // Fallback: ใช้ startDate ที่ส่งไป (ไม่แม่นยำ 100% แต่ดีกว่าไม่มี)
                    cheapestDate = today.toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  }

                  console.log(`✅ [REAL DATA - API] ${dest.destination} (${displayName}): ${airlineName || 'Unknown'} - ฿${cheapestPrice}`, {
                    totalFlights: fetchedFlightPrices.length,
                    cheapestFlight: cheapest
                  })
                } else {
                  console.warn(`⚠️ [NO DATA - API] ${dest.destination}: API returned empty array`)
                }

              } catch (flightError) {
                // ถ้า API error หรือไม่มีข้อมูล ให้ใช้ mock data
                console.warn(`⚠️ [MOCK DATA - API Error] ${dest.destination} (${displayName}): ${flightError instanceof Error ? flightError.message : 'Unknown error'}`, {
                  error: flightError,
                  usingMockPrice: mockAveragePrices[provinceValue] || null
                })
                cheapestPrice = mockAveragePrices[provinceValue] || null
              }
            }

            // ถ้ายังไม่มีราคา (null/undefined) หรือไม่ใช่ตัวเลข ให้ใช้ค่า default ตามระยะทางคร่าวๆ
            const hasValidPrice = typeof cheapestPrice === 'number' && !Number.isNaN(cheapestPrice) && cheapestPrice >= 0
            if (!hasValidPrice) {
              const fallbackPrice = (() => {
                const key = provinceValue.toLowerCase()
                if (key.includes('chiang') || key.includes('mae')) {
                  return 3500
                } else if (key.includes('phuket') || key.includes('krabi')) {
                  return 3200
                } else if (key.includes('rayong') || key.includes('trat') || key.includes('prachuap')) {
                  return 2200
                } else if (key.includes('khon') || key.includes('udon') || key.includes('nakhon-ratchasima')) {
                  return 2700
                } else if (key === 'cnx' || key.includes('chiang-mai')) {
                  return 3500
                } else {
                  return 2800
                }
              })()

              console.warn(`⚠️ [MOCK DATA - Fallback] ${dest.destination} (${displayName}): No price data, using fallback ฿${fallbackPrice}`)
              cheapestPrice = fallbackPrice
            }

            const displayPrice =
              typeof cheapestPrice === 'number' && !Number.isNaN(cheapestPrice) && cheapestPrice >= 0
                ? `฿${Math.round(cheapestPrice).toLocaleString()}`
                : '—'

            return {
              destination: dest.destination,
              // destinationName: displayName,
              destinationName: translateCity(displayName),
              count: dest.count,
              provinceValue,
              image: imagePath, // ✅ ใช้รูปภาพจาก airport code
              cheapestPrice: String(displayPrice ?? '—'),
              airlineName: airlineName,
              cheapestDate: cheapestDate, // ✅ เพิ่มวันที่
              popular: index === 0,
            }
          })

        const destinationsData = await Promise.all(destinationsDataPromises)
        setDestinations(destinationsData)
      } catch (error) {
        console.error('Error fetching popular destinations:', error)
        // Fallback to empty array on error
        setDestinations([])
      } finally {
        setLoading(false)
      }
    }

    fetchPopularDestinations()
  }, [flightPrices, currentSearchParams])

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{'ปลายทางยอดนิยม'}</h2>
          <p className="text-muted-foreground">
            {'ดูว่าคนอื่นๆ กำลังค้นหาเที่ยวบินไปที่ไหนกัน'}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (destinations.length === 0) {
    return (
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{'ปลายทางยอดนิยม'}</h2>
          <p className="text-muted-foreground">
            {'ดูว่าคนอื่นๆ กำลังค้นหาเที่ยวบินไปที่ไหนกัน'}
          </p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          ยังไม่มีข้อมูลการค้นหา
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">{'ปลายทางยอดนิยม'}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {'ดูว่าคนอื่นๆ กำลังค้นหาเที่ยวบินไปที่ไหนกัน'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {destinations.map((dest) => {
          const handleCardClick = () => {
            if (!onSearch) return

            // Parse date from Thai format
            const searchDate = dest.cheapestDate ? parseThaiDate(dest.cheapestDate) : null
            if (!searchDate) {
              console.warn('Cannot parse date:', dest.cheapestDate)
              return
            }

            // Get origin and destination provinces
            const originProvince = PROVINCES.find(p => p.value === 'bangkok') || PROVINCES[0]
            const destinationProvince = PROVINCES.find(p =>
              p.value === dest.provinceValue ||
              p.label === dest.destinationName
            )

            if (!destinationProvince) {
              console.warn('Cannot find destination province:', dest.provinceValue, dest.destinationName)
              return
            }

            // Create search params
            const searchParams: FlightSearchParams = {
              origin: originProvince.value,
              originName: originProvince.label,
              destination: destinationProvince.value,
              destinationName: destinationProvince.label,
              durationRange: { min: 3, max: 5 }, // Default duration
              selectedAirlines: [],
              startDate: searchDate,
              endDate: undefined,
              tripType: 'one-way',
              passengerCount: 1,
              travelClass: 'economy',
            }

            onSearch(searchParams)
          }

          return (
            <Card
              key={dest.destination}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer p-0"
              onClick={handleCardClick}
            >
              <div className="relative h-48 bg-muted rounded-t-xl">
                <img
                  src={dest.image || `${basePath}/placeholder.svg`}
                  alt={dest.destinationName || dest.destination}
                  className="w-full h-full object-cover rounded-t-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `${basePath}/placeholder.svg`
                  }}
                />
                {dest.popular && (
                  <div className="absolute top-0 left-0 z-10">
                    <div
                      className="bg-yellow-500 px-4 py-2"
                      style={{
                        borderTopLeftRadius: '0.5rem',
                        borderTopRightRadius: '0',
                        borderBottomLeftRadius: '0',
                        borderBottomRightRadius: '0.5rem',
                      }}
                    >
                      <span className="font-semibold text-sm" style={{ color: '#0055a4' }}>
                        {'ยอดนิยม'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-b-xl">
                <h3 className="font-bold text-lg mb-3">{dest.destinationName || dest.destination}</h3>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{dest.count.toLocaleString()} {'ครั้ง'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">{'ราคาถูกที่สุด'}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-xl font-bold text-primary">
                        {dest.cheapestPrice != null && String(dest.cheapestPrice).trim() !== ''
                          ? dest.cheapestPrice
                          : '—'}
                      </div>
                      {dest.airlineName && (
                        <div className="text-sm text-muted-foreground">• {dest.airlineName}</div>
                      )}
                    </div>
                    {dest.cheapestDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {'วันที่: '}{dest.cheapestDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
