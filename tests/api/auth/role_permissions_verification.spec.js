const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('Role Access & Permission Matrix Verification', () => {
  const rolesToTest = [
    { email: 'superadmin@company.com', role: 'Super Admin', checkEndpoint: '/employees' },
    { email: 'hradmin@company.com', role: 'HR Admin', checkEndpoint: '/employees' },
    { email: 'enghod@company.com', role: 'Department Manager', checkEndpoint: '/attendance/team' },
    { email: 'financehead@company.com', role: 'Finance Head', checkEndpoint: '/attendance/team' },
    { email: 'engemp1@company.com', role: 'Employee', checkEndpoint: '/attendance/history' },
  ];

  for (const item of rolesToTest) {
    test(`Role Verification: ${item.role} (${item.email})`, async ({ request }) => {
      const token = await getAuthToken(request, item.email, 'Password123!');
      expect(token).toBeTruthy();
      const headers = { Authorization: `Bearer ${token}` };

      const res = await request.get(`${API_BASE_URL}${item.checkEndpoint}`, { headers });
      if (!res.ok()) {
        console.log(`Failed for ${item.role} (${item.email}) on ${item.checkEndpoint}: ${res.status()} ${await res.text()}`);
      }
      expect(res.ok()).toBe(true);
    });
  }
});
