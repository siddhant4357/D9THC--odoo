import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiUpload, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSend, 
  FiCamera,
  FiFile,
  FiDollarSign,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import axios from 'axios';

const ExpenseManagement = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({ draft: 0, submitted: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data.expenses || []);
      setTotals(response.data.totals || { draft: 0, submitted: 0, approved: 0 });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to fetch expenses');
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/expenses/ocr-upload',
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess('Receipt processed successfully! You can now edit and submit.');
      fetchExpenses();
    } catch (error) {
      console.error('OCR upload error:', error);
      setError(error.response?.data?.message || 'Failed to process receipt');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmitExpense = async (expenseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/expenses/${expenseId}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Expense submitted for approval!');
      fetchExpenses();
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.response?.data?.message || 'Failed to submit expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Expense deleted successfully!');
      fetchExpenses();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete expense');
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Expenses</h1>
        <p className="text-gray-600">Manage your expense claims and track approvals</p>
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

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">To Submit (Draft)</h3>
            <FiFile className="text-red-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totals.draft)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {expenses.filter(e => e.status === 'draft').length} expenses
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Waiting Approval</h3>
            <FiClock className="text-yellow-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totals.submitted)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {expenses.filter(e => e.status === 'submitted').length} expenses
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Approved</h3>
            <FiCheckCircle className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totals.approved)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {expenses.filter(e => e.status === 'approved').length} expenses
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition disabled:opacity-50 shadow-lg font-semibold"
        >
          {processing ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Processing Receipt...</span>
            </>
          ) : (
            <>
              <FiCamera size={20} />
              <span>Scan Receipt (OCR)</span>
            </>
          )}
        </button>

        <button
          onClick={() => navigate('/admin/expenses/new')}
          className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold"
        >
          <FiPlus size={20} />
          <span>Create Manual Expense</span>
        </button>
      </div>

      {/* Expenses Table - Responsive */}
      <div className="bg-white rounded-xl shadow-xl border border-purple-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">All Expenses</h2>
          <p className="text-xs text-gray-500 mt-1 md:hidden">Scroll right to see all columns →</p>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Employee</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Description</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Date</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Category</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Paid By</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Amount</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Status</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 md:px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <FiFile size={48} className="text-gray-300" />
                      <p>No expenses yet. Click "Scan Receipt" or "Create Manual Expense" to get started!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr 
                    key={expense._id} 
                    className="hover:bg-purple-50 transition cursor-pointer"
                    onClick={() => navigate(`/admin/expenses/${expense._id}`)}
                  >
                    <td className="px-3 md:px-6 py-4">
                      <div className="font-medium text-gray-900 text-sm md:text-base">{expense.employee?.name}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      <div className="text-gray-900 text-sm md:text-base">{expense.description}</div>
                      {expense.remarks && (
                        <div className="text-xs md:text-sm text-gray-500">{expense.remarks}</div>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4 text-gray-700 text-sm md:text-base whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td className="px-3 md:px-6 py-4">
                      <span className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 capitalize text-sm md:text-base">{expense.paidBy}</td>
                    <td className="px-3 md:px-6 py-4 font-semibold text-gray-900">
                      <div className="space-y-1">
                        {/* Original Amount */}
                        <p className="font-semibold text-gray-900 text-sm md:text-base whitespace-nowrap">
                          {expense.amount} {expense.currency}
                        </p>
                        
                        {/* Converted Amount (if different currency) */}
                        {expense.convertedAmount && expense.currency !== user?.company?.currency?.code && (
                          <div className="flex items-center space-x-2">
                            <div className="h-px w-2 md:w-4 bg-gray-300"></div>
                            <p className="text-xs md:text-sm text-purple-600 font-medium whitespace-nowrap">
                              ≈ {formatCurrency(expense.convertedAmount)}
                            </p>
                          </div>
                        )}
                        
                        {/* Company Currency Label */}
                        {expense.convertedAmount && expense.currency !== user?.company?.currency?.code && (
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            to {user?.company?.currency?.code}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      <span className={`px-2 md:px-3 py-1 text-xs md:text-sm border rounded-full capitalize font-medium ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        {expense.status === 'draft' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitExpense(expense._id);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Submit for approval"
                            >
                              <FiSend size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExpense(expense._id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </>
                        )}
                        {expense.status === 'submitted' && (
                          <span className="text-sm text-gray-500 italic">Pending...</span>
                        )}
                        {expense.status === 'approved' && (
                          <FiCheckCircle className="text-green-500" size={20} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h3 className="font-semibold text-purple-900 mb-2">💡 How to submit expenses:</h3>
        <ul className="text-sm text-purple-800 space-y-2">
          <li>• <strong>Scan Receipt:</strong> Take a photo or upload image - OCR will auto-extract amount, date, and category</li>
          <li>• <strong>Manual Entry:</strong> Create expense manually if you don't have a receipt</li>
          <li>• <strong>Draft:</strong> Edit and perfect your expense before submitting</li>
          <li>• <strong>Submit:</strong> Send for approval once ready</li>
          <li>• <strong>Track:</strong> Monitor approval status in real-time</li>
        </ul>
      </div>
    </div>
  );
};

export default ExpenseManagement;

