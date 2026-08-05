const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-13 — Hangfire Dashboard & Background Jobs Administration', () => {
  let adminToken;
  let empToken;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. SuperAdmin can view background recurring jobs schedule and status', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/hangfire/jobs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('dashboardUrl');
    expect(json.data).toHaveProperty('jobs');
    expect(Array.isArray(json.data.jobs)).toBe(true);
  });

  test('2. SuperAdmin can trigger a background job on demand', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/admin/hangfire/trigger-job/el-accrual-monthly`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.jobKey).toBe('el-accrual-monthly');
  });

  test('3. Non-SuperAdmin employee cannot access background job console (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/hangfire/jobs`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
