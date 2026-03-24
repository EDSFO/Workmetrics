'use client';

import { useAuthStore, api } from '@/lib/auth-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalSeconds: number;
  totalBillable: number;
  entryCount: number;
}

interface DaySummary {
  date: string;
  totalSeconds: number;
  billableSeconds: number;
  entryCount: number;
}

interface UserSummary {
  userId: string;
  userName: string;
  totalSeconds: number;
  totalBillable: number;
  entryCount: number;
}

interface SummaryData {
  startDate: string;
  endDate: string;
  totalSeconds: number;
  byProject: ProjectSummary[];
  byDay: DaySummary[];
  byUser: UserSummary[];
}

interface DetailedEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  projectName: string;
  taskName: string;
  description: string | null;
  userName: string;
  userEmail: string;
  billable: boolean;
}

interface DetailedData {
  startDate: string;
  endDate: string;
  totalSeconds: number;
  totalEntries: number;
  entries: DetailedEntry[];
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  projectIds: string[];
  taskIds: string[];
  billable: boolean | null;
}

function formatHoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDateForInput(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0];
}

export default function ReportsPage() {
  const { user, logout, isManager } = useAuthStore();

  const [filters, setFilters] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    projectIds: [],
    taskIds: [],
    billable: null,
  });

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedData | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'by-user'>('summary');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setFilters(prev => ({
      ...prev,
      startDate: formatDateForInput(thirtyDaysAgo.toISOString()),
      endDate: formatDateForInput(today.toISOString()),
    }));
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchReports();
      fetchProjects();
    }
  }, [filters.startDate, filters.endDate]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate: new Date(filters.startDate).toISOString(),
        endDate: new Date(filters.endDate).toISOString(),
      });

      const summaryResponse = await api.get(`/reports/summary?${params}`);
      setSummaryData(summaryResponse.data);

      const detailedResponse = await api.get(`/reports/detailed?${params}`);
      setDetailedData(detailedResponse.data);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
    const token = useAuthStore.getState().token;

    try {
      const params = new URLSearchParams({
        startDate: new Date(filters.startDate).toISOString(),
        endDate: new Date(filters.endDate).toISOString(),
      });

      const response = await fetch(`${API_URL}/reports/export/csv?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-report-${filters.startDate}-${filters.endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setError('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
    const token = useAuthStore.getState().token;

    try {
      const params = new URLSearchParams({
        startDate: new Date(filters.startDate).toISOString(),
        endDate: new Date(filters.endDate).toISOString(),
      });

      const response = await fetch(`${API_URL}/reports/export/pdf?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-report-${filters.startDate}-${filters.endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setError('Failed to export PDF');
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">WorkMetrics Reports</h1>
        <p className="text-lg text-muted-foreground">Please login to access reports</p>
      </main>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Time tracking analytics and exports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Billable</label>
            <select
              value={filters.billable === null ? '' : filters.billable.toString()}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                billable: e.target.value === '' ? null : e.target.value === 'true'
              }))}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All</option>
              <option value="true">Billable Only</option>
              <option value="false">Non-billable Only</option>
            </select>
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'summary' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'
              }`}
            >
              By Project
            </button>
            <button
              onClick={() => setActiveTab('by-user')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'by-user' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'
              }`}
            >
              By User
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'detailed' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'
              }`}
            >
              Detailed
            </button>
          </div>

          {/* Summary Cards */}
          {summaryData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg p-6 border">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-3xl font-bold">{formatHoursMinutes(summaryData.totalSeconds)}</p>
              </div>
              <div className="bg-card rounded-lg p-6 border">
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-3xl font-bold">{summaryData.byProject.length}</p>
              </div>
              <div className="bg-card rounded-lg p-6 border">
                <p className="text-sm text-muted-foreground">Days</p>
                <p className="text-3xl font-bold">{summaryData.byDay.length}</p>
              </div>
            </div>
          )}

          {/* By Project */}
          {activeTab === 'summary' && summaryData && (
            <div className="bg-card rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Billable</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Entries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summaryData.byProject.map((project, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="px-6 py-4 font-medium">{project.projectName}</td>
                        <td className="px-6 py-4">{formatHoursMinutes(project.totalSeconds)}</td>
                        <td className="px-6 py-4 text-green-600">{formatHoursMinutes(project.totalBillable)}</td>
                        <td className="px-6 py-4">{project.entryCount}</td>
                        <td className="px-6 py-4">
                          {summaryData.totalSeconds > 0
                            ? ((project.totalSeconds / summaryData.totalSeconds) * 100).toFixed(1)
                            : 0}%
                        </td>
                      </tr>
                    ))}
                    {summaryData.byProject.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No data for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* By User */}
          {activeTab === 'by-user' && summaryData && (
            <div className="bg-card rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Billable</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Entries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summaryData.byUser.map((userItem, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="px-6 py-4 font-medium">{userItem.userName}</td>
                        <td className="px-6 py-4">{formatHoursMinutes(userItem.totalSeconds)}</td>
                        <td className="px-6 py-4 text-green-600">{formatHoursMinutes(userItem.totalBillable)}</td>
                        <td className="px-6 py-4">{userItem.entryCount}</td>
                        <td className="px-6 py-4">
                          {summaryData.totalSeconds > 0
                            ? ((userItem.totalSeconds / summaryData.totalSeconds) * 100).toFixed(1)
                            : 0}%
                        </td>
                      </tr>
                    ))}
                    {summaryData.byUser.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No data for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed */}
          {activeTab === 'detailed' && detailedData && (
            <div className="bg-card rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Duration</th>
                      {isManager() && <th className="px-4 py-3 text-left text-xs font-medium uppercase">User</th>}
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Billable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {detailedData.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(entry.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{entry.projectName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{entry.taskName}</td>
                        <td className="px-4 py-3 text-sm">{formatHoursMinutes(entry.duration || 0)}</td>
                        {isManager() && <td className="px-4 py-3 text-sm">{entry.userName}</td>}
                        <td className="px-4 py-3 text-sm">
                          {entry.billable ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Yes</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {detailedData.entries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          No entries found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
