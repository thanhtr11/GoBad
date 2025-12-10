import { Request, Response } from 'express';
import { z } from 'zod';
import summaryService from '../services/summaryService';

// Validation schemas
const practiceSummarySchema = z.object({
  practiceId: z.string().uuid(),
});

const practiceSummariesSchema = z.object({
  clubId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(10),
});

class SummaryController {
  /**
   * GET /api/summaries/practice/:practiceId
   * Get summary for a specific practice
   */
  async getPracticeSummary(req: Request, res: Response): Promise<void> {
    try {
      const validation = practiceSummarySchema.safeParse({
        practiceId: req.params.practiceId,
      });

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const summary = await summaryService.getPracticeSummary(
        validation.data.practiceId
      );

      if (!summary) {
        res.status(404).json({ error: 'Practice not found' });
        return;
      }

      res.json({ summary });
    } catch (error) {
      console.error('Error fetching practice summary:', error);
      res.status(500).json({ error: 'Failed to fetch practice summary' });
    }
  }

  /**
   * GET /api/summaries/club/:clubId
   * Get summaries for recent practices in a club
   */
  async getClubSummaries(req: Request, res: Response): Promise<void> {
    try {
      const validation = practiceSummariesSchema.safeParse({
        clubId: req.params.clubId,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      });

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const summaries = await summaryService.getPracticeSummaries(
        validation.data.clubId,
        validation.data.limit
      );

      res.json({ summaries });
    } catch (error) {
      console.error('Error fetching club summaries:', error);
      res.status(500).json({ error: 'Failed to fetch club summaries' });
    }
  }
}

export default new SummaryController();
