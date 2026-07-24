// @ts-check

/**
 * Attaches console error and unhandled runtime exception listeners to Playwright page.
 * @param {import('@playwright/test').Page} page 
 * @returns {{ getErrors: () => string[], checkNoConsoleErrors: () => void }}
 */
export function setupConsoleMonitor(page) {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore normal benign dev server, expected HTTP status errors, and React/Antd dev warnings
      if (!text.includes('Failed to load resource') &&
          !text.includes('[vite]') &&
          !text.includes('favicon.ico') &&
          !text.includes('[antd:') &&
          !text.includes('Warning:') &&
          !text.includes('Failed to load filters metadata')) {
        errors.push(`[Console Error] ${text}`);
      }
    }
  });

  page.on('pageerror', exception => {
    errors.push(`[Page Error] ${exception.message}\n${exception.stack || ''}`);
  });

  return {
    getErrors: () => errors,
    checkNoConsoleErrors: () => {
      if (errors.length > 0) {
        throw new Error(`Severe Runtime Console Errors Detected:\n${errors.join('\n')}`);
      }
    }
  };
}
