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

interface Manager {
  id: string;
  userId: string;
  clubId: string;
  user: {
    id: string;
    username: string;
    name?: string;
    email?: string;
    role: string;
  };
}

interface ManagerModalProps {
  clubId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ManagerModal: React.FC<ManagerModalProps> = ({
  clubId,
  onClose,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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

  // Fetch current managers for this club
  const { data: managersData = [] } = useQuery<Manager[]>({
    queryKey: ['club-managers', clubId],
    queryFn: async () => {
      const response = await api.get(`/clubs/${clubId}/managers`);
      return response.data.managers || [];
    },
  });

  // Get IDs of current managers
  const currentManagerIds = useMemo(
    () => new Set(managersData.map((m) => m.userId)),
    [managersData]
  );

  // Filter users based on search term and exclude current managers
  const filteredUsers = useMemo(() => {
    let filtered = usersData;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
      );
    }

    // Exclude current managers from the list
    return filtered.filter((user) => !currentManagerIds.has(user.id));
  }, [usersData, searchTerm, currentManagerIds]);

  const selectedUser = selectedUserId
    ? usersData.find((u) => u.id === selectedUserId)
    : null;

  // Mutation for assigning manager
  const assignManagerMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/clubs/${clubId}/managers`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-managers', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setSelectedUserId(null);
      setSearchTerm('');
      onSuccess?.();
    },
  });

  // Mutation for removing manager
  const removeManagerMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/clubs/${clubId}/managers/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-managers', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      onSuccess?.();
    },
  });

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignManagerMutation.mutateAsync(selectedUserId);
    } catch (error: any) {
      console.error('Failed to assign manager:', error);
      alert(
        error.response?.data?.error || 'Failed to assign manager. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveManager = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this manager?')) {
      return;
    }

    try {
      await removeManagerMutation.mutateAsync(userId);
    } catch (error: any) {
      console.error('Failed to remove manager:', error);
      alert(
        error.response?.data?.error || 'Failed to remove manager. Please try again.'
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Manage Club Managers</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-800 rounded-full p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Current Managers Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Current Managers
            </label>
            {managersData.length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                No managers assigned yet
              </div>
            ) : (
              <div className="space-y-2">
                {managersData.map((manager) => (
                  <div
                    key={manager.userId}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {manager.user.name || manager.user.username}
                      </div>
                      <div className="text-sm text-gray-600">
                        @{manager.user.username}
                        {manager.user.email && ` • ${manager.user.email}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveManager(manager.userId)}
                      disabled={removeManagerMutation.isPending}
                      className="ml-2 px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {removeManagerMutation.isPending ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Manager Section */}
          <form onSubmit={handleAssignManager} className="space-y-6 border-t pt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Assign New Manager
              </label>

              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by username, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* User List */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm
                      ? 'No users found'
                      : 'All users are already managers or start typing to search'}
                  </div>
                ) : (
                  <ul className="divide-y">
                    {filteredUsers.map((user) => (
                      <li key={user.id}>
                        <label className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name="manager-user"
                            value={user.id}
                            checked={selectedUserId === user.id}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <div className="ml-4 flex-1">
                            <div className="font-semibold text-gray-900">
                              {user.name || user.username}
                            </div>
                            <div className="text-sm text-gray-600">
                              @{user.username}
                              {user.email && ` • ${user.email}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Role:{' '}
                              <span className="font-medium">{user.role}</span>
                              {user.skillLevel &&
                                ` • Skill: ${user.skillLevel}`}
                            </div>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Selected User Info */}
            {selectedUser && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-gray-900">
                  {selectedUser.name || selectedUser.username}
                </div>
                <div className="text-sm text-gray-600">
                  @{selectedUser.username}
                  {selectedUser.email && ` • ${selectedUser.email}`}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={
                  !selectedUserId ||
                  isSubmitting ||
                  assignManagerMutation.isPending
                }
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {assignManagerMutation.isPending
                  ? 'Assigning...'
                  : 'Assign Manager'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManagerModal;
