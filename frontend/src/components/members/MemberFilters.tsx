import React from 'react';

interface MemberFiltersProps {
  skillLevel?: string;
  status?: string;
  onSkillLevelChange: (level: string) => void;
  onStatusChange: (status: string) => void;
  onReset: () => void;
}

const MemberFilters: React.FC<MemberFiltersProps> = ({
  skillLevel,
  status,
  onSkillLevelChange,
  onStatusChange,
  onReset,
}) => {
  const isFiltered = skillLevel || status;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Skill Level
          </label>
          <select
            value={skillLevel || ''}
            onChange={(e) => onSkillLevelChange(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>

        <div className="w-full md:w-auto">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status || ''}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="w-full md:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 mt-auto"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default MemberFilters;
