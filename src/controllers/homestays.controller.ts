/**
 * Homestays Controller
 *
 * This controller handles all CRUD (Create, Read, Update, Delete) operations
 * for homestay listings. It's the "brains" that connects HTTP requests to
 * database operations.
 *
 * What happens when someone calls GET /api/v1/homestays?
 * 1. Express routes the request to this controller
 * 2. Controller queries the database using the Homestay model
 * 3. Controller sends back a formatted JSON response
 *
 * Controller Pattern:
 * Each function follows a similar pattern:
 * - Extract data from request (params, query, body)
 * - Perform database operation
 * - Handle success/error cases
 * - Send appropriate response
 *
 * @module controllers/homestays.controller
 */

import { Request, Response } from 'express';
import {
	HomestayModel,
	CreateHomestayInput,
	UpdateHomestayInput
} from '../models/homestays/Homestay.model';
import {
	sendSuccess,
	sendError,
	getPaginationMeta,
	parsePaginationParams
} from '../utils/response.utils';

/**
 * Get all homestays with pagination and filters.
 *
 * This is a public endpoint - no authentication required.
 * Returns only active homestays (status: 'active').
 *
 * @route GET /api/v1/homestays
 *
 * @param req.query.page - Page number (default: 1)
 * @param req.query.limit - Items per page (default: 10, max: 100)
 * @param req.query.district - Filter by district name (case-insensitive)
 * @param req.query.minPrice - Minimum base price filter
 * @param req.query.maxPrice - Maximum base price filter
 *
 * @example
 * // Get first page of all homestays
 * GET /api/v1/homestays
 *
 * // Get page 2 with 20 items per page
 * GET /api/v1/homestays?page=2&limit=20
 *
 * // Filter by district
 * GET /api/v1/homestays?district=Ranchi
 *
 * // Filter by price range
 * GET /api/v1/homestays?minPrice=500&maxPrice=2000
 *
 * // Combine filters
 * GET /api/v1/homestays?district=Ranchi&minPrice=1000&page=1&limit=10
 */
export async function getAllHomestays(
	req: Request,
	res: Response
): Promise<void> {
	try {
		/*
		 * Parse pagination parameters.
		 *
		 * parsePaginationParams handles:
		 * - Converting strings to numbers
		 * - Setting defaults (page: 1, limit: 10)
		 * - Enforcing limits (max 100 per page)
		 */
		const { page, limit } = parsePaginationParams(
			req.query.page as string,
			req.query.limit as string
		);

		// Extract filter parameters from query string
		const district = req.query.district as string | undefined;
		const minPrice = req.query.minPrice
			? parseInt(req.query.minPrice as string, 10)
			: undefined;
		const maxPrice = req.query.maxPrice
			? parseInt(req.query.maxPrice as string, 10)
			: undefined;

		/*
		 * Build the MongoDB query filter.
		 *
		 * We start with status: 'active' because we only want to show
		 * listings that are available for booking.
		 *
		 * Record<string, unknown> is TypeScript's way of saying
		 * "an object with string keys and any values"
		 */
		const filter: Record<string, unknown> = { status: 'active' };

		/*
		 * Add district filter if provided.
		 *
		 * We use RegExp with 'i' flag for case-insensitive matching.
		 * This means "Ranchi", "ranchi", and "RANCHI" all match.
		 */
		if (district) {
			filter['location.district'] = new RegExp(`^${district}$`, 'i');
		}

		/*
		 * Add price range filter if provided.
		 *
		 * MongoDB operators:
		 * - $gte: Greater than or equal to (>=)
		 * - $lte: Less than or equal to (<=)
		 */
		if (minPrice !== undefined || maxPrice !== undefined) {
			filter['pricing.basePrice'] = {};
			if (minPrice !== undefined) {
				(filter['pricing.basePrice'] as Record<string, number>).$gte = minPrice;
			}
			if (maxPrice !== undefined) {
				(filter['pricing.basePrice'] as Record<string, number>).$lte = maxPrice;
			}
		}

		/*
		 * Execute both queries in parallel for better performance.
		 *
		 * Promise.all runs multiple promises at the same time.
		 * This is faster than running them one after another.
		 *
		 * We need two queries:
		 * 1. Get the actual homestays (with pagination)
		 * 2. Count total matching documents (for pagination info)
		 */
		const [homestays, totalResults] = await Promise.all([
			HomestayModel.find(filter)
				.skip((page - 1) * limit) // Skip items from previous pages
				.limit(limit) // Only get 'limit' items
				.sort({ createdAt: -1 }), // Newest first (-1 = descending)
			HomestayModel.countDocuments(filter) // Total count for pagination
		]);

		/*
		 * Send successful response with data and pagination info.
		 *
		 * getPaginationMeta calculates:
		 * - currentPage
		 * - totalPages
		 * - totalResults
		 * - limit
		 */
		sendSuccess(res, {
			homestays,
			pagination: getPaginationMeta(page, limit, totalResults)
		});
	} catch (error) {
		console.error('Error fetching homestays:', error);
		sendError(res, 'Failed to fetch homestays', 500);
	}
}

