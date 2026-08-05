import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../rbac/rbac";
import { RoleCode } from "../rbac/fieldVisibility";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/errorHandler";
import * as controller from "./recruitment.controller";
import {
  applyToJobSchema,
  createCandidateSchema,
  createJobPostingSchema,
  createMrfSchema,
  createOfferSchema,
  interviewFeedbackSchema,
  scheduleInterviewSchema,
  updateStageSchema
} from "./recruitment.validators";

const router = Router();

// Public candidate-facing endpoints — no user auth required. Token-gated for candidate actions.
router.get("/jobs/public", asyncHandler(controller.listPublicJobs));
router.post("/candidates", validateBody(createCandidateSchema), asyncHandler(controller.createCandidate));
router.post("/candidates/apply", validateBody(applyToJobSchema), asyncHandler(controller.applyToJob));

// Candidate offer token-gated endpoints (Candidate verification token required)
router.put("/offers/token/:token/accept", asyncHandler(controller.acceptOfferByToken));
router.put("/offers/token/:token/reject", asyncHandler(controller.rejectOfferByToken));

// Onboarding token-gated endpoints
router.get("/onboarding/:token/checklist", asyncHandler(controller.getOnboardingChecklist));
router.post("/onboarding/:token/documents", asyncHandler(controller.completeOnboardingTask));

// Standard authenticated user routes below
router.use(authenticate);

// 2.1 Manpower Requisition — HOD/Manager raises, HR Head/Finance approve
router.post(
  "/mrf",
  requireRole(RoleCode.R05_LINE_MANAGER, RoleCode.R02_HR_ADMIN, RoleCode.R01_SUPER_ADMIN),
  validateBody(createMrfSchema),
  asyncHandler(controller.createMrf)
);
router.get(
  "/mrf",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R09_RECRUITER, RoleCode.R05_LINE_MANAGER),
  asyncHandler(controller.listMrf)
);
router.put(
  "/mrf/:mrfId/approve",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R11_FINANCE),
  asyncHandler(controller.approveMrf)
);
router.put(
  "/mrf/:mrfId/reject",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R11_FINANCE),
  asyncHandler(controller.rejectMrf)
);

// 2.2 Job Posting
router.post(
  "/jobs",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R09_RECRUITER),
  validateBody(createJobPostingSchema),
  asyncHandler(controller.createJob)
);
router.post(
  "/jobs/:jobId/publish",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R09_RECRUITER),
  asyncHandler(controller.publishJob)
);

// 2.4 Application Tracking System
router.put(
  "/candidates/:id/stage",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R09_RECRUITER),
  validateBody(updateStageSchema),
  asyncHandler(controller.updateStage)
);

// 2.6 Interview Management
router.post(
  "/interviews/schedule",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R09_RECRUITER),
  validateBody(scheduleInterviewSchema),
  asyncHandler(controller.scheduleInterview)
);
router.post(
  "/interviews/:id/feedback",
  requireRole(RoleCode.R10_INTERVIEWER, RoleCode.R05_LINE_MANAGER, RoleCode.R02_HR_ADMIN),
  validateBody(interviewFeedbackSchema),
  asyncHandler(controller.submitFeedback)
);
router.get(
  "/interviews/:id/consolidated-feedback",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R09_RECRUITER, RoleCode.R05_LINE_MANAGER),
  asyncHandler(controller.consolidatedFeedback)
);

// 2.7 Offer Management
router.post(
  "/offers",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN, RoleCode.R09_RECRUITER),
  validateBody(createOfferSchema),
  asyncHandler(controller.createOffer)
);
router.put(
  "/offers/:id/issue",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN),
  asyncHandler(controller.issueOffer)
);

// 2.9/2.10 Onboarding
router.post(
  "/onboarding/initiate/:candidateId",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN),
  asyncHandler(controller.initiateOnboarding)
);
router.post(
  "/onboarding/:token/convert-to-employee",
  requireRole(RoleCode.R01_SUPER_ADMIN, RoleCode.R02_HR_ADMIN),
  asyncHandler(controller.convertToEmployee)
);

export default router;
