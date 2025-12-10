import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import * as authController from '../controllers/authController';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { username, password, name, email? }
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name) {
      throw new ValidationError('Username, password, and name are required');
    }

    const result = await authController.register({ username, password, name, email });
    res.status(201).json(result);
  })
);

/**
 * POST /api/auth/login
 * Login user
 * Body: { username, password }
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    const result = await authController.login({ username, password });
    res.status(200).json(result);
  })
);

/**
 * POST /api/auth/logout
 * Logout user (requires authentication)
 */
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(async (_req: Request, res: Response) => {
    // Logout is mainly client-side (remove token from localStorage)
    // Server just acknowledges the request
    res.status(200).json({ message: 'Logged out successfully' });
  })
);

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not found in request');
    }

    const user = await authController.getCurrentUser(req.user.userId);
    res.status(200).json(user);
  })
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token (requires authentication)
 */
router.post(
  '/refresh',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not found in request');
    }

    const result = await authController.refreshToken(req.user.userId);
    res.status(200).json(result);
  })
);

export default router;
