import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiCheckCircle, FiXCircle, FiClock, FiUser, FiCalendar, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [convertedAmounts, setConvertedAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approved');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processedExpenses, setProcessedExpenses] = useState(new Set());

  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  useEffect(() => {
    // Convert currencies for all expenses
    expenses.forEach(expense => {
      if (expense.currency !== user?.company?.currency?.code) {
        convertCurrency(expense._id, expense.amount, expense.currency);
      }
    });
  }, [expenses]);

  const fetchPendingExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter for submitted expenses only (pending approval)
      const pending = (response.data.expenses || []).filter(
        expense => expense.status === 'submitted'
      );
      
      setExpenses(pending);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to fetch pending approvals');
      setLoading(false);
    }
  };

  const convertCurrency = async (expenseId, amount, fromCurrency) => {
    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      const rate = response.data.rates[user?.company?.currency?.code];
      const converted = amount * rate;
      setConvertedAmounts(prev => ({
        ...prev,
        [expenseId]: converted.toFixed(2)
      }));
    } catch (error) {
      console.error('Currency conversion error:', error);
    }
  };

  const openApprovalModal = (expense, action) => {
    setSelectedExpense(expense);
    setApprovalAction(action);
    setComments('');
    setShowApprovalModal(true);
  };

  const handleApproval = async () => {
    if (!selectedExpense) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/expenses/${selectedExpense._id}/approve`,
        {
          action: approvalAction,
          comments: comments || (approvalAction === 'approved' ? 'Approved' : 'Rejected'),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mark as processed for immediate UI update
      setProcessedExpenses(prev => new Set([...prev, selectedExpense._id]));

      setSuccess(`Expense ${approvalAction === 'approved' ? 'approved' : 'rejected'} successfully!`);
      setShowApprovalModal(false);
      setSelectedExpense(null);
      setComments('');
      
      // Remove from list after a short delay
      setTimeout(() => {
        fetchPendingExpenses();
      }, 1500);
    } catch (error) {
      console.error('Approval error:', error);
      setError(error.response?.data?.message || 'Failed to process approval');
    } finally {
      setProcessing(false);
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Approvals to Review</h1>
        <p className="text-gray-600">Review and approve expense claims from your team</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Expenses Waiting for Your Approval</h2>
            <p className="text-3xl font-bold">{expenses.length}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <FiClock size={32} />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-purple-100">
          <FiCheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No expenses waiting for your approval at the moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl border border-purple-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
            <h2 className="text-xl font-bold text-gray-900">Expense Requests</h2>
            <p className="text-sm text-gray-600 mt-1">{expenses.length} expenses pending your review</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Approval Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Request Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Request Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((expense) => {
                  const isProcessed = processedExpenses.has(expense._id);
                  const hasConversion = expense.currency !== user?.company?.currency?.code;
                  
                  return (
                    <tr 
                      key={expense._id} 
                      className={`hover:bg-purple-50 transition ${isProcessed ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      {/* Approval Subject */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-semibold text-gray-900 truncate">{expense.description}</p>
                          {expense.remarks && (
                            <p className="text-sm text-gray-500 truncate">{expense.remarks}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            <FiCalendar className="inline mr-1" size={12} />
                            {formatDate(expense.date)}
                          </p>
                        </div>
                      </td>

                      {/* Request Owner */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-600 font-semibold text-sm">
                              {expense.employee?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{expense.employee?.name}</p>
                            <p className="text-xs text-gray-500">{expense.employee?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full font-medium">
                          {expense.category}
                        </span>
                      </td>

                      {/* Request Status */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-sm border rounded-full font-medium ${
                          isProcessed 
                            ? 'bg-gray-100 text-gray-600 border-gray-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {isProcessed ? 'Processing...' : 'Pending Approval'}
                        </span>
                      </td>

                      {/* Total Amount with Currency Conversion */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {/* Original Amount */}
                          <p className="font-semibold text-gray-900">
                            {expense.amount} {expense.currency}
                          </p>
                          
                          {/* Converted Amount (if different currency) */}
                          {hasConversion && (
                            <div className="flex items-center space-x-2">
                              <div className="h-px w-4 bg-gray-300"></div>
                              <p className="text-sm text-purple-600 font-medium">
                                {user?.company?.currency?.symbol || user?.company?.currency?.code} {convertedAmounts[expense._id] || 'Converting...'}
                              </p>
                            </div>
                          )}
                          
                          {/* Company Currency Label */}
                          {hasConversion && (
                            <p className="text-xs text-gray-500">
                              in {user?.company?.currency?.code}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        {!isProcessed ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openApprovalModal(expense, 'rejected')}
                              className="flex items-center space-x-1 px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition font-medium text-sm"
                            >
                              <FiXCircle size={16} />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => openApprovalModal(expense, 'approved')}
                              className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-medium text-sm shadow"
                            >
                              <FiCheckCircle size={16} />
                              <span>Approve</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500 text-sm">
                            <FiClock className="mr-2 animate-spin" size={16} />
                            <span>Processing...</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Info Footer */}
          <div className="p-4 bg-blue-50 border-t border-blue-100">
            <div className="flex items-start space-x-2 text-sm text-blue-800">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" size={16} />
              <p>
                <strong>Multi-Currency Note:</strong> Amounts in foreign currencies are automatically converted to your company's base currency ({user?.company?.currency?.code}) using real-time exchange rates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {approvalAction === 'approved' ? 'Approve Expense' : 'Reject Expense'}
            </h3>

            {selectedExpense && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Employee</p>
                <p className="font-semibold text-gray-900 mb-3">{selectedExpense.employee?.name}</p>
                
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="font-semibold text-gray-900 mb-3">{formatCurrency(selectedExpense.amount)}</p>
                
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{selectedExpense.description}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {approvalAction === 'rejected' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  approvalAction === 'approved' 
                    ? 'Optional: Add comments for approval' 
                    : 'Required: Please provide reason for rejection'
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedExpense(null);
                  setComments('');
                }}
                disabled={processing}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                disabled={processing || (approvalAction === 'rejected' && !comments.trim())}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  approvalAction === 'approved'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                }`}
              >
                {processing ? 'Processing...' : approvalAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;

