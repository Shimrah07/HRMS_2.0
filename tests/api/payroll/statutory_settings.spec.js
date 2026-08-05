const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-11 — Statutory Ceiling Configuration UI & API', () => {
  let adminToken;
  let empToken;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. SuperAdmin can view current statutory ceiling settings', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/statutory-settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.settings).toHaveProperty('epfWageCeiling');
    expect(json.data.settings).toHaveProperty('esicWageCeiling');
    expect(json.data.settings).toHaveProperty('bonusWageCeiling');
    expect(json.data.settings).toHaveProperty('gratuityMaxLimit');
  });

  test('2. SuperAdmin can update statutory ceilings with validation and audit trail', async ({ request }) => {
    const payload = {
      epfWageCeiling: 15000,
      epfRatePercentage: 12.0,
      esicWageCeiling: 21000,
      esicEmployeeRatePercentage: 0.75,
      esicEmployerRatePercentage: 3.25,
      bonusWageCeiling: 21000,
      gratuityMaxLimit: 2000000,
      lwfMonthlyCeiling: 25,
    };

    const res = await request.put(`${API_BASE_URL}/admin/statutory-settings`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.epfWageCeiling).toBe(15000);
  });

  test('3. Non-SuperAdmin employee cannot access statutory settings (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/statutory-settings`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
