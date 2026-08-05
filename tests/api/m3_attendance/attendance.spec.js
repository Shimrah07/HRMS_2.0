const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken, getSeedIds } = require('../fixtures/testHelpers');

test.describe('M3 — Attendance & Punch Processing Test Suite', () => {
  let adminToken;
  let seedIds;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    seedIds = getSeedIds();
  });

  test('1. Punch Ingestion & Multi-Punch Retention', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const rand = Math.floor(1000 + Math.random() * 9000);

    // Create employee for punch testing
    const createRes = await request.post(`${API_BASE_URL}/employees`, {
      headers,
      data: {
        employeeCode: `PUNCH_${rand}`,
        firstName: 'Punch',
        lastName: 'Tester',
        officialEmail: `punch_${rand}@company.com`,
        personalPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        panNumber: `ABCDE${rand}P`,
        aadharNumber: `99${rand}554433`,
        joiningDate: '2026-01-01',
        deptId: seedIds.departments.engineering,
        designationId: seedIds.designationId,
        locationId: seedIds.locationId,
        gradeId: seedIds.gradeId,
        costCenterId: seedIds.costCenterId,
        shiftId: seedIds.shifts.dayShiftId,
        payrollGroup: 0,
        employmentType: 1,
      },
    });

    expect(createRes.ok()).toBeTruthy();
    const empId = (await createRes.json()).data.employeeId;

    // Punch 1
    const punch1 = await request.post(`${API_BASE_URL}/attendance/punch`, {
      headers,
      data: {
        employeeId: empId,
        punchTime: `${new Date().toISOString().split('T')[0]}T09:00:00Z`,
        punchType: 'In',
        deviceId: 'DEV001',
      },
    });
    expect(punch1.ok()).toBeTruthy();

    // Punch 2 (Simulated second scan)
    const punch2 = await request.post(`${API_BASE_URL}/attendance/punch`, {
      headers,
      data: {
        employeeId: empId,
        punchTime: `${new Date().toISOString().split('T')[0]}T09:05:00Z`,
        punchType: 'In',
        deviceId: 'DEV001',
      },
    });
    expect(punch2.ok()).toBeTruthy();
  });

  test('2. Punch Freeze Date Range Rejection', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Freeze Month 1 Year 2026
    const freezeRes = await request.post(`${API_BASE_URL}/attendance/freeze`, {
      headers,
      data: {
        month: 1,
        year: 2026,
      },
    });
    expect(freezeRes.ok()).toBeTruthy();

    // Attempt regularization inside frozen period
    const regRes = await request.post(`${API_BASE_URL}/attendance/regularization`, {
      headers,
      data: {
        attendanceDate: '2026-01-05',
        reason: 'Mis-punch regularization request inside frozen window',
      },
    });

    // Rejection expected (400 or 409 or success: false)
    if (regRes.ok()) {
      const json = await regRes.json();
      expect(json.success).toBe(false);
    } else {
      expect(regRes.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('3. Statutory Muster Roll Report Endpoint', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const res = await request.get(`${API_BASE_URL}/attendance/muster?month=1&year=2026`, { headers });
    expect(res.ok()).toBeTruthy();
  });
});
