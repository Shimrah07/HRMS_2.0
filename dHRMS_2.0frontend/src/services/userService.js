import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const userService = {
  getUsers: async (params = {}) => {
    const { data } = await apiClient.get(API.USERS.LIST, { params })
    return data
  },

  getUser: async (id) => {
    const { data } = await apiClient.get(API.USERS.DETAIL(id))
    return data
  },

  createUser: async (payload) => {
    const { data } = await apiClient.post(API.USERS.CREATE, payload)
    return data
  },

  updateUser: async (id, payload) => {
    const { data } = await apiClient.put(API.USERS.UPDATE(id), payload)
    return data
  },

  assignRoles: async (id, roleIds) => {
    const { data } = await apiClient.put(API.USERS.ASSIGN_ROLES(id), { roleIds })
    return data
  },

  toggleActive: async (id) => {
    const { data } = await apiClient.put(API.USERS.TOGGLE_ACTIVE(id))
    return data
  },

  toggleLock: async (id, isLocked) => {
    const { data } = await apiClient.put(API.USERS.TOGGLE_LOCK(id), { isLocked })
    return data
  },

  adminResetPassword: async (id) => {
    const { data } = await apiClient.post(API.USERS.RESET_PASSWORD(id))
    return data
  },

  getRoles: async () => {
    const { data } = await apiClient.get(API.ROLES.LIST)
    return data
  },

  getPermissions: async () => {
    const { data } = await apiClient.get(API.PERMISSIONS.LIST)
    return data
  },

  getPermissionMatrix: async () => {
    const { data } = await apiClient.get(API.PERMISSIONS.MATRIX)
    return data
  },

  updateRolePermissions: async (roleId, permissionIds) => {
    const { data } = await apiClient.put(API.ROLES.PERMISSIONS(roleId), permissionIds)
    return data
  },
}
