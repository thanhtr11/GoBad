import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';
import { api } from '../utils/api';

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

interface User {
  id: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';
  name?: string;
  phone?: string;
  skillLevel?: string;
  createdAt: string;
}

const Settings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { setSelectedClubId } = useClub();
  const [activeTab, setActiveTab] = useState<'clubs' | 'users' | 'system'>('clubs');
  const [showNewClubForm, setShowNewClubForm] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');

  // User management state
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'SUPER_ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST'>('MEMBER');
  const [newUserSkillLevel, setNewUserSkillLevel] = useState('');

  // Password reset modal state
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null);
  const [passwordResetUsername, setPasswordResetUsername] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Manager assignment state
  const [selectedClubForManager, setSelectedClubForManager] = useState<string | null>(null);
  const [selectedManagerUser, setSelectedManagerUser] = useState<string | null>(null);
  const [clubManagers, setClubManagers] = useState<Record<string, any[]>>({});

  // Fetch clubs
  const { data: clubs = [], refetch: refetchClubs } = useQuery<Club[]>({
    queryKey: ['clubs-settings'],
    queryFn: async () => {
      const response = await api.get('/clubs');
      return response.data.clubs || [];
    },
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users || [];
    },
  });

  // Auto-fetch managers for all clubs when clubs load
  useEffect(() => {
    if (clubs.length > 0) {
      clubs.forEach((club) => {
        if (!clubManagers[club.id]) {
          fetchClubManagers(club.id);
        }
      });
    }
  }, [clubs]);

  // Create club mutation
  const createClubMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/clubs', {
        name: newClubName,
        description: newClubDesc,
      });
      return response.data;
    },
    onSuccess: () => {
      setNewClubName('');
      setNewClubDesc('');
      setShowNewClubForm(false);
      refetchClubs();
    },
  });

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClubMutation.mutateAsync();
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/users', {
        username: newUsername,
        email: newUserEmail || undefined,
        password: newPassword,
        name: newUserName || undefined,
        phone: newUserPhone || undefined,
        skillLevel: newUserSkillLevel || undefined,
        role: newUserRole,
      });
      return response.data;
    },
    onSuccess: () => {
      setNewUsername('');
      setNewPassword('');
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPhone('');
      setNewUserSkillLevel('');
      setNewUserRole('MEMBER');
      setShowAddUserForm(false);
      refetchUsers();
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to create user');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      const response = await api.put(`/users/${editingUser.id}`, {
        email: newUserEmail || undefined,
        name: newUserName || undefined,
        phone: newUserPhone || undefined,
        skillLevel: newUserSkillLevel || undefined,
        role: newUserRole,
      });
      return response.data;
    },
    onSuccess: () => {
      setEditingUser(null);
      setShowEditUserForm(false);
      setNewUsername('');
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPhone('');
      setNewUserSkillLevel('');
      setNewUserRole('MEMBER');
      refetchUsers();
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to update user');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await api.post(`/users/${userId}/reset-password`, { newPassword });
      return response.data;
    },
    onSuccess: (data: any) => {
      alert(data.message || 'Password reset successfully');
      setShowPasswordResetModal(false);
      setPasswordResetUserId(null);
      setPasswordResetUsername('');
      setResetPassword('');
      setPasswordError('');
      refetchUsers();
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to reset password');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      refetchUsers();
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to delete user');
    },
  });

  // Assign manager mutation
  const assignManagerMutation = useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const response = await api.post(`/clubs/${clubId}/managers`, { userId });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      alert('Manager assigned successfully');
      setSelectedManagerUser(null);
      // Refetch club managers
      fetchClubManagers(variables.clubId);
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to assign manager');
    },
  });

  // Remove manager mutation
  const removeManagerMutation = useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const response = await api.delete(`/clubs/${clubId}/managers/${userId}`);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      alert('Manager removed successfully');
      // Refetch club managers
      fetchClubManagers(variables.clubId);
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to remove manager');
    },
  });

  // Fetch club managers
  const fetchClubManagers = async (clubId: string) => {
    try {
      const response = await api.get(`/clubs/${clubId}/managers`);
      setClubManagers((prev) => ({
        ...prev,
        [clubId]: response.data.managers || [],
      }));
    } catch (error: any) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      alert('Username is required');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    await createUserMutation.mutateAsync();
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewUserEmail(user.email || '');
    setNewUserName(user.name || '');
    setNewUserPhone(user.phone || '');
    setNewUserSkillLevel(user.skillLevel || '');
    setNewUserRole(user.role);
    setShowEditUserForm(true);
    setShowAddUserForm(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserMutation.mutateAsync();
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user @${username}? This action cannot be undone.`)) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    setPasswordResetUserId(userId);
    setPasswordResetUsername(username);
    setResetPassword('');
    setPasswordError('');
    setShowPasswordResetModal(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!resetPassword) {
      setPasswordError('Password is required');
      return;
    }

    if (resetPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (!passwordResetUserId) return;

    await resetPasswordMutation.mutateAsync({
      userId: passwordResetUserId,
      newPassword: resetPassword,
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-700';
      case 'MANAGER':
        return 'bg-yellow-100 text-yellow-700';
      case 'MEMBER':
        return 'bg-blue-100 text-blue-700';
      case 'GUEST':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your clubs, users, and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          {(['clubs', 'users', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'clubs' && '🏢 Clubs'}
              {tab === 'users' && '👤 Users'}
              {tab === 'system' && '⚙️ System'}
            </button>
          ))}
        </div>

        {/* Clubs Tab */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            {/* New Club Form */}
            {showNewClubForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Club</h3>
                <form onSubmit={handleCreateClub} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Club Name *
                    </label>
                    <input
                      type="text"
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      placeholder="Enter club name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newClubDesc}
                      onChange={(e) => setNewClubDesc(e.target.value)}
                      placeholder="Optional description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createClubMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createClubMutation.isPending ? 'Creating...' : 'Create Club'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewClubForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Clubs List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Your Clubs</h3>
                <button
                  onClick={() => setShowNewClubForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + New Club
                </button>
              </div>

              {clubs.map((club) => (
                <div key={club.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{club.name}</h4>
                      {club.location && (
                        <p className="text-gray-600 mt-1">{club.location}</p>
                      )}
                      {club.email && (
                        <p className="text-sm text-gray-500 mt-1">
                          Contact: {club.email}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Members: {club._count?.members || 0}
                      </p>
                    </div>
                    <a
                      href="/members"
                      onClick={(e) => {
                        setSelectedClubId(club.id);
                        // Still allow navigation to /members if not already there
                      }}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                    >
                      Manage Members →
                    </a>
                  </div>

                  {/* Manager Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">👔 Managers</h5>
                    
                    {/* Current Managers */}
                    <div className="mb-3 space-y-2">
                      {clubManagers[club.id]?.length ? (
                        clubManagers[club.id].map((manager) => (
                          <div key={manager.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <span className="text-gray-700">{manager.user.name || manager.user.username}</span>
                            <button
                              onClick={() => removeManagerMutation.mutate({ clubId: club.id, userId: manager.userId })}
                              disabled={removeManagerMutation.isPending}
                              className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No managers assigned</p>
                      )}
                    </div>

                    {/* Add Manager */}
                    {selectedClubForManager === club.id ? (
                      <div className="flex gap-2">
                        <select
                          value={selectedManagerUser || ''}
                          onChange={(e) => setSelectedManagerUser(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select a manager user...</option>
                          {users
                            .filter((u) => u.role === 'MANAGER' || u.role === 'SUPER_ADMIN')
                            .filter((u) => !clubManagers[club.id]?.some((m) => m.userId === u.id))
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name || u.username}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => {
                            if (selectedManagerUser) {
                              assignManagerMutation.mutate({ clubId: club.id, userId: selectedManagerUser });
                            }
                          }}
                          disabled={assignManagerMutation.isPending || !selectedManagerUser}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClubForManager(null);
                            setSelectedManagerUser(null);
                          }}
                          className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedClubForManager(club.id);
                          fetchClubManagers(club.id);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add Manager
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {clubs.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">No clubs yet</p>
                  <button
                    onClick={() => setShowNewClubForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Your First Club
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Check if user has permission */}
            {currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'MANAGER' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900">View-only mode: You need SUPER_ADMIN or MANAGER role to manage users.</p>
              </div>
            )}

            {/* Users Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
              <div className="space-y-3 text-gray-600 mb-6">
                <p>👤 User management is now separate from club member management.</p>
                <p>📌 <strong>Users</strong> are system accounts for authentication and login.</p>
                <p>👥 <strong>Members</strong> are users assigned to specific clubs and shown in the Members page.</p>
              </div>
            </div>

            {/* Add/Edit User Form */}
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
              <>
                {(showAddUserForm || showEditUserForm) && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {showEditUserForm ? 'Edit User' : 'Create New User'}
                    </h3>
                    <form onSubmit={showEditUserForm ? handleUpdateUser : handleCreateUser} className="space-y-4">
                      {!showEditUserForm && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Username *
                            </label>
                            <input
                              type="text"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              placeholder="Enter username"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Password * (minimum 8 characters)
                            </label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter password"
                              required
                              minLength={8}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="Enter email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Enter full name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={newUserPhone}
                            onChange={(e) => setNewUserPhone(e.target.value)}
                            placeholder="Enter phone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skill Level
                          </label>
                          <input
                            type="text"
                            value={newUserSkillLevel}
                            onChange={(e) => setNewUserSkillLevel(e.target.value)}
                            placeholder="e.g., BEGINNER, INTERMEDIATE, ADVANCED"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role *
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="MEMBER">MEMBER</option>
                          <option value="GUEST">GUEST</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={showEditUserForm ? updateUserMutation.isPending : createUserMutation.isPending}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {showEditUserForm ? 
                            (updateUserMutation.isPending ? 'Updating...' : 'Update User') :
                            (createUserMutation.isPending ? 'Creating...' : 'Create User')
                          }
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddUserForm(false);
                            setShowEditUserForm(false);
                            setEditingUser(null);
                            setNewUsername('');
                            setNewPassword('');
                            setNewUserEmail('');
                            setNewUserName('');
                            setNewUserPhone('');
                            setNewUserSkillLevel('');
                            setNewUserRole('MEMBER');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Users ({users.length})</h3>
                {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && !showAddUserForm && !showEditUserForm && (
                  <button
                    onClick={() => {
                      setShowAddUserForm(true);
                      setShowEditUserForm(false);
                      setEditingUser(null);
                      setNewUsername('');
                      setNewPassword('');
                      setNewUserEmail('');
                      setNewUserName('');
                      setNewUserPhone('');
                      setNewUserSkillLevel('');
                      setNewUserRole('MEMBER');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Add User
                  </button>
                )}
              </div>
              
              {usersLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Username</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Role</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Skill Level</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Joined</th>
                        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className="font-medium text-gray-900">@{u.username}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.name || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {u.skillLevel ? (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                {u.skillLevel}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
                            <td className="px-4 py-3 text-sm space-x-2">
                              <button
                                onClick={() => handleEditUser(u)}
                                title="Edit user"
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-yellow-100 text-yellow-700 hover:text-yellow-800"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleResetPassword(u.id, u.username)}
                                title="Reset password"
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-blue-100 text-blue-700 hover:text-blue-800"
                              >
                                🔑
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                title="Delete user"
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-100 text-red-700 hover:text-red-800"
                              >
                                🗑️
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User Roles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">SUPER_ADMIN</span>
                  <p className="text-gray-700">Full system access, can manage all clubs and users</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">MANAGER</span>
                  <p className="text-gray-700">Can manage specific clubs and their members</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">MEMBER</span>
                  <p className="text-gray-700">Can participate in club activities</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">GUEST</span>
                  <p className="text-gray-700">Limited access, can view club information</p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
              <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                <li>New users register via the Login page</li>
                <li>Users are created with the MEMBER role by default</li>
                <li>Managers add users to their clubs via the Members page</li>
                <li>Users become ClubMembers once added to a club</li>
                <li>A user can be a member of multiple clubs</li>
                <li>Each club membership has its own status (ACTIVE, INACTIVE, EXPIRED)</li>
              </ol>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="text-gray-900 font-medium">@{currentUser?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="text-gray-900 font-medium">Administrator</p>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-gray-900">Backend API</span>
                  <span className="text-green-600 font-medium">✓ Online</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-gray-900">Database</span>
                  <span className="text-green-600 font-medium">✓ Connected</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-gray-900">Authentication</span>
                  <span className="text-green-600 font-medium">✓ Active</span>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Version Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>GoBad Application v1.0.0</p>
                <p>Last Updated: December 8, 2025</p>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password for @{passwordResetUsername}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password (minimum 8 characters)
                  </label>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value);
                      if (e.target.value.length >= 8) {
                        setPasswordError('');
                      }
                    }}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {resetPassword && (
                    <p className={`text-sm mt-1 ${resetPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                      {resetPassword.length} characters {resetPassword.length >= 8 ? '✓' : '(need at least 8)'}
                    </p>
                  )}
                </div>

                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {passwordError}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  <p className="font-semibold mb-1">Password Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Minimum 8 characters</li>
                    <li>Can contain uppercase, lowercase, numbers, and symbols</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={handleConfirmPasswordReset}
                  disabled={resetPasswordMutation.isPending || resetPassword.length < 8}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setPasswordResetUserId(null);
                    setPasswordResetUsername('');
                    setResetPassword('');
                    setPasswordError('');
                  }}
                  disabled={resetPasswordMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
