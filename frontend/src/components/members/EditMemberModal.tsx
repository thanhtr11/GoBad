import React, { useState } from 'react';
import { api } from '../../utils/api';

interface Member {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  type: 'MEMBER' | 'GUEST';
  user?: {
    username?: string;
    email?: string;
  };
}

interface EditMemberModalProps {
  member: Member;
  onClose: () => void;
  onSaved?: () => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose, onSaved }) => {
  const [status, setStatus] = useState<Member['status']>(member.status);
  const [type, setType] = useState<Member['type']>(member.type);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/members/${member.id}`, { status, type });
      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to update member:', error);
      alert(error.response?.data?.error || 'Failed to update member');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Edit Member</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <p className="text-sm text-gray-700 font-medium">{member.name}</p>
            {member.user?.username && (
              <p className="text-xs text-gray-500">@{member.user.username}</p>
            )}
            {member.user?.email && (
              <p className="text-xs text-gray-500">{member.user.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Member['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Member Type</label>
            <div className="flex gap-4">
              {(['MEMBER', 'GUEST'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="member-type"
                    value={t}
                    checked={type === t}
                    onChange={(e) => setType(e.target.value as Member['type'])}
                    className="text-blue-600"
                  />
                  <span className="text-gray-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;
