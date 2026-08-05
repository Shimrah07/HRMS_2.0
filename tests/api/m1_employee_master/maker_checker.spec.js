const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken, getSeedIds } = require('../fixtures/testHelpers');

test.describe('M1 — Maker-Checker Spec', () => {
  let adminToken;
  let empToken;
  let seedIds;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
    seedIds = getSeedIds();
  });

  test('1. Non-HR admin sensitive edit triggers 202 Accepted and creates pending change request', async ({ request }) => {
    // Get logged-in employee profile ID from /auth/me
    const meRes = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(meRes.ok()).toBeTruthy();
    const meJson = await meRes.json();
    const targetEmpId = meJson.data.employeeId || meJson.data.id;

    // Get current employee details to keep org fields unchanged
    const empGet = await request.get(`${API_BASE_URL}/employees/${targetEmpId}`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(empGet.ok()).toBeTruthy();
    const empData = (await empGet.json()).data;

    const rand = Math.floor(1000 + Math.random() * 9000);
    const newUan = `10099${rand}999`;

    const payload = {
      ...empData,
      uanNumber: newUan,
      gender: 1, // Convert string "Male" to enum integer if needed
      employmentType: 1, // FullTime enum integer
      payrollGroup: 0, // Default enum integer
      reportingManagerId: null,
    };

    const res = await request.put(`${API_BASE_URL}/employees/${targetEmpId}`, {
      headers: { Authorization: `Bearer ${empToken}` },
      data: payload,
    });

    if (res.status() !== 202) {
      console.log('PUT /employees status:', res.status(), await res.text());
    }

    expect(res.status()).toBe(202);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.pendingFields).toContain('UANNumber');

    // Fetch pending changes queue as admin to find the created changeId
    const pendingRes = await request.get(`${API_BASE_URL}/employees/changes/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(pendingRes.ok()).toBeTruthy();
    const pendingJson = await pendingRes.json();
    const pendingItem = pendingJson.data?.find(p => p.employeeId === targetEmpId && p.fieldName === 'UANNumber' && p.newValue === newUan);
    expect(pendingItem).toBeTruthy();

    // 2. HR Admin approves pending change
    const approveRes = await request.post(`${API_BASE_URL}/employees/changes/${pendingItem.changeId}/approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(approveRes.ok()).toBeTruthy();

    // Verify employee record now reflects updated UAN number
    const verifyRes = await request.get(`${API_BASE_URL}/employees/${targetEmpId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(verifyRes.ok()).toBeTruthy();
    const verifyJson = await verifyRes.json();
    expect(verifyJson.data.uanNumber).toBe(newUan);
  });
});
