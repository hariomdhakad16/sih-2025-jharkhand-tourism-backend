/**
 * Booking Model
 *
 * This file defines the data structure for reservations/bookings.
 * A booking represents when a customer reserves a homestay or guide service
 * for specific dates.
 *
 * Booking Flow:
 * 1. Customer selects dates and creates a booking (status: 'pending')
 * 2. Host/Guide confirms the booking (status: 'confirmed')
 * 3. Customer completes their stay/tour (status: 'completed')
 * Or: Customer/Host cancels (status: 'cancelled')
 *
 * @module models/bookings/Booking.model
 *
 * @example
 * // Creating a new booking
 * import { BookingModel } from './models/bookings/Booking.model';
 *
 * const booking = await BookingModel.create({
 *   bookingNumber: 'BK-2024-0001',
 *   listingType: 'homestay',
 *   listingId: '507f1f77bcf86cd799439011',
 *   checkIn: new Date('2024-03-15'),
 *   checkOut: new Date('2024-03-18'),
 *   guests: { adults: 2, children: 1 },
 *   guestDetails: { name: 'John Doe', email: 'john@example.com', phone: '+91...' },
 *   pricing: { basePrice: 4500, total: 5000 }
 * });
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Type of listing being booked.
 *
 * A booking can be for either:
 * - 'homestay': An accommodation reservation
 * - 'guide': A tour guide service
 */
export type ListingType = 'homestay' | 'guide';

/**
 * Booking status lifecycle.
 *
 * Represents the current state of the booking:
 * - 'pending': Just created, waiting for host/guide confirmation
 * - 'confirmed': Host/Guide has accepted the booking
 * - 'cancelled': Either party cancelled the booking
 * - 'completed': The stay/tour has been completed
 *
 * State transitions:
 *   pending → confirmed → completed
 *   pending → cancelled
 *   confirmed → cancelled
 *   confirmed → completed
 */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/**
 * Payment status for the booking.
 *
 * Tracks whether payment has been processed:
 * - 'pending': Payment not yet received
 * - 'completed': Payment successfully processed
 * - 'refunded': Payment was refunded (usually after cancellation)
 * - 'failed': Payment attempt failed
 */
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed';

/**
 * Guest count breakdown.
 *
 * Separating adults and children is important because:
 * - Some homestays charge differently for children
 * - Maximum occupancy rules may vary by guest type
 */
export interface GuestCount {
	/** Number of adult guests (required) */
	adults: number;

	/** Number of children (optional, defaults to 0) */
	children?: number;

	/** Total guests (calculated: adults + children) */
	total?: number;
}

/**
 * Guest contact details.
 *
 * Used for:
 * - Sending booking confirmations
 * - Host/Guide contacting the guest
 * - Emergency contact during the stay
 */
export interface GuestDetails {
	/** Guest's full name */
	name: string;

	/** Email address for confirmations */
	email: string;

	/** Phone number (preferably with country code) */
	phone: string;
}

/**
 * Booking pricing breakdown.
 *
 * We store itemized pricing so users can see exactly
 * what they're paying for.
 */
export interface BookingPricing {
	/** Base accommodation/service charge */
	basePrice: number;

	/** Optional cleaning fee (for homestays) */
	cleaningFee?: number;

	/** Platform service fee */
	serviceFee?: number;

	/** Applicable taxes */
	taxes?: number;

	/** Final total amount */
	total: number;
}

/**
 * Complete Booking entity interface.
 */
export interface IBooking {
	/** Unique booking reference number (e.g., 'BK-2024-0001') */
	bookingNumber: string;

	/** Whether this is a homestay or guide booking */
	listingType: ListingType;

	/** ID of the homestay or guide being booked */
	listingId: Types.ObjectId | string;

	/** Cached title of the listing (for display purposes) */
	listingTitle?: string;

	/** Check-in date (start of stay/tour) */
	checkIn: Date;

