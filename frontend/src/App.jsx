import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import SetupAdmin from './pages/auth/SetupAdmin';

// Dashboards
import StudentDashboard from './pages/dashboards/StudentDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import HODDashboard from './pages/dashboards/HODDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

// Admin pages
import UsersManagement from './pages/admin/UsersManagement';
import DepartmentsManagement from './pages/admin/DepartmentsManagement';
import ProgramsManagement from './pages/admin/ProgramsManagement';
import SubjectsManagement from './pages/admin/SubjectsManagement';
import AllocationsManagement from './pages/admin/AllocationsManagement';
import ActivityCategoriesManagement from './pages/admin/ActivityCategoriesManagement';
import Settings from './pages/admin/Settings';

// Activity pages
import MyActivities from './pages/activities/MyActivities';
import SubmitActivity from './pages/activities/SubmitActivity';
import PendingVerification from './pages/activities/PendingVerification';
import Portfolio from './pages/activities/Portfolio';

// Attendance pages
import MarkAttendance from './pages/attendance/MarkAttendance';
import MyAttendance from './pages/attendance/MyAttendance';
import AttendanceReport from './pages/attendance/AttendanceReport';
import Defaulters from './pages/attendance/Defaulters';

// Marks pages
import EnterMarks from './pages/marks/EnterMarks';
import MyMarks from './pages/marks/MyMarks';
import MarksReport from './pages/marks/MarksReport';

// HOD pages
import HODSubjectsManagement from './pages/hod/HODSubjectsManagement';

// Admin Subject Requests
import SubjectRequestsManagement from './pages/admin/SubjectRequestsManagement';

// Reports
import UnifiedProfile from './pages/reports/UnifiedProfile';
import NAACReports from './pages/reports/NAACReports';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: { background: '#22c55e' },
            },
            error: {
              style: { background: '#ef4444' },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/setup-admin" element={<SetupAdmin />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Role-based dashboard redirect */}
              <Route path="/" element={<DashboardRedirect />} />

              {/* Student routes */}
              <Route path="/student">
                <Route path="dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
                <Route path="activities" element={<ProtectedRoute roles={['student']}><MyActivities /></ProtectedRoute>} />
                <Route path="activities/submit" element={<ProtectedRoute roles={['student']}><SubmitActivity /></ProtectedRoute>} />
                <Route path="attendance" element={<ProtectedRoute roles={['student']}><MyAttendance /></ProtectedRoute>} />
                <Route path="marks" element={<ProtectedRoute roles={['student']}><MyMarks /></ProtectedRoute>} />
                <Route path="portfolio" element={<ProtectedRoute roles={['student']}><Portfolio /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute roles={['student']}><UnifiedProfile /></ProtectedRoute>} />
              </Route>

              {/* Staff routes */}
              <Route path="/staff">
                <Route path="dashboard" element={<ProtectedRoute roles={['staff', 'hod']}><StaffDashboard /></ProtectedRoute>} />
                <Route path="activities/pending" element={<ProtectedRoute roles={['staff', 'hod']}><PendingVerification /></ProtectedRoute>} />
                <Route path="attendance/mark" element={<ProtectedRoute roles={['staff', 'hod']}><MarkAttendance /></ProtectedRoute>} />
                <Route path="attendance/report" element={<ProtectedRoute roles={['staff', 'hod', 'admin']}><AttendanceReport /></ProtectedRoute>} />
                <Route path="marks/enter" element={<ProtectedRoute roles={['staff', 'hod']}><EnterMarks /></ProtectedRoute>} />
                <Route path="marks/report" element={<ProtectedRoute roles={['staff', 'hod', 'admin']}><MarksReport /></ProtectedRoute>} />
              </Route>

              {/* HOD routes */}
              <Route path="/hod">
                <Route path="dashboard" element={<ProtectedRoute roles={['hod']}><HODDashboard /></ProtectedRoute>} />
                <Route path="staff" element={<ProtectedRoute roles={['hod']}><UsersManagement userType="staff" /></ProtectedRoute>} />
                <Route path="students" element={<ProtectedRoute roles={['hod']}><UsersManagement userType="student" /></ProtectedRoute>} />
                <Route path="subjects" element={<ProtectedRoute roles={['hod']}><HODSubjectsManagement /></ProtectedRoute>} />
                <Route path="defaulters" element={<ProtectedRoute roles={['hod', 'admin']}><Defaulters /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute roles={['hod', 'admin']}><NAACReports /></ProtectedRoute>} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin">
                <Route path="dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersManagement /></ProtectedRoute>} />
                <Route path="hods" element={<ProtectedRoute roles={['admin']}><UsersManagement userType="hod" /></ProtectedRoute>} />
                <Route path="departments" element={<ProtectedRoute roles={['admin']}><DepartmentsManagement /></ProtectedRoute>} />
                <Route path="programs" element={<ProtectedRoute roles={['admin']}><ProgramsManagement /></ProtectedRoute>} />
                <Route path="subjects" element={<ProtectedRoute roles={['admin']}><SubjectsManagement /></ProtectedRoute>} />
                <Route path="subject-requests" element={<ProtectedRoute roles={['admin']}><SubjectRequestsManagement /></ProtectedRoute>} />
                <Route path="allocations" element={<ProtectedRoute roles={['admin']}><AllocationsManagement /></ProtectedRoute>} />
                <Route path="activity-categories" element={<ProtectedRoute roles={['admin']}><ActivityCategoriesManagement /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
              </Route>

              {/* Shared routes */}
              <Route path="/profile/:studentId" element={<ProtectedRoute roles={['staff', 'hod', 'admin']}><UnifiedProfile /></ProtectedRoute>} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function DashboardRedirect() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'hod':
      return <Navigate to="/hod/dashboard" replace />;
    case 'staff':
      return <Navigate to="/staff/dashboard" replace />;
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App;
