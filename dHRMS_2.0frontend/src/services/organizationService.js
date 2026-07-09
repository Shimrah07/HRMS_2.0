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

  // Business Units
  getBusinessUnits: async () => {
    const { data } = await apiClient.get(API.ORG.BUSINESS_UNITS)
    return data
  },

  createBusinessUnit: async (payload) => {
    const { data } = await apiClient.post(API.ORG.BUSINESS_UNITS, payload)
    return data
  },

  updateBusinessUnit: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.BUSINESS_UNIT(id), payload)
    return data
  },

  deleteBusinessUnit: async (id) => {
    const { data } = await apiClient.delete(API.ORG.BUSINESS_UNIT(id))
    return data
  },

  // Divisions
  getDivisions: async (businessUnitId = null) => {
    const params = businessUnitId ? { businessUnitId } : {}
    const { data } = await apiClient.get(API.ORG.DIVISIONS, { params })
    return data
  },

  createDivision: async (payload) => {
    const { data } = await apiClient.post(API.ORG.DIVISIONS, payload)
    return data
  },

  updateDivision: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.DIVISION(id), payload)
    return data
  },

  deleteDivision: async (id) => {
    const { data } = await apiClient.delete(API.ORG.DIVISION(id))
    return data
  },

  // Sub-Departments
  getSubDepartments: async (deptId = null) => {
    const params = deptId ? { deptId } : {}
    const { data } = await apiClient.get(API.ORG.SUB_DEPARTMENTS, { params })
    return data
  },

  createSubDepartment: async (payload) => {
    const { data } = await apiClient.post(API.ORG.SUB_DEPARTMENTS, payload)
    return data
  },

  updateSubDepartment: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.SUB_DEPARTMENT(id), payload)
    return data
  },

  deleteSubDepartment: async (id) => {
    const { data } = await apiClient.delete(API.ORG.SUB_DEPARTMENT(id))
    return data
  },

  // Teams
  getTeams: async (subDeptId = null) => {
    const params = subDeptId ? { subDeptId } : {}
    const { data } = await apiClient.get(API.ORG.TEAMS, { params })
    return data
  },

  createTeam: async (payload) => {
    const { data } = await apiClient.post(API.ORG.TEAMS, payload)
    return data
  },

  updateTeam: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.TEAM(id), payload)
    return data
  },

  deleteTeam: async (id) => {
    const { data } = await apiClient.delete(API.ORG.TEAM(id))
    return data
  },

  // Grades
  getGrades: async () => {
    const { data } = await apiClient.get(API.ORG.GRADES)
    return data
  },

  createGrade: async (payload) => {
    const { data } = await apiClient.post(API.ORG.GRADES, payload)
    return data
  },

  updateGrade: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.GRADE(id), payload)
    return data
  },

  deleteGrade: async (id) => {
    const { data } = await apiClient.delete(API.ORG.GRADE(id))
    return data
  },

  // Bands
  getBands: async () => {
    const { data } = await apiClient.get(API.ORG.BANDS)
    return data
  },

  createBand: async (payload) => {
    const { data } = await apiClient.post(API.ORG.BANDS, payload)
    return data
  },

  updateBand: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.BAND(id), payload)
    return data
  },

  deleteBand: async (id) => {
    const { data } = await apiClient.delete(API.ORG.BAND(id))
    return data
  },

  // Job Families
  getJobFamilies: async () => {
    const { data } = await apiClient.get(API.ORG.JOB_FAMILIES)
    return data
  },

  createJobFamily: async (payload) => {
    const { data } = await apiClient.post(API.ORG.JOB_FAMILIES, payload)
    return data
  },

  updateJobFamily: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.JOB_FAMILY(id), payload)
    return data
  },

  deleteJobFamily: async (id) => {
    const { data } = await apiClient.delete(API.ORG.JOB_FAMILY(id))
    return data
  },

  // Job Functions
  getJobFunctions: async (jobFamilyId = null) => {
    const params = jobFamilyId ? { jobFamilyId } : {}
    const { data } = await apiClient.get(API.ORG.JOB_FUNCTIONS, { params })
    return data
  },

  createJobFunction: async (payload) => {
    const { data } = await apiClient.post(API.ORG.JOB_FUNCTIONS, payload)
    return data
  },

  updateJobFunction: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.JOB_FUNCTION(id), payload)
    return data
  },

  deleteJobFunction: async (id) => {
    const { data } = await apiClient.delete(API.ORG.JOB_FUNCTION(id))
    return data
  },

  // Profit Centers
  getProfitCenters: async () => {
    const { data } = await apiClient.get(API.ORG.PROFIT_CENTERS)
    return data
  },

  createProfitCenter: async (payload) => {
    const { data } = await apiClient.post(API.ORG.PROFIT_CENTERS, payload)
    return data
  },

  updateProfitCenter: async (id, payload) => {
    const { data } = await apiClient.put(API.ORG.PROFIT_CENTER(id), payload)
    return data
  },

  deleteProfitCenter: async (id) => {
    const { data } = await apiClient.delete(API.ORG.PROFIT_CENTER(id))
    return data
  },

  // Shifts
  getShifts: async () => {
    const { data } = await apiClient.get(API.ORG.SHIFTS)
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
