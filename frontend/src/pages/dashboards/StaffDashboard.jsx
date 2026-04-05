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
} from '@heroicons/react/24/outline';

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await dashboardAPI.getStaffDashboard();
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome, {stats?.user?.name}!</h1>
        <p className="text-blue-100">{stats?.user?.department}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Allocated Subjects</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.allocations || 0}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Mentee Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.mentees || 0}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Verifications</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.pendingActivities || 0}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <Link
            to="/staff/activities/pending"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-3 inline-block"
          >
            Review Now →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Classes Held Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.classesToday || 0}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* My Subjects */}
      {stats?.subjects && stats.subjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Subject Allocations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.subjects.map((subject) => (
              <div key={subject._id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition">
                <h3 className="font-semibold text-gray-900 mb-1">{subject.subject?.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{subject.subject?.code}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{subject.program?.name}</span>
                  <span>Sem {subject.semester}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/staff/attendance/mark?subject=${subject.subject?._id}`}
                    className="flex-1 text-center text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100"
                  >
                    Attendance
                  </Link>
                  <Link
                    to={`/staff/marks/enter?subject=${subject.subject?._id}`}
                    className="flex-1 text-center text-xs bg-green-50 text-green-700 px-3 py-2 rounded hover:bg-green-100"
                  >
                    Marks
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/staff/attendance/mark"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <CalendarDaysIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">Mark Attendance</span>
          </Link>
          <Link
            to="/staff/marks/enter"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <DocumentCheckIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">Enter Marks</span>
          </Link>
          <Link
            to="/staff/activities/pending"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <ClockIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">Verify Activities</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
