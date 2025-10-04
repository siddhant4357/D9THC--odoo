import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiArrowLeft, 
  FiUpload, 
  FiCalendar, 
  FiDollarSign,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiFile,
  FiX
} from 'react-icons/fi';
import axios from 'axios';
import ApprovalTimeline from '../../components/ApprovalTimeline';

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isNewExpense, setIsNewExpense] = useState(!id);
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    paidBy: 'employee',
    amount: '',
    currency: user?.company?.currency?.code || 'USD',
    remarks: '',
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);

  // Currency list (common currencies)
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  ];

  const categories = ['Food', 'Travel', 'Accommodation', 'Office Supplies', 'Transportation', 'Entertainment', 'Other'];

  useEffect(() => {
    if (!isNewExpense) {
      fetchExpense();
    }
  }, [id]);

  useEffect(() => {
    // Auto-convert currency when amount or currency changes
    if (formData.amount && formData.currency !== user?.company?.currency?.code) {
      convertCurrency();
    } else {
      setConvertedAmount(null);
    }
  }, [formData.amount, formData.currency]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpense(response.data);
      setFormData({
        description: response.data.description,
        date: response.data.date.split('T')[0],
        category: response.data.category,
        paidBy: response.data.paidBy,
        amount: response.data.amount,
        currency: response.data.currency || user?.company?.currency?.code,
        remarks: response.data.remarks || '',
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expense:', error);
      setError('Failed to load expense details');
      setLoading(false);
    }
  };

  const convertCurrency = async () => {
    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${formData.currency}`
      );
      const rate = response.data.rates[user?.company?.currency?.code];
      const converted = formData.amount * rate;
      setConvertedAmount(converted.toFixed(2));
    } catch (error) {
      console.error('Currency conversion error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    setError('');
    setSuccess('');

    // Validation
    if (!formData.description || !formData.amount || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      if (isNewExpense) {
        // ✅ FIX: Upload receipt file with FormData if present
        if (receiptFile) {
          const fileFormData = new FormData();
          fileFormData.append('receipt', receiptFile);
          Object.keys(formData).forEach(key => {
            fileFormData.append(key, formData[key]);
          });

          const response = await axios.post(
            'http://localhost:5000/api/expenses/with-receipt',
            fileFormData,
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              } 
            }
          );

          if (!isDraft) {
            await axios.post(
              `http://localhost:5000/api/expenses/${response.data.expense._id}/submit`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Expense with receipt submitted for approval!');
          } else {
            setSuccess('Expense with receipt saved as draft!');
          }
        } else {
          // Create expense without receipt
          const response = await axios.post(
            'http://localhost:5000/api/expenses',
            formData,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!isDraft) {
            await axios.post(
              `http://localhost:5000/api/expenses/${response.data.expense._id}/submit`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Expense submitted for approval!');
          } else {
            setSuccess('Expense saved as draft!');
          }
        }

        setTimeout(() => {
          navigate('/admin/expenses');
        }, 1500);
      } else {
        // Update existing expense
        await axios.put(
          `http://localhost:5000/api/expenses/${id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!isDraft) {
          await axios.post(
            `http://localhost:5000/api/expenses/${id}/submit`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSuccess('Expense updated and submitted for approval!');
        } else {
          setSuccess('Expense updated!');
        }

        setTimeout(() => {
          navigate('/admin/expenses');
        }, 1500);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-red-100 text-red-700';
      case 'submitted': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isReadOnly = expense && expense.status !== 'draft';

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/expenses')}
        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-6 transition"
      >
        <FiArrowLeft size={20} />
        <span>Back to Expenses</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isNewExpense ? 'Create New Expense' : 'Expense Details'}
        </h1>
        <p className="text-gray-600">
          {isNewExpense ? 'Fill in the details below to submit a new expense claim' : 'View and manage your expense claim'}
        </p>
      </div>

      {/* Status Breadcrumb */}
      {!isNewExpense && expense && (
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Expense Status</h3>
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200" style={{ zIndex: 0 }}>
              <div 
                className={`h-full transition-all duration-500 ${
                  expense.status === 'draft' ? 'bg-red-500 w-0'
                  : expense.status === 'submitted' ? 'bg-yellow-500 w-1/2'
                  : expense.status === 'approved' ? 'bg-green-500 w-full'
                  : 'bg-gray-500 w-1/2'
                }`}
              />
            </div>

            {/* Steps */}
            <div className="flex items-center justify-between w-full relative" style={{ zIndex: 1 }}>
              {/* Draft */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  expense.status === 'draft' 
                    ? 'bg-red-500 text-white ring-4 ring-red-100' 
                    : 'bg-white border-2 border-green-500 text-green-500'
                }`}>
                  {expense.status === 'draft' ? <FiFile size={20} /> : <FiCheckCircle size={20} />}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  expense.status === 'draft' ? 'text-red-600' : 'text-gray-600'
                }`}>Draft</span>
              </div>

              {/* Waiting Approval */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  expense.status === 'submitted' 
                    ? 'bg-yellow-500 text-white ring-4 ring-yellow-100' 
                    : expense.status === 'approved' || expense.status === 'rejected'
                    ? 'bg-white border-2 border-green-500 text-green-500'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {expense.status === 'submitted' ? <FiClock size={20} /> 
                   : expense.status === 'approved' || expense.status === 'rejected' 
                   ? <FiCheckCircle size={20} /> 
                   : <FiClock size={20} />}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  expense.status === 'submitted' ? 'text-yellow-600' : 'text-gray-600'
                }`}>Waiting Approval</span>
              </div>

              {/* Approved/Rejected */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  expense.status === 'approved' 
                    ? 'bg-green-500 text-white ring-4 ring-green-100' 
                    : expense.status === 'rejected'
                    ? 'bg-gray-500 text-white ring-4 ring-gray-100'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {expense.status === 'approved' ? <FiCheckCircle size={20} /> 
                   : expense.status === 'rejected' ? <FiX size={20} />
                   : <FiCheckCircle size={20} />}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  expense.status === 'approved' ? 'text-green-600' 
                  : expense.status === 'rejected' ? 'text-gray-600'
                  : 'text-gray-400'
                }`}>
                  {expense.status === 'approved' ? 'Approved' 
                   : expense.status === 'rejected' ? 'Rejected' 
                   : 'Approved'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
        </div>
      )}

      {/* Expense Form */}
      <div className="bg-white rounded-xl shadow-xl border border-purple-100 p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Expense Information</h2>
        
        <div className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isReadOnly}
              placeholder="e.g., Team lunch at restaurant"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Date and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount and Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
              
              <div>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Currency Conversion Display */}
            {convertedAmount && formData.currency !== user?.company?.currency?.code && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Converted Amount:</strong> {convertedAmount} {user?.company?.currency?.code} (Company Base Currency)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  *Managers will see this converted amount for approval
                </p>
              </div>
            )}
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid By <span className="text-red-500">*</span>
            </label>
            <select
              name="paidBy"
              value={formData.paidBy}
              onChange={handleChange}
              disabled={isReadOnly}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="employee">{user?.name} (Employee)</option>
              <option value="company">Company Card</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks / Additional Notes
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              disabled={isReadOnly}
              rows={4}
              placeholder="Add any additional information..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Receipt Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Attachment
            </label>
            {!isReadOnly ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition">
                <input
                  type="file"
                  id="receipt"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <label htmlFor="receipt" className="cursor-pointer">
                  <FiUpload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600 mb-1">
                    {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 5MB
                  </p>
                </label>
              </div>
            ) : expense?.receiptData ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <FiFile className="inline mr-2" />
                  {expense.receiptData.originalName}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No receipt attached</p>
            )}
          </div>
        </div>
      </div>

      {/* Approval History */}
      {!isNewExpense && expense && (
        <div className="bg-white rounded-xl shadow-xl border border-purple-100 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Approval History</h2>
          
          {expense.approvalHistory && expense.approvalHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Approver</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Comments</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expense.approvalHistory.map((history, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-600 font-semibold text-sm">
                              {history.approver?.name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{history.approver?.name}</p>
                            <p className="text-xs text-gray-500">{history.approver?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${
                          history.action === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {history.action}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {history.comments || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(history.date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiClock className="mx-auto mb-3 text-gray-300" size={48} />
              <p>No approval history yet</p>
              <p className="text-sm mt-1">History will appear once the expense is submitted</p>
            </div>
          )}
        </div>
      )}

      {/* Approval Timeline - Beautiful Visual Timeline */}
      {!isNewExpense && expense && (expense.submittedAt || (expense.approvalHistory && expense.approvalHistory.length > 0)) && (
        <div className="mb-6">
          <ApprovalTimeline expense={expense} />
        </div>
      )}

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={() => navigate('/admin/expenses')}
            disabled={submitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save as Draft'}
          </button>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition font-semibold shadow-lg disabled:opacity-50"
          >
            <FiSend size={20} />
            <span>{submitting ? 'Submitting...' : 'Submit for Approval'}</span>
          </button>
        </div>
      )}

      {/* Read-only notification */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800 font-medium">
            This expense has been submitted and is now read-only. Contact your manager for any changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetail;

