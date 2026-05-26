const User = require('../models/User');
const Activity = require('../models/Activity');
const AttendanceRecord = require('../models/AttendanceRecord');
const MarksRecord = require('../models/MarksRecord');
const SubjectAllocation = require('../models/SubjectAllocation');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const InstitutionSettings = require('../models/InstitutionSettings');
const { ACTIVITY_STATUS, ATTENDANCE_STATUS, ROLES } = require('../config/constants');

/**
 * Calculate attendance percentage helper
 */
const calculateAttendancePercentage = async (studentId, subjectId, academicYear) => {
  const records = await AttendanceRecord.find({
    subject: subjectId,
    academicYear,
    'records.student': studentId
  });
  
  let totalSessions = 0;
  let presentSessions = 0;
  
  records.forEach(record => {
    const studentRecord = record.records.find(r => r.student.toString() === studentId.toString());
    if (studentRecord) {
      totalSessions++;
      if ([ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE, ATTENDANCE_STATUS.OD].includes(studentRecord.status)) {
        presentSessions++;
      }
    }
  });
  
  return totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100 * 100) / 100 : 0;
};

/**
 * Get student dashboard stats
 * @route GET /api/dashboard/student
 * @access Student
 */
exports.getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const settings = await InstitutionSettings.getSettings();
    
    // Activity stats
    const [totalActivities, pendingActivities, verifiedActivities, rejectedActivities] = await Promise.all([
      Activity.countDocuments({ student: studentId }),
      Activity.countDocuments({ student: studentId, status: ACTIVITY_STATUS.PENDING }),
      Activity.countDocuments({ student: studentId, status: ACTIVITY_STATUS.VERIFIED }),
      Activity.countDocuments({ student: studentId, status: ACTIVITY_STATUS.REJECTED })
    ]);
    
    // Get subjects for this student
    const student = await User.findById(studentId);
    const subjects = await Subject.find({
      program: student.studentFields?.program,
      semester: student.studentFields?.currentSemester,
      isActive: true
    });
    
    // Attendance stats
    let overallAttendance = 0;
    let subjectsBelow75 = 0;
    const attendanceBySubject = [];
    
    for (const subject of subjects) {
      const percentage = await calculateAttendancePercentage(
        studentId,
        subject._id,
        settings.currentAcademicYear
      );
      
      attendanceBySubject.push({
        subject: { _id: subject._id, name: subject.name, code: subject.code },
        percentage
      });
      
      overallAttendance += percentage;
      if (percentage < settings.defaulterThreshold) {
        subjectsBelow75++;
      }
    }
    
    overallAttendance = subjects.length > 0 
      ? Math.round((overallAttendance / subjects.length) * 100) / 100 
      : 0;
    
    // Marks stats
    const marksRecords = await MarksRecord.find({
      student: studentId,
      academicYear: settings.currentAcademicYear
    }).populate('subject', 'name code');
    
    let totalMarks = 0;
    const marksBySubject = marksRecords.map(r => {
      totalMarks += r.totalMarks;
      return {
        subject: r.subject,
        total: r.totalMarks,
        cia: r.ciaMarks,
        assignment: r.assignmentMarks,
        lab: r.labMarks,
        attendance: r.attendanceMarks
      };
    });
    
    // Recent activities
    const recentActivities = await Activity.find({ student: studentId })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        activities: {
          total: totalActivities,
          pending: pendingActivities,
          verified: verifiedActivities,
          rejected: rejectedActivities,
          recent: recentActivities
        },
        attendance: {
          overall: overallAttendance,
          subjectsBelow75,
          totalSubjects: subjects.length,
          isDefaulter: overallAttendance < settings.defaulterThreshold,
          bySubject: attendanceBySubject,
          threshold: settings.defaulterThreshold
        },
        marks: {
          totalMarks,
          subjectsCount: marksRecords.length,
          bySubject: marksBySubject
        },
        mentor: student.studentFields?.mentor ? await User.findById(student.studentFields.mentor).select('name email') : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get staff dashboard stats
 * @route GET /api/dashboard/staff
 * @access Staff
 */
