import { useState, useEffect } from 'react';
import { attendanceAPI, programsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function Defaulters() {
  const [defaulters, setDefaulters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ program: '', semester: '' });

  useEffect(() => { fetchData(); }, [filters]);

  const fetchData = async () => {
    try {
      const [defRes, progRes] = await Promise.all([
        attendanceAPI.getDefaulters(filters),
        programsAPI.getAll()
      ]);
      setDefaulters(defRes.data.data);
      setPrograms(progRes.data.data);
    } catch (error) { toast.error('Failed to load defaulters'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-xl">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Defaulters</h1>
            <p className="text-sm text-gray-600">Students below 75% attendance threshold</p>
          </div>
        </div>
        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold text-lg">
          {defaulters.length} Defaulters
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={filters.program} onChange={(e) => setFilters({ ...filters, program: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">All Programs</option>
            {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      {/* Defaulters List */}
      {defaulters.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Attendance %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Shortage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {defaulters.map((student, idx) => (
                <tr key={student._id} className="hover:bg-red-50/50">
                  <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.registrationNumber || student.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {student.program?.name}<br/>
                    <span className="text-xs">Sem {student.semester} - Sec {student.section}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-red-600">{student.percentage?.toFixed(1)}%</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600 font-medium">
                    -{(75 - student.percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <a href={`mailto:${student.email}`} className="p-2 text-gray-400 hover:text-primary-600">
                        <EnvelopeIcon className="h-5 w-5" />
                      </a>
                      {student.phone && (
                        <a href={`tel:${student.phone}`} className="p-2 text-gray-400 hover:text-primary-600">
                          <PhoneIcon className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">No Defaulters!</h3>
          <p className="text-green-700">All students are meeting the 75% attendance requirement</p>
        </div>
      )}
    </div>
  );
}
