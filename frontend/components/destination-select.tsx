'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Plane, Globe, Loader2, X } from 'lucide-react'
import { Airport, airportApi } from '@/lib/api/airport-api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDebouncedCallback } from '@/lib/hooks/use-debounce'
import { localizeAirport, mapThaiInputToEnglish, hasThaiCharacters } from '@/lib/services/thai-translation-service'
import { cn } from '@/lib/utils'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface DestinationSelectProps {
    value: string
    onChange: (value: string, name: string) => void
    placeholder?: string
    className?: string
    error?: string
    excludeCode?: string // Airport code to exclude from results (e.g., the other field's value)
}

export function DestinationSelect({
    value,
    onChange,
    placeholder = 'ค้นหาเมือง หรือ สนามบิน',
    className,
    error,
    excludeCode
}: DestinationSelectProps) {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<Airport[]>([])
    const [popular, setPopular] = useState<Airport[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedName, setSelectedName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)

    // Load popular destinations on mount
    useEffect(() => {
        const loadPopular = async () => {
            try {
                const data = await airportApi.getPopularAirports(8)
                // Localize airports to Thai
                const localizedData = data.map(localizeAirport)
                // Filter out excluded airport code if provided
                const filteredData = excludeCode 
                    ? localizedData.filter(airport => airport.code !== excludeCode)
                    : localizedData
                setPopular(filteredData)
            } catch (err) {
                console.error('Failed to load popular airports', err)
            }
        }
        loadPopular()
    }, [excludeCode])

    // Sync selected name if value changes externally
    useEffect(() => {
        if (!value) {
            setSelectedName('')
            setSearch('')
            return
        }

        const fetchName = async () => {
            try {
                const details = await airportApi.getAirportDetails(value)
                const localized = localizeAirport(details)
                // For Bangkok airports (BKK, DMK), show airport name instead of city
                const isBangkokAirport = localized.code === 'BKK' || localized.code === 'DMK'
                const displayName = isBangkokAirport
                    ? `${localized.name} (${localized.code})`
                    : `${localized.city || localized.name} (${localized.code})`
                setSelectedName(displayName)
            } catch (err) {
                // Fallback if not found
                if (!selectedName) setSelectedName(value)
            }
        }

        if (value && !selectedName.includes(value)) {
            fetchName()
        }
    }, [value])

    const debouncedSearch = useDebouncedCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setResults([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            // const data = await airportApi.searchAirports(query)
            // setResults(data)
            // Map Thai input to English for backend search
            const apiQuery = hasThaiCharacters(query) ? mapThaiInputToEnglish(query) : query
            const data = await airportApi.searchAirports(apiQuery)
            // Filter out excluded airport code if provided
            const filteredData = excludeCode 
                ? data.filter(airport => airport.code !== excludeCode)
                : data
            setResults(filteredData.map(localizeAirport))
        } catch (err) {
            console.error('Search failed', err)
            setResults([])
        } finally {
            setIsLoading(false)
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setSearch(val)
        debouncedSearch(val)
        // Open popover when typing
        if (!isPopoverOpen) {
            setIsPopoverOpen(true)
        }
    }

    const handleSelect = (airport: Airport) => {
        // For Bangkok airports (BKK, DMK), show airport name instead of city
        const isBangkokAirport = airport.code === 'BKK' || airport.code === 'DMK'
        const displayName = isBangkokAirport 
            ? `${airport.name} (${airport.code})`
            : `${airport.city || airport.name} (${airport.code})`
        setSelectedName(displayName)
        setSearch('')
        setIsPopoverOpen(false)
        onChange(airport.code, displayName)
    }

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setSelectedName('')
        setSearch('')
        onChange('', '')
        setResults([])
        if (inputRef.current) {
            inputRef.current.focus()
            setIsPopoverOpen(true)
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsPopoverOpen(open)
        // When closing, reset search if nothing was selected
        if (!open && !value) {
            setSearch('')
        }
    }

    // Helper to group airports by country
    const groupAirportsByCountry = (airports: Airport[]) => {
        return airports.reduce((acc, airport) => {
            const country = airport.country_name || 'ประเทศอื่นๆ'
            if (!acc[country]) acc[country] = []
            acc[country].push(airport)
            return acc
        }, {} as Record<string, Airport[]>)
    }

    const groupedPopular = groupAirportsByCountry(popular)
    const groupedResults = groupAirportsByCountry(results)

    return (
        <div className={cn("relative w-full", className)}>
            <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <div
                        className={cn(
                            "relative flex items-center bg-white border rounded-md transition-all h-12 sm:h-14 overflow-hidden cursor-pointer",
                            error ? "border-red-500 ring-1 ring-red-500/20" : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10",
                            isPopoverOpen && "border-blue-500 ring-2 ring-blue-500/10 shadow-md"
                        )}
                    // onClick={() => {
                    //   // Focus input when clicking the container
                    //   if (inputRef.current) {
                    //     inputRef.current.focus()
                    //   }
                    //   setIsPopoverOpen(true)
                    // }}
                    >
                        <div className="absolute left-3 flex items-center justify-center">
                            <MapPin className={cn("h-5 w-5 transition-colors", isPopoverOpen ? "text-blue-500" : "text-gray-400")} />
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 w-full min-w-0 bg-transparent border-none focus:ring-0 pl-11 pr-10 text-sm sm:text-base h-full placeholder:text-gray-400 outline-none font-medium text-left"
                            placeholder={placeholder}
                            value={search || (isPopoverOpen ? search : selectedName)}
                            onChange={handleSearchChange}
                            //   onFocus={() => setIsPopoverOpen(true)}
                            autoComplete="off"
                            readOnly={false}
                        />

                        {(selectedName || search) && (
                            <button
                                onClick={clearSelection}
                                className="absolute right-2 p-1.5 hover:bg-blue-50 rounded-full transition-colors z-10"
                                type="button"
                            >
                                <X className="h-4 w-4 text-blue-600 font-bold" />
                            </button>
                        )}
                    </div>
                </PopoverTrigger>

                <PopoverContent
                    className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[320px] sm:min-w-[520px] overflow-hidden shadow-2xl border-gray-200 z-[100] bg-white"
                    align="start"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus when opening
                    onCloseAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus when closing
                >
                    <ScrollArea className="max-h-[450px] [&>[data-slot=scroll-area-viewport]]:max-h-[450px]">
                        {isLoading ? (
                            <div className="p-12 flex flex-col items-center justify-center text-gray-500 italic">
                                <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-500" />
                                <span className="text-sm">กำลังค้นหาเมืองและสนามบิน...</span>
                            </div>
                        ) : search.length >= 2 && results.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="font-semibold text-gray-700">ไม่พบเมืองหรือสนามบิน</p>
                                <p className="text-sm italic">ลองค้นหาด้วยชื่อประเทศ หรือ รหัสสนามบิน</p>
                            </div>
                        ) : (!search || search.length < 2) ? (
                            <div className="py-2">
                                <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 mb-1 bg-gray-50/50">
                                    <div className="bg-blue-600 p-1.5 rounded-md">
                                        <Plane className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-gray-500 uppercase tracking-widest">เมืองหรือท่าอากาศยานยอดนิยม</span>
                                </div>
                                <div className="px-1">
                                    {popular.length > 0 ? (
                                        Object.entries(groupedPopular).map(([country, airports]) => (
                                            <div key={country} className="mb-4 last:mb-0">
                                                <div className="px-4 py-2.5 text-[12px] font-extrabold text-blue-700 uppercase tracking-[0.15em] bg-blue-50 flex items-center gap-2 mb-2 rounded-md shadow-sm border border-blue-100">
                                                    <Globe className="h-3.5 w-3.5" /> {country}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {airports.map((airport) => (
                                                        <button
                                                            key={airport.code}
                                                            className="w-full text-left px-4 py-4 hover:bg-blue-50 flex items-center gap-4 transition-colors rounded-md group border-b border-gray-50 last:border-0"
                                                            onClick={() => handleSelect(airport)}
                                                            type="button"
                                                        >
                                                            <div className="bg-gray-100 group-hover:bg-blue-100 p-2.5 rounded-full transition-colors shrink-0">
                                                                <Plane className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <span className="font-bold text-sm sm:text-base text-gray-800 truncate group-hover:text-blue-700 transition-colors flex-1">
                                                                        {(airport.code === 'BKK' || airport.code === 'DMK') ? airport.name : airport.city}
                                                                    </span>
                                                                    <span className="text-gray-400 font-bold text-xs sm:text-sm shrink-0 uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                                        {airport.code}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate mt-0.5 group-hover:text-gray-600 transition-colors">
                                                                    {(airport.code === 'BKK' || airport.code === 'DMK') 
                                                                        ? `${airport.city}, ${airport.country_name}`
                                                                        : `${airport.name}, ${airport.country_name}`}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-gray-400 text-sm">
                                            No popular destinations found
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="px-1 py-1">
                                {Object.entries(groupedResults).map(([country, airports]) => (
                                    <div key={country} className="mb-4 last:mb-0">
                                        <div className="px-4 py-2.5 text-[12px] font-extrabold text-blue-700 uppercase tracking-[0.15em] bg-blue-50 flex items-center gap-2 mb-2 rounded-md shadow-sm border border-blue-100">
                                            <Globe className="h-3.5 w-3.5" /> {country}
                                        </div>

                                        <div className="space-y-0.5">
                                            {airports.map((airport) => (
                                                <button
                                                    key={airport.code}
                                                    className="w-full text-left px-4 py-3.5 hover:bg-blue-50 flex items-center gap-4 transition-colors rounded-md group border-b border-gray-50/50 last:border-0"
                                                    onClick={() => handleSelect(airport)}
                                                    type="button"
                                                >
                                                    <div className="bg-gray-100 group-hover:bg-blue-100 p-2.5 rounded-full transition-colors shrink-0">
                                                        <Plane className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="font-bold text-sm sm:text-base text-gray-800 truncate group-hover:text-blue-700 transition-colors flex-1">
                                                                {(airport.code === 'BKK' || airport.code === 'DMK') ? airport.name : (airport.name || airport.city)}
                                                            </span>
                                                            <span className="text-blue-600 font-bold text-xs sm:text-sm shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                                                                {airport.code}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate mt-1 group-hover:text-gray-600 transition-colors">
                                                            {(airport.code === 'BKK' || airport.code === 'DMK')
                                                                ? `${airport.city}, ${airport.country_name}`
                                                                : `${airport.city || airport.name}, ${airport.country_name}`}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            {error && !isPopoverOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1">
                    <div className="absolute -top-1 left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-500" />
                    <div className="bg-red-500 text-white px-4 py-2 rounded text-sm font-medium shadow-md">
                        {error}
                    </div>
                </div>
            )}
        </div>
    )
}