import { useState, useEffect } from 'react';
import { allocationsAPI, subjectsAPI, usersAPI, programsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';

export default function AllocationsManagement() {
  const [allocations, setAllocations] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ faculty: '', subject: '', section: 'A', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1) });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [allocRes, subjRes, usersRes, progRes] = await Promise.all([
        allocationsAPI.getAll(),
        subjectsAPI.getAll(),
        usersAPI.getAll({ role: 'staff' }),
        programsAPI.getAll()
      ]);
      setAllocations(allocRes.data.data);
      setSubjects(subjRes.data.data);
      setFaculty(usersRes.data.data);
      setPrograms(progRes.data.data);
    } catch (error) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await allocationsAPI.create(formData);
      toast.success('Allocation created');
      setShowModal(false);
      setFormData({ faculty: '', subject: '', section: 'A', academicYear: formData.academicYear });
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this allocation?')) return;
    try { await allocationsAPI.delete(id); toast.success('Allocation removed'); fetchData(); }
    catch (error) { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subject Allocations</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <PlusIcon className="h-5 w-5 mr-2" />Add Allocation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allocations.map((alloc) => (
              <tr key={alloc._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{alloc.faculty?.name}</p>
                      <p className="text-sm text-gray-500">{alloc.faculty?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{alloc.subject?.name}</p>
                  <p className="text-sm text-gray-500">{alloc.subject?.code}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{alloc.program?.name || alloc.subject?.program?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">Sem {alloc.semester || alloc.subject?.semester}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{alloc.section}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(alloc._id)} className="p-2 text-gray-400 hover:text-red-600">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {allocations.length === 0 && (
          <div className="p-8 text-center text-gray-500">No allocations found. Click "Add Allocation" to create one.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Add Allocation</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty *</label>
                <select required value={formData.faculty} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select Faculty</option>
                  {faculty.map((f) => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select Subject</option>
                  {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code}) - Sem {s.semester}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                  <select required value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    {['A','B','C','D','E'].map((s) => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <input type="text" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="2024-2025" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">Create Allocation</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
