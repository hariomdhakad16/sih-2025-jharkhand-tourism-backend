/**
 * Homestay Model
 *
 * This file defines the data structure for homestay listings using Mongoose.
 * A homestay is an accommodation that tourists can book - like an Airbnb property.
 *
 * What is a Mongoose Model?
 * - A model is like a blueprint that tells MongoDB how to store data
 * - It defines what fields exist, their types, and validation rules
 * - It provides methods to create, read, update, and delete records
 *
 * This file contains:
 * 1. TypeScript interfaces - Define the shape of data for type checking
 * 2. Mongoose schemas - Define validation and structure for MongoDB
 * 3. The exported model - Used to interact with the database
 *
 * @module models/homestays/Homestay.model
 *
 * @example
 * // Creating a new homestay
 * import { HomestayModel } from './models/homestays/Homestay.model';
 *
 * const homestay = await HomestayModel.create({
 *   title: 'Beautiful Mountain View Cottage',
 *   description: 'A cozy cottage with amazing views...',
 *   location: { district: 'Ranchi', state: 'Jharkhand', address: '...' },
 *   pricing: { basePrice: 1500 },
 *   capacity: { guests: 4, bedrooms: 2, beds: 2, bathrooms: 1 }
 * });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Property type options for homestays.
 *
 * This defines the kind of accommodation being offered:
 * - 'entire': The guest gets the whole property to themselves
 * - 'private': Guest gets a private room, but shares common areas
 * - 'shared': Guest shares the space with the host or other guests
 *
 * Using a union type (with |) means only these exact values are allowed.
 */
export type PropertyType = 'entire' | 'private' | 'shared';

/**
 * Homestay listing status.
 *
 * Controls whether the listing appears in search results:
 * - 'active': Visible and available for booking
 * - 'inactive': Hidden from search (host taking a break, renovating, etc.)
 * - 'pending': Awaiting admin approval before going live
 */
export type HomestayStatus = 'active' | 'inactive' | 'pending';

/**
 * Pricing information for a homestay.
 *
 * We separate pricing into its own interface because:
 * 1. It keeps the main interface cleaner
 * 2. It's easier to add new pricing fields later
 * 3. It can be reused if other models need pricing
 */
export interface HomestayPricing {
	/** Base price per night in INR (Indian Rupees) */
	basePrice: number;

	/** Optional one-time cleaning fee charged per booking */
	cleaningFee?: number;

	/** Optional higher price for weekends (Friday/Saturday nights) */
	weekendPrice?: number;
}

/**
 * Capacity details - how many people and rooms.
 *
 * Important for:
 * - Filtering search results ("Show homes with 3+ bedrooms")
 * - Validating bookings ("This home only fits 4 guests")
 * - Displaying property details to users
 */
export interface HomestayCapacity {
	/** Maximum number of guests allowed */
	guests: number;

	/** Number of bedrooms (0 for studio apartments) */
	bedrooms: number;

	/** Total number of beds */
	beds: number;

	/** Number of bathrooms (can be 0.5 for half-baths) */
	bathrooms: number;
}

/**
 * Location information for a homestay.
 *
 * The coordinates are optional because:
 * - Not all hosts know their exact GPS coordinates
 * - We might get the address first and geocode later
 */
export interface HomestayLocation {
	/** Street address or landmark-based description */
	address: string;

	/** District name (e.g., "Ranchi", "Hazaribagh") */
	district: string;

	/** State name - usually "Jharkhand" for this app */
	state: string;

	/** Optional GPS coordinates for map display */
	coordinates?: {
		/** Latitude: -90 to 90, positive = North */
		lat: number;
		/** Longitude: -180 to 180, positive = East */
		lng: number;
	};
}

/**
 * Complete Homestay entity interface.
 *
 * This interface describes ALL the data fields a homestay has.
 * Think of it as the "complete picture" of a homestay.
 *
 * Note: This doesn't include MongoDB's _id field - that's added
 * automatically when we extend Document below.
 */
export interface IHomestay {
	/** Display title shown in search results and listings */
	title: string;

	/** Detailed description of the property */
	description: string;

	/** Type of property (entire/private/shared) */
	propertyType: PropertyType;

