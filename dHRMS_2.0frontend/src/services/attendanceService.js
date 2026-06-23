import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const attendanceService = {
  getStatus: async () => {
    const { data } = await apiClient.get(API.ATTENDANCE.STATUS)
    return data
  },

  punch: async () => {
    const { data } = await apiClient.post(API.ATTENDANCE.PUNCH)
    return data
  },

  getHistory: async (month, year) => {
    const { data } = await apiClient.get(API.ATTENDANCE.HISTORY, {
      params: { month, year }
    })
    return data
  },

  applyRegularization: async (payload) => {
    const { data } = await apiClient.post(API.ATTENDANCE.REGULARIZE, payload)
    return data
  },

  getRegularizations: async () => {
    const { data } = await apiClient.get(API.ATTENDANCE.REGULARIZATIONS)
    return data
  }
}
