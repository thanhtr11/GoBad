import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface Tournament {
  id: string;
  name: string;
  format: 'KNOCKOUT' | 'ROUND_ROBIN';
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface Participant {
  participantId: string;
  memberId: string;
  name: string;
  seedRank: number;
  joinedAt: string;
}

interface Match {
  id: string;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string | null;
  player2Name: string | null;
  winnerId: string | null;
  winnerName: string | null;
  scores: string | null;
  status: string;
  scheduledDate: string | null;
  court: string | null;
}

interface Standing {
  memberId: string;
  memberName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  ranking: number;
}

interface PlayerStats {
  memberId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  matches: Array<{
    matchId: string;
    round: number;
    opponent: string;
    opponentId: string;
    playerScore: number;
    opponentScore: number;
    won: boolean;
    status: string;
  }>;
  winRate: string;
}

const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'participants' | 'bracket' | 'standings' | 'stats'>('participants');
  const [recordingMatch, setRecordingMatch] = useState<string | null>(null);
  const [scores, setScores] = useState({ player1: '', player2: '' });
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<string | null>(null);

  if (!id) return <div>Invalid tournament</div>;

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  // Fetch tournament
  const { data: tournament, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const response = await api.get(`/tournaments/${id}`);
      return response.data.tournament;
    },
  });

  // Fetch participants
  const { data: participants = [], isLoading: participantsLoading, error: participantsError } = useQuery({
    queryKey: ['tournament-participants', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/tournaments/${id}/participants/details`);
        console.log('Participants response:', response.data);
        return response.data.participants || [];
      } catch (error: any) {
        console.error('Error fetching participants:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!id,
  });

  // Fetch matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['tournament-matches', id],
    queryFn: async () => {
      const response = await api.get(`/tournaments/${id}/matches`);
      return response.data.matches || [];
    },
    enabled: !!id && tournament?.status !== 'UPCOMING',
  });

  // Fetch standings
  const { data: standings = [], isLoading: standingsLoading } = useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: async () => {
      console.log('Fetching standings for tournament:', id);
      const response = await api.get(`/tournaments/${id}/standings`);
      console.log('Standings response:', response.data);
      return response.data.standings || [];
    },
    enabled: !!id,
  });

  // Fetch player stats
  const { data: playerStats } = useQuery({
    queryKey: ['player-stats', id, selectedPlayerForStats],
    queryFn: async () => {
      if (!selectedPlayerForStats) return null;
      const response = await api.get(`/tournaments/${id}/stats/${selectedPlayerForStats}`);
      return response.data.stats;
    },
    enabled: !!id && !!selectedPlayerForStats,
  });

  // Fetch club members for adding participants
  const { data: allMembers = [] } = useQuery({
    queryKey: ['club-members-for-tournament', tournament?.clubId],
    queryFn: async () => {
      if (!tournament?.clubId) return [];
      const response = await api.get(`/clubs/${tournament.clubId}/members`);
      const members = response.data.members || [];
      
      // Ensure each member has proper display name - prioritize full name over username
      return members.map((m: any) => ({
        ...m,
        user: {
          ...m.user,
          displayName: m.user?.name || m.user?.username || 'Unknown'
        }
      }));
    },
    enabled: !!tournament?.clubId,
  });

  // Mutation: Add participant
  const addParticipantMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('Adding participant - Tournament ID:', id, 'Member ID:', memberId);
      const response = await api.post(`/tournaments/${id}/participants`, { memberId });
      console.log('Add participant response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully added participant');
      // Refetch the participants list to get the fresh data
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', id] });
      setSelectedMemberId('');
      setShowAddParticipant(false);
    },
    onError: (error: any) => {
      console.error('Error adding participant:', error.response?.data || error.message);
      alert(`Failed to add participant: ${error.response?.data?.message || error.message}`);
    },
  });

  // Mutation: Remove participant
  const removeParticipantMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/tournaments/${id}/participants/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', id] });
    },
  });

  // Mutation: Delete tournament
  const deleteTournamentMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tournaments/${id}`);
    },
    onSuccess: () => {
      navigate(-1);
    },
  });

  // Mutation: Initialize matches
  const initializeMatchesMutation = useMutation({
    mutationFn: async () => {
      console.log('Initializing matches for tournament:', id);
      const response = await api.post(`/tournaments/${id}/initialize`, {});
      console.log('Initialize matches response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Matches initialized successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
    },
    onError: (error: any) => {
      console.error('Error initializing matches:', error.response?.data || error.message);
      alert(`Failed to initialize matches: ${error.response?.data?.error || error.message}`);
    },
  });

  // Mutation: Record match result
  const recordMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      console.log('Recording match result - Match ID:', matchId, 'Scores:', scores);
      const response = await api.patch(`/tournaments/${id}/matches/${matchId}`, {
        matchId,
        player1Score: parseInt(scores.player1),
        player2Score: parseInt(scores.player2),
      });
      console.log('Record match response:', response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log('Match result saved successfully');
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament-standings', id] });
      setRecordingMatch(null);
      setScores({ player1: '', player2: '' });
    },
    onError: (error: any) => {
      console.error('Error recording match:', error.response?.data || error.message);
      alert(`Failed to save match result: ${error.response?.data?.error || error.message}`);
    },
  });

  // Mutation: Schedule match
  const scheduleMatchMutation = useMutation({
    mutationFn: async ({ matchId, court }: { matchId: string; court: string }) => {
      await api.patch(`/tournaments/${id}/matches/${matchId}/schedule`, {
        scheduledDate: new Date().toISOString(),
        court,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
    },
  });

  // Debug logging - placed after all hooks are declared
  React.useEffect(() => {
    console.log('DEBUG: participants state =', participants);
    console.log('DEBUG: activeTab =', activeTab);
    console.log('DEBUG: standings state =', standings);
    console.log('DEBUG: tournament format =', tournament?.format);
  }, [participants, activeTab, standings, tournament]);

  if (tournamentLoading) {
    return <div className="text-center py-8">Loading tournament...</div>;
  }

  if (!tournament) {
    return <div className="text-center py-8">Tournament not found</div>;
  }

  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const availableMembers = allMembers.filter(
    (m) => !participants.some((p) => p.memberId === m.id)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl font-bold">🏆 {tournament.name}</h1>
          {isAdmin && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this tournament?')) {
                  deleteTournamentMutation.mutate();
                }
              }}
              disabled={deleteTournamentMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {deleteTournamentMutation.isPending ? 'Deleting...' : '🗑️ Delete'}
            </button>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <span className={`px-3 py-1 rounded text-white text-sm font-semibold ${
            tournament.status === 'UPCOMING' ? 'bg-blue-500' :
            tournament.status === 'IN_PROGRESS' ? 'bg-amber-500' :
            'bg-green-500'
          }`}>
            {tournament.status}
          </span>
          <span className="text-gray-600">Format: {tournament.format === 'KNOCKOUT' ? '🏁 Knockout' : '🔄 Round Robin'}</span>
          <span className="text-gray-600">{participants.length} Participants</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto">
          {['participants', 'bracket', 'standings', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'participants' && '👥 Participants'}
              {tab === 'bracket' && '🎯 Bracket & Schedule'}
              {tab === 'standings' && '📊 Standings'}
              {tab === 'stats' && '📈 Stats'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="bg-blue-50 p-4 rounded-lg">
                {!showAddParticipant ? (
                  <button
                    onClick={() => setShowAddParticipant(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    + Add Participant
                  </button>
                ) : (
                  <div className="space-y-3">
                    {allMembers.length === 0 ? (
                      <div className="text-gray-600 py-2">Loading members... (Loaded: {allMembers.length})</div>
                    ) : availableMembers.length === 0 ? (
                      <div className="text-gray-600 py-2">All members are already participants</div>
                    ) : (
                      <>
                        <select
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        >
                          <option value="">Select a member...</option>
                          {availableMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.user?.displayName || 'Unknown'}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              console.log('Add button clicked - selectedMemberId:', selectedMemberId);
                              selectedMemberId && addParticipantMutation.mutate(selectedMemberId);
                            }}
                            disabled={!selectedMemberId || addParticipantMutation.isPending}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                          >
                            {addParticipantMutation.isPending ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            onClick={() => setShowAddParticipant(false)}
                            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {participantsLoading ? (
              <div className="text-center py-8">Loading participants...</div>
            ) : participantsError ? (
              <div className="text-center py-8 text-red-600">Error loading participants: {participantsError.message}</div>
            ) : !participants || participants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600 font-semibold">No participants yet</div>
                <div className="text-gray-500 mt-2">Add members to start the tournament</div>
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.memberId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div>
                      <div className="font-semibold">{participant.name}</div>
                      <div className="text-sm text-gray-600">Seed #{participant.seedRank}</div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => removeParticipantMutation.mutate(participant.memberId)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tournament.status === 'UPCOMING' && participants.length > 1 && isAdmin && (
              <button
                onClick={() => initializeMatchesMutation.mutate()}
                disabled={initializeMatchesMutation.isPending}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
              >
                {initializeMatchesMutation.isPending ? 'Initializing...' : '✓ Initialize Matches'}
              </button>
            )}
          </div>
        )}

        {/* Bracket Tab */}
        {activeTab === 'bracket' && (
          <div>
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <div className="text-xl text-gray-600 font-semibold">
                  {tournament.status === 'UPCOMING' ? 'Initialize matches to see bracket' : 'No matches found'}
                </div>
              </div>
            ) : tournament.format === 'KNOCKOUT' ? (
              // Knockout bracket
              <div className="space-y-8 overflow-x-auto">
                {Object.entries(matchesByRound).map(([round, roundMatches]) => (
                  <div key={round} className="border-l-4 border-blue-500 pl-6">
                    <h3 className="font-bold text-2xl mb-6 text-blue-700">
                      🎯 Round {parseInt(round) + 1}
                      {parseInt(round) === 0 && roundMatches.length === 1 && ' (Final)'}
                      {parseInt(round) === 0 && roundMatches.length === 2 && ' (Semifinals)'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roundMatches.map((match) => (
                        <div
                          key={match.id}
                          className={`rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg ${
                            match.status === 'COMPLETED'
                              ? 'border-green-300 bg-green-50'
                              : match.status === 'SCHEDULED'
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className="p-4">
                            {/* Status Badge */}
                            <div className="flex justify-between items-center mb-3">
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  match.status === 'COMPLETED'
                                    ? 'bg-green-200 text-green-800'
                                    : match.status === 'SCHEDULED'
                                    ? 'bg-orange-200 text-orange-800'
                                    : 'bg-gray-200 text-gray-800'
                                }`}
                              >
                                {match.status === 'COMPLETED' ? '✓ Done' : match.status === 'SCHEDULED' ? '⏱ Ready' : '⏳ Pending'}
                              </span>
                              {match.scheduledDate && (
                                <span className="text-xs text-gray-500">
                                  📅 {new Date(match.scheduledDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {/* Players */}
                            <div className="space-y-3">
                              {/* Player 1 */}
                              <div className="flex items-center justify-between p-2 rounded hover:bg-white transition-colors">
                                <span
                                  className={`flex-1 font-semibold ${
                                    match.winnerId === match.player1Id
                                      ? 'text-green-700 text-lg font-bold'
                                      : match.status === 'COMPLETED'
                                      ? 'text-gray-500 line-through'
                                      : 'text-gray-800'
                                  }`}
                                >
                                  {match.player1Name || '?'}
                                </span>
                                {match.status === 'COMPLETED' && (
                                  <span
                                    className={`text-xl font-bold px-3 py-1 rounded ${
                                      match.winnerId === match.player1Id ? 'bg-green-200 text-green-800' : 'text-gray-500'
                                    }`}
                                  >
                                    {match.scores?.split('-')[0]}
                                  </span>
                                )}
                              </div>

                              <div className="border-t border-gray-200"></div>

                              {/* Player 2 */}
                              <div className="flex items-center justify-between p-2 rounded hover:bg-white transition-colors">
                                <span
                                  className={`flex-1 font-semibold ${
                                    match.winnerId === match.player2Id
                                      ? 'text-green-700 text-lg font-bold'
                                      : match.status === 'COMPLETED'
                                      ? 'text-gray-500 line-through'
                                      : 'text-gray-800'
                                  }`}
                                >
                                  {match.player2Name || '?'}
                                </span>
                                {match.status === 'COMPLETED' && (
                                  <span
                                    className={`text-xl font-bold px-3 py-1 rounded ${
                                      match.winnerId === match.player2Id ? 'bg-green-200 text-green-800' : 'text-gray-500'
                                    }`}
                                  >
                                    {match.scores?.split('-')[1]}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Schedule & Action */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              {match.scheduledDate && match.court && (
                                <div className="text-xs text-gray-600 mb-3 flex items-center gap-2">
                                  <span>🏟️ {match.court}</span>
                                </div>
                              )}
                              {match.status === 'SCHEDULED' && isAdmin && (
                                <button
                                  onClick={() => {
                                    setRecordingMatch(match.id);
                                    setScores({ player1: '', player2: '' });
                                  }}
                                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                  📊 Record Result
                                </button>
                              )}
                              {match.status === 'COMPLETED' && isAdmin && (
                                <button
                                  onClick={() => {
                                    setRecordingMatch(match.id);
                                    setScores({
                                      player1: match.scores?.split('-')[0] || '',
                                      player2: match.scores?.split('-')[1] || '',
                                    });
                                  }}
                                  className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-colors text-sm"
                                >
                                  ✏️ Edit Result
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Round-robin matches
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`rounded-lg border-l-4 p-4 transition-all hover:shadow-md ${
                      match.status === 'COMPLETED'
                        ? 'border-l-green-500 bg-green-50'
                        : match.status === 'SCHEDULED'
                        ? 'border-l-orange-500 bg-orange-50'
                        : 'border-l-gray-400 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      {/* Players */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold ${
                              match.winnerId === match.player1Id ? 'text-green-700 text-lg font-bold' : 'text-gray-800'
                            }`}
                          >
                            {match.player1Name || '?'}
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span
                            className={`font-semibold ${
                              match.winnerId === match.player2Id ? 'text-green-700 text-lg font-bold' : 'text-gray-800'
                            }`}
                          >
                            {match.player2Name || '?'}
                          </span>
                        </div>
                      </div>

                      {/* Score & Status */}
                      <div className="flex items-center gap-4">
                        {match.status === 'COMPLETED' && (
                          <div className="bg-white rounded-lg px-4 py-2 border border-green-200">
                            <span className="text-2xl font-bold text-green-700">{match.scores}</span>
                          </div>
                        )}
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            match.status === 'COMPLETED'
                              ? 'bg-green-200 text-green-800'
                              : match.status === 'SCHEDULED'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {match.status === 'COMPLETED' ? '✓' : match.status === 'SCHEDULED' ? '⏱' : '⏳'}
                        </span>
                      </div>
                    </div>

                    {/* Schedule Info */}
                    {(match.scheduledDate || match.court) && (
                      <div className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                        {match.scheduledDate && match.court && (
                          <>
                            🏟️ {match.court} • 📅 {new Date(match.scheduledDate).toLocaleDateString()}
                          </>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    {match.status === 'SCHEDULED' && isAdmin && (
                      <button
                        onClick={() => {
                          setRecordingMatch(match.id);
                          setScores({ player1: '', player2: '' });
                        }}
                        className="w-full mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                      >
                        📊 Record Result
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Score Recording Modal */}
            {recordingMatch && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                  <h3 className="text-xl font-bold mb-4">Record Match Result</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        {matches.find((m) => m.id === recordingMatch)?.player1Name} Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={scores.player1}
                        onChange={(e) => setScores({ ...scores, player1: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-2xl text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        {matches.find((m) => m.id === recordingMatch)?.player2Name} Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={scores.player2}
                        onChange={(e) => setScores({ ...scores, player2: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-2xl text-center font-bold"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log('Save button clicked - Scores:', scores, 'Match ID:', recordingMatch);
                          console.log('Validation - player1:', scores.player1, 'player2:', scores.player2);
                          recordMatchMutation.mutate(recordingMatch);
                        }}
                        disabled={!scores.player1 || !scores.player2 || recordMatchMutation.isPending}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setRecordingMatch(null);
                          setScores({ player1: '', player2: '' });
                        }}
                        className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <div>
            {standingsLoading ? (
              <div className="text-center py-8">Loading standings...</div>
            ) : standings.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {matches.length > 0
                  ? 'Complete matches to see standings'
                  : 'No standings data available'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Rank</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-center">Played</th>
                      <th className="px-4 py-2 text-center">W</th>
                      <th className="px-4 py-2 text-center">L</th>
                      <th className="px-4 py-2 text-center">PF</th>
                      <th className="px-4 py-2 text-center">PA</th>
                      <th className="px-4 py-2 text-center">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing) => (
                      <tr key={standing.memberId} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 font-bold text-lg">{standing.ranking}</td>
                        <td className="px-4 py-2 font-semibold">{standing.memberName}</td>
                        <td className="px-4 py-2 text-center">{standing.matchesPlayed}</td>
                        <td className="px-4 py-2 text-center text-green-600 font-bold">{standing.wins}</td>
                        <td className="px-4 py-2 text-center text-red-600 font-bold">{standing.losses}</td>
                        <td className="px-4 py-2 text-center">{standing.pointsFor}</td>
                        <td className="px-4 py-2 text-center">{standing.pointsAgainst}</td>
                        <td className="px-4 py-2 text-center font-semibold" style={{color: (standing.pointsFor - standing.pointsAgainst) > 0 ? '#10b981' : (standing.pointsFor - standing.pointsAgainst) < 0 ? '#ef4444' : '#6b7280'}}>
                          {standing.pointsFor - standing.pointsAgainst > 0 ? '+' : ''}{standing.pointsFor - standing.pointsAgainst}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Select Player</label>
              <select
                value={selectedPlayerForStats || ''}
                onChange={(e) => setSelectedPlayerForStats(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Choose a player...</option>
                {participants.map((p) => (
                  <option key={p.memberId} value={p.memberId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlayerForStats && playerStats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Matches Played</div>
                    <div className="text-2xl font-bold">{playerStats.matchesPlayed}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Wins</div>
                    <div className="text-2xl font-bold text-green-600">{playerStats.wins}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Losses</div>
                    <div className="text-2xl font-bold text-red-600">{playerStats.losses}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Win Rate</div>
                    <div className="text-2xl font-bold text-purple-600">{playerStats.winRate}%</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Match History</h4>
                  <div className="space-y-2">
                    {playerStats.matches.map((match) => (
                      <div key={match.matchId} className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold">{match.opponent}</span>
                            <span className={`ml-2 text-sm font-bold ${match.won ? 'text-green-600' : 'text-red-600'}`}>
                              {match.won ? 'WIN' : 'LOSS'}
                            </span>
                          </div>
                          <span className={`text-lg font-bold ${match.won ? 'text-green-600' : 'text-red-600'}`}>
                            {match.playerScore}-{match.opponentScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
