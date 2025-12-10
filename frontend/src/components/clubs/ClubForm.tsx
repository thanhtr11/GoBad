import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface Club {
  id: string;
  name: string;
  location?: string;
  contactName?: string;
  email?: string;
}

interface ClubFormProps {
  club?: Club | null;
  onClose: () => void;
  onSuccess: () => void;
}

const clubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  location: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type ClubFormData = z.infer<typeof clubSchema>;

export default function ClubForm({ club, onClose, onSuccess }: ClubFormProps) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: club?.name || '',
      location: club?.location || '',
      contactName: club?.contactName || '',
      email: club?.email || '',
    },
  });

  const onSubmit = async (data: ClubFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (club) {
        // Update existing club
        await axios.put(`${"/api"}/clubs/${club.id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new club
        await axios.post(`${"/api"}/clubs`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save club');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">
        {club ? 'Edit Club' : 'Create New Club'}
      </h3>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Club Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Club Name *</label>
        <input
          type="text"
          {...register('name')}
          placeholder="e.g., Badminton Club A"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          {...register('location')}
          placeholder="e.g., Downtown Sports Center"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
      </div>

      {/* Contact Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
        <input
          type="text"
          {...register('contactName')}
          placeholder="e.g., John Doe"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.contactName && (
          <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          {...register('email')}
          placeholder="e.g., contact@badmintonclub.com"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : club ? 'Update Club' : 'Create Club'}
        </button>
      </div>
    </form>
  );
}
