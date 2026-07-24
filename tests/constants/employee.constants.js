/**
 * Employee Master Test Constants
 */

export const CREDENTIALS = {
  HR_ADMIN: {
    email: process.env.TEST_HR_ADMIN_EMAIL || 'hradmin@company.com',
    password: process.env.TEST_HR_ADMIN_PASSWORD || 'Demo@123',
    role: 'HR Admin'
  },
  SUPER_ADMIN: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL || 'superadmin@company.com',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'Demo@123',
    role: 'Super Admin'
  }
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  EMPLOYEE_LIST: '/employees',
  EMPLOYEE_DIRECTORY: '/employees/directory',
  CREATE_EMPLOYEE: '/employees/new',
  RECRUITMENT_HUB: '/recruitment',
  CANDIDATES: '/recruitment/candidates',
  ONBOARDING: '/recruitment/onboarding',
  PROBATION: '/recruitment/probation'
};

export const MOCK_EMPLOYEE_DATA = {
  VALID_NEW: {
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav.sharma.test@company.com',
    personalEmail: 'aarav.personal@test.com',
    phone: '9876543210',
    gender: 'Male',
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    employmentType: 'FullTime',
    joiningDate: '2026-08-01'
  },
  INVALID_EMAIL: {
    firstName: 'Invalid',
    lastName: 'Email',
    email: 'invalid-email-format',
    phone: '9876543210'
  },
  XSS_PAYLOAD: {
    firstName: '<script>alert("xss")</script>',
    lastName: 'TestUser',
    email: 'xss.test@company.com'
  }
};

export const SELECTORS = {
  TABLE_ROW: '.ant-table-row',
  DIRECTORY_CARD: '.ant-col div[style*="cursor"]',
  DRAWER_OPEN: '.ant-drawer-open',
  DRAWER_CLOSE_BTN: '.ant-drawer-open button:has(.anticon-close)',
  SEARCH_INPUT: 'input[placeholder*="Search"]',
  STATUS_BADGE: '.ant-tag',
  SUBMIT_BTN: 'button[type="submit"], button:has-text("Create Employee")',
  CONTINUE_BTN: 'button:has-text("Continue")'
};
