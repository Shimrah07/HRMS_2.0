const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('./testHelpers');

test('Ticket A — Master/Reference Data Seeder', async ({ request }) => {
  const token = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Fetch Company
  const compRes = await request.get(`${API_BASE_URL}/organization/company`, { headers });
  let companyId = null;
  if (compRes.ok()) {
    const compData = await compRes.json();
    companyId = compData.data?.companyId || compData.data?.id;
  }

  // 2. Fetch Departments
  const deptRes = await request.get(`${API_BASE_URL}/organization/departments`, { headers });
  const depts = deptRes.ok() ? (await deptRes.json()).data || [] : [];

  let engDept = depts.find(d => d.departmentName?.includes('Engineering'));
  if (!engDept) {
    const createDept = await request.post(`${API_BASE_URL}/organization/departments`, {
      headers,
      data: { departmentCode: 'ENG', departmentName: 'Engineering', description: 'Engineering Dept' }
    });
    if (createDept.ok()) engDept = (await createDept.json()).data;
  }

  let salesDept = depts.find(d => d.departmentName?.includes('Sales'));
  if (!salesDept) {
    const createDept = await request.post(`${API_BASE_URL}/organization/departments`, {
      headers,
      data: { departmentCode: 'SALES', departmentName: 'Sales', description: 'Sales Dept' }
    });
    if (createDept.ok()) salesDept = (await createDept.json()).data;
  }

  let hrDept = depts.find(d => d.departmentName?.includes('Human Resources') || d.departmentName?.includes('HR'));
  if (!hrDept) {
    const createDept = await request.post(`${API_BASE_URL}/organization/departments`, {
      headers,
      data: { departmentCode: 'HR', departmentName: 'Human Resources', description: 'HR Dept' }
    });
    if (createDept.ok()) hrDept = (await createDept.json()).data;
  }

  // 3. Fetch Designations
  const desigRes = await request.get(`${API_BASE_URL}/organization/designations`, { headers });
  const desigs = desigRes.ok() ? (await desigRes.json()).data || [] : [];
  const softwareEng = desigs.find(d => d.designationTitle?.includes('Software Engineer') || d.title?.includes('Software Engineer')) || desigs[0];

  // 4. Fetch Locations
  const locRes = await request.get(`${API_BASE_URL}/organization/locations`, { headers });
  const locs = locRes.ok() ? (await locRes.json()).data || [] : [];
  const primaryLoc = locs[0];

  // 5. Fetch Grades
  const gradeRes = await request.get(`${API_BASE_URL}/organization/grades`, { headers });
  const grades = gradeRes.ok() ? (await gradeRes.json()).data || [] : [];
  const primaryGrade = grades[0];

  // 6. Fetch Cost Centers
  const ccRes = await request.get(`${API_BASE_URL}/organization/cost-centers`, { headers });
  const ccs = ccRes.ok() ? (await ccRes.json()).data || [] : [];
  const primaryCC = ccs[0];

  // 7. Ensure Shifts
  const shiftRes = await request.get(`${API_BASE_URL}/shifts`, { headers });
  const shifts = shiftRes.ok() ? (await shiftRes.json()).data || [] : [];

  let dayShift = shifts.find(s => s.shiftName?.includes('Day') || s.shiftName?.includes('General'));
  if (!dayShift) {
    const createShift = await request.post(`${API_BASE_URL}/shifts`, {
      headers,
      data: {
        shiftCode: 'DAY_SEED',
        shiftName: 'Day Shift (Seed)',
        startTime: '09:00:00',
        endTime: '18:00:00',
        breakMins: 60,
        gracePeriodMins: 15,
        isNightShift: false,
      }
    });
    if (createShift.ok()) dayShift = (await createShift.json()).data;
  }

  let nightShift = shifts.find(s => s.isNightShift || s.shiftName?.includes('Night'));
  if (!nightShift) {
    const createShift = await request.post(`${API_BASE_URL}/shifts`, {
      headers,
      data: {
        shiftCode: 'NIGHT_SEED',
        shiftName: 'Night Shift (Seed)',
        startTime: '22:00:00',
        endTime: '06:00:00',
        breakMins: 60,
        gracePeriodMins: 15,
        isNightShift: true,
      }
    });
    if (createShift.ok()) nightShift = (await createShift.json()).data;
  }

  const seedOutput = {
    companyId,
    departments: {
      engineering: engDept?.deptId || engDept?.id,
      sales: salesDept?.deptId || salesDept?.id,
      hr: hrDept?.deptId || hrDept?.id,
    },
    designationId: softwareEng?.designationId || softwareEng?.id,
    locationId: primaryLoc?.locationId || primaryLoc?.id,
    gradeId: primaryGrade?.gradeId || primaryGrade?.id,
    costCenterId: primaryCC?.costCenterId || primaryCC?.id,
    shifts: {
      dayShiftId: dayShift?.shiftId || dayShift?.id,
      nightShiftId: nightShift?.shiftId || nightShift?.id,
    },
    roles: {
      superAdmin: 'superadmin@company.com',
      hrAdmin: 'hradmin@company.com',
      deptManager: 'enghod@company.com',
      employee: 'engemp1@company.com',
    }
  };

  const seedPath = path.join(__dirname, 'seedIds.json');
  fs.writeFileSync(seedPath, JSON.stringify(seedOutput, null, 2), 'utf8');

  expect(fs.existsSync(seedPath)).toBe(true);
  console.log('Seeder completed successfully. Output:', JSON.stringify(seedOutput, null, 2));
});
