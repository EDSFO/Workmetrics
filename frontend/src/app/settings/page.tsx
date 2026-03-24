'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, api } from '@/lib/auth-context';

type SettingsTab = 'profile' | 'team' | 'sso' | 'integrations' | 'gdpr' | 'audit' | 'api';

export default function SettingsPage() {
  const { user, isAdmin, isOwner } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // SSO state
  const [ssoProviders, setSsoProviders] = useState<any[]>([]);
  const [showSsoForm, setShowSsoForm] = useState(false);
  const [ssoFormData, setSsoFormData] = useState({
    type: 'oidc',
    name: '',
    config: {},
  });

  // Integration state
  const [integrations, setIntegrations] = useState<any[]>([]);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'sso') loadSsoProviders();
    if (activeTab === 'integrations') loadIntegrations();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  const loadSsoProviders = async () => {
    try {
      const res = await api.get('/sso/providers');
      setSsoProviders(res.data.providers || []);
    } catch (error) {
      console.error('Failed to load SSO providers:', error);
    }
  };

  const loadIntegrations = async () => {
    try {
      const res = await api.get('/integrations');
      setIntegrations(res.data.integrations || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/audit/logs?limit=50'),
        api.get('/audit/stats'),
      ]);
      setAuditLogs(logsRes.data.logs || []);
      setAuditStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.put('/users/profile', {
        name: profileData.name,
        email: profileData.email,
      });

      if (res.data.id || res.status === 200) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso' });
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Erro ao atualizar perfil' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erro ao atualizar perfil' });
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (profileData.newPassword !== profileData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem' });
      setLoading(false);
      return;
    }

    try {
      const res = await api.put('/users/password', {
        currentPassword: profileData.currentPassword,
        newPassword: profileData.newPassword,
      });

      if (res.data.id || res.status === 200) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso' });
        setProfileData({ ...profileData, currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Erro ao alterar senha' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erro ao alterar senha' });
    }
    setLoading(false);
  };

  const handleCreateSsoProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/sso/providers', ssoFormData);

      if (res.data.id || res.status === 201) {
        setMessage({ type: 'success', text: 'Provedor SSO criado' });
        setShowSsoForm(false);
        loadSsoProviders();
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Erro ao criar provedor' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erro ao criar provedor' });
    }
    setLoading(false);
  };

  const handleDeleteSsoProvider = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este provedor SSO?')) return;

    try {
      await api.delete(`/sso/providers/${id}`);
      loadSsoProviders();
    } catch (error) {
      console.error('Failed to delete SSO provider:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const tabs: { id: SettingsTab; label: string; icon: string; roles?: string[] }[] = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'team', label: 'Equipe', icon: '👥', roles: ['ADMIN', 'OWNER'] },
    { id: 'sso', label: 'SSO', icon: '🔐', roles: ['ADMIN', 'OWNER'] },
    { id: 'integrations', label: 'Integrações', icon: '🔗', roles: ['ADMIN', 'OWNER'] },
    { id: 'gdpr', label: 'Privacidade', icon: '🔒' },
    { id: 'audit', label: 'Auditoria', icon: '📋', roles: ['ADMIN', 'OWNER'] },
    { id: 'api', label: 'API', icon: '🔑', roles: ['ADMIN', 'OWNER'] },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.roles || (user && isAdmin));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta e configurações da equipe</p>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0">
          <nav className="space-y-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg border p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-4">Informações do Perfil</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Salvar Alterações
                  </button>
                </form>
              </div>

              <hr />

              <div>
                <h2 className="text-lg font-medium mb-4">Alterar Senha</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-1">Senha Atual</label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nova Senha</label>
                    <input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Alterar Senha
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (isAdmin || isOwner) && (
            <div>
              <h2 className="text-lg font-medium mb-4">Configurações de Equipe</h2>
              <p className="text-muted-foreground mb-4">
                Gerencie membros da equipe, funções e permissões na página Equipe.
              </p>
              <a href="/team" className="text-blue-600 hover:underline mt-2 inline-block font-medium">
                Ir para Gerenciamento de Equipe →
              </a>
            </div>
          )}

          {/* SSO Tab */}
          {activeTab === 'sso' && (isAdmin || isOwner) && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Provedores SSO</h2>
                <button
                  onClick={() => setShowSsoForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Adicionar
                </button>
              </div>

              {ssoProviders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg">
                  Nenhum provedor SSO configurado
                </div>
              ) : (
                <div className="space-y-4">
                  {ssoProviders.map((provider) => (
                    <div key={provider.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {provider.type?.toUpperCase()} • Função Padrão: {provider.defaultRole}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            provider.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {provider.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleDeleteSsoProvider(provider.id)}
                          className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showSsoForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">Adicionar Provedor SSO</h3>
                    <form onSubmit={handleCreateSsoProvider} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select
                          value={ssoFormData.type}
                          onChange={(e) => setSsoFormData({ ...ssoFormData, type: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="oidc">OIDC</option>
                          <option value="saml">SAML</option>
                          <option value="ldap">LDAP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <input
                          type="text"
                          value={ssoFormData.name}
                          onChange={(e) => setSsoFormData({ ...ssoFormData, name: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex gap-3 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowSsoForm(false)}
                          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Criar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (isAdmin || isOwner) && (
            <div>
              <h2 className="text-lg font-medium mb-4">Integrações</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Slack', icon: '💬', desc: 'Conecte com Slack para notificações' },
                  { name: 'Jira', icon: '📋', desc: 'Integração com Jira para gestão de tarefas' },
                  { name: 'Linear', icon: '📊', desc: 'Sincronize com Linear para ciclos' },
                ].map((integration) => (
                  <div key={integration.name} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{integration.icon}</span>
                      <h3 className="font-medium">{integration.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {integration.desc}
                    </p>
                    <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm transition-colors">
                      Configurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GDPR Tab */}
          {activeTab === 'gdpr' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-2">Privacidade (GDPR)</h2>
                <p className="text-muted-foreground mb-4">
                  Gerencie seus dados e configurações de privacidade em conformidade com o GDPR.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Exportar Meus Dados</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Baixe todos os seus dados pessoais em um formato portável.
                </p>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm transition-colors">
                  Solicitar Exportação
                </button>
              </div>

              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-medium mb-2 text-red-800">Excluir Minha Conta</h3>
                <p className="text-sm text-red-700 mb-4">
                  Exclua permanentemente sua conta e todos os dados associados.
                </p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors">
                  Excluir Conta
                </button>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (isAdmin || isOwner) && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Logs de Auditoria</h2>

              {auditStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-blue-600">Total de Eventos</p>
                    <p className="text-2xl font-bold text-blue-800">{auditStats.totalLogs}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-sm text-green-600">Período</p>
                    <p className="text-lg font-bold text-green-800">{auditStats.period?.days} dias</p>
                  </div>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                {auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Nenhum log de auditoria encontrado</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ação</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Recurso</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usuário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {auditLogs.slice(0, 20).map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{formatDate(log.createdAt)}</td>
                          <td className="px-4 py-3 text-sm font-mono text-blue-600">{log.action}</td>
                          <td className="px-4 py-3 text-sm">{log.resource}</td>
                          <td className="px-4 py-3 text-sm">{log.user?.name || 'Sistema'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* API Tab */}
          {activeTab === 'api' && (isAdmin || isOwner) && (
            <div>
              <h2 className="text-lg font-medium mb-4">Chaves de API</h2>
              <p className="text-muted-foreground mb-4">
                Gerencie chaves de API para integrações externas.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                + Gerar Nova Chave
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}