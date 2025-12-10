import express from 'express';
import attendanceController from '../controllers/attendanceController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/attendance
 * Check in a member to a practice
 */
router.post('/', (req, res) => attendanceController.checkInMember(req, res));

/**
 * POST /api/attendance/self-check-in
 * Self check-in for current user
 */
router.post('/self-check-in', (req, res) => attendanceController.selfCheckIn(req, res));

/**
 * POST /api/attendance/guest-check-in
 * Check in a guest for a practice
 * Body: { practiceId, guestId }
 */
router.post('/guest-check-in', (req, res) => attendanceController.guestCheckIn(req, res));

/**
 * GET /api/attendance/user
 * Get current user's attendance records
 */
router.get('/user', (req, res) => attendanceController.getUserAttendance(req, res));

/**
 * GET /api/attendance/practice/:practiceId
 * Get all attendances for a practice
 */
router.get('/practice/:practiceId', (req, res) =>
  attendanceController.getPracticeAttendance(req, res)
);

/**
 * GET /api/attendance/daily/:practiceId
 * Get daily attendance summary for a practice
 */
router.get('/daily/:practiceId', (req, res) =>
  attendanceController.getDailyAttendance(req, res)
);

/**
 * GET /api/attendance/member/:memberId/club/:clubId/stats
 * Get attendance statistics for a member
 */
router.get('/member/:memberId/club/:clubId/stats', (req, res) =>
  attendanceController.getMemberAttendanceStats(req, res)
);

/**
 * GET /api/attendance/member/:memberId
 * Get attendance history for a member
 */
router.get('/member/:memberId', (req, res) =>
  attendanceController.getMemberAttendance(req, res)
);

/**
 * GET /api/attendance/club/:clubId/export/csv
 * Export attendance to CSV
 */
router.get('/club/:clubId/export/csv', (req, res) =>
  attendanceController.exportAttendanceToCSV(req, res)
);

/**
 * GET /api/attendance/club/:clubId/report
 * Get attendance report for a date range
 */
router.get('/club/:clubId/report', (req, res) =>
  attendanceController.getAttendanceReport(req, res)
);

/**
 * GET /api/attendance/club/:clubId/history
 * Get attendance history for a club
 */
router.get('/club/:clubId/history', (req, res) =>
  attendanceController.getClubAttendanceHistory(req, res)
);

/**
 * GET /api/attendance/club/:clubId/weekly
 * Get weekly statistics
 */
router.get('/club/:clubId/weekly', (req, res) =>
  attendanceController.getWeeklyStats(req, res)
);

/**
 * DELETE /api/attendance/:id
 * Remove a check-in (mark as absent)
 */
router.delete('/:id', (req, res) => attendanceController.removeCheckIn(req, res));

export default router;
