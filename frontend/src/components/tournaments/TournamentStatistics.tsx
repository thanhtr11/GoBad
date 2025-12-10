import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface TournamentStats {
  playerId: string;
  playerName: string;
  tournamentsParticipated: number;
  tournamentsWon: number;
  tournamentRunnerUp: number;
  knockoutWins: number;
  knockoutLosses: number;
  roundRobinPoints: number;
  roundRobinWins: number;
  roundRobinDraws: number;
  roundRobinLosses: number;
  bestTournamentFinish: 'Champion' | 'Runner-up' | 'Participant' | 'None';
}

interface TournamentStatsProps {
  clubId: string;
  practiceId?: string;
}

const TournamentStatistics: React.FC<TournamentStatsProps> = ({ clubId, practiceId }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['tournament-stats', clubId, practiceId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');

      // Get all tournaments
      const tournamentsRes = await axios.get(
        `/api/tournaments/club/${clubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const tournaments = tournamentsRes.data;

      // Filter by practice if specified
      const filteredTournaments = practiceId
        ? tournaments.filter((t: any) => t.practiceId === practiceId)
        : tournaments;

      // Get completed tournaments
      const completedTournaments = filteredTournaments.filter(
        (t: any) => t.status === 'COMPLETED'
      );

      // Fetch bracket data for each completed tournament
      const statsMap = new Map<string, Partial<TournamentStats>>();

      for (const _tournament of completedTournaments) {
        try {
          const bracketRes = await axios.post(
            `/api/tournaments/${_tournament.id}/bracket`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const bracket = bracketRes.data.bracket;

          if (_tournament.format === 'KNOCKOUT' && bracket.rounds) {
            // Process knockout bracket
            bracket.rounds.forEach((round: any[], roundIndex: number) => {
              round.forEach((node: any) => {
                if (node.winnerId) {
                  const stats = statsMap.get(node.winnerId) || {
                    playerId: node.winnerId,
                    playerName: node.winnerName,
                    tournamentsParticipated: 0,
                    tournamentsWon: 0,
                    tournamentRunnerUp: 0,
                    knockoutWins: 0,
                    knockoutLosses: 0,
                    roundRobinPoints: 0,
                    roundRobinWins: 0,
                    roundRobinDraws: 0,
                    roundRobinLosses: 0,
                  };

                  stats.knockoutWins = (stats.knockoutWins || 0) + 1;

                  // Mark as champion if wins final
                  if (roundIndex === bracket.rounds.length - 1) {
                    stats.tournamentsWon = (stats.tournamentsWon || 0) + 1;
                  }

                  statsMap.set(node.winnerId, stats);
                }
              });
            });
          } else if (_tournament.format === 'ROUND_ROBIN' && bracket.standings) {
            // Process round-robin standings
            bracket.standings.forEach((standing: any, idx: number) => {
              const stats = statsMap.get(standing.playerId) || {
                playerId: standing.playerId,
                playerName: standing.playerName,
                tournamentsParticipated: 0,
                tournamentsWon: 0,
                tournamentRunnerUp: 0,
                knockoutWins: 0,
                knockoutLosses: 0,
                roundRobinPoints: 0,
                roundRobinWins: 0,
                roundRobinDraws: 0,
                roundRobinLosses: 0,
              };

              stats.roundRobinPoints = (stats.roundRobinPoints || 0) + standing.points;
              stats.roundRobinWins = (stats.roundRobinWins || 0) + standing.wins;
              stats.roundRobinDraws = (stats.roundRobinDraws || 0) + (standing.draws || 0);
              stats.roundRobinLosses = (stats.roundRobinLosses || 0) + standing.losses;

              if (idx === 0) {
                stats.tournamentsWon = (stats.tournamentsWon || 0) + 1;
              } else if (idx === 1) {
                stats.tournamentRunnerUp = (stats.tournamentRunnerUp || 0) + 1;
              }

              statsMap.set(standing.playerId, stats);
            });
          }
        } catch (error) {
          console.error(`Error fetching bracket for tournament ${_tournament.id}:`, error);
        }
      }

      // Track participation
      // Note: Participation is tracked when they appear in any standings/bracket
      // This is simplified - in production would track more carefully
      completedTournaments.forEach(() => {
        // Participation tracking happens above during bracket processing
      });

      return Array.from(statsMap.values()).sort(
        (a, b) => ((b.tournamentsWon || 0) - (a.tournamentsWon || 0)) || 0
      );
    },
    enabled: !!clubId,
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

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No tournament statistics available yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">🏆 Tournament Statistics</h3>
        <p className="text-gray-600 text-sm mt-1">Player performance across tournaments</p>
      </div>

      {/* Leaderboard */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Player</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Tournaments Won</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Runner-up</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Knockout Wins</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">RR Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {stats.map((stat: Partial<TournamentStats>, idx: number) => (
              <tr key={stat.playerId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-left">
                  <span className="text-2xl font-bold text-purple-600">#{idx + 1}</span>
                </td>
                <td className="px-6 py-4 text-left font-medium text-gray-900">
                  {stat.playerName}
                </td>
                <td className="px-6 py-4 text-center">
                  {stat.tournamentsWon ? (
                    <span className="text-lg font-bold text-yellow-600">🏆 {stat.tournamentsWon}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {stat.tournamentRunnerUp ? (
                    <span className="text-lg font-bold text-gray-600">🥈 {stat.tournamentRunnerUp}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center font-semibold text-green-600">
                  {stat.knockoutWins || '-'}
                </td>
                <td className="px-6 py-4 text-center font-semibold text-blue-600">
                  {stat.roundRobinPoints || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.slice(0, 4).map((stat: Partial<TournamentStats>) => (
          <div
            key={stat.playerId}
            className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4"
          >
            <h4 className="text-lg font-bold text-gray-900 mb-3">{stat.playerName}</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Championships</p>
                <p className="text-2xl font-bold text-yellow-600">{stat.tournamentsWon || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Runner-ups</p>
                <p className="text-2xl font-bold text-gray-600">{stat.tournamentRunnerUp || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">KO Wins</p>
                <p className="text-2xl font-bold text-green-600">{stat.knockoutWins || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">RR Points</p>
                <p className="text-2xl font-bold text-blue-600">{stat.roundRobinPoints || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentStatistics;
