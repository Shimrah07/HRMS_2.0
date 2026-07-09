# HRMS — MASTER PROJECT SPECIFICATION
## Business Requirements + Technical Implementation Guide
### .NET 8 Web API + React 18 + SQL Server + RBAC + JWT

> **AI IDE Instruction (IMPORTANT — Read First):**
> This is a COMPLETE, SELF-CONTAINED specification. It includes:
> - Section A: Business Requirement Document (WHY and WHAT to build)
> - Section B: Technical Implementation Specification (HOW to build it)
>
> **Generate the ENTIRE project in one go.** Do not skip any module from Section A
> or any API/component from Section B. Every BR (Business Requirement) listed in
> Section A must be implemented in code as described in Section B.
>
> Cross-references are marked as `→ [IMPL: ...]` in Section A
> and `→ [BRD: ...]` in Section B so you can trace requirements to code.

---

# SECTION A — BUSINESS REQUIREMENT DOCUMENT (BRD)

> **Document Type:** Business Requirement Document
> **Version:** 1.0 — 2025
> **Target:** Indian Enterprises (50–5000 Employees)
> **Compliance:** EPF, ESI, TDS, Professional Tax, LWF, Gratuity, Bonus Act, Maternity Act, POSH, DPDP Act 2023

---

## A1. EXECUTIVE SUMMARY

### A1.1 Purpose
एक Indian company के लिए HRMS जो HR से related सभी processes को automate करे — hiring से retirement तक। Manual work eliminate करे, statutory compliance ensure करे, और employees को self-service दे।

### A1.2 Key Numbers

| Metric | Value |
|---|---|
| Core Modules | 12 |
| Business Requirements | 150+ |
| Indian Compliance Acts | 10+ |
| User Portals | 3 (Super Admin, Manager, Employee) |
| User Roles | 10 (RBAC) |
| Target Company Size | 50–5000 employees |
| Supported States (for PT/LWF) | All 28 states + 8 UTs |

### A1.3 Business Objectives
1. Eliminate manual/paper-based HR processes
2. Ensure 100% Indian statutory compliance (PF, ESI, TDS, PT, LWF, Gratuity, Bonus)
3. Reduce monthly payroll processing time from days to hours
4. Provide employees real-time 24/7 self-service access via web + mobile
5. Enable data-driven HR decisions through analytics dashboard

---

## A2. STAKEHOLDERS & USER TYPES

| Stakeholder | System Role | Primary Need |
|---|---|---|
| CEO / MD | Sponsor (SUPER_ADMIN viewer) | Compliance, cost control, workforce visibility |
| HR Head | HR_ADMIN | End-to-end HR process management |
| HR Team | HR_MANAGER | Employee data, payroll inputs, compliance |
| Finance Team | FINANCE_VIEWER | Payroll costs, statutory payment reports |
| Dept Managers | DEPT_MANAGER | Team attendance, leave approvals, appraisals |
| Employees | EMPLOYEE | Self-service: salary slips, leaves, profile |
| Payroll Admin | PAYROLL_ADMIN | Payroll processing, statutory filings |
| IT Admin | IT_ADMIN | User accounts, system configuration |
| Auditors | AUDITOR | Compliance reports, read-only audit trails |
| Compliance Officer | HR_MANAGER | POSH, labour law, DPDP compliance |

---

## A3. MODULE-WISE BUSINESS REQUIREMENTS

> Each module has a Req ID, requirement description, and priority.
> **→ [IMPL: Module Name]** points to the technical implementation in Section B.

---

### MODULE M1 — Employee Master
→ [IMPL: Employee Controller, EmployeesTable, EmployeeDocumentsTable]

**Business Need:** Single source of truth for all employee data.

| Req ID | Requirement | Priority |
|---|---|---|
| M1-BR-01 | Unique Employee ID auto-generation (company-prefix + sequence) | High |
| M1-BR-02 | Complete personal profile: Name, DOB, Gender, Blood Group, Marital Status | High |
| M1-BR-03 | Official details: Dept, Designation, Grade, Location, Cost Center, Reporting Manager | High |
| M1-BR-04 | Contact info: personal email, official email, mobile, emergency contact | High |
| M1-BR-05 | Address: Permanent + Current with pincode, city, state | High |
| M1-BR-06 | Government IDs: Aadhar (AES-256 encrypted), PAN (encrypted), UAN, ESI No., Passport | High |
| M1-BR-07 | Document upload and verification: Aadhar, PAN, Photo, Degree, Exp letters | High |
| M1-BR-08 | Bank account: account number (encrypted), IFSC, type, primary flag | High |
| M1-BR-09 | Education history: Degree, institution, year, percentage | Medium |
| M1-BR-10 | Work experience history: previous employers, roles, duration | Medium |
| M1-BR-11 | PF nominee details: name, relation, percentage split | High |
| M1-BR-12 | Employment lifecycle: Joining → Transfer → Promotion → Exit | High |
| M1-BR-13 | Probation tracking + manager confirmation workflow + reminder notifications | High |
| M1-BR-14 | Company directory: searchable by name, dept, location, designation | Medium |
| M1-BR-15 | Org chart: hierarchical tree of reporting structure | Medium |

---

### MODULE M2 — Recruitment (ATS)
→ [IMPL: Recruitment Controller, JobRequisitionsTable, CandidatesTable, OffersTable]

**Business Need:** Vacancy se offer letter tak — ek platform pe.

| Req ID | Requirement | Priority |
|---|---|---|
| M2-BR-01 | Manpower requisition with job description, headcount, salary range | High |
| M2-BR-02 | Multi-level requisition approval: Dept Head → HR → Finance | High |
| M2-BR-03 | Candidate database with resume upload | High |
| M2-BR-04 | Resume parsing: extract name, email, phone, experience from PDF | Medium |
| M2-BR-05 | Interview scheduling: round, date, interviewer, mode (F2F/Video) | High |
| M2-BR-06 | Interview feedback: rating per competency + overall recommendation | High |
| M2-BR-07 | Stage tracking: Applied → Shortlisted → Interview L1/L2/HR → Offer → Joined | High |
| M2-BR-08 | Offer letter auto-generation from configurable template | High |
| M2-BR-09 | Offer acceptance/rejection/withdrawal tracking with expiry date | High |
| M2-BR-10 | Auto-convert accepted offer → new employee record → trigger onboarding | High |
| M2-BR-11 | Background verification status tracking | Medium |
| M2-BR-12 | Source tracking: Naukri, LinkedIn, Employee Referral, Walk-in, Campus | Medium |
| M2-BR-13 | Hiring analytics: funnel, time-to-hire, cost-per-hire | Medium |

---

### MODULE M3 — Onboarding
→ [IMPL: Employee Controller /onboarding endpoints, OnboardingChecklistTable]

**Business Need:** Day 1 experience smooth ho, koi document ya task miss na ho.

| Req ID | Requirement | Priority |
|---|---|---|
| M3-BR-01 | Digital onboarding checklist: auto-assigned tasks based on dept/role | High |
| M3-BR-02 | Document collection checklist with upload portal | High |
| M3-BR-03 | Pre-joining portal: new employee fills data before Day 1 | Medium |
| M3-BR-04 | Asset allocation tracking: laptop, ID card, access card | High |
| M3-BR-05 | IT account creation request trigger | Medium |
| M3-BR-06 | Buddy/mentor assignment | Low |
| M3-BR-07 | Induction training schedule auto-assignment | Medium |
| M3-BR-08 | Probation period auto-set from offer letter / company policy | High |
| M3-BR-09 | Probation end reminder: email to manager 30 days before | High |
| M3-BR-10 | Onboarding completion percentage dashboard | Medium |

---

### MODULE M4 — Attendance & Time Management
→ [IMPL: Attendance Controller, AttendanceRecordsTable, ShiftMastersTable]

**Business Need:** Accurate time tracking linked to payroll, multiple input methods.

| Req ID | Requirement | Priority |
|---|---|---|
| M4-BR-01 | Biometric device integration via file import (CSV/Excel punch data) | High |
| M4-BR-02 | Mobile app geo-fenced check-in/check-out with location capture | High |
| M4-BR-03 | Manual attendance entry by HR for exceptions | High |
| M4-BR-04 | Shift master: start/end time, grace period, night shift flag | High |
| M4-BR-05 | Employee shift assignment with effective date | High |
| M4-BR-06 | Late mark and early exit rules (configurable thresholds) | High |
| M4-BR-07 | Overtime calculation: Factories Act compliant (1.5x/2x, configurable) | High |
| M4-BR-08 | WFH marking with manager approval | High |
| M4-BR-09 | Attendance regularization: employee request → manager approval | High |
| M4-BR-10 | Monthly summary: Present/Absent/Leave/Holiday/WFH/LWP counts | High |
| M4-BR-11 | Location-wise holiday calendar: National + State + Company holidays | High |
| M4-BR-12 | Weekly off configuration: Sunday, Saturday, alternate Saturday | High |
| M4-BR-13 | Attendance auto-feeds paid days into payroll calculation | High |
| M4-BR-14 | Attendance reports: daily, monthly, exceptions, dept-wise | High |

---

### MODULE M5 — Leave Management
→ [IMPL: Leave Controller, LeaveTypesTable, LeaveBalancesTable, LeaveApplicationsTable]

**Business Need:** Online leave apply/approve, Indian labour law compliant leave types.

| Req ID | Requirement | Priority |
|---|---|---|
| M5-BR-01 | Leave types: EL, CL, SL, ML (26 weeks), PL, Comp-off, LWP | High |
| M5-BR-02 | Leave policy config: max days/year, carry-forward rules, accrual schedule | High |
| M5-BR-03 | Monthly EL accrual: 1.5 days/month after 1 year service | High |
| M5-BR-04 | CL/SL front-loaded on January 1st each year | High |
| M5-BR-05 | Online apply with date picker, reason, and attachment | High |
| M5-BR-06 | Manager approve/reject with comments + employee notification | High |
| M5-BR-07 | Leave cancellation by employee with approval | High |
| M5-BR-08 | Year-end carry-forward: max 30 EL, CL lapses | High |
| M5-BR-09 | Leave encashment: EL balance × (Basic/26) on separation | High |
| M5-BR-10 | Maternity Benefit Act 1961: 26 weeks paid ML auto-entitlement | High |
| M5-BR-11 | Holiday auto-deduction if holiday within leave period | High |
| M5-BR-12 | Team leave calendar: manager view of team availability | Medium |
| M5-BR-13 | Leave reports: utilization, balance, LWP summary, dept-wise | High |

---

### MODULE M6 — Payroll Engine (India-Specific)
→ [IMPL: Payroll Controller, PayrollCalculationService, all statutory calculation methods]

