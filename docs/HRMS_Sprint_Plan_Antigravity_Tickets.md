# HRMS Gap-Closure Sprint Plan — Tickets for Antigravity

Based on the 12-ticket audit. Sequenced so nothing gets built on top of a decision or a data model that might still change. Paste each ticket into Antigravity as its own task; they reference actual table/file names discovered during the audit so it shouldn't need to re-explore the repo from scratch.

---

## Sprint 0 — Confirms & Decisions (do first, cheap, changes scope of later work)

Run these before anything else. Several later tickets are sized differently depending on the answers.

### 0.1 — Confirm shift-history correctness bug
```
In this HRMS codebase, `daily_attendance` (table: AttendanceRecords) does not 
store shift_id directly — it's derived from the employee's current shift 
assignment (EmployeeShifts). 

Test this directly: take an employee with existing AttendanceRecords, change 
their shift assignment (via /api/v1/roster or ShiftMasterPage), then query 
their historical AttendanceRecords from before the change. Does the shift 
info shown for those old records reflect the OLD shift or the NEW shift?

Report: bug confirmed yes/no, and if yes, show the exact query/code path 
that causes it (likely a JOIN against current EmployeeShifts instead of a 
point-in-time lookup).
```

### 0.2 — Confirm break-time deduction in worked-hours calc
```
In AttendanceProcessingService.cs, does the worked_hours calculation 
subtract any break/lunch time, or is it a raw checkout-minus-checkin 
duration? Report the exact formula used. This determines whether Ticket 3.1 
(Overtime calculation) needs a break-deduction step added, or whether hours 
are already net of breaks.
```

### 0.3 — Confirm offer CTC breakdown persistence
```
OffersPage.jsx has a "salary breakdown calculator" but OfferLetters.OfferedCTC 
is a single flat decimal. Trace where the breakdown calculator's output goes 
on save — is it: (a) discarded after generating the PDF, (b) stored somewhere 
not yet found (check for a separate CTC breakup table/JSON column), or 
(c) baked into the PDF only with no queryable record?

Report which of the three, with file/line references.
```

### 0.4 — Confirm BGV has a real workflow behind the gate
```
HiringService.cs gates candidate conversion on "Background Verification 
Passed." Find where this flag is set. Is there an actual BGV tracking screen/
workflow (check tracking, vendor status, multiple check types per M2 spec 
section 8.0), or is it a single manual checkbox/status field with no 
supporting process behind it?

Report: real workflow exists (describe it) vs. single manual flag (report 
where it's set and by whom).
```

### 0.5 — Confirm employee `/id` endpoint purpose and audit endpoint gap
```
1. Check the M1 spec (search for "GET /api/v1/employees/{emp_id}/id" context) 
   — is this an ID-card/badge generation endpoint, or something else? Report 
   what it's for based on surrounding spec text.
2. Does GET /api/v1/organization/audit-logs support filtering by employee ID 
   via query parameter? If yes, no new endpoint is needed — just a frontend 
   filter. If no, report what would need to change to add that filter.
```

**Output of Sprint 0** feeds directly into ticket sizing below — particularly 0.1 (may become a P0 bug fix, not just a backlog item), 0.2 (changes scope of the OT ticket), and 0.3 (changes scope of the offer ticket).

---

## Sprint 1 — Data Integrity Foundations (build before anything else touches this data)

These fix how data is captured/versioned. Doing them later means historical data can't be backfilled — every day of delay is data you can't recover.