exports.getStaffDashboard = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    // Get allocations
    const allocations = await SubjectAllocation.find({
      faculty: req.user._id,
      academicYear: settings.currentAcademicYear,
      isActive: true
    }).populate({
      path: 'subject',
      populate: { path: 'program', select: 'name code' }
    });
    
    // Get mentees
    const mentees = await User.find({
      role: ROLES.STUDENT,
      'studentFields.mentor': req.user._id,
      isActive: true
    });
    
    const menteeIds = mentees.map(m => m._id);
    
    // Pending activity verifications
    const pendingVerifications = await Activity.countDocuments({
      student: { $in: menteeIds },
      status: ACTIVITY_STATUS.PENDING
    });
    
    // Recent attendance sessions
    const recentSessions = await AttendanceRecord.find({
      faculty: req.user._id,
      academicYear: settings.currentAcademicYear
    })
      .populate('subject', 'name code')
      .sort({ date: -1, sessionNumber: -1 })
      .limit(5);
    
    // Sessions marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionsToday = await AttendanceRecord.countDocuments({
      faculty: req.user._id,
      date: { $gte: today }
    });
    
    // Calculate defaulters in allocated subjects
    let defaulterCount = 0;
    for (const allocation of allocations) {
      const students = await User.find({
        role: ROLES.STUDENT,
        'studentFields.program': allocation.subject.program._id,
        'studentFields.currentSemester': allocation.subject.semester,
        'studentFields.section': allocation.section,
        isActive: true
      });
      
      for (const student of students) {
        const percentage = await calculateAttendancePercentage(
          student._id,
          allocation.subject._id,
          settings.currentAcademicYear
        );
        
        if (percentage > 0 && percentage < settings.defaulterThreshold) {
          defaulterCount++;
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        allocations: {
          count: allocations.length,
          list: allocations.map(a => ({
            _id: a._id,
            subject: a.subject,
            section: a.section
          }))
        },
        mentees: {
          count: mentees.length,
          pendingVerifications
        },
        attendance: {
          recentSessions,
          sessionsToday,
          defaulterCount
        },
        quickActions: {
          canMarkAttendance: allocations.length > 0,
          canVerifyActivities: pendingVerifications > 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get HOD dashboard stats
 * @route GET /api/dashboard/hod
 * @access HOD
 */
exports.getHodDashboard = async (req, res, next) => {
  try {
    // Get department ID (handle both populated object and ID string)
    const departmentId = req.user.department?._id || req.user.department;
    
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'HOD department not assigned'
      });
    }
    
    const settings = await InstitutionSettings.getSettings();
    
    // Ensure user object has department details
    const hodUser = await User.findById(req.user._id).populate('department', 'name');
    
    // Department students
    const students = await User.find({
      role: ROLES.STUDENT,
      department: departmentId,
      isActive: true
    });
    
    const studentIds = students.map(s => s._id);
    
    // Department staff
    const staffCount = await User.countDocuments({
      role: { $in: [ROLES.STAFF, ROLES.HOD] },
      department: departmentId,
      isActive: true
    });
    
    // Activity stats
    const [totalActivities, pendingActivities, verifiedActivities] = await Promise.all([
      Activity.countDocuments({ student: { $in: studentIds } }),
      Activity.countDocuments({ student: { $in: studentIds }, status: ACTIVITY_STATUS.PENDING }),
      Activity.countDocuments({ student: { $in: studentIds }, status: ACTIVITY_STATUS.VERIFIED })
    ]);
    
    // Calculate defaulters
    let defaulterCount = 0;
    let totalAttendanceSum = 0;
    let studentsWithAttendance = 0;
    
    for (const student of students) {
      const subjects = await Subject.find({
        program: student.studentFields?.program,
        semester: student.studentFields?.currentSemester,
        isActive: true
      });
      
      let studentTotal = 0;
      let studentSubjects = 0;
      
      for (const subject of subjects) {
        const percentage = await calculateAttendancePercentage(
          student._id,
          subject._id,
          settings.currentAcademicYear
        );
        
        if (percentage > 0) {
          studentTotal += percentage;
          studentSubjects++;
        }
      }
      
      if (studentSubjects > 0) {
        const avgAttendance = studentTotal / studentSubjects;
        totalAttendanceSum += avgAttendance;
        studentsWithAttendance++;
        
        if (avgAttendance < settings.defaulterThreshold) {
          defaulterCount++;
        }
      }
    }
    
    // Recent activities
    const recentActivities = await Activity.find({ student: { $in: studentIds } })
      .populate('student', 'name studentFields.rollNumber')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Programs with student counts
    const Program = require('../models/Program');
    const departmentPrograms = await Program.find({
      department: departmentId,
      isActive: true
    });
    
    const programsWithCounts = await Promise.all(
      departmentPrograms.map(async (program) => {
        const studentCount = await User.countDocuments({
          role: ROLES.STUDENT,
          'studentFields.program': program._id,
          isActive: true
        });
        return {
          _id: program._id,
          name: program.name,
          code: program.code,
          studentCount
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        user: {
          name: hodUser.name,
          department: hodUser.department?.name || 'Unknown Department'
        },
        totalStudents: students.length,
        totalFaculty: staffCount,
        totalActivities,
        pendingActivities,
        verifiedActivities,
        defaulters: defaulterCount,
        averageAttendance: studentsWithAttendance > 0 
          ? Math.round((totalAttendanceSum / studentsWithAttendance) * 100) / 100 
          : 0,
        programs: programsWithCounts,
        recentActivities
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin dashboard stats
 * @route GET /api/dashboard/admin
 * @access Admin
 */
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    // User counts by role
    const [studentCount, staffCount, hodCount, adminCount] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
      User.countDocuments({ role: ROLES.STAFF, isActive: true }),
      User.countDocuments({ role: ROLES.HOD, isActive: true }),
      User.countDocuments({ role: ROLES.ADMIN, isActive: true })
    ]);
    
    // Department count
    const departmentCount = await Department.countDocuments({ isActive: true });
    
    // Subject count
    const subjectCount = await Subject.countDocuments({ isActive: true });
    
    // Activity stats
    const [totalActivities, pendingActivities, verifiedActivities] = await Promise.all([
      Activity.countDocuments(),
      Activity.countDocuments({ status: ACTIVITY_STATUS.PENDING }),
      Activity.countDocuments({ status: ACTIVITY_STATUS.VERIFIED })
    ]);
    
    // Attendance sessions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const sessionsThisMonth = await AttendanceRecord.countDocuments({
      date: { $gte: startOfMonth }
    });
    
    // Recent registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');
    
    // Students without mentor
    const studentsWithoutMentor = await User.countDocuments({
      role: ROLES.STUDENT,
      isActive: true,
      $or: [
        { 'studentFields.mentor': null },
        { 'studentFields.mentor': { $exists: false } }
      ]
    });
    
    res.json({
      success: true,
      data: {
        totalUsers: studentCount + staffCount + hodCount + adminCount,
        totalStudents: studentCount,
        totalStaff: staffCount,
        totalHOD: hodCount,
        totalAdmin: adminCount,
        totalDepartments: departmentCount,
        totalSubjects: subjectCount,
        institutionName: settings.institutionName,
        currentAcademicYear: settings.currentAcademicYear,
        totalActivities,
        pendingActivities,
        verifiedActivities,
        sessionsThisMonth,
        studentsWithoutMentor,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};
