import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FiTrendingUp, 
  FiPieChart, 
  FiBarChart2, 
  FiDownload, 
  FiRefreshCw,
  FiAlertCircle,
  FiDollarSign,
  FiCalendar
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import SmartInsights from '../components/SmartInsights';

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [timePeriod, setTimePeriod] = useState('6months'); // 1month, 3months, 6months, 1year

  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/analytics/data', {
        headers: { Authorization: `Bearer ${token}` },
        params: { period: timePeriod }
      });
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics');
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      const endpoint = user.role === 'employee' 
        ? 'http://localhost:5000/api/analytics/report/employee'
        : 'http://localhost:5000/api/analytics/report/pdf';
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Open PDF in new tab
      window.open(`http://localhost:5000${response.data.url}`, '_blank');
      setGenerating(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please make sure you have expenses to report.');
      setGenerating(false);
    }
  };

  const COLORS = {
    'Food': '#EF4444',           // Red
    'Travel': '#3B82F6',          // Blue
    'Accommodation': '#8B5CF6',   // Purple
    'Office Supplies': '#10B981', // Green
    'Transportation': '#F59E0B',  // Orange
    'Entertainment': '#EC4899',   // Pink
    'Utilities': '#14B8A6',       // Teal
    'Marketing': '#F97316',       // Deep Orange
    'Training': '#6366F1',        // Indigo
    'Other': '#6B7280'            // Gray
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive spending insights and trends</p>
        </div>
        <div className="flex space-x-3">
          {/* Time Period Selector */}
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          <button
            onClick={generatePDFReport}
            disabled={generating}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <FiDownload className="mr-2" />
            {generating ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* AI Smart Insights - FRAUD DETECTION HERE! */}
      <SmartInsights />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Expenses</p>
              <p className="text-4xl font-bold mt-2">{analytics?.summary.totalExpenses || 0}</p>
              <p className="text-purple-200 text-xs mt-1">All time expenses</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiBarChart2 className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Amount</p>
              <p className="text-4xl font-bold mt-2">
                ${analytics?.summary.totalAmount?.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
              </p>
              <p className="text-green-200 text-xs mt-1">In base currency</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium">Approved</p>
              <p className="text-4xl font-bold mt-2">
                ${analytics?.summary.approvedAmount?.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
              </p>
              <p className="text-blue-200 text-xs mt-1">Ready for reimbursement</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTrendingUp className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending</p>
              <p className="text-4xl font-bold mt-2">
                ${analytics?.summary.pendingAmount?.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
              </p>
              <p className="text-orange-200 text-xs mt-1">Awaiting approval</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiCalendar className="text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend - LINE CHART */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-purple-600" />
            Spending Trend ({timePeriod === '1month' ? 'Last Month' : timePeriod === '3months' ? 'Last 3 Months' : timePeriod === '6months' ? 'Last 6 Months' : 'Last Year'})
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#7C3AED" 
                strokeWidth={3}
                name="Total Spent ($)"
                dot={{ fill: '#7C3AED', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#10B981" 
                strokeWidth={2}
                name="# of Expenses"
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown - PIE CHART */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FiPieChart className="mr-2 text-purple-600" />
            Category Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.categories || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={110}
                innerRadius={0}
                fill="#8884d8"
                dataKey="amount"
              >
                {(analytics?.categories || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[entry.name] || COLORS.Other} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [`$${value.toFixed(2)} (${props.payload.percentage}%)`, props.payload.name]}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Category Legend with both percentage and amount */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Category</span>
              <div className="flex items-center space-x-6">
                <span>Amount</span>
                <span className="w-12 text-right">Share</span>
              </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(analytics?.categories || []).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-purple-50 rounded transition-colors cursor-pointer">
                  <div className="flex items-center space-x-2 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color || COLORS[cat.name] || COLORS.Other }}
                    ></div>
                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span className="text-sm font-bold text-purple-700">
                      ${cat.amount.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution - BAR CHART */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FiBarChart2 className="mr-2 text-purple-600" />
          Expense Status Distribution
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { status: 'Draft', count: analytics?.statusData.draft.count || 0, amount: analytics?.statusData.draft.amount || 0 },
              { status: 'Submitted', count: analytics?.statusData.submitted.count || 0, amount: analytics?.statusData.submitted.amount || 0 },
              { status: 'Approved', count: analytics?.statusData.approved.count || 0, amount: analytics?.statusData.approved.amount || 0 },
              { status: 'Rejected', count: analytics?.statusData.rejected.count || 0, amount: analytics?.statusData.rejected.amount || 0 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis yAxisId="left" orientation="left" stroke="#7C3AED" />
            <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill="#7C3AED" name="Count" />
            <Bar yAxisId="right" dataKey="amount" fill="#10B981" name="Amount ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Spenders (Admin/Manager only) */}
      {user.role !== 'employee' && analytics?.topSpenders?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            🏆 Top Spenders
          </h2>
          <div className="space-y-3">
            {analytics.topSpenders.map((spender, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-gradient-to-br from-purple-400 to-purple-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{spender.name}</p>
                    <p className="text-sm text-gray-600">{spender.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-2xl text-purple-600">${spender.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">{spender.count} expenses</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Expenses</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(analytics?.recentActivity || []).map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{expense.employee}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                      backgroundColor: COLORS[expense.category] + '20',
                      color: COLORS[expense.category]
                    }}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                    {expense.amount} {expense.currency}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                      expense.status === 'submitted' ? 'bg-orange-100 text-orange-800' :
                      expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
