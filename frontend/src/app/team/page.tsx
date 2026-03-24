'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useAuthStore } from '@/lib/auth-context';
import Link from 'next/link';

// Types
interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;
  hourlyRate?: string;
  createdAt: string;
  updatedAt: string;
  todayHours?: number;
  weekHours?: number;
}

interface TeamInvitation {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format hours
function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function TeamPage() {
  const { user, isAdmin, isManager } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('USER');
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [teams, setTeams] = useState<{id: string; name: string}[]>([]);
  const [showTeamForm, setShowTeamForm] = useState<boolean>(false);
  const [teamName, setTeamName] = useState<string>('');
  const [isCreatingTeam, setIsCreatingTeam] = useState<boolean>(false);

  // Check if user can manage team
  const canManageTeam = isAdmin() || isManager();

  // Fetch team members
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/team/members');
      const users = response.data.users || [];

      // Fetch today's hours for each member if admin/manager
      if (canManageTeam && users.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const todayRes = await api.get(`/reports/daily-summary?date=${today}`);
        const dailyData = todayRes.data || {};

        // Calculate hours per user from daily summary
        const usersWithHours = users.map((member: TeamMember) => {
          const memberSummary = dailyData.users?.find((u: any) => u.userId === member.id);
          return {
            ...member,
            todayHours: memberSummary?.totalSeconds || 0,
            weekHours: 0, // Could add weekly fetch if needed
          };
        });
        setMembers(usersWithHours);
      } else {
        setMembers(users);
      }
    } catch (err: any) {
      console.error('Failed to fetch team members:', err);
      setError(err.response?.data?.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, [canManageTeam]);

  // Fetch teams (admin only)
  const fetchTeams = useCallback(async () => {
    if (!isAdmin()) return;
    try {
      const response = await api.get('/team/all');
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  }, [isAdmin]);

  // Initial fetch
  useEffect(() => {
    fetchMembers();
    fetchTeams();
  }, [fetchMembers, fetchTeams]);

  // Handle create team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTeam(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.post('/team', {
        name: teamName,
      });

      if (response.data.team) {
        setSuccessMessage('Team created successfully!');
        setTeams([...teams, response.data.team]);
        setShowTeamForm(false);
        setTeamName('');
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to create team:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Handle invite member
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError(null);
    setSuccessMessage(null);
    setInvitationLink(null);

    try {
      const response = await api.post('/team/invite', {
        email: inviteEmail,
        role: inviteRole,
      });

      if (response.data.invitation) {
        setInvitationLink(response.data.invitation.token);
        setSuccessMessage('Invitation created successfully!');
        setInviteEmail('');
        setInviteRole('USER');
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to invite member:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  // Handle change role
  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const response = await api.put(`/team/members/${memberId}/role`, {
        role: newRole,
      });

      if (response.data.user) {
        setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        setSuccessMessage('Role updated successfully!');
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to change role:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to change role');
    }
  };

  // Handle remove member
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      const response = await api.delete(`/team/members/${memberId}`);

      if (response.data.message) {
        setMembers(members.filter(m => m.id !== memberId));
        setSuccessMessage('Member removed successfully!');
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">Por favor, faça login</h1>
        <p className="text-lg text-muted-foreground">
          Você precisa fazer login para acessar esta página
        </p>
      </main>
    );
  }

  // Check if user has access
  if (!canManageTeam) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-lg text-muted-foreground">
          Você precisa ser gerente ou admin para ver esta página
        </p>
        <Link href="/" className="mt-4 text-blue-500 hover:underline">
          Voltar para home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-500 hover:underline">
              ← Voltar
            </Link>
            <h1 className="text-3xl font-bold">Gerenciamento de Equipe</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Gerencie membros da equipe e seus acessos
          </p>
        </div>
        {canManageTeam && (
          <div className="flex gap-2">
            {isAdmin() && (
              <button
                onClick={() => {
                  setShowTeamForm(true);
                  setSuccessMessage(null);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                + Nova Equipe
              </button>
            )}
            <button
              onClick={() => {
                setShowInviteForm(true);
                setInvitationLink(null);
                setSuccessMessage(null);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              + Convidar Membro
            </button>
          </div>
        )}
      </header>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="ml-4 text-green-500 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Create Team Form */}
      {showTeamForm && isAdmin() && (
        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4">Criar Nova Equipe</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Equipe *</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minha Nova Equipe"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreatingTeam}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
              >
                {isCreatingTeam ? 'Criando...' : 'Criar Equipe'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTeamForm(false);
                  setTeamName('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && canManageTeam && (
        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4">Convidar Novo Membro</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="colega@empresa.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Função</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isAdmin()}
              >
                <option value="USER">Usuário</option>
                <option value="MANAGER">Gerente</option>
                {isAdmin() && <option value="ADMIN">Admin</option>}
              </select>
              {!isAdmin() && (
                <p className="text-xs text-gray-500 mt-1">Apenas admins podem atribuir função de Gerente ou Admin</p>
              )}
            </div>

            {invitationLink && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-700 mb-2">✅ Convite Criado!</p>
                <p className="text-sm text-blue-600 mb-2">Compartilhe este token com o usuário convidado:</p>
                <code className="block p-2 bg-white border rounded text-sm font-mono break-all">
                  {invitationLink}
                </code>
                <p className="text-xs text-blue-500 mt-2">
                  O usuário precisa usar este token para se registrar em /register?token={invitationLink}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {!invitationLink && (
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isInviting ? 'Criando...' : 'Enviar Convite'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                  setInviteRole('USER');
                  setInvitationLink(null);
                  setError(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
              >
                {invitationLink ? 'Fechar' : 'Cancelar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Members List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Membros da Equipe</h2>
        {isLoading && (
          <div className="text-center py-8 text-gray-500">Carregando membros...</div>
        )}
        {!isLoading && members.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
            Nenhum membro encontrado. Convide seu primeiro membro!
          </div>
        )}
        {!isLoading && members.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoje</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desde</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.name}
                        {member.id === user.id && (
                          <span className="ml-2 text-xs text-gray-500">(Você)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManageTeam && member.id !== user.id ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="USER">Usuário</option>
                          <option value="MANAGER">Gerente</option>
                          {isAdmin() && <option value="ADMIN">Admin</option>}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.role === 'ADMIN'
                            ? 'bg-red-100 text-red-800'
                            : member.role === 'MANAGER'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {member.role === 'ADMIN' ? 'Admin' : member.role === 'MANAGER' ? 'Gerente' : 'Usuário'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManageTeam ? (
                        <span className={`text-sm font-medium ${
                          (member.todayHours || 0) > 0 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {formatHours(member.todayHours || 0)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canManageTeam && member.id !== user.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
