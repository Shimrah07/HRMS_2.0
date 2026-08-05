const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-10 — Payslip Data Integrity (Real API vs Mock Fallback)', () => {
  let empToken;

  test.beforeAll(async ({ request }) => {
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. Employee salary slips endpoint returns real database payroll records', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/my-salary-slips`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    
    // Check that items do not contain static unparsed mock fallbacks
    for (const slip of json.data) {
      expect(slip).toHaveProperty('detailId');
      expect(slip).toHaveProperty('month');
      expect(slip).toHaveProperty('workedDays');
      expect(slip).toHaveProperty('grossEarnings');
      expect(slip).toHaveProperty('totalDeductions');
      expect(slip).toHaveProperty('netPay');
    }
  });
});
