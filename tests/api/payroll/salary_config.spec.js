const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('TICKET-2 — Salary Component & Structure CRUD', () => {
  let adminToken;
  let empToken;
  let createdComponentId;
  let createdStructureId;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    empToken = await getAuthToken(request, 'engemp1@company.com', 'Password123!');
  });

  // ─── Components ──────────────────────────────────────────────────────────

  test('1. Admin can list salary components', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/components`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('2. Admin can create a new salary component', async ({ request }) => {
    const payload = {
      componentName: `Playwright Test Allowance ${Date.now()}`,
      componentCode: `PTA${Date.now().toString().slice(-5)}`,
      componentType: 'Earning',
      calculationType: 'Fixed',
      isStatutory: false,
      isTaxable: true,
    };

    const res = await request.post(`${API_BASE_URL}/payroll/components`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    createdComponentId = json.data?.componentId || json.data?.ComponentId;
  });

  test('3. Admin can update a salary component', async ({ request }) => {
    if (!createdComponentId) return;
    const res = await request.put(`${API_BASE_URL}/payroll/components/${createdComponentId}`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: {
        componentName: 'Updated Playwright Allowance',
        componentType: 'Earning',
        calculationType: 'Percentage',
        isStatutory: false,
        isTaxable: false,
        isActive: true,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('4. Non-admin employee cannot create salary components (403)', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/payroll/components`, {
      headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
      data: { componentName: 'Should Fail', componentCode: 'FAIL', componentType: 'Earning', calculationType: 'Fixed' },
    });
    expect(res.status()).toBe(403);
  });

  // ─── Structures ──────────────────────────────────────────────────────────

  test('5. Admin can list salary structures', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/payroll/structures`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('6. Admin can create a salary structure with component assignments', async ({ request }) => {
    // Get any active component to assign
    const compRes = await request.get(`${API_BASE_URL}/payroll/components`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const components = (await compRes.json()).data;
    const testComp = components.find(c => !c.isStatutory && c.isActive) || components[0];

    const payload = {
      structureName: `Playwright Test Structure ${Date.now()}`,
      effectiveFrom: '2026-01-01',
      effectiveTo: '',
      isActive: true,
      components: testComp ? [{ componentId: testComp.componentId, fixedValue: 5000, formula: null }] : [],
    };

    const res = await request.post(`${API_BASE_URL}/payroll/structures`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    createdStructureId = json.data?.structureId || json.data?.StructureId;
  });

  test('7. Duplicate component code is rejected', async ({ request }) => {
    // Try creating component with the same code again — should return 400
    const payload = { componentName: 'Dupe', componentCode: 'BASIC', componentType: 'Earning', calculationType: 'Fixed' };
    const firstRes = await request.post(`${API_BASE_URL}/payroll/components`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: payload,
    });
    // Only fail if server says 200 twice — duplicate check
    if (firstRes.ok()) {
      const secondRes = await request.post(`${API_BASE_URL}/payroll/components`, {
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        data: payload,
      });
      expect(secondRes.status()).toBe(400);
    }
    // If first was already 400, the constraint was already active — pass
    expect([200, 201, 400]).toContain(firstRes.status());
  });
});
