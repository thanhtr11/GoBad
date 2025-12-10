import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface TournamentFormProps {
  clubId: string;
  practiceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TournamentForm: React.FC<TournamentFormProps> = ({
  clubId,
  practiceId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    format: 'KNOCKOUT' as 'KNOCKOUT' | 'ROUND_ROBIN',
  });

  const createTournamentMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        '/api/tournaments',
        {
          clubId,
          practiceId,
          name: formData.name,
          format: formData.format,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Tournament name is required');
      return;
    }
    createTournamentMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900">Create Tournament</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tournament Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Sunrise Club Championship"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="KNOCKOUT"
              checked={formData.format === 'KNOCKOUT'}
              onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Knockout (single elimination)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="ROUND_ROBIN"
              checked={formData.format === 'ROUND_ROBIN'}
              onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Round Robin (everyone plays everyone)</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={createTournamentMutation.isPending}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {createTournamentMutation.isPending ? 'Creating...' : 'Create Tournament'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {createTournamentMutation.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Failed to create tournament. Please try again.
        </div>
      )}
    </form>
  );
};

export default TournamentForm;
