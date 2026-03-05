'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/auth-context';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
}

interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  status: string;
  user?: User;
  project?: Project;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ApprovalsPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; entryId: string | null }>({ open: false, entryId: null });
  const [rejectReason, setRejectReason] = useState<string>('');

  const fetchPendingEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/time-entries/approvals/pending');
      setEntries(response.data.entries || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingEntries();
  }, [fetchPendingEntries]);

  const handleApprove = async (entryId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post(`/time-entries/approvals/${entryId}/approve`);
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSuccess(response.data.message);
        fetchPendingEntries();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao aprovar');
    }
  };

  const handleReject = async () => {
    if (!rejectModal.entryId) return;

    setError(null);
    setSuccess(null);
    try {
      const response = await api.post(`/time-entries/approvals/${rejectModal.entryId}/reject`, {
        reason: rejectReason,
      });
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSuccess('Entry reprovada');
        setRejectModal({ open: false, entryId: null });
        setRejectReason('');
        fetchPendingEntries();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao reprovar');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Aprovação de Horas</h1>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">Nenhuma entry pendente de aprovação</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold">{entry.user?.name}</span>
                      <span className="text-sm text-muted-foreground">{entry.user?.email}</span>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      {entry.project?.name || 'Sem projeto'}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        📅 {formatDate(entry.startTime)} {formatTime(entry.startTime)} - {formatTime(entry.endTime || '')}
                      </span>
                      <span className="font-semibold text-blue-600">
                        ⏱️ {formatDuration(entry.duration || 0)}
                      </span>
                    </div>

                    {entry.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {entry.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(entry.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      ✅ Aprovar
                    </button>
                    <button
                      onClick={() => setRejectModal({ open: true, entryId: entry.id })}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      ❌ Reprovar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Reprovar Entry</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo da reprovação (opcional)"
                className="w-full px-3 py-2 border rounded-md mb-4 h-24 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRejectModal({ open: false, entryId: null })}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Reprovar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
