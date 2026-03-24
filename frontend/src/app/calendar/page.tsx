'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useAuthStore } from '@/lib/auth-context';

interface CalendarEntry {
  id: string;
  userId: string;
  userName: string;
  projectId: string | null;
  projectName: string | null;
  taskId: string | null;
  taskName: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  description: string | null;
  billable: boolean;
  type: string;
  status: string;
}

interface DayEntries {
  date: string;
  entries: CalendarEntry[];
  totalDuration: number;
  totalBillable: number;
}

interface CalendarView {
  startDate: string;
  endDate: string;
  view: 'day' | 'week' | 'month';
  days: DayEntries[];
  totalDuration: number;
  totalBillable: number;
}

type ViewMode = 'day' | 'week' | 'month';

export default function CalendarPage() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('week');
  const [calendarData, setCalendarData] = useState<CalendarView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendarData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      let response;
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      if (view === 'month') {
        response = await api.get(`/calendar/month?year=${year}&month=${month}`);
      } else if (view === 'week') {
        const startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
        response = await api.get(`/calendar/week?startDate=${startDate.toISOString()}`);
      } else {
        const dateStr = currentDate.toISOString().split('T')[0];
        response = await api.get(`/calendar/day?date=${dateStr}`);
      }

      setCalendarData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentDate, view]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDateTitle = (): string => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const getProjectColor = (projectName: string | null): string => {
    if (!projectName) return 'bg-gray-400';
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const hash = projectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Visualize your time entries</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* View Controls and Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card rounded-lg p-4 border">
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrevious}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center capitalize">
            {getDateTitle()}
          </h2>
          <button
            onClick={navigateNext}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === v
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v === 'day' ? 'Day' : v === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Calendar Content */}
      {!isLoading && calendarData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{formatDuration(calendarData.totalDuration)}</p>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">Billable Hours</p>
              <p className="text-2xl font-bold text-green-600">{formatDuration(calendarData.totalBillable)}</p>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">Entries</p>
              <p className="text-2xl font-bold">
                {calendarData.days.reduce((sum, day) => sum + day.entries.length, 0)}
              </p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-card rounded-lg border overflow-hidden">
            {view === 'month' && (
              <div className="grid grid-cols-7 border-b">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium bg-muted border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
            )}

            <div className={view === 'month' ? 'grid grid-cols-7' : 'space-y-4 p-4'}>
              {calendarData.days.map((day) => (
                <div
                  key={day.date}
                  className={`border-b last:border-b-0 ${view === 'month' ? 'border-r last:border-r-0 min-h-[120px] p-2' : ''}`}
                >
                  {view === 'month' ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${new Date(day.date).toDateString() === new Date().toDateString() ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                          {new Date(day.date).getDate()}
                        </span>
                        {day.totalDuration > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(day.totalDuration)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {day.entries.slice(0, 3).map((entry) => (
                          <div
                            key={entry.id}
                            className={`text-xs p-1 rounded truncate ${getProjectColor(entry.projectName)} text-white`}
                            title={`${entry.projectName || 'No project'}: ${formatDuration(entry.duration)}`}
                          >
                            {formatTime(entry.startTime)} {entry.projectName || 'No project'}
                          </div>
                        ))}
                        {day.entries.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{day.entries.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-4">
                      <div className="w-20 flex-shrink-0">
                        <p className={`text-sm font-medium ${new Date(day.date).toDateString() === new Date().toDateString() ? 'text-primary' : ''}`}>
                          {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(day.totalDuration)}
                        </p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {day.entries.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No entries</p>
                        ) : (
                          day.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
                            >
                              <div className={`w-1 h-full min-h-[40px] rounded-full ${getProjectColor(entry.projectName)}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-sm truncate">
                                    {entry.projectName || 'No project'}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {entry.duration ? formatDuration(entry.duration) : 'In progress'}
                                  </span>
                                </div>
                                {entry.taskName && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {entry.taskName}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(entry.startTime)}
                                    {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                                  </span>
                                  {entry.billable && (
                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                      Billable
                                    </span>
                                  )}
                                </div>
                                {entry.description && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {entry.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
