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
 * Mount the main API router at /api.
 * All endpoints are prefixed with /api (e.g., /api/homestays, /api/guides).
 */
app.use('/api', apiRouter);

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
 * Global error handler.
 * Catches unhandled errors and returns a consistent error response.
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error('Unhandled error:', err.message);
	res.status(500).json({
		success: false,
		message: 'Internal server error'
	});
});

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the HTTP server.
 * Listens on the configured port and logs startup confirmation.
 */
app.listen(PORT, () => {
	console.log(`
╔═══════════════════════════════════════════════════════════╗
║           JharkhandYatra API Server                       ║
╠═══════════════════════════════════════════════════════════╣
║  Status:    Running                                       ║
║  Port:      ${String(PORT).padEnd(45)}║
║  Base URL:  http://localhost:${String(PORT).padEnd(30)}║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║  • GET  /api/health      - Health check                   ║
║  • CRUD /api/homestays   - Homestay management            ║
║  • CRUD /api/guides      - Guide management               ║
║  • CRUD /api/products    - Product management             ║
║  • CRUD /api/bookings    - Booking management             ║
║  • GET  /api/search      - Unified search                 ║
╚═══════════════════════════════════════════════════════════╝
	`);
});
