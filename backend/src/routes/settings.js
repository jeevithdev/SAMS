const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// GET /api/settings - Get institution settings (All authenticated)
router.get('/', protect, settingsController.getSettings);

// PUT /api/settings - Update institution settings (Admin)
router.put('/', protect, authorize(ROLES.ADMIN), settingsController.updateSettings);

// PUT /api/settings/attendance-slabs - Update attendance-to-marks slabs (Admin)
router.put('/attendance-slabs', protect, authorize(ROLES.ADMIN), settingsController.updateAttendanceSlabs);

module.exports = router;
