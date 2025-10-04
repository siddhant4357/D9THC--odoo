import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import AdminLayout from './components/AdminLayout';
import RoleDashboard from './pages/RoleDashboard';
import ApprovalRules from './pages/admin/ApprovalRules';
import ExpenseManagement from './pages/employee/ExpenseManagement';
import ExpenseDetail from './pages/employee/ExpenseDetail';
import PendingApprovals from './pages/manager/PendingApprovals';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<RoleDashboard />} />
            <Route path="expenses" element={<ExpenseManagement />} />
            <Route path="expenses/new" element={<ExpenseDetail />} />
            <Route path="expenses/:id" element={<ExpenseDetail />} />
            <Route path="approvals" element={<PendingApprovals />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="approval-rules" element={<ApprovalRules />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;