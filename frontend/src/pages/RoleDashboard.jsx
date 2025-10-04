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

  // Debug: Log user object to see structure
  console.log('RoleDashboard - User object:', user);
  console.log('RoleDashboard - User role:', user.role);

  // Show role-specific dashboard
  switch (user.role) {
    case 'admin':
      console.log('Loading Admin Dashboard');
      return <AdminDashboard />;
    case 'manager':
      console.log('Loading Manager Dashboard');
      return <ManagerDashboard />;
    case 'employee':
      console.log('Loading Employee Dashboard');
      return <EmployeeDashboard />;
    default:
      console.log('Defaulting to Employee Dashboard');
      return <EmployeeDashboard />;
  }
};

export default RoleDashboard;

