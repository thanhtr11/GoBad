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
  scheduledDate: z.string().optional(),
  court: z.string().optional(),
});

const addParticipantSchema = z.object({
  memberId: z.string().uuid(),
  seedRank: z.number().int().min(1).optional(),
});

const recordMatchResultSchema = z.object({
  matchId: z.string().uuid(),
  player1Score: z.number().int().min(0),
  player2Score: z.number().int().min(0),
  scheduledDate: z.string().optional(),
  court: z.string().optional(),
});

const scheduleMatchSchema = z.object({
  scheduledDate: z.string(),
  court: z.string().optional(),
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

  /**
   * POST /api/tournaments/:id/participants
   * Add participant to tournament
   */
  async addParticipant(req: Request, res: Response): Promise<void> {
    try {
      const validation = addParticipantSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      console.log('Controller: Adding participant to tournament', { 
        tournamentId: req.params.id, 
        memberId: validation.data.memberId 
      });

      const participant = await tournamentService.addParticipant(
        req.params.id,
        validation.data.memberId,
        validation.data.seedRank
      );

      console.log('Controller: Participant added:', participant);

      // After adding, fetch all participants to return the updated list
      const participants = await tournamentService.getParticipantsWithDetails(req.params.id);

      console.log('Controller: Updated participants list:', participants);

      res.status(201).json({ participant, participants });
    } catch (error) {
      console.error('Error adding participant:', error);
      res.status(500).json({ error: 'Failed to add participant' });
    }
  }

  /**
   * DELETE /api/tournaments/:id/participants/:memberId
   * Remove participant from tournament
   */
  async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      await tournamentService.removeParticipant(req.params.id, req.params.memberId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing participant:', error);
      res.status(500).json({ error: 'Failed to remove participant' });
    }
  }

  /**
   * GET /api/tournaments/:id/participants/details
   * Get all tournament participants with details
   */
  async getParticipantsWithDetails(req: Request, res: Response): Promise<void> {
    try {
      const participants = await tournamentService.getParticipantsWithDetails(req.params.id);
      res.json({ participants });
    } catch (error) {
      console.error('Error fetching participant details:', error);
      res.status(500).json({ error: 'Failed to fetch participants' });
    }
  }

  /**
   * POST /api/tournaments/:id/initialize
   * Initialize all matches for a tournament
   */
  async initializeMatches(req: Request, res: Response): Promise<void> {
    try {
      const matches = await tournamentService.initializeMatches(req.params.id);
      res.status(201).json({ matches, count: matches.length });
    } catch (error) {
      console.error('Error initializing matches:', error);
      res.status(500).json({ error: (error as any).message || 'Failed to initialize matches' });
    }
  }

  /**
   * GET /api/tournaments/:id/matches
   * Get all matches for a tournament
   */
  async getTournamentMatches(req: Request, res: Response): Promise<void> {
    try {
      const matches = await tournamentService.getTournamentMatches(req.params.id);
      res.json({ matches });
    } catch (error) {
      console.error('Error fetching matches:', error);
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }

  /**
   * PATCH /api/tournaments/:id/matches/:matchId
   * Record match result
   */
  async recordMatchResultV2(req: Request, res: Response): Promise<void> {
    try {
      const validation = recordMatchResultSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const match = await tournamentService.recordMatchResult(
        req.params.id,
        req.params.matchId,
        validation.data.player1Score,
        validation.data.player2Score,
        validation.data.scheduledDate,
        validation.data.court
      );

      res.json({ match });
    } catch (error) {
      console.error('Error recording match result:', error);
      res.status(500).json({ error: 'Failed to record match result' });
    }
  }

  /**
   * GET /api/tournaments/:id/standings
   * Get tournament standings
   */
  async getTournamentStandings(req: Request, res: Response): Promise<void> {
    try {
      const standings = await tournamentService.getTournamentStandings(req.params.id);
      res.json({ standings });
    } catch (error) {
      console.error('Error fetching standings:', error);
      res.status(500).json({ error: 'Failed to fetch standings' });
    }
  }

  /**
   * PATCH /api/tournaments/:id/matches/:matchId/schedule
   * Schedule a match
   */
  async scheduleMatch(req: Request, res: Response): Promise<void> {
    try {
      const validation = scheduleMatchSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const match = await tournamentService.scheduleMatch(
        req.params.matchId,
        validation.data.scheduledDate,
        validation.data.court
      );

      res.json({ match });
    } catch (error) {
      console.error('Error scheduling match:', error);
      res.status(500).json({ error: 'Failed to schedule match' });
    }
  }

  /**
   * GET /api/tournaments/:id/stats/:memberId
   * Get player tournament stats
   */
  async getPlayerStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await tournamentService.getPlayerStats(req.params.id, req.params.memberId);

      if (!stats) {
        res.status(404).json({ error: 'Player stats not found' });
        return;
      }

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      res.status(500).json({ error: 'Failed to fetch player stats' });
    }
  }

  /**
   * DELETE /api/tournaments/:id
   * Delete tournament (admin only)
   */
  async deleteTournament(req: Request, res: Response): Promise<void> {
    try {
      await tournamentService.deleteTournament(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      res.status(500).json({ error: 'Failed to delete tournament' });
    }
  }
}

export default new TournamentController();
