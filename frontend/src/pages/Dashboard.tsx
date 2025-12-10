import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';
import { useSearchParams } from 'react-router-dom';
import FinancialReport from '../components/finances/FinancialReport';
import AttendanceReport from '../components/attendance/AttendanceReport';
import TournamentStatistics from '../components/tournaments/TournamentStatistics';
import PracticeSummary from '../components/practices/PracticeSummary';

interface DashboardStats {
  totalMembers: number;
  totalMatches: number;
  activeMembers: number;
  averagePointsPerMatch: number;
}

interface RecentMatch {
  id: string;
  player1Name: string;
  player2Name: string;
  score1: number;
  score2: number;
  createdAt: string;
}

interface UpcomingPractice {
  id: string;
  date: string;
  court: string;
  club: { name: string };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { selectedClubId: contextClubId, setSelectedClubId: setContextClubId } = useClub();
  const [searchParams, setSearchParams] = useSearchParams();
  const clubIdParam = searchParams.get('clubId');
  const [selectedClubId, setSelectedClubId] = useState<string>(clubIdParam || contextClubId || '');
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>('');

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

  // Sync with URL params or context
  useEffect(() => {
    if (clubIdParam) {
      setSelectedClubId(clubIdParam);
      setContextClubId(clubIdParam);
    } else if (contextClubId) {
      setSelectedClubId(contextClubId);
      setSearchParams({ clubId: contextClubId });
    }
  }, [clubIdParam, contextClubId]);

  // Set default club and update URL and context
  useEffect(() => {
    if (clubsData && clubsData.length > 0 && !selectedClubId) {
      const firstClubId = clubsData[0].id;
      setSelectedClubId(firstClubId);
      setContextClubId(firstClubId);
      setSearchParams({ clubId: firstClubId });
    }
  }, [clubsData, selectedClubId, setSearchParams, setContextClubId]);

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
      const response = await axios.get('/api/matches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (response.data?.matches || []).slice(0, 5);
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
      const now = new Date();
      return (response.data?.practices || [])
        .filter((p: any) => new Date(p.date) >= now)
        .slice(0, 10);
    },
    enabled: !!selectedClubId,
  });

  // Fetch past practices for summaries
  const { data: pastPracticesData } = useQuery({
    queryKey: ['past-practices', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/practices?clubId=${selectedClubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const now = new Date();
      return (response.data?.practices || [])
        .filter((p: any) => new Date(p.date) < now)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    },
    enabled: !!selectedClubId,
  });

  const stats = statsData as DashboardStats | null;
  const recentMatches = (matchesData || []) as RecentMatch[];
  const upcomingPractices = (practicesData || []) as UpcomingPractice[];
  const pastPractices = (pastPracticesData || []) as UpcomingPractice[];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome, {user?.username}</p>
        </div>

        {/* Club Name */}
        {clubsData && clubsData.length > 0 && selectedClubId && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <span className="text-sm font-medium text-gray-500">Club: </span>
            <span className="text-lg font-semibold text-gray-900">
              {clubsData.find((club: any) => club.id === selectedClubId)?.name || 'Unknown Club'}
            </span>
          </div>
        )}

        {selectedClubId && stats && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Members */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Active Members */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Members</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeMembers}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Matches */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Matches</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalMatches}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Average Points */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Points/Match</p>
                    <p className="text-3xl font-bold text-gray-900">{Number(stats.averagePointsPerMatch).toFixed(1)}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Matches Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Matches</h2>
                <div className="space-y-3">
                  {recentMatches.length > 0 ? (
                    recentMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {match.player1Name} vs {match.player2Name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(match.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {match.score1} - {match.score2}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No recent matches</p>
                  )}
                </div>
              </div>

              {/* Upcoming Practices */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Practices</h2>
                <div className="space-y-3">
                  {upcomingPractices.length > 0 ? (
                    upcomingPractices.map((practice) => (
                      <div key={practice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{practice.court}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(practice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          📅
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No upcoming practices</p>
                  )}
                </div>
              </div>
            </div>

            {/* Integrated Modules Section */}
            <div className="mt-8 space-y-8">
              {/* Financial Report */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">💰 Financial Overview</h2>
                </div>
                <div className="p-6">
                  <FinancialReport clubId={selectedClubId} />
                </div>
              </div>

              {/* Attendance Report */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">📋 Attendance Overview</h2>
                </div>
                <div className="p-6">
                  <AttendanceReport clubId={selectedClubId} />
                </div>
              </div>

              {/* Tournament Statistics */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">🏆 Tournament Overview</h2>
                </div>
                <div className="p-6">
                  <TournamentStatistics clubId={selectedClubId} />
                </div>
              </div>

              {/* Practice Summaries & Highlights */}
              {pastPractices.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">📊 Practice Highlights & Summary</h2>
                    <p className="text-sm text-gray-600 mt-1">View detailed summaries of past practices including top performers and match highlights</p>
                  </div>
                  <div className="p-6">
                    {/* Practice selector */}
                    {pastPractices.length > 0 && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📅 Select Practice
                        </label>
                        <select
                          value={selectedPracticeId}
                          onChange={(e) => setSelectedPracticeId(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choose a practice to view summary...</option>
                          {pastPractices.map((practice) => (
                            <option key={practice.id} value={practice.id}>
                              {new Date(practice.date).toLocaleDateString()} - Court {practice.court}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Practice summary display */}
                    {selectedPracticeId && (
                      <div className="mt-6">
                        <PracticeSummary practiceId={selectedPracticeId} />
                      </div>
                    )}

                    {!selectedPracticeId && pastPractices.length > 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500">👆 Select a practice above to view detailed highlights and summaries</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {statsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
