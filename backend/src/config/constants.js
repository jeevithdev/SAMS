// User roles
const ROLES = {
  STUDENT: 'student',
  STAFF: 'staff',
  HOD: 'hod',
  ADMIN: 'admin'
};

// Activity status
const ACTIVITY_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Attendance status
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  OD: 'od' // On-Duty
};

// Default institution settings
const DEFAULT_SETTINGS = {
  attendanceEditWindowHours: 24,
  defaulterThreshold: 75,
  marksConfig: {
    ciaMaxMarks: 20,
    assignmentMaxMarks: 10,
    labMaxMarks: 20,
    attendanceMaxMarks: 10
  },
  attendanceMarksSlabs: [
    { minPercentage: 95, marks: 10 },
    { minPercentage: 90, marks: 9 },
    { minPercentage: 85, marks: 8 },
    { minPercentage: 80, marks: 7 },
    { minPercentage: 75, marks: 6 },
    { minPercentage: 0, marks: 0 }
  ],
  currentAcademicYear: '2024-25',
  institutionName: 'SAMS Institution'
};

// Allowed file types for activity uploads
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

module.exports = {
  ROLES,
  ACTIVITY_STATUS,
  ATTENDANCE_STATUS,
  DEFAULT_SETTINGS,
  ALLOWED_FILE_TYPES
};
