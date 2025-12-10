import { PrismaClient, FinanceType, FinanceCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  recentTransactions: any[];
}

export interface FinanceFilters {
  type?: FinanceType;
  category?: FinanceCategory;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

class FinanceService {
  /**
   * Create a new financial transaction
   */
  async createTransaction(
    clubId: string,
    type: FinanceType,
    category: FinanceCategory,
    amount: number,
    date: Date,
    description?: string
  ) {
    const transaction = await prisma.finance.create({
      data: {
        clubId,
        type,
        category,
        amount,
        date,
        description,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return transaction;
  }

  /**
   * Get all financial transactions for a club with optional filters
   */
  async getClubFinances(clubId: string, filters?: FinanceFilters) {
    const where: any = { clubId };

    if (filters) {
      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.date.lte = filters.endDate;
        }
      }

      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.amount = {};
        if (filters.minAmount !== undefined) {
          where.amount.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          where.amount.lte = filters.maxAmount;
        }
      }

      if (filters.search) {
        where.description = {
          contains: filters.search,
          mode: 'insensitive',
        };
      }
    }

    const transactions = await prisma.finance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return transactions;
  }

  /**
   * Get a single transaction by ID
   */
  async getTransactionById(transactionId: string) {
    return await prisma.finance.findUnique({
      where: { id: transactionId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update a financial transaction
   */
  async updateTransaction(
    transactionId: string,
    data: {
      type?: FinanceType;
      category?: FinanceCategory;
      amount?: number;
      date?: Date;
      description?: string;
    }
  ) {
    const transaction = await prisma.finance.update({
      where: { id: transactionId },
      data,
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return transaction;
  }

  /**
   * Delete a financial transaction
   */
  async deleteTransaction(transactionId: string) {
    return await prisma.finance.delete({
      where: { id: transactionId },
    });
  }

  /**
   * Get comprehensive financial summary for a club
   */
  async getFinancialSummary(clubId: string, filters?: FinanceFilters): Promise<FinancialSummary> {
    const transactions = await this.getClubFinances(clubId, filters);

    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);

      if (transaction.type === 'INCOME') {
        totalIncome += amount;
        incomeByCategory[transaction.category] =
          (incomeByCategory[transaction.category] || 0) + amount;
      } else if (transaction.type === 'EXPENSE') {
        totalExpenses += amount;
        expenseByCategory[transaction.category] =
          (expenseByCategory[transaction.category] || 0) + amount;
      }
    });

    const balance = totalIncome - totalExpenses;

    // Get recent transactions (last 10)
    const recentTransactions = transactions.slice(0, 10);

    return {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: transactions.length,
      incomeByCategory,
      expenseByCategory,
      recentTransactions,
    };
  }

  /**
   * Get financial trend data (monthly breakdown)
   */
  async getFinancialTrends(clubId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.finance.findMany({
      where: {
        clubId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthlyData: Record<
      string,
      { income: number; expense: number; balance: number }
    > = {};

    transactions.forEach((transaction) => {
      const monthKey = new Date(transaction.date).toISOString().substring(0, 7); // YYYY-MM
      const amount = Number(transaction.amount);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, balance: 0 };
      }

      if (transaction.type === 'INCOME') {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expense += amount;
      }

      monthlyData[monthKey].balance =
        monthlyData[monthKey].income - monthlyData[monthKey].expense;
    });

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get category breakdown for charts
   */
  async getCategoryBreakdown(clubId: string, type?: FinanceType) {
    const where: any = { clubId };
    if (type) {
      where.type = type;
    }

    const transactions = await prisma.finance.findMany({
      where,
    });

    const categoryTotals: Record<string, number> = {};

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);
      categoryTotals[transaction.category] =
        (categoryTotals[transaction.category] || 0) + amount;
    });

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
    }));
  }

  /**
   * Export financial data to CSV format
   */
  async exportToCSV(clubId: string, filters?: FinanceFilters): Promise<string> {
    const transactions = await this.getClubFinances(clubId, filters);

    // CSV header
    const header = 'Date,Type,Category,Amount,Description,Club\n';

    // CSV rows
    const rows = transactions
      .map((transaction) => {
        const date = new Date(transaction.date).toISOString().split('T')[0];
        const type = transaction.type;
        const category = transaction.category;
        const amount = Number(transaction.amount).toFixed(2);
        const description = (transaction.description || '').replace(/,/g, ';'); // Escape commas
        const club = transaction.club.name;

        return `${date},${type},${category},${amount},"${description}",${club}`;
      })
      .join('\n');

    return header + rows;
  }
}

export default new FinanceService();
