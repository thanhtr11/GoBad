import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClub } from '../context/ClubContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface Tournament {
  id: string;
  name: string;
  format: 'KNOCKOUT' | 'ROUND_ROBIN';
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  practice?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  participantCount?: number;
}

interface Practice {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  court: string;
  isTournament: boolean;
  club: {
    id: string;
    name: string;
  };
}

const TournamentsPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedClubId } = useClub();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  // Fetch tournaments for selected club
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const response = await api.get(`/tournaments/club/${selectedClubId}`);
      return response.data.tournaments || [];
    },
    enabled: !!selectedClubId,
  });

  // Fetch practices for the form - only tournament practices
  const { data: practices = [] } = useQuery({
    queryKey: ['practices-for-tournament', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const response = await api.get(`/practices/club/${selectedClubId}`);
      const allPractices = response.data.practices || [];
      // Filter to only show practices marked as tournaments
      return allPractices.filter((p: Practice) => p.isTournament);
    },
    enabled: !!selectedClubId,
  });

  // Create tournament mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; practiceId: string; format: 'KNOCKOUT' | 'ROUND_ROBIN' }) => {
      const response = await api.post('/tournaments', {
        ...data,
        clubId: selectedClubId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setShowAddForm(false);
    },
  });

  // Update tournament status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: string; status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' }) => {
      const response = await api.patch(`/tournaments/${data.id}/status`, {
        status: data.status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setSelectedTournament(null);
    },
  });

  // Delete tournament mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tournaments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setSelectedTournament(null);
    },
  });

  const handleAddTournament = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newTournament = {
      name: formData.get('name') as string,
      practiceId: formData.get('practiceId') as string,
      format: formData.get('format') as 'KNOCKOUT' | 'ROUND_ROBIN',
    };

    createMutation.mutate(newTournament);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
              <p className="text-gray-600 mt-2">Organize and manage tournaments for your club</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {showAddForm ? '× Close' : '+ Add Tournament'}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Create Tournament</h2>
              <form onSubmit={handleAddTournament} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tournament Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Badminton Championship 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <select
                      name="format"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="KNOCKOUT">Knockout</option>
                      <option value="ROUND_ROBIN">Round Robin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Associated Practice</label>
                    <select
                      name="practiceId"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="">Select a practice session</option>
                      {practices.map((practice: Practice) => (
                        <option key={practice.id} value={practice.id}>
                          {formatDate(practice.date)} {formatTime(practice.startTime)} {practice.isTournament ? '🏆 Tournament' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Tournament'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tournament Stats */}
          {tournaments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Tournaments</h3>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{tournaments.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Ongoing</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {tournaments.filter((t: Tournament) => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                <p className="text-3xl font-bold text-gray-600 mt-2">
                  {tournaments.filter((t: Tournament) => t.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          )}

          {/* Tournaments List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold">Tournaments</h2>
            </div>

            {tournamentsLoading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : tournaments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No tournaments yet. Create one to get started!
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tournaments.map((tournament: Tournament) => (
                  <div
                    key={tournament.id}
                    className="p-6 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelectedTournament(tournament)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>Format: {tournament.format === 'KNOCKOUT' ? 'Knockout' : 'Round Robin'}</p>
                          {tournament.practice && (
                            <p>
                              Date: {formatDate(tournament.practice.date)}{' '}
                              {formatTime(tournament.practice.startTime)}
                            </p>
                          )}
                          {tournament.participantCount !== undefined && (
                            <p>Participants: {tournament.participantCount}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}`}>
                        {tournament.status}
                      </span>
                    </div>

                    {/* Status Update Section */}
                    {selectedTournament?.id === tournament.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <p className="text-sm font-medium text-gray-700">Update Status:</p>
                        <div className="flex gap-2 flex-wrap">
                          {(['UPCOMING', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: tournament.id,
                                  status,
                                })
                              }
                              disabled={updateStatusMutation.isPending || tournament.status === status}
                              className={`px-3 py-1 rounded text-sm font-medium transition ${
                                tournament.status === status
                                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>

                        {/* Delete Button for Admin/Manager */}
                        {isAdmin && (
                          <div className="pt-3 border-t border-gray-200">
                            {deleteConfirm === tournament.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    deleteMutation.mutate(tournament.id)
                                  }
                                  disabled={deleteMutation.isPending}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                                >
                                  {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-400 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(tournament.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition"
                              >
                                Delete Tournament
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsPage;