	/** Check-out date (end of stay/tour) */
	checkOut: Date;

	/** Number of nights (calculated from dates) */
	nights?: number;

	/** Guest count breakdown */
	guests: GuestCount;

	/** Contact information for the primary guest */
	guestDetails: GuestDetails;

	/** Any special requests from the guest */
	specialRequests?: string;

	/** Pricing breakdown */
	pricing: BookingPricing;

	/** Current booking status */
	status: BookingStatus;

	/** Payment status */
	paymentStatus: PaymentStatus;

	/** Reason for cancellation (if cancelled) */
	cancellationReason?: string;

	/** When the booking was cancelled */
	cancelledAt?: Date;

	/** When this record was created */
	createdAt: Date;

	/** When this record was last updated */
	updatedAt: Date;
}

/**
 * Booking document type with Mongoose methods.
 */
export interface IBookingDocument extends IBooking, Document {}

/**
 * Input type for creating a new booking.
 *
 * Note that dates come as strings from the API and are
 * converted to Date objects by Mongoose.
 */
export type CreateBookingInput = {
	listingType: ListingType;
	listingId: string;
	checkIn: string; // ISO date string, converted to Date
	checkOut: string; // ISO date string, converted to Date
	guests: GuestCount;
	guestDetails: GuestDetails;
	specialRequests?: string;
	pricing: BookingPricing;
};

/**
 * Input type for cancelling a booking.
 */
export interface CancelBookingInput {
	/** Optional reason for cancellation */
	reason?: string;
}

// ============================================================================
// Mongoose Schemas
// ============================================================================

/**
 * Guest count subdocument schema.
 */
const guestCountSchema = new Schema(
	{
		adults: {
			type: Number,
			required: [true, 'Number of adults is required'],
			min: [1, 'At least one adult is required']
		},
		children: {
			type: Number,
			required: false,
			default: 0,
			min: 0
		},
		total: {
			type: Number,
			required: false
			// Calculated in pre-save hook
		}
	},
	{ _id: false }
);

/**
 * Guest details subdocument schema.
 *
 * Email is stored in lowercase for consistent lookups.
 */
const guestDetailsSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Guest name is required'],
			trim: true
		},
		email: {
			type: String,
			required: [true, 'Guest email is required'],
			trim: true,
			lowercase: true // Always store emails in lowercase
		},
		phone: {
			type: String,
			required: [true, 'Guest phone is required'],
			trim: true
		}
	},
	{ _id: false }
);

/**
 * Pricing subdocument schema.
 */
const pricingSchema = new Schema(
	{
		basePrice: {
			type: Number,
			required: [true, 'Base price is required'],
			min: [0, 'Price cannot be negative']
		},
		cleaningFee: {
			type: Number,
			required: false,
			min: 0
		},
		serviceFee: {
			type: Number,
			required: false,
			min: 0
		},
		taxes: {
			type: Number,
			required: false,
			min: 0
		},
		total: {
			type: Number,
			required: [true, 'Total price is required'],
			min: [0, 'Total cannot be negative']
		}
	},
	{ _id: false }
);

/**
 * Main Booking schema.
 *
 * Notable features:
 * - bookingNumber is unique and indexed for quick lookups
 * - listingId uses refPath for dynamic references (can point to either Homestay or Guide)
 * - Includes pre-save middleware for calculations
 */
