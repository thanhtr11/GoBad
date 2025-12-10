import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import statsController from '../controllers/statsController';

const router = Router();

// All stats routes require authentication
router.use(authMiddleware);

/**
 * GET /api/stats/player/:playerId
 * Get player statistics (wins, losses, win rate, points averages)
 */
router.get('/player/:playerId', statsController.getPlayerStats.bind(statsController));

/**
 * GET /api/stats/leaderboard?clubId=xxx&limit=50
 * Get leaderboard for a club (ranked by wins)
 */
router.get('/leaderboard', statsController.getLeaderboard.bind(statsController));

/**
 * GET /api/stats/head-to-head?playerId1=xxx&playerId2=xxx
 * Get head-to-head record between two players
 */
router.get('/head-to-head', statsController.getHeadToHead.bind(statsController));

/**
 * GET /api/stats/trends/:playerId?daysBack=30
 * Get performance trends over time
 */
router.get('/trends/:playerId', statsController.getPerformanceTrends.bind(statsController));

/**
 * GET /api/stats/top-performers?clubId=xxx&limit=10
 * Get top performers for a club
 */
router.get('/top-performers', statsController.getTopPerformers.bind(statsController));

/**
 * GET /api/stats/club-summary/:clubId
 * Get stats summary for a club (members count, matches count, avg points)
 */
router.get('/club-summary/:clubId', statsController.getClubStatsSummary.bind(statsController));

export default router;
