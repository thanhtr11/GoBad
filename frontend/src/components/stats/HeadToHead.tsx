import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface HeadToHeadMatch {
  id: string;
  player1Score: number;
  player2Score: number;
  matchType: string;
  date: string;
}

interface HeadToHeadRecord {
  player1Name: string;
  player2Name: string;
  player1Wins: number;
  player2Wins: number;
  matches: HeadToHeadMatch[];
}

interface HeadToHeadProps {
  playerId1: string;
  playerId2: string;
}

const HeadToHead: React.FC<HeadToHeadProps> = ({ playerId1, playerId2 }) => {
  // Fetch head-to-head record
  const { data: recordData, isLoading } = useQuery({
    queryKey: ['head-to-head', playerId1, playerId2],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/stats/head-to-head?playerId1=${playerId1}&playerId2=${playerId2}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.record;
    },
    enabled: !!playerId1 && !!playerId2,
  });

  const record = recordData as HeadToHeadRecord | undefined;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Unable to load head-to-head data</p>
      </div>
    );
  }

  const totalMatches = record.player1Wins + record.player2Wins;
  const player1WinPercentage = totalMatches > 0 ? (record.player1Wins / totalMatches) * 100 : 0;
  const player2WinPercentage = totalMatches > 0 ? (record.player2Wins / totalMatches) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Head-to-Head</h2>

      {/* Overall Record */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Player 1 */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{record.player1Name}</h3>
            <div className="text-4xl font-bold text-blue-600">{record.player1Wins}</div>
            <p className="text-xs text-gray-600 mt-1">Wins</p>
          </div>

          {/* vs */}
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">VS</p>
            <p className="text-xs text-gray-600 mt-2">{totalMatches} matches</p>
          </div>

          {/* Player 2 */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{record.player2Name}</h3>
            <div className="text-4xl font-bold text-indigo-600">{record.player2Wins}</div>
            <p className="text-xs text-gray-600 mt-1">Wins</p>
          </div>
        </div>

        {/* Win Rate Bars */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 w-20">{record.player1Name}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 transition-all"
                style={{ width: `${player1WinPercentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-gray-900 w-12">
              {player1WinPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 w-20">{record.player2Name}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 transition-all"
                style={{ width: `${player2WinPercentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-gray-900 w-12">
              {player2WinPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Match History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Match History</h3>
        {record.matches.length > 0 ? (
          <div className="space-y-3">
            {record.matches.map((match) => {
              const isPlayer1Win = match.player1Score > match.player2Score;
              return (
                <div
                  key={match.id}
                  className={`p-4 rounded-lg border-2 ${
                    isPlayer1Win
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-indigo-200 bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {match.matchType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(match.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">
                        {match.player1Score} - {match.player2Score}
                      </div>
                      <p className={`text-xs font-medium ${
                        isPlayer1Win ? 'text-blue-600' : 'text-indigo-600'
                      }`}>
                        {isPlayer1Win ? record.player1Name : record.player2Name} won
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No matches between these players</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadToHead;
