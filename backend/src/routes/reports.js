const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles, ROLES } = require('../middleware/rbac');
const reportController = require('../controllers/reportController');

const router = express.Router();

// GET /api/reports/generate - Generate reports (Admin, HOD)
router.get('/generate', protect, authorize(ROLES.ADMIN, ROLES.HOD), reportController.generateReport);

// GET /api/reports/student-unified/:studentId - Unified student profile (Self, Mentor, HOD, Admin)
router.get('/student-unified/:studentId', 
  protect, 
  authorizeOwnerOrRoles(ROLES.ADMIN, ROLES.HOD, ROLES.STAFF), 
  reportController.getUnifiedProfile
);

// GET /api/reports/naac-attendance - NAAC attendance report (Admin)
router.get('/naac-attendance', protect, authorize(ROLES.ADMIN), reportController.getNaacAttendance);

// GET /api/reports/naac-activities - NAAC activities report (Admin)
router.get('/naac-activities', protect, authorize(ROLES.ADMIN), reportController.getNaacActivities);

// GET /api/reports/export/:type - Export report as PDF (Admin, HOD)
router.get('/export/:type', protect, authorize(ROLES.ADMIN, ROLES.HOD), reportController.exportReport);

module.exports = router;
