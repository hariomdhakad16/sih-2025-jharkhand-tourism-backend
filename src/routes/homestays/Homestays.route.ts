/**
 * Homestays Routes
 *
 * Defines all routes for homestay CRUD operations.
 *
 * Routes:
 * - GET    /homestays       - Get all homestays (paginated, filterable)
 * - GET    /homestays/:id   - Get single homestay by ID
 * - POST   /homestays       - Create new homestay
 * - PUT    /homestays/:id   - Update existing homestay
 * - DELETE /homestays/:id   - Delete homestay
 */

import { Router } from 'express';
import {
	getAllHomestays,
	getHomestayById,
	createHomestay,
	updateHomestay,
	deleteHomestay
} from '../../controllers/homestays.controller';
import { validate } from '../../middleware/validation.middleware';
import {
	createHomestaySchema,
	updateHomestaySchema,
	homestayQuerySchema,
	idParamSchema
} from '../../validation';

const router = Router();

/**
 * @route   GET /api/v1/homestays
 * @desc    Get all homestays with optional filters
 * @query   page, limit, district, minPrice, maxPrice
 * @access  Public
 */
router.get('/', validate(homestayQuerySchema, 'query'), getAllHomestays);

/**
 * @route   GET /api/v1/homestays/:id
 * @desc    Get a single homestay by ID
 * @param   id - Homestay ID
 * @access  Public
 */
router.get('/:id', validate(idParamSchema, 'params'), getHomestayById);

/**
 * @route   POST /api/v1/homestays
 * @desc    Create a new homestay listing
 * @body    CreateHomestayInput
 * @access  Public (will be protected after auth implementation)
 */
router.post('/', validate(createHomestaySchema), createHomestay);

/**
 * @route   PUT /api/v1/homestays/:id
 * @desc    Update an existing homestay
 * @param   id - Homestay ID
 * @body    UpdateHomestayInput (partial)
 * @access  Public (will be protected after auth implementation)
 */
router.put(
	'/:id',
	validate(idParamSchema, 'params'),
	validate(updateHomestaySchema),
	updateHomestay
);

/**
 * @route   DELETE /api/v1/homestays/:id
 * @desc    Delete a homestay listing
 * @param   id - Homestay ID
 * @access  Public (will be protected after auth implementation)
 */
router.delete('/:id', validate(idParamSchema, 'params'), deleteHomestay);

export default router;
