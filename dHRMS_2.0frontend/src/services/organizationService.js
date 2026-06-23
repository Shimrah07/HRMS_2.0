import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const organizationService = {
  // Company
  getCompany: async () => {
    const { data } = await apiClient.get(API.ORG.COMPANY)
    return data
  },

  updateCompany: async (payload) => {
    const { data } = await apiClient.put(API.ORG.COMPANY, payload)
    return data
  },

  // Departments
  getDepartments: async () => {
    const { data } = await apiClient.get(API.ORG.DEPARTMENTS)
    return data
  },

  createDepartment: async (payload) => {
    const { data } = await apiClient.post(API.ORG.DEPARTMENTS, payload)
    return data
  },

  updateDepartment: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.DEPARTMENT(id), payload)
    return data
  },

  deleteDepartment: async (id) => {
    const { data } = await apiClient.delete(API.ORG.DEPARTMENT(id))
    return data
  },

  // Designations
  getDesignations: async () => {
    const { data } = await apiClient.get(API.ORG.DESIGNATIONS)
    return data
  },

  createDesignation: async (payload) => {
    const { data } = await apiClient.post(API.ORG.DESIGNATIONS, payload)
    return data
  },

  updateDesignation: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.DESIGNATION(id), payload)
    return data
  },

  // Locations
  getLocations: async () => {
    const { data } = await apiClient.get(API.ORG.LOCATIONS)
    return data
  },

  createLocation: async (payload) => {
    const { data } = await apiClient.post(API.ORG.LOCATIONS, payload)
    return data
  },

  updateLocation: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.LOCATION(id), payload)
    return data
  },

  // Cost Centers
  getCostCenters: async () => {
    const { data } = await apiClient.get(API.ORG.COST_CENTERS)
    return data
  },

  createCostCenter: async (payload) => {
    const { data } = await apiClient.post(API.ORG.COST_CENTERS, payload)
    return data
  },

  // Settings
  getSettings: async () => {
    const { data } = await apiClient.get(API.ORG.SETTINGS)
    return data
  },

  updateSetting: async (key, settingValue) => {
    const { data } = await apiClient.put(API.ORG.SETTING(key), { settingValue })
    return data
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const { data } = await apiClient.get(API.ORG.AUDIT_LOGS, { params })
    return data
  },
}
