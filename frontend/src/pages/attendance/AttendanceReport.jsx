import { useState, useEffect } from 'react';
import { allocationsAPI, attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function AttendanceReport() {
  const [allocations, setAllocations] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllocations(); }, []);

  const fetchAllocations = async () => {
    try {
      const { data } = await allocationsAPI.getMyAllocations();
      setAllocations(data.data);
      if (data.data.length > 0) {
        setSelectedAllocation(data.data[0]);
      }
    } catch (error) { toast.error('Failed to load allocations'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedAllocation) { fetchReport(); }
  }, [selectedAllocation]);

  const fetchReport = async () => {
    try {
      const { data } = await attendanceAPI.getBySubject(selectedAllocation.subject?._id);
      setReport(data.data);
    } catch (error) { toast.error('Failed to load report'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const students = report?.students || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />Export
        </button>
      </div>

      {/* Selection */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <select value={selectedAllocation?._id || ''} onChange={(e) => setSelectedAllocation(allocations.find(a => a._id === e.target.value))}
          className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg">
          {allocations.map((a) => (
            <option key={a._id} value={a._id}>
              {a.subject?.name} ({a.subject?.code}) - Section {a.section}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{report.totalSessions || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg Attendance</p>
            <p className="text-2xl font-bold text-gray-900">{report.averageAttendance?.toFixed(1) || 0}%</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4">
            <p className="text-sm text-red-600">Below 75%</p>
            <p className="text-2xl font-bold text-red-700">{students.filter(s => s.percentage < 75).length}</p>
          </div>
        </div>
      )}

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student, idx) => (
              <tr key={student._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.registrationNumber || student.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">{student.present || 0}</td>
                <td className="px-6 py-4 text-sm text-red-600 font-medium">{student.absent || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{student.total || 0}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div className={`h-full rounded-full ${student.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(student.percentage || 0, 100)}%` }} />
                    </div>
                    <span className={`text-sm font-medium ${student.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                      {student.percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {student.percentage >= 75 ? 'Regular' : 'Defaulter'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="p-8 text-center text-gray-500">No attendance data available</div>
        )}
      </div>
    </div>
  );
}
