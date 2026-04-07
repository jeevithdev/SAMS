import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  DocumentCheckIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState } from '../../components/common';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await dashboardAPI.getStudentDashboard();
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

  const statCards = [
    {
      title: 'Total Activities',
      value: stats?.activities?.total || 0,
      icon: DocumentCheckIcon,
      color: 'bg-blue-500',
      link: '/student/activities',
    },
    {
      title: 'Verified',
      value: stats?.activities?.verified || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Pending',
      value: stats?.activities?.pending || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Rejected',
      value: stats?.activities?.rejected || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 sm:p-6 text-white">
        <h1 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">Welcome Back, {stats?.user?.name}!</h1>
        <p className="text-primary-100 text-sm sm:text-base">
          {stats?.user?.program} - Semester {stats?.user?.semester} - Section {stats?.user?.section}
        </p>
        {stats?.user?.mentor && (
          <p className="text-xs sm:text-sm text-primary-200 mt-1 sm:mt-2">
            Mentor: {stats?.user?.mentor?.name}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-start sm:items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{card.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.color} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            {card.link && (
              <Link to={card.link} className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 sm:mt-3 inline-block">
                View All →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Attendance & Marks Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Attendance */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Attendance Overview</h2>
            <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Overall Attendance</span>
              <span className={`text-base sm:text-lg font-bold ${
                (stats?.attendance?.percentage || 0) >= 75 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats?.attendance?.percentage?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Classes Attended</span>
              <span className="font-medium">{stats?.attendance?.present || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Total Classes</span>
              <span className="font-medium">{stats?.attendance?.total || 0}</span>
            </div>
            {(stats?.attendance?.percentage || 0) < 75 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                <p className="text-xs sm:text-sm text-red-800 font-medium">⚠️ Below 75% requirement</p>
              </div>
            )}
          </div>
          <Link
            to="/student/attendance"
            className="block text-center text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium mt-3 sm:mt-4"
          >
            View Detailed Attendance →
          </Link>
        </div>

        {/* Marks */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Marks Overview</h2>
            <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Total Marks</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">
                {stats?.marks?.totalObtained || 0} / {stats?.marks?.totalMaximum || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Average Percentage</span>
              <span className="font-medium">{stats?.marks?.averagePercentage?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Subjects Graded</span>
              <span className="font-medium">{stats?.marks?.subjectsCount || 0}</span>
            </div>
          </div>
          <Link
            to="/student/marks"
            className="block text-center text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium mt-3 sm:mt-4"
          >
            View Detailed Marks →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link
            to="/student/activities/submit"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">Submit Activity</span>
          </Link>
          <Link
            to="/student/portfolio"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">View Portfolio</span>
          </Link>
          <Link
            to="/student/attendance"
            className="flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700 text-sm">Check Attendance</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
