const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-7 — Reimbursements & Expense Claims', () => {
  let adminToken;
  let empToken;
  let createdClaimId;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  test('1. Employee can submit a reimbursement claim', async ({ request }) => {
    const payload = {
      category: 'Travel & Conveyance',
      amount: 2500,
      description: 'Client visit cab fare and toll receipts',
      receiptUrl: 'cab_receipt_2500.pdf',
      isTaxFree: true,
    };

    const res = await request.post(`${API_BASE_URL}/payroll/reimbursements`, {
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('Pending');
    expect(json.data.amount).toBe(2500);
    createdClaimId = json.data.claimId;
  });

  test('2. Employee can view submitted personal claims (/me)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/reimbursements/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('3. Manager/Admin can list pending reimbursement queue', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/reimbursements/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('4. Manager/Admin can approve a reimbursement claim', async ({ request }) => {
    if (!createdClaimId) return;

    const res = await request.put(`${API_BASE_URL}/payroll/reimbursements/${createdClaimId}/approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('Approved');
  });

  test('5. Non-manager employee cannot view pending approval queue (403)', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/reimbursements/pending`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
