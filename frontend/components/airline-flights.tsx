'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Plane, Clock, Calendar, Loader2, AlertTriangle, Leaf } from 'lucide-react'
import { FlightSearchParams } from '@/components/flight-search-form'
import { generateFlightsForAirline, Flight as MockFlight } from '@/services/mock/mock-flights'
import { THAI_AIRLINES, PROVINCES, airportCodes } from '@/services/data/constants'
// Note: getAirportCode is no longer needed - backend converts province names to airport codes automatically
import { airlineCodes } from '@/services/data/airline-data'
import { flightService } from '@/lib/services/flight-service'
import { FlightPrice } from '@/lib/api/types'
import { getFlightDataSource } from '@/lib/services/data-source'
import { formatDateToUTCString } from '@/lib/utils'
import { thaiMonthsFull } from '@/services/data/constants'
import { translateAirport, translateCity } from '@/lib/services/thai-translation-service'

// Helper function to format date to Thai format (e.g., "16 มกราคม 2569")
const formatThaiDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00.000Z')
  const day = date.getUTCDate()
  const month = thaiMonthsFull[date.getUTCMonth()]
  const year = date.getUTCFullYear() + 543 // Convert to Buddhist era
  return `${day} ${month} ${year}`
}

// Helper function to format time from timestamp (e.g., "2025-01-16T15:50:00.000Z" -> "15:50:00")
const formatTime = (timestamp: string): string => {
  if (!timestamp) return ''
  // If already in HH:MM:SS format, return as is
  if (/^\d{2}:\d{2}:\d{2}$/.test(timestamp)) {
    return timestamp
  }
  // Otherwise parse as timestamp
  try {
    const date = new Date(timestamp)
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  } catch {
    return timestamp
  }
}

// Use same interface as mock for compatibility
type Flight = {
  airline: string
  airlineValue?: string // Store airline value for filtering
  flightNumber: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  date: string
  originAirportCode?: string
  destinationAirportCode?: string
  airplane?: string | null
  often_delayed?: boolean
  carbon_emissions?: string | null
  legroom?: string | null
  stops?: number
}

interface AirlineFlightsProps {
  searchParams: FlightSearchParams
  selectedAirlines: string[]
  onAirlinesChange?: (airlines: string[]) => void
  flightPrices?: Array<{  // ✅ รับ flightPrices จาก PriceAnalysis เพื่อใช้ข้อมูลเดียวกัน
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
    airplane?: string | null
    often_delayed?: boolean
    carbon_emissions?: string | null
    legroom?: string | null
    origin?: string | null // Airport code for origin (e.g., BKK, DMK)
    destination?: string | null // Airport code for destination
  }>
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Mapping รูปภาพสำหรับแต่ละสายการบิน
const getAirlineImage = (airline: string): string => {
  const imageMap: Record<string, string> = {
    'Thai Airways': `${basePath}/airlines/thai-airways.png`,
    'Thai AirAsia': `${basePath}/airlines/thai-airasia.png`,
    'Thai Lion Air': `${basePath}/airlines/thai-lion-air.png`,
    'Thai Vietjet Air': `${basePath}/airlines/thai-vietjet.png`,
    'Bangkok Airways': `${basePath}/airlines/bangkok-airways.png`,
    'Nok Air': `${basePath}/airlines/nok-air.png`,
  }

  // ใช้ placeholder เป็น default จนกว่าจะมีรูปภาพจริง
  return imageMap[airline] || `${basePath}/placeholder-logo.png`
}

export function AirlineFlights({ searchParams, selectedAirlines, onAirlinesChange, flightPrices: propFlightPrices }: AirlineFlightsProps) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  // Debounce searchParams and selectedAirlines to prevent too many requests
  const debouncedSearchParams = useDebounce(searchParams, 500)
  const debouncedSelectedAirlines = useDebounce(selectedAirlines, 300)

