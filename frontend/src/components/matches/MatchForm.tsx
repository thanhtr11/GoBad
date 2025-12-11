import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useClub } from '../../context/ClubContext';

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    skillLevel: string;
    email?: string;
    role?: string;
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

interface MatchFormProps {
  practiceId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MatchForm: React.FC<MatchFormProps> = ({ practiceId, onSuccess, onCancel }) => {
  const { selectedClubId } = useClub();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    practiceId: practiceId || '',
    player1Id: '',
    player2Id: '',
    player3Id: '',
    player4Id: '',
    matchType: 'SINGLES' as 'SINGLES' | 'DOUBLES',
    score1: '',
    score2: '',
    court: '',
    notes: '',
  });

  // Fetch practices
  useEffect(() => {
    const fetchPractices = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('/api/practices', {
          params: { clubId: selectedClubId },
          headers: { Authorization: `Bearer ${token}` },
        });
        setPractices(response.data.practices || []);
        
        // Set court from selected practice
        if (practiceId) {
          const practice = response.data.practices.find((p: Practice) => p.id === practiceId);
          if (practice) {
            setFormData(prev => ({ ...prev, court: practice.court }));
          }
        }
      } catch (err) {
        console.error('Error fetching practices:', err);
      }
    };

    if (selectedClubId) {
      fetchPractices();
    }
  }, [practiceId, selectedClubId]);

  // Fetch members when practice is selected
  useEffect(() => {
    const fetchMembers = async () => {
      if (!formData.practiceId) {
        setMembers([]);
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        
        // Get practice to find club
        const practice = practices.find(p => p.id === formData.practiceId);
        console.log('Selected practice:', practice);
        
        if (!practice) {
          console.error('Practice not found in practices list');
          return;
        }

        console.log('Fetching members for clubId:', practice.club.id);

        // Fetch all members from the practice's club
        const membersResponse = await axios.get('/api/members', {
          params: { clubId: practice.club.id },
          headers: { Authorization: `Bearer ${token}` },
        });

        // Handle both response formats
        let allMembers: Member[] = [];
        if (Array.isArray(membersResponse.data)) {
          allMembers = membersResponse.data;
        } else if (membersResponse.data.members && Array.isArray(membersResponse.data.members)) {
          allMembers = membersResponse.data.members;
        }
        
        // Try to fetch practice guests (optional)
        let guestIds: string[] = [];
        try {
          const guestsResponse = await axios.get(`/api/practices/${formData.practiceId}/guests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          guestIds = guestsResponse.data.guests?.map((g: any) => g.id) || [];
        } catch (guestErr) {
          console.log('Guests endpoint not available, skipping guest marking');
        }
        
        // Mark guests in members array
        const playersWithGuestStatus = allMembers.map(member => ({
          ...member,
          isGuest: guestIds.includes(member.user.id)
        }));
        
        console.log('Members with guest status:', playersWithGuestStatus);
        setMembers(playersWithGuestStatus);
      } catch (err) {
        console.error('Error fetching members:', err);
        if (axios.isAxiosError(err)) {
          console.error('Axios error status:', err.response?.status);
          console.error('Axios error data:', err.response?.data);
        }
      }
    };

    if (formData.practiceId) {
      fetchMembers();
    }
  }, [formData.practiceId, practices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.practiceId) {
      setError('Please select a practice session');
      return;
    }

    if (!formData.player1Id || !formData.player2Id) {
      setError('Please select both players');
      return;
    }

    if (formData.player1Id === formData.player2Id) {
      setError('Players must be different');
      return;
    }

    const score1 = parseInt(formData.score1);
    const score2 = parseInt(formData.score2);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      setError('Scores must be non-negative numbers');
      return;
    }

    if (score1 === score2) {
      setError('Match cannot end in a tie');
      return;
    }

    if (!formData.court.trim()) {
      setError('Court is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      await axios.post(
        '/api/matches',
        {
          practiceId: formData.practiceId,
          player1Id: formData.player1Id,
          player2Id: formData.player2Id,
          player3Id: formData.matchType === 'DOUBLES' ? formData.player3Id : undefined,
          player4Id: formData.matchType === 'DOUBLES' ? formData.player4Id : undefined,
          matchType: formData.matchType,
          score1,
          score2,
          court: formData.court,
          notes: formData.notes || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setFormData({
        practiceId: practiceId || '',
        player1Id: '',
        player2Id: '',
        player3Id: '',
        player4Id: '',
        matchType: 'SINGLES',
        score1: '',
        score2: '',
        court: formData.court,
        notes: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Record Match Result</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Practice Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Practice Session *
        </label>
        <select
          value={formData.practiceId}
          onChange={(e) => {
            const practice = practices.find(p => p.id === e.target.value);
            setFormData({
              ...formData,
              practiceId: e.target.value,
              court: practice?.court || '',
            });
          }}
          disabled={!!practiceId}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select practice session</option>
          {practices.map((practice) => (
            <option key={practice.id} value={practice.id}>
              {new Date(practice.date).toLocaleDateString()} - {practice.club.name} - {practice.court}
            </option>
          ))}
        </select>
      </div>

      {/* Player 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Player 1 (Team A) * <span className="text-xs text-gray-500">({members.length} available)</span>
        </label>
        <select
          value={formData.player1Id}
          onChange={(e) => setFormData({ ...formData, player1Id: e.target.value })}
          disabled={!formData.practiceId || members.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          required
        >
          <option value="">{members.length === 0 ? 'No players available' : 'Select player'}</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.user.name} ({member.user.skillLevel}) {(member as any).isGuest ? '👥 Guest' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Player 2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Player 2 (Team B) * <span className="text-xs text-gray-500">({members.filter(m => m.id !== formData.player1Id).length} available)</span>
        </label>
        <select
          value={formData.player2Id}
          onChange={(e) => setFormData({ ...formData, player2Id: e.target.value })}
          disabled={!formData.practiceId || members.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          required
        >
          <option value="">Select player</option>
          {members
            .filter(m => m.id !== formData.player1Id)
            .map((member) => (
            <option key={member.id} value={member.id}>
              {member.user.name} ({member.user.skillLevel}) {(member as any).isGuest ? '👥 Guest' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Match Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Match Type *
        </label>
        <select
          value={formData.matchType}
          onChange={(e) => setFormData({ ...formData, matchType: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="SINGLES">Singles</option>
          <option value="DOUBLES">Doubles</option>
        </select>
      </div>

      {/* Player 3 - Only for Doubles */}
      {formData.matchType === 'DOUBLES' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Player 3 (Team A) * <span className="text-xs text-gray-500">({members.filter(m => m.id !== formData.player1Id && m.id !== formData.player2Id && m.id !== formData.player4Id).length} available)</span>
          </label>
          <select
            value={formData.player3Id}
            onChange={(e) => setFormData({ ...formData, player3Id: e.target.value })}
            disabled={!formData.practiceId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select player</option>
            {members
              .filter(m => m.id !== formData.player1Id && m.id !== formData.player2Id && m.id !== formData.player4Id)
              .map((member) => (
              <option key={member.id} value={member.id}>
                {member.user.name} ({member.user.skillLevel})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Player 4 - Only for Doubles */}
      {formData.matchType === 'DOUBLES' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Player 4 (Team B) * <span className="text-xs text-gray-500">({members.filter(m => m.id !== formData.player1Id && m.id !== formData.player2Id && m.id !== formData.player3Id).length} available)</span>
          </label>
          <select
            value={formData.player4Id}
            onChange={(e) => setFormData({ ...formData, player4Id: e.target.value })}
            disabled={!formData.practiceId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select player</option>
            {members
              .filter(m => m.id !== formData.player1Id && m.id !== formData.player2Id && m.id !== formData.player3Id)
              .map((member) => (
              <option key={member.id} value={member.id}>
                {member.user.name} ({member.user.skillLevel})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {formData.matchType === 'DOUBLES' ? 'Team A Score' : 'Player 1 Score'} *
          </label>
          <input
            type="number"
            min="0"
            value={formData.score1}
            onChange={(e) => setFormData({ ...formData, score1: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="21"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {formData.matchType === 'DOUBLES' ? 'Team B Score' : 'Player 2 Score'} *
          </label>
          <input
            type="number"
            min="0"
            value={formData.score2}
            onChange={(e) => setFormData({ ...formData, score2: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="15"
            required
          />
        </div>
      </div>

      {/* Court */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Court *
        </label>
        <input
          type="text"
          value={formData.court}
          onChange={(e) => setFormData({ ...formData, court: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Court 1"
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any notes about the match..."
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Recording...' : 'Record Match'}
        </button>
      </div>
    </form>
  );
};

export default MatchForm;
