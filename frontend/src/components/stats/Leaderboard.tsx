import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface LeaderboardEntry {
  playerId: string;
  name: string;
  skillLevel: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentForm: string;
  streak: number;
}

interface LeaderboardProps {
  clubId: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ clubId }) => {
  const [sortBy, setSortBy] = useState<'wins' | 'winRate' | 'matches'>('wins');

  // Fetch leaderboard
  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['leaderboard', clubId, sortBy],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/stats/leaderboard?clubId=${clubId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.leaderboard || [];
    },
    enabled: !!clubId,
  });

  const skillLevelColors = {
    BEGINNER: 'bg-green-50 text-green-700',
    INTERMEDIATE: 'bg-yellow-50 text-yellow-700',
    ADVANCED: 'bg-red-50 text-red-700',
  };

  // Sort data
  const sortedData = [...leaderboardData].sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
    if (sortBy === 'wins') return b.wins - a.wins;
    if (sortBy === 'winRate') return b.winRate - a.winRate;
    return b.totalMatches - a.totalMatches;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with Sort Options */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h2>
        <div className="flex items-center space-x-3 flex-wrap">
          <span className="text-sm text-gray-600">Sort by:</span>
          <button
            onClick={() => setSortBy('wins')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              sortBy === 'wins'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Wins
          </button>
          <button
            onClick={() => setSortBy('winRate')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              sortBy === 'winRate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Win Rate
          </button>
          <button
            onClick={() => setSortBy('matches')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              sortBy === 'matches'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Matches Played
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Player</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Skill Level</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Matches</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Wins</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Losses</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Win Rate</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((entry: LeaderboardEntry, index: number) => (
              <tr key={entry.playerId} className="hover:bg-gray-50 transition">
                {/* Rank */}
                <td className="px-4 py-3 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                    {index === 0 && <span className="text-xl">🥇</span>}
                    {index === 1 && <span className="text-xl">🥈</span>}
                    {index === 2 && <span className="text-xl">🥉</span>}
                  </div>
                </td>

                {/* Player Name */}
                <td className="px-4 py-3 text-left">
                  <p className="font-semibold text-gray-900">{entry.name}</p>
                </td>

                {/* Skill Level */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      skillLevelColors[entry.skillLevel as keyof typeof skillLevelColors]
                    }`}
                  >
                    {entry.skillLevel}
                  </span>
                </td>

                {/* Matches */}
                <td className="px-4 py-3 text-center">
                  <span className="font-medium text-gray-900">{entry.totalMatches}</span>
                </td>

                {/* Wins */}
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-green-600">{entry.wins}</span>
                </td>

                {/* Losses */}
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-red-600">{entry.losses}</span>
                </td>

                {/* Win Rate */}
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-gray-900">
                      {entry.totalMatches > 0 ? entry.winRate.toFixed(1) : 0}%
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${entry.totalMatches > 0 ? entry.winRate : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>

                {/* Recent Form */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center space-x-1">
                    {entry.recentForm !== 'N/A' ? (
                      entry.recentForm.split('').map((result, i) => (
                        <span
                          key={i}
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                            result === 'W'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {result}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v2h2v-2a11 11 0 00-20 0v2h2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No players yet</h3>
          <p className="mt-1 text-sm text-gray-500">Players will appear here once they play matches</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
