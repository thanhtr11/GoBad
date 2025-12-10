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
 * POST /api/tournaments/:id/bracket
 * Get bracket for tournament
 */
router.post('/:id/bracket', (req, res) => tournamentController.getTournamentBracket(req, res));

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

export default router;
