import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClub } from '../context/ClubContext';
import { api } from '../utils/api';

interface Finance {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'MEMBERSHIP_FEE' | 'DONATION' | 'EQUIPMENT' | 'COURT_RENTAL' | 'MAINTENANCE' | 'OTHER';
  amount: number;
  date: string;
  description?: string;
}

interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

interface CategoryBreakdown {
  category: string;
  income: number;
  expense: number;
  net: number;
}

const FinancesPage: React.FC = () => {
  const { selectedClubId } = useClub();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<'INCOME' | 'EXPENSE' | 'ALL'>('ALL');

  // Fetch finances
  const { data: finances = [], isLoading: financesLoading } = useQuery({
    queryKey: ['finances', selectedClubId, filterType],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const params = new URLSearchParams();
      if (filterType !== 'ALL') {
        params.append('type', filterType);
      }
      const response = await api.get(`/finances/club/${selectedClubId}?${params.toString()}`);
      return response.data.finances || [];
    },
    enabled: !!selectedClubId,
  });

  // Fetch financial summary
  const { data: summary } = useQuery({
    queryKey: ['financeSummary', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return null;
      const response = await api.get(`/finances/club/${selectedClubId}/summary`);
      return response.data;
    },
    enabled: !!selectedClubId,
  });

  // Fetch category breakdown
  const { data: categoryBreakdown = [] } = useQuery({
    queryKey: ['financeCategoryBreakdown', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const response = await api.get(`/finances/club/${selectedClubId}/categories`);
      return response.data.breakdown || [];
    },
    enabled: !!selectedClubId,
  });

  // Create finance mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Finance, 'id'>) => {
      const response = await api.post('/finances', {
        ...data,
        clubId: selectedClubId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      queryClient.invalidateQueries({ queryKey: ['financeCategoryBreakdown'] });
      setShowAddForm(false);
    },
  });

  // Delete finance mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/finances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      queryClient.invalidateQueries({ queryKey: ['financeCategoryBreakdown'] });
    },
  });

  const handleAddFinance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newFinance = {
      type: formData.get('type') as 'INCOME' | 'EXPENSE',
      category: formData.get('category') as Finance['category'],
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
      description: (formData.get('description') as string) || undefined,
    };

    createMutation.mutate(newFinance);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      MEMBERSHIP_FEE: 'Membership Fee',
      DONATION: 'Donation',
      EQUIPMENT: 'Equipment',
      COURT_RENTAL: 'Court Rental',
      MAINTENANCE: 'Maintenance',
      OTHER: 'Other',
    };
    return labels[category] || category;
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
              <p className="text-gray-600 mt-2">Manage your club's finances and expenses</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {showAddForm ? '× Close' : '+ Add Transaction'}
            </button>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {formatCurrency(summary.totalIncome || 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Expense</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {formatCurrency(summary.totalExpense || 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
                <p className={`text-3xl font-bold mt-2 ${(summary.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netBalance || 0)}
                </p>
              </div>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
              <form onSubmit={handleAddFinance} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      name="type"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="MEMBERSHIP_FEE">Membership Fee</option>
                      <option value="DONATION">Donation</option>
                      <option value="EQUIPMENT">Equipment</option>
                      <option value="COURT_RENTAL">Court Rental</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Optional details..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryBreakdown.map((item: CategoryBreakdown) => (
                  <div key={item.category} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{getCategoryLabel(item.category)}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Income:</span>
                        <span className="text-green-600">{formatCurrency(item.income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expense:</span>
                        <span className="text-red-600">{formatCurrency(item.expense)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Net:</span>
                        <span className={item.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(item.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-lg transition ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('INCOME')}
              className={`px-4 py-2 rounded-lg transition ${
                filterType === 'INCOME'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType('EXPENSE')}
              className={`px-4 py-2 rounded-lg transition ${
                filterType === 'EXPENSE'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Expense
            </button>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold">Transactions</h2>
            </div>

            {financesLoading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : finances.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No transactions found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {finances.map((finance: Finance) => (
                      <tr key={finance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(finance.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCategoryLabel(finance.category)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {finance.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            finance.type === 'INCOME'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {finance.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                          finance.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {finance.type === 'INCOME' ? '+' : '-'}{formatCurrency(finance.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => deleteMutation.mutate(finance.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancesPage;
