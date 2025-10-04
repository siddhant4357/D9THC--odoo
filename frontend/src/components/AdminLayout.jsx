import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiUsers, 
  FiCheckCircle, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiHome,
  FiBriefcase,
  FiSettings,
  FiBarChart2
} from 'react-icons/fi';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Start with sidebar closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome },
    { name: 'My Expenses', href: '/admin/expenses', icon: FiBriefcase },
    ...(user?.role === 'manager' || user?.role === 'admin' 
      ? [{ name: 'Pending Approvals', href: '/admin/approvals', icon: FiCheckCircle }] 
      : []),
    { name: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
    ...(user?.role === 'admin' 
      ? [
          { name: 'User Management', href: '/admin/users', icon: FiUsers },
          { name: 'Approval Rules', href: '/admin/approval-rules', icon: FiSettings },
        ] 
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Top Header - Mobile Optimized */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-30 shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-purple-50 transition lg:hidden flex-shrink-0"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
              
              {/* Logo and Title */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                {/* SVG Logo */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <svg viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="96" cy="96" r="96" fill="url(#grad1)"/>
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#9333ea', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'#6b21a8', stopOpacity:1}} />
                      </linearGradient>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:0.95}} />
                        <stop offset="100%" style={{stopColor:'#f3e8ff', stopOpacity:0.95}} />
                      </linearGradient>
                    </defs>
                    <g transform="translate(96, 96)">
                      <rect x="-32" y="-42" width="64" height="84" rx="6" fill="url(#grad2)" stroke="#ffffff" strokeWidth="2"/>
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
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Expense Manager</h1>
                  <p className="text-xs text-gray-500 capitalize">{user?.role} Portal</p>
                </div>
                {/* Mobile Title */}
                <div className="sm:hidden">
                  <h1 className="text-sm font-bold text-gray-900 truncate">Expense Manager</h1>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
              {/* User Info - Hidden on Mobile */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{user?.name}</p>
                <p className="text-xs text-purple-600 capitalize">{user?.role}</p>
              </div>
              
              {/* User Avatar */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold text-xs sm:text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                title="Logout"
                aria-label="Logout"
              >
                <FiLogOut size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar - Mobile Optimized */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:sticky top-14 sm:top-16 left-0 z-20 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-64 sm:w-72 bg-white border-r border-purple-100 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto shadow-xl lg:shadow-none`}
        >
          {/* Mobile: User Info at Top */}
          <div className="lg:hidden p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-sm text-purple-600 capitalize">{user?.role}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-purple-50 active:bg-purple-100'
                  }`}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Company Info */}
          <div className="p-3 sm:p-4 mt-4 sm:mt-8 border-t border-purple-100">
            <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FiBriefcase className="text-purple-600 flex-shrink-0" size={18} />
                <p className="text-xs font-semibold text-gray-600 uppercase">Company</p>
              </div>
              <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{user?.company?.name}</p>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{user?.company?.country}</p>
              <div className="mt-2 pt-2 border-t border-purple-200">
                <p className="text-xs text-gray-500">Base Currency</p>
                <p className="font-medium text-purple-600 text-sm truncate">
                  {user?.company?.currency?.symbol || user?.company?.currency?.code} - {user?.company?.currency?.name}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

