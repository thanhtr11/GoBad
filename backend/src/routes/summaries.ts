import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import summaryController from '../controllers/summaryController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/summaries/practice/:practiceId
 * Get summary for a specific practice
 */
router.get('/practice/:practiceId', (req, res) =>
  summaryController.getPracticeSummary(req, res)
);

/**
 * GET /api/summaries/club/:clubId
 * Get summaries for recent practices in a club
 */
router.get('/club/:clubId', (req, res) =>
  summaryController.getClubSummaries(req, res)
);

export default router;
