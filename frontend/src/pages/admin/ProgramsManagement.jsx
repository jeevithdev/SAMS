import { useState, useEffect } from 'react';
import { programsAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

export default function ProgramsManagement() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', department: '', duration: 4 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [progRes, deptRes] = await Promise.all([programsAPI.getAll(), departmentsAPI.getAll()]);
      setPrograms(progRes.data.data);
      setDepartments(deptRes.data.data);
    } catch (error) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await programsAPI.update(editing._id, formData); toast.success('Program updated'); }
      else { await programsAPI.create(formData); toast.success('Program created'); }
      setShowModal(false); setEditing(null); setFormData({ name: '', code: '', department: '', duration: 4 }); fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this program?')) return;
    try { await programsAPI.delete(id); toast.success('Program deleted'); fetchData(); }
    catch (error) { toast.error('Failed to delete'); }
  };

  const openEdit = (prog) => {
    setEditing(prog);
    setFormData({ name: prog.name, code: prog.code, department: prog.department?._id || '', duration: prog.duration || 4 });
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
        <button onClick={() => { setEditing(null); setFormData({ name: '', code: '', department: '', duration: 4 }); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <PlusIcon className="h-5 w-5 mr-2" />Add Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((prog) => (
          <div key={prog._id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg"><AcademicCapIcon className="h-6 w-6 text-green-600" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{prog.name}</h3>
                  <p className="text-sm text-gray-500">{prog.code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(prog)} className="p-2 text-gray-400 hover:text-primary-600"><PencilIcon className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(prog._id)} className="p-2 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-gray-500">Department</p><p className="font-medium">{prog.department?.name}</p></div>
              <div><p className="text-gray-500">Duration</p><p className="font-medium">{prog.duration} years</p></div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editing ? 'Edit' : 'Add'} Program</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., B.Tech Computer Science" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., BTECH-CSE" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (years)</label>
                <input type="number" min="1" max="6" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
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
