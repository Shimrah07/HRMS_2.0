// API base URL (proxied through Vite to http://localhost:5110)
export const API_BASE = ''

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
}
