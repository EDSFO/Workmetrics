'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-context';

interface TimeOffRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  hours: number;
  status: string;
  notes?: string;
  createdAt: string;
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
  { value: 'PTO', label: 'Paid Time Off (PTO)' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PARENTAL', label: 'Parental Leave' },
  { value: 'BEREAVEMENT', label: 'Bereavement' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function TimeOffPage() {
  const { user, isAdmin, isManager } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my-requests' | 'balances' | 'pending'>('my-requests');
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [balances, setBalances] = useState<TimeOffBalance[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
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
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [requestsRes, balancesRes] = await Promise.all([
        fetch('/api/time-off/my', { headers }),
        fetch('/api/time-off/balances', { headers }),
      ]);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(Array.isArray(data) ? data : []);
      }

      if (balancesRes.ok) {
        const data = await balancesRes.json();
        setBalances(Array.isArray(data) ? data : []);
      }

      if ((isAdmin || isManager) && activeTab === 'pending') {
        const pendingRes = await fetch('/api/time-off/pending', { headers });
        if (pendingRes.ok) {
          const data = await pendingRes.json();
          setPendingRequests(Array.isArray(data) ? data : []);
        }
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/time-off/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Time off request submitted successfully' });
        setShowRequestForm(false);
        setFormData({ type: 'PTO', startDate: '', endDate: '', hours: 8, notes: '' });
        loadData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit request' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/time-off/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/time-off/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Time Off</h1>
          <p className="text-muted-foreground">Manage your time off requests and balances</p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Request Time Off
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
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground'
          }`}
        >
          My Requests
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-2 px-1 ${
            activeTab === 'balances'
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground'
          }`}
        >
          Balances
        </button>
        {(isAdmin || isManager) && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2 px-1 ${
              activeTab === 'pending'
                ? 'border-b-2 border-primary font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Pending Approvals
          </button>
        )}
      </div>

      {/* My Requests Tab */}
      {activeTab === 'my-requests' && (
        <div className="bg-white rounded-lg border">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No time off requests yet
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Start Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">End Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3">
                      {TIME_OFF_TYPES.find((t) => t.value === request.type)?.label || request.type}
                    </td>
                    <td className="px-4 py-3">{formatDate(request.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(request.endDate)}</td>
                    <td className="px-4 py-3">{request.hours}h</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          STATUS_COLORS[request.status] || 'bg-gray-100'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-8 text-center">Loading...</div>
          ) : balances.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground">
              No time off policies configured
            </div>
          ) : (
            balances.map((balance) => (
              <div key={balance.policyType} className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">{balance.policyName}</h3>
                  {balance.isPaid && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Paid
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accrued</span>
                    <span>{balance.accrued}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span>{balance.used}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-yellow-600">{balance.pending}h</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span>Available</span>
                    <span className="text-green-600">{balance.available}h</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(100, (balance.used / balance.accrued) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Approvals Tab (Admin/Manager) */}
      {activeTab === 'pending' && (isAdmin || isManager) && (
        <div className="bg-white rounded-lg border">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No pending requests to approve
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Dates</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{request.user?.name}</p>
                        <p className="text-sm text-muted-foreground">{request.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {TIME_OFF_TYPES.find((t) => t.value === request.type)?.label || request.type}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </td>
                    <td className="px-4 py-3">{request.hours}h</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) handleReject(request.id, reason);
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Request Time Off</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {TIME_OFF_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
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
                <label className="block text-sm font-medium mb-1">Hours</label>
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
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}