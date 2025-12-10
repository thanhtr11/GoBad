import { useState } from 'react';
import { api } from '../../utils/api';

interface Practice {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  court: string;
  isTournament: boolean;
  club?: { name: string };
  _count?: {
    attendance: number;
    matches: number;
  };
}

interface PracticeCardProps {
  practice: Practice;
  onUpdated?: () => void;
}

const PracticeCard: React.FC<PracticeCardProps> = ({ practice, onUpdated }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/practices/${practice.id}`);
      setShowDeleteConfirm(false);
      onUpdated?.();
    } catch (error) {
      console.error('Failed to delete practice:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900">{practice.court}</h3>
          {practice.isTournament && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              🏆 Tournament
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 hover:text-red-800 text-xl"
          title="Delete practice"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-semibold">📅 Date:</span> {formatDate(practice.date)}
        </p>
        <p>
          <span className="font-semibold">⏰ Time:</span> {formatTime(practice.startTime)} -{' '}
          {formatTime(practice.endTime)}
        </p>
        {practice._count && (
          <div className="flex gap-4 pt-2 border-t border-gray-100">
            <p>
              <span className="font-semibold">✓ Attended:</span> {practice._count.attendance}
            </p>
            <p>
              <span className="font-semibold">🏸 Matches:</span> {practice._count.matches}
            </p>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900">Delete Practice</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to delete this practice session on {formatDate(practice.date)}?
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeCard;
