import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface Club {
  id: string;
  name: string;
  location?: string;
  contactName?: string;
  email?: string;
  createdAt: string;
  _count?: {
    members: number;
    practices: number;
    finances: number;
  };
}

interface ClubCardProps {
  club: Club;
  onEdit: (club: Club) => void;
  onSelect: () => void;
  refetchClubs: () => void;
  isMobile?: boolean;
}

export default function ClubCard({
  club,
  onEdit,
  onSelect,
  refetchClubs,
  isMobile = false,
}: ClubCardProps) {
  const { token, user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch club stats
  const { data: stats } = useQuery({
    queryKey: ['clubStats', club.id],
    queryFn: async () => {
      const response = await axios.get(`${"/api"}/clubs/${club.id}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.stats;
    },
    enabled: !!token,
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${"/api"}/clubs/${club.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteConfirm(false);
      refetchClubs();
    } catch (error) {
      console.error('Failed to delete club:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Mobile list view
  if (isMobile) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <button onClick={onSelect} className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900">{club.name}</h3>
          <p className="text-sm text-gray-500">{club.location || 'No location'}</p>
          <div className="mt-2 flex gap-4 text-xs text-gray-600">
            <span>👥 {stats?.memberCount || 0} members</span>
            <span>🏸 {stats?.practiceCount || 0} practices</span>
          </div>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(club)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            Edit
          </button>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="rounded-lg bg-white p-6">
              <h3 className="font-bold text-gray-900">Delete Club?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete "{club.name}" and all its data?
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop card view
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <button onClick={onSelect} className="w-full text-left">
        <h3 className="text-lg font-semibold text-gray-900">{club.name}</h3>
        {club.location && <p className="text-sm text-gray-600">{club.location}</p>}
        {club.email && <p className="text-sm text-gray-600">{club.email}</p>}
      </button>

      {/* Stats */}
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.memberCount}</p>
            <p className="text-xs text-gray-600">Members</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.practiceCount}</p>
            <p className="text-xs text-gray-600">Practices</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">${stats.balance.toFixed(2)}</p>
            <p className="text-xs text-gray-600">Balance</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(club)}
          className="flex-1 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 active:bg-blue-300"
        >
          Edit
        </button>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 active:bg-red-300"
          >
            Delete
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="rounded-lg bg-white p-6">
            <h3 className="font-bold text-gray-900">Delete Club?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete "{club.name}" and all its data? This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
