/**
 * Product Model
 *
 * This file defines the data structure for local handicrafts and merchandise.
 * Products represent items that can be purchased, such as:
 * - Traditional handicrafts (Dokra art, bamboo crafts)
 * - Textiles (Tussar silk, tribal fabrics)
 * - Food items (local specialties, tribal honey)
 * - Souvenirs and memorabilia
 *
 * @module models/products/Product.model
 *
 * @example
 * // Creating a new product
 * import { ProductModel } from './models/products/Product.model';
 *
 * const product = await ProductModel.create({
 *   title: 'Dokra Art Elephant Statue',
 *   description: 'Handcrafted brass elephant using traditional Dokra technique...',
 *   category: 'Handicrafts',
 *   subcategory: 'Dokra Art',
 *   price: { amount: 2500 },
 *   stock: 10,
 *   images: ['https://example.com/elephant.jpg']
 * });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Pricing information for a product.
 *
 * Supports original price and discounts for sales/promotions.
 */
export interface ProductPricing {
	/** Current selling price in INR */
	amount: number;

	/** Original price before discount (for showing "was ₹X, now ₹Y") */
	originalAmount?: number;

	/** Discount percentage (0-100) */
	discount?: number;
}

/**
 * Product specifications - flexible key-value pairs.
 *
 * Different products have different specs, so we use a flexible structure.
 * Common specs are defined explicitly, but any key is allowed.
 *
 * The [key: string] is called an "index signature" - it allows
 * any string key with string value.
 *
 * @example
 * const specs: ProductSpecifications = {
 *   material: 'Brass',
 *   dimensions: '15cm x 10cm x 8cm',
 *   weight: '500g',
 *   customField: 'custom value'  // Any additional field is allowed
 * };
 */
export interface ProductSpecifications {
	/** What the product is made of */
	material?: string;

	/** Size/dimensions of the product */
	dimensions?: string;

	/** Weight of the product */
	weight?: string;

	/** How to care for/maintain the product */
	careInstructions?: string;

	/** Any other specification (flexible) */
	[key: string]: string | undefined;
}

/**
 * Complete Product entity interface.
 */
export interface IProduct {
	/** Product title/name */
	title: string;

	/** Detailed description of the product */
	description: string;

	/** Main category (e.g., 'Handicrafts', 'Textiles', 'Food') */
	category: string;

	/** Optional subcategory for more specific classification */
	subcategory?: string;

	/** Pricing information */
	price: ProductPricing;

	/** Number of items in stock (0 = out of stock) */
	stock: number;

	/** Array of product image URLs */
	images: string[];

	/** Optional product specifications */
	specifications?: ProductSpecifications;

	/** When this record was created */
	createdAt: Date;

	/** When this record was last updated */
	updatedAt: Date;
}

/**
 * Product document type with Mongoose methods.
 */
export interface IProductDocument extends IProduct, Document {}

/**
 * Input type for creating a new product.
 */
export type CreateProductInput = Omit<IProduct, 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating a product.
 */
export type UpdateProductInput = Partial<Omit<IProduct, 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Mongoose Schemas
// ============================================================================

/**
 * Pricing subdocument schema.
 *
 * Discount is validated to be 0-100 (percentage).
 */
const pricingSchema = new Schema(
	{
		amount: {
			type: Number,
			required: [true, 'Price amount is required'],
			min: [0, 'Price cannot be negative']
		},
		originalAmount: {
			type: Number,
			required: false,
			min: 0
		},
		discount: {
			type: Number,
			required: false,
			min: [0, 'Discount cannot be negative'],
			max: [100, 'Discount cannot exceed 100%']
		}
	},
	{ _id: false }
);

/**
 * Main Product schema.
 *
 * Note on 'specifications':
 * We use Schema.Types.Mixed for flexible key-value pairs.
 * This allows any object structure, which is useful when
 * different products have different specifications.
 */
const productSchema = new Schema<IProductDocument>(
	{
		title: {
			type: String,
			required: [true, 'Title is required'],
			trim: true,
			maxlength: [200, 'Title cannot exceed 200 characters']
		},
		description: {
			type: String,
			required: [true, 'Description is required'],
			trim: true
		},
		category: {
			type: String,
			required: [true, 'Category is required'],
			trim: true
		},
		subcategory: {
			type: String,
			required: false,
			trim: true
		},
		price: {
			type: pricingSchema,
			required: [true, 'Price is required']
		},
		stock: {
			type: Number,
			required: true,
			min: [0, 'Stock cannot be negative'],
			default: 0
		},
		images: {
			type: [String],
			default: []
		},
		/*
		 * Schema.Types.Mixed allows any object structure.
		 * Use with caution - there's no validation on the contents.
		 * Good for flexible data like product specifications.
		 */
		specifications: {
			type: Schema.Types.Mixed,
			required: false
		}
	},
	{
		timestamps: true,
		collection: 'products'
	}
);

// ============================================================================
// Indexes
// ============================================================================

/** Index for filtering by category */
productSchema.index({ category: 1 });

/** Index for filtering by subcategory */
productSchema.index({ subcategory: 1 });

/** Index for price-based filtering and sorting */
productSchema.index({ 'price.amount': 1 });

/** Index for finding in-stock items */
productSchema.index({ stock: 1 });

/**
 * Text index for searching products.
 *
 * Allows full-text search across title and description.
 */
productSchema.index({ title: 'text', description: 'text' });

// ============================================================================
// Model Export
// ============================================================================

/**
 * Product Mongoose model.
 *
 * @example
 * // Find all handicrafts under ₹1000
 * const products = await ProductModel.find({
 *   category: 'Handicrafts',
 *   'price.amount': { $lte: 1000 },
 *   stock: { $gt: 0 }  // Only in-stock items
 * });
 *
 * @example
 * // Search for silk products
 * const products = await ProductModel.find({
 *   $text: { $search: 'silk' }
 * });
 */
export const ProductModel: Model<IProductDocument> = mongoose.model<IProductDocument>(
	'Product',
	productSchema
);
