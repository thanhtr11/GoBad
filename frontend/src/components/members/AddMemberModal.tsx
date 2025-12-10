import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';

interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  role: string;
  skillLevel?: string;
}

interface AddMemberModalProps {
  clubId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  clubId,
  onClose,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [memberType, setMemberType] = useState<'MEMBER' | 'GUEST'>('MEMBER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ACTIVE');
  const [membershipTier, setMembershipTier] = useState<'ADULT' | 'JUNIOR' | 'FAMILY'>('ADULT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: usersData = [] } = useQuery<User[]>({
    queryKey: ['users-all'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users || [];
    },
  });

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return usersData;

    const term = searchTerm.toLowerCase();
    return usersData.filter((user) =>
      user.username.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  }, [usersData, searchTerm]);

  const selectedUser = selectedUserId
    ? usersData.find((u) => u.id === selectedUserId)
    : null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/members', {
        userId: selectedUserId,
        clubId,
        type: memberType,
        status,
        membershipTier,
      });

      // Refetch members list
      queryClient.invalidateQueries({ queryKey: ['members', clubId] });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to add member:', error);
      alert(error.response?.data?.error || 'Failed to add member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Add Member to Club</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-full p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleAddMember} className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Step 1: Search and Select User */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Search and Select User *
            </label>

            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by username, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* User List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No users found' : 'Start typing to search users'}
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredUsers.map((user) => (
                    <li key={user.id}>
                      <label className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="user"
                          value={user.id}
                          checked={selectedUserId === user.id}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-gray-900">{user.name || user.username}</div>
                          <div className="text-sm text-gray-600">
                            @{user.username}
                            {user.email && ` • ${user.email}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Role: <span className="font-medium">{user.role}</span>
                            {user.skillLevel && ` • Skill: ${user.skillLevel}`}
                          </div>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Step 2: Member Details (shown when user is selected) */}
          {selectedUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Selected User</h3>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="font-semibold text-gray-900">{selectedUser.name || selectedUser.username}</div>
                  <div className="text-sm text-gray-600">@{selectedUser.username}</div>
                  {selectedUser.email && (
                    <div className="text-sm text-gray-600">{selectedUser.email}</div>
                  )}
                </div>
              </div>

              {/* Member Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member Type *
                </label>
                <div className="flex gap-4">
                  {(['MEMBER', 'GUEST'] as const).map((type) => (
                    <label key={type} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={memberType === type}
                        onChange={(e) => setMemberType(e.target.value as 'MEMBER' | 'GUEST')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE' | 'EXPIRED')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              {/* Membership Tier */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Membership Tier
                </label>
                <select
                  value={membershipTier}
                  onChange={(e) => setMembershipTier(e.target.value as 'ADULT' | 'JUNIOR' | 'FAMILY')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ADULT">Adult</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="FAMILY">Family</option>
                </select>
              </div>
            </div>
          )}

          {/* Actions - Always visible */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || isSubmitting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !selectedUserId || isSubmitting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
