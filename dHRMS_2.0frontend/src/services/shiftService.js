import apiClient from '../lib/axios'
import { API } from '../constants/api'

export const shiftService = {
  getShifts: async () => {
    const { data } = await apiClient.get(API.SHIFTS.LIST)
    return data
  },
  createShift: async (payload) => {
    const { data } = await apiClient.post(API.SHIFTS.CREATE, payload)
    return data
  },
  updateShift: async (id, payload) => {
    const { data } = await apiClient.put(API.SHIFTS.UPDATE(id), payload)
    return data
  },
  deleteShift: async (id) => {
    const { data } = await apiClient.delete(API.SHIFTS.DELETE(id))
    return data
  }
}
