const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard/student - Student dashboard (Student)
router.get('/student', protect, authorize(ROLES.STUDENT), dashboardController.getStudentDashboard);

// GET /api/dashboard/staff - Staff dashboard (Staff, HOD)
router.get('/staff', protect, authorize(ROLES.STAFF, ROLES.HOD), dashboardController.getStaffDashboard);

// GET /api/dashboard/hod - HOD dashboard (HOD)
router.get('/hod', protect, authorize(ROLES.HOD), dashboardController.getHodDashboard);

// GET /api/dashboard/admin - Admin dashboard (Admin)
router.get('/admin', protect, authorize(ROLES.ADMIN), dashboardController.getAdminDashboard);

module.exports = router;
