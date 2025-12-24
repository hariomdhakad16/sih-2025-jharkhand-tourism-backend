/**
 * Products Routes
 *
 * Defines all routes for product CRUD operations.
 *
 * Routes:
 * - GET    /products       - Get all products (paginated, filterable)
 * - GET    /products/:id   - Get single product by ID
 * - POST   /products       - Create new product
 * - PUT    /products/:id   - Update existing product
 * - DELETE /products/:id   - Delete product
 */

import { Router } from 'express';
import {
	getAllProducts,
	getProductById,
	createProduct,
	updateProduct,
	deleteProduct
} from '../../controllers/products.controller';
import { validate } from '../../middleware/validation.middleware';
import {
	createProductSchema,
	updateProductSchema,
	productQuerySchema,
	idParamSchema
} from '../../validation';

const router = Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with optional filters
 * @query   page, limit, category
 * @access  Public
 */
router.get('/', validate(productQuerySchema, 'query'), getAllProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get a single product by ID
 * @param   id - Product ID
 * @access  Public
 */
router.get('/:id', validate(idParamSchema, 'params'), getProductById);

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product listing
 * @body    CreateProductInput
 * @access  Public (will be protected after auth implementation)
 */
router.post('/', validate(createProductSchema), createProduct);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update an existing product
 * @param   id - Product ID
 * @body    UpdateProductInput (partial)
 * @access  Public (will be protected after auth implementation)
 */
router.put(
	'/:id',
	validate(idParamSchema, 'params'),
	validate(updateProductSchema),
	updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete a product listing
 * @param   id - Product ID
 * @access  Public (will be protected after auth implementation)
 */
router.delete('/:id', validate(idParamSchema, 'params'), deleteProduct);

export default router;
