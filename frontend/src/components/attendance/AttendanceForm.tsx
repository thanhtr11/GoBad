import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

interface AttendanceFormProps {
  practiceId: string;
  clubId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
  skillLevel: string;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  practiceId,
  clubId,
  onSuccess,
  onCancel,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch club members
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['members', clubId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/members/club/${clubId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Check in member mutation
  const checkInMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          practiceId,
          memberId,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Check-in failed');
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess('Check-in successful!');
      setSelectedMemberId('');
      setTimeout(() => {
        setSuccess('');
        onSuccess?.();
      }, 2000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to check in');
    },
  });

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isGuest) {
      if (!guestName.trim()) {
        setError('Guest name is required');
        return;
      }
      // In a real app, you might create a guest record
      setSuccess(`Guest ${guestName} checked in!`);
      setGuestName('');
      setGuestEmail('');
      setTimeout(() => {
        setSuccess('');
        onSuccess?.();
      }, 2000);
    } else {
      if (!selectedMemberId) {
        setError('Please select a member');
        return;
      }
      checkInMutation.mutate(selectedMemberId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Check In</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleCheckIn}>
        {/* Member/Guest Toggle */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!isGuest}
                onChange={() => setIsGuest(false)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Club Member</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={isGuest}
                onChange={() => setIsGuest(true)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Guest</span>
            </label>
          </div>
        </div>

        {/* Member Selection */}
        {!isGuest && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Choose a member --</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.skillLevel})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Guest Name */}
        {isGuest && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Name *
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter guest name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Email
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={checkInMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkInMutation.isPending ? 'Checking in...' : 'Check In'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceForm;
