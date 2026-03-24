'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
}

// Format seconds to HH:MM:SS
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format seconds to short display (e.g., "2h 30m")
function formatShortDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// Calculate elapsed time from start time
function calculateElapsed(startTime: string): number {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / 1000);
}

export default function Timer() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data.projects || []);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch tasks when project is selected
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedProjectId) {
        setTasks([]);
        return;
      }
      try {
        const response = await api.get(`/projects/${selectedProjectId}/tasks`);
        setTasks(response.data.tasks || []);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      }
    };
    fetchTasks();
  }, [selectedProjectId]);

  // Fetch active time entry and today's entries on mount
  useEffect(() => {
    const fetchActiveEntry = async () => {
      try {
        const response = await api.get('/time-entries/active');
        if (response.data.timeEntry) {
          setActiveEntry(response.data.timeEntry);
          setElapsedSeconds(calculateElapsed(response.data.timeEntry.startTime));
          setSelectedProjectId(response.data.timeEntry.projectId || '');
          setSelectedTaskId(response.data.timeEntry.taskId || '');
          setDescription(response.data.timeEntry.description || '');
        }
      } catch (err) {
        console.error('Failed to fetch active entry:', err);
      }
    };

    const fetchTodayEntries = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await api.get(`/time-entries?startDate=${today}&endDate=${today}`);
        const entries = response.data.entries || [];
        setTodayEntries(entries);
        const total = entries.reduce((sum: number, e: TimeEntry) => sum + (e.duration || 0), 0);
        setTodayTotal(total);
      } catch (err) {
        console.error('Failed to fetch today entries:', err);
      }
    };

    fetchActiveEntry();
    fetchTodayEntries();
  }, []);

  // Update elapsed time every second when there's an active entry
  useEffect(() => {
    if (activeEntry) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(calculateElapsed(activeEntry.startTime));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeEntry]);

  // Handle timer start
  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/time-entries/start', {
        projectId: selectedProjectId || null,
        taskId: selectedTaskId || null,
        description: description || null,
      });
      setActiveEntry(response.data.timeEntry);
      setElapsedSeconds(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start timer');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, selectedTaskId, description]);

  // Handle timer stop
  const handleStop = useCallback(async () => {
    if (!activeEntry) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/time-entries/stop', {
        id: activeEntry.id,
      });
      setActiveEntry(null);
      setElapsedSeconds(0);
      setSelectedProjectId('');
      setSelectedTaskId('');
      setDescription('');
      // Refresh today's entries
      const today = new Date().toISOString().split('T')[0];
      const entriesRes = await api.get(`/time-entries?startDate=${today}&endDate=${today}`);
      const entries = entriesRes.data.entries || [];
      setTodayEntries(entries);
      const total = entries.reduce((sum: number, e: TimeEntry) => sum + (e.duration || 0), 0);
      setTodayTotal(total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stop timer');
    } finally {
      setIsLoading(false);
    }
  }, [activeEntry]);

  // Handle discard entry
  const handleDiscard = useCallback(async () => {
    if (!activeEntry) return;
    if (!confirm('Are you sure you want to discard this entry?')) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/time-entries/${activeEntry.id}`);
      setActiveEntry(null);
      setElapsedSeconds(0);
      setSelectedProjectId('');
      setSelectedTaskId('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to discard entry');
    } finally {
      setIsLoading(false);
    }
  }, [activeEntry]);

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4">Time Tracker</h2>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-mono font-bold text-gray-800">
          {formatDuration(elapsedSeconds)}
        </div>
        {activeEntry && (
          <div className="mt-2 text-sm text-green-600 font-medium flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Running
          </div>
        )}
        {!activeEntry && (
          <p className="mt-2 text-sm text-muted-foreground">Ready to start</p>
        )}
      </div>

      {/* Today's Summary */}
      {!activeEntry && todayTotal > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Today&apos;s Total</p>
          <p className="text-xl font-bold">{formatShortDuration(todayTotal)}</p>
        </div>
      )}

      {/* Project Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setSelectedTaskId('');
          }}
          disabled={!!activeEntry || isLoading}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">No Project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Task Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task (optional)
        </label>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          disabled={!!activeEntry || isLoading || !selectedProjectId}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">No Task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!!activeEntry || isLoading}
          placeholder="What are you working on?"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      {/* Start/Stop Button */}
      <div className="flex gap-3">
        {!activeEntry ? (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Starting...' : 'Start Timer'}
          </button>
        ) : (
          <>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Stopping...' : 'Stop Timer'}
            </button>
            <button
              onClick={handleDiscard}
              disabled={isLoading}
              className="px-4 py-3 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
              title="Discard entry"
            >
              Discard
            </button>
          </>
        )}
      </div>

      {/* Active Entry Info */}
      {activeEntry && activeEntry.project && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium text-blue-800">
            Working on: {activeEntry.project.name}
            {activeEntry.task && ` / ${activeEntry.task.name}`}
          </p>
          {activeEntry.description && (
            <p className="text-blue-600 mt-1">{activeEntry.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
