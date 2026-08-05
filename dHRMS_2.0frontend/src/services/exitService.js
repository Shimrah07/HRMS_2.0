import apiClient from '../lib/axios'

export const exitService = {
  // Resignation & Notice
  submitResignation: async (data) => {
    const response = await apiClient.post('/exit/resignation', data)
    return response.data
  },
  getExitRecords: async (params) => {
    const response = await apiClient.get('/exit/records', { params })
    return response.data
  },
  getMyExitRecord: async () => {
    const response = await apiClient.get('/exit/my-record')
    return response.data
  },
  getExitRecordById: async (id) => {
    const response = await apiClient.get(`/exit/${id}`)
    return response.data
  },
  calculateNoticePeriod: async (empId) => {
    const response = await apiClient.get(`/exit/${empId}/notice-period`)
    return response.data
  },
  confirmLastWorkingDay: async (id, data) => {
    const response = await apiClient.put(`/exit/${id}/confirm-lwd`, data)
    return response.data
  },
  withdrawResignation: async (id, data) => {
    const response = await apiClient.post(`/exit/${id}/withdraw`, data)
    return response.data
  },

  // Counter Offer
  createCounterOffer: async (id, data) => {
    const response = await apiClient.post(`/exit/${id}/counter-offer`, data)
    return response.data
  },
  respondToCounterOffer: async (offerId, data) => {
    const response = await apiClient.put(`/exit/counter-offer/${offerId}/respond`, data)
    return response.data
  },
  getCounterOffers: async (id) => {
    const response = await apiClient.get(`/exit/${id}/counter-offers`)
    return response.data
  },

  // Multi-Dept Clearance
  getClearanceStatus: async (id) => {
    const response = await apiClient.get(`/exit/${id}/clearance-status`)
    return response.data
  },
  approveClearance: async (id, dept, data) => {
    const response = await apiClient.put(`/exit/${id}/clearance/${dept}/approve`, data)
    return response.data
  },

  // Exit Interview
  submitExitInterview: async (id, data) => {
    const response = await apiClient.post(`/exit/${id}/interview`, data)
    return response.data
  },
  getInterviewAnalytics: async (deptId) => {
    const response = await apiClient.get('/exit/interview-analytics', { params: { deptId } })
    return response.data
  },

  // FFS Settlement
  calculateFFS: async (id) => {
    const response = await apiClient.post(`/exit/${id}/ffs-calculate`)
    return response.data
  },
  approveFFS: async (id, data) => {
    const response = await apiClient.put(`/exit/${id}/ffs-approve`, data)
    return response.data
  },
  disburseFFS: async (id, data) => {
    const response = await apiClient.post(`/exit/${id}/ffs-disburse`, data)
    return response.data
  },

  // Documents
  generateDocument: async (id, documentType, conductRemark = 'Satisfactory') => {
    const response = await apiClient.post(`/exit/${id}/generate-document`, null, {
      params: { documentType, conductRemark }
    })
    return response.data
  },
  getExitDocuments: async (id) => {
    const response = await apiClient.get(`/exit/${id}/documents`)
    return response.data
  },

  // Sector Configuration
  getSectorConfigs: async () => {
    const response = await apiClient.get('/exit/sector-rules')
    return response.data
  },
  saveSectorConfig: async (data) => {
    const response = await apiClient.post('/exit/sector-rules', data)
    return response.data
  },

  // Attrition Analytics
  getAttritionSummary: async (year) => {
    const response = await apiClient.get('/exit/attrition-summary', { params: { year } })
    return response.data
  }
}

export default exitService
