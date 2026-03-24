'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-context';
import { api } from '@/lib/auth-context';

interface TimeOffRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  hours: number;
  status: string;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface TimeOffBalance {
  policyType: string;
  policyName: string;
  accrued: number;
  used: number;
  pending: number;
  available: number;
  isPaid: boolean;
}

const TIME_OFF_TYPES = [
  { value: 'PTO', label: 'Paid Time Off (PTO)', icon: '🏖️' },
  { value: 'SICK', label: 'Sick Leave', icon: '🤒' },
  { value: 'PARENTAL', label: 'Parental Leave', icon: '👶' },
  { value: 'BEREAVEMENT', label: 'Bereavement', icon: '🕊️' },
  { value: 'OTHER', label: 'Other', icon: '📋' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const STATUS_ICONS: Record<string, string> = {
  PENDING: '⏳',
  APPROVED: '✅',
  REJECTED: '❌',
  CANCELLED: '🚫',
};

export default function TimeOffPage() {
  const { isAdmin, isManager } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my-requests' | 'balances' | 'pending'>('my-requests');
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [balances, setBalances] = useState<TimeOffBalance[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [formData, setFormData] = useState({
    type: 'PTO',
    startDate: '',
    endDate: '',
    hours: 8,
    notes: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsRes, balancesRes] = await Promise.all([
        api.get('/time-off/my'),
        api.get('/time-off/balances'),
      ]);

      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      setBalances(Array.isArray(balancesRes.data) ? balancesRes.data : []);

      if (isAdmin || isManager) {
        const pendingRes = await api.get('/time-off/pending');
        setPendingRequests(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      }
    } catch (error) {
      console.error('Failed to load time off data:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await api.post('/time-off/request', formData);
      if (res.data.success || res.data.id) {
        setMessage({ type: 'success', text: 'Time off request submitted successfully' });
        setShowRequestForm(false);
        setFormData({ type: 'PTO', startDate: '', endDate: '', hours: 8, notes: '' });
        loadData();
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Failed to submit request' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'An error occurred' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/time-off/${id}/approve`);
      setMessage({ type: 'success', text: 'Request approved successfully' });
      loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to approve' });
    }
  };

  const handleReject = async () => {
    if (!showRejectModal.requestId) return;
    try {
      await api.post(`/time-off/${showRejectModal.requestId}/reject`, { reason: rejectReason });
      setMessage({ type: 'success', text: 'Request rejected' });
      setShowRejectModal({ open: false, requestId: null });
      setRejectReason('');
      loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reject' });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.post(`/time-off/${id}/cancel`);
      setMessage({ type: 'success', text: 'Request cancelled' });
      loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to cancel' });
    }
  };

  const getTypeIcon = (type: string) => TIME_OFF_TYPES.find(t => t.value === type)?.icon || '📋';

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateFull = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Férias e Licenças</h1>
          <p className="text-muted-foreground">Gerencie seus pedidos de férias e saldos</p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Pedido
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`pb-2 px-1 ${
            activeTab === 'my-requests'
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-muted-foreground'
          }`}
        >
          Meus Pedidos
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-2 px-1 ${
            activeTab === 'balances'
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-muted-foreground'
          }`}
        >
          Saldos
        </button>
        {(isAdmin || isManager) && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2 px-1 ${
              activeTab === 'pending'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Pendentes ({pendingRequests.length})
          </button>
        )}
      </div>

      {/* My Requests Tab */}
      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center">Carregando...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-white rounded-lg border">
              Nenhum pedido de férias encontrado
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{getTypeIcon(request.type)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {TIME_OFF_TYPES.find((t) => t.value === request.type)?.label || request.type}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[request.status]}`}>
                          {STATUS_ICONS[request.status]} {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDateFull(request.startDate)} → {formatDateFull(request.endDate)}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>🕐 {request.hours}h</span>
                        {request.notes && (
                          <span className="text-muted-foreground italic">"{request.notes}"</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {request.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(request.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-8 text-center">Carregando...</div>
          ) : balances.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground bg-white rounded-lg border">
              Nenhuma política de férias configurada
            </div>
          ) : (
            balances.map((balance) => {
              const usagePercent = balance.accrued > 0 ? Math.min(100, (balance.used / balance.accrued) * 100) : 0;
              return (
                <div key={balance.policyType} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">{balance.policyName}</h3>
                    {balance.isPaid && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Pago
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Acumulado</span>
                      <span className="font-medium">{balance.accrued}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usado</span>
                      <span className="text-red-600">-{balance.used}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pendente</span>
                      <span className="text-yellow-600">{balance.pending}h</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span>Disponível</span>
                      <span className="text-green-600">{balance.available}h</span>
                    </div>
                  </div>
                  {/* Usage Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Uso</span>
                      <span>{usagePercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          usagePercent > 80 ? 'bg-red-500' : usagePercent > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pending Approvals Tab (Admin/Manager) */}
      {activeTab === 'pending' && (isAdmin || isManager) && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center">Carregando...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-white rounded-lg border">
              Nenhum pedido pendente de aprovação
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{getTypeIcon(request.type)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {request.user?.name || 'Employee'}
                        </h3>
                        <span className="text-sm text-muted-foreground">{request.user?.email}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {TIME_OFF_TYPES.find((t) => t.value === request.type)?.label || request.type}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDateFull(request.startDate)} → {formatDateFull(request.endDate)}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>🕐 {request.hours}h</span>
                        {request.notes && (
                          <span className="text-muted-foreground italic">"{request.notes}"</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✅ Aprovar
                    </button>
                    <button
                      onClick={() => setShowRejectModal({ open: true, requestId: request.id })}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      ❌ Reprovar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Solicitar Férias</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {TIME_OFF_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data Início</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Horas</label>
                <input
                  type="number"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Enviar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reprovar Pedido</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da reprovação (opcional)"
              className="w-full px-3 py-2 border rounded-lg mb-4 h-24 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal({ open: false, requestId: null })}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}