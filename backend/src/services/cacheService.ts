import { differenceInDays } from 'date-fns';

/**
 * Cache Service
 * Provides smart caching strategy to reduce API calls
 */
export class CacheService {
  private static cache = new Map<string, { data: any; expiresAt: number }>();
  private static readonly DEFAULT_TTL = 3600000; // 1 hour in milliseconds
  /**
   * Check if cached data is still fresh
   * @param updatedAt - Last update timestamp
   * @param maxAgeDays - Maximum age in days (default: 7)
   * @returns true if data is fresh, false if needs refresh
   */
  static isFresh(updatedAt: Date | string | null | undefined, maxAgeDays: number = 7): boolean {
    if (!updatedAt) return false;

    const updateDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
    const daysSinceUpdate = differenceInDays(new Date(), updateDate);

    return daysSinceUpdate < maxAgeDays;
  }

  /**
   * Check if we should fetch from API
   * @param cachedData - Existing cached data
   * @param maxAgeDays - Maximum age in days
   * @returns true if should fetch from API
   */
  static shouldFetchFromAPI<T>(
    cachedData: T[] | null | undefined,
    maxAgeDays: number = 7
  ): boolean {
    if (!cachedData || cachedData.length === 0) {
      return true;
    }

    // If we have data, check if it's fresh
    // This assumes cached data has updated_at field
    // For flight prices, we check individual records
    return false;
  }

  /**
   * Find missing dates in cached data
   * @param cachedDates - Array of dates that exist in cache
   * @param startDate - Start date to check
   * @param endDate - End date to check
   * @returns Array of missing dates
   */
  static findMissingDates(
    cachedDates: Date[],
    startDate: Date,
    endDate: Date
  ): Date[] {
    const missing: Date[] = [];
    const cachedSet = new Set(
      cachedDates.map(d => d.toISOString().split('T')[0])
    );

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      if (!cachedSet.has(dateStr)) {
        missing.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return missing;
  }

  /**
   * Get item from cache
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set item in cache
   */
  static set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Clear cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key for search params
   */
  static generateKey(params: any): string {
    return JSON.stringify(params);
  }
}

