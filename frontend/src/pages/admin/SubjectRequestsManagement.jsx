import { useState, useEffect } from 'react';
import { subjectRequestsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner, EmptyState, Modal } from '../../components/common';

export default function SubjectRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: '', reviewRemarks: '' });
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await subjectRequestsAPI.getAll(params);
      setRequests(res.data.data);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (request, action) => {
    setSelectedRequest(request);
    setReviewData({ status: action, reviewRemarks: '' });
    setShowModal(true);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await subjectRequestsAPI.review(selectedRequest._id, reviewData);
      toast.success(`Request ${reviewData.status}`);
      setShowModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review request');
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'add') return <PlusIcon className="h-5 w-5 text-green-600" />;
    if (type === 'modify') return <PencilIcon className="h-5 w-5 text-blue-600" />;
    return <TrashIcon className="h-5 w-5 text-red-600" />;
  };

  const getTypeBadge = (type) => {
    const styles = {
      add: 'bg-green-100 text-green-700',
      modify: 'bg-blue-100 text-blue-700',
      remove: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
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

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return <LoadingSpinner text="Loading requests..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Subject Requests</h1>
          <p className="text-sm text-gray-600">Review subject requests from HODs</p>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
            {pendingCount} pending request{pendingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setLoading(true); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req._id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getTypeIcon(req.requestType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {req.requestType} Subject Request
                      </span>
                      {getTypeBadge(req.requestType)}
                      {getStatusBadge(req.status)}
                    </div>
                    
                    {/* Subject Details */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      {req.requestType === 'remove' && req.existingSubject ? (
                        <p className="text-sm text-gray-700">
                          <BookOpenIcon className="h-4 w-4 inline mr-1" />
                          {req.existingSubject.name} ({req.existingSubject.code})
                        </p>
                      ) : (
                        <>
                          <p className="font-medium text-gray-900">
                            {req.subjectData?.name} ({req.subjectData?.code})
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {req.subjectData?.program?.name} | Semester {req.subjectData?.semester} | 
                            {req.subjectData?.credits} credits | {req.subjectData?.type}
                          </p>
                        </>
                      )}
                    </div>
                    
                    {/* Reason */}
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Reason:</span> {req.reason}
                    </p>
                    
                    {/* Request Info */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>From: {req.requestedBy?.name} ({req.department?.name})</span>
                      <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Review Info (if reviewed) */}
                    {req.status !== 'pending' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reviewed by:</span> {req.reviewedBy?.name} on {new Date(req.reviewedAt).toLocaleDateString()}
                        </p>
                        {req.reviewRemarks && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Remarks:</span> {req.reviewRemarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => openReviewModal(req, 'approved')}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <CheckIcon className="h-5 w-5 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => openReviewModal(req, 'rejected')}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      <XMarkIcon className="h-5 w-5 mr-1" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClockIcon}
          title="No requests found"
          message={filter === 'pending' 
            ? "No pending subject requests at the moment."
            : "No subject requests match your filter."}
        />
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={reviewData.status === 'approved' ? 'Approve Request' : 'Reject Request'}
      >
        <form onSubmit={handleReview} className="space-y-4">
          {selectedRequest && (
            <div className={`p-4 rounded-lg ${
              reviewData.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${reviewData.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                You are about to <strong>{reviewData.status === 'approved' ? 'approve' : 'reject'}</strong> the request to{' '}
                <strong>{selectedRequest.requestType}</strong> subject:{' '}
                <strong>
                  {selectedRequest.requestType === 'remove' 
                    ? selectedRequest.existingSubject?.name 
                    : selectedRequest.subjectData?.name}
                </strong>
              </p>
              {reviewData.status === 'approved' && selectedRequest.requestType !== 'remove' && (
                <p className="text-xs text-green-600 mt-2">
                  This will create/update the subject in the system.
                </p>
              )}
              {reviewData.status === 'approved' && selectedRequest.requestType === 'remove' && (
                <p className="text-xs text-red-600 mt-2">
                  Warning: This will permanently delete the subject from the system.
                </p>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks (optional)
            </label>
            <textarea
              rows={3}
              value={reviewData.reviewRemarks}
              onChange={(e) => setReviewData({ ...reviewData, reviewRemarks: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Add any comments or feedback for the HOD..."
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
              className={`flex-1 py-2 rounded-lg text-sm text-white ${
                reviewData.status === 'approved' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirm {reviewData.status === 'approved' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
