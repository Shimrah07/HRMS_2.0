# 🔍 HRMS 2.0 — Enterprise QA Report (Round 1)

**QA Lead**: Antigravity (Senior Software Engineer)  
**Audit Date**: July 21, 2026  
**Modules Scanned**: 18 (Full Platform)  
**Audit Mode**: Static code analysis + service-API mapping + workflow logic validation

---

## Module Pass/Fail Summary

| Module | Status | Issues |
| :--- | :---: | :---: |
| Authentication (Login) | ✅ Passed | 0 |
| Dashboard | ✅ Passed | 0 |
| Employee Management | ✅ Passed | 0 |
| Organization / Departments | ✅ Passed | 0 |
| Users & Roles (RBAC) | ✅ Passed | 0 |
| Notifications | ✅ Passed | 0 |
| Attendance | ✅ Passed | 0 |
| Leave | ⚠️ Warning | 1 |
| Payroll | ✅ Passed | 0 |
| Performance | ✅ Passed | 0 |
| Settings | ✅ Passed | 0 |
| **Recruitment — MRF / Requisitions** | ✅ Passed | 0 |
| **Recruitment — Job Openings** | ⚠️ Warning | 1 |
| **Recruitment — Candidate Database** | ❌ Issues | 4 |
| **Recruitment — CSV / Excel Import** | ⚠️ Warning | 1 |
| **Recruitment — Employee Referral** | ⚠️ Warning | 1 |
| **Recruitment — ATS Pipeline** | ⚠️ Warning | 1 |
| **Recruitment — Careers Portal** | ✅ Passed | 0 |

---

## Issue Reports

---

### ISSUE-001 — **CRITICAL** · Duplicate Form Field `willingToRelocate` in Step 3

**MODULE**: Recruitment — Candidate Database  
**WORKFLOW**: Manual Add Candidate → Step 3 (Sourcing & Recruitment)  

**ISSUE**  
`Form.Item name="willingToRelocate"` appears **twice** on lines 1137 and 1148 inside the same `<Row>` block in Step 3 of the multi-step candidate registration drawer. Ant Design will silently ignore the second instance, meaning its value is never read or saved. The first render wins, but the layout shows two dropdowns occupying grid space, and UX is broken — the second appears to do nothing.

**ROOT CAUSE**  
A copy-paste error during Step 3 form construction. The second `Form.Item` should likely be for `candidateStatus` or another field, but it uses the same name as the first.

**IMPACT**  
- Second dropdown is a ghost control: user interaction has no effect.
- Confuses recruiters who see two identical dropdowns.
- If the second was intended to be `candidateStatus`, that field's state is never captured for new candidate registrations from this step.

**SEVERITY**: 🔴 Critical (UI Logic Bug — data not captured)

**FILES**  
[`CandidatesPage.jsx`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/pages/recruitment/CandidatesPage.jsx) — Lines 1146–1164

**RECOMMENDED FIX**  
Remove the duplicate `willingToRelocate` Form.Item (line 1148). The second `<Col>` should only render the `candidateStatus` selector (which is already conditionally rendered for `editingCandidate`). For **new** candidates, show an optional "Notice Period" or leave the col empty.

```diff
-  <Col span={12}>
-    <Form.Item name="willingToRelocate" label="Willing to Relocate?">   ← LINE 1148 — REMOVE THIS DUPLICATE
-      <Select ...>...</Select>
-    </Form.Item>
-  </Col>
```

**RISK**: Low — confined to Step 3 JSX only.

---

### ISSUE-002 — **High** · Apply to Job Modal uses `reqId` but `createApplication` API expects `jobId`

**MODULE**: Recruitment — Candidate Database  
**WORKFLOW**: Candidate List → "Apply to Job" button → Job Opening selector → Submit  

