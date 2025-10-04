import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminDashboard from './admin/AdminDashboard';
import ManagerDashboard from './manager/ManagerDashboard';
import EmployeeDashboard from './employee/EmployeeDashboard';

/**
 * Smart Dashboard component that shows role-specific dashboards
 */
const RoleDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/signin" />;
  }

  // Show role-specific dashboard
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

export default RoleDashboard;