  // Check if using mock or real data
  const useMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
    !process.env.NEXT_PUBLIC_USE_MOCK_DATA ||
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === undefined

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!debouncedSearchParams || !debouncedSearchParams.startDate) {
      console.log('⚠️ Missing searchParams or startDate:', { searchParams: debouncedSearchParams, hasStartDate: !!debouncedSearchParams?.startDate })
      setFlights([])
      setLoading(false)
      return
    }

    // ✅ ถ้ามี flightPrices จาก PriceAnalysis → ใช้ข้อมูลนั้นแทนการ query เอง
    if (propFlightPrices && propFlightPrices.length > 0) {
      const passengerCount = debouncedSearchParams.passengerCount || 1

      // ✅ ใช้ UTC methods เพื่อให้สอดคล้องกับ backend
      // Backend ใช้ parseISO(dateOnly + 'T00:00:00.000Z') ซึ่งสร้าง UTC date
      // ดังนั้นเราต้องใช้ UTC methods เพื่อให้วันที่ตรงกัน
      const startDateStr = formatDateToUTCString(debouncedSearchParams.startDate) || ''
      const endDateStr = formatDateToUTCString(debouncedSearchParams.endDate)

      // ✅ Normalize flight date เป็น UTC date string (ใช้ utility function)
      const normalizeFlightDate = (date: Date | string): string => {
        return formatDateToUTCString(date) || ''
      }

      // Filter เที่ยวบินในวันที่เลือกและ tripType ที่ตรงกัน
      let filteredFlights = propFlightPrices.filter(fp => {
        // ✅ Filter ตาม tripType ก่อน
        if (fp.trip_type !== debouncedSearchParams.tripType) {
          return false
        }

        const fpDateStr = normalizeFlightDate(fp.departure_date)

        // Filter ตามวันที่เลือก
        if (debouncedSearchParams.tripType === 'round-trip' && endDateStr) {
          return fpDateStr >= startDateStr && fpDateStr <= endDateStr
        } else {
          return fpDateStr === startDateStr
        }
      })

      // Filter ตาม stops
      if (debouncedSearchParams.stops && debouncedSearchParams.stops !== 'all') {
        filteredFlights = filteredFlights.filter(fp => {
          if (debouncedSearchParams.stops === 'direct') {
            return (fp as any).stops === 0 || !(fp as any).stops
          } else {
            return (fp as any).stops > 0
          }
        })
      }

      // Filter ตาม selectedAirlines ถ้ามี
      if (debouncedSelectedAirlines.length > 0) {
        const selectedAirlineCodes = debouncedSelectedAirlines
          .map(value => airlineCodes[value])
          .filter((code): code is string => !!code)

        filteredFlights = filteredFlights.filter(fp =>
          selectedAirlineCodes.includes(fp.airline_code)
        )
      }

      // Transform เป็น Flight format
      const transformedFlights: Flight[] = filteredFlights.map(fp => {
        // ✅ Use airline_code from propFlightPrices to find matching airline
        let airlineEntry = null
        let airlineLabel = fp.airline_name_th || fp.airline_name || 'Unknown'
        let airlineValue: string | undefined = undefined

        if (fp.airline_code) {
          // Find airline by code (reverse lookup from airlineCodes)
          airlineEntry = THAI_AIRLINES.find(a => {
            const code = airlineCodes[a.value]
            return code === fp.airline_code
          })

          // If found, use it; otherwise use API response data directly
          if (airlineEntry) {
            airlineValue = airlineEntry.value
            airlineLabel = airlineEntry.label
          } else {
            // Airline code exists in database but not in frontend constants (e.g., W1)
            // Use API response data directly
            airlineLabel = fp.airline_name_th || fp.airline_name || 'Unknown'
            airlineValue = undefined // No matching value in constants
          }
        } else {
          // Fallback: try to match by name if code is not available
          airlineEntry = THAI_AIRLINES.find(a => {
            const thaiNames: Record<string, string[]> = {
              'thai-airways': ['การบินไทย', 'Thai Airways'],
              'thai-airasia': ['ไทยแอร์เอเชีย', 'Thai AirAsia'],
              'thai-lion-air': ['ไทยไลอ้อนแอร์', 'Thai Lion Air'],
              'thai-vietjet': ['ไทยเวียดเจ็ทแอร์', 'Thai Vietjet Air'],
              'bangkok-airways': ['บางกอกแอร์เวย์', 'Bangkok Airways'],
              'nok-air': ['นกแอร์', 'Nok Air'],
            }
            return thaiNames[a.value]?.some(name =>
              fp.airline_name_th?.includes(name) ||
              fp.airline_name?.includes(name)
            )
          })
          airlineLabel = airlineEntry?.label || fp.airline_name_th || fp.airline_name || 'Unknown'
          airlineValue = airlineEntry?.value
        }

        // ✅ ใช้ UTC methods เพื่อแสดงวันที่ที่ถูกต้อง (ใช้ utility function)
        const dateStr = formatDateToUTCString(fp.departure_date) || ''

        return {
          airline: airlineLabel,
          airlineValue,
          flightNumber: fp.flight_number,
          departureTime: fp.departure_time,
          arrivalTime: fp.arrival_time,
          duration: `${Math.floor(fp.duration / 60)}ชม. ${fp.duration % 60}นาที`,
          //price: Math.round(fp.price * passengerCount),
          price: Math.round(fp.price),
          date: dateStr,  // ✅ ใช้ UTC date string
          originAirportCode: fp.origin || airportCodes[debouncedSearchParams.origin] || debouncedSearchParams.origin,
          destinationAirportCode: fp.destination || airportCodes[debouncedSearchParams.destination] || debouncedSearchParams.destination,
          originNameTH: translateCity(debouncedSearchParams.originName || ''),
          destinationNameTH: translateCity(debouncedSearchParams.destinationName || ''),
          originAirportNameTH: translateAirport(fp.origin || airportCodes[debouncedSearchParams.origin] || debouncedSearchParams.origin),
          destinationAirportNameTH: translateAirport(fp.destination || airportCodes[debouncedSearchParams.destination] || debouncedSearchParams.destination),
          airplane: fp.airplane || null,
          often_delayed: fp.often_delayed || false,
          carbon_emissions: fp.carbon_emissions || null,
          legroom: fp.legroom || null,
          stops: (fp as any).stops || 0,
        }
      })

      setFlights(transformedFlights)
      setLoading(false)
      return
    }

    const loadFlights = async () => {
      // Create new abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setLoading(true)
      setError(null)

      console.log('🔍 Loading flights:', {
        origin: debouncedSearchParams.origin,
        destination: debouncedSearchParams.destination,
        startDate: debouncedSearchParams.startDate,
        useMock,
      })

      try {
        const passengerCount = debouncedSearchParams.passengerCount || 1

        if (useMock) {
          console.log('📦 Using MOCK data')
          // Use mock data
          const airlinesToShow = debouncedSelectedAirlines.length === 0
            ? THAI_AIRLINES.map(a => a.value)
            : debouncedSelectedAirlines

          const mockFlights = airlinesToShow.flatMap(airline =>
            generateFlightsForAirline(
              airline,
              debouncedSearchParams.origin,
              debouncedSearchParams.destination,
              debouncedSearchParams.startDate,
              debouncedSearchParams.endDate
            )
          ).map(flight => ({
            ...flight,
            price: flight.price * passengerCount
          }))

          // Check if request was aborted
          if (abortController.signal.aborted || !isMountedRef.current) {
            return
          }

          setFlights(mockFlights)
          setLoading(false)
        } else {
          // Use real API
          const dataSource = getFlightDataSource()

          if (dataSource.getFlightPrices && debouncedSearchParams.startDate) {
            // ✅ Backend automatically converts province/country names to airport codes
            // Send province names directly to backend (no need to convert)

            // Convert selectedAirlines from values (thai-airways) to codes (TG) for backend
            const selectedAirlineCodes = debouncedSelectedAirlines.length > 0
              ? debouncedSelectedAirlines
                .map(value => airlineCodes[value])
                .filter((code): code is string => !!code) // Filter out undefined values
              : []

            console.log('🔍 Filtering airlines:', {
              selectedAirlines: debouncedSelectedAirlines,
              selectedAirlineCodes,
            })

            // Send province names directly - backend will convert to airport codes automatically
            const apiFlights = await dataSource.getFlightPrices({
              origin: debouncedSearchParams.origin, // Send province name, not airport code
              destination: debouncedSearchParams.destination, // Send province name, not airport code
              startDate: formatDateToUTCString(debouncedSearchParams.startDate) || '',
              endDate: formatDateToUTCString(debouncedSearchParams.endDate),
              tripType: debouncedSearchParams.tripType || 'round-trip',
              passengerCount,
              selectedAirlines: selectedAirlineCodes,
              travelClass: debouncedSearchParams.travelClass || 'economy',
            })

            // Check if request was aborted
            if (abortController.signal.aborted || !isMountedRef.current) {
              return
            }

            // Debug: Log API response
            console.log(`📊 API returned ${apiFlights.length} flights for ${debouncedSearchParams.origin} → ${debouncedSearchParams.destination}`)
            if (apiFlights.length > 0) {
              console.log('📋 Sample flight data:', {
                airline: apiFlights[0].airline,
                airline_code: apiFlights[0].airline_code,
                airline_name: apiFlights[0].airline_name,
                airline_name_th: apiFlights[0].airline_name_th,
                flightNumber: apiFlights[0].flightNumber,
              })
            }

            // Transform API flights to Flight format
            const transformedFlights: Flight[] = apiFlights.map(fp => {
              // ✅ Use airline_code from API response to find matching airline
              // Backend now sends airline_code, airline_name, and airline_name_th
              let airlineEntry = null
              let airlineLabel = fp.airline_name_th || fp.airline_name || fp.airline
              let airlineValue: string | undefined = undefined

              if (fp.airline_code) {
                // Find airline by code (reverse lookup from airlineCodes)
                airlineEntry = THAI_AIRLINES.find(a => {
                  const code = airlineCodes[a.value]
                  return code === fp.airline_code
                })

                // If found, use it; otherwise use API response data directly
                if (airlineEntry) {
                  airlineValue = airlineEntry.value
                  airlineLabel = airlineEntry.label
                } else {
                  // Airline code exists in database but not in frontend constants (e.g., W1)
                  // Use API response data directly
                  airlineLabel = fp.airline_name_th || fp.airline_name || fp.airline
                  airlineValue = undefined // No matching value in constants
                }
              } else {
                // Fallback: try to match by name if code is not available
                airlineEntry = THAI_AIRLINES.find(a => {
                  const thaiNames: Record<string, string[]> = {
                    'thai-airways': ['การบินไทย', 'Thai Airways'],
                    'thai-airasia': ['ไทยแอร์เอเชีย', 'Thai AirAsia'],
                    'thai-lion-air': ['ไทยไลอ้อนแอร์', 'Thai Lion Air'],
                    'thai-vietjet': ['ไทยเวียดเจ็ทแอร์', 'Thai Vietjet Air'],
                    'bangkok-airways': ['บางกอกแอร์เวย์', 'Bangkok Airways'],
                    'nok-air': ['นกแอร์', 'Nok Air'],
                  }
                  const names = thaiNames[a.value] || []
                  return names.some(name => fp.airline.includes(name) || name.includes(fp.airline))
                })
                airlineLabel = airlineEntry?.label || fp.airline_name_th || fp.airline_name || fp.airline
                airlineValue = airlineEntry?.value
              }

              // Format duration (minutes to "Xชม. Yนาที")
              const hours = Math.floor(fp.duration / 60)
              const minutes = fp.duration % 60
              const durationStr = hours > 0
                ? `${hours}ชม. ${minutes}นาที`
                : `${minutes}นาที`

              // Format date
              const flightDate = debouncedSearchParams.startDate || new Date()
              const dateStr = flightDate.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })

              return {
                airline: airlineLabel,
                airlineValue, // Store airline value for filtering
                flightNumber: fp.flightNumber,
                departureTime: fp.departureTime,
                arrivalTime: fp.arrivalTime,
                duration: durationStr,
                price: fp.price,
                date: dateStr,
                originAirportCode: fp.origin || airportCodes[debouncedSearchParams.origin] || debouncedSearchParams.origin,
                destinationAirportCode: fp.destination || airportCodes[debouncedSearchParams.destination] || debouncedSearchParams.destination,
                originNameTH: translateCity(debouncedSearchParams.originName || ''),
                destinationNameTH: translateCity(debouncedSearchParams.destinationName || ''),
                originAirportNameTH: translateAirport(fp.origin || airportCodes[debouncedSearchParams.origin] || debouncedSearchParams.origin),
                destinationAirportNameTH: translateAirport(fp.destination || airportCodes[debouncedSearchParams.destination] || debouncedSearchParams.destination),
                airplane: fp.airplane || null,
                often_delayed: fp.often_delayed || false,
                carbon_emissions: fp.carbon_emissions || null,
                legroom: fp.legroom || null,
                stops: fp.stops || 0,
              }
            })

            // Check if request was aborted before setting state
            if (abortController.signal.aborted || !isMountedRef.current) {
              return
            }

            // Filter flights by selected airlines (client-side filter as backup)
            let filteredFlights = transformedFlights
            if (debouncedSelectedAirlines.length > 0) {
              filteredFlights = transformedFlights.filter(flight => {
                // Check if flight's airline value is in selectedAirlines
                return flight.airlineValue && debouncedSelectedAirlines.includes(flight.airlineValue)
              })
              console.log(`🔍 Filtered ${filteredFlights.length} flights from ${transformedFlights.length} total (selected: ${debouncedSelectedAirlines.join(', ')})`)
            }

            setFlights(filteredFlights)
            setLoading(false)
          } else {
            throw new Error('Flight prices API not available')
          }
        }
      } catch (err: any) {
        // Don't update state if request was aborted
        if (abortController.signal.aborted || !isMountedRef.current) {
          return
        }

        // Don't log rate limit errors as they're expected
        if (!err.message?.includes('429')) {
          console.error('❌ Error loading flights:', err)
          console.error('Error details:', {
            origin: debouncedSearchParams.origin,
            destination: debouncedSearchParams.destination,
            startDate: debouncedSearchParams.startDate,
            useMock,
            errorMessage: err.message,
          })
        }
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลเที่ยวบิน')
        // Fallback to empty array
        setFlights([])
      } finally {
        // Only update loading state if not aborted
        if (!abortController.signal.aborted && isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadFlights()
  }, [debouncedSearchParams, debouncedSelectedAirlines, useMock, propFlightPrices])  // ✅ เพิ่ม propFlightPrices ใน dependency

  if (!searchParams) {
    return null
  }

  const passengerCount = searchParams.passengerCount || 1

  // หาราคาที่ถูกที่สุดจากเที่ยวบินทั้งหมด
  const cheapestPrice = flights.length > 0
    ? Math.min(...flights.map(flight => flight.price))
    : 0

  // Group flights by airline (สำหรับแสดงจำนวนเที่ยวบิน)
  const flightsByAirline: Record<string, Flight[]> = {}
  flights.forEach(flight => {
    if (!flightsByAirline[flight.airline]) {
      flightsByAirline[flight.airline] = []
    }
    flightsByAirline[flight.airline].push(flight)
  })

  // เรียงลำดับเที่ยวบินตามราคา (ถูกที่สุดก่อน)
  const sortedFlights = [...flights].sort((a, b) => a.price - b.price)

  // Get flight count for each airline
  const getFlightCount = (airlineValue: string): number => {
    const airline = THAI_AIRLINES.find(a => a.value === airlineValue)
    if (!airline) return 0
    return flightsByAirline[airline.label]?.length || 0
  }

  const toggleAirline = (airlineValue: string) => {
    if (!onAirlinesChange) return
    const newSelected = selectedAirlines.includes(airlineValue)
      ? selectedAirlines.filter(a => a !== airlineValue)
      : [...selectedAirlines, airlineValue]
    onAirlinesChange(newSelected)
  }

  const selectAllAirlines = () => {
    if (!onAirlinesChange) return
    onAirlinesChange(THAI_AIRLINES.map(a => a.value))
  }

  const deselectAllAirlines = () => {
    if (!onAirlinesChange) return
    onAirlinesChange([])
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
      <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {'เที่ยวบินตามสายการบิน'}
      </h3>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Sidebar - Airline Selection */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card className="p-4">
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">{'สายการบิน'}</h4>
              <div className="space-y-3">
                {THAI_AIRLINES.map((airline) => {
                  const flightCount = getFlightCount(airline.value)
                  const airlineImage = getAirlineImage(airline.label)
                  return (
                    <div key={airline.value} className="flex items-center space-x-2 min-h-[2.5rem]">
                      <Checkbox
                        id={airline.value}
                        checked={selectedAirlines.includes(airline.value)}
                        onCheckedChange={() => toggleAirline(airline.value)}
                      />
                      <label
                        htmlFor={airline.value}
                        className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <img
                          src={airlineImage}
                          alt={airline.label}
                          className="w-6 h-6 object-cover flex-shrink-0 rounded-full bg-muted"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (!target.src.endsWith('/placeholder-logo.png')) {
                              target.src = `${basePath}/placeholder-logo.png`
                            }
                          }}
                        />
                        <span>{airline.label}</span>
                        {flightCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            ({flightCount})
                          </span>
                        )}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={selectAllAirlines}
                className="text-xs text-primary hover:underline"
              >
                {'เลือกทั้งหมด'}
              </button>
              <span className="text-xs text-muted-foreground">|</span>
              <button
                onClick={deselectAllAirlines}
                className="text-xs text-primary hover:underline"
              >
                {'ยกเลิกทั้งหมด'}
              </button>
            </div>
          </Card>
        </div>

        {/* Main Content - Flights */}
        <div className="flex-1 min-w-0">
          <Card className="p-4 sm:p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูลเที่ยวบิน...</span>
              </div>
            )}

            {error && (
              <div className="py-8 text-center text-destructive">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && sortedFlights.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <p>ไม่พบเที่ยวบินสำหรับเส้นทางนี้</p>
              </div>
            )}

            {!loading && !error && sortedFlights.length > 0 && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {sortedFlights.map((flight, index) => {
                  const airlineImage = getAirlineImage(flight.airline)
                  const isCheapest = flight.price === cheapestPrice && cheapestPrice > 0
                  const departureTimeFormatted = formatTime(flight.departureTime)
                  const arrivalTimeFormatted = formatTime(flight.arrivalTime)
                  const thaiDate = formatThaiDate(flight.date)

                  return (
                    <div
                      key={`${flight.airline}-${flight.flightNumber}-${index}`}
                      className="relative bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
                    >
                      {/* Top Section: Badges and Flight Info */}
                      <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                        {isCheapest && (
                          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 shadow-md">
                            ⭐ ราคาถูกที่สุด
                          </Badge>
                        )}
                        {flight.often_delayed && (
                          <Badge className="bg-red-500 text-white text-xs font-semibold px-2 py-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            มักล่าช้า
                          </Badge>
                        )}
                        <span className="font-bold text-sm sm:text-base text-gray-900">{flight.flightNumber}</span>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {flight.duration}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${flight.stops === 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {flight.stops === 0 ? 'บินตรง' : `${flight.stops} ต่อ`}
                        </Badge>
                        {flight.airplane && (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
                            <Plane className="w-3 h-3" />
                            {flight.airplane}
                          </Badge>
                        )}
                      </div>

                      {/* Main Content */}
                      <div className="space-y-4">
                        {/* Flight Route Section */}
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Airline Logo */}
                          <div className="flex-shrink-0">
                            <img
                              src={airlineImage}
                              alt={flight.airline}
                              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-full bg-gray-50 border-2 border-gray-100 shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                if (!target.src.endsWith('/placeholder-logo.png')) {
                                  target.src = `${basePath}/placeholder-logo.png`
                                }
                              }}
                            />
                          </div>

                          {/* Route Info */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-900">
                                <span className="text-lg sm:text-xl font-bold text-primary">
                                  {departureTimeFormatted}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="text-base sm:text-lg font-bold text-gray-700">
                                  {arrivalTimeFormatted}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>ถึงเวลา {arrivalTimeFormatted}</span>
                              </div>
                            </div>

                            <div className="text-xs sm:text-sm text-gray-700 mb-2">
                              <span className="font-semibold uppercase text-primary">
                                {flight.originAirportCode || airportCodes[searchParams.origin] || searchParams.origin}
                              </span>
                              <span className="mx-1 text-gray-400">→</span>
                              <span className="font-semibold uppercase text-primary">
                                {flight.destinationAirportCode || airportCodes[searchParams.destination] || searchParams.destination}
                              </span>
                              <span className="text-gray-500 ml-1 hidden sm:inline">
                                {/* ({searchParams.originName} → {searchParams.destinationName}) */}
                                ({(flight as any).originNameTH || searchParams.originName} → {(flight as any).destinationNameTH || searchParams.destinationName})
                              </span>
                            </div>

                            <div className="text-[10px] text-gray-400 mb-2 truncate">
                              {(flight as any).originAirportNameTH} → {(flight as any).destinationAirportNameTH}
                            </div>

                            {/* Additional Info */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="font-medium">{thaiDate}</span>
                              </div>
                              {flight.carbon_emissions && (
                                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded-md">
                                  <Leaf className="w-3.5 h-3.5" />
                                  <span className="font-medium">{flight.carbon_emissions} kg CO₂</span>
                                </div>
                              )}
                              {flight.legroom && (
                                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                  <span className="font-medium">ที่นั่ง: {flight.legroom}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price and Action Section */}
                        <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">
                              {searchParams.tripType === 'one-way' ? 'เที่ยวเดียว' : 'ไป-กลับ'}
                              {searchParams.passengerCount && searchParams.passengerCount > 1 && (
                                <span> • {searchParams.passengerCount} คน</span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-3xl font-bold text-primary">
                                ฿{typeof flight.price === 'number' ? flight.price.toLocaleString() : '-'}
                              </span>
                              {searchParams.passengerCount && searchParams.passengerCount > 1 && (
                                <span className="text-sm text-gray-500">
                                  / {Math.round(flight.price / searchParams.passengerCount).toLocaleString()} ต่อคน
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="lg"
                            className="px-6 sm:px-8 h-12 sm:h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                            onClick={() => {
                              console.log('Booking flight:', flight)
                            }}
                          >
                            เลือกเที่ยวบิน
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}


