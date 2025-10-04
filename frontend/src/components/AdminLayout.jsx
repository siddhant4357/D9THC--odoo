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
  FiSettings
} from 'react-icons/fi';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    ...(user?.role === 'admin' 
      ? [
          { name: 'User Management', href: '/admin/users', icon: FiUsers },
          { name: 'Approval Rules', href: '/admin/approval-rules', icon: FiSettings },
        ] 
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Top Header */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-purple-50 transition lg:hidden"
              >
                {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg font-bold">EM</span>
                </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Expense Manager</h1>
                <p className="text-xs text-gray-500 capitalize">{user?.role} Portal</p>
              </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-purple-600 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                title="Logout"
              >
                <FiLogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:sticky top-16 left-0 z-20 h-[calc(100vh-4rem)] w-64 bg-white border-r border-purple-100 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto`}
        >
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Company Info */}
          <div className="p-4 mt-8 border-t border-purple-100">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FiBriefcase className="text-purple-600" size={18} />
                <p className="text-xs font-semibold text-gray-600 uppercase">Company</p>
              </div>
              <p className="font-semibold text-gray-900 truncate">{user?.company?.name}</p>
              <p className="text-sm text-gray-600">{user?.company?.country}</p>
              <div className="mt-2 pt-2 border-t border-purple-200">
                <p className="text-xs text-gray-500">Base Currency</p>
                <p className="font-medium text-purple-600">
                  {user?.company?.currency?.symbol || user?.company?.currency?.code} - {user?.company?.currency?.name}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

