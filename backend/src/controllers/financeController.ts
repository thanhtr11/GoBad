import { Request, Response } from 'express';
import { z } from 'zod';
import financeService from '../services/financeService';
import { FinanceType, FinanceCategory } from '@prisma/client';

// Validation schemas
const createFinanceSchema = z.object({
  clubId: z.string().uuid(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.enum([
    'MEMBERSHIP_FEE',
    'DONATION',
    'EQUIPMENT',
    'COURT_RENTAL',
    'MAINTENANCE',
    'OTHER',
  ]),
  amount: z.number().positive(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  description: z.string().optional(),
});

const updateFinanceSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z
    .enum([
      'MEMBERSHIP_FEE',
      'DONATION',
      'EQUIPMENT',
      'COURT_RENTAL',
      'MAINTENANCE',
      'OTHER',
    ])
    .optional(),
  amount: z.number().positive().optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  description: z.string().optional(),
});

const financeFiltersSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z
    .enum([
      'MEMBERSHIP_FEE',
      'DONATION',
      'EQUIPMENT',
      'COURT_RENTAL',
      'MAINTENANCE',
      'OTHER',
    ])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  search: z.string().optional(),
});

class FinanceController {
  /**
   * Create a new financial transaction
   * POST /api/finances
   */
  async createTransaction(req: Request, res: Response) {
    try {
      const validatedData = createFinanceSchema.parse(req.body);

      const transaction = await financeService.createTransaction(
        validatedData.clubId,
        validatedData.type as FinanceType,
        validatedData.category as FinanceCategory,
        validatedData.amount,
        new Date(validatedData.date),
        validatedData.description
      );

      return res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      } else {
        console.error('Error creating transaction:', error);
        return res.status(500).json({ error: 'Failed to create transaction' });
      }
    }
  }

  /**
   * Get all financial transactions for a club
   * GET /api/finances/club/:clubId
   */
  async getClubFinances(req: Request, res: Response) {
    try {
      const { clubId } = req.params;

      if (!clubId) {
        return res.status(400).json({ error: 'Club ID is required' });
      }

      // Parse filters from query params
      const filters = financeFiltersSchema.parse(req.query);

      const parsedFilters: any = {};

      if (filters.type) {
        parsedFilters.type = filters.type;
      }

      if (filters.category) {
        parsedFilters.category = filters.category;
      }

      if (filters.startDate) {
        parsedFilters.startDate = new Date(filters.startDate);
      }

      if (filters.endDate) {
        parsedFilters.endDate = new Date(filters.endDate);
      }

      if (filters.minAmount) {
        parsedFilters.minAmount = parseFloat(filters.minAmount);
      }

      if (filters.maxAmount) {
        parsedFilters.maxAmount = parseFloat(filters.maxAmount);
      }

      if (filters.search) {
        parsedFilters.search = filters.search;
      }

      const transactions = await financeService.getClubFinances(clubId, parsedFilters);

      return res.json(transactions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid filters', details: error.issues });
      } else {
        console.error('Error fetching finances:', error);
        return res.status(500).json({ error: 'Failed to fetch finances' });
      }
    }
  }

  /**
   * Get a single transaction by ID
   * GET /api/finances/:id
   */
  async getTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transaction = await financeService.getTransactionById(id);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      return res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  }

  /**
   * Update a financial transaction
   * PATCH /api/finances/:id
   */
  async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateFinanceSchema.parse(req.body);

      const updateData: any = {};

      if (validatedData.type) {
        updateData.type = validatedData.type;
      }

      if (validatedData.category) {
        updateData.category = validatedData.category;
      }

      if (validatedData.amount !== undefined) {
        updateData.amount = validatedData.amount;
      }

      if (validatedData.date) {
        updateData.date = new Date(validatedData.date);
      }

      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description;
      }

      const transaction = await financeService.updateTransaction(id, updateData);

      return res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      } else {
        console.error('Error updating transaction:', error);
        return res.status(500).json({ error: 'Failed to update transaction' });
      }
    }
  }

  /**
   * Delete a financial transaction
   * DELETE /api/finances/:id
   */
  async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await financeService.deleteTransaction(id);

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }

  /**
   * Get financial summary for a club
   * GET /api/finances/club/:clubId/summary
   */
  async getFinancialSummary(req: Request, res: Response) {
    try {
      const { clubId } = req.params;

      if (!clubId) {
        return res.status(400).json({ error: 'Club ID is required' });
      }

      // Parse filters from query params
      const filters = financeFiltersSchema.parse(req.query);

      const parsedFilters: any = {};

      if (filters.type) {
        parsedFilters.type = filters.type;
      }

      if (filters.category) {
        parsedFilters.category = filters.category;
      }

      if (filters.startDate) {
        parsedFilters.startDate = new Date(filters.startDate);
      }

      if (filters.endDate) {
        parsedFilters.endDate = new Date(filters.endDate);
      }

      const summary = await financeService.getFinancialSummary(clubId, parsedFilters);

      return res.json(summary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid filters', details: error.issues });
      } else {
        console.error('Error fetching financial summary:', error);
        return res.status(500).json({ error: 'Failed to fetch financial summary' });
      }
    }
  }

  /**
   * Get financial trends (monthly breakdown)
   * GET /api/finances/club/:clubId/trends
   */
  async getFinancialTrends(req: Request, res: Response) {
    try {
      const { clubId } = req.params;
      const months = req.query.months ? parseInt(req.query.months as string) : 12;

      const trends = await financeService.getFinancialTrends(clubId, months);

      return res.json(trends);
    } catch (error) {
      console.error('Error fetching financial trends:', error);
      return res.status(500).json({ error: 'Failed to fetch financial trends' });
    }
  }

  /**
   * Get category breakdown
   * GET /api/finances/club/:clubId/categories
   */
  async getCategoryBreakdown(req: Request, res: Response) {
    try {
      const { clubId } = req.params;
      const type = req.query.type as FinanceType | undefined;

      const breakdown = await financeService.getCategoryBreakdown(clubId, type);

      return res.json(breakdown);
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      return res.status(500).json({ error: 'Failed to fetch category breakdown' });
    }
  }

  /**
   * Export financial data to CSV
   * GET /api/finances/club/:clubId/export/csv
   */
  async exportToCSV(req: Request, res: Response) {
    try {
      const { clubId } = req.params;

      // Parse filters from query params
      const filters = financeFiltersSchema.parse(req.query);

      const parsedFilters: any = {};

      if (filters.type) {
        parsedFilters.type = filters.type;
      }

      if (filters.category) {
        parsedFilters.category = filters.category;
      }

      if (filters.startDate) {
        parsedFilters.startDate = new Date(filters.startDate);
      }

      if (filters.endDate) {
        parsedFilters.endDate = new Date(filters.endDate);
      }

      const csvData = await financeService.exportToCSV(clubId, parsedFilters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=finances.csv');
      return res.send(csvData);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return res.status(500).json({ error: 'Failed to export to CSV' });
    }
  }
}

export default new FinanceController();