**Business Need:** Compliant payroll with all Indian statutory deductions, minimal manual work.

| Req ID | Requirement | Priority |
|---|---|---|
| M6-BR-01 | CTC structure: Basic, HRA, DA, Conveyance, Special Allowance, LTA, Perks | High |
| M6-BR-02 | PF: Employee 12% + Employer 12% of Basic (wage ceiling ₹15,000) | High |
| M6-BR-03 | ESI: Employee 0.75% + Employer 3.25% (if Gross ≤ ₹21,000) | High |
| M6-BR-04 | TDS: Income Tax per slabs — New Regime default, employee can choose Old | High |
| M6-BR-05 | Professional Tax: state-wise slabs (MH, KA, WB, TN, AP, TS, etc.) | High |
| M6-BR-06 | Labour Welfare Fund (LWF): state-specific, June + December | High |
| M6-BR-07 | Gratuity provision: (Basic+DA) × 15 ÷ 26 ÷ 12 per month | High |
| M6-BR-08 | Statutory Bonus: 8.33% of Basic (Bonus Act, salary ≤ ₹21,000) | High |
| M6-BR-09 | LWP deduction: Gross ÷ Working days × LWP days | High |
| M6-BR-10 | Overtime addition: auto-import from attendance module | High |
| M6-BR-11 | Maker-Checker: Payroll Admin processes, HR Head / Finance approves | High |
| M6-BR-12 | Payroll lock after approval — no edits allowed | High |
| M6-BR-13 | Salary slip PDF: logo, employee details, earnings table, deductions, net pay, YTD | High |
| M6-BR-14 | Bank transfer file: NEFT format (configurable per bank) | High |
| M6-BR-15 | Form 16 Part A + B generation (annual) | High |
| M6-BR-16 | Form 24Q quarterly TDS return data | High |
| M6-BR-17 | PF monthly ECR file for EPFO portal | High |
| M6-BR-18 | ESI monthly challan | High |
| M6-BR-19 | Tax declaration: Form 12BB online by employee + investment proof upload | High |
| M6-BR-20 | New vs Old Tax Regime comparison tool | Medium |
| M6-BR-21 | Salary revision: increment letter, effective date, payroll auto-update | High |
| M6-BR-22 | Full & Final payroll on exit: pending salary + leave encashment + gratuity - deductions | High |
| M6-BR-23 | Arrears processing for delayed increments | Medium |

---

### MODULE M7 — Performance Management (PMS)
→ [IMPL: Performance Controller, AppraisalCyclesTable, EmployeeGoalsTable, PerformanceReviewsTable]

| Req ID | Requirement | Priority |
|---|---|---|
| M7-BR-01 | Appraisal cycle: Annual, Half-yearly, Quarterly — configurable | High |
| M7-BR-02 | Goal setting: KRA/KPI with target, weightage, description | High |
| M7-BR-03 | Mid-year review: update actuals vs targets | Medium |
| M7-BR-04 | Year-end: self-rating + manager rating per KPI | High |
| M7-BR-05 | 360° feedback from peers, subordinates, internal customers | Medium |
| M7-BR-06 | Overall rating = weighted average of all KPI ratings | High |
| M7-BR-07 | Bell-curve normalization / calibration by HR | Medium |
| M7-BR-08 | Rating → increment % mapping (configurable matrix) | High |
| M7-BR-09 | Performance Improvement Plan (PIP) with milestones and tracking | High |
| M7-BR-10 | Multi-year performance history per employee | Medium |
| M7-BR-11 | Performance analytics: distribution, top/low performers | Medium |

---

### MODULE M8 — Training & Development
→ [IMPL: Training Controller, TrainingProgramsTable, TrainingSchedulesTable, TrainingNominationsTable]

| Req ID | Requirement | Priority |
|---|---|---|
| M8-BR-01 | Training Need Identification (TNI) from appraisal gaps | High |
| M8-BR-02 | Training program catalog: internal/external, online/offline | High |
| M8-BR-03 | Schedule training sessions with date, venue, trainer | High |
| M8-BR-04 | Employee nomination by HR/Manager | High |
| M8-BR-05 | Post-training feedback and rating | Medium |
| M8-BR-06 | Certificate upload + expiry tracking (statutory trainings) | High |
| M8-BR-07 | Mandatory training compliance flag | High |
| M8-BR-08 | Training cost per program and per employee | Medium |
| M8-BR-09 | Skill matrix: employee skills vs required skills | Medium |

---

### MODULE M9 — Employee Self-Service (ESS)
→ [IMPL: ESS pages, /my-profile, /my-attendance, /my-leaves, /my-slips endpoints]

| Req ID | Requirement | Priority |
|---|---|---|
| M9-BR-01 | Profile view + limited self-update (contact, address, bank) | High |
| M9-BR-02 | Salary slip download: any month, any year | High |
| M9-BR-03 | Leave apply, check balance, view history, cancel | High |
| M9-BR-04 | Attendance view: monthly calendar with color-coded status | High |
| M9-BR-05 | Attendance regularization request | High |
| M9-BR-06 | Tax declaration (Form 12BB) online + investment proof upload | High |
| M9-BR-07 | Document download: offer letter, appointment, confirmation, Form 16 | High |
| M9-BR-08 | Reimbursement and expense claim submission | Medium |
| M9-BR-09 | Helpdesk ticket: raise IT/HR queries | Medium |
| M9-BR-10 | Company directory + org chart | Low |
| M9-BR-11 | Mobile app (iOS + Android): all ESS features | High |
| M9-BR-12 | Push notifications: leave status, salary slip ready, announcements | Medium |

---

### MODULE M10 — Separation & Exit Management
→ [IMPL: Separation Controller, SeparationsTable, NoDuesClearingTable, FnFSettlementsTable]

| Req ID | Requirement | Priority |
|---|---|---|
| M10-BR-01 | Employee submits resignation online with proposed last working day | High |
| M10-BR-02 | Manager + HR acknowledgment workflow | High |
| M10-BR-03 | Notice period calculation + buyout/waiver option | High |
| M10-BR-04 | Exit interview (online questionnaire) | Medium |
| M10-BR-05 | Multi-dept no-dues clearance checklist (IT, Finance, Admin, Library) | High |
| M10-BR-06 | F&F calculation: pending salary + leave encashment + gratuity + bonus - deductions | High |
| M10-BR-07 | PF withdrawal / transfer form generation (Form 19, 10C) | High |
| M10-BR-08 | Experience letter + Relieving letter auto-generation | High |
| M10-BR-09 | Termination and absconding handling with documentation | High |
| M10-BR-10 | Attrition analytics: exit reasons, dept-wise, monthly trend | Medium |

---

