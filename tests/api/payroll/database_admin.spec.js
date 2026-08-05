const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-12 — Database Migration & Seeding Admin Console', () => {
  let adminToken;
  let empToken;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. SuperAdmin can view database migration status and statistics', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/database/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('canConnect');
    expect(json.data).toHaveProperty('statistics');
    expect(json.data).toHaveProperty('seededCompanies');
  });

  test('2. SuperAdmin can safely onboard/reseed baseline company tenant', async ({ request }) => {
    const payload = {
      companyName: 'Apex Innovations Private Limited',
      cin: 'U72200MH2026PTC888777',
      gstin: '27AAAAA0000A1Z5',
      city: 'Pune',
      state: 'Maharashtra',
      forceOverwrite: true,
    };

    const res = await request.post(`${API_BASE_URL}/admin/database/reseed-tenant`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.companyName).toBe('Apex Innovations Private Limited');
  });

  test('3. Non-SuperAdmin employee cannot access database admin console (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/database/status`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
