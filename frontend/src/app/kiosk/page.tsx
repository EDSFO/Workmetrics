'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/auth-context';

// Types
interface KioskEntry {
  id: string;
  type: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
}

// Format date for display
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Format seconds to short display
function formatShortDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function KioskPage() {
  const [status, setStatus] = useState<string>('OFF');
  const [entries, setEntries] = useState<KioskEntry[]>([]);
  const [totalWorkTime, setTotalWorkTime] = useState<number>(0);
  const [pauseTime, setPauseTime] = useState<number>(0);
  const [currentEntry, setCurrentEntry] = useState<KioskEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to HH:MM:SS
  function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Calculate elapsed time from start time
  function calculateElapsed(startTime: string): number {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / 1000);
  }

  // Format time for display
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch kiosk status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get('/time-entries/kiosk/status');
      setStatus(response.data.status);
      setCurrentEntry(response.data.entry || null);
      if (response.data.entry) {
        setElapsedSeconds(calculateElapsed(response.data.entry.startTime));
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  // Fetch today's entries
  const fetchTodayEntries = useCallback(async () => {
    try {
      const response = await api.get('/time-entries/kiosk/today');
      setEntries(response.data.entries || []);
      setTotalWorkTime(response.data.totalWorkTime || 0);
      setPauseTime(response.data.pauseTime || 0);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  }, []);

  // Initial fetch + visibility change refresh
  useEffect(() => {
    fetchStatus();
    fetchTodayEntries();

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchStatus();
        fetchTodayEntries();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchStatus, fetchTodayEntries]);

  // Update elapsed time
  useEffect(() => {
    if (currentEntry) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(calculateElapsed(currentEntry.startTime));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentEntry]);

  // Handle Clock In
  const handleClockIn = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/time-entries/kiosk/clock-in');
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setMessage(response.data.message);
        setStatus('WORKING');
        setCurrentEntry(response.data.timeEntry);
        setElapsedSeconds(0);
        fetchTodayEntries();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar entrada');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/time-entries/kiosk/clock-out');
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setMessage(response.data.message);
        setStatus('OFF');
        setCurrentEntry(null);
        setElapsedSeconds(0);
        fetchTodayEntries();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar saída');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Pause
  const handlePause = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/time-entries/kiosk/pause');
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setMessage(response.data.message);
        setStatus('PAUSE');
        fetchStatus();
        fetchTodayEntries();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao iniciar pausa');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resume
  const handleResume = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/time-entries/kiosk/resume');
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setMessage(response.data.message);
        setStatus('WORKING');
        fetchStatus();
        fetchTodayEntries();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao retornar de pausa');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'WORKING': return 'bg-green-500';
      case 'PAUSE': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'WORKING': return 'Em Trabalho';
      case 'PAUSE': return 'Em Pausa';
      default: return 'Fora do Trabalho';
    }
  };

  // Get current session type label
  const getSessionType = () => {
    const clockIn = entries.find(e => e.type === 'CLOCK_IN');
    if (!clockIn) return null;
    const clockOut = entries.find(e => e.type === 'CLOCK_OUT');
    if (!clockOut) return '🟢 Em andamento';
    return '✅ Completo';
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with Date */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Ponto Eletrônico</h1>
          <p className="text-muted-foreground capitalize">{formatDateDisplay(new Date())}</p>
          <p className="text-2xl font-mono text-blue-600 mt-2">{currentTime}</p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Tempo Trabalho</p>
            <p className="text-xl font-bold text-green-600">{formatShortDuration(totalWorkTime)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Em Pausa</p>
            <p className="text-xl font-bold text-yellow-600">{formatShortDuration(pauseTime)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Registros</p>
            <p className="text-xl font-bold text-blue-600">{entries.length}</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`${getStatusColor()} text-white rounded-lg p-6 mb-6 text-center`}>
          <div className="text-6xl font-mono font-bold mb-2">
            {status === 'OFF' ? '--:--:--' : formatDuration(elapsedSeconds)}
          </div>
          <div className="text-xl font-semibold">{getStatusText()}</div>
          {getSessionType() && (
            <div className="text-sm mt-1 opacity-80">{getSessionType()}</div>
          )}
        </div>

        {/* Messages */}
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {status === 'OFF' && (
            <button
              onClick={handleClockIn}
              disabled={isLoading}
              className="col-span-2 px-6 py-4 bg-green-500 text-white text-xl font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? 'Registrando...' : '🕐 ENTRADA (Clock In)'}
            </button>
          )}

          {status === 'WORKING' && (
            <>
              <button
                onClick={handlePause}
                disabled={isLoading}
                className="px-6 py-4 bg-yellow-500 text-white text-xl font-bold rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition-colors"
              >
                ☕ Pausa
              </button>
              <button
                onClick={handleClockOut}
                disabled={isLoading}
                className="px-6 py-4 bg-red-500 text-white text-xl font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors"
              >
                🚪 SAÍDA (Clock Out)
              </button>
            </>
          )}

          {status === 'PAUSE' && (
            <>
              <button
                onClick={handleResume}
                disabled={isLoading}
                className="col-span-2 px-6 py-4 bg-green-500 text-white text-xl font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
              >
                ▶️ RETOMAR TRABALHO
              </button>
            </>
          )}
        </div>

        {/* Today's Summary */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Registro do Dia</h3>

          {/* Entries List */}
          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum registro hoje
              </p>
            ) : (
              entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.type === 'CLOCK_IN' ? 'bg-green-50 border border-green-200' :
                    entry.type === 'CLOCK_OUT' ? 'bg-red-50 border border-red-200' :
                    entry.type === 'PAUSE' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {entry.type === 'CLOCK_IN' && '🕐'}
                      {entry.type === 'CLOCK_OUT' && '🚪'}
                      {entry.type === 'PAUSE' && '☕'}
                      {entry.type === 'RESUME' && '▶️'}
                    </span>
                    <div>
                      <div className="font-medium">
                        {entry.type === 'CLOCK_IN' && 'Entrada'}
                        {entry.type === 'CLOCK_OUT' && 'Saída'}
                        {entry.type === 'PAUSE' && 'Início Pausa'}
                        {entry.type === 'RESUME' && 'Fim Pausa'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(entry.startTime)}
                        {entry.endTime && ` → ${formatTime(entry.endTime)}`}
                      </div>
                    </div>
                  </div>
                  {entry.duration && entry.type !== 'RESUME' && (
                    <span className="text-sm font-semibold px-2 py-1 bg-white rounded">
                      {formatDuration(entry.duration)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Total Work Time */}
          {totalWorkTime > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-medium">Tempo Total de Trabalho:</span>
              <span className="text-xl font-bold text-green-600">{formatDuration(totalWorkTime)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
