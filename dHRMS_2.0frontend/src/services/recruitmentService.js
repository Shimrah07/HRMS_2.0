import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const recruitmentService = {
  // Requisitions
  getRequisitions: async (params) => {
    const { data } = await apiClient.get(API.RECRUITMENT.REQUISITIONS, { params })
    return data
  },
  getRequisition: async (id) => {
    const { data } = await apiClient.get(API.RECRUITMENT.REQUISITION(id))
    return data
  },
  createRequisition: async (payload) => {
    console.log("recruitmentService: executing createRequisition() with payload =", payload)
    const { data } = await apiClient.post(API.RECRUITMENT.REQUISITIONS, payload)
    return data
  },
  updateRequisition: async (id, payload) => {
    console.log("recruitmentService: executing updateRequisition() with id =", id, "payload =", payload)
    const { data } = await apiClient.put(API.RECRUITMENT.REQUISITION(id), payload)
    return data
  },
  submitRequisition: async (id) => {
    console.log("recruitmentService: executing submitRequisition() with id =", id)
    const { data } = await apiClient.post(API.RECRUITMENT.REQUISITION_SUBMIT(id))
    return data
  },
  approveRequisition: async (id, payload) => {
    const { data } = await apiClient.post(API.RECRUITMENT.REQUISITION_APPROVE(id), payload)
    return data
  },
  getInternalCheck: async (id) => {
    const { data } = await apiClient.get(API.RECRUITMENT.REQUISITION_INTERNAL_CHECK(id))
    return data
  },
  returnRequisition: async (id, payload) => {
    const { data } = await apiClient.post(`${API.RECRUITMENT.REQUISITIONS}/${id}/return`, payload)
    return data
  },
  cancelRequisition: async (id, reason) => {
    const { data } = await apiClient.post(`${API.RECRUITMENT.REQUISITIONS}/${id}/cancel`, null, { params: { reason } })
    return data
  },
  deleteRequisition: async (id) => {
    const { data } = await apiClient.delete(`${API.RECRUITMENT.REQUISITIONS}/${id}`)
    return data
  },
  processInternalAction: async (id, payload) => {
    const { data } = await apiClient.post(`${API.RECRUITMENT.REQUISITIONS}/${id}/internal-action`, payload)
    return data
  },
  getRequisitionAuditTrail: async (id) => {
    const { data } = await apiClient.get(`${API.RECRUITMENT.REQUISITIONS}/${id}/audit-trail`)
    return data
  },

  // Job Postings
  getPostings: async () => {
    const { data } = await apiClient.get(API.RECRUITMENT.POSTINGS)
    return data
  },
  getAdminPostings: async (params) => {
    const { data } = await apiClient.get(API.RECRUITMENT.POSTING_ADMIN, { params })
    return data
  },
  getPosting: async (id) => {
    const { data } = await apiClient.get(API.RECRUITMENT.POSTING(id))
    return data
  },
  createPosting: async (payload) => {
    const { data } = await apiClient.post(API.RECRUITMENT.POSTINGS, payload)
    return data
  },
  updatePosting: async (id, payload) => {
    const { data } = await apiClient.put(API.RECRUITMENT.POSTING(id), payload)
    return data
  },
  publishPosting: async (id) => {
    const { data } = await apiClient.post(API.RECRUITMENT.POSTING_PUBLISH(id))
    return data
  },
  closePosting: async (id) => {
    const { data } = await apiClient.post(API.RECRUITMENT.POSTING_CLOSE(id))
    return data
  },
  unpublishPosting: async (id) => {
    const { data } = await apiClient.post(`${API.RECRUITMENT.POSTINGS}/${id}/unpublish`)
    return data
  },
  deletePosting: async (id) => {
    const { data } = await apiClient.delete(API.RECRUITMENT.POSTING(id))
    return data
  },

  // Candidates
  getCandidates: async (params) => {
    const { data } = await apiClient.get(API.CANDIDATES.LIST, { params })
    return data
  },
  getCandidate: async (id) => {
    const { data } = await apiClient.get(API.CANDIDATES.DETAIL(id))
    return data
  },
  createCandidate: async (payload) => {
    const { data } = await apiClient.post(API.CANDIDATES.LIST, payload)
    return data
  },
  updateCandidate: async (id, payload) => {
    const { data } = await apiClient.put(API.CANDIDATES.DETAIL(id), payload)
    return data
  },
  deleteCandidate: async (id) => {
    const { data } = await apiClient.delete(API.CANDIDATES.DETAIL(id))
    return data
  },
  uploadResume: async (id, file) => {
    const formData = new FormData()
    formData.append('resume', file)
    const { data } = await apiClient.post(API.CANDIDATES.RESUME(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },
  importCandidates: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post(API.CANDIDATES.IMPORT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },

  // Lookup candidates by name, email, or mobile (top 5) — for smart Add Candidate modal
  lookupCandidate: async (q) => {
    const { data } = await apiClient.get(`${API.CANDIDATES.LIST}/lookup`, { params: { q } })
    return data
  },

  // POST /job-postings/{jobId}/apply — unified entry for both new + existing candidates
  addCandidateToJob: async (jobId, formData) => {
    const { data } = await apiClient.post(`${API.RECRUITMENT.POSTINGS}/${jobId}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  // Job Applications & ATS Stage transitions
  getApplications: async (params) => {
    const { data } = await apiClient.get(API.APPLICATIONS.LIST, { params })
    return data
  },
  getApplication: async (id) => {
    const { data } = await apiClient.get(API.APPLICATIONS.DETAIL(id))
    return data
  },
  createApplication: async (payload) => {
    const { data } = await apiClient.post(API.APPLICATIONS.CREATE, payload)
    return data
  },
  updateApplicationStage: async (id, payload) => {
    const { data } = await apiClient.put(API.APPLICATIONS.STAGE(id), payload)
    return data
  },
  saveWorkspace: async (id, payload) => {
    const { data } = await apiClient.put(`${API.APPLICATIONS.LIST}/${id}/workspace`, payload)
    return data
  },
  addApplicationNote: async (id, note) => {
    const { data } = await apiClient.post(`${API.APPLICATIONS.LIST}/${id}/notes`, { note })
    return data
  },
  convertCandidate: async (id, payload) => {
    const { data } = await apiClient.post(`${API.APPLICATIONS.LIST}/${id}/convert`, payload)
    return data
  },

  // Interviews
  getInterviews: async (params) => {
    const { data } = await apiClient.get(API.INTERVIEWS.LIST, { params })
    return data
  },
  scheduleInterview: async (payload) => {
    const { data } = await apiClient.post(API.INTERVIEWS.SCHEDULE, payload)
    return data
  },
  createInterview: async (payload) => {
    const { data } = await apiClient.post(API.INTERVIEWS.SCHEDULE, payload)
    return data
  },
  submitInterviewerFeedback: async (payload) => {
    const { data } = await apiClient.post(API.INTERVIEWS.FEEDBACK, payload)
    return data
  },
  submitInterviewFeedback: async (payload) => {
    const { data } = await apiClient.post(API.INTERVIEWS.FEEDBACK, payload)
    return data
  },
  updateInterview: async (id, payload) => {
    const { data } = await apiClient.put(`${API.INTERVIEWS.LIST}/${id}`, payload)
    return data
  },
  updateInterviewStatus: async (id, status) => {
    const { data } = await apiClient.post(`${API.INTERVIEWS.LIST}/${id}/status`, null, { params: { status } })
    return data
  },
  sendInterviewInvitation: async (id) => {
    const { data } = await apiClient.post(`${API.INTERVIEWS.LIST}/${id}/send-invitation`)
    return data
  },
  updateInterviewChecklist: async (id, checklist) => {
    const { data } = await apiClient.put(`${API.INTERVIEWS.LIST}/${id}/checklist`, checklist)
    return data
  },
  uploadInterviewAttachment: async (id, file, documentType) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType || 'Other')
    const { data } = await apiClient.post(`${API.INTERVIEWS.LIST}/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  // Offers
  getOffers: async (params) => {
    const { data } = await apiClient.get(API.OFFERS.LIST, { params })
    return data
  },
  getOffer: async (id) => {
    const { data } = await apiClient.get(API.OFFERS.DETAIL(id))
    return data
  },
  createOffer: async (payload) => {
    const { data } = await apiClient.post(API.OFFERS.CREATE, payload)
    return data
  },
  approveOffer: async (id, payload) => {
    const { data } = await apiClient.post(API.OFFERS.APPROVE(id), payload)
    return data
  },
  downloadOfferLetter: async (id) => {
    const response = await apiClient.get(API.OFFERS.DOWNLOAD(id), { responseType: 'blob' })
    return response.data
  },

  // BGV
  getBGVRecords: async (params) => {
    const { data } = await apiClient.get(API.BGV.LIST, { params })
    return data
  },
  initiateBGV: async (payload) => {
    const { data } = await apiClient.post(API.BGV.INITIATE, payload)
    return data
  },
  updateBGVCheck: async (id, payload) => {
    const { data } = await apiClient.put(API.BGV.CHECK(id), payload)
    return data
  },

  // Onboarding
  getOnboardings: async (params) => {
    const { data } = await apiClient.get(API.ONBOARDING.LIST, { params })
    return data
  },
  getOnboarding: async (id) => {
    const { data } = await apiClient.get(API.ONBOARDING.DETAIL(id))
    return data
  },
  updateOnboardingChecklist: async (id, payload) => {
    const { data } = await apiClient.put(API.ONBOARDING.CHECKLIST(id), payload)
    return data
  },
  assignBuddyAsset: async (id, payload) => {
    const { data } = await apiClient.put(API.ONBOARDING.ASSIGN(id), payload)
    return data
  },
  convertToEmployee: async (id) => {
    const { data } = await apiClient.post(API.ONBOARDING.CONVERT(id))
    return data
  },
  acceptOffer: async (id, payload) => {
    const { data } = await apiClient.put(API.OFFERS.ACCEPT(id), payload)
    return data
  },
  getOnboardingTasks: async (id) => {
    const { data } = await apiClient.get(API.ONBOARDING.TASKS(id))
    return data
  },
  updateOnboardingTask: async (taskId, payload) => {
    const { data } = await apiClient.put(API.ONBOARDING.UPDATE_TASK(taskId), payload)
    return data
  },
  getProbationList: async () => {
    const { data } = await apiClient.get(API.PROBATION.LIST)
    return data
  },
  getProbationReviews: async (employeeId) => {
    const { data } = await apiClient.get(API.PROBATION.REVIEWS(employeeId))
    return data
  },
  submitProbationReview: async (reviewId, payload) => {
    const { data } = await apiClient.post(API.PROBATION.SUBMIT_REVIEW(reviewId), payload)
    return data
  },
  confirmProbation: async (employeeId, payload) => {
    const { data } = await apiClient.post(API.PROBATION.CONFIRM(employeeId), payload)
    return data
  },
  getOnboardingDashboardSummary: async () => {
    const { data } = await apiClient.get(API.ONBOARDING.DASHBOARD_SUMMARY)
    return data
  },

  // ATS Phase 2 - Ingestion Queue & CSV Import
  publicApply: async (formData) => {
    const { data } = await apiClient.post('/recruitment/public/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },
  getPendingApplications: async (params) => {
    const { data } = await apiClient.get('/recruitment/pending', { params })
    return data
  },
  approvePendingApplication: async (id) => {
    const { data } = await apiClient.post(`/recruitment/pending/${id}/approve`)
    return data
  },
  rejectPendingApplication: async (id, payload) => {
    const { data } = await apiClient.post(`/recruitment/pending/${id}/reject`, payload)
    return data
  },
  previewImport: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post('/recruitment/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },
  applyImport: async (payload) => {
    const { data } = await apiClient.post('/recruitment/import/apply', payload)
    return data
  },
  blacklistCandidate: async (id, payload) => {
    const { data } = await apiClient.post(`/candidates/${id}/blacklist`, payload)
    return data
  },
  unblacklistCandidate: async (id) => {
    const { data } = await apiClient.post(`/candidates/${id}/unblacklist`)
    return data
  }
}
