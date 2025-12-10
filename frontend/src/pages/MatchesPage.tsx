import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useClub } from '../context/ClubContext';
import MatchForm from '../components/matches/MatchForm';
import MatchList from '../components/matches/MatchList';
import PlayerStats from '../components/matches/PlayerStats';

interface Match {
  id: string;
  matchType: 'SINGLES' | 'DOUBLES' | 'MIXED_DOUBLES';
  score1: number;
  score2: number;
  court: string;
  notes?: string;
  createdAt: string;
  player1: {
    id: string;
    name: string;
    skillLevel: string;
  };
  player2: {
    id: string;
    name: string;
    skillLevel: string;
  };
  practice?: {
    date: string;
    club: {
      name: string;
    };
  };
}

interface Practice {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  court: string;
  club: {
    id: string;
    name: string;
  };
}

interface Member {
  id: string;
  name: string;
  skillLevel: string;
}

const MatchesPage: React.FC = () => {
  const { selectedClubId } = useClub();
  const [selectedPractice, setSelectedPractice] = useState('');
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showPlayerStats, setShowPlayerStats] = useState(false);

  // Fetch practices
  const { data: practicesData } = useQuery({
    queryKey: ['practices', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return { practices: [] };
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/practices', {
        params: { clubId: selectedClubId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!selectedClubId,
  });

  const practices: Practice[] = practicesData?.practices || [];

  // Fetch matches
  const {
    data: matchesData,
    refetch: refetchMatches,
    isLoading: matchesLoading,
  } = useQuery({
    queryKey: ['matches', selectedClubId, selectedPractice],
    queryFn: async () => {
      if (!selectedClubId) return { matches: [] };
      const token = localStorage.getItem('auth_token');
      const params: any = { clubId: selectedClubId };
      if (selectedPractice) {
        params.practiceId = selectedPractice;
      }
      const response = await axios.get('/api/matches', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!selectedClubId,
  });

  const matches: Match[] = matchesData?.matches || [];

  // Fetch members
  const { data: membersData } = useQuery({
    queryKey: ['members', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return { members: [] };
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/members', {
        params: { clubId: selectedClubId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!selectedClubId,
  });

  const members: Member[] = membersData?.members || [];

  const handleMatchSuccess = () => {
    setShowMatchForm(false);
    refetchMatches();
  };

  const handleMatchDeleted = () => {
    refetchMatches();
  };

  // Get unique players from matches
  const uniquePlayers = Array.from(
    new Set(
      matches.flatMap((match) => [
        JSON.stringify({ id: match.player1.id, name: match.player1.name, skillLevel: match.player1.skillLevel }),
        JSON.stringify({ id: match.player2.id, name: match.player2.name, skillLevel: match.player2.skillLevel }),
      ])
    )
  ).map((str) => JSON.parse(str));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Match Results</h1>
          <p className="mt-2 text-gray-600">Track and analyze match performance</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Practice Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Practice
              </label>
              <select
                value={selectedPractice}
                onChange={(e) => setSelectedPractice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Practices</option>
                {practices.map((practice) => (
                  <option key={practice.id} value={practice.id}>
                    {new Date(practice.date).toLocaleDateString()} - {practice.club.name} - {practice.court}
                  </option>
                ))}
              </select>
            </div>

            {/* Player Stats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View Player Stats
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => {
                  setSelectedPlayer(e.target.value);
                  setShowPlayerStats(!!e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select player</option>
                {uniquePlayers.map((player: any) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Match Button */}
            <div className="flex items-end">
              <button
                onClick={() => setShowMatchForm(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Record Match
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <div className="lg:col-span-2">
            {matchesLoading ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading matches...</p>
              </div>
            ) : (
              <MatchList
                matches={matches}
                members={members}
                onMatchDeleted={handleMatchDeleted}
              />
            )}
          </div>

          {/* Player Stats Sidebar */}
          <div className="lg:col-span-1">
            {showPlayerStats && selectedPlayer ? (
              <PlayerStats
                playerId={selectedPlayer}
                onClose={() => {
                  setShowPlayerStats(false);
                  setSelectedPlayer('');
                }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <p className="text-sm">Select a player to view their statistics</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Form Modal */}
      {showMatchForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <MatchForm
              practiceId={selectedPractice}
              onSuccess={handleMatchSuccess}
              onCancel={() => setShowMatchForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
