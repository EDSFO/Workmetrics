'use client';

import { useState, useEffect } from 'react';
import { api, useAuthStore } from '@/lib/auth-context';

interface TenantSettings {
  name: string;
  logo: string;
  primaryColor: string;
  customDomain: string;
  timezone: string;
}

export default function TenantSettingsPage() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<TenantSettings>({
    name: '',
    logo: '',
    primaryColor: '#3B82F6',
    customDomain: '',
    timezone: 'America/Sao_Paulo',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/tenants/current');
      if (response.data) {
        setSettings({
          name: response.data.name || '',
          logo: response.data.logo || '',
          primaryColor: response.data.primaryColor || '#3B82F6',
          customDomain: response.data.customDomain || '',
          timezone: response.data.timezone || 'America/Sao_Paulo',
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await api.put('/tenants/settings', settings);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erro ao salvar configurações' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações da Organização</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Nome da Organização */}
        <div>
          <label className="block text-sm font-medium mb-1">Nome da Organização</label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium mb-1">URL do Logo</label>
          <input
            type="url"
            value={settings.logo}
            onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
            placeholder="https://exemplo.com/logo.png"
            className="w-full px-3 py-2 border rounded-lg"
          />
          {settings.logo && (
            <div className="mt-2">
              <img src={settings.logo} alt="Logo preview" className="h-16 object-contain" />
            </div>
          )}
        </div>

        {/* Cor Principal */}
        <div>
          <label className="block text-sm font-medium mb-1">Cor Principal</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              className="w-12 h-12 cursor-pointer rounded"
            />
            <input
              type="text"
              value={settings.primaryColor}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              className="px-3 py-2 border rounded-lg w-32"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">Esta cor será usada na interface</p>
        </div>

        {/* Domínio Personalizado */}
        <div>
          <label className="block text-sm font-medium mb-1">Domínio Personalizado</label>
          <input
            type="text"
            value={settings.customDomain}
            onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
            placeholder="app.suaempresa.com"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Configure um CNAME no seu DNS apontando para este domínio
          </p>
        </div>

        {/* Fuso Horário */}
        <div>
          <label className="block text-sm font-medium mb-1">Fuso Horário</label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
            <option value="America/Manaus">Manaus (GMT-4)</option>
            <option value="America/Recife">Recife (GMT-3)</option>
            <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
            <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  );
}