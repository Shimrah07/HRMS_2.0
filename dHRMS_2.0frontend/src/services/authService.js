import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const authService = {
  login: async (username, password, rememberMe = false) => {
    const { data } = await apiClient.post(API.AUTH.LOGIN, {
      username,
      password,
      rememberMe,
    })
    return data
  },

  logout: async () => {
    const { data } = await apiClient.post(API.AUTH.LOGOUT)
    return data
  },

  refreshToken: async (refreshToken) => {
    const { data } = await apiClient.post(API.AUTH.REFRESH, { refreshToken })
    return data
  },

  me: async () => {
    const { data } = await apiClient.get(API.AUTH.ME)
    return data
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const { data } = await apiClient.post(API.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
      confirmPassword,
    })
    return data
  },

  forgotPassword: async (email) => {
    const { data } = await apiClient.post(API.AUTH.FORGOT_PASSWORD, { email })
    return data
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    const { data } = await apiClient.post(API.AUTH.RESET_PASSWORD, {
      token,
      newPassword,
      confirmPassword,
    })
    return data
  },
}