### 1.1 — Raw punch log table
```
Add a new table `PunchLogs` to the Attendance module (EF Core migration + 
entity), separate from the existing AttendanceRecords summary table:

PunchLogs:
- PunchId (PK, Guid)
- EmployeeId (FK -> Employees)
- DeviceId (FK -> nullable for now, no AttendanceDevices table yet — use 
  nullable string/enum for capture source: Web, Mobile, Biometric, RFID)
- PunchType (enum: In, Out)
- PunchTimestamp (datetime2)
- Latitude, Longitude (nullable decimal, for mobile punches)
- IsFlagged (bool, default false)
- FlagReason (nullable string)

Update POST /api/v1/attendance/punch and POST /api/v1/attendance/mobile-punch 
to INSERT a new PunchLogs row on every punch (don't just overwrite 
AttendanceRecords.CheckIn/CheckOut — keep doing that too, for the processed 
summary, but also log the raw event).

Update AttendanceProcessingService to optionally read from PunchLogs when 
determining first-in/last-out for a day, so multiple punches in a day are 
handled correctly instead of last-write-wins.

Acceptance criteria:
- Punching in twice in one day creates 2 rows in PunchLogs, not 1 overwritten row
- AttendanceRecords.CheckIn reflects the first "In" punch and CheckOut 
  reflects the last "Out" punch of the day, derived from PunchLogs
- Existing punch/mobile-punch API contracts (request/response shape) unchanged
```

### 1.2 — Employment history versioning (SCD Type 2)
```
Currently dept_id, designation_id, grade_id, location_id, cost_center_id, 
reporting managers, employment_type, shift_id, payroll_group, notice_period 
are flattened onto the Employees table and updated in place, losing history.

Add a new table `EmployeeEmploymentHistory`:
- Id (PK, Guid)
- EmployeeId (FK -> Employees)
- DeptId, DesignationId, GradeId, LocationId, CostCenterId (FKs, same as Employees)
- ReportingManagerId, L2ReportingManagerId (FKs)
- EmploymentType, ShiftId, PayrollGroup, NoticePeriodDays
- EffectiveFrom (date, not null)
- EffectiveTo (date, nullable — null means current)

On every PUT /api/v1/employees/{id} that changes any of the above fields:
1. Close the current history row (set EffectiveTo = today)
2. Insert a new history row with EffectiveFrom = today and the new values
3. Continue updating the flattened fields on Employees as-is (don't remove 
   them — keep for backward compatibility with existing queries), so this is 
   purely additive

Backfill: for existing employees with no history rows yet, create one 
history row per employee using their current values with EffectiveFrom = 
their JoiningDate (best available approximation) and EffectiveTo = null.

Acceptance criteria:
- Changing an employee's department creates a new EmployeeEmploymentHistory 
  row and closes the old one
- A query "what department was employee X in on date Y" is answerable
- No existing employee-edit functionality breaks
```

### 1.3 — Punch freeze — make it real
```
POST /api/v1/attendance/freeze currently returns a stub message. Implement 
it for real:

1. Accept a date range or month/year + optional department/location filter
2. Set AttendanceRecords.IsFrozen = true for all matching records
3. Once IsFrozen = true, reject (403 or 409) any attempt to:
   - Submit a new regularization request for that date (POST /regularization)
   - Approve/reject a regularization for that date
   - Directly edit CheckIn/CheckOut via any admin edit path, if one exists
4. Add an unfreeze action restricted to a high-privilege role (e.g. 
   PAYROLL_ADMIN or SUPER_ADMIN only) for correcting genuine payroll errors, 
   with the action logged (who unfroze, when, why — reuse the audit trail 
   pattern from RequisitionAuditTrails if one exists for attendance, or add one)

Acceptance criteria:
- Freezing a month sets IsFrozen on all its AttendanceRecords
- Regularization submission/approval for a frozen date returns a clear error, 
  not a silent no-op
- Unfreeze requires elevated permission and is logged
```

### 1.4 — Shift-per-record fix (only if Ticket 0.1 confirms the bug)
```
[Only run if Sprint 0.1 confirmed historical records show the wrong shift 
after a reassignment.]

Add a ShiftId column directly to AttendanceRecords, populated at the time 
each record is created/processed (from the employee's shift assignment as 
of that attendance_date), rather than joined live against current 
EmployeeShifts.

Backfill existing AttendanceRecords using the EmployeeShifts row that was 
effective on each record's AttendanceDate (EffectiveFrom/EffectiveTo range), 
where determinable; flag any records where it can't be determined.

Acceptance criteria:
- Changing an employee's shift today does not alter the ShiftId shown on 
  their attendance records from before the change
```

---

## Sprint 2 — Well-Scoped Missing Features

Nothing here depends on a pending product decision — clear to build once Sprint 1 lands.

