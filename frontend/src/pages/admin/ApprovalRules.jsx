import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiSave, FiPlus, FiTrash2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const ApprovalRules = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Approval rule state
  const [approvalRule, setApprovalRule] = useState({
    description: '',
    manager: '',
    isManagerApprover: false,
    approvers: [],
    isSequential: false,
    minApprovalPercentage: 50,
  });

  const [availableApprovers, setAvailableApprovers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchApprovalRule(selectedUser);
      const selectedUserData = users.find(u => u._id === selectedUser);
      if (selectedUserData) {
        setApprovalRule(prev => ({
          ...prev,
          manager: selectedUserData.manager?._id || '',
        }));
      }
    }
  }, [selectedUser, users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter out admin for user selection
      const nonAdminUsers = (response.data.users || []).filter(u => u.role !== 'admin');
      setUsers(nonAdminUsers);
      setManagers(response.data.managers || []);
      
      // All users can be approvers (managers and employees)
      setAvailableApprovers(response.data.users || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const fetchApprovalRule = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/approval-rules/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setApprovalRule({
          description: response.data.description || '',
          manager: response.data.manager || '',
          isManagerApprover: response.data.isManagerApprover || false,
          approvers: response.data.approvers || [],
          isSequential: response.data.isSequential || false,
          minApprovalPercentage: response.data.minApprovalPercentage || 50,
        });
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching approval rule:', error);
      }
      // Reset to default if no rule found
      const selectedUserData = users.find(u => u._id === userId);
      setApprovalRule({
        description: '',
        manager: selectedUserData?.manager?._id || '',
        isManagerApprover: false,
        approvers: [],
        isSequential: false,
        minApprovalPercentage: 50,
      });
    }
  };

  const addApprover = () => {
    setApprovalRule(prev => ({
      ...prev,
      approvers: [
        ...prev.approvers,
        { user: '', isRequired: false, sequence: prev.approvers.length + 1 }
      ]
    }));
  };

  const removeApprover = (index) => {
    setApprovalRule(prev => ({
      ...prev,
      approvers: prev.approvers.filter((_, i) => i !== index).map((app, i) => ({
        ...app,
        sequence: i + 1
      }))
    }));
  };

  const updateApprover = (index, field, value) => {
    setApprovalRule(prev => ({
      ...prev,
      approvers: prev.approvers.map((app, i) => 
        i === index ? { ...app, [field]: value } : app
      )
    }));
  };

  const moveApprover = (index, direction) => {
    const newApprovers = [...approvalRule.approvers];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newApprovers.length) {
      [newApprovers[index], newApprovers[newIndex]] = [newApprovers[newIndex], newApprovers[index]];
      
      // Update sequences
      newApprovers.forEach((app, i) => {
        app.sequence = i + 1;
      });
      
      setApprovalRule(prev => ({ ...prev, approvers: newApprovers }));
    }
  };

  const handleSave = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (!approvalRule.description) {
      setError('Please enter a description');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/approval-rules',
        {
          userId: selectedUser,
          ...approvalRule,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Approval rule saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving approval rule:', error);
      setError(error.response?.data?.message || 'Failed to save approval rule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Approval Rules Configuration</h1>
        <p className="text-gray-600">Configure approval workflows for users based on expense thresholds and rules</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <FiAlertCircle className="mr-2" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
          <FiCheckCircle className="mr-2" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* User Selection */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select User</h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose which user's approval rules to configure
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="">Select a user...</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email}) - {u.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedUser && (
        <>
          {/* Rule Description */}
          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Approval Rule Description</h2>
            <textarea
              value={approvalRule.description}
              onChange={(e) => setApprovalRule(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Approval rule for miscellaneous expenses"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          {/* Manager Configuration */}
          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Manager Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Manager
                </label>
                <select
                  value={approvalRule.manager}
                  onChange={(e) => setApprovalRule(prev => ({ ...prev, manager: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">No Manager</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isManagerApprover"
                  checked={approvalRule.isManagerApprover}
                  onChange={(e) => setApprovalRule(prev => ({ ...prev, isManagerApprover: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                />
                <label htmlFor="isManagerApprover" className="font-medium text-gray-900 cursor-pointer">
                  Is Manager an Approver?
                </label>
              </div>
              {approvalRule.isManagerApprover && (
                <div className="ml-8 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  ℹ️ If checked, approval requests will go to the manager first before other approvers
                </div>
              )}
            </div>
          </div>

          {/* Approvers List */}
          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Approvers List</h2>
                <p className="text-sm text-gray-600 mt-1">Configure who needs to approve expenses</p>
              </div>
              <button
                onClick={addApprover}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <FiPlus size={18} />
                <span>Add Approver</span>
              </button>
            </div>

            {approvalRule.approvers.length > 0 && (
              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvalRule.isSequential}
                    onChange={(e) => setApprovalRule(prev => ({ ...prev, isSequential: e.target.checked }))}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Sequential Approval</span>
                    <p className="text-sm text-gray-600">
                      {approvalRule.isSequential 
                        ? 'Approvers will receive requests one by one in sequence' 
                        : 'All approvers will receive requests at the same time'}
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="space-y-3">
              {approvalRule.approvers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  No approvers added yet. Click "Add Approver" to start.
                </div>
              ) : (
                approvalRule.approvers.map((approver, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition">
                    {approvalRule.isSequential && (
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveApprover(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <div className="text-center font-bold text-purple-600 text-sm">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => moveApprover(index, 'down')}
                          disabled={index === approvalRule.approvers.length - 1}
                          className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    )}

                    <div className="flex-1">
                      <select
                        value={approver.user}
                        onChange={(e) => updateApprover(index, 'user', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      >
                        <option value="">Select Approver...</option>
                        {availableApprovers.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} ({a.email}) - {a.role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-purple-50 transition">
                      <input
                        type="checkbox"
                        checked={approver.isRequired}
                        onChange={(e) => updateApprover(index, 'isRequired', e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Required</span>
                    </label>

                    <button
                      onClick={() => removeApprover(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove approver"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {approvalRule.approvers.some(a => a.isRequired) && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                ⚠️ If any required approver rejects, the expense request will be auto-rejected
              </div>
            )}
          </div>

          {/* Minimum Approval Percentage */}
          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Minimum Approval Percentage</h2>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What percentage of approvers must approve for the request to pass?
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={approvalRule.minApprovalPercentage}
                  onChange={(e) => setApprovalRule(prev => ({ ...prev, minApprovalPercentage: parseInt(e.target.value) }))}
                  className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-20 text-center">
                  <span className="text-2xl font-bold text-purple-600">{approvalRule.minApprovalPercentage}%</span>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                ℹ️ The system will calculate approvals dynamically based on this percentage
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition disabled:opacity-50 font-semibold shadow-lg"
            >
              <FiSave size={20} />
              <span>{saving ? 'Saving...' : 'Save Approval Rule'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ApprovalRules;

