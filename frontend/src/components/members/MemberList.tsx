import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MemberCard from './MemberCard';
import { api } from '../../utils/api';

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  type: 'MEMBER' | 'GUEST';
  membershipTier: 'ADULT' | 'JUNIOR' | 'FAMILY';
  club?: { name: string };
}

interface MemberListProps {
  clubId?: string;
  searchTerm?: string;
  skillLevel?: string;
  status?: string;
  onRefresh?: () => void;
  canManage?: boolean;
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => Promise<void> | void;
}

const MemberList: React.FC<MemberListProps> = ({
  clubId,
  searchTerm = '',
  skillLevel,
  status,
  onRefresh,
  canManage = false,
  onEdit,
  onDelete,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Build query parameters
  const params = new URLSearchParams();
  if (clubId) params.append('clubId', clubId);
  if (searchTerm) params.append('searchTerm', searchTerm);
  if (skillLevel) params.append('skillLevel', skillLevel);
  if (status) params.append('status', status);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['members', clubId, searchTerm, skillLevel, status],
    queryFn: async () => {
      const response = await api.get(`/members?${params.toString()}`);
      const raw = response.data?.members ?? response.data ?? [];
      return raw.map((m: any) => ({
        ...m,
        name: m.name ?? m.user?.name ?? m.user?.username ?? 'Unknown',
        email: m.email ?? m.user?.email,
        phone: m.phone ?? m.user?.phone,
        skillLevel: m.skillLevel ?? m.user?.skillLevel ?? 'INTERMEDIATE',
        membershipTier: m.membershipTier ?? m.user?.membershipTier ?? 'ADULT',
      }));
    },
  });

  React.useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load members. Please try again.</p>
      </div>
    );
  }

  const members = (data || []) as Member[];

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View toggle (desktop only) */}
      <div className="hidden md:flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">{members.length} member(s)</p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded ${
              viewMode === 'grid'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Grid/List view */}
      <div
        className={
          viewMode === 'grid'
            ? 'hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }
      >
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onUpdated={() => refetch()}
            canManage={canManage}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Mobile list view (always shown on mobile) */}
      <div className="md:hidden space-y-2">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onUpdated={() => refetch()}
            isMobile
            canManage={canManage}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default MemberList;
