import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  DocumentCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState } from '../../components/common';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await dashboardAPI.getAdminDashboard();
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
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: 'Departments',
      value: stats?.totalDepartments || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      link: '/admin/departments',
    },
    {
      title: 'Programs',
      value: stats?.totalPrograms || 0,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      link: '/admin/programs',
    },
    {
      title: 'Subjects',
      value: stats?.totalSubjects || 0,
      icon: BookOpenIcon,
      color: 'bg-yellow-500',
      link: '/admin/subjects',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Admin Dashboard</h1>
        <p className="text-red-100 text-sm sm:text-base">{stats?.institutionName || 'Student Activity Management System'}</p>
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
              <Link
                to={card.link}
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 sm:mt-3 inline-block"
              >
                Manage →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">User Breakdown by Role</h2>
          {stats?.usersByRole && Object.keys(stats.usersByRole).length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${
                      role === 'admin' ? 'bg-red-100' :
                      role === 'hod' ? 'bg-purple-100' :
                      role === 'staff' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <UserGroupIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        role === 'admin' ? 'text-red-600' :
                        role === 'hod' ? 'text-purple-600' :
                        role === 'staff' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <span className="font-medium text-gray-900 capitalize text-sm sm:text-base">{role}</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No users yet</p>
          )}
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">System Overview</h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-700">Total Activities</span>
              </div>
              <span className="font-bold text-gray-900">{stats?.totalActivities || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm text-gray-700">Verified Activities</span>
              </div>
              <span className="font-bold text-gray-900">{stats?.verifiedActivities || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                <span className="text-xs sm:text-sm text-gray-700">Pending Verification</span>
              </div>
              <span className="font-bold text-gray-900">{stats?.pendingActivities || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="text-xs sm:text-sm text-gray-700">Subject Allocations</span>
              </div>
              <span className="font-bold text-gray-900">{stats?.totalAllocations || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Departments */}
      {stats?.departments && stats.departments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Departments</h2>
            <Link to="/admin/departments" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {stats.departments.map((dept) => (
              <div key={dept._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-primary-500 transition">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{dept.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">{dept.code}</p>
                {dept.hod && (
                  <p className="text-xs text-gray-500">HOD: {dept.hod.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/admin/users"
            className="flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mb-1 sm:mb-2" />
            <span className="font-medium text-gray-700 text-xs sm:text-sm text-center">Manage Users</span>
          </Link>
          <Link
            to="/admin/allocations"
            className="flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mb-1 sm:mb-2" />
            <span className="font-medium text-gray-700 text-xs sm:text-sm text-center">Subject Allocations</span>
          </Link>
          <Link
            to="/admin/activity-categories"
            className="flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <DocumentCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mb-1 sm:mb-2" />
            <span className="font-medium text-gray-700 text-xs sm:text-sm text-center">Activity Categories</span>
          </Link>
          <Link
            to="/admin/settings"
            className="flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mb-1 sm:mb-2" />
            <span className="font-medium text-gray-700 text-xs sm:text-sm text-center">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
