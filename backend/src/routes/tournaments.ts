import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import tournamentController from '../controllers/tournamentController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/tournaments
 * Create a new tournament
 */
router.post('/', (req, res) => tournamentController.createTournament(req, res));

/**
 * GET /api/tournaments/:id
 * Get tournament details
 */
router.get('/:id', (req, res) => tournamentController.getTournament(req, res));

/**
 * GET /api/tournaments/club/:clubId
 * List tournaments for a club
 */
router.get('/club/:clubId', (req, res) => tournamentController.getClubTournaments(req, res));

/**
 * GET /api/tournaments/:id/participants
 * Get tournament participants
 */
router.get('/:id/participants', (req, res) =>
  tournamentController.getTournamentParticipants(req, res)
);

/**
 * GET /api/tournaments/:id/participants/details
 * Get tournament participants with details
 */
router.get('/:id/participants/details', (req, res) =>
  tournamentController.getParticipantsWithDetails(req, res)
);

/**
 * POST /api/tournaments/:id/participants
 * Add participant to tournament
 */
router.post('/:id/participants', (req, res) =>
  tournamentController.addParticipant(req, res)
);

/**
 * DELETE /api/tournaments/:id/participants/:memberId
 * Remove participant from tournament
 */
router.delete('/:id/participants/:memberId', (req, res) =>
  tournamentController.removeParticipant(req, res)
);

/**
 * POST /api/tournaments/:id/bracket
 * Get bracket for tournament
 */
router.post('/:id/bracket', (req, res) => tournamentController.getTournamentBracket(req, res));

/**
 * POST /api/tournaments/:id/initialize
 * Initialize all matches for a tournament
 */
router.post('/:id/initialize', (req, res) =>
  tournamentController.initializeMatches(req, res)
);

/**
 * GET /api/tournaments/:id/matches
 * Get all matches for a tournament
 */
router.get('/:id/matches', (req, res) =>
  tournamentController.getTournamentMatches(req, res)
);

/**
 * PATCH /api/tournaments/:id/matches/:matchId
 * Record match result
 */
router.patch('/:id/matches/:matchId', (req, res) =>
  tournamentController.recordMatchResultV2(req, res)
);

/**
 * PATCH /api/tournaments/:id/matches/:matchId/schedule
 * Schedule a match
 */
router.patch('/:id/matches/:matchId/schedule', (req, res) =>
  tournamentController.scheduleMatch(req, res)
);

/**
 * GET /api/tournaments/:id/standings
 * Get tournament standings
 */
router.get('/:id/standings', (req, res) =>
  tournamentController.getTournamentStandings(req, res)
);

/**
 * GET /api/tournaments/:id/stats/:memberId
 * Get player tournament stats
 */
router.get('/:id/stats/:memberId', (req, res) =>
  tournamentController.getPlayerStats(req, res)
);

/**
 * PATCH /api/tournaments/:id/status
 * Update tournament status
 */
router.patch('/:id/status', (req, res) => tournamentController.updateStatus(req, res));

/**
 * POST /api/tournaments/:id/match-result
 * Record match result in tournament
 */
router.post('/:id/match-result', (req, res) =>
  tournamentController.recordMatchResult(req, res)
);

/**
 * DELETE /api/tournaments/:id
 * Delete tournament (admin only)
 */
router.delete('/:id', (req, res) =>
  tournamentController.deleteTournament(req, res)
);

export default router;
