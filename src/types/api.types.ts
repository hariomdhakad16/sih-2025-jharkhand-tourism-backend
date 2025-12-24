/**
 * API Type Definitions
 *
 * This file contains TypeScript interfaces that define the standard
 * structure for all API responses. Using consistent response formats
 * makes it easier for frontend developers to work with your API.
 *
 * Why consistent response formats matter:
 * - Frontend code can use the same logic to handle all responses
 * - Errors are predictable and easier to display to users
 * - API documentation is cleaner and easier to understand
 *
 * @module types/api.types
 */

/**
 * Standard success response wrapper.
 *
 * All successful API responses (2xx status codes) should follow this structure.
 * The generic type T allows us to specify what type of data is being returned.
 *
 * @template T - The type of data being returned (e.g., User, Homestay, etc.)
 *
 * @example
 * // A successful response returning a user object
 * const response: ApiResponse<User> = {
 *   success: true,
 *   data: { id: '123', name: 'John', email: 'john@example.com' },
 *   message: 'User created successfully'
 * };
 *
 * @example
 * // A successful response returning an array
 * const response: ApiResponse<Homestay[]> = {
 *   success: true,
 *   data: [homestay1, homestay2, homestay3]
 * };
 */
export interface ApiResponse<T> {
	/** Always true for successful responses */
	success: true;

	/** The actual data being returned - its type depends on the endpoint */
	data: T;

	/** Optional message providing additional context (e.g., "User created successfully") */
	message?: string;
}

/**
 * Standard error response structure.
 *
 * All error responses (4xx and 5xx status codes) should follow this format.
 * This consistency helps frontend developers handle errors uniformly.
 *
 * @example
 * // A validation error response
 * const response: ApiErrorResponse = {
 *   success: false,
 *   message: 'Validation failed',
 *   errors: [
 *     { field: 'email', message: 'Email is required' },
 *     { field: 'password', message: 'Password must be at least 8 characters' }
 *   ]
 * };
 *
 * @example
 * // A simple error response
 * const response: ApiErrorResponse = {
 *   success: false,
 *   message: 'Resource not found'
 * };
 */
export interface ApiErrorResponse {
	/** Always false for error responses */
	success: false;

	/** Human-readable error message explaining what went wrong */
	message: string;

	/** Optional array of field-specific validation errors */
	errors?: ValidationError[];
}

/**
 * Validation error details for a specific field.
 *
 * When form validation fails, we want to tell the user exactly which
 * field has a problem and what's wrong with it. This interface represents
 * one such error.
 *
 * @example
 * const emailError: ValidationError = {
 *   field: 'email',
 *   message: 'Please enter a valid email address'
 * };
 */
export interface ValidationError {
	/** The name of the field that failed validation (e.g., 'email', 'password') */
	field: string;

	/** Human-readable description of what's wrong */
	message: string;
}

/**
 * Pagination metadata for list endpoints.
 *
 * When returning large lists of items, we use pagination to break them
 * into smaller "pages". This metadata tells the frontend how to render
 * pagination controls (Previous/Next buttons, page numbers, etc.).
 *
 * @example
 * // Page 2 of a 5-page result set
 * const pagination: PaginationMeta = {
 *   currentPage: 2,
 *   totalPages: 5,
 *   totalResults: 47,
 *   limit: 10
 * };
 */
export interface PaginationMeta {
	/** The current page number (1-indexed, meaning first page is 1, not 0) */
	currentPage: number;

	/** Total number of pages available */
	totalPages: number;

	/** Total number of items across all pages */
	totalResults: number;

	/** Number of items per page */
	limit: number;
}

/**
 * Paginated response wrapper for list endpoints.
 *
 * Combines an array of items with pagination metadata.
 * Use this when returning paginated lists from your endpoints.
 *
 * @template T - The type of items in the list
 *
 * @example
 * const response: PaginatedResponse<Homestay> = {
 *   items: [homestay1, homestay2, homestay3],
 *   pagination: {
 *     currentPage: 1,
 *     totalPages: 5,
 *     totalResults: 47,
 *     limit: 10
 *   }
 * };
 */
export interface PaginatedResponse<T> {
	/** Array of items for the current page */
	items: T[];

	/** Pagination metadata */
	pagination: PaginationMeta;
}

/**
 * Query parameters for paginated list endpoints.
 *
 * These are the query string parameters that clients can send
 * to control pagination (e.g., ?page=2&limit=20).
 *
 * Note: Query parameters are always strings, even for numbers.
 * We parse them to numbers in the controller.
 *
 * @example
 * // URL: /api/v1/homestays?page=2&limit=20
 * const query: PaginationQuery = { page: '2', limit: '20' };
 */
export interface PaginationQuery {
	/** Page number to retrieve (as a string, needs parsing) */
	page?: string;

	/** Number of items per page (as a string, needs parsing) */
	limit?: string;
}

/**
 * Geographic location structure.
 *
 * Used for homestays, guides, and other entities that have
 * a physical location. Coordinates are optional but useful
 * for map displays.
 *
 * @example
 * const location: Location = {
 *   address: '123 Main Road, Near Temple',
 *   district: 'Ranchi',
 *   state: 'Jharkhand',
 *   coordinates: { lat: 23.3441, lng: 85.3096 }
 * };
 */
export interface Location {
	/** Street address or landmark-based address */
	address: string;

	/** District or city name */
	district: string;

	/** State name */
	state: string;

	/** Optional GPS coordinates for map integration */
	coordinates?: {
		/** Latitude (-90 to 90) */
		lat: number;
		/** Longitude (-180 to 180) */
		lng: number;
	};
}
