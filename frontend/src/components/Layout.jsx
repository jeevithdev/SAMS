import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  UserIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

const navigation = {
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Departments', href: '/admin/departments', icon: BuildingOfficeIcon },
    { name: 'HODs', href: '/admin/hods', icon: UserGroupIcon },
    { name: 'Subjects', href: '/admin/subjects', icon: BookOpenIcon },
    { name: 'Subject Requests', href: '/admin/subject-requests', icon: DocumentCheckIcon },
    { name: 'Activity Categories', href: '/admin/activity-categories', icon: FolderIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
  ],
  hod: [
    { name: 'Dashboard', href: '/hod/dashboard', icon: HomeIcon },
    { name: 'Staff', href: '/hod/staff', icon: UserGroupIcon },
    { name: 'Students', href: '/hod/students', icon: AcademicCapIcon },
    { name: 'Subjects', href: '/hod/subjects', icon: BookOpenIcon },
    { name: 'Attendance Reports', href: '/staff/attendance/report', icon: CalendarDaysIcon },
    { name: 'Marks Reports', href: '/staff/marks/report', icon: ChartBarIcon },
    { name: 'Defaulters', href: '/hod/defaulters', icon: ExclamationTriangleIcon },
    { name: 'NAAC Reports', href: '/hod/reports', icon: DocumentCheckIcon },
  ],
  staff: [
    { name: 'Dashboard', href: '/staff/dashboard', icon: HomeIcon },
    { name: 'Verify Activities', href: '/staff/activities/pending', icon: DocumentCheckIcon },
    { name: 'Mark Attendance', href: '/staff/attendance/mark', icon: CalendarDaysIcon },
    { name: 'Attendance Report', href: '/staff/attendance/report', icon: ChartBarIcon },
    { name: 'Enter Marks', href: '/staff/marks/enter', icon: ClipboardDocumentListIcon },
    { name: 'Marks Report', href: '/staff/marks/report', icon: ChartBarIcon },
  ],
  student: [
    { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon },
    { name: 'My Activities', href: '/student/activities', icon: FolderIcon },
    { name: 'Submit Activity', href: '/student/activities/submit', icon: DocumentCheckIcon },
    { name: 'My Attendance', href: '/student/attendance', icon: CalendarDaysIcon },
    { name: 'My Marks', href: '/student/marks', icon: ChartBarIcon },
    { name: 'My Portfolio', href: '/student/portfolio', icon: UserIcon },
  ],
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = navigation[user?.role] || [];

  const roleColors = {
    admin: 'bg-[#1a4971]',
    hod: 'bg-[#3d6b99]',
    staff: 'bg-[#6b8bad]',
    student: 'bg-[#455f88]',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#002045' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <Link to="/" className="flex items-center space-x-2">
              <AcademicCapIcon className="h-8 w-8 text-white/80" />
              <span className="text-xl font-bold text-white tracking-widest uppercase">SAMS</span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-white/10 text-white/70"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className={`h-10 w-10 rounded-full ${roleColors[user?.role]} flex items-center justify-center ring-2 ring-white/20`}>
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-blue-200/70 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-blue-200/50'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-blue-100/70 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-blue-200/50" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6 text-[#002045]" />
          </button>
          <h1 className="text-lg font-semibold" style={{ color: '#002045' }}>
            {navItems.find((item) => item.href === location.pathname)?.name || 'SAMS'}
          </h1>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
