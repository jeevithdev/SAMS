import { useState, useEffect } from 'react';
import { allocationsAPI, marksAPI, programsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function MarksReport() {
  const { user } = useAuth();
  const isHOD = user?.role === 'hod';
  const [allocations, setAllocations] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '', program: '', semester: '', section: ''
  });

  useEffect(() => { fetchInitial(); }, []);

  const fetchInitial = async () => {
    try {
      if (isHOD) {
        const { data } = await programsAPI.getAll();
        setPrograms(data.data);
      } else {
        const { data } = await allocationsAPI.getMyAllocations();
        setAllocations(data.data);
        if (data.data.length > 0) {
          setFilters(f => ({ ...f, subject: data.data[0].subject?._id }));
        }
      }
    } catch (error) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (filters.subject || (isHOD && filters.program)) fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    try {
      const params = {};
      if (filters.subject) params.subject = filters.subject;
      if (filters.program) params.program = filters.program;
      if (filters.semester) params.semester = filters.semester;
      if (filters.section) params.section = filters.section;
      const { data } = await marksAPI.getReport(params);
      setReport(data.data);
    } catch (error) { toast.error('Failed to load report'); }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'O';
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B+';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const getGradeColor = (grade) => {
    if (['O', 'A+'].includes(grade)) return 'text-green-600 bg-green-50';
    if (['A', 'B+'].includes(grade)) return 'text-blue-600 bg-blue-50';
    if (['B', 'C'].includes(grade)) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const exportToCSV = () => {
    const headers = ['#', 'Name', 'Reg No', 'CIA 1', 'CIA 2', 'CIA 3', 'Assignment', 'Lab', 'Attendance', 'Total', '%', 'Grade'];
    const rows = report.map((r, i) => [
      i + 1, r.student?.name, r.student?.registrationNumber || '',
      r.cia1?.marks ?? '-', r.cia2?.marks ?? '-', r.cia3?.marks ?? '-',
      r.assignment?.marks ?? '-', r.lab?.marks ?? '-', r.attendance?.marks ?? '-',
      r.total || 0, (r.percentage || 0).toFixed(1), getGrade(r.percentage || 0)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'marks_report.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marks Report</h1>
        <button onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isHOD ? (
            <>
              <select value={filters.program} onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Select Program</option>
                {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </>
          ) : (
            <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg">
              {allocations.map((a) => (
                <option key={a._id} value={a.subject?._id}>
                  {a.subject?.name} - Sec {a.section}
                </option>
              ))}
            </select>
          )}
          <select value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">All Sections</option>
            {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
      </div>

      {/* Report Table */}
      {report.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CIA 1</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CIA 2</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CIA 3</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assign</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lab</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attend</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.map((row, idx) => {
                const grade = getGrade(row.percentage || 0);
                return (
                  <tr key={row.student?._id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.student?.name}</p>
                      <p className="text-xs text-gray-500">{row.student?.registrationNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{row.cia1?.marks ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-sm">{row.cia2?.marks ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-sm">{row.cia3?.marks ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-sm">{row.assignment?.marks ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-sm">{row.lab?.marks ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-sm">{row.attendance?.marks ?? '-'}</td>
                    <td className="px-4 py-3 text-center font-bold">{row.total || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-sm font-bold ${getGradeColor(grade)}`}>{grade}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select filters to view marks report</p>
        </div>
      )}
    </div>
  );
}
