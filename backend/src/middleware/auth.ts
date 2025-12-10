import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken, JWTPayload } from '../utils/jwt';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      token?: string;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided. Please include Authorization header with Bearer token.',
      });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token.',
      });
      return;
    }

    // Attach user and token to request
    req.user = payload;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication.',
    });
  }
}

/**
 * Optional authentication middleware
 * Sets user if token is valid, but allows request to proceed if token is missing or invalid
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}
