const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-9 — Compliance Status & Statutory Filing Tracker', () => {
  let adminToken;
  let empToken;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. Compliance Officer / Admin can view live statutory filing status', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/compliance/status?year=2026&month=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('summary');
    expect(json.data).toHaveProperty('filings');
    expect(Array.isArray(json.data.filings)).toBe(true);
  });

  test('2. Admin can record statutory return filing with challan reference', async ({ request }) => {
    const payload = {
      statutoryType: 'EPF (Employees Provident Fund)',
      totalLiability: 125000,
      challanRefNo: 'CHLN-EPF-2026-9912',
    };

    const res = await request.post(`${API_BASE_URL}/payroll/compliance/file-return`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.filingStatus).toBe('Filed');
    expect(json.data.challanRefNo).toBe('CHLN-EPF-2026-9912');
  });

  test('3. Non-compliance employee cannot access filing status (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/compliance/status`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