### MODULE M11 — Reports & Analytics
→ [IMPL: Reports Controller, all /reports/* endpoints]

| Req ID | Requirement | Priority |
|---|---|---|
| M11-BR-01 | Headcount: total, active, on-notice, by dept/location/grade/type | High |
| M11-BR-02 | Attrition: monthly/quarterly/annual, by dept, by reason | High |
| M11-BR-03 | Payroll cost: gross/net/CTC, component-wise, month-wise | High |
| M11-BR-04 | Attendance summary: present%, absent%, late%, WFH%, OT hours | High |
| M11-BR-05 | Leave utilization: type-wise, dept-wise, LWP summary | High |
| M11-BR-06 | Statutory reports: PF ECR, ESI challan, TDS 24Q, PT remittance | High |
| M11-BR-07 | Hiring report: pipeline, TAT, source analysis | Medium |
| M11-BR-08 | Performance: rating distribution bell curve, dept-wise | Medium |
| M11-BR-09 | HR KPI dashboard: real-time configurable metric cards + charts | High |
| M11-BR-10 | Custom report builder: field selector + filters + export | Medium |
| M11-BR-11 | Export all reports to Excel, CSV, PDF | High |
| M11-BR-12 | Manpower budget vs actual | Medium |

---

### MODULE M12 — Organization & Compliance Management
→ [IMPL: Company/Dept/Designation/Compliance Controllers, AuditLogsTable]

| Req ID | Requirement | Priority |
|---|---|---|
| M12-BR-01 | Company master: CIN, PAN, TAN, GSTIN, address, logo | High |
| M12-BR-02 | Department: hierarchy with parent-child, HOD assignment | High |
| M12-BR-03 | Designation: grade, level, pay band | High |
| M12-BR-04 | Location: state mapping (for PT/LWF), head office flag | High |
| M12-BR-05 | Cost center management | Medium |
| M12-BR-06 | POSH Act 2013: complaint registration, ICC committee, 90-day resolution, annual report | High |
| M12-BR-07 | Grievance management: raise, track, resolve | High |
| M12-BR-08 | Disciplinary action workflow: show cause → hearing → order → appeal | High |
| M12-BR-09 | Audit trail: all changes logged with user, old value, new value, timestamp, IP | High |
| M12-BR-10 | DPDP Act 2023: employee consent management, data access log, deletion requests | High |

---

## A4. INDIAN STATUTORY COMPLIANCE DETAILS

### EPF Act 1952
- Employee: 12% of Basic (wage ceiling ₹15,000 → max ₹1,800/month)
- Employer: EPS 8.33% (capped ₹1,250), EPF balance, EDLI 0.5%, Admin 0.5%
- Monthly ECR file for EPFO portal
- PF transfer Form 13, withdrawal Form 19/10C

### ESI Act 1948
- Applicable: Gross ≤ ₹21,000/month
- Employee: 0.75%, Employer: 3.25%
- Monthly challan, half-yearly return, IP number generation

### Income Tax Act 1961 (TDS)
- New Tax Regime default (FY 2024-25 onwards)
- Old Tax Regime on employee request
- Monthly TDS = (Annual Tax Liability) ÷ 12
- Form 12BB, Form 16, Form 12BA, 24Q quarterly

### Professional Tax (State-wise)
```
Maharashtra: Up to ₹7,500 → Nil; ₹7,501–₹10,000 → ₹175; Above ₹10,000 → ₹200 (₹300 in Feb)
Karnataka:   Up to ₹15,000 → Nil; ₹15,001–₹35,000 → ₹150; ₹35,001+ → ₹200
West Bengal: Slab-based monthly
Tamil Nadu:  ₹21,000–₹30,000 → ₹135; ₹30,001–₹45,000 → ₹315; Above → ₹690 (half-yearly)
Telangana:   ₹15,001–₹20,000 → ₹150; Above ₹20,000 → ₹200
```

### Gratuity Act 1972
- Eligibility: 5+ years continuous service
- Formula: (Last Basic + DA) × 15 ÷ 26 × Years of Service
- Maximum ceiling: ₹20 lakhs

### Bonus Act 1965
- Applicable: Salary ≤ ₹21,000/month; 30+ working days in year
- Minimum: 8.33% of annual Basic, Maximum: 20%

### Maternity Benefit Act 1961
- 26 weeks for first 2 deliveries; 12 weeks for 3rd+
- 12 weeks for adoption; medical bonus ₹3,500 if no facility

### POSH Act 2013 — Mandatory Compliance
- ICC committee for companies with 10+ employees
- Complaint → inquiry → report within 90 days
- Annual report to District Officer

### DPDP Act 2023
- Consent before processing personal data
- Data minimization and purpose limitation
- Employee right to correction and erasure
- Breach notification within 72 hours

---

## A5. BUSINESS PROCESS FLOWS

### A5.1 Employee Lifecycle
```
Job Opening → Requisition Approval → Job Posting → Resume Screening →
Interviews → Offer → Background Check → Pre-Joining → Day 1 Onboarding →
Probation → Confirmation → Active Employment
(Attendance ↔ Leave ↔ Payroll ↔ PMS ↔ Training — all linked) →
Resignation/Retirement → Notice Period → No-Dues → F&F → Exit
```

### A5.2 Monthly Payroll Cycle
```
Step 1: Attendance finalized (by 28th of month)
Step 2: Leave reconciliation (LWP days confirmed)
Step 3: Salary revision / new joiner / exit inputs
Step 4: Payroll Admin initiates run
Step 5: Auto-calculation (TDS, PF, ESI, PT, LWF, OT, LWP deduction)
Step 6: Payroll register review
Step 7: HR Head / Finance approval (Maker-Checker)
Step 8: Bank file export + upload to bank portal
Step 9: Salary slips emailed + available on ESS
Step 10: PF/ESI challan generated → payment
Step 11: TDS deposited by 7th of next month
```

### A5.3 Leave Flow
```
Employee Apply → Manager Notified (email + push) →
Manager Approve/Reject → Employee Notified →
Leave Balance Updated → Attendance Updated → Payroll Auto-adjusted
```

### A5.4 Appraisal Flow
```
HR Opens Cycle → Employee Sets Goals (with manager sign-off) →
Mid-Year: Update Actuals → Year-End: Self-Rating →
Manager Rating → HR Calibration / Normalization →
Final Rating Published → Increment Letter Generated →
Payroll Updated with New Salary
```

### A5.5 Separation Flow
```
Employee Submits Resignation → Manager Acknowledges → HR Accepts →
Notice Period Tracked → Exit Interview (online) →
No-Dues Initiated (all depts clear online) →
F&F Calculated & Approved → Final Payment Processed →
PF Transfer/Withdrawal Initiated →
Experience Letter + Relieving Letter Generated →
User Account Deactivated
```

---

## A6. IMPLEMENTATION PHASES

| Phase | Duration | Modules | Milestone |
|---|---|---|---|
| **Phase 1** | Month 1–3 | Employee Master, Org Setup, Attendance, Leave, Basic Payroll | Core HR Live |
| **Phase 2** | Month 4–6 | Full Statutory (PF/ESI/TDS/Form 16), ESS Portal, Mobile App, Onboarding | Compliance + Self-Service |
| **Phase 3** | Month 7–10 | Recruitment ATS, Performance PMS, Training LMS, Separation F&F | Talent Management |
| **Phase 4** | Month 11–15 | HR Analytics Dashboard, Custom Reports, POSH, Grievance, Audit | Analytics + Compliance |
| **Phase 5** | Month 16–18 | AI Chatbot, Predictive Attrition, Tally/SAP Integration, Job Portal APIs | Smart HRMS |

---

## A7. GLOSSARY

| Term | Meaning |
|---|---|
| CTC | Cost to Company |
| EPF/PF | Employees' Provident Fund |
| ESI/ESIC | Employees' State Insurance Corporation |
| TDS | Tax Deducted at Source |
| PT | Professional Tax |
| LWF | Labour Welfare Fund |
| UAN | Universal Account Number (PF) |
| LWP | Leave Without Pay |
| EL/CL/SL/ML/PL | Earned/Casual/Sick/Maternity/Paternity Leave |
| F&F | Full and Final Settlement |
| TNI | Training Need Identification |
| PMS | Performance Management System |
| KRA/KPI | Key Result Area / Key Performance Indicator |
| PIP | Performance Improvement Plan |
| ATS | Applicant Tracking System |
| ICC | Internal Complaints Committee (POSH) |
| ECR | Electronic Challan cum Return (PF) |
| RBAC | Role-Based Access Control |
| ESS | Employee Self-Service |
| FY | Financial Year (April–March in India) |
| DPDP | Digital Personal Data Protection Act 2023 |
| POSH | Prevention of Sexual Harassment Act 2013 |

---
---

# SECTION B — TECHNICAL IMPLEMENTATION SPECIFICATION

> **AI IDE Instruction:** Every requirement from Section A must map to code in this section.
> Build in the order listed. Generate complete, working code — not stubs or TODOs.

---

## B1. PROJECT OVERVIEW

| Field | Value |
|---|---|
| Project Name | IndiaHRMS |
| Backend | ASP.NET Core 8 Web API (C#) |
| Frontend | React 18 + TypeScript + Vite |
| Database | Microsoft SQL Server 2022 |
| ORM | Entity Framework Core 8 |
| Auth | JWT Bearer Token (RS256) + Refresh Token |
| Authorization | Role-Based Access Control (RBAC) with Permissions |
| UI Library | Ant Design (antd) v5 |
| State Management | Zustand |
| HTTP Client | Axios with request/response interceptors |
| Styling | Tailwind CSS + Ant Design tokens |
| Real-time | SignalR (notifications hub) |
| Background Jobs | Hangfire (payroll processing, leave accrual) |
| File Storage | Local filesystem (Azure Blob Storage ready) |
| Logging | Serilog → SQL Server + Console sinks |
| API Docs | Swagger / OpenAPI 3.0 |
| Caching | Redis (permissions, org chart, holidays) |
| PDF Generation | QuestPDF (salary slips, Form 16, letters) |
| Excel Export | ClosedXML (all report exports) |

---

## B2. SOLUTION STRUCTURE
→ [BRD: All modules A3.M1 through A3.M12]

```
IndiaHRMS/
├── backend/
│   ├── IndiaHRMS.sln
│   ├── src/
│   │   ├── IndiaHRMS.API/
│   │   │   ├── Controllers/          # All API controllers
│   │   │   ├── Middleware/           # Exception, Audit, Logging, RateLimit
│   │   │   ├── Filters/              # Permission attribute filter
│   │   │   ├── Hubs/                 # SignalR NotificationHub
│   │   │   ├── Extensions/           # ServiceCollection extensions
│   │   │   └── Program.cs
│   │   ├── IndiaHRMS.Application/
│   │   │   ├── Commands/             # MediatR commands (write ops)
│   │   │   ├── Queries/              # MediatR queries (read ops)
│   │   │   ├── DTOs/                 # Request/Response DTOs per module
│   │   │   ├── Services/             # PayrollCalc, LeaveAccrual, PDF, etc.
│   │   │   ├── Validators/           # FluentValidation per DTO
│   │   │   ├── Mappings/             # AutoMapper profiles
│   │   │   └── Interfaces/           # IRepository, ICurrentUser, IEmailService
│   │   ├── IndiaHRMS.Domain/
│   │   │   ├── Entities/             # All EF Core entity classes
│   │   │   ├── Enums/                # Status, Type, Gender, etc. enums
│   │   │   ├── Events/               # Domain events
│   │   │   └── Constants/            # Permission codes, role codes
│   │   ├── IndiaHRMS.Infrastructure/
│   │   │   ├── Data/
│   │   │   │   ├── AppDbContext.cs
│   │   │   │   ├── Configurations/   # EF entity configs per table
│   │   │   │   └── Migrations/
│   │   │   ├── Repositories/
│   │   │   ├── Services/             # EmailService, FileService, SMSService
│   │   │   └── Jobs/                 # Hangfire jobs: payroll, accrual, reminders
│   │   └── IndiaHRMS.Shared/
│   │       ├── ApiResponse.cs
│   │       ├── PaginationHelper.cs
│   │       └── Extensions/
│   └── tests/
│       ├── IndiaHRMS.UnitTests/
│       └── IndiaHRMS.IntegrationTests/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── api/                      # axiosInstance + per-module API files
│       ├── components/               # Shared: DataTable, FileUpload, etc.
│       ├── hooks/                    # usePermission, useCurrentUser, etc.
│       ├── layouts/                  # AppLayout, AuthLayout
│       ├── modules/                  # Feature folder per module
│       ├── pages/                    # Route-level pages
│       ├── routes/                   # React Router v6 config
│       ├── store/                    # Zustand: authStore, notificationStore
│       ├── types/                    # TypeScript interfaces
│       └── utils/                    # formatINR, formatDate, validators
│
├── database/
│   └── seed/                         # SQL seed scripts
│
└── docker-compose.yml
```

---

## B3. DATABASE SCHEMA
→ [BRD: All entities from A3.M1–A3.M12]

### B3.1 Auth & RBAC Tables

```sql
-- Generate EF Core entities and fluent configurations for all:

Users (UserId PK, EmployeeId FK nullable, Username unique, PasswordHash,
       PasswordSalt, Email unique, IsActive, IsLocked, FailedLoginCount,
       LastLoginAt, RefreshToken, RefreshTokenExpiry, MustChangePassword,
       CreatedAt, UpdatedAt)

Roles (RoleId PK, RoleName, RoleCode unique, Description, IsSystem, IsActive)

Permissions (PermissionId PK, PermissionCode unique, PermissionName,
             Module, Action, Description)

RolePermissions (RolePermissionId PK, RoleId FK, PermissionId FK)
-- Unique constraint: (RoleId, PermissionId)

UserRoles (UserRoleId PK, UserId FK, RoleId FK, AssignedAt, AssignedBy FK,
           ValidFrom, ValidTo, IsActive)

AuditLogs (AuditLogId PK, UserId FK nullable, Action, TableName, RecordId,
           OldValues NVARCHAR(MAX), NewValues NVARCHAR(MAX),
           IPAddress, UserAgent, CreatedAt)
-- Index on: (TableName, RecordId), (UserId), (CreatedAt)
```

### B3.2 Organization Tables
→ [BRD: M12-BR-01 through M12-BR-05]

```sql
Companies (CompanyId PK, CompanyName, CIN, PAN, TAN, GSTIN,
           RegisteredAddress, City, State, Pincode, Logo,
           IncorporationDate, IsActive)

Departments (DeptId PK, CompanyId FK, DeptName, DeptCode unique,
             ParentDeptId FK self-ref, HODEmployeeId FK nullable,
             IsActive)

Designations (DesignationId PK, CompanyId FK, Title, Grade, Level,
              MinBasic, MaxBasic, IsActive)

Locations (LocationId PK, CompanyId FK, LocationName, Address, City,
           State, Pincode, IsHeadOffice, IsActive)

CostCenters (CostCenterId PK, CompanyId FK, CostCenterName,
             CostCenterCode, ManagerEmployeeId FK nullable, IsActive)
```

### B3.3 Employee Tables
→ [BRD: M1-BR-01 through M1-BR-15]

```sql
Employees (EmployeeId PK, CompanyId FK, EmployeeCode unique,
           FirstName, MiddleName, LastName, DateOfBirth, Gender,
           BloodGroup, MaritalStatus, PersonalEmail, OfficialEmail,
           PersonalPhone, EmergencyContactName, EmergencyContactPhone,
           PermanentAddress, PermanentCity, PermanentState, PermanentPincode,
           CurrentAddress, CurrentCity, CurrentState, CurrentPincode,
           Nationality, Religion,
           AadharNumber NVARCHAR(500),   -- AES-256 encrypted
           PANNumber NVARCHAR(500),       -- AES-256 encrypted
           UANNumber, ESINumber,
           PassportNumber, PassportExpiry,
           JoiningDate, ConfirmationDate, ProbationEndDate,
           DeptId FK, DesignationId FK, LocationId FK,
           CostCenterId FK nullable,
           ReportingManagerId FK self-ref nullable,
           EmploymentType NVARCHAR(50),   -- Full-time/Part-time/Contract/Intern
           EmploymentStatus NVARCHAR(50), -- Active/OnNotice/Separated/Absconding
           ProfilePhoto NVARCHAR(500),
           IsActive, CreatedAt, UpdatedAt)
-- Indexes: (CompanyId, EmploymentStatus), (DeptId), (ReportingManagerId), (EmployeeCode)

EmployeeDocuments (DocId PK, EmployeeId FK, DocType, DocName,
                   FilePath, FileSize, UploadedAt,
                   VerifiedBy FK nullable, VerifiedAt, IsVerified)

EmployeeBankDetails (BankDetailId PK, EmployeeId FK, BankName,
                     AccountNumber NVARCHAR(500), -- AES-256 encrypted
                     IFSCCode, AccountType, IsPrimary, IsActive)

EmployeeEducation (EduId PK, EmployeeId FK, Degree, Institution,
                   University, PassingYear, Percentage, IsHighest)

EmployeeExperience (ExpId PK, EmployeeId FK, CompanyName, Designation,
                    FromDate, ToDate, ReasonForLeaving, IsVerified)

PFNominees (NomineeId PK, EmployeeId FK, NomineeName, Relationship,
            DateOfBirth, Percentage, AadharNumber NVARCHAR(500))
```

### B3.4 Attendance Tables
→ [BRD: M4-BR-01 through M4-BR-14]

```sql
ShiftMasters (ShiftId PK, CompanyId FK, ShiftName, ShiftCode,
              StartTime, EndTime, GracePeriodMins, IsNightShift,
              WeeklyOffDays NVARCHAR(50), IsActive)

EmployeeShifts (EmpShiftId PK, EmployeeId FK, ShiftId FK,
                EffectiveFrom, EffectiveTo nullable)

HolidayCalendar (HolidayId PK, CompanyId FK, LocationId FK nullable,
                 HolidayDate, HolidayName,
                 HolidayType NVARCHAR(20), -- National/State/Optional/Company
                 IsActive)

AttendanceRecords (AttendanceId PK, EmployeeId FK, AttendanceDate,
                   CheckIn, CheckOut, WorkingHours DECIMAL(5,2),
                   OvertimeHours DECIMAL(5,2),
                   Status NVARCHAR(20), -- Present/Absent/Leave/Holiday/WFH/HalfDay
                   Source NVARCHAR(20), -- Biometric/Mobile/Manual
                   Latitude DECIMAL(9,6), Longitude DECIMAL(9,6),
                   Remarks, IsRegularized)
-- Index: (EmployeeId, AttendanceDate), (AttendanceDate, Status)

AttendanceRegularizations (RegId PK, EmployeeId FK, AttendanceDate,
                           Reason, RequestedCheckIn, RequestedCheckOut,
                           Status, ApprovedBy FK nullable, ApprovedAt)
```

### B3.5 Leave Tables
→ [BRD: M5-BR-01 through M5-BR-13]

```sql
LeaveTypes (LeaveTypeId PK, CompanyId FK, LeaveTypeName, LeaveCode,
            MaxDaysPerYear, MaxDaysPerApplication, IsCarryForward,
            MaxCarryForwardDays, IsEncashable, IsPaidLeave,
            ApplicableGender, -- All/Male/Female
            MinServiceDaysRequired, IsActive)

LeaveBalances (BalanceId PK, EmployeeId FK, LeaveTypeId FK, Year,
               OpeningBalance, Accrued, Taken, Encashed, Lapsed,
               ClosingBalance)
-- Unique: (EmployeeId, LeaveTypeId, Year)

LeaveApplications (LeaveAppId PK, EmployeeId FK, LeaveTypeId FK,
                   FromDate, ToDate, TotalDays, IsHalfDay,
                   Reason, Status, -- Pending/Approved/Rejected/Cancelled
                   AppliedAt, ApproverId FK nullable,
                   ApprovedAt, RejectionReason, CancelledAt,
                   AttachmentPath)
-- Index: (EmployeeId, Status), (ApproverId, Status)
```

### B3.6 Payroll Tables
→ [BRD: M6-BR-01 through M6-BR-23]

```sql
SalaryComponents (ComponentId PK, CompanyId FK, ComponentName,
                  ComponentCode unique, ComponentType,
                  -- Earning/Deduction/Statutory/EmployerContribution
                  CalculationType, -- Fixed/Percentage/Formula
                  IsStatutory, IsTaxable, IsActive)

SalaryStructures (StructureId PK, CompanyId FK, StructureName,
                  EffectiveFrom, EffectiveTo nullable, IsActive)

StructureComponents (Id PK, StructureId FK, ComponentId FK,
                     PercentageOf FK nullable, -- e.g. HRA=40% of Basic
                     FixedValue DECIMAL(12,2), Formula NVARCHAR(500),
                     Sequence INT)

EmployeeSalaries (EmpSalaryId PK, EmployeeId FK, StructureId FK,
                  GrossCTC DECIMAL(12,2), BasicSalary DECIMAL(12,2),
                  EffectiveFrom, EffectiveTo nullable, IsActive,
                  RevisedBy FK nullable, RevisionReason)

PayrollRuns (PayrollRunId PK, CompanyId FK, Month, Year,
             Status, -- Draft/Processing/PendingApproval/Approved/Disbursed
             ProcessedBy FK, ProcessedAt, ApprovedBy FK nullable,
             ApprovedAt, DisbursedAt,
             TotalGross DECIMAL(14,2), TotalDeductions DECIMAL(14,2),
             TotalNetPay DECIMAL(14,2), TotalEmployees INT)

PayrollDetails (DetailId PK, PayrollRunId FK, EmployeeId FK,
                WorkingDays INT, PaidDays DECIMAL(5,2), LWPDays DECIMAL(5,2),
                OvertimeHours DECIMAL(6,2),
                GrossEarnings DECIMAL(12,2), TotalDeductions DECIMAL(12,2),
                NetPay DECIMAL(12,2),
                TDSDeducted DECIMAL(10,2),
                PFEmployee DECIMAL(10,2), PFEmployer DECIMAL(10,2),
                ESIEmployee DECIMAL(10,2), ESIEmployer DECIMAL(10,2),
                ProfessionalTax DECIMAL(8,2), LWF DECIMAL(8,2),
                GratuityProvision DECIMAL(10,2))

PayrollComponentValues (ValueId PK, DetailId FK, ComponentId FK,
                        ComponentType, Amount DECIMAL(12,2))

TaxDeclarations (DeclarationId PK, EmployeeId FK, FinancialYear,
                 TaxRegime, -- Old/New
                 HRA_Claimed DECIMAL(10,2), Section80C DECIMAL(10,2),
                 Section80D DECIMAL(10,2), HouseLoanInterest DECIMAL(10,2),
                 OtherDeductions DECIMAL(10,2),
                 SubmittedAt, IsApproved, ApprovedBy FK nullable)
```

### B3.7 Recruitment Tables
→ [BRD: M2-BR-01 through M2-BR-13]

```sql
JobRequisitions (ReqId PK, CompanyId FK, DeptId FK, DesignationId FK,
                 NoOfPositions, JobTitle, JobDescription,
                 MinExperience, MaxExperience, MinSalary, MaxSalary,
                 SkillsRequired, RequisitionDate, TargetDate,
                 Status, RaisedBy FK, ApprovedBy FK nullable)

Candidates (CandidateId PK, FirstName, LastName, Email unique, Phone,
            CurrentDesignation, CurrentCompany, TotalExperience,
            CurrentCTC, ExpectedCTC, NoticePeriodDays,
            ResumeFilePath, Source, CreatedAt)

JobApplications (AppId PK, ReqId FK, CandidateId FK, ApplicationDate,
                 Status, CurrentStage, RejectionReason)

InterviewRounds (RoundId PK, AppId FK, RoundName, RoundType,
                 ScheduledAt, InterviewerId FK,
                 Venue, MeetingLink, Status,
                 Rating DECIMAL(3,1), Feedback, CompletedAt)

OfferLetters (OfferId PK, AppId FK, OfferedCTC DECIMAL(12,2),
              JoiningDate, OfferDate, ExpiryDate,
              Status, -- Draft/Sent/Accepted/Rejected/Withdrawn
              LetterFilePath, AcceptedAt)
```

### B3.8 Performance Tables
→ [BRD: M7-BR-01 through M7-BR-11]

```sql
AppraisalCycles (CycleId PK, CompanyId FK, CycleName,
                 CycleType, -- Annual/HalfYearly/Quarterly
                 StartDate, EndDate, GoalSettingDeadline,
                 MidYearDeadline, FinalReviewDeadline,
                 Status) -- Draft/GoalSetting/InProgress/Review/Completed

EmployeeGoals (GoalId PK, CycleId FK, EmployeeId FK,
               GoalTitle, Description, KPI, TargetValue,
               ActualValue, Weightage DECIMAL(5,2),
               SelfRating DECIMAL(3,1), ManagerRating DECIMAL(3,1),
               Status)

PerformanceReviews (ReviewId PK, CycleId FK, EmployeeId FK,
                    ReviewerId FK, ReviewType,
                    -- Self/Manager/Peer/360/HR
                    OverallRating DECIMAL(3,1), Strengths,
                    AreasForImprovement, TrainingRecommendations,
                    IncrementRecommended DECIMAL(5,2),
                    PromotionRecommended BIT,
                    Status, SubmittedAt)

PIPs (PIPId PK, EmployeeId FK, StartDate, EndDate, Reason,
      ImprovementAreas, Milestones, Status,
      InitiatedBy FK, ClosedAt, ClosureRemark)
```

### B3.9 Training Tables
→ [BRD: M8-BR-01 through M8-BR-09]

```sql
TrainingPrograms (ProgramId PK, CompanyId FK, ProgramName, Category,
                  Mode, -- Online/Offline/Hybrid
                  Vendor, CostPerPerson DECIMAL(10,2),
                  DurationHours INT, IsActive)

TrainingSchedules (ScheduleId PK, ProgramId FK, StartDate, EndDate,
                   Venue, MaxParticipants,
                   TrainerId FK nullable, Status)

TrainingNominations (NomId PK, ScheduleId FK, EmployeeId FK,
                     NominatedBy FK, Status,
                     Feedback, Rating DECIMAL(3,1),
                     CompletionDate, CertificatePath, ExpiryDate)
```

### B3.10 Separation Tables
→ [BRD: M10-BR-01 through M10-BR-10]

```sql
Separations (SeparationId PK, EmployeeId FK,
             SeparationType,
             -- Resignation/Termination/Retirement/Absconding/VRS
             ResignationDate, LastWorkingDate, NoticePeriodDays,
             NoticePeriodWaived BIT, BuyoutAmount DECIMAL(10,2),
             ExitInterviewDone BIT, ExitFeedback NVARCHAR(MAX),
             Status, InitiatedBy FK)

NoDuesClearing (NoDuesId PK, SeparationId FK, DepartmentName,
                ClearanceStatus, -- Pending/Cleared/NA
                ClearedBy FK nullable, ClearedAt, Remarks)

FnFSettlements (FnFId PK, SeparationId FK,
                PendingSalary DECIMAL(12,2),
                LeaveEncashment DECIMAL(10,2),
                GratuityAmount DECIMAL(10,2),
                BonusPayable DECIMAL(10,2),
                NoticePeriodDeduction DECIMAL(10,2),
                OtherDeductions DECIMAL(10,2),
                GrossPayable DECIMAL(12,2),
                NetPayable DECIMAL(12,2),
                CalculatedAt, ApprovedBy FK nullable, PaidAt)
```

### B3.11 Other Tables

```sql
Notifications (NotificationId PK, UserId FK, Title, Message,
               Type, ReferenceId, ReferenceType,
               IsRead, CreatedAt)

SystemSettings (SettingId PK, CompanyId FK, SettingKey, SettingValue,
                DataType, Description, UpdatedBy FK, UpdatedAt)

EmailTemplates (TemplateId PK, CompanyId FK, TemplateName, TemplateCode,
                Subject, Body, IsActive)
```

---

## B4. USER ROLES & RBAC
→ [BRD: A2 Stakeholders table]

### B4.1 System Roles (seed these exactly)

| RoleCode | RoleName | Description |
|---|---|---|
| `SUPER_ADMIN` | Super Administrator | Full system access, company setup |
| `HR_ADMIN` | HR Administrator | Full HR module access |
| `HR_MANAGER` | HR Manager | Approve workflows, manage HR operations |
| `PAYROLL_ADMIN` | Payroll Administrator | Payroll processing, statutory filings |
| `RECRUITMENT_MGR` | Recruitment Manager | ATS, requisitions, offers |
| `DEPT_MANAGER` | Department Manager | Own team: attendance, leave, performance |
| `EMPLOYEE` | Employee | Self-service portal only (own data) |
| `AUDITOR` | Auditor | Read-only all modules, no write access |
| `IT_ADMIN` | IT Administrator | User accounts, system configuration |
| `FINANCE_VIEWER` | Finance Viewer | Payroll reports read-only |

### B4.2 Permission Code Format

```
MODULE.ACTION
Examples: EMPLOYEE.VIEW, PAYROLL.PROCESS, LEAVE.APPROVE

Modules: EMPLOYEE, ATTENDANCE, LEAVE, PAYROLL, RECRUITMENT,
         PERFORMANCE, TRAINING, SEPARATION, REPORTS, USER_MGMT,
         COMPANY_SETUP, COMPLIANCE, NOTIFICATIONS

Actions: VIEW, CREATE, EDIT, DELETE, APPROVE, REJECT,
         EXPORT, PROCESS, GENERATE, ASSIGN
```

### B4.3 Role-Permission Matrix

```
SUPER_ADMIN     → ALL permissions
HR_ADMIN        → ALL except USER_MGMT.DELETE, COMPANY_SETUP.*
HR_MANAGER      → EMPLOYEE.VIEW/EDIT, ATTENDANCE.*, LEAVE.APPROVE/VIEW,
                  PERFORMANCE.*, TRAINING.*, SEPARATION.VIEW,
                  REPORTS.VIEW/EXPORT
PAYROLL_ADMIN   → PAYROLL.*, EMPLOYEE.VIEW, REPORTS.VIEW/EXPORT/GENERATE
RECRUITMENT_MGR → RECRUITMENT.*, EMPLOYEE.CREATE/VIEW, REPORTS.VIEW
DEPT_MANAGER    → EMPLOYEE.VIEW, ATTENDANCE.VIEW/EDIT(team only),
                  LEAVE.APPROVE/VIEW(team only), PERFORMANCE.VIEW/EDIT(team),
                  REPORTS.VIEW(own team only)
EMPLOYEE        → own data: ATTENDANCE.VIEW, LEAVE.CREATE/VIEW/CANCEL,
                  PAYROLL.VIEW(own slips only), PERFORMANCE.VIEW(own),
                  EMPLOYEE.VIEW(own profile), EMPLOYEE.EDIT(own contact/bank)
AUDITOR         → *.VIEW, *.EXPORT (all modules, no writes)
IT_ADMIN        → USER_MGMT.*, COMPANY_SETUP.VIEW
FINANCE_VIEWER  → PAYROLL.VIEW, REPORTS.VIEW/EXPORT
```

### B4.4 Data Scoping Rules (IMPORTANT)
```
EMPLOYEE role   → API always filters by req.User.EmployeeId
DEPT_MANAGER    → API filters by employees where ReportingManagerId = req.User.EmployeeId
HR_MANAGER      → Can see all employees in their assigned departments
HR_ADMIN+       → Can see all employees in the company
SUPER_ADMIN     → Can access all companies
```

---

## B5. BACKEND IMPLEMENTATION
→ [BRD: All modules]

### B5.1 appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=IndiaHRMS;Trusted_Connection=True;MultipleActiveResultSets=true",
    "Redis": "localhost:6379"
  },
  "JwtSettings": {
    "SecretKey": "CHANGE_THIS_TO_256_BIT_SECRET_IN_PRODUCTION_ENVIRONMENT",
    "Issuer": "IndiaHRMS",
    "Audience": "IndiaHRMS_Users",
    "AccessTokenExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 7
  },
  "PayrollSettings": {
    "PFEmployeePercent": 12.0,
    "PFEmployerPercent": 12.0,
    "PFWageCeiling": 15000,
    "ESIEmployeePercent": 0.75,
    "ESIEmployerPercent": 3.25,
    "ESIWageCeiling": 21000,
    "BonusWageCeiling": 21000,
    "GratuityNumerator": 15,
    "GratuityDenominator": 26,
    "GratuityMaxAmount": 2000000
  },
  "EncryptionSettings": {
    "Key": "CHANGE_THIS_AES256_KEY_32CHARS_MIN",
    "IV": "CHANGE_THIS_IV_16"
  },
  "FileStorage": {
    "BasePath": "uploads/",
    "MaxFileSizeMB": 10,
    "AllowedExtensions": [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xlsx"]
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "FromEmail": "noreply@indiahrms.com",
    "FromName": "IndiaHRMS",
    "EnableSSL": true
  },
  "Hangfire": {
    "Dashboard": true,
    "DashboardPath": "/jobs"
  }
}
```

### B5.2 Middleware Pipeline

Generate these in order in Program.cs:
1. `ExceptionHandlingMiddleware` — catches all unhandled exceptions, returns RFC 7807 ProblemDetails
2. `RequestLoggingMiddleware` — Serilog request/response logging
3. `AuditMiddleware` — logs all POST/PUT/DELETE to AuditLogs table with old/new values
4. `RateLimitingMiddleware` — 100 req/min per user (use `AspNetCoreRateLimit`)
5. CORS (whitelist frontend URLs)
6. JWT Bearer Authentication
7. Authorization

### B5.3 Common API Response Wrapper

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
    public PaginationMeta? Pagination { get; set; }
    public string? TraceId { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null) => ...
    public static ApiResponse<T> Fail(string error) => ...
    public static ApiResponse<T> Fail(List<string> errors) => ...
    public static ApiResponse<T> PagedOk(T data, int page, int pageSize, int total) => ...
}

public class PaginationMeta
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalRecords { get; set; }
    public int TotalPages { get; set; }
    public bool HasNext => Page < TotalPages;
    public bool HasPrev => Page > 1;
}
```

### B5.4 API Controllers
→ [BRD: All module requirements in A3]

#### Auth Controller — `/api/auth`
```
POST   /login               LoginDto → { accessToken, refreshToken, user, roles, permissions[] }
POST   /refresh-token       { refreshToken } → { accessToken, refreshToken }
POST   /logout              Invalidate refresh token in DB
POST   /change-password     ChangePasswordDto (old + new + confirm)
POST   /forgot-password     { email } → send reset link
POST   /reset-password      { token, newPassword, confirmPassword }
GET    /me                  → UserProfileDto + roles[] + permissions[]
```

#### User Management — `/api/users` (SUPER_ADMIN, IT_ADMIN)
```
GET    /                    Paginated list (search, role filter, status filter)
GET    /{id}                User detail with roles
POST   /                    Create user, assign initial role
PUT    /{id}                Update user (email, name)
PUT    /{id}/toggle-lock    Lock/unlock with reason
POST   /{id}/reset-password Admin force reset
POST   /{id}/roles          Assign/update role
DELETE /{id}                Soft delete (IsActive = false)
GET    /roles               All roles list
GET    /permissions         All permissions list
```

#### Employee Controller — `/api/employees`
→ [BRD: M1-BR-01 through M1-BR-15]
```
GET    /                    Paginated (search, dept, location, status, type)
GET    /{id}                Full profile with all relations
GET    /{id}/summary        Card: photo, name, code, dept, designation, phone
POST   /                    Create employee (HR_ADMIN/HR_MANAGER)
PUT    /{id}                Full update
PUT    /{id}/photo          Multipart photo upload
GET    /{id}/documents      Document list
POST   /{id}/documents      Upload document
PUT    /{id}/documents/{docId}/verify   Mark verified
GET    /{id}/bank-details   Masked bank info
POST   /{id}/bank-details   Add bank detail
PUT    /{id}/status         Activate/deactivate
GET    /{id}/salary-history Salary revisions
GET    /my-profile          Own profile (EMPLOYEE role)
PUT    /my-profile          Self-update: contact, address, bank
GET    /org-chart           Hierarchical JSON for org tree
GET    /directory           Public directory (name, dept, photo, ext)
GET    /{id}/confirmation   Probation/confirmation status
PUT    /{id}/confirm        Confirm employee (manager/HR)
```

#### Attendance Controller — `/api/attendance`
→ [BRD: M4-BR-01 through M4-BR-14]
```
POST   /checkin             { employeeId, latitude, longitude, source }
POST   /checkout            { employeeId, latitude, longitude }
POST   /import              Bulk import from biometric CSV file
GET    /                    Paginated records (empId, dateFrom, dateTo, status)
GET    /{employeeId}/monthly/{year}/{month}  Monthly grid (31-day array)
GET    /my-attendance/{year}/{month}        Own monthly view
GET    /team-attendance/{year}/{month}      Team view (DEPT_MANAGER)
POST   /regularize          Submit regularization request
GET    /regularizations     Queue (pending/approved/rejected)
PUT    /regularizations/{id}/approve        Approve/reject
GET    /shifts              Shift master list
POST   /shifts              Create shift
PUT    /shifts/{id}         Update shift
POST   /employee-shift      Assign shift to employee
GET    /holidays/{year}     Holiday list (location-filtered)
POST   /holidays            Add holiday
POST   /holidays/bulk       Import holiday list
```

#### Leave Controller — `/api/leave`
→ [BRD: M5-BR-01 through M5-BR-13]
```
GET    /types               Leave type master
POST   /types               Create leave type (HR_ADMIN)
PUT    /types/{id}          Update leave type
GET    /balances/{employeeId}/{year}    Balances per type
GET    /applications        All applications (paginated, status/dept/daterange filter)
POST   /applications        Apply for leave
GET    /applications/{id}   Application detail
PUT    /applications/{id}/approve       Approve with remarks
PUT    /applications/{id}/reject        Reject with reason
PUT    /applications/{id}/cancel        Cancel (employee)
GET    /my-leaves           Own applications + balances
GET    /team-leaves/{year}/{month}      Team leave calendar
POST   /accrual/run/{year}/{month}      Run monthly accrual (HR_ADMIN)
POST   /yearend/carryforward/{year}     Run year-end carry-forward
```

#### Payroll Controller — `/api/payroll`
→ [BRD: M6-BR-01 through M6-BR-23]
```
GET    /components          Component master
POST   /components          Create component
PUT    /components/{id}     Update component
GET    /structures          Structure list
POST   /structures          Create structure
PUT    /structures/{id}     Update structure
GET    /employee-salaries/{employeeId}  Salary history
POST   /employee-salaries   Assign salary (includes CTC breakup)
GET    /runs                Payroll run list
POST   /runs/initiate       Start new payroll run for month/year
GET    /runs/{id}           Run detail with all employee breakdown
PUT    /runs/{id}/approve   Approve run
POST   /runs/{id}/disburse  Mark disbursed
GET    /runs/{id}/bank-file Download NEFT file (CSV/Excel)
GET    /runs/{id}/summary   Summary stats card
GET    /slips/{employeeId}/{year}/{month}    Salary slip PDF (binary)
GET    /my-slips            Own slips list (EMPLOYEE)
GET    /my-slips/{year}/{month}             Own slip PDF
POST   /tax-declarations    Submit Form 12BB declaration
GET    /tax-declarations/{employeeId}/{fy}  Declaration detail
POST   /tax-declarations/{id}/approve      HR approve declaration
GET    /forms/form16/{employeeId}/{fy}     Form 16 PDF
GET    /statutory/pf-ecr/{month}/{year}    PF ECR file
GET    /statutory/esi-challan/{month}/{year}    ESI challan
GET    /statutory/tds-24q/{quarter}/{year}      24Q data export
```

#### Recruitment Controller — `/api/recruitment`
→ [BRD: M2-BR-01 through M2-BR-13]
```
GET    /requisitions        List (status, dept, date filters)
POST   /requisitions        Create requisition
PUT    /requisitions/{id}/approve   Approve requisition
GET    /candidates          Candidate database
POST   /candidates          Add candidate
POST   /candidates/parse-resume     Upload resume → extract data
GET    /applications        All applications (Kanban or list view)
POST   /applications        Apply candidate to requisition
PUT    /applications/{id}/stage     Move to next stage
GET    /applications/{id}/timeline  Full activity timeline
POST   /applications/{id}/interviews    Schedule interview round
PUT    /interviews/{id}/feedback        Submit feedback
POST   /applications/{id}/offer         Generate offer letter
PUT    /offers/{id}/status              Accept/reject/withdraw
POST   /offers/{id}/convert-to-employee Auto-create employee record
```

#### Performance Controller — `/api/performance`
→ [BRD: M7-BR-01 through M7-BR-11]
```
GET    /cycles              All appraisal cycles
POST   /cycles              Create cycle
PUT    /cycles/{id}/status  Open/close/complete cycle
GET    /goals               Goals (filter: cycleId, employeeId)
POST   /goals               Create goals for employee
PUT    /goals/{id}          Update target/actual
POST   /goals/{id}/self-rate        Employee self-rates KPI
PUT    /goals/{id}/manager-rate     Manager rates KPI
GET    /reviews/{employeeId}/{cycleId}  Review detail
POST   /reviews             Submit review (self/manager/peer)
GET    /my-goals            Own goals (EMPLOYEE)
GET    /team-goals/{cycleId}    Team goals (DEPT_MANAGER)
GET    /pips                PIP list
POST   /pips                Initiate PIP
PUT    /pips/{id}           Update milestones/status
```

#### Training Controller — `/api/training`
→ [BRD: M8-BR-01 through M8-BR-09]
```
GET    /programs            Catalog
POST   /programs            Create program
GET    /schedules           Scheduled sessions
POST   /schedules           Schedule a session
GET    /nominations         All nominations (filter: emp, schedule, status)
POST   /nominations         Nominate employee(s)
PUT    /nominations/{id}/status     Confirm/cancel
PUT    /nominations/{id}/complete   Mark complete + add feedback + upload cert
GET    /my-trainings        Own training history + certificates
GET    /skill-matrix        Employee × Skill matrix
GET    /tni-report          Training need analysis report
```

#### Separation Controller — `/api/separation`
→ [BRD: M10-BR-01 through M10-BR-10]
```
POST   /resign              Employee submits resignation
GET    /                    All separations (HR view)
GET    /{id}                Detail with no-dues + F&F status
PUT    /{id}/accept         HR accepts resignation
PUT    /{id}/notice-waiver  Grant notice period waiver
GET    /{id}/no-dues        No-dues checklist status
PUT    /no-dues/{noDuesId}  Dept clears their no-dues
GET    /{id}/fnf            F&F calculation preview
POST   /{id}/fnf/approve    Approve and mark for payment
GET    /{id}/documents      Generate letters (experience, relieving)
GET    /my-separation       Own separation status (EMPLOYEE)
```

#### Reports Controller — `/api/reports`
→ [BRD: M11-BR-01 through M11-BR-12]
```
GET    /headcount           Headcount by dept/location/grade/type
GET    /attrition           Attrition trend (monthly/quarterly/annual)
GET    /attendance-summary  Attendance stats for date range
GET    /leave-summary       Leave utilization by type/dept
GET    /payroll-summary     Payroll cost analysis
GET    /statutory/pf        PF return data
GET    /statutory/esi       ESI return data
GET    /statutory/tds       TDS liability data
GET    /hiring-funnel        Recruitment funnel metrics
GET    /performance-dist     Rating distribution
POST   /custom              Custom report: { fields[], filters{} }
GET    /export/{type}       Export any report: ?format=excel|pdf|csv
```

#### Dashboard Controller — `/api/dashboard`
```
GET    /hr-summary          KPIs: headcount, attrition%, open positions, new joiners
GET    /attendance-today    Today: present, absent, WFH, on-leave counts
GET    /pending-approvals   Count of my pending approvals (leave, regularization, etc.)
GET    /payroll-status      Current month payroll run status
GET    /my-summary          Employee: leave balance, attendance today, upcoming holidays
GET    /manager-summary     Manager: team summary + pending approvals count
```

#### Notifications Controller — `/api/notifications`
```
GET    /                    Own notification list (paginated)
PUT    /{id}/read           Mark single as read
PUT    /read-all            Mark all as read
GET    /unread-count        Integer count for badge
```

### B5.5 Key Service Implementations

#### PayrollCalculationService
→ [BRD: M6-BR-01 through M6-BR-23, A4 Indian Statutory Compliance]
```csharp
// Implement ALL these calculations:

decimal CalculatePFEmployee(decimal basicSalary)
    => Math.Round(Math.Min(basicSalary, settings.PFWageCeiling) * 0.12m, 2);

decimal CalculatePFEmployer(decimal basicSalary)
{
    var pfBase = Math.Min(basicSalary, settings.PFWageCeiling);
    var eps = Math.Min(pfBase * 0.0833m, 1250m); // EPS capped at ₹1,250
    var edli = pfBase * 0.005m;
    var admin = pfBase * 0.005m;
    return Math.Round(eps + edli + admin, 2);
}

decimal CalculateESIEmployee(decimal grossSalary)
    => grossSalary <= settings.ESIWageCeiling
        ? Math.Round(grossSalary * 0.0075m, 2) : 0;

decimal CalculateESIEmployer(decimal grossSalary)
    => grossSalary <= settings.ESIWageCeiling
        ? Math.Round(grossSalary * 0.0325m, 2) : 0;

decimal CalculateProfessionalTax(decimal grossSalary, string state, int month)
    // State-wise slab lookup from config table

decimal CalculateMonthlyTDS(EmployeeTaxProfile profile, TaxDeclaration declaration)
{
    // 1. Annualize YTD + projected salary
    // 2. Apply HRA exemption (Metro: 50% basic, Non-metro: 40%)
    // 3. Apply standard deduction (₹75,000 in New Regime)
    // 4. Apply 80C, 80D, HRA claimed (Old Regime only)
    // 5. Calculate annual tax as per regime slab
    // 6. Subtract TDS already deducted this FY
    // 7. Divide remaining by remaining months
}

decimal CalculateGratuityProvision(decimal basicPlusDA)
    => Math.Round(basicPlusDA * 15 / 26 / 12, 2);

decimal CalculateLWPDeduction(decimal grossSalary, int workingDays, int lwpDays)
    => lwpDays > 0 ? Math.Round(grossSalary / workingDays * lwpDays, 2) : 0;

decimal CalculateLeaveEncashment(decimal basicSalary, decimal elBalance)
    => Math.Round(basicSalary / 26 * elBalance, 2);

decimal CalculateGratuity(decimal lastBasicPlusDA, int yearsOfService)
{
    if (yearsOfService < 5) return 0;
    return Math.Min(lastBasicPlusDA * 15 / 26 * yearsOfService, 2000000);
}
```

#### LeaveAccrualService (Hangfire Job — runs 1st of each month)
→ [BRD: M5-BR-03, M5-BR-04]
```csharp
// Monthly EL accrual: 1.5 days for employees with 1+ year service
// CL/SL: front-loaded on Jan 1 (annual)
// Year-end carry-forward job: runs March 31
// Max 30 EL carry-forward, CL lapses entirely
```

#### PdfGenerationService (QuestPDF)
→ [BRD: M6-BR-13 salary slip, M6-BR-15 Form 16, M10-BR-08 letters]
```
Generate: SalarySlip, Form16PartA, Form16PartB, OfferLetter,
          AppointmentLetter, ConfirmationLetter, ExperienceLetter,
          RelievingLetter, IncrementLetter
All PDFs: company logo, letterhead, professional formatting
```

### B5.6 Hangfire Background Jobs

```csharp
// Register and schedule these recurring jobs:

// Daily at 11:59 PM: Auto-mark absent for employees with no attendance
RecurringJob.AddOrUpdate("auto-mark-absent", ..., Cron.Daily);

// 1st of every month: EL accrual
RecurringJob.AddOrUpdate("el-accrual", ..., "0 1 1 * *");

// March 31: Year-end leave carry-forward
RecurringJob.AddOrUpdate("yearend-carryforward", ..., "0 2 31 3 *");

// Daily: Probation end reminders (30 days before)
RecurringJob.AddOrUpdate("probation-reminder", ..., Cron.Daily);

// Daily: Certificate/license expiry reminders
RecurringJob.AddOrUpdate("cert-expiry-reminder", ..., Cron.Daily);

// 7th of each month: TDS payment reminder notification
RecurringJob.AddOrUpdate("tds-reminder", ..., "0 9 7 * *");
```

---

## B6. FRONTEND IMPLEMENTATION

### B6.1 Auth Store (Zustand)

```typescript
// src/store/authStore.ts
interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}
// Use zustand/persist for token (localStorage is allowed for tokens only)
// NEVER store sensitive data in localStorage
```

### B6.2 Axios Instance with Interceptors

```typescript
// src/api/axiosInstance.ts
// baseURL: import.meta.env.VITE_API_BASE_URL
// Request interceptor: attach Authorization: Bearer {accessToken}
// Response interceptor:
//   401 → call POST /auth/refresh-token with refreshToken
//          If success: retry original request with new token
//          If fail: logout() + redirect to /login
//   403 → redirect to /403
//   500+ → show Ant Design error notification
//   Network error → show "Connection failed" notification
```

### B6.3 Permission & Role Guards

```typescript
// src/components/PermissionGuard.tsx
// Props: permission: string, fallback?: ReactNode
// Usage: <PermissionGuard permission="PAYROLL.PROCESS"><Button>Run Payroll</Button></PermissionGuard>

// src/components/RoleGuard.tsx
// Props: roles: string[], fallback?: ReactNode
// Usage: <RoleGuard roles={['HR_ADMIN', 'SUPER_ADMIN']}><AdminSection /></RoleGuard>

// src/hooks/usePermission.ts
// const { can, hasRole, hasAnyRole } = usePermission()
// if (can('EMPLOYEE.CREATE')) { ... }
```

### B6.4 Route Configuration

```typescript
// src/routes/index.tsx — React Router v6, all routes lazy-loaded
// ProtectedRoute wrapper: checks auth → if not, redirect to /login
// PermissionRoute wrapper: checks permission → if not, redirect to /403

// Route structure:
/login, /forgot-password, /reset-password  (public)
/403, /404                                  (public error pages)
/dashboard                                  (all authenticated)
/employees, /employees/:id, /employees/new (EMPLOYEE.VIEW)
/attendance/*, /leave/*                     (ATTENDANCE.VIEW, LEAVE.VIEW)
/payroll/*                                  (PAYROLL.VIEW)
/recruitment/*                              (RECRUITMENT.VIEW)
/performance/*                              (PERFORMANCE.VIEW)
/training/*                                 (TRAINING.VIEW)
/separation/*                               (SEPARATION.VIEW)
/reports/*                                  (REPORTS.VIEW)
/admin/*                                    (USER_MGMT.VIEW or COMPANY_SETUP.VIEW)
/my-profile, /my-attendance, /my-leaves,
/my-slips, /my-goals                        (all EMPLOYEE role)
```

### B6.5 Pages to Generate
→ [BRD: All ESS requirements M9-BR-01 through M9-BR-12]

```
PUBLIC:
  /login                     LoginPage (company logo, email+password, remember me)
  /forgot-password           ForgotPasswordPage
  /reset-password            ResetPasswordPage (token from email)

SHARED LAYOUT — AppLayout:
  Sidebar (collapsible, role-based menu, company logo, user avatar at bottom)
  Header (global search, notification bell + badge, user dropdown)
  Breadcrumbs
  Content area

DASHBOARD:
  /dashboard                 Role-adaptive:
                             HR/Admin → KPI cards + charts (headcount, attrition, payroll)
                             Manager → Team attendance today + pending approvals
                             Employee → My leave balance + attendance today + holidays

EMPLOYEE MODULE:
  /employees                 List with search, filters, export
  /employees/new             Multi-step form wizard (Personal → Employment → Salary)
  /employees/:id             Detail with tabs (Profile, Documents, Bank, Salary, Attendance, Leave, PMS)
  /employees/:id/edit        Edit form
  /my-profile                Own profile view + edit contact/address/bank

ATTENDANCE:
  /attendance                Admin list view with date range filter
  /attendance/my             Monthly calendar (color: green=Present, red=Absent, yellow=Late, blue=Leave, gray=Holiday)
  /attendance/team           Team view for managers
  /attendance/regularizations Pending requests queue + my requests tab
  /attendance/shifts         Shift master CRUD
  /attendance/holidays       Holiday calendar management

LEAVE:
  /leave                     All applications list (admin/manager view)
  /leave/apply               Apply leave form (type picker, date range, reason, attachment)
  /leave/my                  My leave: balance cards per type + history table + calendar
  /leave/team                Team leave calendar (manager)
  /leave/types               Leave type config (HR admin only)

PAYROLL:
  /payroll                   Payroll runs list with status badges
  /payroll/run/new           Initiate run: select month/year, preview employee count
  /payroll/run/:id           Run detail: summary cards + employee-wise table + approve/reject
  /payroll/salary-structures Structure management
  /payroll/components        Component master
  /payroll/employee-salaries Assign CTC to employees
  /payroll/my-slips          My salary slips: year selector + month grid + download
  /payroll/tax-declaration   Form 12BB online form + investment proof upload
  /payroll/reports           Statutory reports (PF/ESI/TDS) with download

RECRUITMENT:
  /recruitment/requisitions  List + status Kanban toggle
  /recruitment/requisitions/new  Create form
  /recruitment/candidates    Candidate database with search
  /recruitment/applications  Kanban board by stage (drag-and-drop stage change)
  /recruitment/applications/:id  Detail: candidate info + interview timeline + offers

PERFORMANCE:
  /performance/cycles        Cycle list + create
  /performance/goals         My goals / Team goals (tab toggle)
  /performance/reviews       Review forms list + action
  /performance/my-appraisal  Employee self-view: goals, ratings, history
  /performance/pips          PIP management

TRAINING:
  /training/catalog          Program cards grid
  /training/schedule         Calendar view of upcoming sessions
  /training/nominations      Nomination table
  /training/my-trainings     Own history + certificate downloads

SEPARATION:
  /separation                HR list view with status filters
  /separation/resign         Employee resignation form
  /separation/:id            Workflow view: status steps + no-dues + F&F

REPORTS:
  /reports                   Cards grid (click → specific report)
  /reports/headcount         Headcount table + bar chart
  /reports/attrition         Line chart + table
  /reports/attendance        Summary table with export
  /reports/payroll           Cost breakdown chart + table
  /reports/statutory         PF/ESI/TDS reports with download buttons
  /reports/custom            Field selector + filter builder + preview + export

ADMIN:
  /admin/users               User list + create + role assign
  /admin/roles               Role → permission matrix view
  /admin/company             Company master form
  /admin/departments         Dept hierarchy tree + CRUD
  /admin/designations        Designation table
  /admin/locations           Location cards
  /admin/audit-logs          Filterable audit trail table
```

### B6.6 Shared Components to Generate

```typescript
// All these must be generated:

DataTable.tsx          // antd Table + server pagination + sorting + filtering
                       // + column visibility toggle + Excel export button

PermissionGuard.tsx    // Hide/show based on permission
RoleGuard.tsx          // Hide/show based on role

StatusBadge.tsx        // Colored tags for all statuses
                       // (Active=green, Inactive=red, Pending=orange, etc.)

FileUpload.tsx         // Ant Design Upload + drag-drop + size/type validation

ApprovalTimeline.tsx   // Steps component showing workflow status

SalarySlip.tsx         // Printable/downloadable salary slip layout

AttendanceCalendar.tsx // 31-day month grid with color-coded day status

LeaveBalanceCards.tsx  // Row of cards per leave type with balance

OrgChart.tsx           // Ant Design Tree / D3 hierarchical org chart

NotificationDrawer.tsx // Right drawer with notification list + mark-read

ConfirmDialog.tsx      // Ant Design Modal confirm wrapper

EmployeeSearchSelect.tsx // Async search dropdown for employee picker

AmountDisplay.tsx      // Format: ₹1,23,456.00 (Indian numbering)

DateRangePicker.tsx    // Ant Design DatePicker.RangePicker
                       // with presets: This Month, Last Month, 
                       // This Quarter, This FY (Apr-Mar), Custom

MultiStepForm.tsx      // Wizard with steps indicator (for employee creation)

ApprovalActions.tsx    // Approve/Reject buttons with remarks modal
```

### B6.7 Indian-Specific Utility Functions

```typescript
// src/utils/indian.ts — Generate ALL these:

// Format amount in Indian numbering system
formatINR(amount: number): string
// 123456 → "₹1,23,456.00"

// Format date in Indian style
formatDate(date: Date | string): string
// "DD/MM/YYYY"

// Indian Financial Year
getCurrentFY(): string
// Returns "2024-25" (April-March)
getFYDates(fy: string): { start: Date; end: Date }

// PAN validation
validatePAN(pan: string): boolean
// Regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

// Aadhar validation (Luhn algorithm check)
validateAadhar(aadhar: string): boolean

// IFSC validation
validateIFSC(ifsc: string): boolean
// Regex: /^[A-Z]{4}0[A-Z0-9]{6}$/

// Indian mobile number validation
validateMobile(phone: string): boolean
// /^[6-9]\d{9}$/

// GSTIN validation
validateGSTIN(gstin: string): boolean
// 15-char regex

// Calculate years of service
yearsOfService(joiningDate: Date): number

// Indian months in fiscal year order (Apr-Mar)
getMonthsInFY(fy: string): Array<{ month: number; year: number; label: string }>

// PT slab lookup (state-wise)
getProfessionalTax(grossSalary: number, state: string, month: number): number

// State names lookup (all 28 + 8 UTs)
INDIAN_STATES: { code: string; name: string; hasPT: boolean; hasLWF: boolean }[]
```

---

## B7. REAL-TIME NOTIFICATIONS (SignalR)
→ [BRD: M9-BR-12 push notifications]

```csharp
// NotificationHub.cs
// Connection groups:
//   user_{userId}         → personal notifications
//   role_{roleCode}       → role-wide broadcasts
//   company_{companyId}   → company-wide announcements

// Events to push via SignalR:
leave_approval_required     → to manager when employee applies
leave_status_updated        → to employee when approved/rejected
payroll_run_initiated       → to PAYROLL_ADMIN + HR_ADMIN
payroll_approved            → to PAYROLL_ADMIN
salary_slip_ready           → to employee when payroll disbursed
attendance_regularization   → to manager when employee requests
interview_scheduled         → to interviewer
offer_accepted              → to RECRUITMENT_MGR
new_joiner_today            → to HR_ADMIN
resignation_submitted       → to manager + HR
probation_ending_soon       → to manager (30 days before)
tds_deposit_reminder        → to PAYROLL_ADMIN (7th each month)
```

---

## B8. SEED DATA
→ [BRD: A2 Stakeholders]

### Default Users
```
superadmin   / Admin@123456  → SUPER_ADMIN    (MustChangePassword = true)
hr_admin     / HR@123456     → HR_ADMIN
hr_manager   / Mgr@123456    → HR_MANAGER
payroll_user / Pay@123456    → PAYROLL_ADMIN
recruiter    / Rec@123456    → RECRUITMENT_MGR
dept_manager / Dept@123456   → DEPT_MANAGER
employee1    / Emp@123456    → EMPLOYEE
auditor      / Aud@123456    → AUDITOR
```

### Demo Master Data
```
Company: "Bharat Technologies Pvt Ltd", CIN: U72900MH2020PTC123456
Departments: Engineering, HR, Finance, Sales, Operations
Designations: Intern, Junior Engineer, Engineer, Senior Engineer,
              Lead, Manager, Senior Manager, AGM, GM, Director
Locations: Mumbai HQ (Maharashtra), Bangalore (Karnataka), Delhi (Delhi)
Shifts: General (9:00-18:00, 15min grace), Morning (7:00-16:00), Night (22:00-07:00)
Leave Types: EL(18/yr), CL(8/yr), SL(12/yr), ML(182 days), PL(15 days), Comp-off, LWP
Holidays: All national holidays for current year + location-specific
Salary Components: Basic, HRA (40% Basic), Conveyance (₹1,600), 
                   Special Allowance (balance), PF Employee, ESI Employee, 
                   TDS, PT, LWF, Gratuity Provision
Salary Structure: "Standard CTC Structure"
10 demo employees with complete profiles, salary assignments, attendance records
```

---

## B9. DOCKER COMPOSE

```yaml
version: '3.9'
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "IndiaHRMS@2024!"
      MSSQL_PID: "Developer"
    ports: ["1433:1433"]
    volumes: [sqlserver_data:/var/opt/mssql]
    healthcheck:
      test: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "IndiaHRMS@2024!" -Q "SELECT 1"
      interval: 10s
      retries: 10

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports: ["5000:8080"]
    environment:
      ASPNETCORE_ENVIRONMENT: "Development"
      ConnectionStrings__DefaultConnection: "Server=sqlserver;Database=IndiaHRMS;User=sa;Password=IndiaHRMS@2024!;TrustServerCertificate=True"
      ConnectionStrings__Redis: "redis:6379"
    depends_on:
      sqlserver: { condition: service_healthy }
      redis: { condition: service_started }
    volumes: ["./uploads:/app/uploads"]

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports: ["3000:80"]
    environment:
      VITE_API_BASE_URL: "http://localhost:5000/api"
      VITE_SIGNALR_URL: "http://localhost:5000/hubs"
    depends_on: [api]

volumes:
  sqlserver_data:
  redis_data:
```

---

## B10. NON-FUNCTIONAL REQUIREMENTS
→ [BRD: A4 Compliance, Non-functional requirements]

### Security Checklist
- [ ] BCrypt password hashing (work factor 12)
- [ ] AES-256 encryption for Aadhar, PAN, Bank Account Number
- [ ] JWT RS256 (asymmetric signing), 60-minute expiry
- [ ] Refresh tokens stored as SHA-256 hash in DB
- [ ] Rate limiting: 100 req/min/user
- [ ] CORS: whitelist only (no wildcard in production)
- [ ] EF Core parameterized queries (no raw SQL with user input)
- [ ] Content-Security-Policy, X-Frame-Options, HSTS headers
- [ ] File upload: extension whitelist + size limit + MIME type check
- [ ] Account lockout: 5 failed attempts → 30-minute lockout
- [ ] Audit trail: every write operation logged

### Performance Checklist
- [ ] All list APIs paginated (default 20, max 100)
- [ ] Database indexes on all FK columns + frequently queried columns
- [ ] Redis cache: permissions lookup (5-min TTL), holiday calendar (1-day TTL), org chart
- [ ] Payroll calculation runs as Hangfire background job (not synchronous)
- [ ] PDF generation: background job + polling or streaming
- [ ] Lazy loading all React routes (code splitting)
- [ ] API response compression (gzip)

### Code Quality Checklist
- [ ] C# async/await everywhere (no .Result or .Wait())
- [ ] No magic strings (use `PermissionCodes.Employee.View` constants)
- [ ] Repository pattern: no DbContext injected in controllers
- [ ] MediatR for complex operations (CQRS)
- [ ] FluentValidation on every request DTO
- [ ] TypeScript strict mode: `"strict": true` in tsconfig
- [ ] No TypeScript `any` type
- [ ] TanStack Query (React Query) for all server state
- [ ] Proper error boundaries in React

---

## B11. ENVIRONMENT FILES

```bash
# backend/.env.example
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Server=.;Database=IndiaHRMS;Trusted_Connection=True
ConnectionStrings__Redis=localhost:6379
JwtSettings__SecretKey=REPLACE_WITH_256_BIT_SECRET
EncryptionSettings__Key=REPLACE_WITH_32_CHAR_AES_KEY
EncryptionSettings__IV=REPLACE_16_CHAR_IV
Email__SmtpHost=smtp.gmail.com
Email__SmtpPort=587
Email__FromEmail=noreply@yourcompany.com
Email__Username=YOUR_SMTP_USERNAME
Email__Password=YOUR_SMTP_PASSWORD

# frontend/.env.example
VITE_API_BASE_URL=https://localhost:5000/api
VITE_SIGNALR_URL=https://localhost:5000/hubs
VITE_APP_NAME=IndiaHRMS
VITE_APP_VERSION=1.0.0
VITE_APP_COMPANY=Your Company Name
```

---

## B12. GENERATION CHECKLIST FOR AI IDE

Work through this list in order. Check each before moving to next:

### Phase 1 — Backend Foundation
- [ ] Create solution with 4 projects (API, Application, Domain, Infrastructure)
- [ ] All Domain entities (45+ tables) with EF Core fluent configurations
- [ ] All enums (EmploymentStatus, LeaveStatus, PayrollStatus, etc.)
- [ ] AppDbContext with all DbSets, relationships, and indexes
- [ ] EF Core initial migration
- [ ] Seed data (roles, permissions, role-permissions matrix, default users, master data)
- [ ] Repository interfaces + generic repository implementation
- [ ] JWT auth: login, refresh token, logout
- [ ] Permission attribute + authorization middleware
- [ ] All middleware (Exception, Audit, Logging, RateLimit)

### Phase 2 — All API Controllers
- [ ] Auth Controller (complete)
- [ ] User Management Controller
- [ ] Employee Controller (all 20+ endpoints)
- [ ] Attendance Controller + import job
- [ ] Leave Controller + accrual job
- [ ] Payroll Controller + calculation service
- [ ] Recruitment Controller
- [ ] Performance Controller
- [ ] Training Controller
- [ ] Separation Controller + F&F calculator
- [ ] Reports Controller
- [ ] Dashboard Controller
- [ ] Notifications Controller + SignalR Hub

### Phase 3 — Frontend
- [ ] Vite + React 18 + TypeScript + Tailwind + Ant Design setup
- [ ] Axios instance with interceptors
- [ ] Zustand auth store
- [ ] React Router v6 with all routes (protected + permission-gated)
- [ ] AppLayout (sidebar + header)
- [ ] All shared components (DataTable, StatusBadge, FileUpload, etc.)
- [ ] Indian utility functions
- [ ] Login page (working with backend)
- [ ] All pages listed in B6.5
- [ ] Error pages (403, 404)

### Phase 4 — Integration & Polish
- [ ] Docker compose (working full-stack)
- [ ] PDF generation (salary slip, Form 16, letters)
- [ ] Excel export for all reports
- [ ] Email notifications
- [ ] Hangfire background jobs
- [ ] Swagger documentation on all endpoints
- [ ] FluentValidation on all DTOs
- [ ] Unit tests for PayrollCalculationService
- [ ] Unit tests for LeaveAccrualService

---

*HRMS Master Spec v1.0 | Combined BRD + Technical Spec | IndiaHRMS 2025*
*Modules: 12 | DB Tables: 45+ | API Endpoints: 100+ | UI Pages: 50+ | User Roles: 10*
