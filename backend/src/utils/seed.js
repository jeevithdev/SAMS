/**
 * SAMS Database Seed Script
 * Run with: npm run seed
 * 
 * This creates sample data for testing all features
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Department = require('../models/Department');
const Program = require('../models/Program');
const Subject = require('../models/Subject');
const SubjectAllocation = require('../models/SubjectAllocation');
const ActivityCategory = require('../models/ActivityCategory');
const InstitutionSettings = require('../models/InstitutionSettings');

const { ROLES } = require('../config/constants');
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Program.deleteMany({}),
      Subject.deleteMany({}),
      SubjectAllocation.deleteMany({}),
      ActivityCategory.deleteMany({}),
      InstitutionSettings.deleteMany({})
    ]);
    
    // Create Institution Settings
    console.log('⚙️  Creating institution settings...');
    await InstitutionSettings.create({
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
      institutionName: 'SAMS Demo Institution'
    });
    
    // Create Departments
    console.log('🏢 Creating departments...');
    const cseDept = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE'
    });
    
    const eceDept = await Department.create({
      name: 'Electronics and Communication Engineering',
      code: 'ECE'
    });
    
    // Create Admin
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      email: 'admin@sams.edu',
      password: 'admin123',
      name: 'System Administrator',
      role: ROLES.ADMIN
    });
    
    // Create HODs
    console.log('👤 Creating HOD users...');
    const cseHod = await User.create({
      email: 'hod.cse@sams.edu',
      password: 'hod123',
      name: 'Dr. Rajesh Kumar',
      role: ROLES.HOD,
      department: cseDept._id,
      staffFields: {
        employeeId: 'HOD001',
        designation: 'Professor & HOD'
      }
    });
    
    const eceHod = await User.create({
      email: 'hod.ece@sams.edu',
      password: 'hod123',
      name: 'Dr. Priya Sharma',
      role: ROLES.HOD,
      department: eceDept._id,
      staffFields: {
        employeeId: 'HOD002',
        designation: 'Professor & HOD'
      }
    });
    
    // Update departments with HODs
    await Department.findByIdAndUpdate(cseDept._id, { hod: cseHod._id });
    await Department.findByIdAndUpdate(eceDept._id, { hod: eceHod._id });
    
    // Create Staff
    console.log('👤 Creating staff users...');
    const staff1 = await User.create({
      email: 'staff1@sams.edu',
      password: 'staff123',
      name: 'Prof. Anand Verma',
      role: ROLES.STAFF,
      department: cseDept._id,
      staffFields: {
        employeeId: 'CSE001',
        designation: 'Associate Professor'
      }
    });
    
    const staff2 = await User.create({
      email: 'staff2@sams.edu',
      password: 'staff123',
      name: 'Prof. Meena Iyer',
      role: ROLES.STAFF,
      department: cseDept._id,
      staffFields: {
        employeeId: 'CSE002',
        designation: 'Assistant Professor'
      }
    });
    
    const staff3 = await User.create({
      email: 'staff3@sams.edu',
      password: 'staff123',
      name: 'Prof. Karthik Rajan',
      role: ROLES.STAFF,
      department: eceDept._id,
      staffFields: {
        employeeId: 'ECE001',
        designation: 'Associate Professor'
      }
    });
    
    // Create Programs
    console.log('📚 Creating programs...');
    const btechCse = await Program.create({
      name: 'Bachelor of Technology in Computer Science',
      code: 'BTECH-CSE',
      department: cseDept._id,
      totalSemesters: 8
    });
    
    const btechEce = await Program.create({
      name: 'Bachelor of Technology in Electronics',
      code: 'BTECH-ECE',
      department: eceDept._id,
      totalSemesters: 8
    });
    
    // Create Subjects (Semester 5 for demo)
    console.log('📖 Creating subjects...');
    const subjects = await Subject.insertMany([
      // CSE Semester 5
      { name: 'Database Management Systems', code: 'CS501', program: btechCse._id, semester: 5, credits: 4, isLab: false },
      { name: 'Database Lab', code: 'CS502', program: btechCse._id, semester: 5, credits: 2, isLab: true },
      { name: 'Computer Networks', code: 'CS503', program: btechCse._id, semester: 5, credits: 4, isLab: false },
      { name: 'Operating Systems', code: 'CS504', program: btechCse._id, semester: 5, credits: 4, isLab: false },
      { name: 'Software Engineering', code: 'CS505', program: btechCse._id, semester: 5, credits: 3, isLab: false },
      
      // ECE Semester 5
      { name: 'Digital Signal Processing', code: 'EC501', program: btechEce._id, semester: 5, credits: 4, isLab: false },
      { name: 'VLSI Design', code: 'EC502', program: btechEce._id, semester: 5, credits: 4, isLab: false },
      { name: 'Embedded Systems', code: 'EC503', program: btechEce._id, semester: 5, credits: 4, isLab: false }
    ]);
    
    // Create Subject Allocations
    console.log('📋 Creating subject allocations...');
    const cseSubjects = subjects.filter(s => s.program.toString() === btechCse._id.toString());
    
    await SubjectAllocation.insertMany([
      // Staff 1 teaches DBMS and DB Lab for Section A
      { faculty: staff1._id, subject: cseSubjects[0]._id, academicYear: '2024-25', section: 'A' },
      { faculty: staff1._id, subject: cseSubjects[1]._id, academicYear: '2024-25', section: 'A' },
      // Staff 2 teaches CN and OS for Section A
      { faculty: staff2._id, subject: cseSubjects[2]._id, academicYear: '2024-25', section: 'A' },
      { faculty: staff2._id, subject: cseSubjects[3]._id, academicYear: '2024-25', section: 'A' },
      // Staff 1 also teaches SE for Section A
      { faculty: staff1._id, subject: cseSubjects[4]._id, academicYear: '2024-25', section: 'A' }
    ]);
    
    // Create Students
    console.log('👨‍🎓 Creating students...');
    const students = [];
    
    for (let i = 1; i <= 5; i++) {
      const student = await User.create({
        email: `student${i}@sams.edu`,
        password: 'student123',
        name: `Student ${i}`,
        role: ROLES.STUDENT,
        department: cseDept._id,
        studentFields: {
          rollNumber: `CSE2024${String(i).padStart(3, '0')}`,
          program: btechCse._id,
          currentSemester: 5,
          section: 'A',
          mentor: i <= 3 ? staff1._id : staff2._id, // First 3 with staff1, rest with staff2
          admissionYear: 2022
        }
      });
      students.push(student);
    }
    
    // Create Activity Categories
    console.log('🏆 Creating activity categories...');
    await ActivityCategory.insertMany([
      { name: 'Hackathon', description: 'Participation or wins in hackathons' },
      { name: 'Workshop', description: 'Attended technical workshops' },
      { name: 'Internship', description: 'Industry internships' },
      { name: 'Certification', description: 'Online course certifications' },
      { name: 'Paper Publication', description: 'Research paper publications' },
      { name: 'Club Activity', description: 'Participation in college clubs' },
      { name: 'Sports', description: 'Sports achievements' },
      { name: 'Cultural', description: 'Cultural event participation' }
    ]);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log('\n📋 TEST ACCOUNTS CREATED:\n');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ ROLE     │ EMAIL                │ PASSWORD     │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ Admin    │ admin@sams.edu       │ admin123     │');
    console.log('│ HOD(CSE) │ hod.cse@sams.edu     │ hod123       │');
    console.log('│ HOD(ECE) │ hod.ece@sams.edu     │ hod123       │');
    console.log('│ Staff    │ staff1@sams.edu      │ staff123     │');
    console.log('│ Staff    │ staff2@sams.edu      │ staff123     │');
    console.log('│ Staff    │ staff3@sams.edu      │ staff123     │');
    console.log('│ Student  │ student1@sams.edu    │ student123   │');
    console.log('│ Student  │ student2@sams.edu    │ student123   │');
    console.log('│ Student  │ student3@sams.edu    │ student123   │');
    console.log('│ Student  │ student4@sams.edu    │ student123   │');
    console.log('│ Student  │ student5@sams.edu    │ student123   │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('\n📌 NOTES:');
    console.log('• Students 1-3 are mentored by staff1@sams.edu');
    console.log('• Students 4-5 are mentored by staff2@sams.edu');
    console.log('• staff1 teaches DBMS, DB Lab, and SE for CSE Sem-5 Section A');
    console.log('• staff2 teaches CN and OS for CSE Sem-5 Section A');
    console.log('• 5 CSE subjects created for Semester 5');
    console.log('• 8 activity categories created\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedDatabase();
