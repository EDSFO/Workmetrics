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
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to WorkMetrics</h1>
        <p className="text-lg text-muted-foreground">
          Please login to access the application
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col">
      {/* AIDEV-NOTE: Page title - header is now in sidebar */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground hidden md:block">Time tracking for productive teams</p>
      </div>

      {/* Dashboard Summary Section */}
      <div className="mb-6 md:mb-8">
        {isLoadingDashboard ? (
          <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-gray-50">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
            {/* Today's Total */}
            <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-white">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Today&apos;s Hours</h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">
                {formatHoursMinutes(dashboardData?.todayTotal || 0)}
              </p>
            </div>

            {/* Week's Total */}
            <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-white">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">This Week</h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {formatHoursMinutes(dashboardData?.weekTotal || 0)}
              </p>
            </div>

            {/* Active Timer */}
            <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-white md:col-span-2 xl:col-span-1">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Active Timer</h3>
              {dashboardData?.activeTimer ? (
                <div>
                  <p className="text-lg font-semibold text-orange-600">
                    Running
                  </p>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {dashboardData.activeTimer.project?.name || 'No Project'}
                    {dashboardData.activeTimer.description && ` - ${dashboardData.activeTimer.description}`}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-400">Not Running</p>
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
            {showManualEntry ? 'Hide Manual Entry' : 'Add Manual Entry'}
          </button>
          <button
            onClick={() => {
              setShowTimesheet(!showTimesheet);
              setShowManualEntry(false);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm md:text-base"
          >
            {showTimesheet ? 'Hide Timesheet' : 'View Timesheet'}
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
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Recent Time Entries</h2>
        {isLoadingDashboard ? (
          <div className="p-4 md:p-6 border rounded-lg shadow-sm bg-gray-50">
            <p className="text-muted-foreground">Loading entries...</p>
          </div>
        ) : dashboardData?.recentEntries && dashboardData.recentEntries.length > 0 ? (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Description</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
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
            <p className="text-muted-foreground">No recent time entries found.</p>
          </div>
        )}
      </div>

      {/* Role-based menu - now shown as quick access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Common section - All authenticated users */}
        <div className="p-4 md:p-6 border rounded-lg shadow-sm">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">My Time Entries</h2>
          <p className="text-muted-foreground mb-3 md:mb-4 text-sm">
            Track and manage your time entries
          </p>
          <button className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            View My Entries
          </button>
        </div>

        {/* Admin only section */}
        {isAdmin() && (
          <>
            <div className="p-4 md:p-6 border rounded-lg shadow-sm border-red-200">
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-red-600">Admin Panel</h2>
              <p className="text-muted-foreground mb-3 md:mb-4 text-sm">
                Manage all users and system settings
              </p>
              <div className="space-y-2">
                <button className="block w-full text-left px-3 md:px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">
                  System Settings
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 border rounded-lg shadow-sm border-red-200">
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-red-600">All Users</h2>
              <p className="text-muted-foreground mb-3 md:mb-4 text-sm">
                View and manage all registered users
              </p>
              <button className="px-3 md:px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm inline-block">
                View All Users
              </button>
            </div>
          </>
        )}

        {/* Manager section - Admin can also access */}
        {isManager() && (
          <>
            <div className="p-4 md:p-6 border rounded-lg shadow-sm border-yellow-200">
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-yellow-600">Team Management</h2>
              <p className="text-muted-foreground mb-3 md:mb-4 text-sm">
                Manage your team members and their access
              </p>
              <button className="px-3 md:px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm inline-block">
                View Team Members
              </button>
            </div>

            <div className="p-4 md:p-6 border rounded-lg shadow-sm border-yellow-200">
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-yellow-600">Team Projects</h2>
              <p className="text-muted-foreground mb-3 md:mb-4 text-sm">
                View and manage team projects
              </p>
              <button className="px-3 md:px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm inline-block">
                View Projects
              </button>
            </div>
          </>
        )}

        {/* Projects section - All users can access their team's projects */}
        <div className="p-4 md:p-6 border rounded-lg shadow-sm">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Projects</h2>
          <p className="text-muted-foreground mb-3 md:mb-4 text-sm">
            View projects assigned to your team
          </p>
          <button className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm inline-block">
            View Projects
          </button>
        </div>

        {/* Reports section - All users can access reports */}
        <div className="p-4 md:p-6 border rounded-lg shadow-sm">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Reports</h2>
          <p className="text-muted-foreground mb-3 md:mb-4 text-sm">
            View and export time tracking reports
          </p>
          <button className="px-3 md:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm inline-block">
            View Reports
          </button>
        </div>
      </div>
    </main>
  );
}
