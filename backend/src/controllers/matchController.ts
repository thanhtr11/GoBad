import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { matchService } from '../services/matchService';
import { ValidationError, HTTPError } from '../middleware/errorHandler';
import { MatchType } from '@prisma/client';

// Validation schemas
const createMatchSchema = z.object({
  practiceId: z.string().uuid('Invalid practice ID'),
  player1Id: z.string().uuid('Invalid player 1 ID'),
  player2Id: z.string().uuid('Invalid player 2 ID'),
  player3Id: z.string().uuid('Invalid player 3 ID').optional(),
  player4Id: z.string().uuid('Invalid player 4 ID').optional(),
  matchType: z.enum(['SINGLES', 'DOUBLES']),
  score1: z.number().int().min(0, 'Score must be non-negative'),
  score2: z.number().int().min(0, 'Score must be non-negative'),
  court: z.string().min(1, 'Court is required'),
  notes: z.string().optional(),
});

const updateMatchSchema = z.object({
  score1: z.number().int().min(0, 'Score must be non-negative').optional(),
  score2: z.number().int().min(0, 'Score must be non-negative').optional(),
  notes: z.string().optional(),
});

interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

class MatchController {
  /**
   * POST /api/matches
   * Create new match
   */
  async createMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validation = createMatchSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ValidationError(validation.error.issues[0].message);
      }

      const match = await matchService.createMatch(validation.data);

      res.status(201).json({
        message: 'Match recorded successfully',
        match,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/matches
   * Get matches with filters
   */
  async getMatches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const { practiceId, clubId, playerId, matchType } = req.query;

      // Validate matchType if provided
      if (matchType && !['SINGLES', 'DOUBLES', 'MIXED_DOUBLES'].includes(matchType as string)) {
        throw new ValidationError('Invalid match type');
      }

      const matches = await matchService.getMatches(
        practiceId as string | undefined,
        clubId as string | undefined,
        playerId as string | undefined,
        matchType as MatchType | undefined
      );

      res.status(200).json({
        message: 'Matches retrieved successfully',
        count: matches.length,
        matches,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/matches/:id
   * Get specific match
   */
  async getMatchById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const match = await matchService.getMatchById(id);

      res.status(200).json({
        message: 'Match retrieved successfully',
        match,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/matches/:id
   * Update match
   */
  async updateMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const validation = updateMatchSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ValidationError(validation.error.issues[0].message);
      }

      const match = await matchService.updateMatch(id, validation.data);

      res.status(200).json({
        message: 'Match updated successfully',
        match,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/matches/:id
   * Delete match
   */
  async deleteMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const result = await matchService.deleteMatch(id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/matches/practice/:practiceId
   * Get practice matches
   */
  async getPracticeMatches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { practiceId } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const matches = await matchService.getPracticeMatches(practiceId);

      res.status(200).json({
        message: 'Practice matches retrieved successfully',
        count: matches.length,
        matches,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/matches/player/:playerId/stats
   * Get player statistics
   */
  async getPlayerStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { playerId } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const stats = await matchService.getPlayerStats(playerId);

      res.status(200).json({
        message: 'Player statistics retrieved successfully',
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const matchController = new MatchController();
