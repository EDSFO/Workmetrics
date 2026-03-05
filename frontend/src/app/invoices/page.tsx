'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/auth-context';

// Types
interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail?: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
  status: string;
  notes?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  _count?: { entries: number };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newInvoice, setNewInvoice] = useState({
    clientName: '',
    clientEmail: '',
    periodStart: '',
    periodEnd: '',
    hourlyRate: 0,
    notes: '',
    dueDate: '',
  });

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data.invoices || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar faturas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCreateInvoice = async () => {
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post('/invoices', {
        clientName: newInvoice.clientName,
        clientEmail: newInvoice.clientEmail,
        periodStart: newInvoice.periodStart,
        periodEnd: newInvoice.periodEnd,
        hourlyRate: Number(newInvoice.hourlyRate) || undefined,
        notes: newInvoice.notes,
        dueDate: newInvoice.dueDate || undefined,
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSuccess(`Fatura ${response.data.invoice.number} criada com sucesso!`);
        setShowCreateModal(false);
        setNewInvoice({
          clientName: '',
          clientEmail: '',
          periodStart: '',
          periodEnd: '',
          hourlyRate: 0,
          notes: '',
          dueDate: '',
        });
        fetchInvoices();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar fatura');
    }
  };

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    setError(null);
    try {
      const response = await api.post(`/invoices/${invoiceId}/status`, { status });
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSuccess(response.data.message);
        fetchInvoices();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'SENT': return 'bg-blue-100 text-blue-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Rascunho';
      case 'SENT': return 'Enviada';
      case 'PAID': return 'Paga';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Faturas</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Nova Fatura
          </button>
        </div>

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
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-lg">{invoice.number}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </div>
                    <p className="font-medium">{invoice.clientName}</p>
                    {invoice.clientEmail && (
                      <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
                    )}
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span>Período: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {invoice._count?.entries || 0} entradas • {invoice.totalHours.toFixed(2)}h
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(Number(invoice.totalAmount))}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {formatDate(invoice.dueDate)}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2 justify-end">
                      {invoice.status === 'DRAFT' && (
                        <button
                          onClick={() => handleUpdateStatus(invoice.id, 'SENT')}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Enviar
                        </button>
                      )}
                      {invoice.status === 'SENT' && (
                        <button
                          onClick={() => handleUpdateStatus(invoice.id, 'PAID')}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Marcar como Paga
                        </button>
                      )}
                      {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
                        <button
                          onClick={() => handleUpdateStatus(invoice.id, 'CANCELLED')}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Criar Nova Fatura</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={newInvoice.clientName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email do Cliente</label>
                  <input
                    type="email"
                    value={newInvoice.clientEmail}
                    onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Data Início *</label>
                    <input
                      type="date"
                      value={newInvoice.periodStart}
                      onChange={(e) => setNewInvoice({ ...newInvoice, periodStart: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data Fim *</label>
                    <input
                      type="date"
                      value={newInvoice.periodEnd}
                      onChange={(e) => setNewInvoice({ ...newInvoice, periodEnd: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Taxa Horária (R$)</label>
                  <input
                    type="number"
                    value={newInvoice.hourlyRate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Se vazio, usa a taxa do perfil"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md h-20"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Criar Fatura
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
