import { Response } from "express";
import { sendSuccess } from "../../utils/apiResponse";
import { AuthenticatedRequest } from "../rbac/rbac";
import { RoleCode } from "../rbac/fieldVisibility";
import * as service from "./recruitment.service";

export async function createMrf(req: AuthenticatedRequest, res: Response): Promise<void> {
  const mrf = await service.createMrf(req.body);
  sendSuccess(res, mrf, 201);
}

export async function listMrf(req: AuthenticatedRequest, res: Response): Promise<void> {
  let departmentScope: string | undefined = req.query.dept as string | undefined;

  // STEP 2 Security Gap 4 Fix: Enforce strict department scoping for R05_LINE_MANAGER
  if (req.auth?.role === RoleCode.R05_LINE_MANAGER) {
    const userDept = req.auth.departmentId;
    if (departmentScope && departmentScope !== userDept) {
      // Line manager passed a dept query param outside their scope — narrow to their own dept
      departmentScope = userDept;
    } else {
      departmentScope = userDept;
    }
  }

  const items = await service.listMrf({
    status: req.query.status as string | undefined,
    departmentId: departmentScope
  });
  sendSuccess(res, items);
}

export async function approveMrf(req: AuthenticatedRequest, res: Response): Promise<void> {
  const mrf = await service.approveMrf(req.params.mrfId, req.auth!.userId);
  sendSuccess(res, mrf);
}

export async function rejectMrf(req: AuthenticatedRequest, res: Response): Promise<void> {
  const mrf = await service.rejectMrf(req.params.mrfId);
  sendSuccess(res, mrf);
}

export async function createJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const job = await service.createJobPosting(req.body);
  sendSuccess(res, job, 201);
}

export async function publishJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const job = await service.publishJobPosting(req.params.jobId);
  sendSuccess(res, job);
}

export async function listPublicJobs(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const jobs = await service.listPublicJobs();
  sendSuccess(res, jobs);
}

export async function createCandidate(req: AuthenticatedRequest, res: Response): Promise<void> {
  const candidate = await service.createCandidate(req.body);
  sendSuccess(res, candidate, 201);
}

export async function applyToJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const application = await service.applyToJob(req.body);
  sendSuccess(res, application, 201);
}

export async function updateStage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const application = await service.updateApplicationStage(req.params.id, req.body.stage);
  sendSuccess(res, application);
}

export async function scheduleInterview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const interview = await service.scheduleInterview(req.body);
  sendSuccess(res, interview, 201);
}

export async function submitFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  const feedback = await service.submitInterviewFeedback(req.params.id, req.body);
  sendSuccess(res, feedback, 201);
}

export async function consolidatedFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  const result = await service.getConsolidatedFeedback(req.params.id);
  sendSuccess(res, result);
}

export async function createOffer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const offer = await service.createOffer(req.body);
  sendSuccess(res, offer, 201);
}

export async function issueOffer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const offer = await service.issueOffer(req.params.id);
  sendSuccess(res, offer);
}

// Candidate token-gated offer acceptance
export async function acceptOfferByToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  const offer = await service.acceptOfferByToken(req.params.token);
  sendSuccess(res, offer);
}

// Candidate token-gated offer rejection
export async function rejectOfferByToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  const offer = await service.rejectOfferByToken(req.params.token);
  sendSuccess(res, offer);
}

export async function initiateOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
  const checklist = await service.initiateOnboarding(req.params.candidateId);
  sendSuccess(res, checklist, 201);
}

export async function getOnboardingChecklist(req: AuthenticatedRequest, res: Response): Promise<void> {
  const checklist = await service.getOnboardingChecklist(req.params.token);
  sendSuccess(res, checklist);
}

export async function completeOnboardingTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const task = await service.markTaskComplete(req.params.token, req.body.taskId);
  sendSuccess(res, task);
}

export async function convertToEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = await service.prepareEmployeeConversionPayload(req.params.token);
  sendSuccess(res, payload);
}