### 2.1 — Bulk employee upload (API + UI)
```
Build the M1 bulk employee upload flow end-to-end, currently missing entirely:

Backend:
- GET /api/v1/employees/bulk/template — returns an Excel/CSV template with 
  columns matching the employee creation form fields (reuse field list/
  validation rules already implemented in CreateEmployeePage.jsx and the 
  POST /employees validation logic)
- POST /api/v1/employees/bulk — accepts an uploaded file, validates each row 
  using the SAME validation rules as single employee creation (don't 
  duplicate/diverge validation logic — extract it into a shared validator if 
  it isn't already), and either commits all valid rows or returns a 
  row-by-row error report (row number, field, error message) without 
  committing any rows if there are hard errors — or supports partial commit 
  with a clear success/failure count, your choice, but make it consistent 
  with how the recruitment module's candidate import (mentioned as already 
  existing) handles this, for consistency.

Frontend:
- New page under employees/ : template download button, file upload with 
  drag-and-drop, a preview/validation-results table showing per-row errors 
  before final confirm, and a success summary after import

Acceptance criteria:
- Downloading the template gives a file with correct headers
- Uploading a file with 3 valid + 2 invalid rows shows exactly which 2 rows 
  failed and why, without silently dropping them
- Successfully imported employees appear in the employee list and get the 
  same downstream provisioning (user account, default shift assignment) as 
  a single manually-created employee
```

### 2.2 — Document expiry endpoint
```
Implement GET /api/v1/documents/expiring — returns EmployeeDocuments records 
where an expiry date field is within a configurable window (default 30 days, 
accept a ?days= query param). Requires Employee.View or higher permission, 
scoped to the fields document types that actually carry an expiry date 
(passport, work permit, etc. — check EmployeeDocuments schema for which 
DocType entries have an ExpiryDate populated).

Acceptance criteria:
- Returns documents expiring within the window, with employee name, doc 
  type, and expiry date
- Empty array (not error) when nothing is expiring
```

### 2.3 — Overtime auto-calculation
```
[Incorporate Sprint 0.2 findings — if break time isn't currently deducted 
from worked_hours, fix that as part of this ticket, not after.]

Replace the current stub GET /api/v1/attendance/overtime with real logic:
- For each AttendanceRecord, compute OT as (worked hours beyond shift's 
  scheduled hours), where worked hours = (CheckOut - CheckIn) minus break_mins 
  [add break_mins to ShiftMasters if Sprint 0.2 confirms it's missing]
- Only count OT for hours worked, not for late-arrival makeup (don't let 
  someone create OT by working through what should have been their normal 
  shift after arriving late — clarify this edge case is handled per whatever 
  policy AttendanceProcessingService already implies for late/half-day)
- Store computed OT on AttendanceRecords.OvertimeHours (column already exists)
- Wire OvertimePage.jsx to display real data instead of the current Empty state

Acceptance criteria:
- An employee working 2 hours past shift end with no break shows OT = 2 hours 
  (minus break deduction as applicable)
- OvertimePage shows real per-employee OT data with date range filtering
```

### 2.4 — Candidate blacklist flag
```
Add a real "blacklisted" concept to Candidates, distinct from CandidateStatus 
(Active/Inactive/Archived):
- Blacklisted (bool, default false)
- BlacklistReason (nullable string)
- BlacklistedBy (FK -> Users, nullable)
- BlacklistedAt (nullable datetime2)

Add an endpoint/UI action to set this (likely restricted to 
RECRUITMENT_MGR/HR_ADMIN role). Critically: when a blacklisted candidate 
applies to a new job posting or is manually added to a new pipeline, surface 
a clear warning to the recruiter (don't silently block — some orgs want to 
override with justification, but they must see the flag).

Acceptance criteria:
- Marking a candidate blacklisted persists independent of their pipeline status
- A blacklisted candidate applying to any job shows a warning banner/badge 
  to the recruiter reviewing the application
```

---

## Sprint 3 — Decision-Gated Builds

Do not start these until the corresponding decision (from the priority-3 list) is actually made. Sizing below assumes the decision has already landed.

