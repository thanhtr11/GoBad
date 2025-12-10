import express from 'express';
import financeController from '../controllers/financeController';
import { authMiddleware } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';

const router = express.Router();

// All finance routes require authentication
router.use(authMiddleware);

// Create a new financial transaction (Admin only)
router.post('/', adminOnly, financeController.createTransaction.bind(financeController));

// Get all financial transactions for a club (with optional filters)
router.get(
  '/club/:clubId',
  financeController.getClubFinances.bind(financeController)
);

// Get financial summary for a club
router.get(
  '/club/:clubId/summary',
  financeController.getFinancialSummary.bind(financeController)
);

// Get financial trends (monthly breakdown)
router.get(
  '/club/:clubId/trends',
  financeController.getFinancialTrends.bind(financeController)
);

// Get category breakdown
router.get(
  '/club/:clubId/categories',
  financeController.getCategoryBreakdown.bind(financeController)
);

// Export to CSV
router.get(
  '/club/:clubId/export/csv',
  financeController.exportToCSV.bind(financeController)
);

// Get a single transaction by ID
router.get('/:id', financeController.getTransaction.bind(financeController));

// Update a financial transaction
router.patch('/:id', financeController.updateTransaction.bind(financeController));

// Delete a financial transaction (Admin only)
router.delete('/:id', adminOnly, financeController.deleteTransaction.bind(financeController));

export default router;
