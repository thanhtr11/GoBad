import React, { useState } from 'react';
import MatchCard from './MatchCard';

interface Match {
  id: string;
  matchType: 'SINGLES' | 'DOUBLES';
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
  player3?: {
    id: string;
    name: string;
    skillLevel: string;
  };
  player4?: {
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

interface Member {
  id: string;
  name: string;
  skillLevel: string;
}

interface MatchListProps {
  matches: Match[];
  members?: Member[];
  onMatchDeleted?: () => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, members = [], onMatchDeleted }) => {
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterMatchType, setFilterMatchType] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  // Filter matches
  let filteredMatches = [...matches];

  if (filterPlayer) {
    filteredMatches = filteredMatches.filter(
      (match) =>
        match.player1.id === filterPlayer || match.player2.id === filterPlayer
    );
  }

  if (filterMatchType) {
    filteredMatches = filteredMatches.filter(
      (match) => match.matchType === filterMatchType
    );
  }

  // Sort matches
  filteredMatches.sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Sort by score difference (closest matches first)
      const diffA = Math.abs(a.score1 - a.score2);
      const diffB = Math.abs(b.score1 - b.score2);
      return diffA - diffB;
    }
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Player Filter */}
          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Player
              </label>
              <select
                value={filterPlayer}
                onChange={(e) => setFilterPlayer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Players</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Match Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Match Type
            </label>
            <select
              value={filterMatchType}
              onChange={(e) => setFilterMatchType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="SINGLES">Singles</option>
              <option value="DOUBLES">Doubles</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Most Recent</option>
              <option value="score">Closest Match</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(filterPlayer || filterMatchType) && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filterPlayer && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {members.find((m) => m.id === filterPlayer)?.name}
                <button
                  onClick={() => setFilterPlayer('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filterMatchType && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filterMatchType === 'SINGLES' ? 'Singles' : 'Doubles'}
                <button
                  onClick={() => setFilterMatchType('')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterPlayer('');
                setFilterMatchType('');
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Match Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredMatches.length} of {matches.length} matches
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterPlayer || filterMatchType
              ? 'Try adjusting your filters'
              : 'Get started by recording a match'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onDelete={onMatchDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchList;
