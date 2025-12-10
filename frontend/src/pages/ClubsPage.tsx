import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import AddMemberModal from '../components/members/AddMemberModal';

interface Club {
  id: string;
  name: string;
  location?: string;
  contactName?: string;
  email?: string;
  description?: string;
  _count?: {
    members: number;
    practices: number;
    finances: number;
  };
}

interface ClubMember {
  id: string;
  email: string;
  name: string;
  skillLevel: string;
  joinedAt: string;
}

export default function ClubsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const clubIdParam = searchParams.get('id');
  const showNew = searchParams.get('new') === 'true';
  
  const [selectedClubId, setSelectedClubId] = useState<string>(clubIdParam || '');
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');
  const [showNewClubForm, setShowNewClubForm] = useState(showNew);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubLocation, setNewClubLocation] = useState('');
  const [newClubEmail, setNewClubEmail] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');

  // Update selected club when URL param changes
  useEffect(() => {
    if (clubIdParam) {
      setSelectedClubId(clubIdParam);
      setShowNewClubForm(false);
    } else if (showNew) {
      setShowNewClubForm(true);
      setSelectedClubId('');
    }
  }, [clubIdParam, showNew]);

  // Fetch clubs
  const { data: clubs = [], refetch: refetchClubs } = useQuery<Club[]>({
    queryKey: ['clubs-management'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/clubs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch clubs');
      const data = await response.json();
      return data.clubs || [];
    },
  });

  // Fetch selected club details
  const { data: selectedClub } = useQuery<Club>({
    queryKey: ['club', selectedClubId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/clubs/${selectedClubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch club');
      return response.json();
    },
    enabled: !!selectedClubId,
  });

  // Fetch club members
  const { data: members = [] } = useQuery<ClubMember[]>({
    queryKey: ['club-members', selectedClubId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/clubs/${selectedClubId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!selectedClubId && activeTab === 'members',
  });

  // Create club mutation
  const createClubMutation = useMutation({
    mutationFn: async (clubData: any) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(clubData),
      });
      if (!response.ok) throw new Error('Failed to create club');
      return response.json();
    },
    onSuccess: (newClub) => {
      refetchClubs();
      setShowNewClubForm(false);
      setNewClubName('');
      setNewClubLocation('');
      setNewClubEmail('');
      setNewClubDesc('');
      setSelectedClubId(newClub.id);
      setSearchParams({ id: newClub.id });
    },
  });

  // Delete club mutation
  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/clubs/${clubId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete club');
    },
    onSuccess: () => {
      refetchClubs();
      setSelectedClubId('');
      setSearchParams({});
    },
  });

  const handleCreateClub = () => {
    if (!newClubName.trim()) return;
    createClubMutation.mutate({
      name: newClubName,
      location: newClubLocation,
      email: newClubEmail,
      description: newClubDesc,
    });
  };

  const handleSelectClub = (clubId: string) => {
    setSelectedClubId(clubId);
    setSearchParams({ id: clubId });
    setShowNewClubForm(false);
    setActiveTab('info');
  };

  const handleDeleteClub = (clubId: string) => {
    if (confirm('Are you sure you want to delete this club?')) {
      deleteClubMutation.mutate(clubId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Club Management</h1>
          <p className="mt-2 text-gray-600">
            Select a club to view and manage its details, members, and settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Clubs List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Clubs</h2>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                  <button
                    onClick={() => {
                      setShowNewClubForm(true);
                      setSelectedClubId('');
                      setSearchParams({ new: 'true' });
                    }}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleSelectClub(club.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition ${
                      selectedClubId === club.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedClubId === club.id ? 'bg-indigo-600' : 'bg-gray-400'}`}></div>
                      <span className="truncate">{club.name}</span>
                    </div>
                  </button>
                ))}
                {clubs.length === 0 && !showNewClubForm && (
                  <p className="text-sm text-gray-500 italic py-2">No clubs available</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {showNewClubForm ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Club</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                    <input
                      type="text"
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter club name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={newClubLocation}
                      onChange={(e) => setNewClubLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newClubEmail}
                      onChange={(e) => setNewClubEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="contact@club.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newClubDesc}
                      onChange={(e) => setNewClubDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter club description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateClub}
                      disabled={!newClubName.trim() || createClubMutation.isPending}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createClubMutation.isPending ? 'Creating...' : 'Create Club'}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewClubForm(false);
                        setSearchParams({});
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedClubId && selectedClub ? (
              <div className="bg-white rounded-lg shadow-sm">
                {/* Club Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedClub.name}</h2>
                      {selectedClub.location && (
                        <p className="text-sm text-gray-600 mt-1">📍 {selectedClub.location}</p>
                      )}
                    </div>
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                      <button
                        onClick={() => handleDeleteClub(selectedClubId)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex gap-4 px-6">
                    <button
                      onClick={() => setActiveTab('info')}
                      className={`py-3 border-b-2 font-medium text-sm transition ${
                        activeTab === 'info'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Club Info
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`py-3 border-b-2 font-medium text-sm transition ${
                        activeTab === 'members'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Members ({selectedClub._count?.members || 0})
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'info' && (
                    <div className="space-y-4">
                      {selectedClub.email && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <p className="text-gray-900">{selectedClub.email}</p>
                        </div>
                      )}
                      {selectedClub.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Description</label>
                          <p className="text-gray-900">{selectedClub.description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Members</p>
                          <p className="text-2xl font-bold text-indigo-600">{selectedClub._count?.members || 0}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Practices</p>
                          <p className="text-2xl font-bold text-green-600">{selectedClub._count?.practices || 0}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Finances</p>
                          <p className="text-2xl font-bold text-purple-600">{selectedClub._count?.finances || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'members' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Club Members</h3>
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          + Add Member
                        </button>
                      </div>
                      {members.length === 0 ? (
                        <p className="text-gray-500 italic">No members in this club yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <div>
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-600">{member.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">{member.skillLevel}</p>
                                <p className="text-xs text-gray-500">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Club Selected</h3>
                <p className="text-gray-600">Select a club from the list or create a new one to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && selectedClubId && (
        <AddMemberModal
          clubId={selectedClubId}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={() => {
            setShowAddMemberModal(false);
            // Refetch members
          }}
        />
      )}
    </div>
  );
}
