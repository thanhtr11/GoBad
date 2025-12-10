import React, { useState } from 'react';
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

interface MemberCardProps {
  member: Member;
  onUpdated?: () => void;
  isMobile?: boolean;
  canManage?: boolean;
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => Promise<void> | void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onUpdated,
  isMobile = false,
  canManage = false,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(member);
      }
      setShowDeleteConfirm(false);
      onUpdated?.();
    } catch (error) {
      console.error('Failed to delete member:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const skillLevelColor = {
    BEGINNER: 'bg-yellow-100 text-yellow-800',
    INTERMEDIATE: 'bg-blue-100 text-blue-800',
    ADVANCED: 'bg-green-100 text-green-800',
  };

  const statusColor = {
    ACTIVE: 'text-green-600',
    INACTIVE: 'text-gray-600',
    EXPIRED: 'text-red-600',
  };

  if (isMobile) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{member.name}</p>
          <p className="text-sm text-gray-500">{member.email || member.phone || 'No contact'}</p>
          <div className="flex gap-2 mt-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                skillLevelColor[member.skillLevel]
              }`}
            >
              {member.skillLevel}
            </span>
            <span className={`text-xs px-2 py-1 font-semibold ${statusColor[member.status]}`}>
              {member.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-800"
            title="Delete member"
            disabled={!canManage}
          >
            ✕
          </button>
          {canManage && (
            <button
              onClick={() => onEdit?.(member)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit member"
            >
              ✎
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <h3 className="text-lg font-bold text-gray-900">Delete Member</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete {member.name}?
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
  }

  // Desktop card view
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
          <p className="text-sm text-gray-500">{member.type}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(member)}
              className="text-blue-600 hover:text-blue-800 text-lg"
              title="Edit member"
            >
              ✎
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-800 text-xl"
              title="Delete member"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {member.email && (
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Email:</span> {member.email}
          </p>
        )}
        {member.phone && (
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Phone:</span> {member.phone}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Skill Level</p>
          <span
            className={`text-xs px-3 py-1 rounded-full ${skillLevelColor[member.skillLevel]}`}
          >
            {member.skillLevel}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
          <span className={`text-xs font-semibold ${statusColor[member.status]}`}>
            {member.status}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Membership</p>
          <p className="text-sm text-gray-900">{member.membershipTier}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
          <p className="text-sm text-gray-900">{member.type}</p>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900">Delete Member</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to delete {member.name}?
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

export default MemberCard;
