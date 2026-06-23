import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const notificationService = {
  getNotifications: async (unreadOnly = false) => {
    const { data } = await apiClient.get(API.NOTIFICATIONS.LIST, {
      params: { unreadOnly },
    })
    return data
  },

  getUnreadCount: async () => {
    const { data } = await apiClient.get(API.NOTIFICATIONS.UNREAD_COUNT)
    return data
  },

  markRead: async (id) => {
    const { data } = await apiClient.put(API.NOTIFICATIONS.MARK_READ(id))
    return data
  },

  markAllRead: async () => {
    const { data } = await apiClient.put(API.NOTIFICATIONS.MARK_ALL_READ)
    return data
  },

  deleteNotification: async (id) => {
    const { data } = await apiClient.delete(API.NOTIFICATIONS.DELETE(id))
    return data
  },

  clearAll: async () => {
    const { data } = await apiClient.delete(`${API.NOTIFICATIONS.LIST}/clear-all`)
    return data
  },
}
