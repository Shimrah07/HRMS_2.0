import {
  RoleCode,
  applyFieldVisibility,
  getFieldAccess,
  FIELD_MATRIX,
  SELF_SERVICE_EDITABLE_FIELDS,
  SENSITIVE_FIELDS_REQUIRING_APPROVAL
} from "./rbac/fieldVisibility";
import { requireRole } from "./rbac/rbac";

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, testName: string, details: string) {
  testResults.push({
    testName,
    passed: condition,
    details
  });
}

// ── 1. MATRIX & FIELD VISIBILITY TESTS ─────────────────────────────────────
export function testFieldVisibility() {
  const sampleEmployee = {
    id: "EMP001",
    fullNameAadhaar: "Amit Kumar",
    dateOfBirth: "1994-05-15",
    aadhaarNumber: "123456789012",
    bankAccountNumber: "98765432101",
    panNumber: "ABCDE1234F",
    departmentId: "DEPT-ENG"
  };

  // Test R06_EMPLOYEE (Self view)
  const empView = applyFieldVisibility(sampleEmployee, RoleCode.R06_EMPLOYEE, sampleEmployee.aadhaarNumber, sampleEmployee.bankAccountNumber, sampleEmployee.panNumber);
  assert(empView.aadhaarNumber === "XXXX-XXXX-9012", "R06 Aadhaar Masking", `Expected masked Aadhaar, got: ${empView.aadhaarNumber}`);
  assert(empView.dateOfBirth === "1994-05-15", "R06 DOB Visibility", `Expected DOB visible to employee, got: ${empView.dateOfBirth}`);

  // Test R05_LINE_MANAGER (Manager view)
  const mgrView = applyFieldVisibility(sampleEmployee, RoleCode.R05_LINE_MANAGER, sampleEmployee.aadhaarNumber, sampleEmployee.bankAccountNumber, sampleEmployee.panNumber);
  assert(!("dateOfBirth" in mgrView), "R05 DOB Hidden", `Expected DOB hidden for Line Manager, got: ${mgrView.dateOfBirth}`);
  assert(!("aadhaarNumber" in mgrView), "R05 Aadhaar Hidden", `Expected Aadhaar hidden for Line Manager, got: ${mgrView.aadhaarNumber}`);

  // Test Fallback Behavior (PII field default HIDDEN vs General default VIEW)
  const unlistedPiiAccess = getFieldAccess("salary", RoleCode.R05_LINE_MANAGER);
  assert(unlistedPiiAccess === "HIDDEN", "PII Fallback Closed", `Expected HIDDEN for unlisted PII, got: ${unlistedPiiAccess}`);

  const unlistedGeneralAccess = getFieldAccess("employeeCode", RoleCode.R05_LINE_MANAGER);
  assert(unlistedGeneralAccess === "VIEW", "General Fallback Open", `Expected VIEW for unlisted General field, got: ${unlistedGeneralAccess}`);
}

// ── 2. ROUTE AUTHORIZATION & SECURITY GAP TESTS ────────────────────────────
export function testRouteAuthorization() {
  const mrfGuard = requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R11_FINANCE);

  let statusSent = 0;
  const mockRes = {
    status(s: number) {
      statusSent = s;
      return this;
    },
    json() { return this; }
  } as any;

  // Test unauthorized role on MRF approve
  const unauthReq = { auth: { userId: "U1", role: RoleCode.R06_EMPLOYEE } } as any;
  mrfGuard(unauthReq, mockRes, () => {});
  assert(statusSent === 403, "MRF Approve R06 Forbidden", `Expected 403 status, got: ${statusSent}`);

  // Test authorized role on MRF approve
  let nextCalled = false;
  const authReq = { auth: { userId: "U2", role: RoleCode.R11_FINANCE } } as any;
  mrfGuard(authReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled, "MRF Approve R11 Allowed", "Expected next() to be called for R11_FINANCE");
}

// ── 3. ESS PROFILE UPDATE TESTS ───────────────────────────────────────────
export function testEssProfileUpdate() {
  const payload = {
    personalEmail: "newemail@company.com",
    dateOfJoining: "2020-01-01"
  };

  const directUpdates: string[] = [];
  const approvalRequests: string[] = [];

  for (const [key, val] of Object.entries(payload)) {
    if (SELF_SERVICE_EDITABLE_FIELDS.has(key)) directUpdates.push(key);
    if (SENSITIVE_FIELDS_REQUIRING_APPROVAL.has(key)) approvalRequests.push(key);
  }

  assert(directUpdates.includes("personalEmail"), "Direct ESS Update Allowed", "personalEmail should apply directly");
  assert(approvalRequests.includes("dateOfJoining"), "Sensitive Field Approval Triggered", "dateOfJoining must require approval");
  assert(!directUpdates.includes("dateOfJoining"), "Sensitive Field Dropped From Direct Write", "dateOfJoining must not write directly");
}

// Execute all test suites
testFieldVisibility();
testRouteAuthorization();
testEssProfileUpdate();

console.log("\n========================================================");
console.log("             HRMS RBAC REGRESSION TEST SUITE            ");
console.log("========================================================");
let passCount = 0;
let failCount = 0;
for (const res of testResults) {
  if (res.passed) {
    passCount++;
    console.log(` ✅ PASS: [${res.testName}] - ${res.details}`);
  } else {
    failCount++;
    console.log(` ❌ FAIL: [${res.testName}] - ${res.details}`);
  }
}
console.log("--------------------------------------------------------");
console.log(`TOTAL TESTS: ${testResults.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log("========================================================\n");
