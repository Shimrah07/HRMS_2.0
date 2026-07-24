import apiClient from '../lib/axios'

/**
 * leaveService — Centralized API client for the Leave Management module.
 *
 * NOTE: The backend Leave endpoints are planned for a future sprint.
 * This service provides the API contract so LeavePage can swap from
 * localStorage to real API calls with zero architectural changes.
 *
 * Current LeavePage uses localStorage as a temporary store.
 * Once the backend is ready, replace the localStorage logic in LeavePage
 * with calls to these methods.
 */
export const leaveService = {
  /**
   * GET /leave/balances — fetch leave balance summary for the current employee
   */
  getBalances: async () => {
    const { data } = await apiClient.get('/leave/balances')
    return data
  },

  /**
   * GET /leave/requests — fetch leave request history for the current employee
   * @param {object} params - optional filters (status, from, to)
   */
  getRequests: async (params) => {
    const { data } = await apiClient.get('/leave/requests', { params })
    return data
  },

  /**
   * POST /leave/requests — submit a new leave application
   * @param {object} payload - { type, startDate, endDate, reason }
   */
  applyLeave: async (payload) => {
    const { data } = await apiClient.post('/leave/requests', payload)
    return data
  },

  /**
   * DELETE /leave/requests/{id} — cancel a pending leave request
   * @param {string} id - leave request ID (GUID)
   */
  cancelRequest: async (id) => {
    const { data } = await apiClient.delete(`/leave/requests/${id}`)
    return data
  },

  /**
   * GET /leave/requests/team — HR view: all team leave requests
   * @param {object} params - optional filters (departmentId, status, month)
   */
  getTeamRequests: async (params) => {
    const { data } = await apiClient.get('/leave/requests/team', { params })
    return data
  },

  /**
   * POST /leave/requests/{id}/approve — approve a leave request (manager/HR)
   * @param {string} id - leave request ID
   * @param {object} payload - optional { remarks }
   */
  approveRequest: async (id, payload) => {
    const { data } = await apiClient.post(`/leave/requests/${id}/approve`, payload)
    return data
  },

  /**
   * POST /leave/requests/{id}/reject — reject a leave request (manager/HR)
   * @param {string} id - leave request ID
   * @param {object} payload - { reason }
   */
  rejectRequest: async (id, payload) => {
    const { data } = await apiClient.post(`/leave/requests/${id}/reject`, payload)
    return data
  },

  /**
   * GET /leave/holidays — fetch the company holiday calendar
   */
  getHolidays: async () => {
    const { data } = await apiClient.get('/leave/holidays')
    return data
  }
}
