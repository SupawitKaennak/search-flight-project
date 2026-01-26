import { Router } from 'express';
import {
  searchAirports,
  getAirportDetails,
  getPopularAirports,
} from '../controllers/airportController';

const router = Router();

/**
 * @route   GET /api/airports/popular
 * @desc    Get popular airports
 * @access  Public
 */
router.get('/popular', getPopularAirports);

/**
 * @route   GET /api/airports/search
 * @desc    Search airports and cities
 * @access  Public
 * @query   keyword - Search keyword
 * @query   subType - Optional: AIRPORT or CITY
 */
router.get('/search', searchAirports);

/**
 * @route   GET /api/airports/:code
 * @desc    Get airport details by code
 * @access  Public
 */
router.get('/:code', getAirportDetails);

export default router;

