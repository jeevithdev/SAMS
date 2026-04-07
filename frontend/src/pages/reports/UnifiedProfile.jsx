import { useState, useEffect } from 'react';
import { attendanceAPI, marksAPI, activitiesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  UserCircleIcon, AcademicCapIcon, ClockIcon,
  ChartBarIcon, TrophyIcon, CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function UnifiedProfile() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      const [attRes, marksRes, actRes] = await Promise.all([
        attendanceAPI.getMyAttendance({}),
        marksAPI.getMyConsolidated(),
        activitiesAPI.getMyPortfolio()
      ]);
      setAttendance(attRes.data.data);
      setMarks(marksRes.data.data);
      setActivities(actRes.data.data);
    } catch (error) { toast.error('Failed to load profile data'); }
    finally { setLoading(false); }
  };

  const calculateOverallGrade = () => {
    if (!marks.length) return 'N/A';
    const avg = marks.reduce((sum, m) => sum + (m.percentage || 0), 0) / marks.length;
    if (avg >= 90) return 'O';
    if (avg >= 80) return 'A+';
    if (avg >= 70) return 'A';
    if (avg >= 60) return 'B+';
    if (avg >= 50) return 'B';
    return 'C';
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const overallAttendance = attendance?.overall?.percentage || 0;
  const verifiedActivities = activities.filter(a => a.status === 'verified').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white/20 rounded-full">
            <UserCircleIcon className="h-16 w-16" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-primary-100">{user?.email}</p>
            <div className="flex gap-4 mt-2 text-sm text-primary-200">
              <span>Reg: {user?.registrationNumber || 'N/A'}</span>
              <span>•</span>
              <span>{user?.program?.name || 'Program'}</span>
              <span>•</span>
              <span>Sem {user?.semester} - Sec {user?.section}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance</p>
              <p className={`text-2xl font-bold ${overallAttendance >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {overallAttendance.toFixed(1)}%
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-primary-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overall Grade</p>
              <p className="text-2xl font-bold text-primary-600">{calculateOverallGrade()}</p>
            </div>
            <AcademicCapIcon className="h-10 w-10 text-primary-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Activities</p>
              <p className="text-2xl font-bold text-primary-600">{verifiedActivities}</p>
            </div>
            <TrophyIcon className="h-10 w-10 text-primary-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Subjects</p>
              <p className="text-2xl font-bold text-primary-600">{marks.length}</p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-primary-200" />
          </div>
        </div>
      </div>

      {/* Attendance by Subject */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-primary-600" /> Attendance by Subject
        </h2>
        {attendance?.subjects?.length > 0 ? (
          <div className="space-y-3">
            {attendance.subjects.map((sub) => (
              <div key={sub.subject?._id} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{sub.subject?.name}</p>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${sub.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${sub.percentage}%` }} />
                  </div>
                </div>
                <span className={`text-sm font-bold ${sub.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {sub.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No attendance data available</p>
        )}
      </div>

      {/* Marks Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AcademicCapIcon className="h-5 w-5 text-primary-600" /> Academic Performance
        </h2>
        {marks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marks.map((m) => (
              <div key={m.subject?._id} className="border rounded-lg p-4 hover:border-primary-300">
                <p className="font-medium text-gray-900">{m.subject?.name}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-500">Total: {m.total || 0}</span>
                  <span className={`font-bold ${m.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {(m.percentage || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No marks data available</p>
        )}
      </div>

      {/* Activities */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-primary-600" /> Verified Activities ({verifiedActivities})
        </h2>
        {activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.filter(a => a.status === 'verified').slice(0, 6).map((act) => (
              <div key={act._id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <CheckBadgeIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{act.title}</p>
                  <p className="text-sm text-gray-600">{act.category?.name} • {new Date(act.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No verified activities yet</p>
        )}
      </div>
    </div>
  );
}
