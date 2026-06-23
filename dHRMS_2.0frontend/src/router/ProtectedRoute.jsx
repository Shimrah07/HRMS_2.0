import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, hasPermission, isSuperAdmin, roles } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (permission && !isSuperAdmin() && !hasPermission(permission)) {
    const hasOnlyEmployeeRole = roles.includes('EMPLOYEE') && !roles.some(r => ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN', 'IT_ADMIN'].includes(r));
    if (hasOnlyEmployeeRole) {
      return <Navigate to="/employees/my-profile" replace />
    }
    return <Navigate to="/403" replace />
  }

  return children
}
