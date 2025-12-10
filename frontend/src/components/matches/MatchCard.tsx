import React, { useState } from 'react';
import axios from 'axios';

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

interface MatchCardProps {
  match: Match;
  onDelete?: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const matchTypeLabels = {
    SINGLES: 'Singles',
    DOUBLES: 'Doubles',
  };

  const matchTypeBadgeColors = {
    SINGLES: 'bg-blue-100 text-blue-800',
    DOUBLES: 'bg-green-100 text-green-800',
  };

  const skillLevelColors = {
    BEGINNER: 'text-green-600',
    INTERMEDIATE: 'text-yellow-600',
    ADVANCED: 'text-red-600',
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('auth_token');
      await axios.delete(`/api/matches/${match.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      console.error('Error deleting match:', err);
      alert('Failed to delete match');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${matchTypeBadgeColors[match.matchType]}`}>
            {matchTypeLabels[match.matchType]}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            {match.court}
          </span>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 hover:text-red-800"
          title="Delete match"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Players and Score */}
      {match.matchType === 'SINGLES' ? (
        <div className="space-y-3">
          {/* Singles Match */}
          {(() => {
            const winner = match.score1 > match.score2 ? match.player1 : match.player2;
            const loser = match.score1 > match.score2 ? match.player2 : match.player1;
            const winningScore = Math.max(match.score1, match.score2);
            const losingScore = Math.min(match.score1, match.score2);

            return (
              <>
                {/* Winner */}
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 border-2 border-green-200">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">{winner.name}</span>
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${skillLevelColors[winner.skillLevel as keyof typeof skillLevelColors]}`}>
                      {winner.skillLevel}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-green-700">
                    {winningScore}
                  </div>
                </div>

                {/* Loser */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div>
                    <div className="text-lg font-semibold text-gray-700">{loser.name}</div>
                    <span className={`text-sm font-medium ${skillLevelColors[loser.skillLevel as keyof typeof skillLevelColors]}`}>
                      {loser.skillLevel}
                    </span>
                  </div>
                  <div className="text-3xl font-semibold text-gray-600">
                    {losingScore}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        // Doubles Match
        <div className="space-y-3">
          {/* Team A (Player1 + Player3) */}
          <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 border-2 border-green-200">
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-700 mb-1">Team A</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-green-600">Player 1</span>
                  <span className="text-lg font-bold text-gray-900">{match.player1.name}</span>
                  <span className={`text-xs font-medium ${skillLevelColors[match.player1.skillLevel as keyof typeof skillLevelColors]}`}>
                    {match.player1.skillLevel}
                  </span>
                </div>
                {match.player3 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-green-600">Player 3</span>
                    <span className="text-lg font-bold text-gray-900">{match.player3.name}</span>
                    <span className={`text-xs font-medium ${skillLevelColors[match.player3.skillLevel as keyof typeof skillLevelColors]}`}>
                      {match.player3.skillLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-3xl font-bold text-green-700 ml-4">
              {match.score1}
            </div>
          </div>

          {/* Team B (Player2 + Player4) */}
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-700 mb-1">Team B</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-blue-600">Player 2</span>
                  <span className="text-lg font-bold text-gray-900">{match.player2.name}</span>
                  <span className={`text-xs font-medium ${skillLevelColors[match.player2.skillLevel as keyof typeof skillLevelColors]}`}>
                    {match.player2.skillLevel}
                  </span>
                </div>
                {match.player4 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-blue-600">Player 4</span>
                    <span className="text-lg font-bold text-gray-900">{match.player4.name}</span>
                    <span className={`text-xs font-medium ${skillLevelColors[match.player4.skillLevel as keyof typeof skillLevelColors]}`}>
                      {match.player4.skillLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-700 ml-4">
              {match.score2}
            </div>
          </div>
        </div>
      )}

      {/* Match Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {match.practice && (
              <>
                <span>{new Date(match.practice.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{match.practice.club.name}</span>
              </>
            )}
          </div>
          <span>{new Date(match.createdAt).toLocaleTimeString()}</span>
        </div>

        {match.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 italic">{match.notes}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Match?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {match.matchType.toLowerCase()} match? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
