import api from "../lib/axios"

export const payrollService = {
  // Employee self-service payslips
  getMySalarySlips: async () => (await api.get("/payroll/my-salary-slips")).data,
  downloadMyPayslipPdf: async (year, month) => {
    const r = await api.get(`/payroll/my-salary-slips/${year}/${month}/pdf`, { responseType: "blob" })
    _downloadBlob(r.data, "application/pdf", `Payslip_${month}_${year}.pdf`)
  },
  downloadPayslipPdfById: async (id) => {
    const r = await api.get(`/payroll/salary-slips/${id}/pdf`, { responseType: "blob" })
    _downloadBlob(r.data, "application/pdf", `Payslip_${id}.pdf`)
  },

  // Payroll Runs (state machine)
  getRuns: async (params) => (await api.get("/payroll/runs", { params })).data,
  initiateRun: async (data) => (await api.post("/payroll/runs", data)).data,
  lockInputs: async (runId) => (await api.post(`/payroll/runs/${runId}/lock-inputs`)).data,
  calculate: async (runId) => (await api.post(`/payroll/runs/${runId}/calculate`)).data,
  submitForReview: async (runId) => (await api.post(`/payroll/runs/${runId}/submit-review`)).data,
  approve: async (runId) => (await api.post(`/payroll/runs/${runId}/approve`)).data,
  lock: async (runId) => (await api.post(`/payroll/runs/${runId}/lock`)).data,
  close: async (runId) => (await api.post(`/payroll/runs/${runId}/close`)).data,
  getVarianceReport: async (runId) => (await api.get(`/payroll/runs/${runId}/variance`)).data,
  getRunDetails: async (runId) => (await api.get(`/payroll/runs/${runId}/details`)).data,
  getAuditTrail: async (runId) => (await api.get(`/payroll/runs/${runId}/audit`)).data,

  // Variable pay inputs
  submitVariableInput: async (data) => (await api.post("/payroll/variable-inputs", data)).data,
  getVariableInputs: async (params) => (await api.get("/payroll/variable-inputs", { params })).data,

  // Statutory deductions
  getStatutoryConfig: async () => (await api.get("/statutory/config")).data,
  updateStatutoryConfig: async (data) => (await api.put("/statutory/config", data)).data,
  getPTSlabs: async (state = "MH") => (await api.get("/statutory/pt-slabs", { params: { state } })).data,
  savePTSlabs: async (slabs, state = "MH") => (await api.post("/statutory/pt-slabs", slabs, { params: { state } })).data,
  getPFECR: async (month, year) => (await api.get("/statutory/pf-ecr", { params: { month, year } })).data,
  getESIReturn: async (month, year) => (await api.get("/statutory/esi-return", { params: { month, year } })).data,
  getComplianceCalendar: async () => (await api.get("/statutory/compliance-calendar")).data,

  // Tax / Investment Declaration
  getMyDeclarations: async () => (await api.get("/payroll/tax-declarations/me")).data,
  submitDeclaration: async (data) => (await api.post("/payroll/tax-declarations", data)).data,
  getTDSProjection: async (empId, fy) => (await api.get(`/documents/tds-projection/${empId}`, { params: { fy } })).data,
  getForm16: async (empId, fy) => (await api.get(`/documents/form16/${empId}`, { params: { fy } })).data,

  // Disbursement
  getDisbursementSummary: async (runId) => (await api.get(`/payroll/disbursement/summary/${runId}`)).data,
  generateBankFile: async (runId, bankFormat = "HDFC") => {
    const r = await api.post(`/payroll/disbursement/${runId}/generate-batch-file`, null, {
      params: { bankFormat }, responseType: "blob"
    })
    _downloadBlob(r.data, "text/csv", `BankFile_${bankFormat}.csv`)
  },

  // Documents
  getSalaryCertificate: async (data) => (await api.post("/documents/salary-certificate", data)).data,
  getGLExport: async (month, year) => (await api.get("/documents/gl-export", { params: { month, year } })).data,
}

function _downloadBlob(data, mimeType, filename) {
  const url = window.URL.createObjectURL(new Blob([data], { type: mimeType }))
  const a = document.createElement("a")
  a.href = url
  a.setAttribute("download", filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
