import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const employeeService = {
  // ─── Employee Core ────────────────────────────────────────────────────────
  getEmployees: async (params = {}) => {
    const { data } = await apiClient.get(API.EMPLOYEES.LIST, { params })
    return data
  },

  getEmployee: async (id) => {
    const { data } = await apiClient.get(API.EMPLOYEES.DETAIL(id))
    return data
  },

  getEmployeeSummary: async (id) => {
    const { data } = await apiClient.get(API.EMPLOYEES.SUMMARY(id))
    return data
  },

  createEmployee: async (payload) => {
    const { data } = await apiClient.post(API.EMPLOYEES.CREATE, payload)
    return data
  },

  updateEmployee: async (id, payload) => {
    const { data } = await apiClient.put(API.EMPLOYEES.UPDATE(id), payload)
    return data
  },

  updateStatus: async (id, status) => {
    const { data } = await apiClient.put(API.EMPLOYEES.STATUS(id), { status })
    return data
  },

  confirmEmployee: async (id) => {
    const { data } = await apiClient.put(API.EMPLOYEES.CONFIRM(id))
    return data
  },

  uploadPhoto: async (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.put(API.EMPLOYEES.PHOTO(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // ─── Documents ────────────────────────────────────────────────────────────
  getDocuments: async (id) => {
    const { data } = await apiClient.get(API.EMPLOYEES.DOCUMENTS(id))
    return data
  },

  uploadDocument: async (id, file, docType) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('docType', docType)
    const { data } = await apiClient.post(API.EMPLOYEES.DOCUMENTS(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  verifyDocument: async (id, docId) => {
    const { data } = await apiClient.put(API.EMPLOYEES.DOCUMENT_VERIFY(id, docId))
    return data
  },

  getDocumentDownloadUrl: (id, docId) => {
    return API.EMPLOYEES.DOCUMENT_DOWNLOAD(id, docId)
  },

  // ─── Bank Details ─────────────────────────────────────────────────────────
  getBankDetails: async (id) => {
    const { data } = await apiClient.get(API.EMPLOYEES.BANK_DETAILS(id))
    return data
  },

  addBankDetail: async (id, payload) => {
    const { data } = await apiClient.post(API.EMPLOYEES.BANK_DETAILS(id), payload)
    return data
  },

  deleteBankDetail: async (id, bankId) => {
    const { data } = await apiClient.delete(API.EMPLOYEES.BANK_DETAIL(id, bankId))
    return data
  },

  // ─── Education ────────────────────────────────────────────────────────────
  getEducations: async (id) => {
    const { data } = await apiClient.get(API.EMPLOYEES.EDUCATIONS(id))
    return data
  },

  addEducation: async (id, payload) => {
    const { data } = await apiClient.post(API.EMPLOYEES.EDUCATIONS(id), payload)
    return data
  },

  updateEducation: async (id, eduId, payload) => {
    const { data } = await apiClient.put(API.EMPLOYEES.EDUCATION_DETAIL(id, eduId), payload)
    return data
  },

  deleteEducation: async (id, eduId) => {
    const { data } = await apiClient.delete(API.EMPLOYEES.EDUCATION_DETAIL(id, eduId))
    return data
  },

  // ─── Experience ───────────────────────────────────────────────────────────
  getExperiences: async (id) => {
    const { data } = await apiClient.get(API.EMPLOYEES.EXPERIENCES(id))
    return data
  },

  addExperience: async (id, payload) => {
    const { data } = await apiClient.post(API.EMPLOYEES.EXPERIENCES(id), payload)
    return data
  },

  updateExperience: async (id, expId, payload) => {
    const { data } = await apiClient.put(API.EMPLOYEES.EXPERIENCE_DETAIL(id, expId), payload)
    return data
  },

  deleteExperience: async (id, expId) => {
    const { data } = await apiClient.delete(API.EMPLOYEES.EXPERIENCE_DETAIL(id, expId))
    return data
  },

  // ─── PF Nominees ──────────────────────────────────────────────────────────
  getNominees: async (id) => {
    const { data } = await apiClient.get(API.EMPLOYEES.NOMINEES(id))
    return data
  },

  addNominee: async (id, payload) => {
    const { data } = await apiClient.post(API.EMPLOYEES.NOMINEES(id), payload)
    return data
  },

  updateNominee: async (id, nomineeId, payload) => {
    const { data } = await apiClient.put(API.EMPLOYEES.NOMINEE_DETAIL(id, nomineeId), payload)
    return data
  },

  deleteNominee: async (id, nomineeId) => {
    const { data } = await apiClient.delete(API.EMPLOYEES.NOMINEE_DETAIL(id, nomineeId))
    return data
  },

  // ─── My Profile (ESS) ─────────────────────────────────────────────────────
  getMyProfile: async () => {
    const { data } = await apiClient.get(API.EMPLOYEES.MY_PROFILE)
    return data
  },

  updateMyProfile: async (payload) => {
    const { data } = await apiClient.put(API.EMPLOYEES.MY_PROFILE, payload)
    return data
  },

  // ─── Org Chart & Directory ────────────────────────────────────────────────
  getOrgChart: async () => {
    const { data } = await apiClient.get(API.EMPLOYEES.ORG_CHART)
    return data
  },

  getDirectory: async (search = '') => {
    const { data } = await apiClient.get(API.EMPLOYEES.DIRECTORY, {
      params: { search },
    })
    return data
  },

  // ─── Salary History ───────────────────────────────────────────────────────
  getSalaryHistory: async (id) => {
    const { data } = await apiClient.get(API.EMPLOYEES.SALARY_HISTORY(id))
    return data
  },
}
