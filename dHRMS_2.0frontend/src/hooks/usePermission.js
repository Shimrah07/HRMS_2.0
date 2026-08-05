import useAuthStore from '../store/authStore'

export function usePermission() {
  const { permissions, roles, hasPermission, hasRole, hasAnyRole, isSuperAdmin } = useAuthStore()

  const can = (permissionCode) => {
    if (isSuperAdmin()) return true
    return hasPermission(permissionCode)
  }

  const canAny = (...codes) => {
    if (isSuperAdmin()) return true
    return codes.some((code) => hasPermission(code))
  }

  const isRole = (role) => hasRole(role)

  const isAnyRole = (...roleList) => hasAnyRole(...roleList)

  const isAdminOrHrAdmin = isSuperAdmin() || hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')

  return {
    permissions,
    roles,
    can,
    canAny,
    isRole,
    isAnyRole,
    isSuperAdmin: isSuperAdmin(),
    isAdminOrHrAdmin,
  }
}
