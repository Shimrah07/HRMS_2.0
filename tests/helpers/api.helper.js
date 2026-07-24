// @ts-check
import { expect } from '@playwright/test';

export class ApiHelper {
  /**
   * Intercept and validate GET /api/v1/employees response
   * @param {import('@playwright/test').Page} page
   */
  static async validateEmployeeListApi(page) {
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/v1/employees') && response.status() === 200,
      { timeout: 15000 }
    );
    const response = await responsePromise;
    const startTime = Date.now();
    const json = await response.json();
    const duration = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(2000);

    const list = Array.isArray(json) ? json : (json?.data || json?.items || []);
    expect(Array.isArray(list)).toBe(true);

    if (list.length > 0) {
      const emp = list[0];
      expect(emp).toHaveProperty('employeeId');
      expect(emp).toHaveProperty('employeeCode');
      
      // Duplicate code check
      const codes = list.map(e => e.employeeCode).filter(Boolean);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    }

    return list;
  }
}
