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

export default function HODDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await dashboardAPI.getHodDashboard();
      setStats(data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome, {stats?.user?.name}!</h1>
        <p className="text-purple-100">Head of Department - {stats?.user?.department}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Faculty</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalFaculty || 0}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance Defaulters</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.defaulters || 0}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          {stats?.defaulters > 0 && (
            <Link
              to="/hod/defaulters"
              className="text-sm text-red-600 hover:text-red-700 font-medium mt-3 inline-block"
            >
              View Defaulters →
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg. Attendance</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.averageAttendance?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programs */}
        {stats?.programs && stats.programs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Programs Overview</h2>
            <div className="space-y-3">
              {stats.programs.map((program) => (
                <div key={program._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{program.name}</p>
                    <p className="text-sm text-gray-600">{program.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{program.studentCount || 0}</p>
                    <p className="text-xs text-gray-500">students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {stats?.recentActivities && stats.recentActivities.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Student Activities</h2>
            <div className="space-y-3">
              {stats.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <DocumentCheckIcon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.student?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
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
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/hod/defaulters"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <ExclamationTriangleIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">View Defaulters</span>
          </Link>
          <Link
            to="/staff/attendance/report"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <ChartBarIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">Attendance Reports</span>
          </Link>
          <Link
            to="/hod/reports"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <DocumentCheckIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">NAAC Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
