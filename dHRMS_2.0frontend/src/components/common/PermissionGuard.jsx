import { usePermission } from '../../hooks/usePermission'

export default function PermissionGuard({ permission, fallback = null, children }) {
  const { can } = usePermission()

  if (permission && !can(permission)) {
    return fallback
  }

  return children
}