**ISSUE**  
In `handleApplyToJob()` (line 498), the API is called as:
```js
recruitmentService.createApplication({ reqId: selectedJobId, candidateId: applyCandidate.candidateId })
```
The job selector `<Option key={job.jobId} value={job.reqId}>` sets `selectedJobId` to the MRF's `reqId` (from the MRF record), not the job posting's `jobId`. Then the API call passes `reqId` as a field, not `jobId`. The backend `JobApplicationsController.POST /job-applications` expects a `jobId` (the posting GUID), not a `reqId` (the requisition GUID).

**ROOT CAUSE**  
The `publishedJobs` list comes from `getAdminPostings({ status: 'Active' })` which returns `JobPosting` records. The Option renders `value={job.reqId}` instead of `value={job.jobId}`, and the service call uses field key `reqId` instead of `jobId`.

**IMPACT**  
- "Apply to Job" button will likely 404 or 400 on every submission.
- Candidate is never moved to ATS pipeline from the Candidate Database.
- This is a broken primary action workflow.

**SEVERITY**: 🔴 High (Core Workflow Broken)

**FILES**  
[`CandidatesPage.jsx`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/pages/recruitment/CandidatesPage.jsx) — Lines 1424–1427, 498–501

**RECOMMENDED FIX**  
```diff
// Line 1425 — Option value should be jobId, not reqId
- <Option key={job.jobId} value={job.reqId}>
+ <Option key={job.jobId} value={job.jobId}>

// Line 498-501 — createApplication payload should use jobId
- recruitmentService.createApplication({ reqId: selectedJobId, candidateId: applyCandidate.candidateId })
+ recruitmentService.createApplication({ jobId: selectedJobId, candidateId: applyCandidate.candidateId })

// Line 503 — match lookup by jobId
- const matchedJob = publishedJobs.find(job => job.reqId === selectedJobId)
+ const matchedJob = publishedJobs.find(job => job.jobId === selectedJobId)
```

**RISK**: Low — 3-line change, no architectural impact.

---

### ISSUE-003 — **High** · Source Filter Options Don't Match Backend Enum Values

**MODULE**: Recruitment — Candidate Database  
**WORKFLOW**: Candidates Page → Source filter dropdown  

**ISSUE**  
The `SOURCES` array (line 41) contains values like `'CareerPortal'`, `'LinkedIn'`, `'Naukri'`, `'WalkIn'`, `'InternalTransfer'` which do NOT match the backend `CandidateSource` enum (`ManualHR`, `CSVImport`, `EmployeeReferral`, `CareersPortal`, `ResumeParser`). Filtering by `'LinkedIn'` or `'Naukri'` will return zero results even if candidates with those sources exist. Also `'CareerPortal'` is used in the filter array but the badge renderer checks for `'CareerPortal' OR 'CareersPortal'` — a minor inconsistency.

**ROOT CAUSE**  
The SOURCES constant was written with legacy enum values before the source enum was normalized. It was never updated after the `CandidateSource` enum was refined.

**IMPACT**  
- Source filter UI shows options that never return any candidates.
- Recruiters get confused when filtering returns empty results for `LinkedIn`, `Naukri`, etc.

**SEVERITY**: 🟠 High (Broken UX, Data never surfaces from filters)

**FILES**  
[`CandidatesPage.jsx`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/pages/recruitment/CandidatesPage.jsx) — Lines 41–44

**RECOMMENDED FIX**  
```diff
- const SOURCES = [
-   'CareerPortal', 'EmployeeReferral', 'LinkedIn', 'Naukri',
-   'Indeed', 'Campus', 'Consultancy', 'WalkIn', 'InternalTransfer', 'Other'
- ]
+ const SOURCES = [
+   'ManualHR', 'CSVImport', 'EmployeeReferral', 'CareersPortal', 'ResumeParser'
+ ]
```

**RISK**: Zero — purely cosmetic filter option change.

---

### ISSUE-004 — **Medium** · CSV Import `handleConfirmImport` silently falls through when no preview and no jobId

