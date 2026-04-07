import { useState, useEffect } from 'react';
import { marksAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { AcademicCapIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function MyMarks() {
  const [marksData, setMarksData] = useState([]);
  const [consolidated, setConsolidated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('detailed');

  useEffect(() => { fetchMarks(); }, []);

  const fetchMarks = async () => {
    try {
      const [detailRes, consRes] = await Promise.all([
        marksAPI.getMyMarks(),
        marksAPI.getMyConsolidated()
      ]);
      setMarksData(detailRes.data.data);
      setConsolidated(consRes.data.data);
    } catch (error) { toast.error('Failed to load marks'); }
    finally { setLoading(false); }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'O', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 70) return { grade: 'A', color: 'text-blue-600' };
    if (percentage >= 60) return { grade: 'B+', color: 'text-blue-600' };
    if (percentage >= 50) return { grade: 'B', color: 'text-yellow-600' };
    if (percentage >= 40) return { grade: 'C', color: 'text-yellow-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Marks</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('detailed')}
            className={`px-4 py-2 rounded-lg ${view === 'detailed' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>
            Detailed
          </button>
          <button onClick={() => setView('consolidated')}
            className={`px-4 py-2 rounded-lg ${view === 'consolidated' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>
            Consolidated
          </button>
        </div>
      </div>

      {view === 'detailed' ? (
        <div className="space-y-4">
          {marksData.length > 0 ? marksData.map((subject) => (
            <div key={subject._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-primary-50 border-b">
                <h3 className="font-semibold text-primary-900">{subject.subject?.name}</h3>
                <p className="text-sm text-primary-600">{subject.subject?.code}</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {['cia1', 'cia2', 'cia3', 'assignment', 'lab', 'attendance'].map((type) => (
                    <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        {type === 'cia1' ? 'CIA 1' : type === 'cia2' ? 'CIA 2' : type === 'cia3' ? 'CIA 3' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {subject[type]?.marks ?? '-'}
                        {subject[type]?.maxMarks && <span className="text-sm text-gray-500">/{subject[type].maxMarks}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <AcademicCapIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No marks available yet</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {consolidated.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">%</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {consolidated.map((item) => {
                  const { grade, color } = getGrade(item.percentage || 0);
                  return (
                    <tr key={item.subject?._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{item.subject?.name}</p>
                        <p className="text-sm text-gray-500">{item.subject?.code}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold">{item.total || 0}</span>
                        <span className="text-sm text-gray-500">/{item.maxTotal || 100}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold">{(item.percentage || 0).toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-2xl font-bold ${color}`}>{grade}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No consolidated marks available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
