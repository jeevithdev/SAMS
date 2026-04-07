import { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Cog6ToothIcon, BuildingOfficeIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: '',
    institutionCode: '',
    academicYear: '',
    attendanceThreshold: 75,
    attendanceSlabs: [],
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setSettings(data.data);
      setFormData({
        institutionName: data.data.institutionName || '',
        institutionCode: data.data.institutionCode || '',
        academicYear: data.data.academicYear || '',
        attendanceThreshold: data.data.attendanceThreshold || 75,
        attendanceSlabs: data.data.attendanceSlabs || [
          { minPercentage: 95, maxPercentage: 100, marks: 10 },
          { minPercentage: 90, maxPercentage: 94, marks: 9 },
          { minPercentage: 85, maxPercentage: 89, marks: 8 },
          { minPercentage: 80, maxPercentage: 84, marks: 7 },
          { minPercentage: 75, maxPercentage: 79, marks: 6 },
          { minPercentage: 70, maxPercentage: 74, marks: 5 },
          { minPercentage: 0, maxPercentage: 69, marks: 0 },
        ],
      });
    } catch (error) { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(formData);
      toast.success('Settings saved successfully');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save settings'); }
    finally { setSaving(false); }
  };

  const updateSlab = (index, field, value) => {
    const newSlabs = [...formData.attendanceSlabs];
    newSlabs[index] = { ...newSlabs[index], [field]: parseInt(value) || 0 };
    setFormData({ ...formData, attendanceSlabs: newSlabs });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Institution Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institution Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Institution Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
              <input type="text" value={formData.institutionName} onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Government Engineering College" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Code</label>
              <input type="text" value={formData.institutionCode} onChange={(e) => setFormData({ ...formData, institutionCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., GEC001" />
            </div>
          </div>
        </div>

        {/* Academic Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <CalendarIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Academic Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Academic Year</label>
              <input type="text" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., 2024-2025" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Threshold (%)</label>
              <input type="number" min="0" max="100" value={formData.attendanceThreshold}
                onChange={(e) => setFormData({ ...formData, attendanceThreshold: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <p className="text-xs text-gray-500 mt-1">Students below this will be marked as defaulters</p>
            </div>
          </div>
        </div>

        {/* Attendance Slabs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <ChartBarIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Attendance-Based Marks Slabs</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Configure how attendance percentage converts to marks</p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Min %</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Max %</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {formData.attendanceSlabs.map((slab, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      <input type="number" min="0" max="100" value={slab.minPercentage}
                        onChange={(e) => updateSlab(idx, 'minPercentage', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" max="100" value={slab.maxPercentage}
                        onChange={(e) => updateSlab(idx, 'maxPercentage', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" max="20" value={slab.marks}
                        onChange={(e) => updateSlab(idx, 'marks', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