### 3.1 — Maker-checker approval workflow for sensitive fields
```
[Requires: decision on which fields are in scope, and whether a new 
permission split (EDIT_DIRECT vs EDIT_REQUEST_ONLY) is wanted.]

Add a PendingEmployeeChanges table capturing: EmployeeId, ChangedFields (JSON 
of field->proposed value), RequestedBy, RequestedAt, Status (Pending/
Approved/Rejected), ReviewedBy, ReviewedAt, RejectionReason.

For users without direct-edit permission on the in-scope sensitive fields 
[insert final field list from the decision], PUT /employees/{id} should 
create a PendingEmployeeChanges row instead of applying the change directly, 
and the employee record should NOT reflect the proposed change until approved.

Add an approval queue screen (reuse the pattern from 
RegularizationQueuePage.jsx / JobRequisitions approval flow for consistency) 
where an approver (role: [insert from decision]) sees pending changes, sees 
old value vs proposed value side by side, and approves/rejects with optional 
comment.

Acceptance criteria:
- A user without direct-edit rights on [in-scope fields] submitting a change 
  creates a pending request, does not alter the live record
- An approver sees old vs. new value clearly and can approve/reject
- Approval applies the change and closes the request; rejection discards it 
  and notifies the requester
```

### 3.2 — Muster roll / statutory register export
```
[Requires: confirmation of which statutory formats are actually needed for 
your jurisdiction — check M3 spec section 8.0 "Statutory Registers & Forms 
Auto-Generated" for the specific list, and confirm with stakeholder which of 
those are legally required now vs. later.]

Replace stub GET /api/v1/attendance/reports with real generation of 
[insert confirmed register types] for a given month/department, pulling from 
AttendanceRecords (post-freeze data only, to avoid generating statutory 
reports off data that could still change). Export as PDF/Excel matching 
statutory format requirements.

Wire AttendanceReportsPage.jsx to real generation with filters and download.

Acceptance criteria:
- Selecting a frozen month + department generates a downloadable register 
  matching the required statutory format
- Attempting to generate for a non-frozen (still-editable) period shows a 
  warning that data may still change
```

### 3.3 — PAN/IFSC verification integration
```
[Requires: vendor/API selection — do not start until a KYC verification 
provider is chosen and API credentials are available.]

Implement POST /api/v1/verify/pan and POST /api/v1/verify/ifsc as thin 
wrappers around the chosen vendor API, updating 
EmployeeBankDetails.VerificationStatus (and the PAN equivalent on Employees) 
based on the response. Handle vendor downtime gracefully (don't block 
employee creation/edit on verification — treat it as an async status update).

Acceptance criteria:
- Submitting a valid PAN/IFSC triggers verification and updates status 
  within [agreed SLA]
- Vendor API failure doesn't block the underlying save operation, just 
  leaves verification status as Pending with a retry path
```

### 3.4 — Offer CTC breakdown persistence
```
[Only needed if Sprint 0.3 confirms the breakdown is currently discarded/
not queryable.]

Add a structured CtcBreakup table or JSON column on OfferLetters (Basic, HRA, 
Allowances, etc. — match whatever fields OffersPage.jsx's calculator already 
computes), populated when an offer is generated, so past offers' component-
wise structure can be retrieved/audited later, not just the flat total.

Acceptance criteria:
- Generating an offer persists the full breakdown, retrievable via 
  GET /api/v1/offers/{id}
- Existing OfferedCTC total field stays in sync with the sum of the breakdown
```

---

## Sequencing summary

| Sprint | Focus | Why this order |
|---|---|---|
| **0** | Confirms & decisions | Cheap, fast, changes scope of everything below |
| **1** | Data integrity (punch logs, employment history, freeze, shift-per-record) | Retrofitting after data accumulates is expensive or impossible; nothing else should build on unstable data models |
| **2** | Well-scoped missing features (bulk upload, doc expiry, OT calc, blacklist) | No open decisions blocking these; independent of each other, can parallelize across devs |
| **3** | Decision-gated builds (approval workflow, muster roll, KYC integration, CTC breakup) | Genuinely blocked until product/vendor decisions land — don't let dev capacity sit idle waiting; use this time for Sprint 1/2 |

Everything in **Priority 4 / quick confirms** from the audit is folded into Sprint 0.
