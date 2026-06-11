import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState } from '../../components/common';

export default function HODDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await dashboardAPI.getHodDashboard();
      setStats(data.data);
    } catch (error) {
      setError('Failed to load dashboard');
      toast.error('Failed to load dashboard');
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
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Welcome, {stats?.user?.name}!</h1>
        <p className="text-blue-100/80 text-sm sm:text-base">Head of Department - {stats?.user?.department}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Students</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
            </div>
            <div className="bg-[#002045] p-2 sm:p-3 rounded-lg flex-shrink-0">
              <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Faculty</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalFaculty || 0}</p>
            </div>
            <div className="bg-[#1a4971] p-2 sm:p-3 rounded-lg flex-shrink-0">
              <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Defaulters</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.defaulters || 0}</p>
            </div>
            <div className="bg-red-500 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          {stats?.defaulters > 0 && (
            <Link
              to="/hod/defaulters"
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 sm:mt-3 inline-block"
            >
              View →
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Avg. %</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats?.averageAttendance?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="bg-[#3d6b99] p-2 sm:p-3 rounded-lg flex-shrink-0">
              <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Programs */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Programs Overview</h2>
          {stats?.programs && stats.programs.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {stats.programs.map((program) => (
                <div key={program._id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{program.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{program.code}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-base sm:text-lg font-bold text-gray-900">{program.studentCount || 0}</p>
                    <p className="text-xs text-gray-500">students</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">No programs yet</p>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Student Activities</h2>
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {stats.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity._id} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.student?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0 ${
                      activity.verificationStatus === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : activity.verificationStatus === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {activity.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">No recent activities</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link
            to="/hod/defaulters"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">View Defaulters</span>
          </Link>
          <Link
            to="/staff/attendance/report"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">Attendance Reports</span>
          </Link>
          <Link
            to="/hod/reports"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">NAAC Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