/**
 * Get a single homestay by its ID.
 *
 * This is a public endpoint - no authentication required.
 *
 * @route GET /api/v1/homestays/:id
 *
 * @param req.params.id - MongoDB ObjectId of the homestay
 *
 * @example
 * GET /api/v1/homestays/507f1f77bcf86cd799439011
 *
 * // Success response
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "507f1f77bcf86cd799439011",
 *     "title": "Cozy Mountain Retreat",
 *     "location": { "district": "Ranchi", ... },
 *     ...
 *   }
 * }
 *
 * // Error: Not found
 * { "success": false, "message": "Homestay not found" }
 */
export async function getHomestayById(
	req: Request,
	res: Response
): Promise<void> {
	try {
		const { id } = req.params;

		/*
		 * findById is a Mongoose convenience method.
		 * It's equivalent to: findOne({ _id: id })
		 */
		const homestay = await HomestayModel.findById(id);

		if (!homestay) {
			sendError(res, 'Homestay not found', 404);
			return;
		}

		sendSuccess(res, homestay);
	} catch (error) {
		console.error('Error fetching homestay:', error);
		sendError(res, 'Failed to fetch homestay', 500);
	}
}

/**
 * Create a new homestay listing.
 *
 * This is a protected endpoint - requires authentication.
 * Only users with 'host' or 'admin' role can create homestays.
 *
 * @route POST /api/v1/homestays
 *
 * @param req.body - CreateHomestayInput object with homestay details
 *
 * @example
 * // Request body
 * {
 *   "title": "Beautiful Mountain View Cottage",
 *   "description": "A cozy cottage with stunning views...",
 *   "propertyType": "entire",
 *   "location": {
 *     "address": "123 Hill Road",
 *     "district": "Ranchi",
 *     "state": "Jharkhand"
 *   },
 *   "pricing": { "basePrice": 1500 },
 *   "capacity": { "guests": 4, "bedrooms": 2, "beds": 2, "bathrooms": 1 }
 * }
 *
 * // Success response (201 Created)
 * {
 *   "success": true,
 *   "data": { "_id": "...", ... },
 *   "message": "Homestay created successfully"
 * }
 */
export async function createHomestay(
	req: Request,
	res: Response
): Promise<void> {
	try {
		/*
		 * Get the input from request body.
		 *
		 * By this point, the validation middleware has already
		 * verified the data matches our Zod schema.
		 */
		const input: CreateHomestayInput = req.body;

		/*
		 * Create new Mongoose document.
		 *
		 * Note: We set status to 'active' by default.
		 * You could change this to 'pending' if you want
		 * admin approval before listings go live.
		 */
		const newHomestay = new HomestayModel({
			...input,
			status: 'active'
		});

		/*
		 * Save to database.
		 *
		 * This triggers Mongoose schema validation.
		 * If validation fails, it throws an error caught below.
		 */
		await newHomestay.save();

		/*
		 * Return 201 Created with the new homestay.
		 *
		 * 201 is the correct HTTP status for resource creation.
		 */
		sendSuccess(res, newHomestay, 201, 'Homestay created successfully');
	} catch (error: unknown) {
		console.error('Error creating homestay:', error);

		/*
		 * Handle Mongoose validation errors.
		 *
		 * Convert Mongoose's error format to our API's format.
		 */
		if (error instanceof Error && error.name === 'ValidationError') {
			const mongooseError = error as unknown as {
				errors: Record<string, { message: string }>;
			};
			const validationErrors = Object.keys(mongooseError.errors).map(
				(field) => ({
					field,
					message: mongooseError.errors[field].message
				})
			);
			sendError(res, 'Validation failed', 400, validationErrors);
			return;
		}

		sendError(res, 'Failed to create homestay', 500);
	}
}

