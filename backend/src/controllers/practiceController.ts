import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { practiceService } from '../services/practiceService';
import { ValidationError, HTTPError } from '../middleware/errorHandler';

// Validation schemas
const createPracticeSchema = z.object({
  clubId: z.string().uuid('Invalid club ID'),
  date: z.string().datetime('Invalid date format'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  court: z.string().min(1, 'Court is required'),
  expectedParticipants: z.number().int().min(0).optional(),
  isTournament: z.boolean().optional(),
});

const updatePracticeSchema = z.object({
  date: z.string().datetime('Invalid date format').optional(),
  startTime: z.string().datetime('Invalid start time format').optional(),
  endTime: z.string().datetime('Invalid end time format').optional(),
  court: z.string().min(1, 'Court is required').optional(),
  expectedParticipants: z.number().int().min(0).optional(),
  isTournament: z.boolean().optional(),
});

interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

class PracticeController {
  /**
   * POST /api/practices
   * Create new practice session
   */
  async createPractice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validation = createPracticeSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ValidationError(validation.error.issues[0].message);
      }

      const { clubId, date, startTime, endTime, court, expectedParticipants, isTournament } =
        validation.data;

      const practice = await practiceService.createPractice({
        clubId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        court,
        expectedParticipants,
        isTournament,
      });

      res.status(201).json({
        message: 'Practice scheduled successfully',
        practice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/practices
   * Get practices with filters
   */
  async getPractices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const { clubId, startDate, endDate } = req.query;

      const practices = await practiceService.getPractices(
        clubId as string | undefined,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        message: 'Practices retrieved successfully',
        count: practices.length,
        practices,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/practices/:id
   * Get specific practice
   */
  async getPracticeById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const practice = await practiceService.getPracticeById(id);

      res.status(200).json({
        message: 'Practice retrieved successfully',
        practice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/practices/:id
   * Update practice
   */
  async updatePractice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const validation = updatePracticeSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ValidationError(validation.error.issues[0].message);
      }

      const updateData: any = {};
      if (validation.data.date) updateData.date = new Date(validation.data.date);
      if (validation.data.startTime) updateData.startTime = new Date(validation.data.startTime);
      if (validation.data.endTime) updateData.endTime = new Date(validation.data.endTime);
      if (validation.data.court) updateData.court = validation.data.court;
      if (validation.data.expectedParticipants !== undefined)
        updateData.expectedParticipants = validation.data.expectedParticipants;
      if (validation.data.isTournament !== undefined)
        updateData.isTournament = validation.data.isTournament;

      const practice = await practiceService.updatePractice(id, updateData);

      res.status(200).json({
        message: 'Practice updated successfully',
        practice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/practices/:id
   * Delete practice
   */
  async deletePractice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const result = await practiceService.deletePractice(id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/practices/club/:clubId
   * Get club practices
   */
  async getClubPractices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clubId } = req.params;
      const { startDate, endDate } = req.query;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const practices = await practiceService.getClubPractices(
        clubId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        message: 'Club practices retrieved successfully',
        count: practices.length,
        practices,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/practices/:id/attendance
   * Get practice attendance
   */
  async getPracticeAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const attendance = await practiceService.getPracticeAttendance(id);

      res.status(200).json({
        message: 'Practice attendance retrieved successfully',
        count: attendance.length,
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/practices/:id/guests
   * Get guests for a specific practice
   */
  async getPracticeGuests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const guests = await practiceService.getPracticeGuests(id);

      res.status(200).json({
        message: 'Practice guests retrieved successfully',
        guests,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const practiceController = new PracticeController();
