import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';

const guestCheckInSchema = z.object({
  clubId: z.string().min(1, 'Club is required'),
  guestName: z.string().min(2, 'Guest name must be at least 2 characters'),
  checkedInById: z.string().min(1, 'Member is required'),
});

type GuestCheckInFormData = z.infer<typeof guestCheckInSchema>;

interface Member {
  id: string;
  name: string;
  type?: 'MEMBER' | 'GUEST';
}

interface GuestCheckInFormProps {
  clubId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const GuestCheckInForm: React.FC<GuestCheckInFormProps> = ({
  clubId,
  onSuccess,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestCheckInFormData>({
    resolver: zodResolver(guestCheckInSchema),
    defaultValues: {
      clubId,
    },
  });

  // Fetch club members for the dropdown
  const { data: members = [] } = useQuery({
    queryKey: ['clubMembers', clubId],
    queryFn: async () => {
      const response = await api.get(`/members?clubId=${clubId}`);
      return response.data?.members?.filter((m: Member) => m.type === 'MEMBER') || [];
    },
    enabled: !!clubId,
  });

  const onSubmit = async (data: GuestCheckInFormData) => {
    setIsLoading(true);
    try {
      await api.post('/members/guest/check-in', data);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to check in guest:', error);
      alert('Failed to check in guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Check In Guest</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Guest Name *
          </label>
          <input
            {...register('guestName')}
            type="text"
            placeholder="Enter guest name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.guestName && (
            <p className="text-red-600 text-sm mt-1">{errors.guestName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Checked In By *
          </label>
          <select
            {...register('checkedInById')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a member</option>
            {members.map((member: Member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          {errors.checkedInById && (
            <p className="text-red-600 text-sm mt-1">{errors.checkedInById.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Checking In...' : 'Check In Guest'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuestCheckInForm;