/**
 * Update an existing homestay.
 *
 * This is a protected endpoint - requires authentication.
 * Supports partial updates (you don't need to send all fields).
 *
 * @route PUT /api/v1/homestays/:id
 *
 * @param req.params.id - MongoDB ObjectId of the homestay to update
 * @param req.body - UpdateHomestayInput object (all fields optional)
 *
 * @example
 * // Update just the price
 * PUT /api/v1/homestays/507f1f77bcf86cd799439011
 * { "pricing": { "basePrice": 2000 } }
 *
 * // Update multiple fields
 * PUT /api/v1/homestays/507f1f77bcf86cd799439011
 * {
 *   "title": "Updated Title",
 *   "status": "inactive"
 * }
 */
export async function updateHomestay(
	req: Request,
	res: Response
): Promise<void> {
	try {
		const { id } = req.params;
		const updates: UpdateHomestayInput = req.body;

		/*
		 * findByIdAndUpdate is a convenient method for update operations.
		 *
		 * Options:
		 * - $set: updates - Only update the fields provided
		 * - new: true - Return the updated document (not the old one)
		 * - runValidators: true - Run schema validation on updates
		 */
		const updatedHomestay = await HomestayModel.findByIdAndUpdate(
			id,
			{ $set: updates },
			{ new: true, runValidators: true }
		);

		if (!updatedHomestay) {
			sendError(res, 'Homestay not found', 404);
			return;
		}

		sendSuccess(res, updatedHomestay, 200, 'Homestay updated successfully');
	} catch (error: unknown) {
		console.error('Error updating homestay:', error);

		// Handle validation errors
		if (error instanceof Error && error.name === 'ValidationError') {
			const mongooseError = error as unknown as {
				errors: Record<string, { message: string }>;
			};
			const validationErrors = Object.keys(mongooseError.errors).map(
				(field) => ({
					field,
					message: mongooseError.errors[field].message
				})
			);
			sendError(res, 'Validation failed', 400, validationErrors);
			return;
		}

		sendError(res, 'Failed to update homestay', 500);
	}
}

/**
 * Delete a homestay listing.
 *
 * This is a protected endpoint - requires authentication.
 * Permanently removes the homestay from the database.
 *
 * Note: In a production app, you might want to "soft delete"
 * (set status to 'deleted') instead of actually removing the data.
 *
 * @route DELETE /api/v1/homestays/:id
 *
 * @param req.params.id - MongoDB ObjectId of the homestay to delete
 *
 * @example
 * DELETE /api/v1/homestays/507f1f77bcf86cd799439011
 *
 * // Success response
 * { "success": true, "message": "Homestay deleted successfully" }
 *
 * // Error: Not found
 * { "success": false, "message": "Homestay not found" }
 */
export async function deleteHomestay(
	req: Request,
	res: Response
): Promise<void> {
	try {
		const { id } = req.params;

		/*
		 * findByIdAndDelete removes the document and returns it.
		 *
		 * If no document is found, it returns null.
		 */
		const deletedHomestay = await HomestayModel.findByIdAndDelete(id);

		if (!deletedHomestay) {
			sendError(res, 'Homestay not found', 404);
			return;
		}

		/*
		 * Return success with null data.
		 *
		 * The deleted resource no longer exists, so we don't
		 * return it in the response.
		 */
		sendSuccess(res, null, 200, 'Homestay deleted successfully');
	} catch (error) {
		console.error('Error deleting homestay:', error);
		sendError(res, 'Failed to delete homestay', 500);
	}
}
