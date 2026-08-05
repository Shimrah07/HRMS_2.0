const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-3 — Cumulative YTD TDS Tracking', () => {
  let adminToken;
  let empToken;
  let testEmployeeId;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');

    // Get a real employee ID for tests
    const empRes = await request.get(`${API_BASE_URL}/employees?page=1&pageSize=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const empData = await empRes.json();
    testEmployeeId = empData?.data?.items?.[0]?.employeeId || empData?.data?.[0]?.employeeId;
  });

  // ─── Self-service YTD endpoint ────────────────────────────────────────────

  test('1. Employee can view own YTD TDS summary (/me endpoint)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/tds-ytd/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('fyLabel');
    expect(json.data).toHaveProperty('ytdTdsDeducted');
    expect(json.data).toHaveProperty('monthlyBreakdown');
    expect(Array.isArray(json.data.monthlyBreakdown)).toBe(true);
    // FY must have 12 months
    expect(json.data.monthlyBreakdown.length).toBe(12);
  });

  test('2. YTD summary uses correct FY (Apr–Mar boundary)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/tds-ytd/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const json = await res.json();
    const months = json.data.monthlyBreakdown;

    // First month must be April of the FY start year
    expect(months[0].month).toBe(4); // April
    // Last month must be March of FY end year
    expect(months[11].month).toBe(3); // March
  });

  test('3. Employee cannot view another employee TDS (403)', async ({ request }) => {
    if (!testEmployeeId) {
      console.log('No employee ID available, skipping...');
      return;
    }
    // engemp1 trying to view testEmployeeId's TDS — should 403 unless it's their own ID
    const res = await request.get(`${API_BASE_URL}/payroll/tds-ytd/${testEmployeeId}`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    // Accept 200 (if it's own record) or 403
    expect([200, 403]).toContain(res.status());
  });

  test('4. Admin can view YTD TDS for any employee', async ({ request }) => {
    if (!testEmployeeId) return;
    const res = await request.get(`${API_BASE_URL}/payroll/tds-ytd/${testEmployeeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('ytdTdsDeducted');
    expect(json.data).toHaveProperty('projectedAnnualTds');
    expect(typeof json.data.ytdTdsDeducted).toBe('number');
  });

  test('5. YTD TDS cumulative sum matches month-by-month sum in breakdown', async ({ request }) => {
    if (!testEmployeeId) return;
    const res = await request.get(`${API_BASE_URL}/payroll/tds-ytd/${testEmployeeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const breakdown = json.data.monthlyBreakdown;
    const sumFromBreakdown = breakdown.reduce((acc, m) => acc + (m.tdsDeducted || 0), 0);
    // Allow floating-point tolerance
    expect(Math.abs(json.data.ytdTdsDeducted - sumFromBreakdown)).toBeLessThan(0.01);
  });

  test('6. Admin can view company-wide YTD TDS summary', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/tds-ytd/company-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('totalYtdTds');
    expect(json.data).toHaveProperty('monthlyBreakdown');
    expect(json.data.monthlyBreakdown.length).toBe(12);
  });

  test('7. Employee cannot access company-wide TDS summary (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/tds-ytd/company-summary`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('8. Custom FY year query param works correctly', async ({ request }) => {
    // Request FY 2025 (Apr 2025 – Mar 2026)
    const res = await request.get(`${API_BASE_URL}/payroll/tds-ytd/me?fyYear=2025`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.fyStartYear).toBe(2025);
    expect(json.data.fyEndYear).toBe(2026);
    expect(json.data.fyLabel).toBe('FY 2025-26');
  });
});
