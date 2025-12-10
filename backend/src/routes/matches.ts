import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { clubIsolationMiddleware } from '../middleware/clubIsolation';
import { matchController } from '../controllers/matchController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All match routes require authentication
router.use(authMiddleware);

/**
 * POST /api/matches
 * Record a new match result
 * Body: { practiceId, player1Id, player2Id, matchType, score1, score2, court, notes? }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await matchController.createMatch(req, res, next);
  })
);

/**
 * GET /api/matches
 * Get all matches with filters
 * Query: practiceId?, clubId?, playerId?, matchType?
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await matchController.getMatches(req, res, next);
  })
);

/**
 * GET /api/matches/:id
 * Get specific match details
 */
router.get(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await matchController.getMatchById(req, res, next);
  })
);

/**
 * PUT /api/matches/:id
 * Update match details
 * Body: { score1?, score2?, notes? }
 */
router.put(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await matchController.updateMatch(req, res, next);
  })
);

/**
 * DELETE /api/matches/:id
 * Delete match
 */
router.delete(
  '/:id',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await matchController.deleteMatch(req, res, next);
  })
);

/**
 * GET /api/matches/practice/:practiceId
 * Get all matches for a specific practice
 */
router.get(
  '/practice/:practiceId',
  clubIsolationMiddleware,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await matchController.getPracticeMatches(req, res, next);
  })
);

/**
 * GET /api/matches/player/:playerId/stats
 * Get player statistics
 */
router.get(
  '/player/:playerId/stats',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await matchController.getPlayerStats(req, res, next);
  })
);

export default router;
