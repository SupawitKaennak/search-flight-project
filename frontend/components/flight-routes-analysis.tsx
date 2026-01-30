'use client'

import { useState, useEffect } from 'react'
import { Plane, Calendar as CalendarIcon, Search, Send, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { DestinationSelect } from '@/components/destination-select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Mock: รายการเส้นทางสายการบิน (ใช้แสดงใต้กราฟ)
const mockRoutes = [
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Perth', arrivalCode: 'PER', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Paris', arrivalCode: 'CDG', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Copenhagen', arrivalCode: 'CPH', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'London', arrivalCode: 'LHR', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Nagoya', arrivalCode: 'NGO', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Oslo', arrivalCode: 'OSL', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Stockholm', arrivalCode: 'ARN', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Singapore', arrivalCode: 'SIN', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Tokyo', arrivalCode: 'NRT', direct: true, airlineCode: 'TG' },
  { departureName: 'Suvarnabhumi Airport', departureCode: 'BKK', arrivalCity: 'Sydney', arrivalCode: 'SYD', direct: true, airlineCode: 'TG' },
]

// Mock data: daily flight count - เส้นหลัก (departure หรือ arrival ตามที่ผู้ใช้เลือก)
const mockDailyData = [
  { day: 1, date: '1 มี.ค.', flights: 8 },
  { day: 2, date: '2 มี.ค.', flights: 12 },
  { day: 3, date: '3 มี.ค.', flights: 15 },
  { day: 4, date: '4 มี.ค.', flights: 11 },
  { day: 5, date: '5 มี.ค.', flights: 14 },
  { day: 6, date: '6 มี.ค.', flights: 18 },
  { day: 7, date: '7 มี.ค.', flights: 22 },
  { day: 8, date: '8 มี.ค.', flights: 16 },
  { day: 9, date: '9 มี.ค.', flights: 13 },
  { day: 10, date: '10 มี.ค.', flights: 10 },
]

// Mock data: เส้นเปรียบเทียบ (arrival หรือ departure ฝั่งตรงข้าม)
const mockDailyDataCompare = [
  { day: 1, date: '1 มี.ค.', flightsCompare: 6 },
  { day: 2, date: '2 มี.ค.', flightsCompare: 10 },
  { day: 3, date: '3 มี.ค.', flightsCompare: 12 },
  { day: 4, date: '4 มี.ค.', flightsCompare: 14 },
  { day: 5, date: '5 มี.ค.', flightsCompare: 11 },
  { day: 6, date: '6 มี.ค.', flightsCompare: 16 },
  { day: 7, date: '7 มี.ค.', flightsCompare: 19 },
  { day: 8, date: '8 มี.ค.', flightsCompare: 14 },
  { day: 9, date: '9 มี.ค.', flightsCompare: 11 },
  { day: 10, date: '10 มี.ค.', flightsCompare: 8 },
]

const chartConfig = {
  flights: {
    label: 'จำนวนเที่ยวบิน',
    color: 'hsl(221, 83%, 53%)',
  },
  flightsCompare: {
    label: 'เปรียบเทียบ',
    color: 'hsl(142, 76%, 36%)',
  },
}

const summaryDefaults = {
  avgFlightsPerDay: 12,
  peakHourRange: '08:00 - 10:00',
  mostActiveCarrier: 'Thai Airways',
  totalFlights: 360,
}

