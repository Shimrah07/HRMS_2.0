import apiClient from '../lib/axios'

export const travelExpenseService = {
  // Policy & Entitlements
  getEntitlements: async () => {
    const { data } = await apiClient.get('/travel/policies')
    return data
  },
  saveEntitlement: async (payload) => {
    const { data } = await apiClient.post('/travel/policies', payload)
    return data
  },
  requestPolicyException: async (payload) => {
    const { data } = await apiClient.post('/travel/policy-exception', payload)
    return data
  },
  reviewPolicyException: async (id, role, isApproved) => {
    const { data } = await apiClient.put(`/travel/policy-exception/${id}/review?role=${role}&isApproved=${isApproved}`)
    return data
  },

  // Travel Requests & Booking
  createTravelRequest: async (payload) => {
    const { data } = await apiClient.post('/travel/request', payload)
    return data
  },
  getTravelRequests: async (params) => {
    const { data } = await apiClient.get('/travel/requests', { params })
    return data
  },
  getTravelRequestById: async (id) => {
    const { data } = await apiClient.get(`/travel/requests/${id}`)
    return data
  },
  approveTravelRequest: async (id, payload) => {
    const { data } = await apiClient.put(`/travel/requests/${id}/approve`, payload)
    return data
  },
  confirmBooking: async (id, payload) => {
    const { data } = await apiClient.post(`/travel/requests/${id}/booking`, payload)
    return data
  },

  // Advances
  requestAdvance: async (payload) => {
    const { data } = await apiClient.post('/advance/request', payload)
    return data
  },
  getAdvances: async (params) => {
    const { data } = await apiClient.get('/advance/outstanding', { params })
    return data
  },
  disburseAdvance: async (id, payload) => {
    const { data } = await apiClient.put(`/advance/${id}/disburse`, payload)
    return data
  },

  // Expense Claims & OCR
  submitExpenseClaim: async (payload) => {
    const { data } = await apiClient.post('/expense/claim', payload)
    return data
  },
  getExpenseClaims: async (params) => {
    const { data } = await apiClient.get('/expense/claims', { params })
    return data
  },
  approveExpenseClaim: async (id, payload) => {
    const { data } = await apiClient.put(`/expense/${id}/approve`, payload)
    return data
  },
  processOcrScan: async (payload) => {
    const { data } = await apiClient.post('/expense/ocr-scan', payload)
    return data
  },
  getGstSummary: async (month) => {
    const { data } = await apiClient.get('/expense/gst-summary', { params: { month } })
    return data
  },
  reconcileCreditCard: async (payload) => {
    const { data } = await apiClient.post('/expense/creditcard-reconcile', payload)
    return data
  },

  // Reimbursements
  createReimbursementBatch: async (payload) => {
    const { data } = await apiClient.post('/expense/reimbursement-run', payload)
    return data
  },
  getReimbursementBatches: async () => {
    const { data } = await apiClient.get('/expense/reimbursement-batches')
    return data
  },

  // Sector Config
  getSectorConfigs: async () => {
    const { data } = await apiClient.get('/travel/sector-configs')
    return data
  },
  updateSectorConfig: async (sectorName, isActive, payload) => {
    const { data } = await apiClient.put(`/travel/sector-configs/${sectorName}?isActive=${isActive}`, payload)
    return data
  },

  // Analytics & Reports
  getAnalyticsSummary: async () => {
    const { data } = await apiClient.get('/travel/analytics')
    return data
  },
  getReportData: async (payload) => {
    const { data } = await apiClient.post('/travel/reports/export', payload)
    return data
  }
}
