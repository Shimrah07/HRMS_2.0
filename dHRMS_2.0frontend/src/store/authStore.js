import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      permissions: [],
      roles: [],
      mustChangePassword: false,

      setAuth: (data) => {
        const { accessToken, refreshToken, user, roles, permissions } = data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          permissions: permissions || user?.permissions || [],
          roles: roles || user?.roles || [],
          mustChangePassword: user?.mustChangePassword ?? false,
        })
      },

      updateTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
        set({ accessToken, ...(refreshToken && { refreshToken }) })
      },

      updateUser: (fields) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null
        }))
      },

      clearMustChangePassword: () => {
        set((state) => ({
          mustChangePassword: false,
          user: state.user ? { ...state.user, mustChangePassword: false } : null,
        }))
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          permissions: [],
          roles: [],
          mustChangePassword: false,
        })
      },

      hasPermission: (code) => {
        const { permissions } = get()
        if (!permissions?.length) return false
        return permissions.includes(code)
      },

      hasRole: (role) => {
        const { roles } = get()
        if (!roles?.length) return false
        return roles.includes(role)
      },

      hasAnyRole: (...roleList) => {
        const { roles } = get()
        return roleList.some((r) => roles.includes(r))
      },

      hasAnyPermission: (...codes) => {
        const { permissions } = get()
        return codes.some((c) => permissions.includes(c))
      },

      isSuperAdmin: () => {
        return get().roles.includes('SUPER_ADMIN')
      },
    }),
    {
      name: 'hrms-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        roles: state.roles,
        mustChangePassword: state.mustChangePassword,
      }),
    }
  )
)

export default useAuthStore
