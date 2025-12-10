import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface MatchHighlight {
  id: string;
  player1Name: string;
  player2Name: string;
  player1SkillLevel: string;
  player2SkillLevel: string;
  player1Score: number;
  player2Score: number;
  matchType: string;
  isUpset: boolean;
  scoreMargin: number;
}

interface TopPerformer {
  playerId: string;
  playerName: string;
  wins: number;
  matchesPlayed: number;
  winRate: number;
}

interface Summary {
  practiceId: string;
  practiceDate: string;
  court: string;
  totalMatches: number;
  topPerformers: TopPerformer[];
  mostMatches: {
    playerId: string;
    playerName: string;
    matchCount: number;
  } | null;
  closestScore: MatchHighlight | null;
  biggestUpset: MatchHighlight | null;
  totalParticipants: number;
}

interface PracticeSummaryProps {
  practiceId: string;
}

const PracticeSummary: React.FC<PracticeSummaryProps> = ({ practiceId }) => {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['practice-summary', practiceId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/summaries/practice/${practiceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.summary;
    },
    enabled: !!practiceId,
  });

  const summary = summaryData as Summary | undefined;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No summary available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold mb-2">Practice Summary</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-blue-100">Date</p>
            <p className="font-semibold">{summary.practiceDate}</p>
          </div>
          <div>
            <p className="text-blue-100">Court</p>
            <p className="font-semibold">Court {summary.court}</p>
          </div>
          <div>
            <p className="text-blue-100">Total Matches</p>
            <p className="font-semibold">{summary.totalMatches}</p>
          </div>
          <div>
            <p className="text-blue-100">Participants</p>
            <p className="font-semibold">{summary.totalParticipants}</p>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Performers</h3>
        {summary.topPerformers.length > 0 ? (
          <div className="space-y-3">
            {summary.topPerformers.map((performer, index) => (
              <div
                key={performer.playerId}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{performer.playerName}</p>
                    <p className="text-sm text-gray-600">
                      {performer.wins}W - {performer.matchesPlayed - performer.wins}L
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">
                    {Math.round(performer.winRate)}%
                  </p>
                  <p className="text-xs text-gray-600">win rate</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No match data available</p>
        )}
      </div>

      {/* Most Matches */}
      {summary.mostMatches && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🎾 Most Matches</h3>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div>
              <p className="font-semibold text-gray-900">{summary.mostMatches.playerName}</p>
              <p className="text-sm text-gray-600">played the most matches</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{summary.mostMatches.matchCount}</p>
              <p className="text-xs text-gray-600">matches</p>
            </div>
          </div>
        </div>
      )}

      {/* Closest Score */}
      {summary.closestScore && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">⚔️ Closest Match</h3>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center flex-1">
                <p className="font-semibold text-gray-900">{summary.closestScore.player1Name}</p>
                <p className="text-xs text-gray-600">{summary.closestScore.player1SkillLevel}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-3xl font-bold text-gray-900">
                  {summary.closestScore.player1Score} - {summary.closestScore.player2Score}
                </p>
                <p className="text-xs text-gray-600">Score margin: {summary.closestScore.scoreMargin}</p>
              </div>
              <div className="text-center flex-1">
                <p className="font-semibold text-gray-900">{summary.closestScore.player2Name}</p>
                <p className="text-xs text-gray-600">{summary.closestScore.player2SkillLevel}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-center">{summary.closestScore.matchType}</p>
          </div>
        </div>
      )}

      {/* Biggest Upset */}
      {summary.biggestUpset && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 Biggest Upset</h3>
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center flex-1">
                <p className="font-semibold text-gray-900">{summary.biggestUpset.player1Name}</p>
                <p className="text-xs text-gray-600">{summary.biggestUpset.player1SkillLevel}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-3xl font-bold text-gray-900">
                  {summary.biggestUpset.player1Score} - {summary.biggestUpset.player2Score}
                </p>
                <p className="text-xs text-gray-600">Upset confirmed! 🎉</p>
              </div>
              <div className="text-center flex-1">
                <p className="font-semibold text-gray-900">{summary.biggestUpset.player2Name}</p>
                <p className="text-xs text-gray-600">{summary.biggestUpset.player2SkillLevel}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-center">{summary.biggestUpset.matchType}</p>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-gray-600 font-medium">Total Matches</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.totalMatches}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-gray-600 font-medium">Participants</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.totalParticipants}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-gray-600 font-medium">Top Performer</p>
          <p className="text-lg font-bold text-purple-600 mt-1">
            {summary.topPerformers[0]?.playerName || 'N/A'}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-xs text-gray-600 font-medium">Closest Match</p>
          <p className="text-lg font-bold text-orange-600 mt-1">
            {summary.closestScore ? `±${summary.closestScore.scoreMargin}` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PracticeSummary;
