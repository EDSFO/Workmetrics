'use client';

import { useAuthStore, api } from '@/lib/auth-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Types
interface ProjectSummary {
  projectName: string;
  totalSeconds: number;
}

interface DaySummary {
  date: string;
  seconds: number;
}

interface SummaryData {
  startDate: string;
  endDate: string;
  totalSeconds: number;
  byProject: ProjectSummary[];
  byDay: DaySummary[];
}

interface DetailedEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  projectName: string;
  taskName: string;
  description: string;
  userName: string;
  userEmail: string;
}

interface DetailedData {
  startDate: string;
  endDate: string;
  totalSeconds: number;
  totalEntries: number;
  entries: DetailedEntry[];
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

// Format seconds to decimal hours
function formatHoursDecimal(seconds: number): string {
  return (seconds / 3600).toFixed(2);
}

// Format date for input
function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export default function ReportsPage() {
  const { user, logout } = useAuthStore();

  // Date range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Data state
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedData | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Set default dates on mount (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(formatDateForInput(today.toISOString()));
    setStartDate(formatDateForInput(thirtyDaysAgo.toISOString()));
  }, []);

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReports();
    }
  }, [startDate, endDate]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      // Fetch summary
      const summaryResponse = await api.get(`/reports/summary?${params}`);
      setSummaryData(summaryResponse.data);

      // Fetch detailed
      const detailedResponse = await api.get(`/reports/detailed?${params}`);
      setDetailedData(detailedResponse.data);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    const params = new URLSearchParams({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
    const token = useAuthStore.getState().token;

    try {
      const response = await fetch(`${API_URL}/reports/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `time-report-${startDate}-${endDate}.csv`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setError('Failed to export CSV. Please try again.');
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">WorkMetrics Reports</h1>
        <p className="text-lg text-muted-foreground">
          Please login to access reports
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">WorkMetrics</h1>
          <p className="text-muted-foreground">Reports & Analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Back to Dashboard
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Date Range Picker */}
      <div className="mb-6 bg-white p-4 border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Date Range</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="p-6 border rounded-lg shadow-sm bg-gray-50">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded ${
                activeTab === 'summary'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={`px-4 py-2 rounded ${
                activeTab === 'detailed'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Detailed
            </button>
          </div>

          {/* Summary Tab */}
          {activeTab === 'summary' && summaryData && (
            <div>
              {/* Total Hours */}
              <div className="mb-6 p-6 border rounded-lg shadow-sm bg-blue-50">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Hours</h3>
                <p className="text-4xl font-bold text-blue-600">
                  {formatHoursMinutes(summaryData.totalSeconds)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {summaryData.byProject.length} projects | {summaryData.byDay.length} days
                </p>
              </div>

              {/* By Project */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Hours by Project</h3>
                <div className="border rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summaryData.byProject.map((project, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {project.projectName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatHoursMinutes(project.totalSeconds)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {summaryData.totalSeconds > 0
                              ? ((project.totalSeconds / summaryData.totalSeconds) * 100).toFixed(1)
                              : 0}%
                          </td>
                        </tr>
                      ))}
                      {summaryData.byProject.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                            No data for this period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Day */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Hours by Day</h3>
                <div className="border rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summaryData.byDay.map((day, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatHoursMinutes(day.seconds)}
                          </td>
                        </tr>
                      ))}
                      {summaryData.byDay.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                            No data for this period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Tab */}
          {activeTab === 'detailed' && detailedData && (
            <div>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-lg shadow-sm bg-white">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Hours</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatHoursMinutes(detailedData.totalSeconds)}
                  </p>
                </div>
                <div className="p-4 border rounded-lg shadow-sm bg-white">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Entries</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {detailedData.totalEntries}
                  </p>
                </div>
                <div className="p-4 border rounded-lg shadow-sm bg-white">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Avg per Entry</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {detailedData.totalEntries > 0
                      ? formatHoursMinutes(Math.floor(detailedData.totalSeconds / detailedData.totalEntries))
                      : '0m'}
                  </p>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailedData.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.projectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.taskName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatHoursMinutes(entry.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.userName}
                        </td>
                      </tr>
                    ))}
                    {detailedData.entries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
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
    </main>
  );
}
