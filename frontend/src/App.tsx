import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClubProvider, useClub } from './context/ClubContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useState, useRef, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import ClubsPage from './pages/ClubsPage';
import MembersPage from './pages/MembersPage';
import PracticesPage from './pages/PracticesPage';
import MatchesPage from './pages/MatchesPage';
import StatsPage from './pages/StatsPage';
import FinancesPage from './pages/FinancesPage';
import Settings from './pages/Settings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Clear all cached data when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.clear();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <NavBar />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs"
          element={
            <ProtectedRoute>
              <ClubsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practices"
          element={
            <ProtectedRoute>
              <PracticesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <MatchesPage />
            </ProtectedRoute>
          }
        />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finances"
        element={
          <ProtectedRoute>
            <FinancesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Redirect unmatched routes */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
    </>
  );
}

function NavBar() {
  const { user, logout } = useAuth();
  const { selectedClubId, setSelectedClubId, clubs } = useClub();

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-indigo-800 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 hover:opacity-90 transition">
            <span className="text-3xl">🏸</span>
            <span className="text-2xl font-bold text-white">GoBad</span>
          </a>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="/"
              className="flex items-center gap-2 text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <a
              href="/members"
              className="flex items-center gap-2 text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Members
            </a>
            <a
              href="/practices"
              className="flex items-center gap-2 text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Practices
            </a>
            <a
              href="/matches"
              className="flex items-center gap-2 text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Matches
            </a>
            <a
              href="/stats"
              className="flex items-center gap-2 text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Stats
            </a>
            <a
              href="/finances"
              className="flex items-center gap-2 text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Finances
            </a>
          </div>

          {/* User Menu */}
          <UserMenu user={user} logout={logout} />
        </div>
      </div>
    </nav>
  );
}

function UserMenu({ user, logout }: { user: any; logout: () => void }) {
  const { selectedClubId, setSelectedClubId } = useClub();
  const [isOpen, setIsOpen] = useState(false);
  const [showClubsSubmenu, setShowClubsSubmenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5983/api';

  // Fetch clubs
  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs-menu'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');
      const response = await fetch(`${apiUrl}/clubs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch clubs');
      const data = await response.json();
      return data.clubs || [];
    },
    enabled: isOpen && !!user,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowClubsSubmenu(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-90 transition text-white"
      >
        <div className="w-8 h-8 rounded-full bg-white bg-opacity-30 text-white flex items-center justify-center text-sm font-semibold">
          {getInitials(user?.username || 'U')}
        </div>
        <span className="hidden sm:inline text-sm font-medium">@{user?.username}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl py-2 z-50 border border-gray-100">
          {/* Clubs Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowClubsSubmenu(!showClubsSubmenu)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-800 hover:bg-indigo-50 transition"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-semibold">My Clubs</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform text-gray-500 ${showClubsSubmenu ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {showClubsSubmenu && (
              <div className="bg-gray-50 border-t border-b border-gray-200">
                {clubs.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 italic">No clubs available</div>
                ) : (
                  clubs.map((club: any) => (
                    <button
                      key={club.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedClubId(club.id);
                        setIsOpen(false);
                        setShowClubsSubmenu(false);
                      }}
                      className="w-full text-left px-8 py-2 text-sm text-gray-700 hover:bg-indigo-100 transition font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedClubId === club.id ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                        {club.name}
                      </div>
                    </button>
                  ))
                )}
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                  <>
                    <hr className="my-1 border-gray-200" />
                    <a
                      href="/clubs?new=true"
                      className="block px-8 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition font-medium"
                      onClick={() => {
                        setIsOpen(false);
                        setShowClubsSubmenu(false);
                      }}
                    >
                      + Create New Club
                    </a>
                  </>
                )}
              </div>
            )}
          </div>

          <hr className="my-1 border-gray-200" />
          
          <a
            href="/settings"
            className="block px-4 py-3 text-sm text-gray-800 hover:bg-indigo-50 transition"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </div>
          </a>
          <hr className="my-1 border-gray-200" />
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClubProvider>
            <AppContent />
          </ClubProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