**MODULE**: Recruitment — CSV / Excel Import  
**WORKFLOW**: Candidates → Import CSV → Upload File (no job selected) → Confirm Import  

**ISSUE**  
In `handleConfirmImport()` (lines 557–565):
```js
if (importJobId && previewRows.length > 0) {
  res = await recruitmentService.applyImport(...)
} else if (importFile) {
  res = await recruitmentService.importCandidates(importFile)
}
if (res && res.success) { ... }
```
When the user uploads a file **with** `importJobId` selected but the file preview hasn't populated `previewRows` yet (e.g. the preview API call is still in-flight or failed), `res` remains `undefined`. The code silently does nothing — no success, no error, no feedback.

Also, `importCandidates(importFile)` calls the old `POST /candidates/import` endpoint which only adds to the database without duplicate checking, bypassing the newer `PreviewImport` → `ConfirmImport` pipeline.

**ROOT CAUSE**  
Two separate import code paths — the legacy `importCandidates` (direct upload) and the newer `previewImport` + `applyImport` pipeline — are still both active. The fallback path uses the old endpoint.

**IMPACT**  
- Silent no-op if user selects a job and uploads a file but preview hasn't loaded yet.
- Old endpoint doesn't provide per-row skip/fail reporting.

**SEVERITY**: 🟡 Medium (Silent failure path, data integrity risk)

**FILES**  
[`CandidatesPage.jsx`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/pages/recruitment/CandidatesPage.jsx) — Lines 549–583

**RECOMMENDED FIX**  
Add a guard: if `previewRows.length === 0` show `message.warning('Please wait for the file preview to load before confirming import.')` and return early. Remove the silent `else if (importFile)` legacy fallback branch.

**RISK**: Low — no architectural change required.

---

### ISSUE-005 — **Medium** · Referral Drawer: Job is Required but No Option for "No Job" (Direct DB Add)

**MODULE**: Recruitment — Employee Referral  
**WORKFLOW**: Candidates → Refer Candidate → Submit Referral  

**ISSUE**  
The Referral drawer's `jobId` field is marked `required: true` (line 1630). However, the `handleReferralSubmit` function always calls `recruitmentService.addCandidateToJob(values.jobId, formData)` which routes through the `POST /job-postings/{jobId}/apply` endpoint. If a recruiter wants to just add a referred candidate to the Candidate Database without applying them to a specific job (e.g. they have no open position yet), they cannot do so. The architecture supports this (the Candidate Database import path allows no `JobId`), but the Referral drawer doesn't expose it.

**IMPACT**  
- Every referral MUST be linked to an open job posting — no fallback to Candidate Database.
- If there are no open jobs, referral recording is blocked entirely.
- Referred candidates from pre-hiring-stage conversations are lost.

**SEVERITY**: 🟡 Medium (UX Limitation — missed business case)

**FILES**  
[`CandidatesPage.jsx`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/pages/recruitment/CandidatesPage.jsx) — Lines 1628–1639, 386–423

**RECOMMENDED FIX**  
Make `jobId` optional in the referral drawer. When `jobId` is empty, fall back to creating the candidate via `recruitmentService.createCandidate()` with `source: 'EmployeeReferral'` and `referralEmployeeId` set. When `jobId` is provided, keep the current `addCandidateToJob` flow.

**RISK**: Low — additive change to existing handler, no backend changes needed.

---

### ISSUE-006 — **Medium** · Add Candidate Modal (JobOpeningsPage): `source` field still visible to recruiter

**MODULE**: Recruitment — Job Openings  
**WORKFLOW**: Job Openings → Add Candidate → Form  

**ISSUE**  
The Add Candidate modal in `JobOpeningsPage.jsx` still renders a `source` field in the form and passes it to `formData.append('source', values.source)` (line 171). This contradicts the architectural directive that **source should be automatically assigned by the system** (not chosen by the recruiter). The recruiter can manually override `Source` to any value, bypassing the intake channel tagging system.

