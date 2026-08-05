const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-4 — Tax Declaration Admin Approval Workflow', () => {
  let adminToken;
  let empToken;
  let createdDeclId;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. Employee can submit a tax declaration', async ({ request }) => {
    const payload = {
      financialYear: '2025-26',
      taxRegime: 'Old',
      hraClaimed: 120000,
      section80C: 150000,
      section80D: 25000,
      houseLoanInterest: 0,
      otherDeductions: 10000,
    };

    const res = await request.post(`${API_BASE_URL}/payroll/tax-declarations`, {
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('Pending');
    createdDeclId = json.data.declarationId || json.data.DeclarationId;
  });

  test('2. Submission exceeding statutory 80C limit (1.5L) is rejected with 400 Bad Request', async ({ request }) => {
    const payload = {
      financialYear: '2025-26',
      taxRegime: 'Old',
      section80C: 200000, // Exceeds 1.5L
    };

    const res = await request.post(`${API_BASE_URL}/payroll/tax-declarations`, {
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.status()).toBe(400);
  });

  test('3. Employee can view submitted declarations (/me)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/tax-declarations/me?financialYear=2025-26`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  test('4. Admin can list pending tax declarations for verification queue', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/tax-declarations/pending?financialYear=2025-26`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('5. Non-admin employee cannot access pending queue (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/tax-declarations/pending?financialYear=2025-26`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('6. Admin can approve an employee tax declaration', async ({ request }) => {
    if (!createdDeclId) return;

    const res = await request.put(`${API_BASE_URL}/payroll/tax-declarations/${createdDeclId}/approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('Approved');
  });

  test('7. Admin can reject a tax declaration with remarks', async ({ request }) => {
    if (!createdDeclId) return;

    const res = await request.put(`${API_BASE_URL}/payroll/tax-declarations/${createdDeclId}/reject`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: { remarks: 'Invalid Form 16 / missing rent receipts' },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('Rejected');
  });
});
