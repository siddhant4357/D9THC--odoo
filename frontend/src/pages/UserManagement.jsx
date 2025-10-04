import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiUser, FiMail, FiTrash2, FiPlus, FiUsers } from 'react-icons/fi';
import axios from 'axios';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingPassword, setSendingPassword] = useState({});

  // New user form state
  const [newUsers, setNewUsers] = useState([{
    id: Date.now(),
    name: '',
    email: '',
    role: 'employee',
    manager: '',
  }]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data.users || []);
        setManagers(response.data.managers || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const addNewUserRow = () => {
    setNewUsers([...newUsers, {
      id: Date.now(),
      name: '',
      email: '',
      role: 'employee',
      manager: '',
    }]);
  };

  const removeUserRow = (id) => {
    setNewUsers(newUsers.filter(u => u.id !== id));
  };

  const updateNewUser = (id, field, value) => {
    setNewUsers(newUsers.map(u => 
      u.id === id ? { ...u, [field]: value } : u
    ));
  };

  const handleSendPassword = async (userData) => {
    const userId = userData.id || userData.email;
    setSendingPassword(prev => ({ ...prev, [userId]: true }));
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Validate required fields
      if (!userData.name || !userData.email || !userData.role) {
        setError('Please fill in all required fields (Name, Email, Role)');
        setSendingPassword(prev => ({ ...prev, [userId]: false }));
        return;
      }

      // If role is employee and no manager selected
      if (userData.role === 'employee' && !userData.manager) {
        setError('Please select a manager for employees');
        setSendingPassword(prev => ({ ...prev, [userId]: false }));
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/users/create-send-password',
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data.message || 'Password sent successfully!');
      
      // Remove from new users list if it was a new user
      if (!userData._id) {
        setNewUsers(newUsers.filter(u => u.id !== userData.id));
        // Add empty row if no rows left
        if (newUsers.length === 1) {
          setNewUsers([{
            id: Date.now(),
            name: '',
            email: '',
            role: 'employee',
            manager: '',
          }]);
        }
      }

      // Refresh users list
      fetchUsers();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error sending password:', error);
      setError(error.response?.data?.message || 'Failed to send password');
    } finally {
      setSendingPassword(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUpdateUser = async (userId, field, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${userId}`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setUsers(users.map(u => 
        u._id === userId ? { ...u, [field]: value } : u
      ));
      
      setSuccess('User updated successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(users.filter(u => u._id !== userId));
      setSuccess('User deleted successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Check if user is admin
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Create and manage users, assign roles, and send login credentials</p>
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

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FiUsers className="mr-2" />
              Create New Users
            </h2>
            <p className="text-sm text-gray-600 mt-1">Add users and send them their login credentials via email</p>
          </div>

          {/* New Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {newUsers.map((newUser) => (
                  <tr key={newUser.id} className="hover:bg-purple-50 transition">
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) => updateNewUser(newUser.id, 'name', e.target.value)}
                        placeholder="Enter name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => updateNewUser(newUser.id, 'email', e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={newUser.role}
                        onChange={(e) => updateNewUser(newUser.id, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={newUser.manager}
                        onChange={(e) => updateNewUser(newUser.id, 'manager', e.target.value)}
                        disabled={newUser.role === 'manager'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Manager</option>
                        {managers.map((manager) => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name} ({manager.email})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSendPassword(newUser)}
                          disabled={sendingPassword[newUser.id]}
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiSend className="mr-2" size={16} />
                          {sendingPassword[newUser.id] ? 'Sending...' : 'Send Password'}
                        </button>
                        {newUsers.length > 1 && (
                          <button
                            onClick={() => removeUserRow(newUser.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove row"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={addNewUserRow}
              className="inline-flex items-center px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium"
            >
              <FiPlus className="mr-2" />
              Add Another User
            </button>
          </div>
        </div>

        {/* Existing Users */}
        {users.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiUser className="mr-2" />
                Existing Users
              </h2>
              <p className="text-sm text-gray-600 mt-1">Manage existing users and resend passwords</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((existingUser) => (
                    <tr key={existingUser._id} className="hover:bg-purple-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <FiUser className="text-purple-600" />
                          </div>
                          <span className="font-medium text-gray-900">{existingUser.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div className="flex items-center">
                          <FiMail className="mr-2 text-gray-400" size={16} />
                          {existingUser.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={existingUser.role}
                          onChange={(e) => handleUpdateUser(existingUser._id, 'role', e.target.value)}
                          disabled={existingUser.role === 'admin'}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed capitalize"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={existingUser.manager?._id || ''}
                          onChange={(e) => handleUpdateUser(existingUser._id, 'manager', e.target.value)}
                          disabled={existingUser.role === 'manager' || existingUser.role === 'admin'}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">No Manager</option>
                          {managers.map((manager) => (
                            <option key={manager._id} value={manager._id}>
                              {manager.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSendPassword(existingUser)}
                            disabled={sendingPassword[existingUser._id]}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                          >
                            <FiSend className="mr-1" size={14} />
                            {sendingPassword[existingUser._id] ? 'Sending...' : 'Resend'}
                          </button>
                          {existingUser.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(existingUser._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete user"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h3 className="font-semibold text-purple-900 mb-2">How it works:</h3>
        <ul className="text-sm text-purple-800 space-y-2">
          <li>• Fill in user details and click "Send Password" to create a new user</li>
          <li>• A secure random password will be generated and sent to their email</li>
          <li>• Users can log in with the sent password and change it in their account settings</li>
          <li>• Employees must have a manager assigned</li>
          <li>• Managers don't need a manager assignment</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;

