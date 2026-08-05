const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken, getSeedIds } = require('../fixtures/testHelpers');

test.describe('M2 — Recruitment Test Suite', () => {
  let adminToken;
  let seedIds;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
    seedIds = getSeedIds();
  });

  test('1. Job Requisition Lifecycle', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const rand = Math.floor(1000 + Math.random() * 9000);

    const reqPayload = {
      jobTitle: `Software Architect ${rand}`,
      departmentId: seedIds.departments.engineering,
      locationId: seedIds.locationId,
      vacancies: 2,
      minExperienceYears: 5,
      maxExperienceYears: 10,
      jobDescription: 'Automated test job requisition description.',
      status: 'Open',
    };

    const res = await request.post(`${API_BASE_URL}/job-requisitions`, { headers, data: reqPayload });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test('2. Candidate Creation', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const rand = Math.floor(1000 + Math.random() * 9000);

    const candidatePayload = {
      firstName: 'Recruitment',
      lastName: 'Candidate',
      email: `candidate_${rand}@company.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      panNumber: `ABCDE${rand}K`,
      aadhaarNumber: `99${rand}887766`,
    };

    const res = await request.post(`${API_BASE_URL}/candidates`, { headers, data: candidatePayload });
    if (!res.ok()) {
      console.log('POST /candidates failed:', res.status(), await res.text());
    }
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
