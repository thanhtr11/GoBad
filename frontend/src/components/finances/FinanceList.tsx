import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import FinanceForm from './FinanceForm';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: string;
  date: string;
  description?: string;
  club: {
    id: string;
    name: string;
  };
}

interface FinanceListProps {
  clubId: string;
}

const FinanceList: React.FC<FinanceListProps> = ({ clubId }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['club-finances', clubId, filters],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();

      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(
        `/api/finances/club/${clubId}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    enabled: !!clubId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`/api/finances/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-finances', clubId] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary', clubId] });
    },
  });

  const handleDelete = (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(transactionId);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const categoryLabels: Record<string, string> = {
    MEMBERSHIP_FEE: 'Membership Fee',
    DONATION: 'Donation',
    EQUIPMENT: 'Equipment',
    COURT_RENTAL: 'Court Rental',
    MAINTENANCE: 'Maintenance',
    OTHER: 'Other',
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Form Toggle */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">💳 Transactions</h2>
            <p className="text-gray-600 text-sm mt-1">Manage income and expenses</p>
          </div>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(!showForm);
            }}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            {showForm ? '✕ Cancel' : '+ Add Transaction'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="border-t pt-6">
            <FinanceForm
              clubId={clubId}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              initialData={
                editingTransaction
                  ? {
                      id: editingTransaction.id,
                      type: editingTransaction.type,
                      category: editingTransaction.category,
                      amount: parseFloat(editingTransaction.amount),
                      date: editingTransaction.date.split('T')[0],
                      description: editingTransaction.description,
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              <option value="MEMBERSHIP_FEE">Membership Fee</option>
              <option value="DONATION">Donation</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="COURT_RENTAL">Court Rental</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.type || filters.category || filters.search || filters.startDate || filters.endDate) && (
          <div className="mt-4">
            <button
              onClick={() =>
                setFilters({ type: '', category: '', search: '', startDate: '', endDate: '' })
              }
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              ✕ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction: Transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.type === 'INCOME'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '💰 Income' : '💸 Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {categoryLabels[transaction.category] || transaction.category}
                    </td>
                    <td
                      className={`px-6 py-4 text-right text-lg font-bold ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ₫{parseFloat(transaction.amount).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          disabled={deleteMutation.isPending}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-2">💳</div>
                      <p className="text-lg font-semibold text-gray-600 mb-1">No Transactions Yet</p>
                      <p className="text-sm">Add your first transaction to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceList;
