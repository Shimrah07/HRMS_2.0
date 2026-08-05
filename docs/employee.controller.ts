import { Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import { AuthenticatedRequest } from "./rbac/rbac";
import {
  applyFieldVisibility,
  RoleCode,
  SELF_SERVICE_EDITABLE_FIELDS,
  SENSITIVE_FIELDS_REQUIRING_APPROVAL
} from "./rbac/fieldVisibility";

// Mock DB retrieval helper
async function fetchEmployeeFromDb(id: string) {
  return {
    id,
    fullNameAadhaar: "Amit Kumar",
    dateOfBirth: "1994-05-15",
    aadhaarNumber: "123456789012",
    bankAccountNumber: "98765432101",
    ifscCode: "SBIN0001234",
    panNumber: "ABCDE1234F",
    uan: "100123456789",
    departmentId: "DEPT-ENG",
    l1ManagerId: "EMP-MGR-01",
    personalEmail: "amit@company.com",
    personalMobile: "9876543210",
    dateOfJoining: "2023-01-10"
  };
}

export async function getEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
  const role = req.auth?.role ?? RoleCode.R06_EMPLOYEE;
  const rawRecord = await fetchEmployeeFromDb(req.params.id);

  // STEP 3: Wire applyFieldVisibility into response using raw DB values
  const sanitized = applyFieldVisibility(
    rawRecord,
    role,
    rawRecord.aadhaarNumber,
    rawRecord.bankAccountNumber,
    rawRecord.panNumber
  );

  sendSuccess(res, sanitized);
}

export async function getMyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const role = req.auth?.role ?? RoleCode.R06_EMPLOYEE;
  const rawRecord = await fetchEmployeeFromDb(req.auth!.userId);

  const sanitized = applyFieldVisibility(
    rawRecord,
    role,
    rawRecord.aadhaarNumber,
    rawRecord.bankAccountNumber,
    rawRecord.panNumber
  );

  sendSuccess(res, sanitized);
}

export async function updateMyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const updateData = req.body as Record<string, unknown>;
  const directUpdates: Record<string, unknown> = {};
  const approvalRequests: Record<string, unknown> = {};

  // STEP 3 Requirement: Separate self-service vs approval-required fields
  for (const [key, val] of Object.entries(updateData)) {
    if (SELF_SERVICE_EDITABLE_FIELDS.has(key)) {
      directUpdates[key] = val;
    } else if (SENSITIVE_FIELDS_REQUIRING_APPROVAL.has(key)) {
      approvalRequests[key] = val;
    }
  }

  // Execute direct updates immediately
  // If sensitive fields were submitted, log pending approval workflow record
  const pendingApprovalCreated = Object.keys(approvalRequests).length > 0;

  sendSuccess(res, {
    message: "Profile update processed",
    directUpdatesApplied: Object.keys(directUpdates),
    approvalRequestsCreated: Object.keys(approvalRequests),
    pendingApprovalCreated
  });
}
