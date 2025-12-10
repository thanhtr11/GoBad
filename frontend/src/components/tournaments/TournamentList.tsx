import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import TournamentForm from './TournamentForm';
import TournamentBracket from './TournamentBracket';

interface Tournament {
  id: string;
  name: string;
  format: 'KNOCKOUT' | 'ROUND_ROBIN';
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  practiceId: string;
  practice?: {
    id: string;
    date: string;
    court: string;
  };
}

interface TournamentListProps {
  practiceId: string;
  clubId: string;
}

const TournamentList: React.FC<TournamentListProps> = ({ practiceId, clubId }) => {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['practice-tournaments', practiceId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/tournaments/club/${clubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Filter for this practice
      return response.data.filter((t: Tournament) => t.practice?.id === practiceId);
    },
    enabled: !!practiceId && !!clubId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      tournamentId,
      status,
    }: {
      tournamentId: string;
      status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
    }) => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.patch(
        `/api/tournaments/${tournamentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-tournaments', practiceId] });
    },
  });

  const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
    UPCOMING: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📅' },
    IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🏃' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
  };

  const formatIcons: Record<string, string> = {
    KNOCKOUT: '🏆',
    ROUND_ROBIN: '🔄',
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🏸 Tournaments</h2>
            <p className="text-gray-600 text-sm mt-1">Manage tournaments for this practice</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            {showForm ? '✕ Cancel' : '+ New Tournament'}
          </button>
        </div>

        {/* Tournament Form */}
        {showForm && (
          <div className="border-t pt-6">
            <TournamentForm
              practiceId={practiceId}
              clubId={clubId}
              onSuccess={() => {
                setShowForm(false);
                queryClient.invalidateQueries({ queryKey: ['practice-tournaments', practiceId] });
              }}
            />
          </div>
        )}
      </div>

      {/* Tournaments List */}
      {tournaments && tournaments.length > 0 ? (
        <div className="space-y-4">
          {tournaments.map((tournament: Tournament) => {
            const colors = statusColors[tournament.status];
            const formatIcon = formatIcons[tournament.format];

            return (
              <div
                key={tournament.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{tournament.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                          {colors.icon} {tournament.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          {formatIcon} {tournament.format}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Created {new Date(tournament.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status Controls */}
                    {tournament.status === 'UPCOMING' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            tournamentId: tournament.id,
                            status: 'IN_PROGRESS',
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold disabled:opacity-50"
                      >
                        Start
                      </button>
                    )}
                    {tournament.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            tournamentId: tournament.id,
                            status: 'COMPLETED',
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                  </div>

                  {/* Tournament Details Button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedTournament(
                          selectedTournament === tournament.id ? null : tournament.id
                        )
                      }
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                    >
                      {selectedTournament === tournament.id ? '▼ Hide Bracket' : '▶ Show Bracket'}
                    </button>
                  </div>
                </div>

                {/* Tournament Bracket Display */}
                {selectedTournament === tournament.id && (
                  <div className="border-t bg-gray-50 p-6">
                    <TournamentBracket tournamentId={tournament.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-4xl mb-4">🏸</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tournaments Yet</h3>
          <p className="text-gray-600 mb-4">Create a tournament to organize your practice session</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            + Create Your First Tournament
          </button>
        </div>
      )}
    </div>
  );
};

export default TournamentList;
