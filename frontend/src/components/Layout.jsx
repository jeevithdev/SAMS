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
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
    { name: 'Departments', href: '/admin/departments', icon: BuildingOfficeIcon },
    { name: 'Programs', href: '/admin/programs', icon: AcademicCapIcon },
    { name: 'Subjects', href: '/admin/subjects', icon: BookOpenIcon },
    { name: 'Allocations', href: '/admin/allocations', icon: ClipboardDocumentListIcon },
    { name: 'Activity Categories', href: '/admin/activity-categories', icon: FolderIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
  ],
  hod: [
    { name: 'Dashboard', href: '/hod/dashboard', icon: HomeIcon },
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
    admin: 'bg-red-600',
    hod: 'bg-purple-600',
    staff: 'bg-blue-600',
    student: 'bg-green-600',
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
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">SAMS</span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b">
            <div className="flex items-center space-x-3">
              <div className={`h-10 w-10 rounded-full ${roleColors[user?.role]} flex items-center justify-center`}>
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
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
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
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
