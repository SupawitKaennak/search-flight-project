import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FlightRoutesAnalysis } from '@/components/flight-routes-analysis'

export const metadata = {
  title: 'เส้นทางการบิน | Flight Search',
  description: 'วิเคราะห์เส้นทางการบิน สถิติความถี่เที่ยวบินรายวัน และสรุปข้อมูลเส้นทาง',
}

export default function FlightRoutesPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Header />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 flex-1 w-full max-w-full">
        <FlightRoutesAnalysis />
      </div>
      <Footer />
    </main>
  )
}
