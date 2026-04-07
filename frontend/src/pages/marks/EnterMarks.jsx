import { useState, useEffect } from 'react';
import { allocationsAPI, usersAPI, marksAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ClipboardDocumentListIcon, CalculatorIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState } from '../../components/common';

export default function EnterMarks() {
  const [allocations, setAllocations] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markType, setMarkType] = useState('cia1');
  const [maxMarks, setMaxMarks] = useState(25);

  const markTypes = [
    { value: 'cia1', label: 'CIA 1', max: 25 },
    { value: 'cia2', label: 'CIA 2', max: 25 },
    { value: 'cia3', label: 'CIA 3', max: 25 },
    { value: 'assignment', label: 'Assignment', max: 10 },
    { value: 'lab', label: 'Lab/Practical', max: 25 },
  ];

  useEffect(() => { fetchAllocations(); }, []);

  const fetchAllocations = async () => {
    try {
      const { data } = await allocationsAPI.getMyAllocations();
      setAllocations(data.data);
      if (data.data.length > 0) setSelectedAllocation(data.data[0]);
    } catch (error) { toast.error('Failed to load allocations'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedAllocation) fetchStudents();
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
      data.data.forEach(s => { initial[s._id] = ''; });
      setMarks(initial);
    } catch (error) { toast.error('Failed to load students'); }
    finally { setLoadingStudents(false); }
  };

  const handleMarkChange = (studentId, value) => {
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && numValue <= maxMarks)) {
      setMarks({ ...marks, [studentId]: value });
    }
  };

  const handleTypeChange = (type) => {
    setMarkType(type);
    const selected = markTypes.find(t => t.value === type);
    setMaxMarks(selected?.max || 25);
  };

  const calculateAttendanceMarks = async () => {
    try {
      await marksAPI.calculateAttendanceMarks(selectedAllocation.subject?._id);
      toast.success('Attendance marks calculated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to calculate attendance marks');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = Object.entries(marks)
        .filter(([, value]) => value !== '')
        .map(([studentId, value]) => ({
          student: studentId,
          marks: parseFloat(value),
        }));

      if (records.length === 0) {
        toast.error('Please enter at least one mark');
        setSubmitting(false);
        return;
      }

      await marksAPI.enter({
        subject: selectedAllocation.subject?._id,
        type: markType,
        maxMarks,
        records,
      });
      toast.success('Marks saved successfully');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save marks'); }
    finally { setSubmitting(false); }
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
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Enter Marks</h1>

      {/* Selection */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Mark Type</label>
            <select value={markType} onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {markTypes.map((t) => <option key={t.value} value={t.value}>{t.label} (Max: {t.max})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
            <input type="number" value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={calculateAttendanceMarks}
            className="flex items-center px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            <CalculatorIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Auto-Calculate </span>Attendance Marks
          </button>
          <p className="text-xs text-gray-500 mt-1">Uses attendance percentage to calculate marks based on configured slabs</p>
        </div>
      </div>

      {/* Students */}
      {loadingStudents ? (
        <LoadingSpinner text="Loading students..." />
      ) : students.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-gray-50">
            <span className="font-medium text-sm sm:text-base">{students.length} Students | Max Marks: {maxMarks}</span>
          </div>
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
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <input
                      type="number"
                      min="0"
                      max={maxMarks}
                      step="0.5"
                      value={marks[student._id]}
                      onChange={(e) => handleMarkChange(student._id, e.target.value)}
                      placeholder="0"
                      className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-center text-sm"
                    />
                    <span className="text-xs sm:text-sm text-gray-500">/ {maxMarks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 sm:p-4 border-t bg-gray-50">
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-2.5 sm:py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 text-sm sm:text-base">
              {submitting ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardDocumentListIcon}
          title="No Students Found"
          message="No students found for this class section. Ensure students are enrolled in this program, semester, and section."
        />
      )}
    </div>
  );
}
