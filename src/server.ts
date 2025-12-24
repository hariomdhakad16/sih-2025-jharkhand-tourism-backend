/**
 * JharkhandYatra API Server
 *
 * Main entry point for the Express.js REST API server.
 * This server provides endpoints for managing:
 * - Homestays: Accommodation listings
 * - Guides: Local tour guides
 * - Products: Handicrafts and merchandise
 * - Bookings: Reservations for homestays and guides
 * - Search: Unified search across all entities
 *
 * @module server
 */

import express, { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/database';
import { swaggerSpec } from './config/swagger';
import apiRouter from './routes';

/**
 * Express application instance.
 */
const app = express();

/**
 * Server port from environment variable or default to 5000.
 */
const PORT = process.env.PORT || 5000;

// ============================================================================
// Middleware Configuration
// ============================================================================

/**
 * Parse JSON request bodies.
 * Required for POST/PUT requests with JSON payloads.
 */
app.use(express.json());

/**
 * Parse URL-encoded request bodies.
 * Supports form submissions with extended syntax.
 */
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Routes
// ============================================================================

/**
 * Mount the main API router at /api/v1.
 * All endpoints are prefixed with /api/v1 (e.g., /api/v1/homestays, /api/v1/guides).
 * API versioning enables future changes without breaking existing clients.
 */
app.use('/api/v1', apiRouter);

/**
 * Swagger UI documentation at /api/docs.
 * OpenAPI JSON spec available at /api/docs.json.
 */
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
	customCss: '.swagger-ui .topbar { display: none }',
	customSiteTitle: 'JharkhandYatra API Docs'
}));
app.get('/api/docs.json', (_req: Request, res: Response) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(swaggerSpec);
});

// ============================================================================
// Error Handling
// ============================================================================

/**
 * 404 Not Found handler.
 * Catches requests to undefined routes.
 */
app.use((_req: Request, res: Response) => {
	res.status(404).json({
		success: false,
		message: 'Endpoint not found'
	});
});

/**
 * MongoDB CastError interface for type checking.
 */
interface CastError extends Error {
	name: 'CastError';
	kind: string;
	path: string;
	value: unknown;
}

/**
 * MongoDB ServerError interface for duplicate key errors.
 */
interface MongoServerError extends Error {
	name: 'MongoServerError';
	code: number;
	keyPattern?: Record<string, number>;
	keyValue?: Record<string, unknown>;
}

/**
 * Type guard for CastError.
 */
function isCastError(err: Error): err is CastError {
	return err.name === 'CastError';
}

/**
 * Type guard for MongoServerError.
 */
function isMongoServerError(err: Error): err is MongoServerError {
	return err.name === 'MongoServerError';
}

/**
 * Global error handler.
 * Catches unhandled errors and returns a consistent error response.
 * Handles specific error types for better client feedback.
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error('Unhandled error:', err.message);

	// Handle invalid MongoDB ObjectId
	if (isCastError(err) && err.kind === 'ObjectId') {
		res.status(400).json({
			success: false,
			message: 'Invalid ID format',
			errors: [{ field: err.path, message: `Invalid ${err.path} format` }]
		});
		return;
	}

	// Handle MongoDB duplicate key errors
	if (isMongoServerError(err) && err.code === 11000) {
		const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
		const value = err.keyValue ? err.keyValue[field] : 'value';
		res.status(409).json({
			success: false,
			message: `Duplicate value: ${field} '${value}' already exists`,
			errors: [{ field, message: `${field} must be unique` }]
		});
		return;
	}

	// Handle Mongoose validation errors
	if (err.name === 'ValidationError') {
		res.status(400).json({
			success: false,
			message: 'Validation failed',
			errors: [{ field: 'validation', message: err.message }]
		});
		return;
	}

	// Default server error
	res.status(500).json({
		success: false,
		message: 'Internal server error'
	});
});

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the HTTP server after connecting to MongoDB.
 * First connects to the database, then starts listening on the configured port.
 */
async function startServer(): Promise<void> {
	try {
		// Connect to MongoDB
		await connectDB();

		// Start Express server
		app.listen(PORT, () => {
			console.log(`
╔═══════════════════════════════════════════════════════════╗
║           JharkhandYatra API Server v2.0                  ║
╠═══════════════════════════════════════════════════════════╣
║  Status:    Running                                       ║
║  Port:      ${String(PORT).padEnd(45)}║
║  Base URL:  http://localhost:${String(PORT).padEnd(30)}║
║  API Base:  /api/v1                                       ║
║  API Docs:  http://localhost:${PORT}/api/docs${' '.repeat(Math.max(0, 24 - String(PORT).length))}║
║  Database:  MongoDB Connected                             ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║  • GET  /api/v1/health      - Health check                ║
║  • POST /api/v1/auth/*      - Authentication              ║
║  • CRUD /api/v1/homestays   - Homestay management         ║
║  • CRUD /api/v1/guides      - Guide management            ║
║  • CRUD /api/v1/products    - Product management          ║
║  • CRUD /api/v1/bookings    - Booking management          ║
║  • GET  /api/v1/search      - Unified search              ║
╚═══════════════════════════════════════════════════════════╝
			`);
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
}

// Start the server
startServer();
