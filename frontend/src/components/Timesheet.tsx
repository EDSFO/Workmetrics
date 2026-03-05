'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/auth-context';

// Types
interface Project {
  id: string;
  name: string;
  description?: string;
}

interface Task {
  id: string;
  name: string;
  projectId: string;
}

interface TimeEntry {
  id: string;
  projectId?: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  project?: Project;
  task?: Task;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Format seconds to hours
function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(1);
}

// Get the Monday of a given date
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format date as YYYY-MM-DD
function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get day names
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Get full day names
const FULL_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timesheet() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [weekTotal, setWeekTotal] = useState<number>(0);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState<{ projectId: string; dayIndex: number } | null>(null);

  // Generate week dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekStart]);

  // Fetch week entries
  const fetchWeekEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const startDateStr = formatDateYMD(weekStart);
      const response = await api.get(`/time-entries/week?startDate=${startDateStr}`);
      setEntries(response.data.entries || []);
      setWeekTotal(response.data.weekTotal || 0);
    } catch (err: any) {
      console.error('Failed to fetch week entries:', err);
      setError(err.response?.data?.message || 'Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchWeekEntries();
    fetchProjects();
  }, [fetchWeekEntries, fetchProjects]);

  // Group entries by project and day
  const entriesByProjectAndDay = useMemo(() => {
    const result: Record<string, Record<number, TimeEntry[]>> = {};

    // Initialize with all projects
    projects.forEach(project => {
      result[project.id] = {};
      for (let i = 0; i < 7; i++) {
        result[project.id][i] = [];
      }
    });

    // Add entries without project
    result['unassigned'] = {};
    for (let i = 0; i < 7; i++) {
      result['unassigned'][i] = [];
    }

    // Fill in entries
    entries.forEach(entry => {
      const projectId = entry.projectId || 'unassigned';
      const entryStart = new Date(entry.startTime);

      // Find which day(s) this entry belongs to
      weekDates.forEach((date, dayIndex) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        if (entry.startTime && entry.endTime) {
          // Completed entry
          if (entryStart >= dayStart && entryStart <= dayEnd) {
            if (!result[projectId]) {
              result[projectId] = {};
              for (let i = 0; i < 7; i++) {
                result[projectId][i] = [];
              }
            }
            if (!result[projectId][dayIndex]) {
              result[projectId][dayIndex] = [];
            }
            result[projectId][dayIndex].push(entry);
          }
        } else if (!entry.endTime && entry.startTime) {
          // Active entry - show on start day
          if (entryStart >= dayStart && entryStart <= dayEnd) {
            if (!result[projectId]) {
              result[projectId] = {};
              for (let i = 0; i < 7; i++) {
                result[projectId][i] = [];
              }
            }
            if (!result[projectId][dayIndex]) {
              result[projectId][dayIndex] = [];
            }
            result[projectId][dayIndex].push(entry);
          }
        }
      });
    });

    return result;
  }, [entries, projects, weekDates]);

  // Calculate totals by project
  const projectTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    projects.forEach(project => {
      totals[project.id] = 0;
      entries.forEach(entry => {
        if (entry.projectId === project.id && entry.duration) {
          totals[project.id] += entry.duration;
        }
      });
    });

    // Add unassigned total
    totals['unassigned'] = 0;
    entries.forEach(entry => {
      if (!entry.projectId && entry.duration) {
        totals['unassigned'] += entry.duration;
      }
    });

    return totals;
  }, [entries, projects]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setWeekStart(newWeekStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setWeekStart(newWeekStart);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setWeekStart(getMonday(new Date()));
  };

  // Format date for display in header
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

    if (startMonth === endMonth) {
      return `${start.getDate()} - ${end.getDate()} ${startMonth} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
  };

  // Handle cell click
  const handleCellClick = (projectId: string, dayIndex: number) => {
    setIsAddingEntry({ projectId, dayIndex });
  };

  // Render entries in a cell
  const renderCellEntries = (projectId: string, dayIndex: number) => {
    const dayEntries = entriesByProjectAndDay[projectId]?.[dayIndex] || [];
    const totalSeconds = dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

    if (dayEntries.length === 0) {
      return <span className="text-gray-400 text-xs">-</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {dayEntries.slice(0, 2).map(entry => (
          <div
            key={entry.id}
            onClick={(e) => {
              e.stopPropagation();
              setEditingEntry(entry);
            }}
            className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded cursor-pointer hover:bg-blue-200 truncate"
            title={entry.description || entry.project?.name || 'Time entry'}
          >
            {entry.duration ? formatHours(entry.duration) + 'h' : 'Active'}
          </div>
        ))}
        {dayEntries.length > 2 && (
          <div className="text-xs text-gray-500">+{dayEntries.length - 2} more</div>
        )}
      </div>
    );
  };

  // Render project row
  const renderProjectRow = (project: Project | null, projectId: string) => {
    const projectName = project?.name || 'Unassigned';
    const total = projectTotals[projectId] || 0;

    return (
      <tr key={projectId} className="hover:bg-gray-50">
        <td className="px-2 py-3 border-b font-medium text-sm whitespace-nowrap">
          {projectName}
        </td>
        {weekDates.map((date, dayIndex) => (
          <td
            key={dayIndex}
            onClick={() => handleCellClick(projectId, dayIndex)}
            className="px-1 py-2 border-b text-center cursor-pointer hover:bg-blue-50 transition-colors min-w-[80px]"
          >
            {renderCellEntries(projectId, dayIndex)}
          </td>
        ))}
        <td className="px-2 py-3 border-b font-semibold text-sm text-center bg-gray-50">
          {formatHours(total)}h
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      {/* Header with week navigation */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Weekly Timesheet</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            Previous
          </button>
          <button
            onClick={goToCurrentWeek}
            className="px-3 py-1 border rounded hover:bg-gray-100 text-sm"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>

      {/* Week range display */}
      <div className="text-center mb-4">
        <span className="text-lg font-medium">{formatWeekRange()}</span>
      </div>

      {/* Loading/Error states */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      )}
      {error && (
        <div className="text-center py-8 text-red-500">{error}</div>
      )}

      {!isLoading && !error && (
        <>
          {/* Timesheet Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-3 border-b text-left font-semibold text-sm">
                    Project
                  </th>
                  {weekDates.map((date, index) => (
                    <th key={index} className="px-1 py-3 border-b text-center font-semibold text-sm">
                      <div className="text-xs">{DAY_NAMES[index]}</div>
                      <div className="text-lg">{date.getDate()}</div>
                    </th>
                  ))}
                  <th className="px-2 py-3 border-b text-center font-semibold text-sm bg-gray-200">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Project rows */}
                {projects.map(project => renderProjectRow(project, project.id))}
                {/* Unassigned row */}
                {renderProjectRow(null, 'unassigned')}
              </tbody>
              {/* Grand total */}
              <tfoot>
                <tr className="bg-gray-200 font-bold">
                  <td className="px-2 py-3 border-b">Grand Total</td>
                  {weekDates.map((date, dayIndex) => {
                    const dayTotal = entries
                      .filter(entry => {
                        const entryDate = new Date(entry.startTime);
                        return entryDate.toDateString() === date.toDateString();
                      })
                      .reduce((sum, e) => sum + (e.duration || 0), 0);
                    return (
                      <td key={dayIndex} className="px-1 py-3 border-b text-center">
                        {dayTotal > 0 ? formatHours(dayTotal) + 'h' : '-'}
                      </td>
                    );
                  })}
                  <td className="px-2 py-3 border-b text-center bg-gray-300">
                    {formatHours(weekTotal)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* No entries message */}
          {entries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No time entries for this week. Click on a cell to add an entry.
            </div>
          )}
        </>
      )}
    </div>
  );
}
