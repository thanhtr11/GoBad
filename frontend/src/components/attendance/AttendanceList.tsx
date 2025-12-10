import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AttendanceRecord {
  id: string;
  member: {
    id: string;
    name: string;
    email: string;
    skillLevel: string;
  };
  practice: {
    id: string;
    date: string;
    court: string;
  };
  checkInAt: string;
}

interface AttendanceListProps {
  clubId: string;
  practiceId?: string;
  memberId?: string;
}

const AttendanceList: React.FC<AttendanceListProps> = ({
  clubId,
  practiceId,
  memberId,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', new Date(startDate).toISOString());
  if (endDate) queryParams.append('endDate', new Date(endDate).toISOString());
  if (memberId) queryParams.append('memberId', memberId);

  const endpoint = practiceId
    ? `/api/attendance/practice/${practiceId}`
    : `/api/attendance/club/${clubId}/history?${queryParams.toString()}`;

  // Fetch attendance records
  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', clubId, practiceId, startDate, endDate, memberId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      const data = await response.json();
      return data.data || [];
    },
  });

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h3>

      {/* Filters */}
      {!practiceId && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md text-sm font-medium transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Member</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Skill Level</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Court</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const date = new Date(record.checkInAt);
                return (
                  <tr key={record.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-900">
                      {date.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {record.member.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{record.member.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {record.member.skillLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.practice.court || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No attendance records found</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-sm text-gray-500">
        Total: {records.length} records
      </div>
    </div>
  );
};

export default AttendanceList;
