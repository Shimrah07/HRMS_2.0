const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken, getSeedIds } = require('../fixtures/testHelpers');

test.describe('M1 — Create Employee Spec', () => {
  let token;
  let seedIds;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    seedIds = getSeedIds();
  });

  test('1. Create employee with valid payload', async ({ request }) => {
    const headers = { Authorization: `Bearer ${token}` };
    const rand = Math.floor(1000 + Math.random() * 9000);
    const email = `AUTOTEST_emp_${rand}@company.com`;
    const phone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
    const validPan = `ABCDE${rand}F`;
    const validAadhaar = `99${rand}123456`;

    const payload = {
      employeeCode: `AUTOTEST_EMP_${rand}`,
      firstName: 'AutoTest',
      lastName: 'Employee',
      officialEmail: email,
      personalPhone: phone,
      joiningDate: '2026-01-15',
      dateOfBirth: '1992-05-10',
      gender: 1, // Male
      panNumber: validPan,
      aadharNumber: validAadhaar,
      uanNumber: `10099${rand}123`,
      deptId: seedIds.departments.engineering,
      designationId: seedIds.designationId,
      locationId: seedIds.locationId,
      gradeId: seedIds.gradeId,
      costCenterId: seedIds.costCenterId,
      shiftId: seedIds.shifts.dayShiftId,
      payrollGroup: 0,
      employmentType: 1, // FullTime
      noticePeriodDays: 30,
    };

    const res = await request.post(`${API_BASE_URL}/employees`, { headers, data: payload });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);

    const empId = json.data?.employeeId || json.data?.id;
    console.log('Created empId:', empId, 'Data:', JSON.stringify(json.data));

    // Verify GET returns matching data
    const getRes = await request.get(`${API_BASE_URL}/employees/${empId}`, { headers });
    if (!getRes.ok()) {
      console.log('GET /employees/{id} failed:', getRes.status(), await getRes.text());
    }
    expect(getRes.ok()).toBeTruthy();
    const getJson = await getRes.json();
    expect(getJson.data.officialEmail).toBe(email);
  });

  test('2. Attempt creation with missing mandatory fields', async ({ request }) => {
    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      firstName: 'Invalid',
      lastName: 'User',
    };

    const res = await request.post(`${API_BASE_URL}/employees`, { headers, data: payload });
    expect(res.status()).toBe(400);
  });

  test('3. Attempt creation with duplicate official email', async ({ request }) => {
    const headers = { Authorization: `Bearer ${token}` };
    const duplicateEmail = 'superadmin@company.com';

    const payload = {
      employeeCode: 'DUP_EMAIL_TEST',
      firstName: 'Duplicate',
      lastName: 'Email',
      officialEmail: duplicateEmail,
      deptId: seedIds.departments.engineering,
      designationId: seedIds.designationId,
      locationId: seedIds.locationId,
      shiftId: seedIds.shifts.dayShiftId,
      costCenterId: seedIds.costCenterId,
      gradeId: seedIds.gradeId,
      payrollGroup: 0,
      employmentType: 1,
    };

    const res = await request.post(`${API_BASE_URL}/employees`, { headers, data: payload });
    expect(res.status()).toBe(400);
  });
});
