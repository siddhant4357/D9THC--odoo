import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiUsers, 
  FiDollarSign, 
  FiCheckCircle, 
  FiClock,
  FiTrendingUp,
  FiArrowRight,
  FiSettings,
  FiFileText,
  FiBarChart2,
  FiAlertCircle
} from 'react-icons/fi';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    pendingApprovals: 0,
    totalAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [userBreakdown, setUserBreakdown] = useState({ admin: 0, manager: 0, employee: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all data
      const [expensesRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/expenses', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const allExpenses = expensesRes.data.expenses || [];
      const allUsers = usersRes.data.users || [];
      
      // Calculate expense stats
      const pending = allExpenses.filter(e => e.status === 'submitted');
      const approved = allExpenses.filter(e => e.status === 'approved');
      const rejected = allExpenses.filter(e => e.status === 'rejected');
      
      const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);
      const approvedAmount = approved.reduce((sum, e) => sum + e.amount, 0);
      const rejectedAmount = rejected.reduce((sum, e) => sum + e.amount, 0);
      
      // User breakdown by role
      const roleCount = allUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      setStats({
        totalUsers: allUsers.length,
        totalExpenses: allExpenses.length,
        pendingApprovals: pending.length,
        totalAmount,
        approvedAmount,
        rejectedAmount,
      });
      
      setUserBreakdown(roleCount);
      setRecentExpenses(allExpenses.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: user?.company?.currency?.code || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'text-red-600 bg-red-50 border-red-200';
      case 'submitted': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-2xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 👑</h1>
            <p className="text-purple-100 text-lg">System Overview & Analytics</p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-purple-200 text-sm">System Administrator</p>
              <p className="text-2xl font-bold">{user?.company?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FiUsers size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold">Manage Users</p>
              <p className="text-blue-100 text-xs">{stats.totalUsers} users</p>
            </div>
          </div>
          <FiArrowRight size={20} className="group-hover:translate-x-2 transition" />
        </button>

        <button
          onClick={() => navigate('/admin/approval-rules')}
          className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition shadow-lg group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FiSettings size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold">Approval Rules</p>
              <p className="text-indigo-100 text-xs">Configure workflows</p>
            </div>
          </div>
          <FiArrowRight size={20} className="group-hover:translate-x-2 transition" />
        </button>

        <button
          onClick={() => navigate('/admin/expenses')}
          className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition shadow-lg group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FiFileText size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold">All Expenses</p>
              <p className="text-purple-100 text-xs">{stats.totalExpenses} expenses</p>
            </div>
          </div>
          <FiArrowRight size={20} className="group-hover:translate-x-2 transition" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers}</p>
          <div className="flex items-center space-x-3 text-xs text-gray-600">
            <span>👑 {userBreakdown.admin || 0} Admin</span>
            <span>👨‍💼 {userBreakdown.manager || 0} Manager</span>
            <span>👤 {userBreakdown.employee || 0} Employee</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalExpenses}</p>
          <p className="text-sm text-purple-600 font-semibold">{formatCurrency(stats.totalAmount)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiClock className="text-orange-600" size={20} />
            </div>
            {stats.pendingApprovals > 0 && (
              <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full animate-pulse">
                {stats.pendingApprovals}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Pending Approvals</p>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
          <button
            onClick={() => navigate('/admin/approvals')}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-2 flex items-center"
          >
            Review Now <FiArrowRight className="ml-1" size={12} />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.approvedAmount)}</p>
          <p className="text-xs text-gray-500 mt-2">
            {((stats.approvedAmount / stats.totalAmount) * 100 || 0).toFixed(1)}% of total
          </p>
        </div>
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Financial Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiBarChart2 className="mr-2 text-purple-600" />
            Financial Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Expenses</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(stats.approvedAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(stats.approvedAmount / stats.totalAmount) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="text-sm font-semibold text-red-600">{formatCurrency(stats.rejectedAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${(stats.rejectedAmount / stats.totalAmount) * 100 || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <FiTrendingUp className="mr-2 text-purple-600" />
              Recent Expenses
            </h3>
            <button
              onClick={() => navigate('/admin/expenses')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiFileText className="mx-auto mb-3" size={48} />
              <p>No expenses yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  onClick={() => navigate(`/admin/expenses/${expense._id}`)}
                  className="flex items-center justify-between p-4 hover:bg-purple-50 rounded-lg transition cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiDollarSign className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{expense.description}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span>{expense.employee?.name || 'N/A'}</span>
                        <span>•</span>
                        <span>{formatDate(expense.date)}</span>
                        <span>•</span>
                        <span>{expense.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="space-y-1">
                      {/* Original Amount */}
                      <p className="font-bold text-gray-900">
                        {expense.amount} {expense.currency}
                      </p>
                      
                      {/* Converted Amount (if different currency) */}
                      {expense.convertedAmount && expense.currency !== user?.company?.currency?.code && (
                        <p className="text-sm text-purple-600 font-medium">
                          ≈ {formatCurrency(expense.convertedAmount)}
                        </p>
                      )}
                    </div>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs border rounded-full capitalize font-medium ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiAlertCircle className="text-purple-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Admin Control Panel</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>User Management:</strong> Create/edit users, assign roles, and manage teams</li>
              <li>• <strong>Approval Rules:</strong> Configure sequential/parallel approvals and percentage thresholds</li>
              <li>• <strong>Override Power:</strong> As admin, you can approve/reject any expense</li>
              <li>• <strong>System Monitoring:</strong> Track all expenses across the organization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
