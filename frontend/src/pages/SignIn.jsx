import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const SignIn = () => {
  const navigate = useNavigate();
  const { signin, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');  // Go to role-specific dashboard
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    const result = await signin({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (result.success) {
      // Check if user needs to change password (first login)
      if (result.user && result.user.firstLogin) {
        navigate('/change-password');
      } else {
        navigate('/admin');  // Go to role-specific dashboard
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20">
              <svg viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                <circle cx="96" cy="96" r="96" fill="url(#grad1-signin)"/>
                <defs>
                  <linearGradient id="grad1-signin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#9333ea', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#6b21a8', stopOpacity:1}} />
                  </linearGradient>
                  <linearGradient id="grad2-signin" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:0.95}} />
                    <stop offset="100%" style={{stopColor:'#f3e8ff', stopOpacity:0.95}} />
                  </linearGradient>
                </defs>
                <g transform="translate(96, 96)">
                  <rect x="-32" y="-42" width="64" height="84" rx="6" fill="url(#grad2-signin)" stroke="#ffffff" strokeWidth="2"/>
                  <rect x="-26" y="-36" width="52" height="4" rx="2" fill="#9333ea"/>
                  <rect x="-26" y="-24" width="38" height="2" rx="1" fill="#9333ea" opacity="0.7"/>
                  <rect x="-26" y="-16" width="42" height="2" rx="1" fill="#9333ea" opacity="0.7"/>
                  <rect x="-26" y="-8" width="35" height="2" rx="1" fill="#9333ea" opacity="0.7"/>
                  <rect x="-26" y="0" width="40" height="2" rx="1" fill="#9333ea" opacity="0.7"/>
                  <line x1="-26" y1="10" x2="26" y2="10" stroke="#9333ea" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.5"/>
                  <rect x="-26" y="18" width="52" height="3" rx="1.5" fill="#9333ea"/>
                  <rect x="-26" y="26" width="52" height="4" rx="2" fill="#9333ea"/>
                  <circle cx="20" cy="-28" r="14" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>
                  <text x="20" y="-21" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#ffffff" textAnchor="middle">$</text>
                  <circle cx="-20" cy="32" r="12" fill="#3b82f6" stroke="#ffffff" strokeWidth="2"/>
                  <path d="M -25 32 L -20 37 L -14 27" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </g>
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to manage your expenses</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" size={20} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition duration-150"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition duration-150"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="text-gray-400 hover:text-gray-600" size={20} />
                  ) : (
                    <FiEye className="text-gray-400 hover:text-gray-600" size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-600 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-purple-600 hover:text-purple-700 transition">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-purple-600 hover:text-purple-700 transition">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure authentication powered by modern encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

