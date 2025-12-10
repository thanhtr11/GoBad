import { Request, Response, NextFunction } from 'express';

export interface APIError extends Error {
  statusCode?: number;
  details?: unknown;
}

/**
 * Global error handler middleware
 * Should be used as the last middleware in the app
 */
export function errorHandler(
  error: APIError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', {
    message: error.message,
    statusCode: error.statusCode || 500,
    details: error.details,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  const statusCode = error.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: getErrorName(statusCode),
    message: error.message || 'An unexpected error occurred.',
    ...(isDevelopment && { details: error.details, stack: error.stack }),
  });
}

/**
 * Get standardized error names based on HTTP status codes
 */
function getErrorName(statusCode: number): string {
  const errorMap: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return errorMap[statusCode] || 'Error';
}

/**
 * Custom error class for API errors
 */
export class HTTPError extends Error implements APIError {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'HTTPError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, HTTPError.prototype);
  }
}

/**
 * Helper to throw validation errors
 */
export class ValidationError extends HTTPError {
  constructor(message: string, details?: unknown) {
    super(message, 422, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Helper to throw not found errors
 */
export class NotFoundError extends HTTPError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Helper to throw unauthorized errors
 */
export class UnauthorizedError extends HTTPError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Helper to throw forbidden errors
 */
export class ForbiddenError extends HTTPError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Async error wrapper to catch errors from async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
