/**
 * Guides Routes
 *
 * Defines all routes for guide CRUD operations.
 *
 * Routes:
 * - GET    /guides       - Get all guides (paginated, filterable)
 * - GET    /guides/:id   - Get single guide by ID
 * - POST   /guides       - Create new guide profile
 * - PUT    /guides/:id   - Update existing guide
 * - DELETE /guides/:id   - Delete guide profile
 */

import { Router } from 'express';
import {
	getAllGuides,
	getGuideById,
	createGuide,
	updateGuide,
	deleteGuide
} from '../../controllers/guides.controller';
import { validate } from '../../middleware/validation.middleware';
import {
	createGuideSchema,
	updateGuideSchema,
	guideQuerySchema,
	idParamSchema
} from '../../validation';

const router = Router();

/**
 * @route   GET /api/v1/guides
 * @desc    Get all guides with optional filters
 * @query   page, limit, specialization
 * @access  Public
 */
router.get('/', validate(guideQuerySchema, 'query'), getAllGuides);

/**
 * @route   GET /api/v1/guides/:id
 * @desc    Get a single guide by ID
 * @param   id - Guide ID
 * @access  Public
 */
router.get('/:id', validate(idParamSchema, 'params'), getGuideById);

/**
 * @route   POST /api/v1/guides
 * @desc    Create a new guide profile
 * @body    CreateGuideInput
 * @access  Public (will be protected after auth implementation)
 */
router.post('/', validate(createGuideSchema), createGuide);

/**
 * @route   PUT /api/v1/guides/:id
 * @desc    Update an existing guide profile
 * @param   id - Guide ID
 * @body    UpdateGuideInput (partial)
 * @access  Public (will be protected after auth implementation)
 */
router.put(
	'/:id',
	validate(idParamSchema, 'params'),
	validate(updateGuideSchema),
	updateGuide
);

/**
 * @route   DELETE /api/v1/guides/:id
 * @desc    Delete a guide profile
 * @param   id - Guide ID
 * @access  Public (will be protected after auth implementation)
 */
router.delete('/:id', validate(idParamSchema, 'params'), deleteGuide);

export default router;