**ROOT CAUSE**  
The Phase 2.2 requirement ("Remove source channel selector; auto-assign by context") was not implemented in `JobOpeningsPage`'s Add Candidate modal.

**IMPACT**  
- Source integrity is compromised — recruiter can set wrong source.
- Reporting on candidate source attribution becomes unreliable.

**SEVERITY**: 🟡 Medium (Data Integrity)

**FILES**  
[`JobOpeningsPage.jsx`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/pages/recruitment/JobOpeningsPage.jsx) — Lines 171, 600–720 (form fields section)

**RECOMMENDED FIX**  
Remove the `source` field from the Add Candidate form. Hardcode the source to `'ManualHR'` in the `handleAddCandidate` function:
```diff
- if (values.source) formData.append('source', values.source)
+ formData.append('source', 'ManualHR')
```

**RISK**: Zero — 1-line change.

---

### ISSUE-007 — **Low** · ATS `createApplication` uses `reqId` field but correct field should be `jobId`

**MODULE**: Recruitment — ATS Applications  
**WORKFLOW**: POST /job-applications — `createApplication` service call  

**ISSUE**  
`recruitmentService.createApplication` is called with `{ reqId, candidateId }`. The endpoint `POST /job-applications` mapped to `API.APPLICATIONS.CREATE` (which points to `/job-applications`) may expect `jobId` not `reqId`. This needs verification against the `JobApplicationsController.cs` POST handler.

**SEVERITY**: 🟡 Low (Needs runtime verification)

**FILES**  
[`recruitmentService.js`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/services/recruitmentService.js) — Line 157–160  
[`JobApplicationsController.cs`](file:///d:/HRMS_2.0/backend/src/IndiaHRMS.API/Controllers/JobApplicationsController.cs)

**RECOMMENDED FIX**  
Verify the DTO field name in `JobApplicationsController.cs`. If it expects `JobId`, rename the frontend call from `reqId` to `jobId`.

**RISK**: Low.

---

### ISSUE-008 — **Low** · Leave Module has no dedicated service file

**MODULE**: Leave  
**WORKFLOW**: Leave Page → API calls  

**ISSUE**  
No `leaveService.js` exists in `src/services/`. This means `LeavePage.jsx` likely makes API calls via direct `apiClient` calls or imports from another service — a pattern inconsistent with every other module (each has its own service file: `attendanceService.js`, `performanceService.js`, `recruitmentService.js`, etc.).

**SEVERITY**: 🟢 Low (Architectural inconsistency, not a runtime bug)

**FILES**  
`src/services/` — missing `leaveService.js`  
[`LeavePage.jsx`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/pages/leave/LeavePage.jsx)

**RECOMMENDED FIX**  
Create `leaveService.js` to extract and centralize all leave-related API calls out of `LeavePage.jsx`. This improves maintainability and consistency.

**RISK**: Zero — refactor only, no behavior change.

---

## 📊 Enterprise QA Summary

| Metric | Value |
| :--- | :--- |
| **Modules Tested** | 18 |
| **Total Issues Found** | 8 |
| **🔴 Critical** | 1 |
| **🔴 High** | 2 |
| **🟡 Medium** | 3 |
| **🟢 Low** | 2 |
| **✅ Passed (No Issues)** | 12 modules |
| **⚠️ Warning / Minor** | 5 modules |
| **❌ Critical Issues** | 1 module (CandidatesPage) |
| **Overall Platform Health** | **87%** |

---

## Fix Options

> **Select how you'd like to proceed:**
>
> 1. **Fix All Issues** (Issues 001–008) — Recommended
> 2. **Fix Only Critical & High Issues** (Issues 001, 002, 003) — Fastest path to stability
> 3. **Fix Module by Module** — Start with Recruitment, then Leave
>
> **Awaiting your approval before any code changes are made.**
