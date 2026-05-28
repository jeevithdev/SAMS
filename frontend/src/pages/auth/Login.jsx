import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const rolePlaceholders = {
  student: 'usn@institution.edu',
  staff: 'faculty@institution.edu',
  hod: 'hod@institution.edu',
  admin: 'admin@institution.edu',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);

      const dashboards = {
        admin: '/admin/dashboard',
        hod: '/hod/dashboard',
        staff: '/staff/dashboard',
        student: '/student/dashboard',
      };
      navigate(dashboards[user.role] || from, { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ClipboardDocumentCheckIcon,
      title: 'Activity Tracking',
      desc: 'Comprehensive tracking of all student activities and achievements',
    },
    {
      icon: ChartBarIcon,
      title: 'Smart Analytics',
      desc: 'Data-driven insights for academic performance monitoring',
    },
    {
      icon: UserGroupIcon,
      title: 'Unified Profiles',
      desc: 'Complete student portfolios for holistic development assessment',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-white font-sans" style={{ fontFamily: "'Geist Mono', monospace" }}>
      {/* ───── Left Panel: Branding (Dark Contrast) ───── */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-20 relative overflow-hidden bg-[#002045] w-full lg:w-1/2">
        {/* Centered Wavy Pattern */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none overflow-hidden">
          <svg width="800" height="400" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 12 }).map((_, i) => (
              <path
                key={i}
                d={`M 0 ${80 + i * 20} Q 200 ${-20 + i * 20}, 400 ${80 + i * 20} T 800 ${80 + i * 20}`}
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
            ))}
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 login-animate-in flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <AcademicCapIcon className="h-7 w-7 text-white/80" />
            <span
              className="text-xl font-bold tracking-widest text-white uppercase"
              style={{ fontFamily: "'Geist Mono', monospace" }}
            >
              SAMS
            </span>
          </div>

          <div className="mt-8 mb-auto">
            {/* Hero text */}
            <h1
              className="text-[2.5rem] font-bold leading-[1.2] mb-6 tracking-tight"
              style={{ fontFamily: "'Geist Mono', monospace", color: '#ffffff' }}
            >
              Empowering Academic<br />Excellence
            </h1>
            <p className="text-[15px] leading-relaxed max-w-[26rem] font-medium text-blue-100/90 mb-12">
              Join the next generation of Student Management. Streamline activities, track progress, and foster growth in a high-trust digital environment.
            </p>

          </div>
        </div>
      </div>

      {/* ───── Right Panel: Login Form (White) ───── */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-20 xl:p-28 bg-white w-full lg:w-1/2 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#002045 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Mobile-only logo */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="p-2 rounded-xl" style={{ backgroundColor: '#002045' }}>
            <AcademicCapIcon className="h-7 w-7 text-white" />
          </div>
          <span
            className="text-lg font-bold uppercase tracking-widest"
            style={{ fontFamily: "'Geist Mono', monospace", color: '#002045' }}
          >
            SAMS
          </span>
        </div>

        <div className="login-animate-in-delay w-full max-w-md mx-auto">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "'Geist Mono', monospace", color: '#131b2e' }}
          >
            Welcome Back
          </h2>
          <p className="text-sm mb-8" style={{ color: '#74777f' }}>
            Sign in to continue to SAMS
          </p>

          {/* Role selector tabs */}
          {(() => {
            const roles = [
              { key: 'student', label: 'Student' },
              { key: 'staff', label: 'Staff' },
              { key: 'hod', label: 'HOD' },
              { key: 'admin', label: 'Admin' },
            ];
            const activeIndex = roles.findIndex((r) => r.key === selectedRole);

            return (
              <div
                className="relative flex rounded-lg p-1 mb-8"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {/* Sliding pill indicator */}
                <div
                  className="absolute top-1.5 bottom-1.5 rounded-lg"
                  style={{
                    width: `calc((100% - 12px) / ${roles.length})`,
                    left: `calc(6px + ${activeIndex} * (100% - 12px) / ${roles.length})`,
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
                {roles.map((role) => (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className="relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors duration-300"
                    style={{
                      color: selectedRole === role.key ? '#002045' : '#64748b',
                      letterSpacing: '0.04em',
                      backgroundColor: 'transparent',
                    }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            );
          })()}

          <form onSubmit={handleSubmit} className="space-y-6 login-animate-in-delay-2">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold mb-2"
                style={{ color: '#43474e', letterSpacing: '0.02em' }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl text-sm transition-all duration-300 outline-none bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white focus:bg-white focus:border-[#455f88] focus:ring-4 focus:ring-[#455f88]/10"
                placeholder={rolePlaceholders[selectedRole]}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold mb-2"
                style={{ color: '#43474e', letterSpacing: '0.02em' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 pr-12 rounded-xl text-sm transition-all duration-300 outline-none bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white focus:bg-white focus:border-[#455f88] focus:ring-4 focus:ring-[#455f88]/10"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#43474e')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group mt-2"
              style={{
                backgroundColor: '#002045',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(0,32,69,0.2)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#0a2e61';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,32,69,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#002045';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,32,69,0.2)';
                }
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6" style={{ borderTop: '1px solid #e2e8f0' }}>
            <p className="text-xs text-center" style={{ color: '#64748b' }}>
              Need help?{' '}
              <span className="font-medium cursor-pointer transition-colors" style={{ color: '#002045' }} onMouseEnter={(e) => e.currentTarget.style.color = '#455f88'} onMouseLeave={(e) => e.currentTarget.style.color = '#002045'}>
                Contact your administrator
              </span>
            </p>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#94a3b8' }}>
            SAMS v2.0 — Student Activity Management System
          </p>
        </div>
      </div>
    </div>
  );
}
