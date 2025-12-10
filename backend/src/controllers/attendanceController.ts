import { Request, Response } from 'express';
import attendanceService from '../services/attendanceService';
import { z } from 'zod';

// Validation schemas
const checkInSchema = z.object({
  practiceId: z.string().min(1, 'Practice ID required'),
  memberId: z.string().min(1, 'Member ID required'),
});

const getHistorySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  memberId: z.string().optional(),
});

const getReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

class AttendanceController {
  /**
   * Check in a member
   */
  async checkInMember(req: Request, res: Response) {
    try {
      const parsed = checkInSchema.parse(req.body);

      const result = await attendanceService.checkInMember(
        parsed.practiceId,
        parsed.memberId
      );

      return res.status(201).json({
        success: true,
        message: 'Member checked in successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error checking in member',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Self check-in for current user
   */
  async selfCheckIn(req: Request, res: Response) {
    try {
      const { practiceId } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      if (!practiceId) {
        return res.status(400).json({
          success: false,
          message: 'Practice ID is required',
        });
      }

      const result = await attendanceService.selfCheckIn(userId, practiceId);

      return res.status(201).json({
        success: true,
        message: 'Self check-in successful',
        data: result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Return 400 for member profile not found
      if (errorMessage.includes('Member profile not found')) {
        return res.status(400).json({
          success: false,
          message: 'User is not a member of any club. Please join a club first.',
          error: errorMessage,
        });
      }
      
      // Return 400 for practice not found
      if (errorMessage.includes('Practice not found')) {
        return res.status(400).json({
          success: false,
          message: 'Practice not found',
          error: errorMessage,
        });
      }
      
      // Return 400 for practice doesn't belong to club
      if (errorMessage.includes('does not belong to your club')) {
        return res.status(400).json({
          success: false,
          message: 'Practice does not belong to your club',
          error: errorMessage,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error during self check-in',
        error: errorMessage,
      });
    }
  }

  /**
   * Get practice attendance
   */
  async getPracticeAttendance(req: Request, res: Response) {
    try {
      const { practiceId } = req.params;

      if (!practiceId) {
        return res.status(400).json({
          success: false,
          message: 'Practice ID is required',
        });
      }

      const attendance = await attendanceService.getPracticeAttendance(practiceId);

      return res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching practice attendance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get current user's attendance records
   */
  async getUserAttendance(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const attendance = await attendanceService.getUserAttendance(userId);

      return res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching user attendance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get member attendance
   */
  async getMemberAttendance(req: Request, res: Response) {
    try {
      const { memberId } = req.params;
      const parsed = getHistorySchema.parse(req.query);

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message: 'Member ID is required',
        });
      }

      const attendance = await attendanceService.getMemberAttendance(
        memberId,
        parsed.startDate ? new Date(parsed.startDate) : undefined,
        parsed.endDate ? new Date(parsed.endDate) : undefined
      );

      return res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching member attendance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get member stats
   */
  async getMemberAttendanceStats(req: Request, res: Response) {
    try {
      const { memberId, clubId } = req.params;

      if (!memberId || !clubId) {
        return res.status(400).json({
          success: false,
          message: 'Member ID and Club ID are required',
        });
      }

      const stats = await attendanceService.getMemberAttendanceStats(memberId, clubId);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching member statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get daily attendance
   */
  async getDailyAttendance(req: Request, res: Response) {
    try {
      const { practiceId } = req.params;

      if (!practiceId) {
        return res.status(400).json({
          success: false,
          message: 'Practice ID is required',
        });
      }

      const attendance = await attendanceService.getDailyAttendance(practiceId);

      return res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching daily attendance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get club attendance history
   */
  async getClubAttendanceHistory(req: Request, res: Response) {
    try {
      const { clubId } = req.params;

      if (!clubId) {
        return res.status(400).json({
          success: false,
          message: 'Club ID is required',
        });
      }

      const history = await attendanceService.getClubAttendanceHistory(clubId);

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching attendance history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get attendance report
   */
  async getAttendanceReport(req: Request, res: Response) {
    try {
      const { clubId } = req.params;
      const parsed = getReportSchema.parse(req.query);

      if (!clubId) {
        return res.status(400).json({
          success: false,
          message: 'Club ID is required',
        });
      }

      const startDate = new Date(parsed.startDate);
      const endDate = new Date(parsed.endDate);

      const report = await attendanceService.getAttendanceReport(
        clubId,
        startDate,
        endDate
      );

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error generating attendance report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Export attendance to CSV
   */
  async exportAttendanceToCSV(req: Request, res: Response) {
    try {
      const { clubId } = req.params;

      if (!clubId) {
        return res.status(400).json({
          success: false,
          message: 'Club ID is required',
        });
      }

      const csv = await attendanceService.exportAttendanceToCSV(clubId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="attendance-${clubId}-${new Date().toISOString().split('T')[0]}.csv"`
      );

      return res.send(csv);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error exporting attendance data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get weekly statistics
   */
  async getWeeklyStats(req: Request, res: Response) {
    try {
      const { clubId } = req.params;

      if (!clubId) {
        return res.status(400).json({
          success: false,
          message: 'Club ID is required',
        });
      }

      const stats = await attendanceService.getWeeklyStats(clubId);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching weekly statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Remove check-in (mark as absent)
   */
  async removeCheckIn(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Attendance ID is required',
        });
      }

      await attendanceService.removeCheckIn(id);

      return res.status(200).json({
        success: true,
        message: 'Check-in removed successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Attendance record not found') {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found',
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error removing check-in',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check in a guest for a practice
   */
  async guestCheckIn(req: Request, res: Response) {
    try {
      const { practiceId, guestId } = req.body;

      if (!practiceId || !guestId) {
        return res.status(400).json({
          success: false,
          message: 'Practice ID and Guest ID are required',
        });
      }

      const result = await attendanceService.checkInGuest(practiceId, guestId);

      return res.status(201).json({
        success: true,
        message: 'Guest checked in successfully',
        attendance: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking in guest',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AttendanceController();
