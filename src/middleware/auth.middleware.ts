/**
 * Authentication Middleware
 *
 * JWT-based authentication middleware for protecting routes.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.utils';

/**
 * JWT secret from environment (defaults to insecure value for development).
 */
const JWT_SECRET =
	process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT payload structure.
 */
export interface JwtPayload {
	userId: string;
	role: string;
	iat?: number;
	exp?: number;
}

/**
 * Verifies JWT token and attaches user info to request.
 *
 * Use this middleware to protect routes that require authentication.
 *
 * @example
 * router.get('/profile', authenticate, getProfile);
 */
export function authenticate(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			sendError(res, 'Authentication required', 401);
			return;
		}

		const token = authHeader.split(' ')[1];

		if (!token) {
			sendError(res, 'Authentication token missing', 401);
			return;
		}

		const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

		// Attach user info to request
		req.user = decoded;

		next();
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			sendError(res, 'Token expired', 401);
			return;
		}

		if (error instanceof jwt.JsonWebTokenError) {
			sendError(res, 'Invalid token', 401);
			return;
		}

		sendError(res, 'Authentication failed', 401);
	}
}

/**
 * Optional authentication - attaches user if token is present.
 *
 * Use this middleware for routes that work differently when authenticated.
 *
 * @example
 * router.get('/homestays', optionalAuth, getHomestays);
 */
export function optionalAuth(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const authHeader = req.headers.authorization;

		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.split(' ')[1];

			if (token) {
				const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
				req.user = decoded;
			}
		}

		next();
	} catch {
		// Token invalid but continue without user
		next();
	}
}

/**
 * Generates a JWT token for a user.
 *
 * @param userId - User's database ID
 * @param role - User's role
 * @returns Signed JWT token
 */
export function generateToken(userId: string, role: string): string {
	const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

	return jwt.sign({ userId, role }, JWT_SECRET, {
		expiresIn: expiresIn as jwt.SignOptions['expiresIn']
	});
}
