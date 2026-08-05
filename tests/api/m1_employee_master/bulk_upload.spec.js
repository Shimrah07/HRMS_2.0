const { test, expect } = require('@playwright/test');
const { API_BASE_URL, getAuthToken } = require('../fixtures/testHelpers');

test.describe('M1 — Bulk Upload Spec', () => {
  let token;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request, 'superadmin@company.com', 'Password123!');
  });

  test('Bulk upload process 3 valid and 2 invalid rows', async ({ request }) => {
    const headers = { Authorization: `Bearer ${token}` };
    const rand = Math.floor(1000 + Math.random() * 9000);

    const csvLines = [
      'FirstName,LastName,OfficialEmail,PersonalPhone,JoiningDate,DeptCode,DesignationCode',
      `BulkOne,Test,autobulk1_${rand}@company.com,99887${rand}1,2026-01-01,ENG,SE`,
      `BulkTwo,Test,autobulk2_${rand}@company.com,99887${rand}2,2026-01-01,ENG,SE`,
      `BulkThree,Test,autobulk3_${rand}@company.com,99887${rand}3,2026-01-01,ENG,SE`,
      `InvalidEmail,Test,invalid-email-format,99887${rand}4,2026-01-01,ENG,SE`,
      `,MissingFirstName,autobulk5_${rand}@company.com,99887${rand}5,2026-01-01,ENG,SE`,
    ];

    const csvContent = csvLines.join('\n');

    const res = await request.post(`${API_BASE_URL}/employees/bulk`, {
      headers,
      multipart: {
        file: {
          name: 'bulk_test.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent, 'utf8'),
        },
      },
    });

    if (!res.ok()) {
      console.log('POST /employees/bulk failed:', res.status(), await res.text());
    }
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    console.log('Bulk upload response:', JSON.stringify(json));

    expect(json.data.successCount).toBe(3);
    expect(json.data.failureCount).toBe(2);
    expect(json.data.errors.length).toBe(2);
  });
});