	/** Where the property is located */
	location: HomestayLocation;

	/** Pricing information */
	pricing: HomestayPricing;

	/** How many people and rooms */
	capacity: HomestayCapacity;

	/** List of amenities (WiFi, AC, Kitchen, etc.) */
	amenities: string[];

	/** Optional house rules guests must follow */
	houseRules?: string[];

	/** Array of image URLs for the property photos */
	images: string[];

	/** Current listing status */
	status: HomestayStatus;

	/** When this record was created (auto-managed by Mongoose) */
	createdAt: Date;

	/** When this record was last modified (auto-managed by Mongoose) */
	updatedAt: Date;
}

/**
 * Homestay document type.
 *
 * In Mongoose, a "Document" is a single record in the database.
 * By extending both IHomestay and Document, we get:
 * - All our custom fields from IHomestay
 * - Mongoose methods like save(), remove(), etc.
 * - The _id field that MongoDB adds automatically
 */
export interface IHomestayDocument extends IHomestay, Document {}

/**
 * Input type for creating a new homestay.
 *
 * Omit<T, K> creates a new type from T, but without properties K.
 *
 * When creating a homestay, we don't provide:
 * - status: Defaults to 'active'
 * - createdAt/updatedAt: Managed automatically by Mongoose
 *
 * @example
 * const input: CreateHomestayInput = {
 *   title: 'My Homestay',
 *   description: 'Nice place',
 *   // ... other required fields
 *   // Note: no status, createdAt, or updatedAt needed!
 * };
 */
export type CreateHomestayInput = Omit<IHomestay, 'status' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating a homestay.
 *
 * Partial<T> makes all properties of T optional.
 *
 * When updating, we might only want to change one or two fields,
 * not the entire document. Partial lets us do that.
 *
 * @example
 * // Only updating the price
 * const update: UpdateHomestayInput = {
 *   pricing: { basePrice: 2000 }
 * };
 */
export type UpdateHomestayInput = Partial<Omit<IHomestay, 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Mongoose Schemas
// ============================================================================
/*
 * Mongoose schemas define:
 * 1. The structure of documents (what fields exist)
 * 2. Validation rules (required fields, min/max values, etc.)
 * 3. Default values
 * 4. Type coercion (converting strings to numbers, etc.)
 *
 * We create sub-schemas for nested objects to keep things organized.
 */

/**
 * Schema for GPS coordinates.
 *
 * The { _id: false } option prevents Mongoose from adding an _id
 * to this subdocument - we don't need it for embedded objects.
 */
const coordinatesSchema = new Schema(
	{
		lat: {
			type: Number,
			required: true,
			min: -90,
			max: 90
		},
		lng: {
			type: Number,
			required: true,
			min: -180,
			max: 180
		}
	},
	{ _id: false }
);

/**
 * Schema for location information.
 *
 * Notice how 'state' has a default value of 'Jharkhand' since
 * this app is specifically for Jharkhand tourism.
 */
const locationSchema = new Schema(
	{
		address: {
			type: String,
			required: [true, 'Address is required'],
			trim: true
		},
		district: {
			type: String,
			required: [true, 'District is required'],
			trim: true
		},
		state: {
			type: String,
			required: true,
			default: 'Jharkhand',
			trim: true
		},
		coordinates: {
			type: coordinatesSchema,
			required: false
		}
	},
	{ _id: false }
);

/**
 * Schema for pricing information.
 *
 * The 'min: 100' ensures no one can list a homestay for less than
 * 100 rupees per night - prevents unrealistic pricing.
 */
const pricingSchema = new Schema(
	{
		basePrice: {
			type: Number,
			required: [true, 'Base price is required'],
			min: [100, 'Price must be at least 100 rupees']
		},
		cleaningFee: {
			type: Number,
			required: false,
			min: 0
		},
		weekendPrice: {
			type: Number,
			required: false,
			min: 0
		}
	},
	{ _id: false }
);

/**
 * Schema for capacity information.
 */
