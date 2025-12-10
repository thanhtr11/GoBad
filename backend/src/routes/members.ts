import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { clubIsolationMiddleware } from '../middleware/clubIsolation';
import { memberController } from '../controllers/memberController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All member routes require authentication
router.use(authMiddleware);

/**
 * POST /api/members
 * Add a new member to a club
 * Body: { clubId, name, email?, phone?, skillLevel?, membershipTier?, type }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.addMember(req, res, next);
  })
);

/**
 * GET /api/members
 * Get all members for current user's clubs
 * Query: clubId?, skillLevel?, status?, searchTerm?
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.getMembers(req, res, next);
  })
);

/**
 * GET /api/members/:id
 * Get specific member details
 */
router.get(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.getMemberById(req, res, next);
  })
);

/**
 * PUT /api/members/:id
 * Update member details
 * Body: { name?, email?, phone?, skillLevel?, status?, membershipTier? }
 */
router.put(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.updateMember(req, res, next);
  })
);

/**
 * DELETE /api/members/:id
 * Remove member from club
 */
router.delete(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.deleteMember(req, res, next);
  })
);

/**
 * POST /api/members/:id/reset-password
 * Reset member's password
 * Body: { newPassword }
 */
router.post(
  '/:id/reset-password',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.resetPassword(req, res, next);
  })
);

/**
 * POST /api/members/guest/check-in
 * Check in a guest (member checks in guest)
 * Body: { clubId, guestName, checkedInById }
 */
router.post(
  '/guest/check-in',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.checkInGuest(req, res, next);
  })
);

/**
 * GET /api/members/my-guests
 * Get guests created by current member
 */
router.get(
  '/my-guests',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.getMyGuests(req, res, next);
  })
);

/**
 * POST /api/members/create-guest
 * Create a new guest and check them in
 * Body: { name, skillLevel, practiceId }
 */
router.post(
  '/create-guest',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.createGuestCheckIn(req, res, next);
  })
);

/**
 * POST /api/members/:id/check-in
 * Check in a member for attendance
 * Body: { practiceId? }
 */
router.post(
  '/:id/check-in',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.checkInMember(req, res, next);
  })
);

/**
 * GET /api/members/club/:clubId
 * Get all members of a specific club
 * Query: skillLevel?, status?
 */
router.get(
  '/club/:clubId',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await memberController.getClubMembers(req, res, next);
  })
);

export default router;
