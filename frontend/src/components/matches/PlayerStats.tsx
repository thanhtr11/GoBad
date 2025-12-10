import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface PlayerStatsData {
  player: {
    id: string;
    name: string;
    skillLevel: string;
  };
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPointsScored: number;
  totalPointsConceded: number;
  avgPointsScored: number;
  avgPointsConceded: number;
  matchTypeStats: {
    SINGLES: { played: number; won: number };
    DOUBLES: { played: number; won: number };
    MIXED_DOUBLES: { played: number; won: number };
  };
  recentMatches: Array<{
    id: string;
    matchType: string;
    score1: number;
    score2: number;
    createdAt: string;
    player1: { name: string };
    player2: { name: string };
  }>;
}

interface PlayerStatsProps {
  playerId: string;
  onClose?: () => void;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerId, onClose }) => {
  const [stats, setStats] = useState<PlayerStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(
          `/api/matches/player/${playerId}/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStats(response.data.stats);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [playerId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600">{error || 'No statistics available'}</div>
      </div>
    );
  }

  const skillLevelColors = {
    BEGINNER: 'text-green-600 bg-green-50',
    INTERMEDIATE: 'text-yellow-600 bg-yellow-50',
    ADVANCED: 'text-red-600 bg-red-50',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{stats.player.name}</h2>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              skillLevelColors[stats.player.skillLevel as keyof typeof skillLevelColors]
            }`}
          >
            {stats.player.skillLevel}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Overall Record */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="text-3xl font-bold text-green-700">{stats.wins}</div>
          <div className="text-sm text-green-600 font-medium">Wins</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
          <div className="text-3xl font-bold text-red-700">{stats.losses}</div>
          <div className="text-sm text-red-600 font-medium">Losses</div>
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">Win Rate</span>
          <span className="text-2xl font-bold text-blue-700">{stats.winRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.winRate}%` }}
          ></div>
        </div>
      </div>

      {/* Points Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.avgPointsScored.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Points Scored</div>
          <div className="text-xs text-gray-500 mt-1">Total: {stats.totalPointsScored}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.avgPointsConceded.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Points Conceded</div>
          <div className="text-xs text-gray-500 mt-1">Total: {stats.totalPointsConceded}</div>
        </div>
      </div>

      {/* Match Type Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Match Type Performance</h3>
        <div className="space-y-3">
          {/* Singles */}
          {stats.matchTypeStats.SINGLES.played > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">Singles</span>
                <span className="text-sm text-blue-700">
                  {stats.matchTypeStats.SINGLES.won} / {stats.matchTypeStats.SINGLES.played} wins
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.matchTypeStats.SINGLES.won / stats.matchTypeStats.SINGLES.played) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Doubles */}
          {stats.matchTypeStats.DOUBLES.played > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">Doubles</span>
                <span className="text-sm text-green-700">
                  {stats.matchTypeStats.DOUBLES.won} / {stats.matchTypeStats.DOUBLES.played} wins
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.matchTypeStats.DOUBLES.won / stats.matchTypeStats.DOUBLES.played) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Mixed Doubles */}
          {stats.matchTypeStats.MIXED_DOUBLES.played > 0 && (
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-purple-900">Mixed Doubles</span>
                <span className="text-sm text-purple-700">
                  {stats.matchTypeStats.MIXED_DOUBLES.won} / {stats.matchTypeStats.MIXED_DOUBLES.played} wins
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.matchTypeStats.MIXED_DOUBLES.won / stats.matchTypeStats.MIXED_DOUBLES.played) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Matches */}
      {stats.recentMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Matches</h3>
          <div className="space-y-2">
            {stats.recentMatches.map((match) => {
              const isPlayer1 = match.player1.name === stats.player.name;
              const won = isPlayer1 ? match.score1 > match.score2 : match.score2 > match.score1;
              const playerScore = isPlayer1 ? match.score1 : match.score2;
              const opponentScore = isPlayer1 ? match.score2 : match.score1;
              const opponentName = isPlayer1 ? match.player2.name : match.player1.name;

              return (
                <div
                  key={match.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    won ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`font-semibold ${won ? 'text-green-700' : 'text-red-700'}`}>
                      {won ? 'W' : 'L'}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        vs {opponentName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {match.matchType.replace('_', ' ')} • {new Date(match.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {playerScore} - {opponentScore}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Total Matches */}
      <div className="pt-4 border-t border-gray-200 text-center">
        <span className="text-sm text-gray-600">
          Total Matches: <span className="font-semibold text-gray-900">{stats.totalMatches}</span>
        </span>
      </div>
    </div>
  );
};

export default PlayerStats;
