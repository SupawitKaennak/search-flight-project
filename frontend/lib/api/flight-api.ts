// Flight-specific API calls

import { apiClient } from './client'
import {
  AnalyzeFlightPricesRequest,
  AnalyzeFlightPricesResponse,
  FlightPriceParams,
  FlightPrice,
  CheapestDatesRequest,
  PriceAnalysisRequest,
  PredictPriceRequest,
  PredictPriceResponse,
  PriceTrendRequest,
  PriceTrendResponse,
  PredictPriceRangeRequest,
  PredictPriceRangeResponse,
} from './types'

export interface CheapestDatesResponse {
  cheapestDates: Array<{
    departureDate: string
    returnDate?: string
    price: number
    currency: string
  }>
}

export interface PriceAnalysisResponse {
  price: {
    total: string
    currency: string
  }
  breakdown?: {
    base: string
    taxes: string
    fees: string
  }
  fareDetails?: {
    cabin: string
    fareBasis: string
  }
}

export class FlightApi {
  /**
   * Analyze flight prices based on search parameters
   */
  async analyzeFlightPrices(
    params: AnalyzeFlightPricesRequest,
    signal?: AbortSignal
  ): Promise<AnalyzeFlightPricesResponse> {
    return apiClient.post<AnalyzeFlightPricesResponse>(
      '/flights/analyze',
      params,
      { signal }
    )
  }

  /**
   * Get flight prices for specific dates
   */
  async getFlightPrices(params: FlightPriceParams, signal?: AbortSignal): Promise<FlightPrice[]> {
    return apiClient.post<FlightPrice[]>('/flights/prices', params, { signal })
  }

  /**
   * Get available airlines for a route
   */
  async getAvailableAirlines(
    origin: string,
    destination: string,
    signal?: AbortSignal
  ): Promise<string[]> {
    return apiClient.get<string[]>('/flights/airlines', {
      origin,
      destination,
    }, { signal })
  }

  /**
   * Find cheapest dates for a route
   */
  async getCheapestDates(
    params: CheapestDatesRequest,
    signal?: AbortSignal
  ): Promise<CheapestDatesResponse> {
    return apiClient.post<CheapestDatesResponse>('/flights/cheapest-dates', params, { signal })
  }

  /**
   * Get price analysis for a specific route and date
   */
  async getPriceAnalysis(
    params: PriceAnalysisRequest,
    signal?: AbortSignal
  ): Promise<PriceAnalysisResponse> {
    return apiClient.post<PriceAnalysisResponse>('/flights/price-analysis', params, { signal })
  }

  /**
   * Predict price for a future date
   */
  async predictPrice(
    params: PredictPriceRequest,
    signal?: AbortSignal
  ): Promise<PredictPriceResponse> {
    return apiClient.post<PredictPriceResponse>('/flights/predict-price', params, { signal })
  }

  /**
   * Get price trend analysis
   */
  async getPriceTrend(
    params: PriceTrendRequest,
    signal?: AbortSignal
  ): Promise<PriceTrendResponse> {
    return apiClient.post<PriceTrendResponse>('/flights/price-trend', params, { signal })
  }

  /**
   * Predict prices for a date range
   */
  async predictPriceRange(
    params: PredictPriceRangeRequest,
    signal?: AbortSignal
  ): Promise<PredictPriceRangeResponse> {
    return apiClient.post<PredictPriceRangeResponse>(
      '/flights/predict-price-range',
      params,
      { signal }
    )
  }

  /**
   * Convert province value to airport code
   * 
   * @deprecated Backend now automatically converts province/country names to airport codes.
   * This method is kept for backward compatibility but may not be needed.
   * Frontend should send province/country names directly to backend endpoints.
   */
  async getAirportCode(province: string): Promise<string> {
    const response = await apiClient.get<{ province: string; airportCode: string }>(
      '/flights/airport-code',
      { province }
    )
    return response.airportCode
  }
}

export const flightApi = new FlightApi()

