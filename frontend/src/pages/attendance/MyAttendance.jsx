import { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { CalendarDaysIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function MyAttendance() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      const { data } = await attendanceAPI.getMyAttendance();
      setAttendance(data.data);
    } catch (error) { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const overall = attendance?.overall || { percentage: 0, present: 0, total: 0 };
  const bySubject = attendance?.bySubject || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>

      {/* Overall Stats */}
      <div className={`rounded-xl p-6 ${overall.percentage >= 75 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Attendance</p>
            <p className={`text-4xl font-bold ${overall.percentage >= 75 ? 'text-green-700' : 'text-red-700'}`}>
              {overall.percentage?.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {overall.present} / {overall.total} classes attended
            </p>
          </div>
          <div className={`p-4 rounded-full ${overall.percentage >= 75 ? 'bg-green-100' : 'bg-red-100'}`}>
            {overall.percentage >= 75 ? (
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            )}
          </div>
        </div>
        {overall.percentage < 75 && (
          <div className="mt-4 p-3 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800 font-medium">⚠️ Below 75% minimum requirement. Risk of detention.</p>
          </div>
        )}
      </div>

      {/* Subject-wise */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Subject-wise Attendance</h2>
        </div>
        <div className="divide-y">
          {bySubject.length > 0 ? bySubject.map((item) => (
            <div key={item.subject?._id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.subject?.name}</p>
                <p className="text-sm text-gray-500">{item.subject?.code}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                  </div>
                  <span className={`font-bold ${item.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.percentage?.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.present} / {item.total} classes</p>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              No attendance records yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
