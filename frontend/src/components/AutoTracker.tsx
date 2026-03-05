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

function calculateElapsed(startTime: string): number {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / 1000);
}

export default function AutoTracker() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [idleTime, setIdleTime] = useState<number>(0);
  const [heartbeatInterval, setHeartbeatInterval] = useState<number>(60); // seconds

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Fetch projects
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

  // Check auto-track status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get('/time-entries/auto/status');
        if (response.data.isActive) {
          setIsActive(true);
          setActiveEntry(response.data.timeEntry);
          setElapsedSeconds(response.data.elapsedSeconds || 0);
          if (response.data.timeEntry?.projectId) {
            setSelectedProjectId(response.data.timeEntry.projectId);
          }
          if (response.data.timeEntry?.taskId) {
            setSelectedTaskId(response.data.timeEntry.taskId);
          }
        }
      } catch (err) {
        console.error('Failed to check status:', err);
      }
    };
    checkStatus();
  }, []);

  // Update elapsed time and check idle
  useEffect(() => {
    if (isActive && activeEntry) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(calculateElapsed(activeEntry.startTime));
      }, 1000);

      // Idle detection (check every 10 seconds)
      idleIntervalRef.current = setInterval(async () => {
        const now = Date.now();
        const timeSinceActivity = now - lastActivityRef.current;
        const idleSeconds = Math.floor(timeSinceActivity / 1000);
        setIdleTime(idleSeconds);

        // Send heartbeat if still active
        if (idleSeconds < 300) { // Less than 5 minutes idle
          try {
            await api.post('/time-entries/auto/heartbeat', {
              activity: idleSeconds > 60 ? 'Ativo (possível idle)' : 'Trabalhando'
            });
          } catch (err) {
            console.error('Heartbeat failed:', err);
          }
        }
      }, 10000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    };
  }, [isActive, activeEntry]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleTime(0);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // Start auto tracking
  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/time-entries/auto/start', {
        projectId: selectedProjectId || null,
        taskId: selectedTaskId || null,
        description: description || 'Auto tracking',
      });
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setMessage(response.data.message);
        setIsActive(true);
        setActiveEntry(response.data.timeEntry);
        setElapsedSeconds(0);
        lastActivityRef.current = Date.now();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao iniciar');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop auto tracking
  const handleStop = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/time-entries/auto/stop');
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setMessage(response.data.message);
        setIsActive(false);
        setActiveEntry(null);
        setElapsedSeconds(0);
        setIdleTime(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao parar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Auto Tracker</h2>
        <span className={`px-3 py-1 rounded-full text-sm ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {isActive ? '🟢 Ativo' : '⚪ Inativo'}
        </span>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-gray-800">
          {formatDuration(elapsedSeconds)}
        </div>
        {isActive && (
          <div className="mt-2 text-sm text-muted-foreground">
            Tempo ocioso: {formatDuration(idleTime)}
          </div>
        )}
      </div>

      {/* Project Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Projeto
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setSelectedTaskId('');
          }}
          disabled={isActive || isLoading}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">Sem Projeto</option>
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
          Tarefa
        </label>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          disabled={isActive || isLoading || !selectedProjectId}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">Sem Tarefa</option>
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
          Descrição
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isActive || isLoading}
          placeholder="O que você está fazendo?"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      {/* Start/Stop Button */}
      <div className="flex gap-3">
        {!isActive ? (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Iniciando...' : '▶️ Iniciar Auto Track'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Parando...' : '⏹️ Parar Auto Track'}
          </button>
        )}
      </div>

      {/* Active Entry Info */}
      {isActive && activeEntry && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium text-blue-800">
            Rastreando: {activeEntry.project?.name || 'Sem projeto'}
            {activeEntry.task && ` / ${activeEntry.task.name}`}
          </p>
          {activeEntry.description && (
            <p className="text-blue-600 mt-1">{activeEntry.description}</p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-muted-foreground">
        <p className="font-medium mb-1">ℹ️ Como funciona:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>O Auto Tracker registra seu tempo automaticamente</li>
          <li>Detecta inatividade após 5 minutos sem movimento</li>
          <li>Envia heartbeat a cada 10 segundos</li>
          <li>Monitore sua produtividade em tempo real</li>
        </ul>
      </div>
    </div>
  );
}
