/**
 * Guide Model
 *
 * This file defines the data structure for local tour guides using Mongoose.
 * A guide is a local expert who offers tours, cultural experiences, and
 * specialized knowledge about Jharkhand's attractions.
 *
 * Guides are different from homestays in that:
 * - They're people, not properties
 * - They have skills (languages, specializations)
 * - Their pricing is based on time (half-day, full-day)
 * - They have availability status
 *
 * @module models/guides/Guide.model
 *
 * @example
 * // Creating a new guide
 * import { GuideModel } from './models/guides/Guide.model';
 *
 * const guide = await GuideModel.create({
 *   name: 'Ravi Kumar',
 *   bio: 'Expert in tribal culture with 10 years experience...',
 *   specializations: ['Tribal Tours', 'Wildlife'],
 *   languages: ['Hindi', 'English', 'Santhali'],
 *   experience: '10+ years',
 *   location: { district: 'Ranchi', state: 'Jharkhand' },
 *   pricing: { halfDay: 1000, fullDay: 1800 }
 * });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Guide availability status.
 *
 * This tells customers whether they can book this guide:
 * - 'available': Ready and willing to accept new bookings
 * - 'busy': Currently has bookings, might not be available
 * - 'unavailable': Not accepting bookings (vacation, personal reasons, etc.)
 */
export type GuideAvailability = 'available' | 'busy' | 'unavailable';

/**
 * Pricing structure for guide services.
 *
 * Guides typically charge based on duration:
 * - halfDay: Usually 4-5 hours (morning or afternoon tour)
 * - fullDay: Usually 8-10 hours (full day experience)
 * - multiDay: Per-day rate for multi-day tours (often discounted)
 * - workshop: For specialized sessions (cooking, crafts, etc.)
 *
 * All prices are in INR (Indian Rupees).
 */
export interface GuidePricing {
	/** Price for a half-day tour (4-5 hours) */
	halfDay: number;

	/** Price for a full-day tour (8-10 hours) */
	fullDay: number;

	/** Optional discounted daily rate for multi-day tours */
	multiDay?: number;

	/** Optional price for specialized workshop sessions */
	workshop?: number;
}

/**
 * Location info for guides.
 *
 * Simplified compared to homestays because:
 * - Guides don't have a physical property to visit
 * - They meet tourists at pickup points
 * - We just need to know their base area for matching
 */
export interface GuideLocation {
	/** District where the guide operates */
	district: string;

	/** State (usually Jharkhand) */
	state: string;
}

/**
 * Complete Guide entity interface.
 *
 * Represents all the information we store about a guide.
 */
export interface IGuide {
	/** Guide's full name */
	name: string;

	/** Biography/description - tells tourists about their background */
	bio: string;

	/** Areas of expertise (e.g., 'Wildlife Tours', 'Tribal Culture') */
	specializations: string[];

	/** Languages the guide can speak */
	languages: string[];

	/** Experience description (e.g., '5+ years', 'Since 2015') */
	experience: string;

	/** Where the guide is based */
	location: GuideLocation;

	/** Pricing for different service types */
	pricing: GuidePricing;

	/** Optional certifications (e.g., 'Certified Wildlife Guide') */
	certifications?: string[];

	/** Current availability status */
	availability: GuideAvailability;

	/** When this record was created */
	createdAt: Date;

	/** When this record was last updated */
	updatedAt: Date;
}

/**
 * Guide document type with Mongoose methods.
 */
export interface IGuideDocument extends IGuide, Document {}

/**
 * Input type for creating a new guide.
 *
 * We don't need to provide createdAt/updatedAt - Mongoose handles those.
 */
export type CreateGuideInput = Omit<IGuide, 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating a guide.
 *
 * Partial makes all fields optional - update only what you need.
 */
export type UpdateGuideInput = Partial<Omit<IGuide, 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Mongoose Schemas
// ============================================================================

/**
 * Location subdocument schema.
 *
 * Simpler than homestay locations - just district and state.
 */
const locationSchema = new Schema(
	{
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
		}
	},
	{ _id: false }
);

/**
 * Pricing subdocument schema.
 *
 * min: 0 ensures no negative prices (which wouldn't make sense).
 */
const pricingSchema = new Schema(
	{
		halfDay: {
			type: Number,
			required: [true, 'Half-day price is required'],
			min: [0, 'Price cannot be negative']
		},
		fullDay: {
			type: Number,
			required: [true, 'Full-day price is required'],
			min: [0, 'Price cannot be negative']
		},
		multiDay: {
			type: Number,
			required: false,
			min: 0
		},
		workshop: {
			type: Number,
			required: false,
			min: 0
		}
	},
	{ _id: false }
);

/**
 * Main Guide schema.
 *
 * Notable validation rules:
 * - Specializations and languages must have at least one item
 * - This uses custom validators (functions that return true/false)
 */
const guideSchema = new Schema<IGuideDocument>(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
			maxlength: [100, 'Name cannot exceed 100 characters']
		},
		bio: {
			type: String,
			required: [true, 'Bio is required'],
			trim: true
		},
		specializations: {
			type: [String],
			required: true,
			/*
			 * Custom validator function.
			 * Ensures the array isn't empty - a guide must specialize in something!
			 */
			validate: {
				validator: (value: string[]) => value.length > 0,
				message: 'At least one specialization is required'
			}
		},
		languages: {
			type: [String],
			required: true,
			/*
			 * Same pattern - guide must speak at least one language
			 * to communicate with tourists.
			 */
			validate: {
				validator: (value: string[]) => value.length > 0,
				message: 'At least one language is required'
			}
		},
		experience: {
			type: String,
			required: [true, 'Experience is required'],
			trim: true
		},
		location: {
			type: locationSchema,
			required: [true, 'Location is required']
		},
		pricing: {
			type: pricingSchema,
			required: [true, 'Pricing is required']
		},
		certifications: {
			type: [String],
			required: false,
			default: []
		},
		availability: {
			type: String,
			enum: {
				values: ['available', 'busy', 'unavailable'],
				message: 'Availability must be available, busy, or unavailable'
			},
			default: 'available'
		}
	},
	{
		timestamps: true,
		collection: 'guides'
	}
);

// ============================================================================
// Indexes
// ============================================================================

/** Index for filtering by specialization */
guideSchema.index({ specializations: 1 });

/** Index for filtering by availability */
guideSchema.index({ availability: 1 });

/** Index for filtering by district */
guideSchema.index({ 'location.district': 1 });

/**
 * Text index for searching guides by name or bio.
 *
 * Useful for search queries like "tribal expert" or "wildlife guide".
 */
guideSchema.index({ name: 'text', bio: 'text' });

// ============================================================================
// Model Export
// ============================================================================

/**
 * Guide Mongoose model.
 *
 * @example
 * // Find available guides who speak English in Ranchi
 * const guides = await GuideModel.find({
 *   availability: 'available',
 *   languages: 'English',
 *   'location.district': 'Ranchi'
 * });
 *
 * @example
 * // Search for wildlife guides
 * const guides = await GuideModel.find({
 *   specializations: 'Wildlife'
 * });
 */
export const GuideModel: Model<IGuideDocument> = mongoose.model<IGuideDocument>(
	'Guide',
	guideSchema
);