const bookingSchema = new Schema<IBookingDocument>(
	{
		bookingNumber: {
			type: String,
			required: [true, 'Booking number is required'],
			unique: true,
			index: true // Index for fast lookups by booking number
		},
		listingType: {
			type: String,
			enum: {
				values: ['homestay', 'guide'],
				message: 'Listing type must be homestay or guide'
			},
			required: [true, 'Listing type is required']
		},
		/*
		 * Dynamic reference (refPath).
		 *
		 * This tells Mongoose which collection to look up when populating.
		 * If listingType is 'homestay', it references the Homestay collection.
		 * If listingType is 'guide', it references the Guide collection.
		 */
		listingId: {
			type: Schema.Types.ObjectId,
			required: [true, 'Listing ID is required'],
			refPath: 'listingType'
		},
		listingTitle: {
			type: String,
			required: false
		},
		checkIn: {
			type: Date,
			required: [true, 'Check-in date is required']
		},
		checkOut: {
			type: Date,
			required: [true, 'Check-out date is required']
		},
		nights: {
			type: Number,
			required: false
			// Calculated in pre-save hook
		},
		guests: {
			type: guestCountSchema,
			required: [true, 'Guest information is required']
		},
		guestDetails: {
			type: guestDetailsSchema,
			required: [true, 'Guest contact details are required']
		},
		specialRequests: {
			type: String,
			required: false,
			trim: true
		},
		pricing: {
			type: pricingSchema,
			required: [true, 'Pricing information is required']
		},
		status: {
			type: String,
			enum: ['pending', 'confirmed', 'cancelled', 'completed'],
			default: 'pending'
		},
		paymentStatus: {
			type: String,
			enum: ['pending', 'completed', 'refunded', 'failed'],
			default: 'pending'
		},
		cancellationReason: {
			type: String,
			required: false
		},
		cancelledAt: {
			type: Date,
			required: false
		}
	},
	{
		timestamps: true,
		collection: 'bookings'
	}
);

// ============================================================================
// Indexes
// ============================================================================

/**
 * Compound index for checking availability.
 *
 * Used to find if a listing is already booked for given dates.
 * This query is run every time someone tries to make a booking.
 */
bookingSchema.index({ listingId: 1, checkIn: 1, checkOut: 1 });

/** Index for filtering by status */
bookingSchema.index({ status: 1 });

/** Index for finding bookings by guest email */
bookingSchema.index({ 'guestDetails.email': 1 });

/** Index for sorting by creation date (newest first) */
bookingSchema.index({ createdAt: -1 });

// ============================================================================
// Pre-save Middleware
// ============================================================================

/**
 * Calculate nights and total guests before saving.
 *
 * Pre-save hooks run automatically before a document is saved.
 * This is useful for:
 * - Calculating derived values
 * - Setting default values based on other fields
 * - Data normalization
 */
bookingSchema.pre('save', function () {
	/*
	 * Calculate number of nights.
	 *
	 * We calculate this automatically so:
	 * 1. The API doesn't need to send it
	 * 2. It's always consistent with the dates
	 */
	if (!this.nights && this.checkIn && this.checkOut) {
		const diffTime = this.checkOut.getTime() - this.checkIn.getTime();
		const diffDays = diffTime / (1000 * 60 * 60 * 24); // Convert ms to days
		this.nights = Math.ceil(diffDays);
	}

	/*
	 * Calculate total guests.
	 *
	 * Convenience field: adults + children = total
	 */
	if (this.guests && !this.guests.total) {
		this.guests.total = this.guests.adults + (this.guests.children || 0);
	}
});

// ============================================================================
// Model Export
// ============================================================================

/**
 * Booking Mongoose model.
 *
 * @example
 * // Find all confirmed bookings for a homestay
 * const bookings = await BookingModel.find({
 *   listingId: homestayId,
 *   status: 'confirmed'
 * });
 *
 * @example
 * // Check if dates are available
 * const conflicting = await BookingModel.findOne({
 *   listingId: homestayId,
 *   status: { $in: ['pending', 'confirmed'] },
 *   $or: [
 *     { checkIn: { $lt: requestedCheckOut }, checkOut: { $gt: requestedCheckIn } }
 *   ]
 * });
 * const isAvailable = !conflicting;
 */
export const BookingModel: Model<IBookingDocument> = mongoose.model<IBookingDocument>(
	'Booking',
	bookingSchema
);
