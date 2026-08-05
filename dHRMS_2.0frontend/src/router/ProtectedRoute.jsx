import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { usePermission } from '../hooks/usePermission'

/**
 * ProtectedRoute — enforces both authentication AND optional permission-code checks.
 *
 * Props:
 *   children         — the page component to render if access is granted
 *   requiredPermission — (optional) a PERMISSIONS.MODULE.ACTION string. If provided,
 *                        the user must have this permission OR be SUPER_ADMIN.
 *                        Frontend hiding is UX-only; the API layer is the real security boundary.
 *
 * RBAC fix note: The previous version only checked isAuthenticated, which meant any
 * logged-in user could reach any route by navigating directly to the URL.
 * This version adds a permission gate so the route itself rejects unauthorized users,
 * consistent with the API [RequirePermission] attributes.
 */
export default function ProtectedRoute({ children, requiredPermission = null }) {
  const { isAuthenticated, mustChangePassword } = useAuthStore()
  const { can, isSuperAdmin } = usePermission()
  const location = useLocation()

  // 1. Must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Force password change — cannot bypass to any other route
  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  // 3. Permission check — if a specific permission is required, enforce it
  //    SUPER_ADMIN bypasses all permission checks (isSuperAdmin is checked inside can())
  if (requiredPermission && !can(requiredPermission)) {
    // Redirect to dashboard with a 403-equivalent state so the page can show a message
    return <Navigate to="/dashboard" state={{ accessDenied: true, from: location }} replace />
  }

  return children
}
