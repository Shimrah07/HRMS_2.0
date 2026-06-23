import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const performanceService = {
  getCycles: async () => {
    const { data } = await apiClient.get(API.PERFORMANCE.CYCLES)
    return data
  },

  createCycle: async (payload) => {
    const { data } = await apiClient.post(API.PERFORMANCE.CYCLES, payload)
    return data
  },

  getGoals: async (params = {}) => {
    const { data } = await apiClient.get(API.PERFORMANCE.GOALS, { params })
    return data
  },

  createGoal: async (payload) => {
    const { data } = await apiClient.post(API.PERFORMANCE.GOALS, payload)
    return data
  },

  updateGoal: async (id, payload) => {
    const { data } = await apiClient.put(API.PERFORMANCE.GOAL_DETAIL(id), payload)
    return data
  },

  deleteGoal: async (id) => {
    const { data } = await apiClient.delete(API.PERFORMANCE.GOAL_DETAIL(id))
    return data
  },

  getReviews: async (params = {}) => {
    const { data } = await apiClient.get(API.PERFORMANCE.REVIEWS, { params })
    return data
  },

  submitReview: async (payload) => {
    const { data } = await apiClient.post(API.PERFORMANCE.REVIEWS, payload)
    return data
  },

  getPips: async (params = {}) => {
    const { data } = await apiClient.get(API.PERFORMANCE.PIPS, { params })
    return data
  },

  createPip: async (payload) => {
    const { data } = await apiClient.post(API.PERFORMANCE.PIPS, payload)
    return data
  },

  updatePip: async (id, payload) => {
    const { data } = await apiClient.put(API.PERFORMANCE.PIP_DETAIL(id), payload)
    return data
  },
}
export default performanceService
