import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useClub } from '../context/ClubContext';
import Dashboard from '../components/stats/Dashboard';
import Leaderboard from '../components/stats/Leaderboard';
import PlayerStatsCard from '../components/stats/PlayerStatsCard';
import HeadToHead from '../components/stats/HeadToHead';
import PerformanceChart from '../components/stats/PerformanceChart';
import StatsFilters, { StatsFilterOptions } from '../components/stats/StatsFilters';

interface Club {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  skillLevel: string;
}

interface Member {
  id: string;
  user: {
    name: string;
    skillLevel: string;
  };
}

const StatsPage: React.FC = () => {
  const { selectedClubId, clubs } = useClub();
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'player' | 'comparison' | 'trends'>('overview');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>();
  const [comparisonPlayer1, setComparisonPlayer1] = useState<string>();
  const [comparisonPlayer2, setComparisonPlayer2] = useState<string>();

  // Fetch players for current club
  const { data: playersData } = useQuery({
    queryKey: ['club-members', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/members`,
        { 
          params: { clubId: selectedClubId },
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      const members = (response.data?.members || response.data || []) as Member[];
      // Transform member data to player format
      return members.map(member => ({
        id: member.id,
        name: member.user.name,
        skillLevel: member.user.skillLevel,
      }));
    },
    enabled: !!selectedClubId,
  });

  const players = (playersData || []) as Player[];

  const handleFilterChange = (newFilters: StatsFilterOptions) => {
    // Club selection is now managed by ClubContext, so we don't need to handle it here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-2">Track player performance and competitive rankings</p>
        </div>

        {/* Filters */}
        <StatsFilters
          onFilter={handleFilterChange}
          clubs={clubs}
          showSkillFilter={true}
          showMinMatchesFilter={true}
          showSortOptions={true}
        />

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white rounded-t-lg">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'leaderboard', label: '🏆 Leaderboard' },
              { id: 'player', label: '👤 Player Stats' },
              { id: 'comparison', label: '⚔️ Comparison' },
              { id: 'trends', label: '📈 Trends' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg">
          {/* Overview Tab */}
          {activeTab === 'overview' && selectedClubId && (
            <div className="p-6">
              <Dashboard />
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && selectedClubId && (
            <div className="p-6">
              <Leaderboard clubId={selectedClubId} />
            </div>
          )}

          {/* Player Stats Tab */}
          {activeTab === 'player' && (
            <div className="p-6 space-y-6">
              {/* Player Selector */}
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Player
                  </label>
                  <select
                    value={selectedPlayerId || ''}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a player...</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Player Stats Card */}
                {selectedPlayerId && (
                  <div className="mt-6">
                    <PlayerStatsCard playerId={selectedPlayerId} />
                  </div>
                )}

                {!selectedPlayerId && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Select a player to view their statistics</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <div className="p-6 space-y-6">
              {/* Player Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player 1
                  </label>
                  <select
                    value={comparisonPlayer1 || ''}
                    onChange={(e) => setComparisonPlayer1(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose player 1...</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player 2
                  </label>
                  <select
                    value={comparisonPlayer2 || ''}
                    onChange={(e) => setComparisonPlayer2(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose player 2...</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Head-to-Head Comparison */}
              {comparisonPlayer1 && comparisonPlayer2 && comparisonPlayer1 !== comparisonPlayer2 ? (
                <div className="mt-6">
                  <HeadToHead
                    playerId1={comparisonPlayer1}
                    playerId2={comparisonPlayer2}
                  />
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    {!comparisonPlayer1 || !comparisonPlayer2
                      ? 'Select two different players to compare'
                      : 'Please select different players'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="p-6 space-y-6">
              {/* Player Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Player
                </label>
                <select
                  value={selectedPlayerId || ''}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a player...</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Performance Chart */}
              {selectedPlayerId && (
                <div className="mt-6">
                  <PerformanceChart
                    playerId={selectedPlayerId}
                    daysBack={30}
                  />
                </div>
              )}

              {!selectedPlayerId && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Select a player to view their performance trends</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
