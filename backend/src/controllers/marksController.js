const MarksRecord = require('../models/MarksRecord');
const AttendanceRecord = require('../models/AttendanceRecord');
const SubjectAllocation = require('../models/SubjectAllocation');
const Subject = require('../models/Subject');
const User = require('../models/User');
const InstitutionSettings = require('../models/InstitutionSettings');
const { ATTENDANCE_STATUS, ROLES } = require('../config/constants');

/**
 * Calculate attendance percentage for attendance marks
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
  
  return totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
};

/**
 * Calculate attendance marks from percentage using slabs
 */
const getAttendanceMarks = (percentage, slabs, maxMarks) => {
  // Sort slabs by minPercentage descending
  const sortedSlabs = [...slabs].sort((a, b) => b.minPercentage - a.minPercentage);
  
  for (const slab of sortedSlabs) {
    if (percentage >= slab.minPercentage) {
      return slab.marks;
    }
  }
  
  return 0;
};

/**
 * Enter or update marks for students
 * @route POST /api/marks
 * @access Staff (allocated subject only)
 */
exports.enterMarks = async (req, res, next) => {
  try {
    const { subject, section, marks } = req.body;
    
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
    
    const results = [];
    
    for (const markData of marks) {
      const { student, ciaMarks, assignmentMarks, labMarks } = markData;
      
      // Validate marks against max values
      if (ciaMarks !== undefined && ciaMarks > settings.marksConfig.ciaMaxMarks) {
        return res.status(400).json({
          success: false,
          message: `CIA marks cannot exceed ${settings.marksConfig.ciaMaxMarks}`
        });
      }
      if (assignmentMarks !== undefined && assignmentMarks > settings.marksConfig.assignmentMaxMarks) {
        return res.status(400).json({
          success: false,
          message: `Assignment marks cannot exceed ${settings.marksConfig.assignmentMaxMarks}`
        });
      }
      if (labMarks !== undefined && labMarks > settings.marksConfig.labMaxMarks) {
        return res.status(400).json({
          success: false,
          message: `Lab marks cannot exceed ${settings.marksConfig.labMaxMarks}`
        });
      }
      
      // Find or create marks record
      let record = await MarksRecord.findOne({
        student,
        subject,
        academicYear: settings.currentAcademicYear
      });
      
      if (!record) {
        record = new MarksRecord({
          student,
          subject,
          academicYear: settings.currentAcademicYear,
          section: sectionUpper,
          enteredBy: req.user._id
        });
      }
      
      // Update marks (only if provided)
      if (ciaMarks !== undefined) record.ciaMarks = ciaMarks;
      if (assignmentMarks !== undefined) record.assignmentMarks = assignmentMarks;
      if (labMarks !== undefined) record.labMarks = labMarks;
      
      // Total is calculated in pre-save middleware
      await record.save();
      results.push(record);
    }
    
    res.json({
      success: true,
      message: `Marks updated for ${results.length} student(s)`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Auto-calculate attendance marks from attendance data
 * @route POST /api/marks/calculate-attendance-marks
 * @access Staff (allocated), Admin
 */
exports.calculateAttendanceMarks = async (req, res, next) => {
  try {
    const { subject, section } = req.body;
    
    const settings = await InstitutionSettings.getSettings();
    const sectionUpper = section.toUpperCase();
    
    // Verify allocation for staff
    if (req.user.role === ROLES.STAFF) {
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
    }
    
    const subjectDoc = await Subject.findById(subject).populate('program');
    
    // Get students for this subject
    const students = await User.find({
      role: ROLES.STUDENT,
      'studentFields.program': subjectDoc.program._id,
      'studentFields.currentSemester': subjectDoc.semester,
      'studentFields.section': sectionUpper,
      isActive: true
    });
    
    const results = [];
    
    for (const student of students) {
      // Calculate attendance percentage
      const percentage = await calculateAttendancePercentage(
        student._id,
        subject,
        settings.currentAcademicYear
      );
      
      // Get marks from slab
      const attendanceMarks = getAttendanceMarks(
        percentage,
        settings.attendanceMarksSlabs,
        settings.marksConfig.attendanceMaxMarks
      );
      
      // Update or create marks record
      let record = await MarksRecord.findOne({
        student: student._id,
        subject,
        academicYear: settings.currentAcademicYear
      });
      
      if (!record) {
        record = new MarksRecord({
          student: student._id,
          subject,
          academicYear: settings.currentAcademicYear,
          section: sectionUpper,
          enteredBy: req.user._id
        });
      }
      
      record.attendanceMarks = attendanceMarks;
      await record.save();
      
      results.push({
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.studentFields?.rollNumber
        },
        attendancePercentage: Math.round(percentage * 100) / 100,
        attendanceMarks
      });
    }
    
    res.json({
      success: true,
      message: `Attendance marks calculated for ${results.length} student(s)`,
      data: results,
      slabsUsed: settings.attendanceMarksSlabs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get marks for a subject
 * @route GET /api/marks/subject/:subjectId
 * @access Staff (allocated), HOD, Admin
 */
exports.getSubjectMarks = async (req, res, next) => {
  try {
    const { section } = req.query;
    
    const settings = await InstitutionSettings.getSettings();
    
    const filter = {
      subject: req.params.subjectId,
      academicYear: settings.currentAcademicYear
    };
    
    if (section) filter.section = section.toUpperCase();
    
    const records = await MarksRecord.find(filter)
      .populate('student', 'name email studentFields.rollNumber')
      .populate('subject', 'name code')
      .populate('enteredBy', 'name')
      .sort({ 'student.studentFields.rollNumber': 1 });
    
    const subjectDoc = await Subject.findById(req.params.subjectId);
    
    res.json({
      success: true,
      data: records,
      count: records.length,
      maxMarks: {
        cia: settings.marksConfig.ciaMaxMarks,
        assignment: settings.marksConfig.assignmentMaxMarks,
        lab: subjectDoc.isLab ? settings.marksConfig.labMaxMarks : 0,
        attendance: settings.marksConfig.attendanceMaxMarks,
        total: settings.marksConfig.ciaMaxMarks + 
               settings.marksConfig.assignmentMaxMarks + 
               (subjectDoc.isLab ? settings.marksConfig.labMaxMarks : 0) +
               settings.marksConfig.attendanceMaxMarks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's all marks
 * @route GET /api/marks/student/:studentId
 * @access Student (self), Staff (mentor), HOD, Admin
 */
exports.getStudentMarks = async (req, res, next) => {
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
    
    // Staff can only see their mentees' marks
    if (req.user.role === ROLES.STAFF && !req.isOwner) {
      if (student.studentFields?.mentor?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your mentees\' marks'
        });
      }
    }
    
    const settings = await InstitutionSettings.getSettings();
    
    const records = await MarksRecord.find({
      student: studentId,
      academicYear: settings.currentAcademicYear
    })
      .populate('subject', 'name code isLab')
      .populate('enteredBy', 'name')
      .sort({ 'subject.code': 1 });
    
    // Calculate totals
    let grandTotal = 0;
    let maxPossible = 0;
    
    const marksWithMax = records.map(record => {
      const maxForSubject = settings.marksConfig.ciaMaxMarks + 
                           settings.marksConfig.assignmentMaxMarks + 
                           (record.subject.isLab ? settings.marksConfig.labMaxMarks : 0) +
                           settings.marksConfig.attendanceMaxMarks;
      
      grandTotal += record.totalMarks;
      maxPossible += maxForSubject;
      
      return {
        ...record.toObject(),
        maxMarks: {
          cia: settings.marksConfig.ciaMaxMarks,
          assignment: settings.marksConfig.assignmentMaxMarks,
          lab: record.subject.isLab ? settings.marksConfig.labMaxMarks : 0,
          attendance: settings.marksConfig.attendanceMaxMarks,
          total: maxForSubject
        }
      };
    });
    
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
        marks: marksWithMax,
        summary: {
          subjectsCount: records.length,
          grandTotal,
          maxPossible,
          percentage: maxPossible > 0 ? Math.round((grandTotal / maxPossible) * 100 * 100) / 100 : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get department marks summary
 * @route GET /api/marks/department-summary
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
    
    // Get all marks records for these students
    const studentIds = students.map(s => s._id);
    
    const records = await MarksRecord.find({
      student: { $in: studentIds },
      academicYear: settings.currentAcademicYear
    }).populate('subject', 'name code');
    
    // Group by subject
    const bySubject = {};
    records.forEach(record => {
      const subjectId = record.subject._id.toString();
      if (!bySubject[subjectId]) {
        bySubject[subjectId] = {
          subject: record.subject,
          students: 0,
          totalMarks: 0,
          maxPossibleTotal: 0
        };
      }
      
      const maxForSubject = settings.marksConfig.ciaMaxMarks + 
                           settings.marksConfig.assignmentMaxMarks + 
                           settings.marksConfig.labMaxMarks +
                           settings.marksConfig.attendanceMaxMarks;
      
      bySubject[subjectId].students++;
      bySubject[subjectId].totalMarks += record.totalMarks;
      bySubject[subjectId].maxPossibleTotal += maxForSubject;
    });
    
    const subjectSummaries = Object.values(bySubject).map(s => ({
      subject: s.subject,
      studentsCount: s.students,
      averageMarks: s.students > 0 ? Math.round((s.totalMarks / s.students) * 100) / 100 : 0,
      averagePercentage: s.maxPossibleTotal > 0 
        ? Math.round((s.totalMarks / s.maxPossibleTotal) * 100 * 100) / 100 
        : 0
    }));
    
    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        studentsWithMarks: new Set(records.map(r => r.student.toString())).size,
        bySubject: subjectSummaries
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get institution-wide marks summary
 * @route GET /api/marks/institution-summary
 * @access Admin
 */
exports.getInstitutionSummary = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    const students = await User.find({
      role: ROLES.STUDENT,
      isActive: true
    }).populate('department', 'name code');
    
    const studentIds = students.map(s => s._id);
    
    const records = await MarksRecord.find({
      student: { $in: studentIds },
      academicYear: settings.currentAcademicYear
    });
    
    // Group by department
    const byDepartment = {};
    
    for (const student of students) {
      const deptId = student.department?._id?.toString() || 'unknown';
      const deptName = student.department?.name || 'Unknown';
      
      if (!byDepartment[deptId]) {
        byDepartment[deptId] = {
          department: { _id: deptId, name: deptName },
          totalStudents: 0,
          studentsWithMarks: new Set(),
          totalMarks: 0,
          recordCount: 0
        };
      }
      
      byDepartment[deptId].totalStudents++;
      
      const studentRecords = records.filter(r => r.student.toString() === student._id.toString());
      if (studentRecords.length > 0) {
        byDepartment[deptId].studentsWithMarks.add(student._id.toString());
        studentRecords.forEach(r => {
          byDepartment[deptId].totalMarks += r.totalMarks;
          byDepartment[deptId].recordCount++;
        });
      }
    }
    
    const departmentSummaries = Object.values(byDepartment).map(d => ({
      department: d.department,
      totalStudents: d.totalStudents,
      studentsWithMarks: d.studentsWithMarks.size,
      averageMarks: d.recordCount > 0 ? Math.round((d.totalMarks / d.recordCount) * 100) / 100 : 0
    }));
    
    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        totalRecords: records.length,
        byDepartment: departmentSummaries
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current student's marks
 * @route GET /api/marks/my
 * @access Student
 */
exports.getMyMarks = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    const records = await MarksRecord.find({
      student: req.user._id,
      academicYear: settings.currentAcademicYear
    }).populate('subject', 'name code credits');
    
    // Group by subject
    const bySubject = records.map(record => ({
      _id: record._id,
      subject: record.subject,
      cia1: { marks: record.ciaMarks?.[0] || null, maxMarks: settings.marksConfig?.ciaMaxMarks || 25 },
      cia2: { marks: record.ciaMarks?.[1] || null, maxMarks: settings.marksConfig?.ciaMaxMarks || 25 },
      cia3: { marks: record.ciaMarks?.[2] || null, maxMarks: settings.marksConfig?.ciaMaxMarks || 25 },
      assignment: { marks: record.assignmentMarks, maxMarks: settings.marksConfig?.assignmentMaxMarks || 10 },
      lab: { marks: record.labMarks, maxMarks: settings.marksConfig?.labMaxMarks || 25 },
      attendance: { marks: record.attendanceMarks, maxMarks: settings.marksConfig?.attendanceMaxMarks || 10 },
      total: record.totalMarks
    }));
    
    res.json({
      success: true,
      data: bySubject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current student's consolidated marks
 * @route GET /api/marks/my/consolidated
 * @access Student
 */
exports.getMyConsolidatedMarks = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    const records = await MarksRecord.find({
      student: req.user._id,
      academicYear: settings.currentAcademicYear
    }).populate('subject', 'name code credits');
    
    const consolidated = records.map(record => {
      const maxTotal = 
        (settings.marksConfig?.ciaMaxMarks || 25) * 3 +
        (settings.marksConfig?.assignmentMaxMarks || 10) +
        (settings.marksConfig?.labMaxMarks || 25) +
        (settings.marksConfig?.attendanceMaxMarks || 10);
      
      return {
        subject: record.subject,
        total: record.totalMarks || 0,
        maxTotal,
        percentage: maxTotal > 0 ? ((record.totalMarks || 0) / maxTotal) * 100 : 0
      };
    });
    
    res.json({
      success: true,
      data: consolidated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enter marks in batch for multiple students
 * @route POST /api/marks/enter
 * @access Staff, HOD
 */
exports.enterMarksBatch = async (req, res, next) => {
  try {
    const { subject, type, maxMarks, records } = req.body;
    
    const settings = await InstitutionSettings.getSettings();
    
    // Verify staff is allocated to this subject
    if (req.user.role === ROLES.STAFF) {
      const allocation = await SubjectAllocation.findOne({
        faculty: req.user._id,
        subject,
        academicYear: settings.currentAcademicYear,
        isActive: true
      });
      
      if (!allocation) {
        return res.status(403).json({
          success: false,
          message: 'You are not allocated to this subject'
        });
      }
    }
    
    const results = [];
    
    for (const item of records) {
      const { student, marks } = item;
      
      // Find or create marks record
      let record = await MarksRecord.findOne({
        student,
        subject,
        academicYear: settings.currentAcademicYear
      });
      
      if (!record) {
        record = new MarksRecord({
          student,
          subject,
          academicYear: settings.currentAcademicYear,
          enteredBy: req.user._id
        });
      }
      
      // Update specific mark type
      switch (type) {
        case 'cia1':
          if (!record.ciaMarks) record.ciaMarks = [];
          record.ciaMarks[0] = marks;
          break;
        case 'cia2':
          if (!record.ciaMarks) record.ciaMarks = [];
          record.ciaMarks[1] = marks;
          break;
        case 'cia3':
          if (!record.ciaMarks) record.ciaMarks = [];
          record.ciaMarks[2] = marks;
          break;
        case 'assignment':
          record.assignmentMarks = marks;
          break;
        case 'lab':
          record.labMarks = marks;
          break;
        case 'attendance':
          record.attendanceMarks = marks;
          break;
      }
      
      await record.save();
      results.push(record);
    }
    
    res.json({
      success: true,
      message: `Marks saved for ${results.length} student(s)`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get marks report
 * @route GET /api/marks/report
 * @access Staff, HOD, Admin
 */
exports.getMarksReport = async (req, res, next) => {
  try {
    const { subject, program, semester, section } = req.query;
    const settings = await InstitutionSettings.getSettings();
    
    const query = { academicYear: settings.currentAcademicYear };
    
    if (subject) query.subject = subject;
    
    const records = await MarksRecord.find(query)
      .populate('student', 'name email registrationNumber section semester')
      .populate('subject', 'name code')
      .sort('student.name');
    
    // Filter by program/semester/section if needed
    let filtered = records;
    if (program || semester || section) {
      const studentQuery = { role: ROLES.STUDENT };
      if (program) studentQuery.program = program;
      if (semester) studentQuery.semester = parseInt(semester);
      if (section) studentQuery.section = section.toUpperCase();
      
      const validStudents = await User.find(studentQuery).select('_id');
      const validIds = validStudents.map(s => s._id.toString());
      filtered = records.filter(r => validIds.includes(r.student?._id?.toString()));
    }
    
    const report = filtered.map(record => ({
      student: record.student,
      subject: record.subject,
      cia1: { marks: record.ciaMarks?.[0] || null },
      cia2: { marks: record.ciaMarks?.[1] || null },
      cia3: { marks: record.ciaMarks?.[2] || null },
      assignment: { marks: record.assignmentMarks },
      lab: { marks: record.labMarks },
      attendance: { marks: record.attendanceMarks },
      total: record.totalMarks || 0,
      percentage: record.totalMarks ? (record.totalMarks / 120) * 100 : 0
    }));
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};