const capacitySchema = new Schema(
	{
		guests: {
			type: Number,
			required: [true, 'Guest capacity is required'],
			min: [1, 'Must allow at least 1 guest']
		},
		bedrooms: {
			type: Number,
			required: true,
			min: 0 // 0 for studio apartments
		},
		beds: {
			type: Number,
			required: true,
			min: [1, 'Must have at least 1 bed']
		},
		bathrooms: {
			type: Number,
			required: true,
			min: 0
		}
	},
	{ _id: false }
);

/**
 * Main Homestay schema.
 *
 * This is the complete schema that brings everything together.
 * It includes:
 * - All the subdocument schemas defined above
 * - Validation rules with custom error messages
 * - Timestamps option for automatic createdAt/updatedAt
 * - Collection name override ('homestays' instead of Mongoose's default)
 */
const homestaySchema = new Schema<IHomestayDocument>(
	{
		title: {
			type: String,
			required: [true, 'Title is required'],
			trim: true, // Removes whitespace from start/end
			maxlength: [200, 'Title cannot exceed 200 characters']
		},
		description: {
			type: String,
			required: [true, 'Description is required'],
			trim: true
		},
		propertyType: {
			type: String,
			enum: {
				values: ['entire', 'private', 'shared'],
				message: 'Property type must be entire, private, or shared'
			},
			required: true,
			default: 'entire'
		},
		location: {
			type: locationSchema,
			required: [true, 'Location is required']
		},
		pricing: {
			type: pricingSchema,
			required: [true, 'Pricing is required']
		},
		capacity: {
			type: capacitySchema,
			required: [true, 'Capacity is required']
		},
		amenities: {
			type: [String],
			default: [] // Empty array if not provided
		},
		houseRules: {
			type: [String],
			required: false
		},
		images: {
			type: [String],
			default: []
		},
		status: {
			type: String,
			enum: ['active', 'inactive', 'pending'],
			default: 'active'
		}
	},
	{
		/*
		 * Schema options:
		 *
		 * timestamps: true
		 * - Automatically adds createdAt and updatedAt fields
		 * - Updates updatedAt whenever the document is modified
		 *
		 * collection: 'homestays'
		 * - Explicitly sets the MongoDB collection name
		 * - Without this, Mongoose would use 'homestaydocuments' (pluralized model name)
		 */
		timestamps: true,
		collection: 'homestays'
	}
);

// ============================================================================
// Indexes
// ============================================================================
/*
 * Indexes make database queries faster by creating a sorted lookup table.
 * Think of it like an index in a book - you can find topics quickly without
 * reading every page.
 *
 * We create indexes on fields that are commonly used in:
 * - WHERE clauses (filtering)
 * - ORDER BY clauses (sorting)
 * - Search functionality
 *
 * Be careful: Each index takes up disk space and slows down writes.
 * Only index fields you actually query frequently.
 */

/** Index for filtering by district (common use case) */
homestaySchema.index({ 'location.district': 1 });

/** Index for price-based filtering and sorting */
homestaySchema.index({ 'pricing.basePrice': 1 });

/** Index for filtering by status (active listings only) */
homestaySchema.index({ status: 1 });

/**
 * Text search index for full-text search.
 *
 * This allows MongoDB's $text operator to search through
 * title and description fields efficiently.
 *
 * @example
 * // Search for homestays mentioning "mountain view"
 * await HomestayModel.find({ $text: { $search: 'mountain view' } });
 */
homestaySchema.index({ title: 'text', description: 'text' });

// ============================================================================
// Model Export
// ============================================================================

/**
 * Homestay Mongoose model.
 *
 * This is what you import and use to interact with the homestays collection.
 * It provides methods like:
 * - HomestayModel.find() - Get multiple homestays
 * - HomestayModel.findById() - Get one by ID
 * - HomestayModel.create() - Create a new homestay
 * - HomestayModel.updateOne() - Update a homestay
 * - HomestayModel.deleteOne() - Delete a homestay
 *
 * @example
 * // Get all active homestays in Ranchi under 2000 rupees
 * const homestays = await HomestayModel.find({
 *   status: 'active',
 *   'location.district': 'Ranchi',
 *   'pricing.basePrice': { $lte: 2000 }
 * });
 */
export const HomestayModel: Model<IHomestayDocument> = mongoose.model<IHomestayDocument>(
	'Homestay',
	homestaySchema
);
