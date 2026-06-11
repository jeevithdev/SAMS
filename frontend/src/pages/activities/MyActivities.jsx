import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activitiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function MyActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data } = await activitiesAPI.getMyActivities();
      setActivities(data.data);
    } catch (error) {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filter === 'all') return true;
    return act.verificationStatus === filter;
  });

  const stats = {
    total: activities.length,
    verified: activities.filter((a) => a.verificationStatus === 'verified').length,
    pending: activities.filter((a) => a.verificationStatus === 'pending').length,
    rejected: activities.filter((a) => a.verificationStatus === 'rejected').length,
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary-50 rounded-lg p-4">
          <p className="text-sm text-primary-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-primary-700">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-1">Verified</p>
          <p className="text-2xl font-bold text-green-900">{stats.verified}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'verified'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Verified ({stats.verified})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        <Link
          to="/student/activities/submit"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Submit Activity
        </Link>
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No activities yet' : `No ${filter} activities`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all'
              ? 'Start by submitting your first activity'
              : 'Try changing the filter'}
          </p>
          {filter === 'all' && (
            <Link
              to="/student/activities/submit"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Submit Your First Activity
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {filteredActivities.map((activity) => (
            <div key={activity._id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activity.title}
                    </h3>
                    {activity.verificationStatus === 'verified' && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                    {activity.verificationStatus === 'pending' && (
                      <ClockIcon className="h-5 w-5 text-yellow-600" />
                    )}
                    {activity.verificationStatus === 'rejected' && (
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{activity.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>📁 {activity.category?.name}</span>
                    <span>📅 {new Date(activity.date).toLocaleDateString()}</span>
                    {activity.duration && <span>⏱️ {activity.duration} days</span>}
                    {activity.organizer && <span>🏢 {activity.organizer}</span>}
                  </div>

                  {activity.verificationRemarks && (
                    <div
                      className={`mt-3 p-3 rounded-lg ${
                        activity.verificationStatus === 'rejected'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-green-50 border border-green-200'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Mentor Remarks:
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.verificationRemarks}
                      </p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
