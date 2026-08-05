export enum RoleCode {
  R01_SUPER_ADMIN = "R01_SUPER_ADMIN",
  R02_HR_ADMIN = "R02_HR_ADMIN",
  R03_HR_EXECUTIVE = "R03_HR_EXECUTIVE",
  R04_PAYROLL_ADMIN = "R04_PAYROLL_ADMIN",
  R05_LINE_MANAGER = "R05_LINE_MANAGER",
  R06_EMPLOYEE = "R06_EMPLOYEE",
  R07_AUDITOR = "R07_AUDITOR",
  R08_COMPLIANCE_OFFICER = "R08_COMPLIANCE_OFFICER",
  R09_RECRUITER = "R09_RECRUITER",
  R10_INTERVIEWER = "R10_INTERVIEWER",
  R11_FINANCE = "R11_FINANCE"
}

export type Access = "EDIT" | "VIEW" | "HIDDEN" | "MASKED" | "REQUEST";

// PII & sensitive fields default to HIDDEN if not explicitly listed for a role
export const PII_FIELDS = new Set([
  "aadhaarNumber",
  "panNumber",
  "bankAccountNumber",
  "ifscCode",
  "uan",
  "dateOfBirth",
  "salary",
  "grossCTC",
  "netPay",
  "basicPay",
  "rating",
  "performanceScore",
  "feedbackComments"
]);

// General non-sensitive fields default to VIEW if not explicitly listed
export const GENERAL_FIELDS = new Set([
  "fullNameAadhaar",
  "firstName",
  "lastName",
  "departmentId",
  "designationId",
  "l1ManagerId",
  "employeeCode",
  "category",
  "religion",
  "employmentType",
  "status"
]);

export function maskAadhaar(val?: string): string {
  if (!val) return "XXXXXXXXXXXX";
  const last4 = val.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function maskBankAccount(val?: string): string {
  if (!val) return "XXXXXXXX";
  const last4 = val.slice(-4);
  return `XXXX${last4}`;
}

export function maskPan(val?: string): string {
  if (!val) return "XXXXXXXXXX";
  if (val.length >= 6) return val.slice(0, 5) + "XXXX" + val.slice(-1);
  return "XXXXX0000X";
}

// Complete explicit matrix covering all 11 canonical roles
export const FIELD_MATRIX: Record<string, Record<RoleCode, Access>> = {
  fullNameAadhaar: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "EDIT",
    [RoleCode.R04_PAYROLL_ADMIN]: "VIEW",
    [RoleCode.R05_LINE_MANAGER]: "VIEW",
    [RoleCode.R06_EMPLOYEE]: "REQUEST",
    [RoleCode.R07_AUDITOR]: "VIEW",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "VIEW",
    [RoleCode.R09_RECRUITER]: "VIEW",
    [RoleCode.R10_INTERVIEWER]: "VIEW",
    [RoleCode.R11_FINANCE]: "VIEW"
  },
  dateOfBirth: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "HIDDEN",
    [RoleCode.R04_PAYROLL_ADMIN]: "VIEW",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "VIEW",
    [RoleCode.R07_AUDITOR]: "VIEW",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "VIEW",
    [RoleCode.R09_RECRUITER]: "HIDDEN",
    [RoleCode.R10_INTERVIEWER]: "HIDDEN",
    [RoleCode.R11_FINANCE]: "HIDDEN"
  },
  religion: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "VIEW",
    [RoleCode.R04_PAYROLL_ADMIN]: "HIDDEN",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "EDIT",
    [RoleCode.R07_AUDITOR]: "HIDDEN",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "HIDDEN",
    [RoleCode.R09_RECRUITER]: "HIDDEN",
    [RoleCode.R10_INTERVIEWER]: "HIDDEN",
    [RoleCode.R11_FINANCE]: "HIDDEN"
  },
  category: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "EDIT",
    [RoleCode.R04_PAYROLL_ADMIN]: "HIDDEN",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "VIEW",
    [RoleCode.R07_AUDITOR]: "VIEW",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "VIEW",
    [RoleCode.R09_RECRUITER]: "HIDDEN",
    [RoleCode.R10_INTERVIEWER]: "HIDDEN",
    [RoleCode.R11_FINANCE]: "HIDDEN"
  },
  bankAccountNumber: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "HIDDEN",
    [RoleCode.R04_PAYROLL_ADMIN]: "EDIT",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "REQUEST",
    [RoleCode.R07_AUDITOR]: "MASKED",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "HIDDEN",
    [RoleCode.R09_RECRUITER]: "HIDDEN",
    [RoleCode.R10_INTERVIEWER]: "HIDDEN",
    [RoleCode.R11_FINANCE]: "MASKED"
  },
  ifscCode: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "HIDDEN",
    [RoleCode.R04_PAYROLL_ADMIN]: "EDIT",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "REQUEST",
    [RoleCode.R07_AUDITOR]: "VIEW",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "HIDDEN",
    [RoleCode.R09_RECRUITER]: "HIDDEN",
    [RoleCode.R10_INTERVIEWER]: "HIDDEN",
    [RoleCode.R11_FINANCE]: "VIEW"
  },
  panNumber: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "HIDDEN",
    [RoleCode.R04_PAYROLL_ADMIN]: "EDIT",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "REQUEST",
    [RoleCode.R07_AUDITOR]: "MASKED",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "VIEW",
    [RoleCode.R09_RECRUITER]: "HIDDEN",
    [RoleCode.R10_INTERVIEWER]: "HIDDEN",
    [RoleCode.R11_FINANCE]: "MASKED"
  },
  aadhaarNumber: {
    [RoleCode.R01_SUPER_ADMIN]: "MASKED",
    [RoleCode.R02_HR_ADMIN]: "MASKED",
    [RoleCode.R03_HR_EXECUTIVE]: "HIDDEN",
    [RoleCode.R04_PAYROLL_ADMIN]: "HIDDEN",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "MASKED",
    [RoleCode.R07_AUDITOR]: "HIDDEN",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "MASKED",
    [RoleCode.R09_RECRUITER]: "HIDDEN",
    [RoleCode.R10_INTERVIEWER]: "HIDDEN",
    [RoleCode.R11_FINANCE]: "HIDDEN"
  },
  uan: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "HIDDEN",
    [RoleCode.R04_PAYROLL_ADMIN]: "EDIT",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "VIEW",
    [RoleCode.R07_AUDITOR]: "VIEW",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "VIEW",
    [RoleCode.R09_RECRUITER]: "HIDDEN",
    [RoleCode.R10_INTERVIEWER]: "HIDDEN",
    [RoleCode.R11_FINANCE]: "VIEW"
  },
  departmentId: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "HIDDEN",
    [RoleCode.R04_PAYROLL_ADMIN]: "VIEW",
    [RoleCode.R05_LINE_MANAGER]: "VIEW",
    [RoleCode.R06_EMPLOYEE]: "VIEW",
    [RoleCode.R07_AUDITOR]: "VIEW",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "VIEW",
    [RoleCode.R09_RECRUITER]: "VIEW",
    [RoleCode.R10_INTERVIEWER]: "VIEW",
    [RoleCode.R11_FINANCE]: "VIEW"
  },
  l1ManagerId: {
    [RoleCode.R01_SUPER_ADMIN]: "EDIT",
    [RoleCode.R02_HR_ADMIN]: "EDIT",
    [RoleCode.R03_HR_EXECUTIVE]: "HIDDEN",
    [RoleCode.R04_PAYROLL_ADMIN]: "HIDDEN",
    [RoleCode.R05_LINE_MANAGER]: "HIDDEN",
    [RoleCode.R06_EMPLOYEE]: "VIEW",
    [RoleCode.R07_AUDITOR]: "VIEW",
    [RoleCode.R08_COMPLIANCE_OFFICER]: "VIEW",
    [RoleCode.R09_RECRUITER]: "VIEW",
    [RoleCode.R10_INTERVIEWER]: "VIEW",
    [RoleCode.R11_FINANCE]: "VIEW"
  }
};

