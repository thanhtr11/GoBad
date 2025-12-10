import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceTrend {
  date: string;
  winRate: number;
  totalMatches: number;
  wins: number;
}

interface PerformanceChartProps {
  playerId: string;
  playerName?: string;
  daysBack?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  playerId,
  playerName = 'Player',
  daysBack = 30,
}) => {
  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['performance-trends', playerId, daysBack],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/stats/trends/${playerId}?daysBack=${daysBack}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.trends || [];
    },
    enabled: !!playerId,
  });

  const trends = (trendsData || []) as PerformanceTrend[];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Trends</h2>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No performance data available</p>
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = trends.map((trend) => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    winRate: Math.round(trend.winRate * 100) / 100,
    wins: trend.wins,
    totalMatches: trend.totalMatches,
  }));

  // Calculate statistics
  const latestTrend = trends[trends.length - 1];
  const previousTrend = trends.length > 1 ? trends[trends.length - 2] : null;
  const trendDirection =
    previousTrend && latestTrend.winRate > previousTrend.winRate
      ? 'up'
      : previousTrend && latestTrend.winRate < previousTrend.winRate
        ? 'down'
        : 'flat';
  const trendChange = previousTrend
    ? Math.round((latestTrend.winRate - previousTrend.winRate) * 100) / 100
    : 0;

  const avgWinRate = Math.round(
    (trends.reduce((sum, t) => sum + t.winRate, 0) / trends.length) * 100
  ) / 100;
  const totalWins = trends.reduce((sum, t) => sum + t.wins, 0);
  const totalMatches = trendsData[trendsData.length - 1]?.totalMatches || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{playerName} Performance Trends</h2>
        <p className="text-sm text-gray-600 mt-1">Last {daysBack} days</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-xs text-gray-700 font-medium">Current Win Rate</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {Math.round(latestTrend.winRate * 100)}%
          </p>
          <p className={`text-xs mt-2 font-medium ${
            trendDirection === 'up'
              ? 'text-green-600'
              : trendDirection === 'down'
                ? 'text-red-600'
                : 'text-gray-600'
          }`}>
            {trendDirection === 'up' ? '📈' : trendDirection === 'down' ? '📉' : '➡️'}{' '}
            {Math.abs(trendChange).toFixed(1)}% {trendDirection === 'up' ? 'increase' : trendDirection === 'down' ? 'decrease' : 'stable'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <p className="text-xs text-gray-700 font-medium">Average Win Rate</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {Math.round(avgWinRate * 100)}%
          </p>
          <p className="text-xs mt-2 text-gray-600">Over {trends.length} periods</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <p className="text-xs text-gray-700 font-medium">Total Wins</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{totalWins}</p>
          <p className="text-xs mt-2 text-gray-600">In {totalMatches} matches</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <p className="text-xs text-gray-700 font-medium">Latest Matches</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {latestTrend.totalMatches}
          </p>
          <p className="text-xs mt-2 text-gray-600">{latestTrend.wins} wins</p>
        </div>
      </div>

      {/* Win Rate Trend Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Win Rate Progression</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: 'Win Rate %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: any) => {
                if (typeof value === 'number') {
                  return `${Math.round(value)}%`;
                }
                return value;
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="winRate"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWinRate)"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Matches Progress Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Progress</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              yAxisId="left"
              label={{ value: 'Matches', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              label={{ value: 'Wins', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="totalMatches"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="#f3e8ff"
              dot={{ fill: '#8b5cf6', r: 3 }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="wins"
              stroke="#10b981"
              strokeWidth={2}
              fill="#d1fae5"
              dot={{ fill: '#10b981', r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
