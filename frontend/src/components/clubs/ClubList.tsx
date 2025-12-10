import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ClubCard from './ClubCard';
import ClubForm from './ClubForm';
import { useAuth } from '../../context/AuthContext';

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

interface ClubListProps {
  onSelectClub?: (club: Club) => void;
  onClubUpdated?: () => void;
}

export default function ClubList({ onSelectClub, onClubUpdated }: ClubListProps) {
  const { user, token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: clubs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clubs', user?.id],
    queryFn: async () => {
      const response = await axios.get(`${"/api"}/clubs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.clubs as Club[];
    },
    enabled: !!token && !!user,
  });

  const handleClubCreated = () => {
    setShowForm(false);
    setEditingClub(null);
    refetch();
    onClubUpdated?.();
  };

  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClub(null);
  };

  const filteredClubs = clubs?.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Error loading clubs: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Clubs</h2>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => {
              setEditingClub(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 active:bg-blue-800"
          >
            + Create Club
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search clubs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <ClubForm
              club={editingClub}
              onClose={handleCloseForm}
              onSuccess={handleClubCreated}
            />
          </div>
        </div>
      )}

      {/* Clubs Grid (Desktop) / List (Mobile) */}
      {filteredClubs && filteredClubs.length > 0 ? (
        <>
          {/* Desktop Grid */}
          <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onEdit={handleEditClub}
                onSelect={() => onSelectClub?.(club)}
                refetchClubs={refetch}
              />
            ))}
          </div>

          {/* Mobile List */}
          <div className="space-y-3 md:hidden">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onEdit={handleEditClub}
                onSelect={() => onSelectClub?.(club)}
                refetchClubs={refetch}
                isMobile
              />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clubs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'ADMIN' ? 'Create a new club to get started.' : 'You are not a member of any clubs yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
