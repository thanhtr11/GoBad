import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface FinanceFormProps {
  clubId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id?: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    date: string;
    description?: string;
  };
}

const FinanceForm: React.FC<FinanceFormProps> = ({
  clubId,
  onSuccess,
  onCancel,
  initialData,
}) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData?.id;

  const [formData, setFormData] = useState({
    type: initialData?.type || ('INCOME' as 'INCOME' | 'EXPENSE'),
    category: initialData?.category || 'MEMBERSHIP_FEE',
    amount: initialData?.amount || 0,
    date: initialData?.date || new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('auth_token');

      if (isEditMode && initialData?.id) {
        const response = await axios.patch(
          `/api/finances/${initialData.id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } else {
        const response = await axios.post(
          '/api/finances',
          { ...data, clubId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-finances', clubId] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary', clubId] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Error saving transaction:', error);
      if (error.response?.data?.details) {
        const validationErrors: Record<string, string> = {};
        error.response.data.details.forEach((err: any) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    mutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const categoryOptions = {
    INCOME: [
      { value: 'MEMBERSHIP_FEE', label: 'Membership Fee' },
      { value: 'DONATION', label: 'Donation' },
      { value: 'OTHER', label: 'Other Income' },
    ],
    EXPENSE: [
      { value: 'EQUIPMENT', label: 'Equipment' },
      { value: 'COURT_RENTAL', label: 'Court Rental' },
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'OTHER', label: 'Other Expense' },
    ],
  };

  const categories = categoryOptions[formData.type];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
        </h3>
      </div>

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Type *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="type"
              value="INCOME"
              checked={formData.type === 'INCOME'}
              onChange={handleChange}
              className="mr-2 text-green-600 focus:ring-green-500"
            />
            <span
              className={`px-4 py-2 rounded-lg font-semibold ${
                formData.type === 'INCOME'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              💰 Income
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="type"
              value="EXPENSE"
              checked={formData.type === 'EXPENSE'}
              onChange={handleChange}
              className="mr-2 text-red-600 focus:ring-red-500"
            />
            <span
              className={`px-4 py-2 rounded-lg font-semibold ${
                formData.type === 'EXPENSE'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              💸 Expense
            </span>
          </label>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount (VND) *
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
            ₫
          </span>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            step="1000"
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            required
          />
        </div>
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Add notes about this transaction..."
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Saving...' : isEditMode ? 'Update Transaction' : 'Add Transaction'}
        </button>
      </div>

      {mutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {mutation.error instanceof Error ? mutation.error.message : 'Failed to save transaction'}
          </p>
        </div>
      )}
    </form>
  );
};

export default FinanceForm;
