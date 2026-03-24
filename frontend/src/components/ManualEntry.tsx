'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  billable?: boolean;
  project?: Project;
  task?: Task;
}

// Format seconds to human readable duration
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Format date for input (YYYY-MM-DD)
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format time for input (HH:MM)
function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function ManualEntry({ onSuccess }: { onSuccess?: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [billable, setBillable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Calculate duration from start and end times
  const calculatedDuration = useMemo(() => {
    if (!date || !startTime || !endTime) return 0;

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (endDateTime <= startDateTime) return 0;

    return Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);
  }, [date, startTime, endTime]);

  // Check for potential overlaps
  const overlapWarning = useMemo(() => {
    if (calculatedDuration <= 0) return null;
    return 'This entry will be checked for overlaps when saved';
  }, [calculatedDuration]);

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
    if (isExpanded) {
      fetchProjects();
    }
  }, [isExpanded]);

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

  // Reset task when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedTaskId('');
    }
  }, [selectedProjectId]);

  // Quick duration presets
  const quickPresets = [
    { label: '15m', minutes: 15 },
    { label: '30m', minutes: 30 },
    { label: '1h', minutes: 60 },
    { label: '2h', minutes: 120 },
    { label: '4h', minutes: 240 },
    { label: '8h', minutes: 480 },
  ];

  const applyPreset = (minutes: number) => {
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + minutes * 60 * 1000);
    const endHours = String(endDateTime.getHours()).padStart(2, '0');
    const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0');
    setEndTime(`${endHours}:${endMinutes}`);
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validate times
    if (calculatedDuration <= 0) {
      setError('End time must be after start time');
      setIsLoading(false);
      return;
    }

    try {
      // Construct ISO datetime strings
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(`${date}T${endTime}:00`);

      const response = await api.post('/time-entries', {
        projectId: selectedProjectId || null,
        taskId: selectedTaskId || null,
        description: description || null,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        billable,
      });

      setSuccess('Time entry created successfully!');
      setSelectedProjectId('');
      setSelectedTaskId('');
      setDescription('');
      setDate(formatDateForInput(new Date()));
      setStartTime('09:00');
      setEndTime('17:00');
      setBillable(true);

      // Trigger success callback
      if (onSuccess) {
        onSuccess();
      }

      // Collapse form after successful submission
      setTimeout(() => {
        setIsExpanded(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to create time entry';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [date, startTime, endTime, selectedProjectId, selectedTaskId, description, calculatedDuration, onSuccess]);

  if (!isExpanded) {
    return (
      <div className="p-6 border rounded-lg shadow-sm bg-white">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
        >
          + Add Manual Entry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manual Time Entry</h2>
        <button
          onClick={() => {
            setIsExpanded(false);
            setError(null);
            setSuccess(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Date Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Start Time and End Time */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Duration Display */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Duration:</span>{' '}
            {calculatedDuration > 0 ? formatDuration(calculatedDuration) : 'Invalid (end time must be after start time)'}
          </p>
          {overlapWarning && calculatedDuration > 0 && (
            <p className="text-xs text-blue-600 mt-1">{overlapWarning}</p>
          )}
          {/* Quick duration presets */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {quickPresets.map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.minutes)}
                className="px-2 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            disabled={!selectedProjectId}
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
            placeholder="What did you work on?"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Billable Toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Billable</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || calculatedDuration <= 0}
          className="w-full px-4 py-3 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
