const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const SubjectRequest = require('../models/SubjectRequest');
const Subject = require('../models/Subject');

// Get all subject requests (Admin sees all, HOD sees their own)
router.get('/', protect, authorize('admin', 'hod'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const requests = await SubjectRequest.find(query)
      .populate('subjectData.program', 'name')
      .populate('existingSubject', 'name code')
      .populate('requestedBy', 'name email')
      .populate('department', 'name')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create subject request (HOD only)
router.post('/', protect, authorize('hod'), async (req, res) => {
  try {
    const { requestType, subjectData, existingSubject, reason } = req.body;
    
    const request = await SubjectRequest.create({
      requestType,
      subjectData,
      existingSubject,
      reason,
      requestedBy: req.user._id,
      department: req.user.department
    });
    
    await request.populate([
      { path: 'subjectData.program', select: 'name' },
      { path: 'requestedBy', select: 'name email' },
      { path: 'department', select: 'name' }
    ]);
    
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Review subject request (Admin only)
router.put('/:id/review', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, reviewRemarks } = req.body;
    
    const request = await SubjectRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }
    
    // If approved, perform the action
    if (status === 'approved') {
      if (request.requestType === 'add') {
        await Subject.create(request.subjectData);
      } else if (request.requestType === 'modify' && request.existingSubject) {
        await Subject.findByIdAndUpdate(request.existingSubject, request.subjectData);
      } else if (request.requestType === 'remove' && request.existingSubject) {
        await Subject.findByIdAndDelete(request.existingSubject);
      }
    }
    
    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewRemarks = reviewRemarks;
    await request.save();
    
    await request.populate([
      { path: 'subjectData.program', select: 'name' },
      { path: 'existingSubject', select: 'name code' },
      { path: 'requestedBy', select: 'name email' },
      { path: 'department', select: 'name' },
      { path: 'reviewedBy', select: 'name' }
    ]);
    
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete pending request (HOD only for their own requests)
router.delete('/:id', protect, authorize('hod', 'admin'), async (req, res) => {
  try {
    const request = await SubjectRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (req.user.role === 'hod' && request.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only delete pending requests' });
    }
    
    await request.deleteOne();
    res.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
