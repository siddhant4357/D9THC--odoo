import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiUsers,
  FiDollarSign,
  FiArrowRight,
  FiTrendingUp,
  FiAlertCircle,
  FiFileText,
  FiTarget
} from 'react-icons/fi';
import axios from 'axios';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [teamStats, setTeamStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    avgApprovalTime: '2.5 hours',
  });
  const [recentActions, setRecentActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pending approvals
      const response = await axios.get('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allExpenses = response.data.expenses || [];
      
      // Filter pending expenses (submitted but not approved/rejected)
      const pending = allExpenses.filter(e => e.status === 'submitted');
      setPendingExpenses(pending.slice(0, 5)); // Top 5
      
      // Calculate today's approvals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const approvedToday = allExpenses.filter(e => {
        if (e.status !== 'approved') return false;
        const lastApproval = e.approvalHistory?.[e.approvalHistory.length - 1];
        if (!lastApproval) return false;
        const approvalDate = new Date(lastApproval.timestamp);
        return approvalDate >= today;
      }).length;
      
      const rejectedToday = allExpenses.filter(e => {
        if (e.status !== 'rejected') return false;
        const lastApproval = e.approvalHistory?.[e.approvalHistory.length - 1];
        if (!lastApproval) return false;
        const approvalDate = new Date(lastApproval.timestamp);
        return approvalDate >= today;
      }).length;
      
      // Use backend-calculated stats or fallback to calculation
      const backendStats = response.data.stats;
      const pendingAmount = pending.reduce((sum, e) => sum + e.amount, 0);
      
      setTeamStats({
        pendingCount: backendStats?.pendingCount || pending.length,
        pendingAmount: backendStats?.pendingAmount || pendingAmount,
        approvedToday: backendStats?.approvedToday || approvedToday,
        rejectedToday: backendStats?.rejectedToday || rejectedToday,
        avgApprovalTime: backendStats?.avgApprovalTime || '2.5 hours',
      });
      
      // Get recent actions (approved/rejected today)
      const recentActionsData = allExpenses
        .filter(e => {
          const lastApproval = e.approvalHistory?.[e.approvalHistory.length - 1];
          if (!lastApproval) return false;
          const approvalDate = new Date(lastApproval.timestamp);
          return approvalDate >= today && (e.status === 'approved' || e.status === 'rejected');
        })
        .slice(0, 5)
        .map(e => ({
          ...e,
          lastAction: e.approvalHistory[e.approvalHistory.length - 1]
        }));
      
      setRecentActions(recentActionsData);
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUrgencyColor = (date) => {
    const daysSince = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (daysSince > 7) return 'text-red-600 bg-red-50 border-red-200';
    if (daysSince > 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getUrgencyBadge = (date) => {
    const daysSince = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (daysSince > 7) return '🔴 Urgent';
    if (daysSince > 3) return '🟠 High Priority';
    return '🟢 Normal';
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👨‍💼</h1>
            <p className="text-purple-100 text-lg">You have {teamStats.pendingCount} expenses waiting for your review</p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-purple-200 text-sm">Your Role</p>
              <p className="text-2xl font-bold capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action - Pending Approvals */}
      {teamStats.pendingCount > 0 && (
        <button
          onClick={() => navigate('/admin/approvals')}
          className="w-full mb-8 flex items-center justify-between p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition shadow-lg group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <FiAlertCircle size={28} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xl">{teamStats.pendingCount} Expenses Need Your Approval</p>
              <p className="text-orange-100">Total: {formatCurrency(teamStats.pendingAmount)} • Click to review</p>
            </div>
          </div>
          <FiArrowRight size={28} className="group-hover:translate-x-2 transition" />
        </button>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiClock className="text-orange-600" size={20} />
            </div>
            {teamStats.pendingCount > 0 && (
              <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Pending Approvals</p>
          <p className="text-2xl font-bold text-gray-900">{teamStats.pendingCount}</p>
          <p className="text-sm text-orange-600 font-medium mt-2">
            {formatCurrency(teamStats.pendingAmount)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Approved Today</p>
          <p className="text-2xl font-bold text-green-600">{teamStats.approvedToday}</p>
          <p className="text-xs text-gray-500 mt-2">Great work! 👍</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FiXCircle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Rejected Today</p>
          <p className="text-2xl font-bold text-red-600">{teamStats.rejectedToday}</p>
          <p className="text-xs text-gray-500 mt-2">With feedback</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiTarget className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Avg. Approval Time</p>
          <p className="text-2xl font-bold text-blue-600">{teamStats.avgApprovalTime}</p>
          <p className="text-xs text-gray-500 mt-2">Fast & efficient ⚡</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pending Approvals List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <FiFileText className="mr-2 text-purple-600" />
              Expenses Waiting for Review
            </h3>
            <button
              onClick={() => navigate('/admin/approvals')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </button>
          </div>

          {pendingExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiCheckCircle className="mx-auto mb-3 text-green-500" size={48} />
              <p className="text-lg font-semibold text-gray-700">All Caught Up! 🎉</p>
              <p className="text-sm mt-2">No pending approvals at the moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingExpenses.map((expense) => (
                <div
                  key={expense._id}
                  onClick={() => navigate('/admin/approvals')}
                  className="flex items-center justify-between p-4 hover:bg-purple-50 rounded-lg transition cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiDollarSign className="text-purple-600" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{expense.description}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span>By: {expense.employee?.name || 'Employee'}</span>
                        <span>•</span>
                        <span>{formatDate(expense.date)}</span>
                        <span>•</span>
                        <span>{expense.category}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-0.5 text-xs border rounded-full font-medium ${getUrgencyColor(expense.createdAt)}`}>
                          {getUrgencyBadge(expense.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="space-y-1">
                      {/* Original Amount */}
                      <p className="font-bold text-xl text-gray-900">
                        {expense.amount} {expense.currency}
                      </p>
                      
                      {/* Converted Amount (if different currency) */}
                      {expense.convertedAmount && expense.currency !== user?.company?.currency?.code && (
                        <p className="text-sm text-purple-600 font-medium">
                          ≈ {formatCurrency(expense.convertedAmount)} converted
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-purple-600" />
            Recent Actions
          </h3>

          {recentActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiFileText className="mx-auto mb-3" size={40} />
              <p className="text-sm">No recent actions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActions.map((action) => (
                <div key={action._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {action.status === 'approved' ? (
                        <FiCheckCircle className="text-green-600 flex-shrink-0" size={16} />
                      ) : (
                        <FiXCircle className="text-red-600 flex-shrink-0" size={16} />
                      )}
                      <span className={`text-xs font-semibold ${
                        action.status === 'approved' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {action.status === 'approved' ? 'APPROVED' : 'REJECTED'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(action.lastAction?.timestamp)}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1 truncate">{action.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{action.employee?.name}</span>
                    <span className="font-semibold">{formatCurrency(action.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiUsers className="text-blue-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Manager Tips</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Review expenses within 24 hours for better team satisfaction</li>
              <li>• Use <strong>Comments</strong> when rejecting to help employees resubmit correctly</li>
              <li>• Check currency conversions are accurate before approving</li>
              <li>• Red/Orange badges indicate urgent approvals waiting 7+ days</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

