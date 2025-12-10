import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import statsService from '../services/statsService';

// Validation schemas
const playerStatsSchema = z.object({
  playerId: z.string().uuid('Invalid player ID'),
});

const leaderboardSchema = z.object({
  clubId: z.string().uuid('Invalid club ID'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

const headToHeadSchema = z.object({
  playerId1: z.string().uuid('Invalid player 1 ID'),
  playerId2: z.string().uuid('Invalid player 2 ID'),
});

const trendsSchema = z.object({
  playerId: z.string().uuid('Invalid player ID'),
  daysBack: z.coerce.number().int().min(1).max(365).optional().default(30),
});

class StatsController {
  /**
   * GET /api/stats/player/:playerId
   * Get player statistics
   */
  async getPlayerStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { playerId } = playerStatsSchema.parse(req.params);
      const clubId = (req as any).user?.clubId;

      const stats = await statsService.getPlayerStats(playerId, clubId);

      res.json({
        message: 'Player statistics retrieved',
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stats/leaderboard
   * Get leaderboard for a club
   */
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { clubId, limit } = leaderboardSchema.parse(req.query);

      const leaderboard = await statsService.getLeaderboard(clubId, limit);

      res.json({
        message: 'Leaderboard retrieved',
        leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stats/head-to-head
   * Get head-to-head record between two players
   */
  async getHeadToHead(req: Request, res: Response, next: NextFunction) {
    try {
      const { playerId1, playerId2 } = headToHeadSchema.parse(req.query);
      const clubId = (req as any).user?.clubId;

      const record = await statsService.getHeadToHead(playerId1, playerId2, clubId);

      res.json({
        message: 'Head-to-head record retrieved',
        record,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stats/trends/:playerId
   * Get performance trends over time
   */
  async getPerformanceTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { playerId, daysBack } = trendsSchema.parse({
        playerId: req.params.playerId,
        daysBack: req.query.daysBack,
      });
      const clubId = (req as any).user?.clubId;

      const trends = await statsService.getPerformanceTrends(playerId, clubId, daysBack);

      res.json({
        message: 'Performance trends retrieved',
        trends,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stats/top-performers
   * Get top performers for a club
   */
  async getTopPerformers(req: Request, res: Response, next: NextFunction) {
    try {
      const { clubId, limit } = leaderboardSchema.parse(req.query);

      const performers = await statsService.getTopPerformers(clubId, limit);

      res.json({
        message: 'Top performers retrieved',
        performers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stats/club-summary/:clubId
   * Get stats summary for a club
   */
  async getClubStatsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { clubId } = z.object({ clubId: z.string().uuid() }).parse(req.params);

      // Note: Club access is already verified by clubIsolation middleware if applied
      // SUPER_ADMIN has access to all clubs
      // Other roles should only access clubs they belong to (verified elsewhere)

      const summary = await statsService.getClubStatsSummary(clubId);

      res.json({
        message: 'Club statistics summary retrieved',
        summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StatsController();
