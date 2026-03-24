'use client';

import { useAuthStore, UserRole, api } from '@/lib/auth-context';
import Timer from '@/components/Timer';
import ManualEntry from '@/components/ManualEntry';
import Timesheet from '@/components/Timesheet';
import { useState, useEffect } from 'react';

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

interface DashboardData {
  todayTotal: number;
  weekTotal: number;
  activeTimer: TimeEntry | null;
  recentEntries: TimeEntry[];
}

// Format seconds to hours and minutes
function formatHoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Home() {
  const { user, isAdmin, isManager } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(true);
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [showTimesheet, setShowTimesheet] = useState<boolean>(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/reports/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
      } finally {
        setIsLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, []);

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6 lg:p-24">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Bem-vindo ao WorkMetrics</h1>
        <p className="text-lg text-muted-foreground">
          Por favor, faça login para acessar a aplicação
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col">
      {/* AIDEV-NOTE: Page title - header is now in sidebar */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Painel</h1>
        <p className="text-muted-foreground hidden md:block">Rastreamento de tempo para equipes produtivas</p>
      </div>

      {/* Dashboard Summary Section */}
      <div className="mb-6 md:mb-8">
        {isLoadingDashboard ? (
          <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-gray-50">
            <p className="text-muted-foreground">Carregando painel...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
            {/* Today's Total */}
            <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-white">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Horas de Hoje</h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">
                {formatHoursMinutes(dashboardData?.todayTotal || 0)}
              </p>
            </div>

            {/* Week's Total */}
            <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-white">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Esta Semana</h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {formatHoursMinutes(dashboardData?.weekTotal || 0)}
              </p>
            </div>

            {/* Active Timer */}
            <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-white md:col-span-2 xl:col-span-1">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Timer Ativo</h3>
              {dashboardData?.activeTimer ? (
                <div>
                  <p className="text-lg font-semibold text-orange-600">
                    Em andamento
                  </p>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {dashboardData.activeTimer.project?.name || 'Sem Projeto'}
                    {dashboardData.activeTimer.description && ` - ${dashboardData.activeTimer.description}`}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-400">Não está rodando</p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 md:gap-4 mb-6">
          <button
            onClick={() => {
              setShowManualEntry(!showManualEntry);
              setShowTimesheet(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base"
          >
            {showManualEntry ? 'Ocultar Entrada Manual' : 'Adicionar Entrada Manual'}
          </button>
          <button
            onClick={() => {
              setShowTimesheet(!showTimesheet);
              setShowManualEntry(false);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm md:text-base"
          >
            {showTimesheet ? 'Ocultar Planilha' : 'Ver Planilha'}
          </button>
        </div>
      </div>

      {/* Manual Entry Section */}
      {showManualEntry && (
        <div className="mb-6 md:mb-8">
          <ManualEntry />
        </div>
      )}

      {/* Timesheet Section */}
      {showTimesheet && (
        <div className="mb-6 md:mb-8">
          <Timesheet />
        </div>
      )}

      {/* Recent Time Entries */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Entradas de Tempo Recentes</h2>
        {isLoadingDashboard ? (
          <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-gray-50">
            <p className="text-muted-foreground">Carregando entradas...</p>
          </div>
        ) : dashboardData?.recentEntries && dashboardData.recentEntries.length > 0 ? (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projeto</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarefa</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Descrição</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.startTime)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.project?.name || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.task?.name || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-900 hidden md:table-cell">
                        {entry.description || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.duration ? formatHoursMinutes(entry.duration) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-gray-50">
            <p className="text-muted-foreground">Nenhuma entrada de tempo recente encontrada.</p>
          </div>
        )}
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Timer Card */}
        <a href="/timer" className="p-4 md:p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Cronômetro</h2>
          </div>
          <p className="text-muted-foreground text-sm">Comece a rastrear tempo com o cronômetro</p>
        </a>

        {/* Calendar Card */}
        <a href="/calendar" className="p-4 md:p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Calendário</h2>
          </div>
          <p className="text-muted-foreground text-sm">Veja suas entradas de tempo no calendário</p>
        </a>

        {/* Reports Card */}
        <a href="/reports" className="p-4 md:p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Relatórios</h2>
          </div>
          <p className="text-muted-foreground text-sm">Veja e exporte relatórios de tempo</p>
        </a>

        {/* Time Off Card */}
        <a href="/time-off" className="p-4 md:p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Férias e Licenças</h2>
          </div>
          <p className="text-muted-foreground text-sm">Solicite e gerencie férias</p>
        </a>

        {/* Admin: Team Management */}
        {isManager() && (
          <a href="/team" className="p-4 md:p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow border-yellow-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Equipe</h2>
            </div>
            <p className="text-muted-foreground text-sm">Gerencie membros da equipe</p>
          </a>
        )}

        {/* Admin: Approvals */}
        {isAdmin() && (
          <a href="/approvals" className="p-4 md:p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Aprovações</h2>
            </div>
            <p className="text-muted-foreground text-sm">Revise aprovações pendentes</p>
          </a>
        )}

        {/* Admin: Settings */}
        {isAdmin() && (
          <a href="/settings" className="p-4 md:p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Configurações</h2>
            </div>
            <p className="text-muted-foreground text-sm">Configuração do sistema</p>
          </a>
        )}
      </div>
    </main>
  );
}
