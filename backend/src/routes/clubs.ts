import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';
import { clubIsolationMiddleware } from '../middleware/clubIsolation';
import { clubController } from '../controllers/clubController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All club routes require authentication
router.use(authMiddleware);

/**
 * POST /api/clubs
 * Create a new club (Admin only)
 * Body: { name, location?, contactName?, email? }
 */
router.post(
  '/',
  adminOnly,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.createClub(req, res, next);
  })
);

/**
 * GET /api/clubs
 * Get all clubs for current user
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.getAllClubs(req, res, next);
  })
);

/**
 * GET /api/clubs/:id
 * Get specific club details (must be member of club)
 */
router.get(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.getClubById(req, res, next);
  })
);

/**
 * PUT /api/clubs/:id
 * Update club (Admin or club member)
 * Body: { name?, location?, contactName?, email? }
 */
router.put(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.updateClub(req, res, next);
  })
);

/**
 * DELETE /api/clubs/:id
 * Delete club and all related data (Admin only)
 */
router.delete(
  '/:id',
  clubIsolationMiddleware,
  adminOnly,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.deleteClub(req, res, next);
  })
);

/**
 * GET /api/clubs/:id/members
 * Get club members (must be member of club)
 */
router.get(
  '/:id/members',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.getClubMembers(req, res, next);
  })
);

/**
 * GET /api/clubs/:id/stats
 * Get club statistics (must be member of club)
 */
router.get(
  '/:id/stats',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.getClubStats(req, res, next);
  })
);

/**
 * POST /api/clubs/:id/managers
 * Assign a manager to a club (Admin only)
 * Body: { userId }
 */
router.post(
  '/:id/managers',
  adminOnly,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.assignManager(req, res, next);
  })
);

/**
 * GET /api/clubs/:id/managers
 * Get managers of a club (Admin only)
 */
router.get(
  '/:id/managers',
  adminOnly,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.getClubManagers(req, res, next);
  })
);

/**
 * DELETE /api/clubs/:clubId/managers/:userId
 * Remove a manager from a club (Admin only)
 */
router.delete(
  '/:clubId/managers/:userId',
  adminOnly,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await clubController.removeManager(req, res, next);
  })
);

export default router;
