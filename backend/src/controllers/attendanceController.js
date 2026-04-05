const AttendanceRecord = require('../models/AttendanceRecord');
const SubjectAllocation = require('../models/SubjectAllocation');
const Subject = require('../models/Subject');
const User = require('../models/User');
const InstitutionSettings = require('../models/InstitutionSettings');
const { ATTENDANCE_STATUS, ROLES } = require('../config/constants');

/**
 * Calculate attendance percentage for a student in a subject
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
      // Present, Late, and OD all count as present for percentage
      if ([ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE, ATTENDANCE_STATUS.OD].includes(studentRecord.status)) {
        presentSessions++;
      }
    }
  });
  
  return {
    totalSessions,
    presentSessions,
    absentSessions: totalSessions - presentSessions,
    percentage: totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100 * 100) / 100 : 0
  };
};

// Export for use in other controllers
exports.calculateAttendancePercentage = calculateAttendancePercentage;

/**
 * Mark attendance for a session
 * @route POST /api/attendance
 * @access Staff (allocated subject only)
 */
exports.markAttendance = async (req, res, next) => {
  try {
    const { subject, section, date, sessionNumber, records } = req.body;
    
    const settings = await InstitutionSettings.getSettings();
    const sectionUpper = section.toUpperCase();
    
    // Verify staff is allocated to this subject and section
    const allocation = await SubjectAllocation.findOne({
      faculty: req.user._id,
      subject,
      section: sectionUpper,
      academicYear: settings.currentAcademicYear,
      isActive: true
    });
    
    if (!allocation) {
      return res.status(403).json({
        success: false,
        message: 'You are not allocated to this subject and section'
      });
    }
    
    // Check if attendance already exists for this date/session
    const existingRecord = await AttendanceRecord.findOne({
      subject,
      date: new Date(date).toISOString().split('T')[0],
      sessionNumber,
      section: sectionUpper
    });
    
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session. Use edit to modify.'
      });
    }
    
    const attendanceRecord = await AttendanceRecord.create({
      subject,
      faculty: req.user._id,
      date: new Date(date),
      sessionNumber,
      section: sectionUpper,
      academicYear: settings.currentAcademicYear,
      records: records.map(r => ({
        student: r.student,
        status: r.status,
        remarks: r.remarks || null
      }))
    });
    
    const populatedRecord = await AttendanceRecord.findById(attendanceRecord._id)
      .populate('subject', 'name code')
      .populate('faculty', 'name')
      .populate('records.student', 'name studentFields.rollNumber');
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: populatedRecord,
      summary: {
        total: records.length,
        present: records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length,
        absent: records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length,
        late: records.filter(r => r.status === ATTENDANCE_STATUS.LATE).length,
        od: records.filter(r => r.status === ATTENDANCE_STATUS.OD).length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit attendance (within 24h window or with admin override)
 * @route PUT /api/attendance/:id
 * @access Staff (owner), Admin
 */
exports.editAttendance = async (req, res, next) => {
  try {
    const { records, reason } = req.body;
    
    const attendanceRecord = await AttendanceRecord.findById(req.params.id);
    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    const settings = await InstitutionSettings.getSettings();
    const hoursSinceCreation = (Date.now() - attendanceRecord.createdAt) / (1000 * 60 * 60);
    
    // Non-admin: check if within edit window and is the owner
    if (req.user.role !== ROLES.ADMIN) {
      if (attendanceRecord.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own attendance records'
        });
      }
      
      if (hoursSinceCreation > settings.attendanceEditWindowHours) {
        return res.status(400).json({
          success: false,
          message: `Edit window expired. Attendance can only be edited within ${settings.attendanceEditWindowHours} hours. Contact admin for changes.`
        });
      }
    }
    
    // Store previous records for audit trail
    const previousRecords = attendanceRecord.records.map(r => ({
      student: r.student,
      status: r.status,
      remarks: r.remarks
    }));
    
    // Add to edit history
    attendanceRecord.editHistory.push({
      editedBy: req.user._id,
      editedAt: new Date(),
      previousRecords,
      reason: reason || 'Edited within allowed window'
    });
    
    // Update records
    attendanceRecord.records = records.map(r => ({
      student: r.student,
      status: r.status,
      remarks: r.remarks || null
    }));
    
    await attendanceRecord.save();
    
    const updatedRecord = await AttendanceRecord.findById(attendanceRecord._id)
      .populate('subject', 'name code')
      .populate('faculty', 'name')
      .populate('records.student', 'name studentFields.rollNumber');
    
    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my marked sessions
 * @route GET /api/attendance/sessions
 * @access Staff
 */
exports.getMySessions = async (req, res, next) => {
  try {
    const { subject, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const settings = await InstitutionSettings.getSettings();
    
    const filter = {
      faculty: req.user._id,
      academicYear: settings.currentAcademicYear
    };
    
    if (subject) filter.subject = subject;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [sessions, total] = await Promise.all([
      AttendanceRecord.find(filter)
        .populate('subject', 'name code')
        .sort({ date: -1, sessionNumber: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AttendanceRecord.countDocuments(filter)
    ]);
    
    // Add editable flag
    const sessionsWithMeta = sessions.map(s => ({
      ...s.toObject(),
      isEditable: (Date.now() - s.createdAt) / (1000 * 60 * 60) <= settings.attendanceEditWindowHours,
      presentCount: s.records.filter(r => [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE, ATTENDANCE_STATUS.OD].includes(r.status)).length,
      absentCount: s.records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length,
      totalStudents: s.records.length
    }));
    
    res.json({
      success: true,
      data: sessionsWithMeta,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance for a subject
 * @route GET /api/attendance/subject/:subjectId
 * @access Staff (allocated), HOD, Admin
 */
exports.getSubjectAttendance = async (req, res, next) => {
  try {
    const { section, startDate, endDate } = req.query;
    
    const settings = await InstitutionSettings.getSettings();
    
    const filter = {
      subject: req.params.subjectId,
      academicYear: settings.currentAcademicYear
    };
    
    if (section) filter.section = section.toUpperCase();
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    const records = await AttendanceRecord.find(filter)
      .populate('faculty', 'name')
      .populate('records.student', 'name studentFields.rollNumber')
      .sort({ date: -1, sessionNumber: -1 });
    
    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's attendance
 * @route GET /api/attendance/student/:studentId
 * @access Student (self), Staff (mentor/allocated), HOD, Admin
 */
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    
    const student = await User.findById(studentId)
      .populate('studentFields.program', 'name code');
    
    if (!student || student.role !== ROLES.STUDENT) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const settings = await InstitutionSettings.getSettings();
    
    // Get all subjects for this student's program and semester
    const subjects = await Subject.find({
      program: student.studentFields?.program?._id,
      semester: student.studentFields?.currentSemester,
      isActive: true
    });
    
    // Calculate attendance for each subject
    const attendanceBySubject = await Promise.all(
      subjects.map(async (subject) => {
        const stats = await calculateAttendancePercentage(
          studentId,
          subject._id,
          settings.currentAcademicYear
        );
        
        return {
          subject: {
            _id: subject._id,
            name: subject.name,
            code: subject.code
          },
          ...stats,
          isDefaulter: stats.percentage < settings.defaulterThreshold
        };
      })
    );
    
    // Calculate overall attendance
    const totalSessions = attendanceBySubject.reduce((sum, a) => sum + a.totalSessions, 0);
    const presentSessions = attendanceBySubject.reduce((sum, a) => sum + a.presentSessions, 0);
    const overallPercentage = totalSessions > 0 
      ? Math.round((presentSessions / totalSessions) * 100 * 100) / 100 
      : 0;
    
    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.studentFields?.rollNumber,
          program: student.studentFields?.program,
          semester: student.studentFields?.currentSemester,
          section: student.studentFields?.section
        },
        overall: {
          totalSessions,
          presentSessions,
          absentSessions: totalSessions - presentSessions,
          percentage: overallPercentage,
          isDefaulter: overallPercentage < settings.defaulterThreshold
        },
        bySubject: attendanceBySubject,
        threshold: settings.defaulterThreshold
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance percentage for student in subject
 * @route GET /api/attendance/percentage/:studentId/:subjectId
 * @access All authenticated
 */
exports.getAttendancePercentage = async (req, res, next) => {
  try {
    const { studentId, subjectId } = req.params;
    
    const settings = await InstitutionSettings.getSettings();
    const stats = await calculateAttendancePercentage(
      studentId,
      subjectId,
      settings.currentAcademicYear
    );
    
    res.json({
      success: true,
      data: {
        ...stats,
        isDefaulter: stats.percentage < settings.defaulterThreshold,
        threshold: settings.defaulterThreshold
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get students below threshold (defaulters)
 * @route GET /api/attendance/defaulters
 * @access Staff (allocated), HOD, Admin
 */
exports.getDefaulters = async (req, res, next) => {
  try {
    const { subject, section, department } = req.query;
    
    const settings = await InstitutionSettings.getSettings();
    
    let students;
    
    if (req.user.role === ROLES.STAFF) {
      // Staff sees defaulters only for their allocated subjects
      const allocations = await SubjectAllocation.find({
        faculty: req.user._id,
        academicYear: settings.currentAcademicYear,
        isActive: true
      }).populate('subject');
      
      if (allocations.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'No subject allocations found'
        });
      }
      
      const filters = allocations.map(a => ({
        'studentFields.program': a.subject.program,
        'studentFields.currentSemester': a.subject.semester,
        'studentFields.section': a.section
      }));
      
      students = await User.find({
        role: ROLES.STUDENT,
        isActive: true,
        $or: filters
      }).populate('studentFields.program', 'name code');
      
    } else if (req.user.role === ROLES.HOD) {
      // HOD sees all students in department
      students = await User.find({
        role: ROLES.STUDENT,
        department: req.user.department._id,
        isActive: true
      }).populate('studentFields.program', 'name code');
      
    } else {
      // Admin can filter by department
      const filter = { role: ROLES.STUDENT, isActive: true };
      if (department) filter.department = department;
      
      students = await User.find(filter)
        .populate('studentFields.program', 'name code');
    }
    
    // Calculate attendance for each student
    const defaulters = [];
    
    for (const student of students) {
      const subjects = await Subject.find({
        program: student.studentFields?.program?._id,
        semester: student.studentFields?.currentSemester,
        isActive: true
      });
      
      for (const subj of subjects) {
        // Apply subject filter if provided
        if (subject && subj._id.toString() !== subject) continue;
        // Apply section filter if provided  
        if (section && student.studentFields?.section !== section.toUpperCase()) continue;
        
        const stats = await calculateAttendancePercentage(
          student._id,
          subj._id,
          settings.currentAcademicYear
        );
        
        if (stats.totalSessions > 0 && stats.percentage < settings.defaulterThreshold) {
          defaulters.push({
            student: {
              _id: student._id,
              name: student.name,
              email: student.email,
              rollNumber: student.studentFields?.rollNumber,
              program: student.studentFields?.program,
              semester: student.studentFields?.currentSemester,
              section: student.studentFields?.section
            },
            subject: {
              _id: subj._id,
              name: subj.name,
              code: subj.code
            },
            ...stats
          });
        }
      }
    }
    
    // Sort by percentage ascending (worst first)
    defaulters.sort((a, b) => a.percentage - b.percentage);
    
    res.json({
      success: true,
      data: defaulters,
      count: defaulters.length,
      threshold: settings.defaulterThreshold
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get department attendance summary
 * @route GET /api/attendance/department-summary
 * @access HOD
 */
exports.getDepartmentSummary = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    // Get all students in department
    const students = await User.find({
      role: ROLES.STUDENT,
      department: req.user.department._id,
      isActive: true
    });
    
    let totalStudents = students.length;
    let defaulterCount = 0;
    let totalAttendanceSum = 0;
    let studentsWithAttendance = 0;
    
    for (const student of students) {
      const subjects = await Subject.find({
        program: student.studentFields?.program,
        semester: student.studentFields?.currentSemester,
        isActive: true
      });
      
      let studentTotalSessions = 0;
      let studentPresentSessions = 0;
      
      for (const subj of subjects) {
        const stats = await calculateAttendancePercentage(
          student._id,
          subj._id,
          settings.currentAcademicYear
        );
        studentTotalSessions += stats.totalSessions;
        studentPresentSessions += stats.presentSessions;
      }
      
      if (studentTotalSessions > 0) {
        const percentage = (studentPresentSessions / studentTotalSessions) * 100;
        totalAttendanceSum += percentage;
        studentsWithAttendance++;
        
        if (percentage < settings.defaulterThreshold) {
          defaulterCount++;
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        totalStudents,
        studentsWithAttendance,
        defaulterCount,
        averageAttendance: studentsWithAttendance > 0 
          ? Math.round((totalAttendanceSum / studentsWithAttendance) * 100) / 100 
          : 0,
        threshold: settings.defaulterThreshold
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get institution-wide attendance summary
 * @route GET /api/attendance/institution-summary
 * @access Admin
 */
exports.getInstitutionSummary = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    const students = await User.find({
      role: ROLES.STUDENT,
      isActive: true
    }).populate('department', 'name code');
    
    const summaryByDepartment = {};
    let institutionDefaulters = 0;
    let institutionTotalAttendance = 0;
    let institutionStudentsWithAttendance = 0;
    
    for (const student of students) {
      const deptId = student.department?._id?.toString() || 'unknown';
      const deptName = student.department?.name || 'Unknown';
      
      if (!summaryByDepartment[deptId]) {
        summaryByDepartment[deptId] = {
          department: { _id: deptId, name: deptName },
          totalStudents: 0,
          defaulterCount: 0,
          totalAttendance: 0,
          studentsWithAttendance: 0
        };
      }
      
      summaryByDepartment[deptId].totalStudents++;
      
      const subjects = await Subject.find({
        program: student.studentFields?.program,
        semester: student.studentFields?.currentSemester,
        isActive: true
      });
      
      let studentTotalSessions = 0;
      let studentPresentSessions = 0;
      
      for (const subj of subjects) {
        const stats = await calculateAttendancePercentage(
          student._id,
          subj._id,
          settings.currentAcademicYear
        );
        studentTotalSessions += stats.totalSessions;
        studentPresentSessions += stats.presentSessions;
      }
      
      if (studentTotalSessions > 0) {
        const percentage = (studentPresentSessions / studentTotalSessions) * 100;
        
        summaryByDepartment[deptId].totalAttendance += percentage;
        summaryByDepartment[deptId].studentsWithAttendance++;
        institutionTotalAttendance += percentage;
        institutionStudentsWithAttendance++;
        
        if (percentage < settings.defaulterThreshold) {
          summaryByDepartment[deptId].defaulterCount++;
          institutionDefaulters++;
        }
      }
    }
    
    // Calculate averages
    const departmentSummaries = Object.values(summaryByDepartment).map(dept => ({
      ...dept,
      averageAttendance: dept.studentsWithAttendance > 0 
        ? Math.round((dept.totalAttendance / dept.studentsWithAttendance) * 100) / 100 
        : 0
    }));
    
    res.json({
      success: true,
      data: {
        institution: {
          totalStudents: students.length,
          studentsWithAttendance: institutionStudentsWithAttendance,
          defaulterCount: institutionDefaulters,
          averageAttendance: institutionStudentsWithAttendance > 0 
            ? Math.round((institutionTotalAttendance / institutionStudentsWithAttendance) * 100) / 100 
            : 0
        },
        byDepartment: departmentSummaries,
        threshold: settings.defaulterThreshold
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of students for marking attendance
 * @route GET /api/attendance/students-for-marking/:subjectId/:section
 * @access Staff (allocated)
 */
exports.getStudentsForMarking = async (req, res, next) => {
  try {
    const { subjectId, section } = req.params;
    
    const settings = await InstitutionSettings.getSettings();
    
    // Verify staff is allocated
    const allocation = await SubjectAllocation.findOne({
      faculty: req.user._id,
      subject: subjectId,
      section: section.toUpperCase(),
      academicYear: settings.currentAcademicYear,
      isActive: true
    });
    
    if (!allocation) {
      return res.status(403).json({
        success: false,
        message: 'You are not allocated to this subject and section'
      });
    }
    
    const subject = await Subject.findById(subjectId).populate('program', 'name');
    
    // Get students for this program, semester, and section
    const students = await User.find({
      role: ROLES.STUDENT,
      'studentFields.program': subject.program._id,
      'studentFields.currentSemester': subject.semester,
      'studentFields.section': section.toUpperCase(),
      isActive: true
    })
      .select('name email studentFields.rollNumber')
      .sort({ 'studentFields.rollNumber': 1 });
    
    res.json({
      success: true,
      data: {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code
        },
        section: section.toUpperCase(),
        students,
        count: students.length
      }
    });
  } catch (error) {
    next(error);
  }
};
