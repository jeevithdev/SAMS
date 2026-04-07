import { useState, useEffect } from 'react';
import { activityCategoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';

export default function ActivityCategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', maxPoints: 10 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await activityCategoriesAPI.getAll();
      setCategories(data.data);
    } catch (error) { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await activityCategoriesAPI.update(editing._id, formData); toast.success('Category updated'); }
      else { await activityCategoriesAPI.create(formData); toast.success('Category created'); }
      setShowModal(false); setEditing(null); setFormData({ name: '', description: '', maxPoints: 10 }); fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await activityCategoriesAPI.delete(id); toast.success('Category deleted'); fetchData(); }
    catch (error) { toast.error('Failed to delete'); }
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setFormData({ name: cat.name, description: cat.description || '', maxPoints: cat.maxPoints || 10 });
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activity Categories</h1>
        <button onClick={() => { setEditing(null); setFormData({ name: '', description: '', maxPoints: 10 }); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <PlusIcon className="h-5 w-5 mr-2" />Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat._id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg"><TagIcon className="h-6 w-6 text-orange-600" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-2 text-gray-400 hover:text-primary-600"><PencilIcon className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(cat._id)} className="p-2 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
              </div>
            </div>
            {cat.maxPoints && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">Max Points: </span>
                <span className="font-medium text-gray-900">{cat.maxPoints}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editing ? 'Edit' : 'Add'} Category</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Hackathons" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} placeholder="Brief description of this category..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
                <input type="number" min="1" max="100" value={formData.maxPoints} onChange={(e) => setFormData({ ...formData, maxPoints: e.target.value })}
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
