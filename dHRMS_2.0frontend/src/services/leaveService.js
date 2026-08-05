import apiClient from '../lib/axios'

/**
 * leaveService — Live API client for the Leave Management module.
 */
export const leaveService = {
  /**
   * GET /leave/balances — fetch leave balance summary for the current employee
   */
  getBalances: async (employeeId) => {
    const { data } = await apiClient.get('/leave/balances', { params: { employeeId } })
    return data
  },

  /**
   * GET /leave/my-applications — fetch leave request history for current employee
   */
  getRequests: async () => {
    const { data } = await apiClient.get('/leave/my-applications')
    return data
  },

  /**
   * POST /leave/apply — submit a new leave application
   */
  applyLeave: async (payload) => {
    const { data } = await apiClient.post('/leave/apply', payload)
    return data
  },

  /**
   * GET /leave/team-applications — Direct reports' leave requests for managers
   */
  getTeamRequests: async () => {
    const { data } = await apiClient.get('/leave/team-applications')
    return data
  },

  /**
   * GET /leave/all-applications — Org-wide view for HR Admins & Auditors
   */
  getAllApplications: async () => {
    const { data } = await apiClient.get('/leave/all-applications')
    return data
  },

  /**
   * POST /leave/approve/{id} — approve a leave request (manager/HR)
   */
  approveRequest: async (id) => {
    const { data } = await apiClient.post(`/leave/approve/${id}`)
    return data
  },

  /**
   * POST /leave/reject/{id} — reject a leave request (manager/HR)
   */
  rejectRequest: async (id, payload) => {
    const { data } = await apiClient.post(`/leave/reject/${id}`, payload)
    return data
  }
}
