import useAuthStore from '../../store/authStore'

/**
 * PermissionGate — Renders children only if the user has the required permission or role.
 *
 * Usage:
 *   <PermissionGate permission="EMPLOYEE.CREATE">
 *     <CreateButton />
 *   </PermissionGate>
 *
 *   <PermissionGate role="HR_ADMIN" fallback={<span>No access</span>}>
 *     <SensitivePanel />
 *   </PermissionGate>
 *
 *   <PermissionGate anyRole={["HR_ADMIN", "SUPER_ADMIN"]}>
 *     <AdminActions />
 *   </PermissionGate>
 *
 *   <PermissionGate anyPermission={["PAYROLL.VIEW", "PAYROLL.PROCESS"]}>
 *     <PayrollSection />
 *   </PermissionGate>
 */
export default function PermissionGate({
  children,
  permission,       // Single permission code required
  anyPermission,    // Array — passes if user has ANY of these permissions
  role,             // Single role code required
  anyRole,          // Array — passes if user has ANY of these roles
  fallback = null,  // What to render if access denied (default: nothing)
}) {
  const { hasPermission, hasRole, hasAnyRole, hasAnyPermission, isSuperAdmin } = useAuthStore()

  // SuperAdmin always passes
  if (isSuperAdmin()) return <>{children}</>

  // Check single permission
  if (permission && !hasPermission(permission)) return <>{fallback}</>

  // Check any of multiple permissions
  if (anyPermission && Array.isArray(anyPermission) && !hasAnyPermission(...anyPermission)) return <>{fallback}</>

  // Check single role
  if (role && !hasRole(role)) return <>{fallback}</>

  // Check any of multiple roles
  if (anyRole && Array.isArray(anyRole) && !hasAnyRole(...anyRole)) return <>{fallback}</>

  return <>{children}</>
}
