const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken, getSeedIds } = require('../fixtures/testHelpers');

test.describe('M1 — SCD History Spec', () => {
  let token;
  let seedIds;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    seedIds = getSeedIds();
  });

  test('SCD Type 2 history versioning on department change', async ({ request }) => {
    const headers = { Authorization: `Bearer ${token}` };
    const rand = Math.floor(1000 + Math.random() * 9000);

    // 1. Create employee in Sales department
    const createRes = await request.post(`${API_BASE_URL}/employees`, {
      headers,
      data: {
        employeeCode: `AUTOSCD_${rand}`,
        firstName: 'SCD',
        lastName: 'Tester',
        officialEmail: `autoscd_${rand}@company.com`,
        personalPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        panNumber: `ABCDE${rand}F`,
        aadharNumber: `99${rand}123456`,
        joiningDate: '2026-01-01',
        deptId: seedIds.departments.sales,
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

    // 2. PUT department change to Engineering
    const empGet = await request.get(`${API_BASE_URL}/employees/${empId}`, { headers });
    const empData = (await empGet.json()).data;

    const update1Payload = {
      ...empData,
      deptId: seedIds.departments.engineering,
    };

    const update1Res = await request.put(`${API_BASE_URL}/employees/${empId}`, { headers, data: update1Payload });
    expect(update1Res.ok()).toBeTruthy();

    // Fetch employment history
    const history1Res = await request.get(`${API_BASE_URL}/employees/${empId}/employment-history`, { headers });
    expect(history1Res.ok()).toBeTruthy();
    const history1Data = (await history1Res.json()).data;
    expect(history1Data.length).toBeGreaterThanOrEqual(2);

    const oldRow = history1Data.find(h => h.deptId === seedIds.departments.sales);
    const newRow = history1Data.find(h => h.deptId === seedIds.departments.engineering);
    expect(oldRow.effectiveTo).not.toBeNull();
    expect(newRow.effectiveTo ?? null).toBeNull();

    // 3. Change department a second time to HR department
    const update2Payload = {
      ...empData,
      deptId: seedIds.departments.hr,
    };

    const update2Res = await request.put(`${API_BASE_URL}/employees/${empId}`, { headers, data: update2Payload });
    expect(update2Res.ok()).toBeTruthy();

    const history2Res = await request.get(`${API_BASE_URL}/employees/${empId}/employment-history`, { headers });
    expect(history2Res.ok()).toBeTruthy();
    const history2Data = (await history2Res.json()).data;
    expect(history2Data.length).toBeGreaterThanOrEqual(3);
  });
});
