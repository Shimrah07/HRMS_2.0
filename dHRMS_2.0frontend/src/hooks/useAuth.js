import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import useAuthStore from '../store/authStore'
import { authService } from '../services/authService'

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setAuth, logout: clearAuth, user, isAuthenticated, hasPermission, hasRole, isSuperAdmin } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: ({ username, password, rememberMe }) =>
      authService.login(username, password, rememberMe),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuth(response.data)
        message.success('Welcome back!')
        navigate('/dashboard')
      } else {
        message.error(response.message || 'Login failed')
      }
    },
    onError: () => {
      message.error('Unable to connect to server. Please try again.')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword, confirmPassword }) =>
      authService.changePassword(currentPassword, newPassword, confirmPassword),
    onSuccess: (response) => {
      if (response.success) {
        message.success('Password changed successfully')
      } else {
        message.error(response.message || 'Password change failed')
      }
    },
  })

  return {
    user,
    isAuthenticated,
    hasPermission,
    hasRole,
    isSuperAdmin,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
  }
}
