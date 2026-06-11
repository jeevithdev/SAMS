import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  BookOpenIcon,
  DocumentCheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState } from '../../components/common';

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      console.log('Fetching staff dashboard...');
      const { data } = await dashboardAPI.getStaffDashboard();
      console.log('Staff dashboard data:', data);
      setStats(data.data);
    } catch (error) {
      console.error('Staff dashboard error:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard');
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  if (error) {
    return (
      <EmptyState
        icon={ChartBarIcon}
        title="Failed to Load Dashboard"
        message={error}
        action={{ label: 'Retry', onClick: () => { setLoading(true); fetchDashboard(); } }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#002045] to-[#0a2e61] rounded-xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Staff Dashboard</h1>
        <p className="text-blue-100/80 text-sm sm:text-base">Manage your subjects, attendance, and mentees</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Subjects</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.allocations?.count || 0}</p>
            </div>
            <div className="bg-[#002045] p-2 sm:p-3 rounded-lg flex-shrink-0">
              <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Mentees</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.mentees?.count || 0}</p>
            </div>
            <div className="bg-[#1a4971] p-2 sm:p-3 rounded-lg flex-shrink-0">
              <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.mentees?.pendingVerifications || 0}</p>
            </div>
            <div className="bg-[#3d6b99] p-2 sm:p-3 rounded-lg flex-shrink-0">
              <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <Link
            to="/staff/activities/pending"
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 sm:mt-3 inline-block"
          >
            Review →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Sessions Today</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.attendance?.sessionsToday || 0}</p>
            </div>
            <div className="bg-[#6b8bad] p-2 sm:p-3 rounded-lg flex-shrink-0">
              <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* My Subjects */}
      {stats?.allocations?.list && stats.allocations.list.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">My Subject Allocations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {stats.allocations.list.map((allocation) => (
              <div key={allocation._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-primary-500 transition">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{allocation.subject?.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">{allocation.subject?.code}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate">{allocation.subject?.program?.name || 'N/A'}</span>
                  <span>Section {allocation.section}</span>
                </div>
                <div className="mt-2 sm:mt-3 flex gap-2">
                  <Link
                    to={`/staff/attendance/mark?subject=${allocation.subject?._id}&section=${allocation.section}`}
                    className="flex-1 text-center text-xs bg-primary-50 text-primary-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded hover:bg-primary-100"
                  >
                    Attendance
                  </Link>
                  <Link
                    to={`/staff/marks/enter?subject=${allocation.subject?._id}&section=${allocation.section}`}
                    className="flex-1 text-center text-xs bg-primary-50 text-primary-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded hover:bg-primary-100"
                  >
                    Marks
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <EmptyState
            icon={BookOpenIcon}
            title="No Subject Allocations"
            message="You don't have any subjects allocated yet. Contact admin for subject allocation."
          />
        </div>
      )}

      {/* Recent Attendance Sessions */}
      {stats?.attendance?.recentSessions && stats.attendance.recentSessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Attendance Sessions</h2>
          <div className="space-y-2">
            {stats.attendance.recentSessions.map((session, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{session.subject?.name}</p>
                  <p className="text-xs text-gray-500">{session.subject?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Session {session.sessionNumber}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Defaulters Alert */}
      {stats?.attendance?.defaulterCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Attendance Defaulters</h3>
              <p className="mt-1 text-sm text-yellow-700">
                There are <strong>{stats.attendance.defaulterCount}</strong> students with attendance below threshold in your allocated subjects.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link
            to="/staff/attendance/mark"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">Mark Attendance</span>
          </Link>
          <Link
            to="/staff/marks/enter"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">Enter Marks</span>
          </Link>
          <Link
            to="/staff/activities/pending"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">Verify Activities</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
