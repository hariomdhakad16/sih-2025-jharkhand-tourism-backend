/**
 * Bookings Routes
 *
 * Defines all routes for booking operations.
 *
 * Routes:
 * - GET    /bookings            - Get all bookings (paginated, filterable)
 * - GET    /bookings/:id        - Get single booking by ID
 * - POST   /bookings            - Create new booking
 * - PUT    /bookings/:id/cancel - Cancel a booking
 */

import { Router } from 'express';
import {
	getAllBookings,
	getBookingById,
	createBooking,
	cancelBooking
} from '../../controllers/bookings.controller';
import { validate } from '../../middleware/validation.middleware';
import {
	createBookingSchema,
	cancelBookingSchema,
	bookingQuerySchema,
	idParamSchema
} from '../../validation';

const router = Router();

/**
 * @route   GET /api/v1/bookings
 * @desc    Get all bookings with optional filters
 * @query   page, limit, status
 * @access  Public (will be protected after auth implementation)
 */
router.get('/', validate(bookingQuerySchema, 'query'), getAllBookings);

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get a single booking by ID
 * @param   id - Booking ID
 * @access  Public (will be protected after auth implementation)
 */
router.get('/:id', validate(idParamSchema, 'params'), getBookingById);

/**
 * @route   POST /api/v1/bookings
 * @desc    Create a new booking
 * @body    CreateBookingInput
 * @access  Public
 */
router.post('/', validate(createBookingSchema), createBooking);

/**
 * @route   PUT /api/v1/bookings/:id/cancel
 * @desc    Cancel an existing booking
 * @param   id - Booking ID
 * @body    CancelBookingInput (optional reason)
 * @access  Public (will be protected after auth implementation)
 */
router.put(
	'/:id/cancel',
	validate(idParamSchema, 'params'),
	validate(cancelBookingSchema),
	cancelBooking
);

export default router;
