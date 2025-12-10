import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface BracketNode {
  id: string;
  player1Id?: string;
  player2Id?: string;
  player1Name?: string;
  player2Name?: string;
  winnerId?: string;
  winnerName?: string;
  round: number;
  position: number;
  score1?: number;
  score2?: number;
  matchId?: string;
}

interface KnockoutStageProps {
  tournamentId: string;
}

const KnockoutStage: React.FC<KnockoutStageProps> = ({ tournamentId }) => {
  const queryClient = useQueryClient();
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [scores, setScores] = useState<{ score1: number; score2: number }>({
    score1: 0,
    score2: 0,
  });

  const { data: bracketData, isLoading } = useQuery({
    queryKey: ['tournament-bracket', tournamentId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `/api/tournaments/${tournamentId}/bracket`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.bracket;
    },
    enabled: !!tournamentId,
  });

  const recordMatchMutation = useMutation({
    mutationFn: async ({
      matchId,
      score1,
      score2,
    }: {
      matchId: string;
      score1: number;
      score2: number;
    }) => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `/api/tournaments/${tournamentId}/match-result`,
        { matchId, player1Score: score1, player2Score: score2 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-bracket', tournamentId] });
      setEditingMatchId(null);
      setScores({ score1: 0, score2: 0 });
    },
  });

  const handleRecordScore = (matchId: string) => {
    recordMatchMutation.mutate({
      matchId,
      score1: scores.score1,
      score2: scores.score2,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!bracketData || !bracketData.rounds) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No bracket data available</p>
      </div>
    );
  }

  const rounds = bracketData.rounds;
  const roundNames = [
    'Round 1',
    'Quarterfinals',
    'Semifinals',
    'Finals',
    'Champion',
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Knockout Tournament</h3>
        <p className="text-gray-600 text-sm">
          Single elimination tournament - winners advance to the next round
        </p>
      </div>

      {/* Bracket Visualization */}
      <div className="overflow-x-auto pb-4 border border-gray-200 rounded-lg bg-gray-50 p-6">
        <div className="flex gap-12 min-w-max">
          {rounds.map((round: BracketNode[], roundIndex: number) => (
            <div key={roundIndex} className="flex flex-col justify-around min-h-96">
              {/* Round Header */}
              <div className="text-xs font-semibold text-gray-600 mb-4 uppercase tracking-wide">
                {roundNames[roundIndex] || `Round ${roundIndex + 1}`}
                <span className="text-gray-400 ml-2">({round.length})</span>
              </div>

              {/* Matches */}
              <div className="space-y-4 flex flex-col justify-around h-full">
                {round.map((node: BracketNode) => {
                  const isCompleted = node.winnerId !== undefined;
                  const isPlaceholder = !node.player1Id && !node.player2Id;

                  return (
                    <div
                      key={node.id}
                      className={`w-56 rounded-lg p-4 border-2 transition-all ${
                        isPlaceholder
                          ? 'border-dashed border-gray-300 bg-gray-100'
                          : isCompleted
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {isPlaceholder ? (
                        <div className="text-center text-gray-400 py-6">
                          <p className="text-sm font-medium">Awaiting Winner</p>
                          <p className="text-xs mt-1">↑</p>
                        </div>
                      ) : (
                        <>
                          {/* Player 1 */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center">
                              <span
                                className={`text-sm font-medium truncate flex-1 ${
                                  node.winnerId === node.player1Id
                                    ? 'text-green-700 font-bold'
                                    : 'text-gray-900'
                                }`}
                              >
                                {node.player1Name || '?'}
                              </span>
                              <span className="text-lg font-bold ml-2 text-gray-900">
                                {node.score1 !== undefined ? node.score1 : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-gray-300 my-2"></div>

                          {/* Player 2 */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center">
                              <span
                                className={`text-sm font-medium truncate flex-1 ${
                                  node.winnerId === node.player2Id
                                    ? 'text-green-700 font-bold'
                                    : 'text-gray-900'
                                }`}
                              >
                                {node.player2Name || 'TBD'}
                              </span>
                              <span className="text-lg font-bold ml-2 text-gray-900">
                                {node.score2 !== undefined ? node.score2 : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Winner Badge or Score Input */}
                          {isCompleted ? (
                            <div className="mt-3 pt-3 border-t border-green-300 text-center">
                              <p className="text-xs text-green-600 font-semibold">
                                ✓ {node.winnerName}
                              </p>
                            </div>
                          ) : node.player1Id && node.player2Id ? (
                            <>
                              {editingMatchId === node.id ? (
                                <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max="21"
                                      value={scores.score1}
                                      onChange={(e) =>
                                        setScores({
                                          ...scores,
                                          score1: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="P1"
                                    />
                                    <span className="text-sm font-bold text-gray-600 flex items-center">
                                      -
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="21"
                                      value={scores.score2}
                                      onChange={(e) =>
                                        setScores({
                                          ...scores,
                                          score2: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="P2"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRecordScore(node.id)}
                                      disabled={recordMatchMutation.isPending}
                                      className="flex-1 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingMatchId(null)}
                                      className="flex-1 px-2 py-1 bg-gray-400 text-white text-xs font-semibold rounded hover:bg-gray-500 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingMatchId(node.id);
                                    setScores({ score1: 0, score2: 0 });
                                  }}
                                  className="w-full mt-3 pt-3 border-t border-gray-300 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                >
                                  Enter Score
                                </button>
                              )}
                            </>
                          ) : null}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bracket Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Total Rounds</h4>
          <p className="text-2xl font-bold text-blue-600">{rounds.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">✓ Completed Matches</h4>
          <p className="text-2xl font-bold text-green-600">
            {rounds.flat().filter((n: BracketNode) => n.winnerId).length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">⏳ Pending Matches</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {rounds
              .flat()
              .filter(
                (n: BracketNode) =>
                  (n.player1Id || n.player2Id) && !n.winnerId
              ).length}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">ℹ️ How It Works</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Winners advance automatically to the next round</li>
          <li>• Click "Enter Score" on any match to record the result</li>
          <li>• The higher score wins and advances</li>
          <li>• Continue until a champion is crowned</li>
        </ul>
      </div>
    </div>
  );
};

export default KnockoutStage;
