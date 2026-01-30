// Statistics API client

import { apiClient } from './client';

export interface SearchStatRequest {
  origin: string;
  originName?: string;
  destination: string;
  destinationName?: string;
  durationRange?: string;
  tripType?: 'one-way' | 'round-trip' | null;
}

export interface PriceStatRequest {
  origin: string;
  originName?: string;
  destination: string;
  destinationName?: string;
  recommendedPrice: number;
  season: 'high' | 'normal' | 'low';
  airline?: string;
}

export interface StatisticsResponse {
  totalSearches: number;
  mostSearchedDestination: {
    destination: string;
    destination_name: string | null;
    count: number;
  } | null;
  mostSearchedDuration: {
    duration_range: string;
    count: number;
  } | null;
  popularDestinations: Array<{
    destination: string;
    destination_name: string | null;
    count: number;
  }>;
  monthlyStats: Array<{
    month: number;
    month_name: string;
    count: number;
  }>;
}

export interface PriceStatisticsResponse {
  averagePrice: number | null;
  priceTrend: {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  } | null;
  searchTrend?: {  // ✅ เพิ่ม search trend
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  } | null;
}

export class StatisticsApi {
  /**
   * Save a search query to the database
   */
  async saveSearch(search: SearchStatRequest, signal?: AbortSignal): Promise<{ success: boolean; id: number }> {
    return apiClient.post<{ success: boolean; id: number }>('/statistics/search', search, { signal });
  }

  /**
   * Save a price recommendation to the database
   */
  async savePriceStat(priceStat: PriceStatRequest, signal?: AbortSignal): Promise<{ success: boolean; id: number }> {
    return apiClient.post<{ success: boolean; id: number }>('/statistics/price', priceStat, { signal });
  }

  /**
   * Get all statistics
   */
  async getStatistics(destination?: string, signal?: AbortSignal): Promise<StatisticsResponse> {
    return apiClient.get<StatisticsResponse>('/statistics', { destination }, { signal });
  }

  /**
   * Get price statistics
   */
  async getPriceStatistics(origin?: string, destination?: string, signal?: AbortSignal): Promise<PriceStatisticsResponse> {
    return apiClient.get<PriceStatisticsResponse>('/statistics/price', {
      origin,
      destination,
    }, { signal });
  }
}

export const statisticsApi = new StatisticsApi();

