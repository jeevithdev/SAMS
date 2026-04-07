import { useState, useEffect } from 'react';
import { activitiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function PendingVerification() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const { data } = await activitiesAPI.getPendingVerification();
      setActivities(data.data);
    } catch (error) {
      toast.error('Failed to load pending activities');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (activityId, status) => {
    if (status === 'rejected' && !remarks.trim()) {
      toast.error('Please provide remarks for rejection');
      return;
    }

    setSubmitting(true);
    try {
      await activitiesAPI.verify(activityId, {
        status,
        remarks: remarks.trim() || undefined,
      });
      toast.success(`Activity ${status} successfully`);
      setSelectedActivity(null);
      setRemarks('');
      fetchPending();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update activity');
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pending Verification</h1>
        <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium">
          {activities.length} pending
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600">No activities pending verification</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {activities.map((activity) => (
            <div key={activity._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {activity.student?.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({activity.student?.email})
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{activity.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <DocumentTextIcon className="h-4 w-4" />
                      {activity.category?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                    {activity.organizer && <span>🏢 {activity.organizer}</span>}
                  </div>

                  {activity.certificates?.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {activity.certificates.map((cert, idx) => (
                        <a
                          key={idx}
                          href={`/api/uploads/${cert}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Certificate {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => setSelectedActivity(activity)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    Review
                  </button>
                </div>
              </div>

              {selectedActivity?._id === activity._id && (
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks (required for rejection)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Enter verification remarks..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => handleVerify(activity._id, 'verified')}
                      disabled={submitting}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Verify
                    </button>
                    <button
                      onClick={() => handleVerify(activity._id, 'rejected')}
                      disabled={submitting}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setSelectedActivity(null);
                        setRemarks('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
