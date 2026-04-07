import { useState, useEffect } from 'react';
import { subjectsAPI, programsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function SubjectsManagement() {
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ program: '', semester: '' });
  const [formData, setFormData] = useState({ name: '', code: '', program: '', semester: '', credits: 3, type: 'theory' });

  useEffect(() => { fetchData(); }, [filters]);

  const fetchData = async () => {
    try {
      const [subjRes, progRes] = await Promise.all([
        subjectsAPI.getAll(filters),
        programsAPI.getAll()
      ]);
      setSubjects(subjRes.data.data);
      setPrograms(progRes.data.data);
    } catch (error) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await subjectsAPI.update(editing._id, formData); toast.success('Subject updated'); }
      else { await subjectsAPI.create(formData); toast.success('Subject created'); }
      setShowModal(false); setEditing(null); 
      setFormData({ name: '', code: '', program: '', semester: '', credits: 3, type: 'theory' }); 
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try { await subjectsAPI.delete(id); toast.success('Subject deleted'); fetchData(); }
    catch (error) { toast.error('Failed to delete'); }
  };

  const openEdit = (subj) => {
    setEditing(subj);
    setFormData({ 
      name: subj.name, code: subj.code, program: subj.program?._id || '', 
      semester: subj.semester, credits: subj.credits || 3, type: subj.type || 'theory' 
    });
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <button onClick={() => { setEditing(null); setFormData({ name: '', code: '', program: '', semester: '', credits: 3, type: 'theory' }); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <PlusIcon className="h-5 w-5 mr-2" />Add Subject
        </button>
      </div>

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
          <div className="text-sm text-gray-600 flex items-center">{subjects.length} subjects found</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subjects.map((subj) => (
              <tr key={subj._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <BookOpenIcon className="h-5 w-5 text-blue-600" />
                    <div><p className="font-medium text-gray-900">{subj.name}</p><p className="text-sm text-gray-500">{subj.code}</p></div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{subj.program?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">Sem {subj.semester}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${subj.type === 'lab' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {subj.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{subj.credits}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(subj)} className="p-2 text-gray-400 hover:text-primary-600"><PencilIcon className="h-5 w-5" /></button>
                  <button onClick={() => handleDelete(subj._id)} className="p-2 text-gray-400 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editing ? 'Edit' : 'Add'} Subject</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Database Management Systems" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., CS501" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                <select required value={formData.program} onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select Program</option>
                  {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                  <select required value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">-</option>
                    {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input type="number" min="1" max="6" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
