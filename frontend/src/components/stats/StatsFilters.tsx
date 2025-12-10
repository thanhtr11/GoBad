import React, { useState } from 'react';

export interface StatsFilterOptions {
  startDate?: string;
  endDate?: string;
  clubId?: string;
  minMatches?: number;
  sortBy?: 'wins' | 'winRate' | 'matches';
  skillLevel?: 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

interface StatsFiltersProps {
  onFilter: (filters: StatsFilterOptions) => void;
  clubs?: Array<{ id: string; name: string }>;
  showSkillFilter?: boolean;
  showMinMatchesFilter?: boolean;
  showSortOptions?: boolean;
}

const StatsFilters: React.FC<StatsFiltersProps> = ({
  onFilter,
  clubs = [],
  showSkillFilter = false,
  showMinMatchesFilter = true,
  showSortOptions = true,
}) => {
  const [filters, setFilters] = useState<StatsFilterOptions>({
    startDate: undefined,
    endDate: undefined,
    clubId: clubs.length > 0 ? clubs[0].id : undefined,
    minMatches: 0,
    sortBy: 'wins',
    skillLevel: 'ALL',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const updatedFilters = { ...filters, [field]: value || undefined };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  const handleClubChange = (clubId: string) => {
    const updatedFilters = { ...filters, clubId };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  const handleMinMatchesChange = (value: string) => {
    const minMatches = value ? parseInt(value, 10) : 0;
    const updatedFilters = { ...filters, minMatches };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  const handleSortChange = (sortBy: 'wins' | 'winRate' | 'matches') => {
    const updatedFilters = { ...filters, sortBy };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  const handleSkillLevelChange = (skillLevel: 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') => {
    const updatedFilters = { ...filters, skillLevel };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  const handleReset = () => {
    const defaultFilters: StatsFilterOptions = {
      startDate: undefined,
      endDate: undefined,
      clubId: clubs.length > 0 ? clubs[0].id : undefined,
      minMatches: 0,
      sortBy: 'wins',
      skillLevel: 'ALL',
    };
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  };

  // Count active filters
  const activeFilterCount = [
    filters.startDate,
    filters.endDate,
    filters.minMatches && filters.minMatches > 0,
    filters.skillLevel !== 'ALL',
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform bg-blue-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Club Selector */}
          {clubs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Club</label>
              <select
                value={filters.clubId || ''}
                onChange={(e) => handleClubChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Min Matches Filter */}
          {showMinMatchesFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Matches Played
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minMatches || 0}
                onChange={(e) => handleMinMatchesChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Skill Level Filter */}
          {showSkillFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
              <div className="space-y-2">
                {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="skillLevel"
                      value={level}
                      checked={filters.skillLevel === level}
                      onChange={() =>
                        handleSkillLevelChange(
                          level as 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
                        )
                      }
                      className="rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sort Options */}
          {showSortOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'wins', label: 'Wins' },
                  { value: 'winRate', label: 'Win Rate' },
                  { value: 'matches', label: 'Matches' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleSortChange(value as 'wins' | 'winRate' | 'matches')}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      filters.sortBy === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsFilters;
