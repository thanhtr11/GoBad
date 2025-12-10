import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ExportButtons } from '../common/ExportButtons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FinancialReportProps {
  clubId: string;
}

const FinancialReport: React.FC<FinancialReportProps> = ({ clubId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('12');

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary', clubId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/finances/club/${clubId}/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    enabled: !!clubId,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['financial-trends', clubId, selectedPeriod],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/finances/club/${clubId}/trends?months=${selectedPeriod}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    enabled: !!clubId,
  });

  const { data: incomeCategories } = useQuery({
    queryKey: ['income-categories', clubId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/finances/club/${clubId}/categories?type=INCOME`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    enabled: !!clubId,
  });

  const { data: expenseCategories } = useQuery({
    queryKey: ['expense-categories', clubId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/finances/club/${clubId}/categories?type=EXPENSE`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    enabled: !!clubId,
  });

  const COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
  ];

  const categoryLabels: Record<string, string> = {
    MEMBERSHIP_FEE: 'Membership Fee',
    DONATION: 'Donation',
    EQUIPMENT: 'Equipment',
    COURT_RENTAL: 'Court Rental',
    MAINTENANCE: 'Maintenance',
    OTHER: 'Other',
  };

  if (summaryLoading || trendsLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 Financial Report</h2>
              <p className="text-gray-600 text-sm mt-1">Overview of income and expenses</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="3">Last 3 months</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
              </select>
            </div>
          </div>
          <ExportButtons clubId={clubId} showFinance={true} />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Income */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">💰 Total Income</h3>
              <div className="text-3xl">📈</div>
            </div>
            <p className="text-4xl font-bold">₫{summary.totalIncome.toLocaleString('vi-VN')}</p>
            <p className="text-green-100 text-sm mt-2">All-time earnings</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">💸 Total Expenses</h3>
              <div className="text-3xl">📉</div>
            </div>
            <p className="text-4xl font-bold">₫{summary.totalExpenses.toLocaleString('vi-VN')}</p>
            <p className="text-red-100 text-sm mt-2">All-time spending</p>
          </div>

          {/* Current Balance */}
          <div
            className={`bg-gradient-to-br ${
              summary.balance >= 0
                ? 'from-blue-500 to-indigo-600'
                : 'from-orange-500 to-red-600'
            } rounded-lg shadow-lg p-6 text-white`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">💵 Current Balance</h3>
              <div className="text-3xl">{summary.balance >= 0 ? '✓' : '⚠️'}</div>
            </div>
            <p className="text-4xl font-bold">₫{Math.abs(summary.balance).toLocaleString('vi-VN')}</p>
            <p className="text-blue-100 text-sm mt-2">
              {summary.balance >= 0 ? 'Positive balance' : 'Deficit'}
            </p>
          </div>
        </div>
      )}

      {/* Income vs Expense Trends */}
      {trends && trends.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Income vs Expenses Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                name="Income"
                dot={{ fill: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#EF4444"
                strokeWidth={2}
                name="Expenses"
                dot={{ fill: '#EF4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Balance Bar Chart */}
      {trends && trends.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Monthly Balance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="balance" fill="#3B82F6" name="Balance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income by Category */}
        {incomeCategories && incomeCategories.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Income by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeCategories.map((cat: any) => ({
                    name: categoryLabels[cat.category] || cat.category,
                    value: cat.total,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeCategories.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `₫${value.toLocaleString('vi-VN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expenses by Category */}
        {expenseCategories && expenseCategories.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💸 Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategories.map((cat: any) => ({
                    name: categoryLabels[cat.category] || cat.category,
                    value: cat.total,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategories.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `₫${value.toLocaleString('vi-VN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Transaction Count */}
      {summary && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">📝 Total Transactions</h3>
              <p className="text-4xl font-bold">{summary.transactionCount}</p>
            </div>
            <div className="text-6xl opacity-50">💳</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReport;
