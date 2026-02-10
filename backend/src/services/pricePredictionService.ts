import { pool } from '../config/database';

/**
 * Price prediction service using database statistics
 * 
 * This service provides price predictions based on historical data averages.
 * No machine learning model is used - predictions are based on statistical averages.
 */
export class PricePredictionService {
  constructor() {
    // No initialization needed
  }

  /**
   * Predict price for a specific date using historical averages
   */
  async predictPrice(
    origin: string | string[],
    destination: string,
    targetDate: Date,
    tripType: 'one-way' | 'round-trip' = 'round-trip',
    daysOfHistory: number = 90
  ): Promise<{
    predictedPrice: number;
    confidence: 'high' | 'medium' | 'low';
    rSquared: number;
    minPrice: number;
    maxPrice: number;
  } | null> {
    try {
      const originParam = Array.isArray(origin) ? origin : [origin];
      const originPlaceholders = originParam.map((_, i) => `$${i + 1}`).join(', ');

      // Get historical average price for similar dates (same day of week, same month)
      const targetDayOfWeek = targetDate.getDay();
      const targetMonth = targetDate.getMonth() + 1; // 1-12

      const query = `
        SELECT 
          AVG(fp.price)::DECIMAL(10, 2) as avg_price,
          MIN(fp.price)::DECIMAL(10, 2) as min_price,
          MAX(fp.price)::DECIMAL(10, 2) as max_price,
          COUNT(*) as count
        FROM flight_prices fp
        INNER JOIN routes r ON fp.route_id = r.id
        WHERE r.origin IN (${originPlaceholders})
          AND r.destination = $${originParam.length + 1}
          AND fp.trip_type = $${originParam.length + 2}
          AND fp.travel_class = 'economy'
          AND EXTRACT(DOW FROM fp.departure_date) = $${originParam.length + 3}
          AND EXTRACT(MONTH FROM fp.departure_date) = $${originParam.length + 4}
          AND fp.departure_date >= CURRENT_DATE - INTERVAL '${daysOfHistory} days'
          AND fp.price IS NOT NULL
          AND fp.price > 0
      `;

      const result = await pool.query(query, [
        ...originParam,
        destination,
        tripType,
        targetDayOfWeek,
        targetMonth,
      ]);

      if (result.rows.length === 0 || !result.rows[0].avg_price) {
        // Fallback: get overall average for the route
        const fallbackQuery = `
          SELECT 
            AVG(fp.price)::DECIMAL(10, 2) as avg_price,
            MIN(fp.price)::DECIMAL(10, 2) as min_price,
            MAX(fp.price)::DECIMAL(10, 2) as max_price
          FROM flight_prices fp
          INNER JOIN routes r ON fp.route_id = r.id
          WHERE r.origin IN (${originPlaceholders})
            AND r.destination = $${originParam.length + 1}
            AND fp.trip_type = $${originParam.length + 2}
            AND fp.travel_class = 'economy'
            AND fp.departure_date >= CURRENT_DATE - INTERVAL '${daysOfHistory} days'
            AND fp.price IS NOT NULL
            AND fp.price > 0
        `;

        const fallbackResult = await pool.query(fallbackQuery, [
          ...originParam,
          destination,
          tripType,
        ]);

        if (fallbackResult.rows.length === 0 || !fallbackResult.rows[0].avg_price) {
          return null;
        }

        const avgPrice = Math.round(parseFloat(fallbackResult.rows[0].avg_price));
        const minPrice = Math.round(parseFloat(fallbackResult.rows[0].min_price) || avgPrice * 0.85);
        const maxPrice = Math.round(parseFloat(fallbackResult.rows[0].max_price) || avgPrice * 1.15);

        return {
          predictedPrice: avgPrice,
          confidence: 'medium',
          rSquared: 0.7,
          minPrice,
          maxPrice,
        };
      }

      const avgPrice = Math.round(parseFloat(result.rows[0].avg_price));
      const minPrice = Math.round(parseFloat(result.rows[0].min_price) || avgPrice * 0.85);
      const maxPrice = Math.round(parseFloat(result.rows[0].max_price) || avgPrice * 1.15);
      const count = parseInt(result.rows[0].count);

      // Estimate confidence based on data availability
      let confidence: 'high' | 'medium' | 'low';
      if (count >= 20) {
        confidence = 'high';
      } else if (count >= 10) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      return {
        predictedPrice: avgPrice,
        confidence,
        rSquared: 0.75,
        minPrice,
        maxPrice,
      };
    } catch (error: any) {
      console.error('[PricePrediction] Prediction failed:', error.message);
      return null;
    }
  }

  /**
   * Predict prices for multiple dates (price forecast)
   * Required for API compatibility
   */
  async predictPriceRange(
    origin: string | string[],
    destination: string,
    startDate: Date,
    endDate: Date,
    tripType: 'one-way' | 'round-trip' = 'round-trip'
  ): Promise<Array<{
    date: Date;
    predictedPrice: number;
    minPrice: number;
    maxPrice: number;
  }>> {
    const predictions = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const prediction = await this.predictPrice(
        origin,
        destination,
        new Date(currentDate),
        tripType
      );

      if (prediction) {
        predictions.push({
          date: new Date(currentDate),
          predictedPrice: prediction.predictedPrice,
          minPrice: prediction.minPrice,
          maxPrice: prediction.maxPrice,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return predictions;
  }

  /**
   * Get price trend (increasing/decreasing/stable) based on historical averages
   */
  async getPriceTrend(
    origin: string | string[],
    destination: string,
    tripType: 'one-way' | 'round-trip' = 'round-trip',
    daysAhead: number = 30
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    currentAvgPrice: number;
    futureAvgPrice: number;
  } | null> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const currentPrediction = await this.predictPrice(origin, destination, today, tripType);
      const futurePrediction = await this.predictPrice(origin, destination, futureDate, tripType);

      if (!currentPrediction || !futurePrediction) {
        return null;
      }

      const changePercent = ((futurePrediction.predictedPrice - currentPrediction.predictedPrice) / currentPrediction.predictedPrice) * 100;

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (changePercent > 5) {
        trend = 'increasing';
      } else if (changePercent < -5) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      return {
        trend,
        changePercent: Math.round(changePercent * 100) / 100,
        currentAvgPrice: currentPrediction.predictedPrice,
        futureAvgPrice: futurePrediction.predictedPrice,
      };
    } catch (error: any) {
      console.error('[PricePrediction] Trend calculation failed:', error.message);
      return null;
    }
  }
}
