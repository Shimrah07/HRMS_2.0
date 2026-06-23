import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const dashboardService = {
  getHRDashboard: async () => {
    const { data } = await apiClient.get(API.DASHBOARD.HR)
    return data
  },

  getManagerDashboard: async () => {
    const { data } = await apiClient.get(API.DASHBOARD.MANAGER)
    return data
  },

  getEmployeeDashboard: async () => {
    const { data } = await apiClient.get(API.DASHBOARD.EMPLOYEE)
    return data
  },

  getAttendanceToday: async () => {
    const { data } = await apiClient.get(API.DASHBOARD.ATTENDANCE_TODAY)
    return data
  },
}
