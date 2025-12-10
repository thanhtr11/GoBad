import { Request, Response } from 'express';
import { z } from 'zod';
import tournamentService from '../services/tournamentService';

// Validation schemas
const createTournamentSchema = z.object({
  clubId: z.string().uuid(),
  practiceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  format: z.enum(['KNOCKOUT', 'ROUND_ROBIN']),
});

const updateTournamentStatusSchema = z.object({
  status: z.enum(['UPCOMING', 'IN_PROGRESS', 'COMPLETED']),
});

const recordBracketMatchSchema = z.object({
  matchId: z.string(),
  player1Score: z.number().int().min(0),
  player2Score: z.number().int().min(0),
});

class TournamentController {
  /**
   * POST /api/tournaments
   * Create a new tournament
   */
  async createTournament(req: Request, res: Response): Promise<void> {
    try {
      const validation = createTournamentSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const tournament = await tournamentService.createTournament(
        validation.data.clubId,
        validation.data.practiceId,
        validation.data.name,
        validation.data.format as any
      );

      res.status(201).json({ tournament });
    } catch (error) {
      console.error('Error creating tournament:', error);
      res.status(500).json({ error: 'Failed to create tournament' });
    }
  }

  /**
   * GET /api/tournaments/:id
   * Get tournament details
   */
  async getTournament(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await tournamentService.getTournament(req.params.id);

      if (!tournament) {
        res.status(404).json({ error: 'Tournament not found' });
        return;
      }

      res.json({ tournament });
    } catch (error) {
      console.error('Error fetching tournament:', error);
      res.status(500).json({ error: 'Failed to fetch tournament' });
    }
  }

  /**
   * GET /api/tournaments/club/:clubId
   * List tournaments for a club
   */
  async getClubTournaments(req: Request, res: Response): Promise<void> {
    try {
      const tournaments = await tournamentService.getClubTournaments(req.params.clubId);
      res.json({ tournaments });
    } catch (error) {
      console.error('Error fetching club tournaments:', error);
      res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
  }

  /**
   * GET /api/tournaments/:id/participants
   * Get tournament participants
   */
  async getTournamentParticipants(req: Request, res: Response): Promise<void> {
    try {
      const participants = await tournamentService.getTournamentParticipants(req.params.id);

      if (!participants) {
        res.status(404).json({ error: 'Tournament not found' });
        return;
      }

      res.json({ participants });
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ error: 'Failed to fetch participants' });
    }
  }

  /**
   * POST /api/tournaments/:id/bracket
   * Get bracket for tournament
   */
  async getTournamentBracket(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await tournamentService.getTournament(req.params.id);

      if (!tournament) {
        res.status(404).json({ error: 'Tournament not found' });
        return;
      }

      const participants = await tournamentService.getTournamentParticipants(req.params.id);

      if (!participants) {
        res.status(400).json({ error: 'No participants found' });
        return;
      }

      const playerIds = participants.map((p) => p.id);
      const playerNames = new Map(participants.map((p) => [p.id, p.name]));

      let bracket: any;

      if (tournament.format === 'KNOCKOUT') {
        bracket = tournamentService.generateKnockoutBracket(playerIds, playerNames);
      } else {
        const matches = tournamentService.generateRoundRobinMatches(playerIds);
        bracket = {
          matches,
          standings: tournamentService.calculateRoundRobinStandings(
            playerIds,
            matches,
            playerNames
          ),
        };
      }

      res.json({ bracket, format: tournament.format });
    } catch (error) {
      console.error('Error generating bracket:', error);
      res.status(500).json({ error: 'Failed to generate bracket' });
    }
  }

  /**
   * PATCH /api/tournaments/:id/status
   * Update tournament status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const validation = updateTournamentStatusSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const tournament = await tournamentService.updateTournamentStatus(
        req.params.id,
        validation.data.status as any
      );

      res.json({ tournament });
    } catch (error) {
      console.error('Error updating tournament status:', error);
      res.status(500).json({ error: 'Failed to update tournament status' });
    }
  }

  /**
   * POST /api/tournaments/:id/match-result
   * Record match result in tournament
   */
  async recordMatchResult(req: Request, res: Response): Promise<void> {
    try {
      const validation = recordBracketMatchSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const result = await tournamentService.recordBracketMatch(
        req.params.id,
        validation.data.matchId,
        validation.data.player1Score,
        validation.data.player2Score
      );

      res.json({ result });
    } catch (error) {
      console.error('Error recording match result:', error);
      res.status(500).json({ error: 'Failed to record match result' });
    }
  }
}

export default new TournamentController();
