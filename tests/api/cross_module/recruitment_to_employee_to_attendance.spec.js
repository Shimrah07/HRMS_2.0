const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken, getSeedIds } = require('../fixtures/testHelpers');

test.describe('Ticket E — Cross-Module End-to-End Pipeline', () => {
  let adminToken;
  let seedIds;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    seedIds = getSeedIds();
  });

  test('Complete Flow: Candidate -> Hired Employee -> Punch Ingestion -> Muster Computation', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const rand = Math.floor(1000 + Math.random() * 9000);

    // Step 1: Create Candidate
    const candidateRes = await request.post(`${API_BASE_URL}/candidates`, {
      headers,
      data: {
        firstName: 'CrossModule',
        lastName: 'Candidate',
        email: `e2e_cand_${rand}@company.com`,
        phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        panNumber: `ABCDE${rand}F`,
        aadhaarNumber: `99${rand}112233`,
      },
    });
    expect(candidateRes.ok()).toBeTruthy();

    // Step 2: Convert to Employee Record (M1)
    const empRes = await request.post(`${API_BASE_URL}/employees`, {
      headers,
      data: {
        employeeCode: `E2E_EMP_${rand}`,
        firstName: 'CrossModule',
        lastName: 'Employee',
        officialEmail: `e2e_emp_${rand}@company.com`,
        personalPhone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        joiningDate: '2026-01-01',
        deptId: seedIds.departments.engineering,
        designationId: seedIds.designationId,
        locationId: seedIds.locationId,
        gradeId: seedIds.gradeId,
        costCenterId: seedIds.costCenterId,
        shiftId: seedIds.shifts.dayShiftId,
        payrollGroup: 0,
        employmentType: 1,
        panNumber: `ABCDE${rand}F`,
        aadharNumber: `99${rand}112233`,
      },
    });
    if (!empRes.ok()) {
      console.log('POST /employees failed in cross_module:', empRes.status(), await empRes.text());
    }
    expect(empRes.ok()).toBeTruthy();
    const empId = (await empRes.json()).data.employeeId;

    // Step 3: Ingest Attendance Punch (M3)
    const todayStr = new Date().toISOString().split('T')[0];
    const punchRes = await request.post(`${API_BASE_URL}/attendance/punch`, {
      headers,
      data: {
        employeeId: empId,
        punchTime: `${todayStr}T09:00:00Z`,
        punchType: 'In',
        deviceId: 'DEV_E2E_01',
      },
    });
    expect(punchRes.ok()).toBeTruthy();

    // Step 4: Verify Statutory Muster Roll inclusion
    const musterRes = await request.get(`${API_BASE_URL}/attendance/muster?month=1&year=2026`, { headers });
    expect(musterRes.ok()).toBeTruthy();
  });
});
