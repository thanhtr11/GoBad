import { useState } from 'react';
import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

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
  };
}

interface PracticeCalendarProps {
  practices: Practice[];
  onSelectEvent?: (practice: Practice) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

const PracticeCalendar: React.FC<PracticeCalendarProps> = ({
  practices,
  onSelectEvent,
  onSelectSlot,
}) => {
  const [view, setView] = useState<View>('month');

  // Convert practices to calendar events
  const events: Event[] = practices.map((practice) => ({
    id: practice.id,
    title: `${practice.court}${practice.isTournament ? ' 🏆' : ''}`,
    start: new Date(practice.startTime),
    end: new Date(practice.endTime),
    resource: practice,
  }));

  const handleSelectEvent = (event: Event) => {
    if (onSelectEvent && event.resource) {
      onSelectEvent(event.resource as Practice);
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  };

  // Custom event styling
  const eventStyleGetter = (event: Event) => {
    const practice = event.resource as Practice;
    const isTournament = practice?.isTournament;

    return {
      style: {
        backgroundColor: isTournament ? '#10b981' : '#3b82f6',
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.875rem',
        padding: '2px 5px',
      },
    };
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="mb-4 flex gap-2 justify-end">
        <button
          onClick={() => setView('month')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => setView('week')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setView('day')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Day
        </button>
        <button
          onClick={() => setView('agenda')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'agenda' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Agenda
        </button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={view}
        onView={setView}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        step={60}
        showMultiDayTimes
        defaultDate={new Date()}
      />

      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Regular Practice</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Tournament</span>
        </div>
      </div>
    </div>
  );
};

export default PracticeCalendar;
