import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
      
      // Navigate based on role
      const dashboards = {
        admin: '/admin/dashboard',
        hod: '/hod/dashboard',
        staff: '/staff/dashboard',
        student: '/student/dashboard',
      };
      navigate(dashboards[user.role] || from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-4 rounded-2xl shadow-lg">
              <AcademicCapIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Student Activity Management System
          </h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/setup-admin"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              First time? Setup Admin Account
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/60 backdrop-blur rounded-lg p-4 text-xs text-gray-600">
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-medium">Admin:</p>
              <p>admin@sams.edu / admin123</p>
            </div>
            <div>
              <p className="font-medium">Student:</p>
              <p>student1@sams.edu / student123</p>
            </div>
            <div>
              <p className="font-medium">Staff:</p>
              <p>staff1@sams.edu / staff123</p>
            </div>
            <div>
              <p className="font-medium">HOD:</p>
              <p>hod.cse@sams.edu / hod123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
