/**
 * Main Router
 *
 * Aggregates all route modules and exports a single router
 * to be mounted on the Express application.
 *
 * API Base: /api/v1
 *
 * Available endpoints:
 * - /api/v1/health     - Health check
 * - /api/v1/auth       - Authentication (register, login, profile)
 * - /api/v1/homestays  - Homestay CRUD
 * - /api/v1/guides     - Guide CRUD
 * - /api/v1/products   - Product CRUD
 * - /api/v1/bookings   - Booking management
 * - /api/v1/search     - Search and autocomplete
 */

import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';

import authRouter from './auth/Auth.route';
import homestaysRouter from './homestays/Homestays.route';
import guidesRouter from './guides/Guides.route';
import productsRouter from './products/Products.route';
import bookingsRouter from './bookings/Bookings.route';
import searchRouter from './search/Search.route';

const router = Router();

// Health check endpoint
router.get('/health', getHealth);

// Authentication routes
router.use('/auth', authRouter);

// Entity routers
router.use('/homestays', homestaysRouter);
router.use('/guides', guidesRouter);
router.use('/products', productsRouter);
router.use('/bookings', bookingsRouter);
router.use('/search', searchRouter);

export default router;
