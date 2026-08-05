const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-14 — Super Admin Multi-Tenant Company Switching', () => {
  let adminToken;
  let empToken;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. SuperAdmin can list all active companies in multi-tenant system', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/company-switch/companies`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('companies');
    expect(Array.isArray(json.data.companies)).toBe(true);
    expect(json.data.companies.length).toBeGreaterThan(0);
  });

  test('2. SuperAdmin can switch active company context to any tenant', async ({ request }) => {
    const listRes = await request.get(`${API_BASE_URL}/admin/company-switch/companies`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listJson = await listRes.json();
    const targetComp = listJson.data.companies[0];

    const res = await request.post(`${API_BASE_URL}/admin/company-switch/switch/${targetComp.companyId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.switchedToCompanyId).toBe(targetComp.companyId);
  });

  test('3. Non-SuperAdmin employee cannot access company switching endpoints (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/company-switch/companies`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