export function getFieldAccess(fieldName: string, role: RoleCode): Access {
  const explicitAccess = FIELD_MATRIX[fieldName]?.[role];
  if (explicitAccess) return explicitAccess;

  // Closed fallback security: PII fields default to HIDDEN, general fields default to VIEW
  if (PII_FIELDS.has(fieldName)) return "HIDDEN";
  if (GENERAL_FIELDS.has(fieldName)) return "VIEW";
  return "HIDDEN"; // strict safety catch-all
}

export function applyFieldVisibility<T extends Record<string, unknown>>(
  record: T,
  role: RoleCode,
  rawAadhaar?: string,
  rawBankAccount?: string,
  rawPan?: string
): T {
  const output: Record<string, unknown> = { ...record };

  for (const key of Object.keys(output)) {
    const access = getFieldAccess(key, role);
    if (access === "HIDDEN") {
      delete output[key];
      continue;
    }
    if (access === "MASKED") {
      if (key === "aadhaarNumber") output[key] = maskAadhaar(rawAadhaar ?? (record[key] as string));
      if (key === "bankAccountNumber") output[key] = maskBankAccount(rawBankAccount ?? (record[key] as string));
      if (key === "panNumber") output[key] = maskPan(rawPan ?? (record[key] as string));
    }
  }

  return output as T;
}

// ESS direct editable fields
export const SELF_SERVICE_EDITABLE_FIELDS = new Set([
  "currAddressLine1",
  "currAddressLine2",
  "currPinCode",
  "currCity",
  "currDistrict",
  "currState",
  "personalMobile",
  "whatsappNumber",
  "personalEmail",
  "emergencyContactName",
  "emergencyRelationship",
  "emergencyMobile"
]);

// ESS sensitive fields requiring HR approval
export const SENSITIVE_FIELDS_REQUIRING_APPROVAL = new Set([
  "firstName",
  "middleName",
  "lastName",
  "fullNameAadhaar",
  "dateOfBirth",
  "aadhaarNumber",
  "panNumber",
  "bankAccountNumber",
  "ifscCode",
  "uan",
  "gradeId",
  "departmentId",
  "designationId",
  "l1ManagerId",
  "dateOfJoining",
  "employmentType"
]);
