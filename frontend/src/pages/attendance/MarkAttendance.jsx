import { useState, useEffect } from 'react';
import { allocationsAPI, usersAPI, attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState } from '../../components/common';

export default function MarkAttendance() {
  const [allocations, setAllocations] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState(1);

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
    if (selectedAllocation) { fetchStudents(); }
  }, [selectedAllocation]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data } = await usersAPI.getStudentsByClass(
        selectedAllocation.program?._id || selectedAllocation.subject?.program,
        selectedAllocation.semester || selectedAllocation.subject?.semester,
        selectedAllocation.section
      );
      setStudents(data.data);
      const initial = {};
      data.data.forEach(s => { initial[s._id] = 'present'; });
      setAttendance(initial);
    } catch (error) { toast.error('Failed to load students'); }
    finally { setLoadingStudents(false); }
  };

  const toggleAttendance = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student: studentId,
        status,
      }));

      await attendanceAPI.mark({
        subject: selectedAllocation.subject?._id,
        date,
        period,
        records,
      });
      toast.success('Attendance marked successfully');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to mark attendance'); }
    finally { setSubmitting(false); }
  };

  const statusColors = {
    present: 'bg-green-100 text-green-700 border-green-300',
    absent: 'bg-red-100 text-red-700 border-red-300',
    late: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    od: 'bg-blue-100 text-blue-700 border-blue-300',
  };

  const statusIcons = {
    present: '✓',
    absent: '✗',
    late: '⏱',
    od: 'OD',
  };

  if (loading) return <LoadingSpinner text="Loading allocations..." />;

  if (allocations.length === 0) {
    return (
      <EmptyState
        icon={ExclamationCircleIcon}
        title="No Subject Allocations"
        message="You don't have any subjects allocated to you. Contact admin to get subjects assigned."
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mark Attendance</h1>

      {/* Selection */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select value={selectedAllocation?._id || ''} onChange={(e) => setSelectedAllocation(allocations.find(a => a._id === e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {allocations.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.subject?.name} - Sec {a.section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select value={period} onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {[1,2,3,4,5,6,7,8].map((p) => <option key={p} value={p}>Period {p}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => markAll('present')} className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm hover:bg-green-200">
              <span className="hidden sm:inline">All </span>Present
            </button>
            <button onClick={() => markAll('absent')} className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm hover:bg-red-200">
              <span className="hidden sm:inline">All </span>Absent
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      {loadingStudents ? (
        <LoadingSpinner text="Loading students..." />
      ) : students.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Stats Header */}
          <div className="p-3 sm:p-4 border-b bg-gray-50">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="font-medium text-sm sm:text-base">{students.length} Students</span>
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <span className="hidden sm:inline">Present:</span> {Object.values(attendance).filter(s => s === 'present').length}
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  <span className="hidden sm:inline">Absent:</span> {Object.values(attendance).filter(s => s === 'absent').length}
                </span>
                <span className="text-yellow-600 flex items-center gap-1">
                  <span className="hidden sm:inline">Late:</span> {Object.values(attendance).filter(s => s === 'late').length}
                </span>
                <span className="text-blue-600 flex items-center gap-1">
                  <span className="hidden sm:inline">OD:</span> {Object.values(attendance).filter(s => s === 'od').length}
                </span>
              </div>
            </div>
          </div>

          {/* Student Rows */}
          <div className="divide-y">
            {students.map((student, idx) => (
              <div key={student._id} className="p-3 sm:p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="w-6 sm:w-8 text-xs sm:text-sm text-gray-500 flex-shrink-0">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{student.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{student.registrationNumber || student.email}</p>
                    </div>
                  </div>
                  {/* Desktop: Full buttons */}
                  <div className="hidden sm:flex gap-2">
                    {['present', 'absent', 'late', 'od'].map((status) => (
                      <button key={status} onClick={() => toggleAttendance(student._id, status)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${
                          attendance[student._id] === status ? statusColors[status] : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                        }`}>
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {/* Mobile: Compact buttons */}
                  <div className="flex sm:hidden gap-1">
                    {['present', 'absent', 'late', 'od'].map((status) => (
                      <button key={status} onClick={() => toggleAttendance(student._id, status)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold border transition flex items-center justify-center ${
                          attendance[student._id] === status ? statusColors[status] : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}>
                        {statusIcons[status]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="p-3 sm:p-4 border-t bg-gray-50">
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-2.5 sm:py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 text-sm sm:text-base">
              {submitting ? 'Submitting...' : 'Submit Attendance'}
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CalendarIcon}
          title="No Students Found"
          message="No students found for this class section. Ensure students are enrolled in this program, semester, and section."
        />
      )}
    </div>
  );
}
