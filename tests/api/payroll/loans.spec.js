const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-6 — Loans & Salary Advance Recovery', () => {
  let adminToken;
  let empToken;
  let createdLoanId;
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

  test('1. Employee can view personal loans (/me)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/loans/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('2. Admin can view all employee loans registry', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/loans`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('3. Admin can issue a new loan / advance for an employee', async ({ request }) => {
    if (!testEmployeeId) return;

    const payload = {
      employeeId: testEmployeeId,
      loanType: 'Salary Advance',
      principalAmount: 30000,
      interestRate: 0,
      tenureMonths: 6,
    };

    const res = await request.post(`${API_BASE_URL}/payroll/loans`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.monthlyEMI).toBe(5000);
    expect(json.data.outstandingBalance).toBe(30000);
    createdLoanId = json.data.loanId;
  });

  test('4. Admin can deduct monthly EMI and reduce outstanding balance', async ({ request }) => {
    if (!createdLoanId) return;

    const res = await request.put(`${API_BASE_URL}/payroll/loans/${createdLoanId}/deduct-emi`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.deductedAmount).toBe(5000);
    expect(json.data.remainingBalance).toBe(25000);
  });

  test('5. Non-admin employee cannot issue loans (403)', async ({ request }) => {
    const payload = {
      employeeId: testEmployeeId || '00000000-0000-0000-0000-000000000001',
      principalAmount: 50000,
      tenureMonths: 12,
    };

    const res = await request.post(`${API_BASE_URL}/payroll/loans`, {
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.status()).toBe(403);
  });
});
