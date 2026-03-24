'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-context';

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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sso/providers', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSsoProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to load SSO providers:', error);
    }
  };

  const loadIntegrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integrations', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const [logsRes, statsRes] = await Promise.all([
        fetch('/api/audit/logs?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/audit/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setAuditStats(data);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (profileData.newPassword !== profileData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setProfileData({ ...profileData, currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
    setLoading(false);
  };

  const handleCreateSsoProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sso/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ssoFormData),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'SSO provider created' });
        setShowSsoForm(false);
        loadSsoProviders();
      } else {
        setMessage({ type: 'error', text: 'Failed to create SSO provider' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
    setLoading(false);
  };

  const handleDeleteSsoProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SSO provider?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sso/providers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadSsoProviders();
      }
    } catch (error) {
      console.error('Failed to delete SSO provider:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const tabs: { id: SettingsTab; label: string; roles?: string[] }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'team', label: 'Team', roles: ['ADMIN', 'OWNER'] },
    { id: 'sso', label: 'SSO', roles: ['ADMIN', 'OWNER'] },
    { id: 'integrations', label: 'Integrations', roles: ['ADMIN', 'OWNER'] },
    { id: 'gdpr', label: 'Privacy (GDPR)' },
    { id: 'audit', label: 'Audit Logs', roles: ['ADMIN', 'OWNER'] },
    { id: 'api', label: 'API Keys', roles: ['ADMIN', 'OWNER'] },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.roles || (user && isAdmin));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and team settings</p>
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

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {tab.label}
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
                <h2 className="text-lg font-medium mb-4">Profile Information</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Save Changes
                  </button>
                </form>
              </div>

              <hr />

              <div>
                <h2 className="text-lg font-medium mb-4">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Change Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (isAdmin || isOwner) && (
            <div>
              <h2 className="text-lg font-medium mb-4">Team Settings</h2>
              <p className="text-muted-foreground">
                Manage team members, roles, and permissions from the Team page.
              </p>
              <a href="/team" className="text-primary hover:underline mt-2 inline-block">
                Go to Team Management →
              </a>
            </div>
          )}

          {/* SSO Tab */}
          {activeTab === 'sso' && (isAdmin || isOwner) && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">SSO Providers</h2>
                <button
                  onClick={() => setShowSsoForm(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Add Provider
                </button>
              </div>

              {ssoProviders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No SSO providers configured
                </div>
              ) : (
                <div className="space-y-4">
                  {ssoProviders.map((provider) => (
                    <div key={provider.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Type: {provider.type.toUpperCase()} • Default Role: {provider.defaultRole}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            provider.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {provider.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => handleDeleteSsoProvider(provider.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showSsoForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">Add SSO Provider</h3>
                    <form onSubmit={handleCreateSsoProvider} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
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
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          value={ssoFormData.name}
                          onChange={(e) => setSsoFormData({ ...ssoFormData, name: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowSsoForm(false)}
                          className="px-4 py-2 border rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                        >
                          Create
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
              <h2 className="text-lg font-medium mb-4">Integrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Slack', 'Jira', 'Linear'].map((integration) => (
                  <div key={integration} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">{integration}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect with {integration} for enhanced workflow
                    </p>
                    <button className="px-4 py-2 border rounded-lg hover:bg-muted text-sm">
                      Configure
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
                <h2 className="text-lg font-medium mb-2">Privacy (GDPR)</h2>
                <p className="text-muted-foreground mb-4">
                  Manage your data and privacy settings in compliance with GDPR.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Export Your Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download all your personal data in a portable format.
                </p>
                <button className="px-4 py-2 border rounded-lg hover:bg-muted text-sm">
                  Request Data Export
                </button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Delete Your Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data.
                </p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (isAdmin || isOwner) && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Audit Logs</h2>

              {auditStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">{auditStats.totalLogs}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="text-lg font-medium">{auditStats.period?.days} days</p>
                  </div>
                </div>
              )}

              <div className="border rounded-lg">
                {auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No audit logs found</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Timestamp</th>
                        <th className="px-4 py-2 text-left text-sm">Action</th>
                        <th className="px-4 py-2 text-left text-sm">Resource</th>
                        <th className="px-4 py-2 text-left text-sm">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {auditLogs.slice(0, 20).map((log: any) => (
                        <tr key={log.id}>
                          <td className="px-4 py-2 text-sm">{formatDate(log.createdAt)}</td>
                          <td className="px-4 py-2 text-sm font-mono">{log.action}</td>
                          <td className="px-4 py-2 text-sm">{log.resource}</td>
                          <td className="px-4 py-2 text-sm">{log.user?.name || 'System'}</td>
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
              <h2 className="text-lg font-medium mb-4">API Keys</h2>
              <p className="text-muted-foreground mb-4">
                Manage API keys for external integrations.
              </p>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Generate API Key
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}