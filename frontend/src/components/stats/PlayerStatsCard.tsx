import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface PlayerStats {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  winRate: number;
  totalPointsScored: number;
  totalPointsConceded: number;
  avgPointsScored: number;
  avgPointsConceded: number;
  pointDifferential: number;
  avgPointDifferential: number;
  skillLevel: string;
}

interface PlayerStatsCardProps {
  playerId: string;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerId }) => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['player-stats', playerId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/stats/player/${playerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.stats;
    },
    enabled: !!playerId,
  });

  const stats = statsData as PlayerStats | undefined;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalMatches = stats.wins + stats.losses;

  const statItems = [
    { label: 'Total Matches', value: totalMatches, icon: '🎯' },
    { label: 'Wins', value: stats.wins, icon: '✅', color: 'text-green-600' },
    { label: 'Losses', value: stats.losses, icon: '❌', color: 'text-red-600' },
    { label: 'Win Rate', value: `${Math.round(stats.winRate)}%`, icon: '📊' },
    { label: 'Avg Points For', value: stats.avgPointsScored.toFixed(1), icon: '⬆️' },
    { label: 'Avg Points Against', value: stats.avgPointsConceded.toFixed(1), icon: '⬇️' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">{stats.playerName}</h2>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getSkillColor(
                stats.skillLevel
              )}`}
            >
              {stats.skillLevel}
            </span>
          </div>
          <div className="text-5xl">👤</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <p className="text-xs text-gray-600 font-medium mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color || 'text-gray-900'}`}>
                {item.value}
              </p>
              <p className="text-lg mt-1">{item.icon}</p>
            </div>
          ))}
        </div>

        {/* Point Differential */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-gray-600 font-medium mb-2">Point Differential</p>
          <div className="flex items-end space-x-2">
            <div className="text-3xl font-bold text-blue-600">
              {stats.avgPointDifferential > 0 ? '+' : ''}
              {stats.avgPointDifferential.toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 mb-1">
              per match ({stats.pointDifferential > 0 ? '+' : ''}
              {stats.pointDifferential.toFixed(1)} total)
            </p>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Match Win Rate</p>
            <p className="text-sm font-bold text-gray-900">
              {Math.round(stats.winRate * 100)}%
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${stats.winRate * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsCard;
