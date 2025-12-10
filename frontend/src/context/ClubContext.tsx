import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useQuery } from '@tanstack/react-query';

interface Club {
  id: string;
  name: string;
}

interface ClubContextType {
  selectedClubId: string | null;
  setSelectedClubId: (clubId: string | null) => void;
  clubs: Club[];
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedClubId, setSelectedClubIdState] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem('selectedClubId');
  });

  // Fetch clubs
  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs-context'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/clubs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch clubs');
      const data = await response.json();
      return data.clubs || [];
    },
    enabled: isAuthenticated,
  });

  const setSelectedClubId = (clubId: string | null) => {
    setSelectedClubIdState(clubId);
    if (clubId) {
      localStorage.setItem('selectedClubId', clubId);
    } else {
      localStorage.removeItem('selectedClubId');
    }
  };

  // Clear selectedClubId when user logs out (but not during initial load)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && selectedClubId) {
      setSelectedClubIdState(null);
      localStorage.removeItem('selectedClubId');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <ClubContext.Provider value={{ selectedClubId, setSelectedClubId, clubs }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
