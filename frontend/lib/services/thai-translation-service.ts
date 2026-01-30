/**
 * Thai Translation Service
 * Provides helper functions to translate flight-related information to Thai.
 */

import {
    AIRPORT_TRANSLATIONS,
    CITY_TRANSLATIONS,
    COUNTRY_TRANSLATIONS,
    THAI_SEARCH_MAPPING
} from '@/services/data/thai-translation-data'

/**
 * Translate airport code to Thai name
 */
export function translateAirport(code: string, fallback?: string): string {
    if (!code) return fallback || ''
    const upperCode = code.toUpperCase()
    return AIRPORT_TRANSLATIONS[upperCode] || fallback || code
}

/**
 * Translate city name to Thai
 */
export function translateCity(city: string): string {
    if (!city) return ''
    return CITY_TRANSLATIONS[city] || city
}

/**
 * Translate country name to Thai
 */
export function translateCountry(country: string): string {
    if (!country) return ''
    return COUNTRY_TRANSLATIONS[country] || country
}

/**
 * Detect if string contains Thai characters
 */
export function hasThaiCharacters(text: string): boolean {
    return /[ก-ฮ]/.test(text)
}

/**
 * Map Thai search input to English equivalent for API calls
 */
export function mapThaiInputToEnglish(keyword: string): string {
    if (!keyword) return ''

    // Clean input
    const cleanKeyword = keyword.trim()

    // If it's a Thai search term in our mapping, return English equivalent
    if (THAI_SEARCH_MAPPING[cleanKeyword]) {
        return THAI_SEARCH_MAPPING[cleanKeyword]
    }

    // If it contains Thai characters but not in our simple mapping, 
    // we might need a more complex approach or just return as is (backend might not handle it)
    return cleanKeyword
}

/**
 * Localize an airport object (city, country, name)
 */
export function localizeAirport(airport: any): any {
    if (!airport) return airport

    return {
        ...airport,
        name: translateAirport(airport.code, airport.name),
        city: airport.city ? translateCity(airport.city) : airport.city,
        country_name: airport.country_name ? translateCountry(airport.country_name) : airport.country_name,
        country: airport.country ? translateCountry(airport.country) : airport.country,
    }
}
