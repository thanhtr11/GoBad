import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Club {
  id: string;
  name: string;
}

interface ClubStats {
  totalMembers: number;
  activeMembers: number;
  totalMatches: number;
  averagePointsPerMatch: number;
}

interface Match {
  id: string;
  practice?: {
    date: string;
    club: { id: string; name: string };
  };
  player1: { id: string; name: string; skillLevel: string };
  player2: { id: string; name: string; skillLevel: string };
  player3?: { id: string; name: string; skillLevel: string };
  player4?: { id: string; name: string; skillLevel: string };
  score1: number;
  score2: number;
  matchType: string;
  court: string;
}

interface Practice {
  id: string;
  club: Club;
  date: string;
  startTime: string;
  court: string;
}

const Dashboard: React.FC = () => {
  // Fetch clubs
  const { data: clubsData } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/clubs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.clubs || [];
    },
  });

  const clubs = (clubsData || []) as Club[];
  const selectedClubId = clubs.length > 0 ? clubs[0].id : undefined;

  // Fetch club stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['club-stats', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return null;
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/stats/club-summary/${selectedClubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.summary;
    },
    enabled: !!selectedClubId,
  });

  // Fetch recent matches
  const { data: matchesData } = useQuery({
    queryKey: ['recent-matches', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/matches?clubId=${selectedClubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const matches = response.data?.matches || response.data || [];
      return matches.slice(-5).reverse(); // Last 5, most recent first
    },
    enabled: !!selectedClubId,
  });

  // Fetch upcoming practices
  const { data: practicesData } = useQuery({
    queryKey: ['upcoming-practices', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/practices?clubId=${selectedClubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const practices = response.data?.practices || response.data || [];
      const now = new Date();
      return practices
        .filter((p: Practice) => new Date(p.date) > now)
        .slice(0, 5);
    },
    enabled: !!selectedClubId,
  });

  const stats = statsData as ClubStats | null;
  const matches = (matchesData || []) as Match[];
  const practices = (practicesData || []) as Practice[];

  const statCards = [
    {
      label: 'Total Members',
      value: stats?.totalMembers || 0,
      color: 'bg-blue-100 text-blue-600',
      icon: '👥',
    },
    {
      label: 'Active Members',
      value: stats?.activeMembers || 0,
      color: 'bg-green-100 text-green-600',
      icon: '✅',
    },
    {
      label: 'Total Matches',
      value: stats?.totalMatches || 0,
      color: 'bg-purple-100 text-purple-600',
      icon: '🎯',
    },
    {
      label: 'Avg Points/Match',
      value: stats?.averagePointsPerMatch || '0',
      color: 'bg-orange-100 text-orange-600',
      icon: '📊',
    },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.color} rounded-lg shadow-md p-6 border border-current border-opacity-10`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <span className="text-4xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Matches & Upcoming Practices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Matches</h3>
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{match.player1?.name || 'Unknown Player'}</p>
                    <p className="text-xs text-gray-600">vs {match.player2?.name || 'Unknown Player'}</p>
                  </div>
                  <div className="font-bold text-gray-900">
                    {match.score1}-{match.score2}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent matches</p>
          )}
        </div>

        {/* Upcoming Practices */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Practices</h3>
          {practices.length > 0 ? (
            <div className="space-y-3">
              {practices.map((practice) => (
                <div
                  key={practice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Court {practice.court}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(practice.date).toLocaleDateString()} at {practice.startTime}
                    </p>
                  </div>
                  <span className="text-lg">🎾</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No upcoming practices</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
