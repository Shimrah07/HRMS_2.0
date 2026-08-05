const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-1 — Server-Side PDF Payslip Generation Spec', () => {
  let empToken;
  let adminToken;

  test.beforeAll(async ({ request }) => {
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
  });

  test('1. Employee can fetch personal salary slips list', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/my-salary-slips`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('2. Employee can download personal PDF payslip for a specific month', async ({ request }) => {
    const meRes = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(meRes.ok()).toBeTruthy();
    const meJson = await meRes.json();
    const empId = meJson.data.employeeId || meJson.data.id;

    const pdfRes = await request.get(`${API_BASE_URL}/payroll/salary-slips/${empId}/2026/5/pdf`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });

    expect(pdfRes.ok()).toBeTruthy();
    expect(pdfRes.headers()['content-type']).toContain('application/pdf');

    const buffer = await pdfRes.body();
    expect(buffer.length).toBeGreaterThan(500); // Verify PDF payload non-empty
    const pdfHeader = buffer.toString('utf8', 0, 5);
    expect(pdfHeader).toBe('%PDF-');
  });

  test('3. Admin can download PDF payslip for any employee', async ({ request }) => {
    const meRes = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const empId = (await meRes.json()).data.employeeId;

    const pdfRes = await request.get(`${API_BASE_URL}/payroll/salary-slips/${empId}/2026/5/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(pdfRes.ok()).toBeTruthy();
    expect(pdfRes.headers()['content-type']).toContain('application/pdf');
    const buffer = await pdfRes.body();
    expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  test('4. Non-admin employee cannot download another employee payslip', async ({ request }) => {
    // Other employee ID (e.g. HR Admin employee ID)
    const otherEmpRes = await request.get(`${API_BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const employees = (await otherEmpRes.json()).data.items || (await otherEmpRes.json()).data;
    const otherEmp = employees.find(e => e.officialEmail === 'superadmin@company.com' || e.officialEmail === 'hradmin@company.com');

    if (otherEmp) {
      const pdfRes = await request.get(`${API_BASE_URL}/payroll/salary-slips/${otherEmp.employeeId}/2026/5/pdf`, {
        headers: { Authorization: `Bearer ${empToken}` },
      });
      expect(pdfRes.status()).toBe(403);
    }
  });
});
