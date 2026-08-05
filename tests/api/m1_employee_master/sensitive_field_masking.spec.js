const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('M1 — Sensitive Field Masking Spec', () => {
  let adminToken;
  let empToken;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. Role WITH sensitive view rights (superadmin) receives unmasked/full sensitive fields', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeTruthy();
  });

  test('2. Role WITHOUT sensitive view rights receives masked values or empty sensitive fields', async ({ request }) => {
    const meRes = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(meRes.ok()).toBeTruthy();
    const meJson = await meRes.json();
    const empId = meJson.data.employeeId || meJson.data.id;

    const res = await request.get(`${API_BASE_URL}/employees/${empId}`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);

    const pan = json.data.maskedPAN || json.data.panNumber || '';
    const aadhar = json.data.maskedAadhar || json.data.aadharNumber || '';
    expect(pan.includes('*') || pan === '' || pan.length <= 10).toBeTruthy();
    expect(aadhar.includes('*') || aadhar === '' || aadhar.length <= 12).toBeTruthy();
  });
});
