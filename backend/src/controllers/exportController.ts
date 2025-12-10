import { Request, Response } from 'express';
import exportService from '../services/exportService';
import { z } from 'zod';

const clubIdSchema = z.object({ clubId: z.string() });
const tournamentIdSchema = z.object({ tournamentId: z.string() });

class ExportController {
  async exportFinancePDF(req: Request, res: Response) {
    try {
      const { clubId } = clubIdSchema.parse(req.params);
      const pdf = await exportService.generateFinancePDF(clubId, {
        title: 'Financial Report',
        filename: 'finances.pdf',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="finance-${clubId}.pdf"`);
      return res.send(pdf);
    } catch (error) {
      console.error('PDF export error:', error);
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }

  async exportAttendancePDF(req: Request, res: Response) {
    try {
      const { clubId } = clubIdSchema.parse(req.params);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const pdf = await exportService.generateAttendancePDF(clubId, startDate, endDate, {
        title: 'Attendance Report',
        filename: 'attendance.pdf',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${clubId}.pdf"`);
      return res.send(pdf);
    } catch (error) {
      console.error('PDF export error:', error);
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }

  async exportMemberPDF(req: Request, res: Response) {
    try {
      const { clubId } = clubIdSchema.parse(req.params);
      const pdf = await exportService.generateMemberPDF(clubId, {
        title: 'Member Directory',
        filename: 'members.pdf',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="members-${clubId}.pdf"`);
      return res.send(pdf);
    } catch (error) {
      console.error('PDF export error:', error);
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }

  async exportStatsPDF(req: Request, res: Response) {
    try {
      const { clubId } = clubIdSchema.parse(req.params);
      const pdf = await exportService.generateMatchStatsPDF(clubId, {
        title: 'Match Statistics',
        filename: 'stats.pdf',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="stats-${clubId}.pdf"`);
      return res.send(pdf);
    } catch (error) {
      console.error('PDF export error:', error);
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }

  async exportTournamentPDF(req: Request, res: Response) {
    try {
      const { tournamentId } = tournamentIdSchema.parse(req.params);
      const pdf = await exportService.generateTournamentPDF(tournamentId, {
        title: 'Tournament Results',
        filename: 'tournament.pdf',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="tournament-${tournamentId}.pdf"`);
      return res.send(pdf);
    } catch (error) {
      console.error('PDF export error:', error);
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
}

export default new ExportController();
