import React from 'react';
import KnockoutStage from './KnockoutStage';
import RoundRobinStandings from './RoundRobinStandings';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface TournamentBracketProps {
  tournamentId: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournamentId }) => {
  const { data: tournamentData, isLoading } = useQuery({
    queryKey: ['tournament-format', tournamentId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/tournaments/${tournamentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    enabled: !!tournamentId,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tournamentData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No tournament data available</p>
      </div>
    );
  }

  const format = tournamentData.format;

  if (format === 'KNOCKOUT') {
    return <KnockoutStage tournamentId={tournamentId} />;
  } else if (format === 'ROUND_ROBIN') {
    return <RoundRobinStandings tournamentId={tournamentId} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-500">Unknown tournament format: {format}</p>
    </div>
  );
};

export default TournamentBracket;
