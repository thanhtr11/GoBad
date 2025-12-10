import { useState } from 'react';

interface ExportButtonsProps {
  clubId: string;
  onExportCSV?: () => void;
  onExportPDF?: (type: string) => void;
  showAttendance?: boolean;
  showFinance?: boolean;
  showMembers?: boolean;
  showStats?: boolean;
}

export function ExportButtons({
  clubId,
  onExportCSV,
  onExportPDF,
  showAttendance = false,
  showFinance = false,
  showMembers = false,
  showStats = false,
}: ExportButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExportCSV = async () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }

    setIsLoading(true);
    try {
      let endpoint = '';
      let filename = '';

      if (showAttendance) {
        endpoint = `/api/attendance/club/${clubId}/export/csv`;
        filename = `attendance-${clubId}.csv`;
      } else if (showFinance) {
        endpoint = `/api/finances/club/${clubId}/export/csv`;
        filename = `finances-${clubId}.csv`;
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Failed to export CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async (type: string) => {
    if (onExportPDF) {
      onExportPDF(type);
      return;
    }

    setIsLoading(true);
    try {
      let endpoint = '';
      let filename = '';

      if (type === 'attendance' && showAttendance) {
        endpoint = `/api/exports/attendance/${clubId}/pdf`;
        filename = `attendance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'finance' && showFinance) {
        endpoint = `/api/exports/finance/${clubId}/pdf`;
        filename = `finance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'members' && showMembers) {
        endpoint = `/api/exports/members/${clubId}/pdf`;
        filename = `members-${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'stats' && showStats) {
        endpoint = `/api/exports/stats/${clubId}/pdf`;
        filename = `stats-${new Date().toISOString().split('T')[0]}.pdf`;
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {(showAttendance || showFinance) && (
        <button
          onClick={handleExportCSV}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          <span>📥</span>
          <span>📊</span>
          Export CSV
        </button>
      )}

      {showAttendance && (
        <button
          onClick={() => handleExportPDF('attendance')}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
        >
          <span>📥</span>
          <span>📄</span>
          Export PDF
        </button>
      )}

      {showFinance && (
        <button
          onClick={() => handleExportPDF('finance')}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
        >
          <span>📥</span>
          <span>📄</span>
          Export PDF
        </button>
      )}

      {showMembers && (
        <button
          onClick={() => handleExportPDF('members')}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
        >
          <span>📥</span>
          <span>📄</span>
          Export PDF
        </button>
      )}

      {showStats && (
        <button
          onClick={() => handleExportPDF('stats')}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
        >
          <span>📥</span>
          <span>📄</span>
          Export PDF
        </button>
      )}

      {isLoading && <span className="text-sm text-gray-600">Exporting...</span>}
    </div>
  );
}
