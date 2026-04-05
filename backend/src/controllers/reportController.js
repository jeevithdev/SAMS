const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AttendanceRecord = require('../models/AttendanceRecord');
const MarksRecord = require('../models/MarksRecord');
const Subject = require('../models/Subject');
const InstitutionSettings = require('../models/InstitutionSettings');
const { ACTIVITY_STATUS, ATTENDANCE_STATUS, ROLES } = require('../config/constants');

/**
 * Calculate attendance helper
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
  
  return {
    totalSessions,
    presentSessions,
    percentage: totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100 * 100) / 100 : 0
  };
};

/**
 * Get unified student profile (activities + attendance + marks)
 * @route GET /api/reports/student-unified/:studentId
 * @access Student (self), Staff (mentor), HOD, Admin
 */
exports.getUnifiedProfile = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const settings = await InstitutionSettings.getSettings();
    
    const student = await User.findById(studentId)
      .populate('department', 'name code')
      .populate('studentFields.program', 'name code')
      .populate('studentFields.mentor', 'name email');
    
    if (!student || student.role !== ROLES.STUDENT) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Staff can only see their mentees
    if (req.user.role === ROLES.STAFF && !req.isOwner) {
      if (student.studentFields?.mentor?._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your mentees\' profiles.'
        });
      }
    }
    
    // Get verified activities
    const activities = await Activity.find({
      student: studentId,
      status: ACTIVITY_STATUS.VERIFIED
    })
      .populate('category', 'name')
      .sort({ activityDate: -1 });
    
    // Get subjects
    const subjects = await Subject.find({
      program: student.studentFields?.program?._id,
      semester: student.studentFields?.currentSemester,
      isActive: true
    });
    
    // Get attendance for each subject
    const attendanceData = [];
    let overallTotalSessions = 0;
    let overallPresentSessions = 0;
    
    for (const subject of subjects) {
      const stats = await calculateAttendancePercentage(
        studentId,
        subject._id,
        settings.currentAcademicYear
      );
      
      overallTotalSessions += stats.totalSessions;
      overallPresentSessions += stats.presentSessions;
      
      attendanceData.push({
        subject: { _id: subject._id, name: subject.name, code: subject.code },
        ...stats,
        isDefaulter: stats.percentage < settings.defaulterThreshold
      });
    }
    
    // Get marks
    const marksRecords = await MarksRecord.find({
      student: studentId,
      academicYear: settings.currentAcademicYear
    }).populate('subject', 'name code isLab');
    
    const marksData = marksRecords.map(r => ({
      subject: r.subject,
      cia: r.ciaMarks,
      assignment: r.assignmentMarks,
      lab: r.labMarks,
      attendance: r.attendanceMarks,
      total: r.totalMarks,
      maxMarks: {
        cia: settings.marksConfig.ciaMaxMarks,
        assignment: settings.marksConfig.assignmentMaxMarks,
        lab: r.subject.isLab ? settings.marksConfig.labMaxMarks : 0,
        attendance: settings.marksConfig.attendanceMaxMarks
      }
    }));
    
    const overallAttendance = overallTotalSessions > 0 
      ? Math.round((overallPresentSessions / overallTotalSessions) * 100 * 100) / 100 
      : 0;
    
    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.studentFields?.rollNumber,
          program: student.studentFields?.program,
          semester: student.studentFields?.currentSemester,
          section: student.studentFields?.section,
          department: student.department,
          mentor: student.studentFields?.mentor,
          admissionYear: student.studentFields?.admissionYear
        },
        activities: {
          count: activities.length,
          list: activities,
          byCategory: activities.reduce((acc, a) => {
            const cat = a.category.name;
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {})
        },
        attendance: {
          overall: {
            totalSessions: overallTotalSessions,
            presentSessions: overallPresentSessions,
            percentage: overallAttendance,
            isDefaulter: overallAttendance < settings.defaulterThreshold
          },
          bySubject: attendanceData,
          threshold: settings.defaulterThreshold
        },
        marks: {
          subjects: marksData,
          totalMarks: marksData.reduce((sum, m) => sum + m.total, 0)
        },
        generatedAt: new Date().toISOString(),
        academicYear: settings.currentAcademicYear
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * NAAC format attendance report
 * @route GET /api/reports/naac-attendance
 * @access Admin
 */
exports.getNaacAttendance = async (req, res, next) => {
  try {
    const { department, program, semester } = req.query;
    const settings = await InstitutionSettings.getSettings();
    
    const filter = { role: ROLES.STUDENT, isActive: true };
    if (department) filter.department = department;
    if (program) filter['studentFields.program'] = program;
    if (semester) filter['studentFields.currentSemester'] = parseInt(semester);
    
    const students = await User.find(filter)
      .populate('department', 'name code')
      .populate('studentFields.program', 'name code')
      .sort({ 'studentFields.rollNumber': 1 });
    
    const report = [];
    
    for (const student of students) {
      const subjects = await Subject.find({
        program: student.studentFields?.program?._id,
        semester: student.studentFields?.currentSemester,
        isActive: true
      });
      
      let totalSessions = 0;
      let presentSessions = 0;
      
      for (const subject of subjects) {
        const stats = await calculateAttendancePercentage(
          student._id,
          subject._id,
          settings.currentAcademicYear
        );
        totalSessions += stats.totalSessions;
        presentSessions += stats.presentSessions;
      }
      
      const percentage = totalSessions > 0 
        ? Math.round((presentSessions / totalSessions) * 100 * 100) / 100 
        : 0;
      
      report.push({
        rollNumber: student.studentFields?.rollNumber,
        name: student.name,
        program: student.studentFields?.program?.code,
        semester: student.studentFields?.currentSemester,
        section: student.studentFields?.section,
        department: student.department?.code,
        totalClasses: totalSessions,
        classesAttended: presentSessions,
        attendancePercentage: percentage,
        status: percentage >= settings.defaulterThreshold ? 'Regular' : 'Defaulter'
      });
    }
    
    res.json({
      success: true,
      data: {
        title: 'NAAC Attendance Report',
        institution: settings.institutionName,
        academicYear: settings.currentAcademicYear,
        generatedAt: new Date().toISOString(),
        threshold: settings.defaulterThreshold,
        totalStudents: report.length,
        defaulterCount: report.filter(r => r.status === 'Defaulter').length,
        records: report
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * NAAC format activities report
 * @route GET /api/reports/naac-activities
 * @access Admin
 */
exports.getNaacActivities = async (req, res, next) => {
  try {
    const { department, category, startDate, endDate } = req.query;
    const settings = await InstitutionSettings.getSettings();
    
    let studentFilter = { role: ROLES.STUDENT, isActive: true };
    if (department) studentFilter.department = department;
    
    const students = await User.find(studentFilter).select('_id');
    const studentIds = students.map(s => s._id);
    
    const activityFilter = {
      student: { $in: studentIds },
      status: ACTIVITY_STATUS.VERIFIED
    };
    
    if (category) activityFilter.category = category;
    if (startDate || endDate) {
      activityFilter.activityDate = {};
      if (startDate) activityFilter.activityDate.$gte = new Date(startDate);
      if (endDate) activityFilter.activityDate.$lte = new Date(endDate);
    }
    
    const activities = await Activity.find(activityFilter)
      .populate('student', 'name email studentFields.rollNumber department')
      .populate('category', 'name')
      .populate('verifiedBy', 'name')
      .sort({ activityDate: -1 });
    
    // Group by category
    const byCategory = activities.reduce((acc, a) => {
      const cat = a.category.name;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({
        student: a.student.name,
        rollNumber: a.student.studentFields?.rollNumber,
        title: a.title,
        date: a.activityDate,
        verifiedBy: a.verifiedBy?.name
      });
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        title: 'NAAC Student Activities Report',
        institution: settings.institutionName,
        academicYear: settings.currentAcademicYear,
        generatedAt: new Date().toISOString(),
        totalActivities: activities.length,
        uniqueStudents: new Set(activities.map(a => a.student._id.toString())).size,
        byCategory,
        categoryWiseCount: Object.entries(byCategory).map(([cat, acts]) => ({
          category: cat,
          count: acts.length
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export report as PDF
 * @route GET /api/reports/export/:type
 * @access Admin, HOD
 */
exports.exportReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { studentId, department } = req.query;
    const settings = await InstitutionSettings.getSettings();
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.pdf`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text(settings.institutionName, { align: 'center' });
    doc.fontSize(12).text(`Academic Year: ${settings.currentAcademicYear}`, { align: 'center' });
    doc.moveDown();
    
    if (type === 'student-profile' && studentId) {
      const student = await User.findById(studentId)
        .populate('department', 'name')
        .populate('studentFields.program', 'name')
        .populate('studentFields.mentor', 'name');
      
      if (!student) {
        doc.text('Student not found');
      } else {
        doc.fontSize(16).text('Student Profile Report', { align: 'center' });
        doc.moveDown();
        
        // Student info
        doc.fontSize(12);
        doc.text(`Name: ${student.name}`);
        doc.text(`Roll Number: ${student.studentFields?.rollNumber || 'N/A'}`);
        doc.text(`Email: ${student.email}`);
        doc.text(`Program: ${student.studentFields?.program?.name || 'N/A'}`);
        doc.text(`Semester: ${student.studentFields?.currentSemester || 'N/A'}`);
        doc.text(`Section: ${student.studentFields?.section || 'N/A'}`);
        doc.text(`Department: ${student.department?.name || 'N/A'}`);
        doc.text(`Mentor: ${student.studentFields?.mentor?.name || 'Not Assigned'}`);
        doc.moveDown();
        
        // Activities
        const activities = await Activity.find({
          student: studentId,
          status: ACTIVITY_STATUS.VERIFIED
        }).populate('category', 'name');
        
        doc.fontSize(14).text('Verified Activities', { underline: true });
        doc.fontSize(10);
        if (activities.length === 0) {
          doc.text('No verified activities');
        } else {
          activities.forEach((a, i) => {
            doc.text(`${i + 1}. ${a.title} (${a.category.name}) - ${a.activityDate.toLocaleDateString()}`);
          });
        }
        doc.moveDown();
        
        // Attendance
        const subjects = await Subject.find({
          program: student.studentFields?.program?._id,
          semester: student.studentFields?.currentSemester,
          isActive: true
        });
        
        doc.fontSize(14).text('Attendance Summary', { underline: true });
        doc.fontSize(10);
        
        for (const subject of subjects) {
          const stats = await calculateAttendancePercentage(
            studentId,
            subject._id,
            settings.currentAcademicYear
          );
          const status = stats.percentage >= settings.defaulterThreshold ? '✓' : '⚠';
          doc.text(`${subject.code}: ${stats.percentage}% (${stats.presentSessions}/${stats.totalSessions}) ${status}`);
        }
        doc.moveDown();
        
        // Marks
        const marks = await MarksRecord.find({
          student: studentId,
          academicYear: settings.currentAcademicYear
        }).populate('subject', 'name code');
        
        doc.fontSize(14).text('Internal Marks', { underline: true });
        doc.fontSize(10);
        
        if (marks.length === 0) {
          doc.text('No marks recorded');
        } else {
          marks.forEach(m => {
            doc.text(`${m.subject.code}: CIA=${m.ciaMarks} | Assign=${m.assignmentMarks} | Lab=${m.labMarks} | Att=${m.attendanceMarks} | Total=${m.totalMarks}`);
          });
        }
      }
    } else if (type === 'defaulters') {
      doc.fontSize(16).text('Attendance Defaulters Report', { align: 'center' });
      doc.moveDown();
      
      let studentFilter = { role: ROLES.STUDENT, isActive: true };
      if (req.user.role === ROLES.HOD) {
        studentFilter.department = req.user.department._id;
      } else if (department) {
        studentFilter.department = department;
      }
      
      const students = await User.find(studentFilter)
        .populate('studentFields.program', 'name code');
      
      let defaulters = [];
      
      for (const student of students) {
        const subjects = await Subject.find({
          program: student.studentFields?.program?._id,
          semester: student.studentFields?.currentSemester,
          isActive: true
        });
        
        for (const subject of subjects) {
          const stats = await calculateAttendancePercentage(
            student._id,
            subject._id,
            settings.currentAcademicYear
          );
          
          if (stats.totalSessions > 0 && stats.percentage < settings.defaulterThreshold) {
            defaulters.push({
              rollNumber: student.studentFields?.rollNumber,
              name: student.name,
              subject: subject.code,
              percentage: stats.percentage
            });
          }
        }
      }
      
      // Sort by percentage
      defaulters.sort((a, b) => a.percentage - b.percentage);
      
      doc.fontSize(10);
      doc.text(`Threshold: ${settings.defaulterThreshold}%`);
      doc.text(`Total Defaulters: ${defaulters.length}`);
      doc.moveDown();
      
      defaulters.forEach((d, i) => {
        doc.text(`${i + 1}. ${d.rollNumber || 'N/A'} - ${d.name} | ${d.subject}: ${d.percentage}%`);
      });
    } else {
      doc.text('Invalid report type');
    }
    
    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    
    doc.end();
  } catch (error) {
    next(error);
  }
};
