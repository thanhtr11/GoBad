import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useClub } from '../context/ClubContext';
import { useAuth } from '../context/AuthContext';
import MemberList from '../components/members/MemberList';
import MemberFilters from '../components/members/MemberFilters';
import GuestCheckInForm from '../components/members/GuestCheckInForm';
import AddMemberModal from '../components/members/AddMemberModal';
import EditMemberModal from '../components/members/EditMemberModal';
import { api } from '../utils/api';

interface Club {
  id: string;
  name: string;
}

const MembersPage: React.FC = () => {
  const { selectedClubId, setSelectedClubId } = useClub();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [status, setStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGuestCheckIn, setShowGuestCheckIn] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER';

  // Fetch clubs
  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const response = await api.get('/clubs');
      return response.data?.clubs || [];
    },
  });

  const handleResetFilters = () => {
    setSkillLevel('');
    setStatus('');
    setSearchTerm('');
  };

  const handleSuccess = () => {
    setShowAddModal(false);
    setShowGuestCheckIn(false);
    // Refetch members would happen via useQuery key changes
    queryClient.invalidateQueries({ queryKey: ['members', selectedClubId] });
  };

  const handleDelete = async (member: any) => {
    await api.delete(`/members/${member.id}`);
    queryClient.invalidateQueries({ queryKey: ['members', selectedClubId] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Member Management</h1>
          <p className="text-gray-600">
            Manage your club members, track attendance, and check in guests
          </p>
        </div>

        {/* Club Name */}
        {selectedClubId && clubs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <span className="text-sm font-medium text-gray-500">Club: </span>
            <span className="text-lg font-semibold text-gray-900">
              {clubs.find((club: Club) => club.id === selectedClubId)?.name || 'Unknown Club'}
            </span>
          </div>
        )}

        {selectedClubId && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!canManage}
              >
                + Add Member
              </button>
              <button
                onClick={() => setShowGuestCheckIn(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                👤 Check In Guest
              </button>
            </div>

            {/* Add Member Modal */}
            {showAddModal && selectedClubId && (
              <AddMemberModal
                clubId={selectedClubId}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleSuccess}
              />
            )}

            {/* Edit Member Modal */}
            {editingMember && (
              <EditMemberModal
                member={editingMember}
                onClose={() => setEditingMember(null)}
                onSaved={() => {
                  setEditingMember(null);
                  queryClient.invalidateQueries({ queryKey: ['members', selectedClubId] });
                }}
              />
            )}

            {/* Guest Check-In Form Modal */}
            {showGuestCheckIn && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                <div className="bg-white rounded-lg w-full max-w-md">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Check In Guest</h2>
                    <button
                      onClick={() => setShowGuestCheckIn(false)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6">
                    <GuestCheckInForm
                      clubId={selectedClubId}
                      onSuccess={handleSuccess}
                      onCancel={() => setShowGuestCheckIn(false)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search members by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="mb-6">
              <MemberFilters
                skillLevel={skillLevel}
                status={status}
                onSkillLevelChange={setSkillLevel}
                onStatusChange={setStatus}
                onReset={handleResetFilters}
              />
            </div>

            {/* Member List */}
            <MemberList
              clubId={selectedClubId}
              searchTerm={searchTerm}
              skillLevel={skillLevel}
              status={status}
              canManage={!!canManage}
              onEdit={(member) => setEditingMember(member)}
              onDelete={handleDelete}
            />
          </>
        )}

        {!selectedClubId && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Select a club to view and manage members</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;
