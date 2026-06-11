import { useState, useEffect, useMemo } from 'react';
import { usersAPI, departmentsAPI, programsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState, Modal } from '../../components/common';

export default function UsersManagement({ userType }) {
  const { user: currentUser } = useAuth();
  const isHOD = currentUser?.role === 'hod';
  const hodDepartmentId = currentUser?.department?._id || currentUser?.department;
  
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Determine role and title based on userType
  const config = useMemo(() => {
    if (userType === 'hod') {
      return { role: 'hod', title: 'HOD Management' };
    } else if (userType === 'staff') {
      return { role: 'staff', title: isHOD ? 'Department Staff' : 'Staff Management' };
    } else if (userType === 'student') {
      return { role: 'student', title: isHOD ? 'Department Students' : 'Student Management' };
    } else {
      return { role: '', title: 'User Management' };
    }
  }, [userType, isHOD]);
  
  const [filters, setFilters] = useState({ 
    role: config.role || '', 
    department: isHOD ? hodDepartmentId : '', 
    search: '' 
  });
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: config.role || 'student',
    department: isHOD ? hodDepartmentId : '', 
    program: '', semester: '', section: '',
    employeeId: '', designation: '', registrationNumber: '',
  });

  // Reset filters and form when userType changes
  useEffect(() => {
    setLoading(true);
    setFilters({ 
      role: config.role || '', 
      department: isHOD ? hodDepartmentId : '', 
      search: '' 
    });
    setFormData(prev => ({
      ...prev,
      role: config.role || 'student',
      department: isHOD ? hodDepartmentId : '',
    }));
  }, [userType, config.role, isHOD, hodDepartmentId]);

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [filters.role, filters.department]);

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes, progsRes] = await Promise.all([
        usersAPI.getAll({ 
          role: filters.role, 
          department: isHOD ? hodDepartmentId : filters.department 
        }),
        departmentsAPI.getAll(),
        programsAPI.getAll(),
      ]);
      setUsers(usersRes.data.data);
      setDepartments(deptsRes.data.data);
      setPrograms(progsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter programs for HOD's department
  const availablePrograms = useMemo(() => {
    if (isHOD) {
      return programs.filter(p => p.department?._id === hodDepartmentId || p.department === hodDepartmentId);
    }
    return programs.filter(p => !formData.department || p.department?._id === formData.department || p.department === formData.department);
  }, [programs, isHOD, hodDepartmentId, formData.department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // For HOD, force their department
      if (isHOD) {
        submitData.department = hodDepartmentId;
      }
      
      // Add role-specific fields
      if (submitData.role === 'student') {
        submitData.studentFields = {
          program: submitData.program,
          currentSemester: parseInt(submitData.semester) || 1,
          section: submitData.section,
          registrationNumber: submitData.registrationNumber,
        };
      } else if (submitData.role === 'staff' || submitData.role === 'hod') {
        submitData.staffFields = {
          employeeId: submitData.employeeId,
          designation: submitData.designation,
        };
      }
      
      if (editingUser) {
        await usersAPI.update(editingUser._id, submitData);
        toast.success('User updated successfully');
      } else {
        await usersAPI.create(submitData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deactivated');
      fetchData();
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name, 
      email: user.email, 
      password: '',
      role: user.role, 
      department: user.department?._id || '',
      program: user.studentFields?.program?._id || user.studentFields?.program || '',
      semester: user.studentFields?.currentSemester || '',
      section: user.studentFields?.section || '',
      employeeId: user.staffFields?.employeeId || '',
      designation: user.staffFields?.designation || '',
      registrationNumber: user.studentFields?.registrationNumber || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '', email: '', password: '', 
      role: config.role || 'student',
      department: isHOD ? hodDepartmentId : '', 
      program: '', semester: '', section: '',
      employeeId: '', designation: '', registrationNumber: '',
    });
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    u.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  const roleColors = {
    admin: 'bg-primary-100 text-primary-700',
    hod: 'bg-primary-100 text-primary-600',
    staff: 'bg-primary-50 text-primary-600',
    student: 'bg-primary-50 text-primary-500',
  };

  // For HOD, get department name
  const hodDepartment = useMemo(() => {
    if (isHOD && hodDepartmentId) {
      return departments.find(d => d._id === hodDepartmentId);
    }
    return null;
  }, [isHOD, hodDepartmentId, departments]);

  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{config.title}</h1>
          {isHOD && hodDepartment && (
            <p className="text-sm text-gray-600">{hodDepartment.name}</p>
          )}
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm sm:text-base"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add {userType === 'hod' ? 'HOD' : userType === 'staff' ? 'Staff' : userType === 'student' ? 'Student' : 'User'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          {!isHOD && !userType && (
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hod">HOD</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
          )}
          {!isHOD && (
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          )}
          <div className="text-sm text-gray-600 flex items-center">
            {filteredUsers.length} users found
          </div>
        </div>
      </div>

      {/* Users - Cards on mobile, Table on desktop */}
      {filteredUsers.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div key={user._id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {user.department?.name && (
                      <p className="text-xs text-gray-500 mt-1">{user.department.name}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => openEdit(user)} className="p-2 text-gray-400 hover:text-primary-600">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(user._id)} className="p-2 text-gray-400 hover:text-red-600">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    {!isHOD && <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Department</th>}
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      {!isHOD && (
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                          {user.department?.name || '-'}
                        </td>
                      )}
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <button onClick={() => openEdit(user)} className="p-2 text-gray-400 hover:text-primary-600">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDelete(user._id)} className="p-2 text-gray-400 hover:text-red-600">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={UserGroupIcon}
          title="No users found"
          message={filters.search || filters.role || filters.department 
            ? "Try adjusting your filters to find users." 
            : "Get started by adding your first user."}
          action={() => { resetForm(); setShowModal(true); }}
          actionLabel="Add User"
        />
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingUser ? '(leave blank to keep)' : '*'}
            </label>
            <input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={!!userType || isHOD}
              >
                {isHOD ? (
                  <>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                  </>
                ) : (
                  <>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="hod">HOD</option>
                    <option value="admin">Admin</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              {isHOD ? (
                <input
                  type="text"
                  value={hodDepartment?.name || 'Your Department'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
                />
              ) : (
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value, program: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          {/* Staff/HOD specific fields */}
          {(formData.role === 'staff' || formData.role === 'hod') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., EMP001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., Associate Professor"
                />
              </div>
            </div>
          )}
          
          {/* Student specific fields */}
          {formData.role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Program</option>
                  {availablePrograms.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration No.</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g., 2024CS001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g., A"
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 text-sm"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
