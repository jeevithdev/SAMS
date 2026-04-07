import { useState, useEffect, useMemo } from 'react';
import { subjectsAPI, programsAPI, subjectRequestsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState, Modal } from '../../components/common';

export default function HODSubjectsManagement() {
  const { user: currentUser } = useAuth();
  const hodDepartmentId = currentUser?.department?._id || currentUser?.department;
  
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' or 'requests'
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'modify', 'remove'
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [filters, setFilters] = useState({ program: '', semester: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    program: '',
    semester: '',
    credits: 3,
    type: 'theory',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [subjRes, progRes, reqRes] = await Promise.all([
        subjectsAPI.getAll(filters),
        programsAPI.getAll(),
        subjectRequestsAPI.getAll(),
      ]);
      
      setSubjects(subjRes.data.data);
      setPrograms(progRes.data.data);
      setRequests(reqRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter programs for HOD's department only
  const departmentPrograms = useMemo(() => {
    return programs.filter(p => 
      p.department?._id === hodDepartmentId || p.department === hodDepartmentId
    );
  }, [programs, hodDepartmentId]);

  // Filter subjects for HOD's department programs
  const departmentSubjects = useMemo(() => {
    const deptProgramIds = departmentPrograms.map(p => p._id);
    return subjects.filter(s => 
      deptProgramIds.includes(s.program?._id) || deptProgramIds.includes(s.program)
    );
  }, [subjects, departmentPrograms]);

  const openAddModal = () => {
    setModalType('add');
    setSelectedSubject(null);
    setFormData({
      name: '',
      code: '',
      program: departmentPrograms[0]?._id || '',
      semester: '',
      credits: 3,
      type: 'theory',
      reason: '',
    });
    setShowModal(true);
  };

  const openModifyModal = (subject) => {
    setModalType('modify');
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      program: subject.program?._id || subject.program,
      semester: subject.semester,
      credits: subject.credits || 3,
      type: subject.type || 'theory',
      reason: '',
    });
    setShowModal(true);
  };

  const openRemoveModal = (subject) => {
    setModalType('remove');
    setSelectedSubject(subject);
    setFormData({
      ...formData,
      reason: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for this request');
      return;
    }
    
    try {
      const requestData = {
        requestType: modalType,
        reason: formData.reason,
      };
      
      if (modalType === 'add' || modalType === 'modify') {
        requestData.subjectData = {
          name: formData.name,
          code: formData.code,
          program: formData.program,
          semester: parseInt(formData.semester),
          credits: parseInt(formData.credits),
          type: formData.type,
        };
      }
      
      if (modalType === 'modify' || modalType === 'remove') {
        requestData.existingSubject = selectedSubject._id;
      }
      
      await subjectRequestsAPI.create(requestData);
      toast.success('Request submitted for admin approval');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!confirm('Cancel this pending request?')) return;
    try {
      await subjectRequestsAPI.delete(id);
      toast.success('Request cancelled');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel request');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    if (type === 'add') return <PlusIcon className="h-5 w-5 text-green-600" />;
    if (type === 'modify') return <PencilIcon className="h-5 w-5 text-blue-600" />;
    return <TrashIcon className="h-5 w-5 text-red-600" />;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (loading) {
    return <LoadingSpinner text="Loading subjects..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Department Subjects</h1>
          <p className="text-sm text-gray-600">Manage subjects in your department with admin approval</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Request New Subject
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'subjects'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpenIcon className="h-5 w-5 inline-block mr-2" />
              Subjects ({departmentSubjects.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClockIcon className="h-5 w-5 inline-block mr-2" />
              My Requests ({requests.length})
              {pendingRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                  {pendingRequests.length} pending
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'subjects' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select
                value={filters.program}
                onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Programs</option>
                {departmentPrograms.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <select
                value={filters.semester}
                onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
              <div className="text-sm text-gray-600 flex items-center">
                {departmentSubjects.length} subjects found
              </div>
            </div>
          </div>

          {/* Subjects List */}
          {departmentSubjects.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {departmentSubjects.map((subj) => (
                  <div key={subj._id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <BookOpenIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <p className="font-medium text-gray-900 truncate">{subj.name}</p>
                        </div>
                        <p className="text-sm text-gray-500 ml-7">{subj.code}</p>
                        <div className="flex flex-wrap gap-2 mt-2 ml-7">
                          <span className="text-xs text-gray-600">{subj.program?.name}</span>
                          <span className="text-xs text-gray-600">Sem {subj.semester}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            subj.type === 'lab' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {subj.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        <button onClick={() => openModifyModal(subj)} className="p-2 text-gray-400 hover:text-blue-600">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => openRemoveModal(subj)} className="p-2 text-gray-400 hover:text-red-600">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {departmentSubjects.map((subj) => (
                        <tr key={subj._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <BookOpenIcon className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-900">{subj.name}</p>
                                <p className="text-sm text-gray-500">{subj.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{subj.program?.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">Sem {subj.semester}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              subj.type === 'lab' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {subj.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{subj.credits}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openModifyModal(subj)}
                              className="p-2 text-gray-400 hover:text-blue-600"
                              title="Request Modification"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openRemoveModal(subj)}
                              className="p-2 text-gray-400 hover:text-red-600"
                              title="Request Removal"
                            >
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
              icon={BookOpenIcon}
              title="No subjects found"
              message="No subjects in your department yet. Request to add new subjects."
              action={openAddModal}
              actionLabel="Request New Subject"
            />
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req._id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(req.requestType)}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 capitalize">
                            {req.requestType} Subject
                          </span>
                          {getStatusBadge(req.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {req.requestType === 'remove' && req.existingSubject
                            ? req.existingSubject.name
                            : req.subjectData?.name}
                          {req.subjectData?.code && ` (${req.subjectData.code})`}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Reason:</span> {req.reason}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                        {req.status !== 'pending' && req.reviewRemarks && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Admin remarks:</span> {req.reviewRemarks}
                          </p>
                        )}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteRequest(req._id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Cancel Request"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                    {req.status === 'approved' && (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    )}
                    {req.status === 'rejected' && (
                      <XCircleIcon className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClockIcon}
              title="No requests yet"
              message="You haven't submitted any subject requests yet."
              action={openAddModal}
              actionLabel="Request New Subject"
            />
          )}
        </>
      )}

      {/* Request Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalType === 'add' ? 'Request New Subject' :
          modalType === 'modify' ? 'Request Subject Modification' :
          'Request Subject Removal'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalType === 'remove' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                You are requesting to remove: <strong>{selectedSubject?.name}</strong> ({selectedSubject?.code})
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., Database Management Systems"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., CS501"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                <select
                  required
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Program</option>
                  {departmentPrograms.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">-</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Request *
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder={
                modalType === 'add' ? "Why should this subject be added? (e.g., curriculum update, industry demand)" :
                modalType === 'modify' ? "What changes are needed and why?" :
                "Why should this subject be removed?"
              }
            />
          </div>
          
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
              className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm text-white ${
                modalType === 'remove' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
