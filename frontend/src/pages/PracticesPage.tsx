import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClub } from '../context/ClubContext';
import PracticeCalendar from '../components/practices/PracticeCalendar';
import PracticeForm from '../components/practices/PracticeForm';
import { api } from '../utils/api';

interface Club {
  id: string;
  name: string;
}

interface Practice {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  court: string;
  isTournament: boolean;
  club?: { name: string };
  _count?: {
    attendance: number;
    matches: number;
  };
}

const PracticesPage: React.FC = () => {
  const { selectedClubId, setSelectedClubId } = useClub();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [checkInPracticeId, setCheckInPracticeId] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [showAttendanceDropdown, setShowAttendanceDropdown] = useState(false);
  const [checkedInPractices, setCheckedInPractices] = useState<Record<string, string>>({});
  const [showGuestCheckInModal, setShowGuestCheckInModal] = useState(false);
  const [guestCheckInPractice, setGuestCheckInPractice] = useState<Practice | null>(null);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [showCreateGuestForm, setShowCreateGuestForm] = useState(false);

  // Fetch clubs
  const { data: clubs = [], isLoading: clubsLoading, error: clubsError } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      try {
        const response = await api.get('/clubs');
        console.log('Clubs API response:', response.data);
        return response.data?.clubs || [];
      } catch (error: any) {
        console.error('Clubs API error:', error.response?.data || error.message);
        throw error;
      }
    },
  });

  console.log('PracticesPage state:', { 
    clubs, 
    clubsLength: clubs.length, 
    clubsLoading,
    clubsError,
    selectedClubId 
  });

  // Load user's current attendance records on mount
  useEffect(() => {
    const loadUserAttendance = async () => {
      try {
        const response = await api.get('/attendance/user');
        const userAttendance = response.data?.data || [];
        
        // Build a map of practiceId -> attendanceId
        const practiceMap: Record<string, string> = {};
        userAttendance.forEach((record: any) => {
          practiceMap[record.practiceId] = record.id;
        });
        
        setCheckedInPractices(practiceMap);
      } catch (error) {
        console.error('Error loading user attendance:', error);
      }
    };

    loadUserAttendance();
  }, []);

  // Fetch practices for selected club
  const {
    data: practices = [],
    refetch,
  } = useQuery({
    queryKey: ['practices', selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];
      const response = await api.get(`/practices?clubId=${selectedClubId}`);
      return response.data?.practices || [];
    },
    enabled: !!selectedClubId,
    staleTime: 0, // Always refetch when queryKey changes
  });

  // Refetch practices when club changes
  useEffect(() => {
    if (selectedClubId) {
      refetch();
    }
  }, [selectedClubId, refetch]);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedDate(slotInfo.start);
    setShowAddForm(true);
  };

  const handlePracticeClick = async (practice: Practice) => {
    setSelectedPractice(practice);
    // Fetch attendance for this practice
    try {
      const response = await api.get(`/attendance/practice/${practice.id}`);
      setAttendanceList(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceList([]);
    }
  };

  const handleSuccess = () => {
    setShowAddForm(false);
    setSelectedDate(undefined);
    refetch();
  };

  // Self check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (practiceId: string) => {
      const response = await api.post('/attendance/self-check-in', {
        practiceId,
      });

      return response.data;
    },
    onSuccess: (data) => {
      if (data.alreadyCheckedIn) {
        setCheckInMessage({ type: 'success', text: 'You are already checked in for this practice!' });

      } else {
        setCheckInMessage({ type: 'success', text: '✓ Successfully checked in!' });

      }
      // Track the attendance ID for this practice
      if (data.data?.id && checkInPracticeId) {
        setCheckedInPractices((prev) => ({
          ...prev,
          [checkInPracticeId]: data.data.id,
        }));
      }
      setCheckInPracticeId(null);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });

      
      // Refetch attendance list for the selected practice
      if (selectedPractice) {
        handlePracticeClick(selectedPractice);
      }
      
      setTimeout(() => setCheckInMessage(null), 3000);
    },
    onError: (err: any) => {
      setCheckInMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to check in',
      });

      setTimeout(() => setCheckInMessage(null), 3000);
    },
  });

  // Remove check-in mutation
  const removeCheckInMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const response = await api.delete(`/attendance/${attendanceId}`);
      return response.data;
    },
    onSuccess: () => {
      setCheckInMessage({ type: 'success', text: '✓ Check-in removed!' });

      queryClient.invalidateQueries({ queryKey: ['attendance'] });

      queryClient.invalidateQueries({ queryKey: ['practices'] });

      // Clear the checked-in status for this practice
      if (checkInPracticeId) {
        setCheckedInPractices((prev) => {
          const updated = { ...prev };
          delete updated[checkInPracticeId];
          return updated;
        });
      }

      setTimeout(() => setCheckInMessage(null), 3000);
    },
    onError: (err: any) => {
      setCheckInMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to remove check-in',
      });

      setTimeout(() => setCheckInMessage(null), 3000);
    },
  });

  // Fetch guests created by this member
  const { data: guests = [], refetch: refetchGuests } = useQuery({
    queryKey: ['my-guests'],
    queryFn: async () => {
      try {
        const response = await api.get('/members/my-guests');
        return response.data?.guests || [];
      } catch (error) {
        console.error('Error fetching guests:', error);
        return [];
      }
    },
  });

  const handleOpenGuestCheckIn = (practice: Practice) => {
    setGuestCheckInPractice(practice);
    setShowGuestCheckInModal(true);
    setGuestSearchQuery('');
    setSelectedGuest(null);
    setShowCreateGuestForm(false);
  };

  const handleGuestCheckIn = async (guest: any) => {
    if (!guestCheckInPractice) return;
    try {
      await api.post('/attendance/guest-check-in', {
        practiceId: guestCheckInPractice.id,
        guestId: guest.id,
      });
      setCheckInMessage({ type: 'success', text: '✓ Guest checked in successfully!' });
      setShowGuestCheckInModal(false);
      refetch();
      setTimeout(() => setCheckInMessage(null), 3000);
    } catch (error: any) {
      setCheckInMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to check in guest',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Practice Scheduling</h1>
          <p className="text-gray-600">
            Schedule practice sessions, track attendance, and manage court bookings
          </p>
        </div>

        {/* Club Selector */}
        {clubsLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <p className="text-gray-500 text-sm">Loading clubs...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <p className="text-gray-500 text-sm">No clubs available. Create a club first in Settings.</p>
          </div>
        ) : (
          <>
            {selectedClubId && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <span className="text-sm font-medium text-gray-500">Club: </span>
                <span className="text-lg font-semibold text-gray-900">
                  {clubs.find((club: Club) => club.id === selectedClubId)?.name || 'Unknown Club'}
                </span>
              </div>
            )}

            {selectedClubId && (
              <>
            {/* Add Practice Button */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setSelectedDate(undefined);
                  setShowAddForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Schedule Practice
              </button>
            </div>

            {/* Add Practice Form Modal */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Schedule Practice</h2>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedDate(undefined);
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6">
                    <PracticeForm
                      clubId={selectedClubId}
                      defaultDate={selectedDate}
                      onSuccess={handleSuccess}
                      onCancel={() => {
                        setShowAddForm(false);
                        setSelectedDate(undefined);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Calendar View */}
            <div className="mb-6">
              <PracticeCalendar
                practices={practices}
                onSelectSlot={handleSelectSlot}
              />
            </div>

            {/* Upcoming Practices List */}
            {practices.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Practices</h2>
                
                {/* Check-in Message */}
                {checkInMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg ${
                      checkInMessage.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                  >
                    {checkInMessage.text}
                  </div>
                )}

                <div className="space-y-3">
                  {practices
                    .filter((p: Practice) => new Date(p.date) >= new Date())
                    .slice(0, 10)
                    .map((practice: Practice) => {
                      const practiceDate = new Date(practice.date);
                      const startTime = new Date(practice.startTime);
                      const endTime = new Date(practice.endTime);
                      return (
                        <div
                          key={practice.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => handlePracticeClick(practice)}
                          >
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {practiceDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              {practice.isTournament && (
                                <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded">
                                  Tournament
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {startTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {endTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <p className="text-sm text-gray-500">Court: {practice.court}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                const attendanceId = checkedInPractices[practice.id];
                                if (attendanceId) {
                                  setCheckInPracticeId(practice.id);
                                  removeCheckInMutation.mutate(attendanceId);
                                } else {
                                  setCheckInPracticeId(practice.id);
                                  checkInMutation.mutate(practice.id);
                                }
                              }}
                              disabled={(checkInMutation.isPending || removeCheckInMutation.isPending) && checkInPracticeId === practice.id}
                              className={`px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${
                                checkedInPractices[practice.id]
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {checkInPracticeId === practice.id && (checkInMutation.isPending || removeCheckInMutation.isPending)
                                ? checkedInPractices[practice.id] ? 'Removing...' : 'Checking in...'
                                : checkedInPractices[practice.id] ? 'Absent' : 'Check In'}
                            </button>
                            <button
                              className="px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap bg-green-600 text-white hover:bg-green-700"
                              onClick={() => handleOpenGuestCheckIn(practice)}
                            >
                              Check-in for Guest
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            </>
          )}
          </>
        )}

        {/* Practice Details Modal */}
        {selectedPractice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">Practice Details</h2>
                <button
                  onClick={() => setSelectedPractice(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Date and Time */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Date & Time</h3>
                  <p className="text-gray-600">
                    {new Date(selectedPractice.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-600">
                    {new Date(selectedPractice.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(selectedPractice.endTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Court */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Court</h3>
                  <p className="text-gray-600">{selectedPractice.court}</p>
                </div>

                {/* Tournament Badge */}
                {selectedPractice.isTournament && (
                  <div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                      🏆 Tournament
                    </span>
                  </div>
                )}

                {/* Attendance Count */}
                {selectedPractice._count && (
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition"
                      onClick={() => setShowAttendanceDropdown(!showAttendanceDropdown)}
                    >
                      <p className="text-sm text-gray-600">Attendance</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedPractice._count.attendance}</p>
                      {selectedPractice._count.attendance > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Click to view members</p>
                      )}
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Matches</p>
                      <p className="text-2xl font-bold text-green-600">{selectedPractice._count.matches}</p>
                    </div>
                  </div>
                )}

                {/* Attendance Dropdown */}
                {showAttendanceDropdown && attendanceList.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Checked In Members ({attendanceList.length})</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {attendanceList.map((record: any) => (
                        <div key={record.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-100">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{record.member.user.name}</p>
                            <p className="text-xs text-gray-500">{record.member.user.skillLevel}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <p className="text-xs text-gray-600">
                              {new Date(record.checkInAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <button
                              onClick={() => removeCheckInMutation.mutate(record.id)}
                              disabled={removeCheckInMutation.isPending}
                              className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              {removeCheckInMutation.isPending ? 'Removing...' : 'Absent'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Guest Check-In Modal */}
        {showGuestCheckInModal && guestCheckInPractice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Check In Guest</h2>
                <button
                  onClick={() => setShowGuestCheckInModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-4">
                {!showCreateGuestForm ? (
                  <>
                    {/* Guest Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Existing Guests
                      </label>
                      <input
                        type="text"
                        value={guestSearchQuery}
                        onChange={(e) => setGuestSearchQuery(e.target.value)}
                        placeholder="Enter guest name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Guest List */}
                    {guests.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {guests
                          .filter((guest: any) =>
                            guest.user.name.toLowerCase().includes(guestSearchQuery.toLowerCase())
                          )
                          .map((guest: any) => (
                            <button
                              key={guest.id}
                              onClick={() => setSelectedGuest(guest)}
                              className={`w-full text-left p-3 rounded border transition ${
                                selectedGuest?.id === guest.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <p className="font-medium text-gray-900">{guest.user.name}</p>
                              <p className="text-xs text-gray-500">{guest.user.skillLevel}</p>
                            </button>
                          ))}
                      </div>
                    )}

                    {/* No Guests Message */}
                    {guests.length === 0 && (
                      <div className="text-center p-4 text-gray-500">
                        <p className="text-sm">No guests found</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {selectedGuest && (
                        <button
                          onClick={() => handleGuestCheckIn(selectedGuest)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Check In Guest
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowCreateGuestForm(true);
                          setGuestSearchQuery('');
                          setSelectedGuest(null);
                        }}
                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                          selectedGuest
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {selectedGuest ? 'Create New' : 'Create New Guest'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Create New Guest Form */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Guest Name *
                        </label>
                        <input
                          type="text"
                          value={guestSearchQuery}
                          onChange={(e) => setGuestSearchQuery(e.target.value)}
                          placeholder="Enter guest name..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skill Level
                        </label>
                        <select
                          value={selectedGuest?.skillLevel || ''}
                          onChange={(e) =>
                            setSelectedGuest({
                              ...selectedGuest,
                              skillLevel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select skill level</option>
                          <option value="BEGINNER">Beginner</option>
                          <option value="INTERMEDIATE">Intermediate</option>
                          <option value="ADVANCED">Advanced</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={async () => {
                          if (!guestSearchQuery || !selectedGuest?.skillLevel) {
                            alert('Please fill in all fields');
                            return;
                          }
                          try {
                            const response = await api.post('/members/create-guest', {
                              name: guestSearchQuery,
                              skillLevel: selectedGuest.skillLevel,
                              practiceId: guestCheckInPractice.id,
                            });
                            setCheckInMessage({ type: 'success', text: '✓ Guest checked in successfully!' });
                            setShowGuestCheckInModal(false);
                            setShowCreateGuestForm(false);
                            refetch();
                            refetchGuests();
                            setTimeout(() => setCheckInMessage(null), 3000);
                          } catch (error: any) {
                            setCheckInMessage({
                              type: 'error',
                              text: error.response?.data?.error || 'Failed to create guest',
                            });
                          }
                        }}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Create & Check In
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateGuestForm(false);
                          setGuestSearchQuery('');
                          setSelectedGuest(null);
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium"
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticesPage;
