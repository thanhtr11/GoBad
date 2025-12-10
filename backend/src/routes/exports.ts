import express from 'express';
import exportController from '../controllers/exportController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All export routes require authentication
router.use(authMiddleware);

/**
 * POST /api/exports/finance/:clubId/pdf
 * Export financial data to PDF
 */
router.get('/finance/:clubId/pdf', (req, res) =>
  exportController.exportFinancePDF(req, res)
);

/**
 * GET /api/exports/attendance/:clubId/pdf
 * Export attendance data to PDF
 */
router.get('/attendance/:clubId/pdf', (req, res) =>
  exportController.exportAttendancePDF(req, res)
);

/**
 * GET /api/exports/members/:clubId/pdf
 * Export member list to PDF
 */
router.get('/members/:clubId/pdf', (req, res) =>
  exportController.exportMemberPDF(req, res)
);

/**
 * GET /api/exports/stats/:clubId/pdf
 * Export match statistics to PDF
 */
router.get('/stats/:clubId/pdf', (req, res) =>
  exportController.exportStatsPDF(req, res)
);

/**
 * GET /api/exports/tournament/:tournamentId/pdf
 * Export tournament results to PDF
 */
router.get('/tournament/:tournamentId/pdf', (req, res) =>
  exportController.exportTournamentPDF(req, res)
);

export default router;
