/**
 * Response Utilities
 *
 * Provides consistent API response formatting and HTTP status constants.
 * All endpoints should use these utilities for standardized responses.
 */

import { Response } from 'express';
import {
	ApiResponse,
	ApiErrorResponse,
	PaginationMeta,
	ValidationError
} from '../types/api.types';

/**
 * HTTP Status Code constants.
 */
export const HttpStatus = {
	// Success
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,

	// Client Errors
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,

	// Server Errors
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

/**
 * Sends a successful response with data.
 *
 * @param res - Express response object
 * @param data - Data to send in the response
 * @param statusCode - HTTP status code (default: 200)
 * @param message - Optional success message
 */
export function sendSuccess<T>(
	res: Response,
	data: T,
	statusCode: number = 200,
	message?: string
): void {
	const response: ApiResponse<T> = {
		success: true,
		data,
		...(message && { message })
	};
	res.status(statusCode).json(response);
}

/**
 * Sends an error response.
 *
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 * @param errors - Optional array of validation errors
 */
export function sendError(
	res: Response,
	message: string,
	statusCode: number = 400,
	errors?: ValidationError[]
): void {
	const response: ApiErrorResponse = {
		success: false,
		message,
		...(errors && { errors })
	};
	res.status(statusCode).json(response);
}

/**
 * Calculates pagination metadata from query parameters and total count.
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @param totalResults - Total number of items
 * @returns Pagination metadata object
 */
export function getPaginationMeta(
	page: number,
	limit: number,
	totalResults: number
): PaginationMeta {
	return {
		currentPage: page,
		totalPages: Math.ceil(totalResults / limit),
		totalResults,
		limit
	};
}

/**
 * Parses and validates pagination query parameters.
 *
 * @param page - Page query parameter (string)
 * @param limit - Limit query parameter (string)
 * @param defaultLimit - Default limit if not specified (default: 10)
 * @returns Parsed page and limit values
 */
export function parsePaginationParams(
	page?: string,
	limit?: string,
	defaultLimit: number = 10
): { page: number; limit: number } {
	const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
	const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || String(defaultLimit), 10) || defaultLimit));

	return { page: parsedPage, limit: parsedLimit };
}

/**
 * Sends a 201 Created response with data.
 *
 * @param res - Express response object
 * @param data - Created resource data
 * @param message - Optional success message
 */
export function sendCreated<T>(res: Response, data: T, message?: string): void {
	sendSuccess(res, data, HttpStatus.CREATED, message);
}

/**
 * Sends a 404 Not Found error response.
 *
 * @param res - Express response object
 * @param resource - Name of the resource that wasn't found
 */
export function sendNotFound(res: Response, resource: string = 'Resource'): void {
	sendError(res, `${resource} not found`, HttpStatus.NOT_FOUND);
}

/**
 * Sends a 401 Unauthorized error response.
 *
 * @param res - Express response object
 * @param message - Custom message (default: 'Authentication required')
 */
export function sendUnauthorized(res: Response, message: string = 'Authentication required'): void {
	sendError(res, message, HttpStatus.UNAUTHORIZED);
}

/**
 * Sends a 403 Forbidden error response.
 *
 * @param res - Express response object
 * @param message - Custom message (default: 'Access denied')
 */
export function sendForbidden(res: Response, message: string = 'Access denied'): void {
	sendError(res, message, HttpStatus.FORBIDDEN);
}

/**
 * Sends a 409 Conflict error response.
 *
 * @param res - Express response object
 * @param message - Conflict description
 */
export function sendConflict(res: Response, message: string): void {
	sendError(res, message, HttpStatus.CONFLICT);
}

/**
 * Sends a 500 Internal Server Error response.
 *
 * @param res - Express response object
 * @param message - Error message (default: 'Internal server error')
 */
export function sendServerError(res: Response, message: string = 'Internal server error'): void {
	sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
}

