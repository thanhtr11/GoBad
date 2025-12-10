import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExportButtons } from '../common/ExportButtons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DailyStats {
  date: string;
  dayOfWeek: string;
  present: number;
  rate: number;
}

interface ReportData {
  date: string;
  presentCount: number;
  absentCount: number;
  totalExpected: number;
  attendanceRate: number;
}

interface AttendanceReportProps {
  clubId: string;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ clubId }) => {
  const [period, setPeriod] = useState('4'); // 4 weeks default

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  const weeks = parseInt(period);
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Fetch weekly stats
  const { data: weeklyStats = [] } = useQuery<DailyStats[]>({
    queryKey: ['attendance-weekly', clubId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/attendance/club/${clubId}/weekly`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch weekly stats');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch detailed report
  const { data: reportData = [] } = useQuery<ReportData[]>({
    queryKey: ['attendance-report', clubId, startDate, endDate],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const response = await fetch(
        `/api/attendance/club/${clubId}/report?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Calculate summary stats
  const totalRecords = reportData.length;
  const totalPresent = reportData.reduce((sum, r) => sum + r.presentCount, 0);
  const totalAbsent = reportData.reduce((sum, r) => sum + r.absentCount, 0);
  const avgRate =
    totalRecords > 0
      ? reportData.reduce((sum, r) => sum + r.attendanceRate, 0) / totalRecords
      : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Report</h3>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="2">Last 2 weeks</option>
          <option value="4">Last 4 weeks</option>
          <option value="8">Last 8 weeks</option>
          <option value="12">Last 3 months</option>
        </select>
        </div>
        <ExportButtons clubId={clubId} showAttendance={true} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-green-600 text-sm font-medium">Total Present</p>
          <p className="text-2xl font-bold text-green-900">{totalPresent}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <p className="text-red-600 text-sm font-medium">Total Absent</p>
          <p className="text-2xl font-bold text-red-900">{totalAbsent}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-blue-600 text-sm font-medium">Avg Rate</p>
          <p className="text-2xl font-bold text-blue-900">{avgRate.toFixed(1)}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-purple-600 text-sm font-medium">Practices</p>
          <p className="text-2xl font-bold text-purple-900">{totalRecords}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Present vs Absent */}
        {reportData.length > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Present vs Absent</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="presentCount" fill="#10b981" name="Present" />
                <Bar dataKey="absentCount" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weekly Trend */}
        {weeklyStats.length > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Weekly Attendance Rate</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayOfWeek" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#3b82f6"
                  name="Attendance Rate (%)"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      {reportData.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <h4 className="font-semibold text-gray-900 p-4 border-b">
            Detailed Records
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Present
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Absent
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((record) => (
                  <tr key={record.date} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        {record.presentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                        {record.absentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {record.totalExpected}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              record.attendanceRate >= 80
                                ? 'bg-green-500'
                                : record.attendanceRate >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{
                              width: `${record.attendanceRate}%`,
                            }}
                          />
                        </div>
                        <span className="text-gray-900 font-semibold w-12">
                          {record.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No attendance data available</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;
