# Flight Search Frontend

เว็บแอปสำหรับค้นหาและวิเคราะห์ราคาตั๋วเครื่องบิน ทำงานร่วมกับ Backend API (Flight Search Backend)

## Features

- ค้นหาเที่ยวบิน (ต้นทาง–ปลายทาง, วันที่, ประเภทเที่ยว)
- วิเคราะห์ราคาตามฤดูกาล (low / normal / high จาก `price_level`)
- กราฟและ timeline ราคา
- แนะนำช่วงเวลาที่ดีที่สุดและเปรียบเทียบราคา
- ค้นหาสนามบินและเลือกสายการบิน
- ปลายทางยอดนิยมและสถิติการค้นหา

## Tech Stack

- **Next.js 16** — React Framework
- **React 19** — UI
- **TypeScript 5**
- **Tailwind CSS 4** — Styling
- **Radix UI** — Headless components
- **Lucide React** — Icons
- **Recharts** — กราฟ
- **React Hook Form + Zod** — Form และ validation
- **date-fns, react-day-picker** — วันที่
- **next-themes, sonner** — Theme และ toast

## Prerequisites

- Node.js 18+
- Backend API รันที่ `http://localhost:3001` (ดู [backend/README.md](../backend/README.md))

## Installation

### 1. Clone และเข้าโฟลเดอร์ frontend

```bash
git clone <repository-url>
cd search-flight-27/frontend
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. Environment (ถ้าต้องการเปลี่ยน API URL)

สร้าง `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

ค่าเริ่มต้นของแอปใช้ URL นี้อยู่แล้ว ถ้า backend รันที่ port อื่นให้แก้ตรงนี้

### 4. รัน Development

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## Scripts

| Script | คำอธิบาย |
|--------|----------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Build สำหรับ production |
| `npm run start` | รัน production (ต้อง `build` ก่อน) |
| `npm run lint` | ESLint |

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx            # หน้าหลักค้นหาและวิเคราะห์
│   └── flight-routes/      # หน้าเส้นทางเที่ยวบิน
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── flight-search-form.tsx
│   ├── price-analysis.tsx
│   ├── seasonal-breakdown.tsx
│   ├── price-chart.tsx
│   ├── popular-destinations.tsx
│   ├── destination-select.tsx
│   ├── flight-routes-analysis.tsx
│   ├── header.tsx, footer.tsx
│   └── ...
├── lib/                    # Utilities และ API client
│   ├── api/                # flight-api, airport-api, airline-api, destination-api, statistics-api
│   ├── services/
│   ├── hooks/
│   └── utils.ts
├── hooks/                  # use-mobile, use-toast
├── services/               # API services, mock data, constants
├── public/                 # Static assets
├── package.json
├── next.config.mjs
├── tsconfig.json
└── README.md
```

## การใช้งาน (สรุป)

1. เปิด `http://localhost:3000`
2. เลือกต้นทาง/ปลายทาง (จังหวัดหรือสนามบิน)
3. เลือกวันที่ไป–กลับ และประเภทเที่ยว (ไป–กลับ / เที่ยวเดียว)
4. เลือกสายการบิน (ถ้าต้องการ) แล้วกดค้นหา
5. ดูผลการวิเคราะห์: ฤดูกาล, กราฟราคา, วันที่แนะนำ, รายการเที่ยวบิน

ต้นทาง/ปลายทางและสายการบินมาจาก Backend API และข้อมูลใน DB

## Configuration

- **เปลี่ยน Port:** ใน `package.json` แก้ script `dev` เป็น `next dev -p 3001` (หรือ port ที่ต้องการ)
- **API URL:** ตั้งใน `.env.local` เป็น `NEXT_PUBLIC_API_URL=http://localhost:3001/api` (หรือ URL ของ backend)

## Documentation

- [docs/01-GETTING-STARTED.md](../docs/01-GETTING-STARTED.md) — เริ่มต้นทั้งโปรเจค
- [docs/03-SYSTEM-DOCUMENTATION.md](../docs/03-SYSTEM-DOCUMENTATION.md) — API และสถาปัตยกรรม
- [backend/README.md](../backend/README.md) — Backend API

## License

Private / Educational
