import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, hasPermission, isSuperAdmin, roles, mustChangePassword } = useAuthStore()
  const location = useLocation()

  // 1. Must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Force password change if flagged — cannot bypass to any other route
  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  // 3. Check permission if required
  if (permission && !isSuperAdmin() && !hasPermission(permission)) {
    const hasOnlyEmployeeRole = roles.includes('EMPLOYEE') && !roles.some(r =>
      ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN', 'IT_ADMIN', 'HR_EXEC', 'REPORTING_MGR', 'COMPLIANCE_OFFICER'].includes(r)
    )
    if (hasOnlyEmployeeRole) {
      return <Navigate to="/employees/my-profile" replace />
    }
    return <Navigate to="/403" replace />
  }

  return children
}
