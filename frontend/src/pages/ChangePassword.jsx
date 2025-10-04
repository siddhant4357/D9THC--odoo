import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiX, FiShield } from 'react-icons/fi';
import axios from 'axios';

const ChangePassword = ({ isFirstLogin = false }) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength: 1, label: 'Weak', color: 'text-red-600 bg-red-50' };
    if (strength === 3) return { strength: 2, label: 'Fair', color: 'text-yellow-600 bg-yellow-50' };
    if (strength === 4) return { strength: 3, label: 'Good', color: 'text-blue-600 bg-blue-50' };
    return { strength: 4, label: 'Strong', color: 'text-green-600 bg-green-50' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/auth/change-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      
      // Update user context to remove firstLogin flag
      if (user && user.firstLogin) {
        updateUser({ ...user, firstLogin: false });
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (error) {
      console.error('Change password error:', error);
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        {isFirstLogin && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <FiShield className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-yellow-900 mb-1">Password Change Required</h3>
              <p className="text-sm text-yellow-800">
                For security reasons, you must change your company-generated password before continuing.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4">
              <svg viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                <circle cx="96" cy="96" r="96" fill="url(#grad1-changepwd)"/>
                <defs>
                  <linearGradient id="grad1-changepwd" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#9333ea', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#6b21a8', stopOpacity:1}} />
                  </linearGradient>
                  <linearGradient id="grad2-changepwd" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:0.95}} />
                    <stop offset="100%" style={{stopColor:'#f3e8ff', stopOpacity:0.95}} />
                  </linearGradient>
                </defs>
                <g transform="translate(96, 96)">
                  <rect x="-32" y="-42" width="64" height="84" rx="6" fill="url(#grad2-changepwd)" stroke="#ffffff" strokeWidth="2"/>
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {isFirstLogin ? 'Set Your Password' : 'Change Password'}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              {isFirstLogin 
                ? 'Create a strong, secure password for your account' 
                : 'Update your password to keep your account secure'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <FiX size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center space-x-2">
              <FiCheck size={18} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword.current ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword.new ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                        passwordStrength.strength === 2 ? 'bg-yellow-500 w-2/4' :
                        passwordStrength.strength === 3 ? 'bg-blue-500 w-3/4' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Use 8+ characters with uppercase, lowercase, numbers, and symbols
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword.confirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-xs text-red-600 mt-2 flex items-center">
                  <FiX size={14} className="mr-1" />
                  Passwords do not match
                </p>
              )}
              {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <FiCheck size={14} className="mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Changing Password...' : isFirstLogin ? 'Set Password & Continue' : 'Change Password'}
            </button>

            {/* Cancel Button (only if not first login) */}
            {!isFirstLogin && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <FiShield className="mr-2" />
            Security Tips
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a unique password you don't use elsewhere</li>
            <li>• Include uppercase, lowercase, numbers, and symbols</li>
            <li>• Avoid personal information (name, birthdate, etc.)</li>
            <li>• Change your password regularly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;

