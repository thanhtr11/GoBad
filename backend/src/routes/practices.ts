import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { clubIsolationMiddleware } from '../middleware/clubIsolation';
import { practiceController } from '../controllers/practiceController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All practice routes require authentication
router.use(authMiddleware);

/**
 * POST /api/practices
 * Schedule a new practice session
 * Body: { clubId, date, startTime, endTime, court, expectedParticipants?, isTournament? }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await practiceController.createPractice(req, res, next);
  })
);

/**
 * GET /api/practices
 * Get all practices with filters
 * Query: clubId?, startDate?, endDate?
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await practiceController.getPractices(req, res, next);
  })
);

/**
 * GET /api/practices/:id
 * Get specific practice details
 */
router.get(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await practiceController.getPracticeById(req, res, next);
  })
);

/**
 * PUT /api/practices/:id
 * Update practice details
 * Body: { date?, startTime?, endTime?, court?, expectedParticipants?, isTournament? }
 */
router.put(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await practiceController.updatePractice(req, res, next);
  })
);

/**
 * DELETE /api/practices/:id
 * Cancel/delete practice
 */
router.delete(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await practiceController.deletePractice(req, res, next);
  })
);

/**
 * GET /api/practices/club/:clubId
 * Get all practices for a specific club
 * Query: startDate?, endDate?
 */
router.get(
  '/club/:clubId',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await practiceController.getClubPractices(req, res, next);
  })
);

/**
 * GET /api/practices/:id/attendance
 * Get attendance for a specific practice
 */
router.get(
  '/:id/attendance',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await practiceController.getPracticeAttendance(req, res, next);
  })
);

/**
 * GET /api/practices/:id/guests
 * Get guests for a specific practice
 */
router.get(
  '/:id/guests',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await practiceController.getPracticeGuests(req, res, next);
  })
);

export default router;
