import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser, FiBriefcase, FiDollarSign } from 'react-icons/fi';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">EM</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Expense Manager</h1>
            </div>
            <div className="flex items-center space-x-3">
              {user?.role === 'admin' && (
                <button
                  onClick={goToAdmin}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
                >
                  <FiBriefcase size={18} />
                  <span>Admin Panel</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition"
              >
                <FiLogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h2>
          <p className="text-purple-100">Here's your expense management dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiUser className="text-purple-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full uppercase">
                {user?.role}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">User Role</h3>
            <p className="text-2xl font-bold text-gray-900 capitalize">{user?.role}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiBriefcase className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Company</h3>
            <p className="text-2xl font-bold text-gray-900">{user?.company?.name}</p>
            <p className="text-sm text-gray-500 mt-1">{user?.company?.country}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Base Currency</h3>
            <p className="text-2xl font-bold text-gray-900">
              {user?.company?.currency?.symbol || user?.company?.currency?.code}
            </p>
            <p className="text-sm text-gray-500 mt-1">{user?.company?.currency?.name}</p>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-purple-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Email:</span>
              <span className="text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Role:</span>
              <span className="text-gray-900 capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Company:</span>
              <span className="text-gray-900">{user?.company?.name}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600 font-medium">Member Since:</span>
              <span className="text-gray-900">
                {new Date(user?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">More Features Coming Soon!</h3>
          <p className="text-gray-600">
            Expense submission, approval workflows, and multi-level approvals are being implemented.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