export function FlightRoutesAnalysis() {
  const [origin, setOrigin] = useState('')
  const [originName, setOriginName] = useState('')
  const [destination, setDestination] = useState('')
  const [destinationName, setDestinationName] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date())
  const [chartDays, setChartDays] = useState<7 | 30>(30)
  const [compareMode, setCompareMode] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  // ค้นหาอัตโนมัติเมื่อเลือก/สลับ departure หรือ arrival (เปลี่ยนเมื่อไหร่ก็ค้นหาใหม่)
  useEffect(() => {
    if (origin || destination) {
      setHasAnalyzed(true)
    } else {
      setHasAnalyzed(false)
    }
  }, [origin, destination])

  const baseData = chartDays === 7 ? mockDailyData.slice(0, 7) : mockDailyData
  const compareBaseData = chartDays === 7 ? mockDailyDataCompare.slice(0, 7) : mockDailyDataCompare
  const displayData = compareMode
    ? baseData.map((row, i) => ({ ...row, flightsCompare: compareBaseData[i]?.flightsCompare ?? 0 }))
    : baseData

  const isDeparture = !!origin
  const mainLabel = isDeparture ? 'ออกจากสนามบิน (Departure)' : 'มาถึงสนามบิน (Arrival)'
  const compareLabel = isDeparture ? 'มาถึงสนามบิน (Arrival)' : 'ออกจากสนามบิน (Departure)'

  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">
        เส้นทางการบิน
      </h1>

      {/* Filter bar - responsive: stack on mobile */}
      <Card className="p-3 sm:p-6 border bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2 min-w-0">
            <Label className="text-sm font-medium text-muted-foreground">
              สนามบินต้นทาง (Departure)
            </Label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <DestinationSelect
                value={origin}
                onChange={(value, name) => {
                  setOrigin(value)
                  setOriginName(name)
                  if (value) {
                    setDestination('')
                    setDestinationName('')
                  }
                }}
                placeholder="เลือกสนามบินต้นทาง"
                excludeCode={destination || undefined}
                className="pl-9"
                disabled={!!destination}
              />
            </div>
          </div>
          <div className="space-y-2 min-w-0">
            <Label className="text-sm font-medium text-muted-foreground">
              สนามบินปลายทาง (Arrival)
            </Label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <DestinationSelect
                value={destination}
                onChange={(value, name) => {
                  setDestination(value)
                  setDestinationName(name)
                  if (value) {
                    setOrigin('')
                    setOriginName('')
                  }
                }}
                placeholder="เลือกสนามบินปลายทาง"
                excludeCode={origin || undefined}
                className="pl-9"
                disabled={!!origin}
              />
            </div>
          </div>
          <div className="space-y-2 min-w-0">
            <Label className="text-sm font-medium text-muted-foreground">
              เลือกวันที่
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-12 sm:h-14',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'เลือกวันที่'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  defaultMonth={selectedDate}
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* Empty state - responsive mobile */}
      {!hasAnalyzed && (
        <Card className="p-8 sm:p-12 md:p-16 border bg-card rounded-xl shadow-sm">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4 sm:mb-6">
              <Search className="w-7 h-7 sm:w-10 sm:h-10 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-2 px-1">
              กรุณาเลือกสนามบินต้นทางหรือปลายทางเพื่อดูเส้นทางการบิน
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-0 sm:block px-1">
              <span className="block sm:inline">เลือก Departure เพื่อดูเส้นทางที่ออกจากสนามบิน</span>
              <span className="hidden sm:inline"> | </span>
              <span className="block sm:inline">เลือก Arrival เพื่อดูเส้นทางที่มาถึงสนามบิน</span>
            </p>
          </div>
        </Card>
      )}

      {/* Chart + Summary + รายการเส้นทาง - แสดงหลังกดวิเคราะห์ข้อมูล */}
      {hasAnalyzed && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
        {/* Left column: กราฟ + รายการเส้นทาง */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6 min-w-0">
        {/* Daily frequency chart - responsive */}
        <Card className="p-3 sm:p-6 border min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              สถิติความถี่เที่ยวบินรายวัน
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border bg-muted/30 p-0.5">
                <Button
                  variant={chartDays === 7 ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-md h-8 px-2.5 sm:px-3 text-xs sm:text-sm min-w-[52px] sm:min-w-0"
                  onClick={() => setChartDays(7)}
                >
                  7 วัน
                </Button>
                <Button
                  variant={chartDays === 30 ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-md h-8 px-2.5 sm:px-3 text-xs sm:text-sm min-w-[52px] sm:min-w-0"
                  onClick={() => setChartDays(30)}
                >
                  30 วัน
                </Button>
              </div>
              <Button
                variant={compareMode ? 'default' : 'ghost'}
                size="sm"
                className="rounded-lg border h-8 px-2.5 sm:px-3 text-xs sm:text-sm"
                onClick={() => setCompareMode((prev) => !prev)}
              >
                เปรียบเทียบ
              </Button>
            </div>
          </div>
          <div className="w-full min-w-0 overflow-x-auto -mx-1 px-1">
            <div className="h-[260px] sm:h-[320px] min-w-[280px] [&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:!w-full">
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <defs>
                  <linearGradient id="flightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="flightCompareGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => `${v}`}
                  label={{ value: 'จำนวนเที่ยวบิน (เที่ยว)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  width={45}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 shadow-sm min-w-[140px]">
                        <p className="font-medium mb-2">{p.date}</p>
                        <p className="text-sm" style={{ color: 'hsl(221, 83%, 53%)' }}>
                          {mainLabel}: {p.flights} เที่ยว
                        </p>
                        {compareMode && (
                          <p className="text-sm mt-1" style={{ color: 'hsl(142, 76%, 36%)' }}>
                            {compareLabel}: {p.flightsCompare ?? 0} เที่ยว
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="flights"
                  name={mainLabel}
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  fill="url(#flightGradient)"
                />
                {compareMode && (
                  <Area
                    type="monotone"
                    dataKey="flightsCompare"
                    name={compareLabel}
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    fill="url(#flightCompareGradient)"
                  />
                )}
              </AreaChart>
            </ChartContainer>
            </div>
          </div>
          {compareMode && (
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-primary shrink-0" />
                <span className="truncate">{mainLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-emerald-600 shrink-0" />
                <span className="truncate">{compareLabel}</span>
              </span>
            </div>
          )}
        </Card>

        {/* รายการเส้นทางสายการบิน - ใต้กราฟ */}
        <Card className="p-3 sm:p-6 border min-w-0 overflow-hidden">
          <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            {origin
              ? `เส้นทางการบินที่ออกจาก ${originName || origin} (${mockRoutes.length} เส้นทาง)`
              : `เส้นทางการบินที่มาถึง ${destinationName || destination} (${mockRoutes.length} เส้นทาง)`}
          </h2>
          <ScrollArea className="h-[280px] sm:h-[320px] w-full rounded-md border bg-muted/20">
            <div className="p-1 space-y-2">
              {mockRoutes.map((route, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-background border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">
                        {route.departureName} → {route.arrivalCity}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{route.departureCode} → {route.arrivalCode}</span>
                        {route.direct && (
                          <span className="text-emerald-600 font-medium">Direct</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">สายการบิน</p>
                    <p className="text-sm font-bold text-primary">{route.airlineCode}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
        </div>

        {/* Right: Summary - responsive */}
        <Card className="p-3 sm:p-6 border min-w-0">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              สรุปข้อมูลเส้นทาง
            </h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/40 border">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                จำนวนเที่ยวบินเฉลี่ย/วัน
              </p>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                {summaryDefaults.avgFlightsPerDay} เที่ยว
              </p>
              <p className="text-xs text-muted-foreground mt-1">อ้างอิงข้อมูลช่วงที่เลือก</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/40 border">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                ช่วงเวลาที่คนนิยมที่สุด
              </p>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                {summaryDefaults.peakHourRange}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Peak Hour Range</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/40 border">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                สายการบินที่มีเที่ยวบินสูงสุด
              </p>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                {summaryDefaults.mostActiveCarrier}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Most Active Carrier</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/40 border">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                รวมจำนวนเที่ยวบินทั้งหมด
              </p>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                {summaryDefaults.totalFlights} เที่ยว
              </p>
              <p className="text-xs text-muted-foreground mt-1">ตามช่วงเวลาที่เลือก</p>
            </div>
          </div>
        </Card>
      </div>
      )}
    </div>
  )
}
