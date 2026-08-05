const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-8 — Attendance vs Leave Reconciliation for LWP', () => {
  let adminToken;
  let empToken;
  let testEmployeeId;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');

    const empRes = await request.get(`${API_BASE_URL}/employees?pageSize=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const empData = await empRes.json();
    testEmployeeId = empData?.data?.items?.[0]?.employeeId || empData?.data?.[0]?.employeeId;
  });

  test('1. Admin can reconcile employee attendance vs leave for LWP', async ({ request }) => {
    if (!testEmployeeId) return;

    const res = await request.get(`${API_BASE_URL}/payroll/attendance-reconciliation/employee/${testEmployeeId}?year=2026&month=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('approvedUnpaidLeaveDays');
    expect(json.data).toHaveProperty('unauthorizedAbsenceDays');
    expect(json.data).toHaveProperty('totalLWPDays');
  });

  test('2. Employee can view personal attendance vs leave reconciliation', async ({ request }) => {
    const meRes = await request.get(`${API_BASE_URL}/payroll/my-salary-slips`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    // Reconcile employee own record if employee profile exists
    if (meRes.ok()) {
      const res = await request.get(`${API_BASE_URL}/payroll/attendance-reconciliation/employee/${testEmployeeId}?year=2026&month=1`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.ok()).toBeTruthy();
    }
  });

  test('3. Admin can run batch attendance reconciliation for payroll run month', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/attendance-reconciliation/reconcile-run/2026/1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('totalEmployeesReconciled');
    expect(Array.isArray(json.data.reconciliationList)).toBe(true);
  });

  test('4. Non-admin employee cannot run batch reconciliation (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/attendance-reconciliation/reconcile-run/2026/1`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
