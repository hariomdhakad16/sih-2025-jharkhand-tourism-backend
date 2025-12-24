/**
 * Database Configuration Module
 *
 * This file handles connecting to MongoDB using the Mongoose library.
 * Mongoose is an ODM (Object Data Modeling) library that makes it easier
 * to work with MongoDB in Node.js by providing schemas, validation, and
 * a simple API for database operations.
 *
 * @module config/database
 *
 * @example
 * // Import and use in your server startup
 * import { connectDB } from './config/database';
 *
 * async function startServer() {
 *   await connectDB();  // Connect to MongoDB first
 *   app.listen(3000);   // Then start the server
 * }
 */

import mongoose from 'mongoose';

/**
 * MongoDB connection string (URI).
 *
 * This tells Mongoose where to find your MongoDB database.
 * The URI format is: mongodb://[username:password@]host:port/database
 *
 * We read this from environment variables for security - you should never
 * hardcode database credentials in your source code. The fallback value
 * is only for local development.
 *
 * @constant {string}
 */
const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://localhost:27017/sih-2025-jharkhand-tourism';

/**
 * Connects to the MongoDB database.
 *
 * This function does three important things:
 * 1. Sets up event listeners to monitor the connection status
 * 2. Handles graceful shutdown when the app is terminated (SIGINT)
 * 3. Establishes the actual connection to MongoDB
 *
 * The function is async because connecting to a database is an I/O operation
 * that takes time - we need to wait for the connection before proceeding.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when connection is successful
 * @throws {Error} Exits the process if connection fails (can't run without database)
 *
 * @example
 * // In your server.ts
 * try {
 *   await connectDB();
 *   console.log('Database connected!');
 * } catch (error) {
 *   console.error('Failed to connect to database');
 * }
 */
export async function connectDB(): Promise<void> {
	try {
		/*
		 * Set up connection event handlers.
		 *
		 * Mongoose emits events when the connection status changes.
		 * We listen to these events to log helpful messages.
		 * This is useful for debugging connection issues.
		 */

		// Fires when successfully connected to MongoDB
		mongoose.connection.on('connected', () => {
			console.log('📦 MongoDB connected successfully');
		});

		// Fires when there's a connection error
		mongoose.connection.on('error', (err) => {
			console.error('❌ MongoDB connection error:', err.message);
		});

		// Fires when the connection is lost
		mongoose.connection.on('disconnected', () => {
			console.log('⚠️  MongoDB disconnected');
		});

		/*
		 * Handle a graceful shutdown.
		 *
		 * SIGINT is the signal sent when you press Ctrl+C in the terminal.
		 * We want to close the database connection cleanly before exiting,
		 * rather than just killing the process abruptly.
		 */
		process.on('SIGINT', async () => {
			await mongoose.connection.close();
			console.log('MongoDB connection closed due to app termination');
			process.exit(0);
		});

		/*
		 * Actually connect to MongoDB.
		 *
		 * mongoose.connect() returns a Promise that resolves when connected.
		 * If the connection fails, it throws an error which we catch below.
		 */
		await mongoose.connect(MONGO_URI);
	} catch (error) {
		/*
		 * If we can't connect to the database, there's no point continuing.
		 * The app won't work without a database, so we exit immediately.
		 * process.exit(1) means "exit with an error".
		 */
		console.error('❌ Failed to connect to MongoDB:', error);
		process.exit(1);
	}
}

