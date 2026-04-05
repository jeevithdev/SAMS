const Subject = require('../models/Subject');
const SubjectAllocation = require('../models/SubjectAllocation');
const InstitutionSettings = require('../models/InstitutionSettings');

/**
 * Create subject
 * @route POST /api/subjects
 * @access Admin
 */
exports.createSubject = async (req, res, next) => {
  try {
    const { name, code, program, semester, credits, isLab } = req.body;
    
    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      program,
      semester,
      credits: credits || 3,
      isLab: isLab || false
    });
    
    const populatedSubject = await Subject.findById(subject._id)
      .populate('program', 'name code');
    
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: populatedSubject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List subjects with filters
 * @route GET /api/subjects
 * @access All authenticated
 */
exports.listSubjects = async (req, res, next) => {
  try {
    const { program, semester, isLab } = req.query;
    
    const filter = { isActive: true };
    if (program) filter.program = program;
    if (semester) filter.semester = parseInt(semester);
    if (typeof isLab !== 'undefined') filter.isLab = isLab === 'true';
    
    const subjects = await Subject.find(filter)
      .populate('program', 'name code department')
      .sort({ semester: 1, name: 1 });
    
    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get allocated subjects for current staff
 * @route GET /api/subjects/my-subjects
 * @access Staff
 */
exports.getMySubjects = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    const allocations = await SubjectAllocation.find({
      faculty: req.user._id,
      academicYear: settings.currentAcademicYear,
      isActive: true
    })
      .populate({
        path: 'subject',
        populate: { path: 'program', select: 'name code' }
      })
      .sort({ 'subject.semester': 1 });
    
    // Format response with subject details
    const subjects = allocations.map(a => ({
      allocationId: a._id,
      subject: a.subject,
      section: a.section,
      academicYear: a.academicYear
    }));
    
    res.json({
      success: true,
      data: subjects,
      count: subjects.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subject by ID
 * @route GET /api/subjects/:id
 * @access All authenticated
 */
exports.getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('program', 'name code department');
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update subject
 * @route PUT /api/subjects/:id
 * @access Admin
 */
exports.updateSubject = async (req, res, next) => {
  try {
    const { name, code, program, semester, credits, isLab, isActive } = req.body;
    
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    if (name) subject.name = name;
    if (code) subject.code = code.toUpperCase();
    if (program) subject.program = program;
    if (semester) subject.semester = semester;
    if (credits) subject.credits = credits;
    if (typeof isLab === 'boolean') subject.isLab = isLab;
    if (typeof isActive === 'boolean') subject.isActive = isActive;
    
    await subject.save();
    
    const updatedSubject = await Subject.findById(subject._id)
      .populate('program', 'name code');
    
    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubject
    });
  } catch (error) {
    next(error);
  }
};
