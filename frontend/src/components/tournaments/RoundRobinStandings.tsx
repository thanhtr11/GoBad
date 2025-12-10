import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Standing {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  matchesPlayed: number;
}

interface RoundRobinMatch {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  score1: number;
  score2: number;
}

interface RoundRobinStandingsProps {
  tournamentId: string;
}

const RoundRobinStandings: React.FC<RoundRobinStandingsProps> = ({ tournamentId }) => {
  const [showMatches, setShowMatches] = useState(false);

  const { data: standings, isLoading } = useQuery({
    queryKey: ['tournament-standings', tournamentId],
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!standings) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No standings data available</p>
      </div>
    );
  }

  const rankMedals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">Round Robin Standings</h3>
        <button
          onClick={() => setShowMatches(!showMatches)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showMatches ? 'Hide Matches' : 'Show Matches'}
        </button>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Player</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Played</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Wins</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Draws</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Losses</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Points</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">W/L Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {standings.standings && standings.standings.map((standing: Standing, idx: number) => (
              <tr
                key={standing.playerId}
                className={`hover:bg-gray-50 transition-colors ${
                  idx === 0
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50'
                    : idx === 1
                      ? 'bg-gradient-to-r from-gray-100 to-gray-50'
                      : idx === 2
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50'
                        : ''
                }`}
              >
                <td className="px-6 py-4 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{rankMedals[idx] || `#${idx + 1}`}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-left font-medium text-gray-900">
                  {standing.playerName}
                </td>
                <td className="px-6 py-4 text-center text-gray-700">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {standing.matchesPlayed || standing.wins + standing.draws + standing.losses}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold">
                  {standing.wins}
                </td>
                <td className="px-6 py-4 text-center text-gray-600 font-semibold">
                  {standing.draws}
                </td>
                <td className="px-6 py-4 text-center text-red-600 font-semibold">
                  {standing.losses}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-lg font-bold text-indigo-600">{standing.points}</span>
                </td>
                <td className="px-6 py-4 text-center text-gray-700 font-medium">
                  {standing.wins > 0
                    ? (standing.wins / (standing.wins + standing.losses)).toFixed(2)
                    : '0.00'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matches List */}
      {showMatches && standings.matches && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">All Matches</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standings.matches.map((match: RoundRobinMatch, idx: number) => {
              const player1Won = match.score1 > match.score2;
              const player2Won = match.score2 > match.score1;
              const isDraw = match.score1 === match.score2;

              return (
                <div
                  key={idx}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-medium truncate flex-1 ${
                          player1Won ? 'text-green-700 font-bold' : 'text-gray-700'
                        }`}
                      >
                        {match.player1Name}
                      </span>
                      <span className={`text-lg font-bold mx-2 ${player1Won ? 'text-green-600' : 'text-gray-600'}`}>
                        {match.score1}
                      </span>
                    </div>
                    <div className="flex justify-center text-gray-400 text-xs">vs</div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-medium truncate flex-1 ${
                          player2Won ? 'text-green-700 font-bold' : 'text-gray-700'
                        }`}
                      >
                        {match.player2Name}
                      </span>
                      <span className={`text-lg font-bold mx-2 ${player2Won ? 'text-green-600' : 'text-gray-600'}`}>
                        {match.score2}
                      </span>
                    </div>
                    {isDraw && (
                      <div className="text-center text-xs text-yellow-600 font-semibold mt-2">
                        ⚖️ Draw
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scoring Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Scoring System</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <span className="font-bold text-green-600">3</span>
            <p className="text-gray-600">points per win</p>
          </div>
          <div className="text-center">
            <span className="font-bold text-yellow-600">1</span>
            <p className="text-gray-600">point for draw</p>
          </div>
          <div className="text-center">
            <span className="font-bold text-red-600">0</span>
            <p className="text-gray-600">points for loss</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundRobinStandings;
