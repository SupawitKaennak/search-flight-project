// Airport API client

import { apiClient } from './client'

export interface Airport {
  id: number
  code: string
  name: string
  city: string | null
  country: string | null
  country_code: string | null
  country_name: string | null
  airport_type: string | null
  latitude: number | null
  longitude: number | null
  created_at?: string
  updated_at?: string
}

export class AirportApi {
  /**
   * Search airports and cities
   */
  async searchAirports(
    keyword: string,
    subType: 'AIRPORT' | 'CITY' = 'AIRPORT'
  ): Promise<Airport[]> {
    return apiClient.get<Airport[]>('/airports/search', {
      keyword,
      subType,
    })
  }

  /**
   * Get popular airports
   */
  async getPopularAirports(limit: number = 10): Promise<Airport[]> {
    return apiClient.get<Airport[]>('/airports/popular', { limit })
  }

  /**
   * Get airport details by code
   */
  async getAirportDetails(code: string): Promise<Airport> {
    return apiClient.get<Airport>(`/airports/${code.toUpperCase()}`)
  }
}

export const airportApi = new AirportApi()

