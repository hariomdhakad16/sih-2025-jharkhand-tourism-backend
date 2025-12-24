/**
 * Search Routes
 *
 * Defines routes for search and autocomplete functionality.
 *
 * Routes:
 * - GET /search              - Unified search across all entities
 * - GET /search/autocomplete - Get search suggestions
 */

import { Router } from 'express';
import {
	unifiedSearch,
	autocomplete
} from '../../controllers/search.controller';
import { validate } from '../../middleware/validation.middleware';
import {
	searchQuerySchema,
	autocompleteQuerySchema
} from '../../validation';

const router = Router();

/**
 * @route   GET /api/v1/search
 * @desc    Search across homestays, guides, and products
 * @query   q (required), type, page, limit
 * @access  Public
 */
router.get('/', validate(searchQuerySchema, 'query'), unifiedSearch);

/**
 * @route   GET /api/v1/search/autocomplete
 * @desc    Get search suggestions for autocomplete
 * @query   q (required, min 2 chars)
 * @access  Public
 */
router.get('/autocomplete', validate(autocompleteQuerySchema, 'query'), autocomplete);

export default router;
