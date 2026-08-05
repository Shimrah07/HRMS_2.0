export const API_BASE = ''

export const getAvatarUrl = (photoPath) => {
  if (!photoPath) return null
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
    return photoPath
  }
  const cleanPath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath
  return `/uploads/${cleanPath}`
}

export const API = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    REFRESH: `${API_BASE}/auth/refresh-token`,
    ME: `${API_BASE}/auth/me`,
    CHANGE_PASSWORD: `${API_BASE}/auth/change-password`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE}/auth/reset-password`,
  },

  // Dashboard
  DASHBOARD: {
    HR: `${API_BASE}/dashboard/hr`,
    MANAGER: `${API_BASE}/dashboard/manager`,
    EMPLOYEE: `${API_BASE}/dashboard/employee`,
    ATTENDANCE_TODAY: `${API_BASE}/dashboard/attendance-today`,
    RECRUITMENT: `${API_BASE}/dashboard/recruitment`,
  },

  // Employees
  EMPLOYEES: {
    LIST: `${API_BASE}/employees`,
    CREATE: `${API_BASE}/employees`,
    DETAIL: (id) => `${API_BASE}/employees/${id}`,
    UPDATE: (id) => `${API_BASE}/employees/${id}`,
    SUMMARY: (id) => `${API_BASE}/employees/${id}/summary`,
    PHOTO: (id) => `${API_BASE}/employees/${id}/photo`,
    STATUS: (id) => `${API_BASE}/employees/${id}/status`,
    CONFIRM: (id) => `${API_BASE}/employees/${id}/confirm`,
    DOCUMENTS: (id) => `${API_BASE}/employees/${id}/documents`,
    DOCUMENT_VERIFY: (id, docId) => `${API_BASE}/employees/${id}/documents/${docId}/verify`,
    DOCUMENT_DOWNLOAD: (id, docId) => `${API_BASE}/employees/${id}/documents/${docId}/download`,
    BANK_DETAILS: (id) => `${API_BASE}/employees/${id}/bank-details`,
    BANK_DETAIL: (id, bankId) => `${API_BASE}/employees/${id}/bank-details/${bankId}`,
    MY_PROFILE: `${API_BASE}/employees/my-profile`,
    ORG_CHART: `${API_BASE}/employees/org-chart`,
    DIRECTORY: `${API_BASE}/employees/directory`,
    SALARY_HISTORY: (id) => `${API_BASE}/employees/${id}/salary-history`,
    EDUCATIONS: (id) => `${API_BASE}/employees/${id}/educations`,
    EDUCATION_DETAIL: (id, eduId) => `${API_BASE}/employees/${id}/educations/${eduId}`,
    EXPERIENCES: (id) => `${API_BASE}/employees/${id}/experiences`,
    EXPERIENCE_DETAIL: (id, expId) => `${API_BASE}/employees/${id}/experiences/${expId}`,
    NOMINEES: (id) => `${API_BASE}/employees/${id}/nominees`,
    NOMINEE_DETAIL: (id, nomineeId) => `${API_BASE}/employees/${id}/nominees/${nomineeId}`,
  },

  // Organization
  ORG: {
    COMPANY: `${API_BASE}/organization/company`,
    COMPANY_LOGO: `${API_BASE}/organization/company/logo`,
    DEPARTMENTS: `${API_BASE}/organization/departments`,
    DEPARTMENT: (id) => `${API_BASE}/organization/departments/${id}`,
    DESIGNATIONS: `${API_BASE}/organization/designations`,
    DESIGNATION: (id) => `${API_BASE}/organization/designations/${id}`,
    LOCATIONS: `${API_BASE}/organization/locations`,
    LOCATION: (id) => `${API_BASE}/organization/locations/${id}`,
    COST_CENTERS: `${API_BASE}/organization/cost-centers`,
    SETTINGS: `${API_BASE}/organization/settings`,
    SETTING: (key) => `${API_BASE}/organization/settings/${key}`,
    AUDIT_LOGS: `${API_BASE}/organization/audit-logs`,
    BUSINESS_UNITS: `${API_BASE}/organization/business-units`,
    BUSINESS_UNIT: (id) => `${API_BASE}/organization/business-units/${id}`,
    DIVISIONS: `${API_BASE}/organization/divisions`,
    DIVISION: (id) => `${API_BASE}/organization/divisions/${id}`,
    SUB_DEPARTMENTS: `${API_BASE}/organization/sub-departments`,
    SUB_DEPARTMENT: (id) => `${API_BASE}/organization/sub-departments/${id}`,
    TEAMS: `${API_BASE}/organization/teams`,
    TEAM: (id) => `${API_BASE}/organization/teams/${id}`,
    GRADES: `${API_BASE}/organization/grades`,
    GRADE: (id) => `${API_BASE}/organization/grades/${id}`,
    BANDS: `${API_BASE}/organization/bands`,
    BAND: (id) => `${API_BASE}/organization/bands/${id}`,
    JOB_FAMILIES: `${API_BASE}/organization/job-families`,
    JOB_FAMILY: (id) => `${API_BASE}/organization/job-families/${id}`,
    JOB_FUNCTIONS: `${API_BASE}/organization/job-functions`,
    JOB_FUNCTION: (id) => `${API_BASE}/organization/job-functions/${id}`,
    PROFIT_CENTERS: `${API_BASE}/organization/profit-centers`,
    PROFIT_CENTER: (id) => `${API_BASE}/organization/profit-centers/${id}`,
  },

  // Shifts
  SHIFTS: {
    LIST: `${API_BASE}/shifts`,
    CREATE: `${API_BASE}/shifts`,
    UPDATE: (id) => `${API_BASE}/shifts/${id}`,
    DELETE: (id) => `${API_BASE}/shifts/${id}`,
  },

  // Users
  USERS: {
    LIST: `${API_BASE}/users`,
    CREATE: `${API_BASE}/users`,
    DETAIL: (id) => `${API_BASE}/users/${id}`,
    UPDATE: (id) => `${API_BASE}/users/${id}`,
    ASSIGN_ROLES: (id) => `${API_BASE}/users/${id}/roles`,
    TOGGLE_ACTIVE: (id) => `${API_BASE}/users/${id}/toggle-active`,
    TOGGLE_LOCK: (id) => `${API_BASE}/users/${id}/toggle-lock`,
    RESET_PASSWORD: (id) => `${API_BASE}/users/${id}/reset-password`,
  },

  // Roles & Permissions
  ROLES: {
    LIST: `${API_BASE}/roles`,
    PERMISSIONS: (id) => `${API_BASE}/roles/${id}/permissions`,
  },
  PERMISSIONS: {
    LIST: `${API_BASE}/permissions`,
    MATRIX: `${API_BASE}/permissions/matrix`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: `${API_BASE}/notifications`,
    UNREAD_COUNT: `${API_BASE}/notifications/unread-count`,
    MARK_READ: (id) => `${API_BASE}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE}/notifications/read-all`,
    DELETE: (id) => `${API_BASE}/notifications/${id}`,
  },

  // Attendance
  ATTENDANCE: {
    STATUS: `${API_BASE}/attendance/status`,
    PUNCH: `${API_BASE}/attendance/punch`,
    HISTORY: `${API_BASE}/attendance/history`,
    REGULARIZE: `${API_BASE}/attendance/regularize`,
    REGULARIZATIONS: `${API_BASE}/attendance/regularizations`,
    REGULARIZATIONS_QUEUE: `${API_BASE}/attendance/regularizations/queue`,
    REGULARIZATION_APPROVE: (id) => `${API_BASE}/attendance/regularizations/${id}/approve`,
    REGULARIZATION_REJECT: (id) => `${API_BASE}/attendance/regularizations/${id}/reject`,
    OVERTIME: `${API_BASE}/attendance/overtime`,
    MUSTER: `${API_BASE}/attendance/muster`,
    FREEZE: `${API_BASE}/attendance/freeze`,
    LOCK_STATUS: `${API_BASE}/attendance/lock-status`,
  },

  // Performance
  PERFORMANCE: {
    CYCLES: `${API_BASE}/performance/cycles`,
    GOALS: `${API_BASE}/performance/goals`,
    GOAL_DETAIL: (id) => `${API_BASE}/performance/goals/${id}`,
    REVIEWS: `${API_BASE}/performance/reviews`,
    PIPS: `${API_BASE}/performance/pips`,
    PIP_DETAIL: (id) => `${API_BASE}/performance/pips/${id}`,
  },
  RECRUITMENT: {
    REQUISITIONS: `${API_BASE}/job-requisitions`,
    REQUISITION: (id) => `${API_BASE}/job-requisitions/${id}`,
    REQUISITION_SUBMIT: (id) => `${API_BASE}/job-requisitions/${id}/submit`,
    REQUISITION_APPROVE: (id) => `${API_BASE}/job-requisitions/${id}/approve`,
    REQUISITION_INTERNAL_CHECK: (id) => `${API_BASE}/job-requisitions/${id}/internal-check`,
    POSTINGS: `${API_BASE}/job-postings`,
    POSTING_ADMIN: `${API_BASE}/job-postings/admin`,
    POSTING: (id) => `${API_BASE}/job-postings/${id}`,
    POSTING_PUBLISH: (id) => `${API_BASE}/job-postings/${id}/publish`,
    POSTING_CLOSE: (id) => `${API_BASE}/job-postings/${id}/close`,
  },
  CANDIDATES: {
    LIST: `${API_BASE}/candidates`,
    DETAIL: (id) => `${API_BASE}/candidates/${id}`,
    RESUME: (id) => `${API_BASE}/candidates/${id}/resume`,
    IMPORT: `${API_BASE}/candidates/import`,
  },
  APPLICATIONS: {
    LIST: `${API_BASE}/job-applications`,
    DETAIL: (id) => `${API_BASE}/job-applications/${id}`,
    CREATE: `${API_BASE}/job-applications`,
    STAGE: (id) => `${API_BASE}/job-applications/${id}/stage`,
  },
  INTERVIEWS: {
    LIST: `${API_BASE}/interviews`,
    SCHEDULE: `${API_BASE}/interviews`,
    FEEDBACK: `${API_BASE}/interviews/feedback`,
  },
  OFFERS: {
    LIST: `${API_BASE}/offers`,
    DETAIL: (id) => `${API_BASE}/offers/${id}`,
    CREATE: `${API_BASE}/offers`,
    APPROVE: (id) => `${API_BASE}/offers/${id}/approve`,
    DOWNLOAD: (id) => `${API_BASE}/offers/${id}/download`,
    ACCEPT: (id) => `${API_BASE}/offers/${id}/accept`,
  },
  BGV: {
    LIST: `${API_BASE}/bgv`,
    INITIATE: `${API_BASE}/bgv`,
    CHECK: (id) => `${API_BASE}/bgv/${id}/check`,
  },
  ONBOARDING: {
    LIST: `${API_BASE}/onboarding`,
    DETAIL: (id) => `${API_BASE}/onboarding/${id}`,
    CHECKLIST: (id) => `${API_BASE}/onboarding/${id}/checklist`,
    ASSIGN: (id) => `${API_BASE}/onboarding/${id}/assign`,
    CONVERT: (id) => `${API_BASE}/onboarding/${id}/convert`,
    TASKS: (id) => `${API_BASE}/onboarding/${id}/tasks`,
    UPDATE_TASK: (taskId) => `${API_BASE}/onboarding/tasks/${taskId}`,
    DASHBOARD_SUMMARY: `${API_BASE}/dashboard/onboarding/summary`,
  },
  PROBATION: {
    LIST: `${API_BASE}/probation`,
    REVIEWS: (employeeId) => `${API_BASE}/probation/${employeeId}/reviews`,
    SUBMIT_REVIEW: (reviewId) => `${API_BASE}/probation/reviews/${reviewId}`,
    CONFIRM: (employeeId) => `${API_BASE}/probation/${employeeId}/confirm`,
  }
}
