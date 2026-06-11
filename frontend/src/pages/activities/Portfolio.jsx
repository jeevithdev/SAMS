import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { activitiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrophyIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export default function Portfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const { data } = await activitiesAPI.getPortfolio(user._id);
      setPortfolio(data.data);
    } catch (error) {
      toast.error('Failed to load portfolio');
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

  const activities = portfolio?.activities || [];
  const groupedByCategory = activities.reduce((acc, act) => {
    const cat = act.category?.name || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(act);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002045] to-[#0a2e61] rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-xl">
            <TrophyIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name}'s Portfolio</h1>
            <p className="text-blue-100/80">Verified Activities & Achievements</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm text-blue-100/80">Total Activities</p>
            <p className="text-2xl font-bold">{activities.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm text-blue-100/80">Categories</p>
            <p className="text-2xl font-bold">{Object.keys(groupedByCategory).length}</p>
          </div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verified Activities Yet</h3>
          <p className="text-gray-600">
            Your verified activities will appear here once approved by your mentor
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([category, acts]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                  {category}
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-sm">
                    {acts.length}
                  </span>
                </h2>
              </div>
              <div className="divide-y">
                {acts.map((activity) => (
                  <div key={activity._id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                          {activity.duration && <span>⏱️ {activity.duration} days</span>}
                          {activity.organizer && <span>🏢 {activity.organizer}</span>}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Verified ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
