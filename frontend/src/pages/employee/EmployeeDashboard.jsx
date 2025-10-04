import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiDollarSign, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiCamera,
  FiPlus,
  FiArrowRight,
  FiTrendingUp,
  FiCalendar,
  FiFile
} from 'react-icons/fi';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({ draft: 0, submitted: 0, approved: 0, rejected: 0 });
  const [stats, setStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    totalCount: 0,
    avgAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allExpenses = response.data.expenses || [];
      setExpenses(allExpenses.slice(0, 5)); // Recent 5
      setTotals(response.data.totals || { draft: 0, submitted: 0, approved: 0, rejected: 0 });

      // Calculate statistics
      const now = new Date();
      const thisMonth = allExpenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      });
      
      const lastMonth = allExpenses.filter(e => {
        const expDate = new Date(e.date);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
        return expDate.getMonth() === lastMonthDate.getMonth() && expDate.getFullYear() === lastMonthDate.getFullYear();
      });

      const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);
      const lastMonthTotal = lastMonth.reduce((sum, e) => sum + e.amount, 0);
      const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      setStats({
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        totalCount: allExpenses.length,
        avgAmount: allExpenses.length > 0 ? totalAmount / allExpenses.length : 0,
      });

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

  const getChangeIndicator = () => {
    if (stats.lastMonth === 0) return { text: 'N/A', color: 'text-gray-600' };
    const change = ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100;
    if (change > 0) return { text: `+${change.toFixed(1)}%`, color: 'text-orange-600' };
    if (change < 0) return { text: `${change.toFixed(1)}%`, color: 'text-green-600' };
    return { text: '0%', color: 'text-gray-600' };
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  const changeIndicator = getChangeIndicator();

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
            <p className="text-purple-100 text-lg">Here's your expense overview for today</p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-purple-200 text-sm">Your Role</p>
              <p className="text-2xl font-bold capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/expenses/new')}
          className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition shadow-lg group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <FiPlus size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-lg">Create New Expense</p>
              <p className="text-purple-100 text-sm">Manual entry</p>
            </div>
          </div>
          <FiArrowRight size={24} className="group-hover:translate-x-2 transition" />
        </button>

        <button
          onClick={() => navigate('/admin/expenses')}
          className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition shadow-lg group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <FiCamera size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-lg">Scan Receipt</p>
              <p className="text-indigo-100 text-sm">Auto-extract data</p>
            </div>
          </div>
          <FiArrowRight size={24} className="group-hover:translate-x-2 transition" />
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FiFile className="text-red-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
              {expenses.filter(e => e.status === 'draft').length}
            </span>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Draft</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.draft)}</p>
          <button
            onClick={() => navigate('/admin/expenses')}
            className="text-xs text-red-600 hover:text-red-700 font-medium mt-2 flex items-center"
          >
            Complete & Submit <FiArrowRight className="ml-1" size={12} />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiClock className="text-yellow-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
              {expenses.filter(e => e.status === 'submitted').length}
            </span>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.submitted)}</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting manager review</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {expenses.filter(e => e.status === 'approved').length}
            </span>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Approved</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.approved)}</p>
          <p className="text-xs text-gray-500 mt-2">Ready for reimbursement</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiXCircle className="text-gray-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {expenses.filter(e => e.status === 'rejected').length}
            </span>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Rejected</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.rejected)}</p>
          <p className="text-xs text-gray-500 mt-2">Review comments</p>
        </div>
      </div>

      {/* Statistics & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Statistics */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-purple-600" />
            Monthly Statistics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">This Month</p>
                <span className={`text-xs font-semibold ${changeIndicator.color}`}>
                  {changeIndicator.text}
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.thisMonth)}</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Last Month</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.lastMonth)}</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Average per Expense</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.avgAmount)}</p>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <FiCalendar className="mr-2 text-purple-600" />
              Recent Expenses
            </h3>
            <button
              onClick={() => navigate('/admin/expenses')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiFile className="mx-auto mb-3" size={48} />
              <p>No expenses yet</p>
              <button
                onClick={() => navigate('/admin/expenses/new')}
                className="mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Create your first expense
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
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

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiCheckCircle className="text-blue-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Quick Tips</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Use <strong>OCR</strong> to scan receipts and auto-fill expense details</li>
              <li>• Submit expenses promptly for faster approval</li>
              <li>• Always attach receipts for amounts over {formatCurrency(100)}</li>
              <li>• Check approval status in the "Pending Approval" section</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

