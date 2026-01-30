'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// Thai day abbreviations
const thaiDays = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']
const thaiDaysFull = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']

// Thai month abbreviations
const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

interface DayOfWeekData {
  day: string // 'จ.', 'อ.', etc.
  dayFull: string // 'จันทร์', 'อังคาร', etc.
  averagePrice: number
}

interface MonthData {
  month: string // 'ม.ค.', 'ก.พ.', etc.
  monthIndex: number // 0-11
  averagePrice: number
}

interface PriceStatisticsChartsProps {
  dayOfWeekData: DayOfWeekData[]
  monthData: MonthData[]
  originName: string
  destinationName: string
  loading?: boolean
  startDate?: Date | null // เพิ่ม startDate เพื่อใช้คำนวณวันที่จริง
  flightPrices?: Array<{ // เพิ่ม flightPrices เพื่อหาวันที่จริงที่ตรงกับวันนั้นๆ
    departure_date: Date | string
    price: number
  }> | null
}

// Custom tooltip for day of week chart
const DayTooltip = ({ active, payload, startDate, flightPrices }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    
    // หาวันที่จริงที่ตรงกับวันนั้นๆ จาก flightPrices หรือคำนวณจาก startDate
    let dateText = data.dayFull
    let foundDate: Date | null = null
    
    // ลองหาวันที่จริงจาก flightPrices ก่อน
    if (flightPrices && flightPrices.length > 0) {
      // dayOrder: [1, 2, 3, 4, 5, 6, 0] = [จันทร์, อังคาร, พุธ, พฤหัสบดี, ศุกร์, เสาร์, อาทิตย์]
      const dayOrder = [1, 2, 3, 4, 5, 6, 0] // Monday to Sunday
      const thaiDaysFull = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']
      const dayIndex = thaiDaysFull.indexOf(data.dayFull)
      
      if (dayIndex !== -1) {
        const targetDayOfWeek = dayOrder[dayIndex] // 0-6 (0=Sunday, 1=Monday, etc.)
        
        // หาวันที่แรกที่ตรงกับวันนั้นๆ ใน flightPrices
        for (const fp of flightPrices) {
          const fpDate = fp.departure_date instanceof Date 
            ? fp.departure_date 
            : new Date(fp.departure_date)
          const fpDayOfWeek = fpDate.getDay() // 0-6
          
          if (fpDayOfWeek === targetDayOfWeek) {
            foundDate = fpDate
            break
          }
        }
      }
    }
    
    // ถ้าไม่เจอจาก flightPrices ให้คำนวณจาก startDate
    if (!foundDate && startDate) {
      const dayOrder = [1, 2, 3, 4, 5, 6, 0] // Monday to Sunday
      const thaiDaysFull = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']
      const dayIndex = thaiDaysFull.indexOf(data.dayFull)
      
      if (dayIndex !== -1) {
        const targetDayOfWeek = dayOrder[dayIndex] // 0-6 (0=Sunday, 1=Monday, etc.)
        const currentDayOfWeek = startDate.getDay() // 0-6
        let daysToAdd = targetDayOfWeek - currentDayOfWeek
        
        // ถ้าวันที่เป้าหมายอยู่ก่อนวันปัจจุบัน ให้ไปหาสัปดาห์ถัดไป
        if (daysToAdd <= 0) {
          daysToAdd += 7
        }
        
        foundDate = new Date(startDate)
        foundDate.setDate(foundDate.getDate() + daysToAdd)
      }
    }
    
    // แสดงวันที่แบบเต็มถ้าเจอ
    if (foundDate) {
      const day = foundDate.getDate()
      const month = thaiMonths[foundDate.getMonth()]
      const year = foundDate.getFullYear()
      dateText = `วัน${data.dayFull}ที่ ${day} ${month} ${year}`
    }
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 sm:p-4">
        <p className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{dateText}</p>
        <p className="text-blue-600 font-bold text-lg sm:text-xl">
          ฿{data.averagePrice.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

// Custom tooltip for month chart
const MonthTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-800 mb-1">{thaiMonths[data.monthIndex]}</p>
        <p className="text-blue-600 font-bold">
          ฿{data.averagePrice.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

export function PriceStatisticsCharts({
  dayOfWeekData,
  monthData,
  originName,
  destinationName,
  loading = false,
  startDate,
  flightPrices,
}: PriceStatisticsChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">กำลังโหลด...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">กำลังโหลด...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dayOfWeekData || dayOfWeekData.length === 0 || !monthData || monthData.length === 0) {
    return null
  }

  // Find cheapest and most expensive day
  const cheapestDay = dayOfWeekData.reduce((min, day) => 
    day.averagePrice < min.averagePrice ? day : min
  )
  const mostExpensiveDay = dayOfWeekData.reduce((max, day) => 
    day.averagePrice > max.averagePrice ? day : max
  )

  // Find cheapest and most expensive month
  const cheapestMonth = monthData.reduce((min, month) => 
    month.averagePrice < min.averagePrice ? month : min
  )
  const mostExpensiveMonth = monthData.reduce((max, month) => 
    month.averagePrice > max.averagePrice ? month : max
  )

  // Prepare data for charts
  const dayChartData = dayOfWeekData.map(day => ({
    ...day,
    name: day.day,
  }))

  const monthChartData = monthData
    .sort((a, b) => a.monthIndex - b.monthIndex)
    .map(month => ({
      ...month,
      name: month.month,
    }))

  // Calculate Y-axis domain for day chart
  const dayPrices = dayOfWeekData.map(d => d.averagePrice)
  const dayMin = Math.min(...dayPrices)
  const dayMax = Math.max(...dayPrices)
  const dayPadding = (dayMax - dayMin) * 0.1
  const dayDomain = [Math.max(0, dayMin - dayPadding), dayMax + dayPadding]

  // Calculate Y-axis domain for month chart
  const monthPrices = monthData.map(m => m.averagePrice)
  const monthMin = Math.min(...monthPrices)
  const monthMax = Math.max(...monthPrices)
  const monthPadding = (monthMax - monthMin) * 0.1
  const monthDomain = [Math.max(0, monthMin - monthPadding), monthMax + monthPadding]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Day of Week Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            วันที่ถูกที่สุดในการบินจาก {originName} ไป {destinationName} คือวันไหน?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-gray-600">
            {cheapestDay && mostExpensiveDay && (
              <p>
                หากวันบินของคุณมีความยืดหยุ่น คุณควรพิจารณาบินใน{' '}
                <span className="font-bold text-orange-600">{cheapestDay.dayFull}</span>{' '}
                เนื่องจากโดยทั่วไปแล้วเราพบอัตราค่าโดยสารที่ถูกที่สุดสำหรับเส้นทางนี้ (เฉลี่ย ฿{cheapestDay.averagePrice.toLocaleString()}){' '}
                ในทางกลับกัน{' '}
                <span className="font-bold text-red-600">{mostExpensiveDay.dayFull}</span>{' '}
                เป็นวันที่แพงที่สุด
              </p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
                tickFormatter={(value) => `THB ${(value / 1000).toFixed(1)}k`}
                domain={dayDomain}
              />
              <Tooltip content={<DayTooltip startDate={startDate} flightPrices={flightPrices} />} />
              <Bar dataKey="averagePrice" radius={[8, 8, 0, 0]}>
                {dayChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.day === cheapestDay?.day ? '#f97316' : entry.day === mostExpensiveDay?.day ? '#ef4444' : '#3b82f6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Month Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            เดือนไหนถูกที่สุดที่จะบินจาก {originName} ไป {destinationName}?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-gray-600">
            {cheapestMonth && mostExpensiveMonth && (
              <p>
                เดือนที่ถูกที่สุดสำหรับเที่ยวบินนี้คือ{' '}
                <span className="font-bold text-orange-600">{thaiMonths[cheapestMonth.monthIndex]}</span>{' '}
                โดยมีค่าใช้จ่ายเฉลี่ย ฿{cheapestMonth.averagePrice.toLocaleString()}{' '}
                ในทางกลับกัน เดือนที่แพงที่สุดคือ{' '}
                <span className="font-bold text-red-600">{thaiMonths[mostExpensiveMonth.monthIndex]}</span>{' '}
                (฿{mostExpensiveMonth.averagePrice.toLocaleString()})
              </p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
                tickFormatter={(value) => `THB ${(value / 1000).toFixed(1)}k`}
                domain={monthDomain}
              />
              <Tooltip content={<MonthTooltip />} />
              <Area 
                type="monotone" 
                dataKey="averagePrice" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#priceGradient)" 
              />
              <Line 
                type="monotone" 
                dataKey="averagePrice" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
