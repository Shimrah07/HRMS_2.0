# HRMS — Business Requirement Document (BRD)
## Indian Enterprise Human Resource Management System

> **Document Type:** Business Requirement Document
> **Version:** 1.0 — 2025
> **Target:** Indian Enterprises (50–5000 Employees)
> **Compliance:** Indian Labour Law, GST, PF, ESI, TDS, POSH, DPDP Act

---

## 1. EXECUTIVE SUMMARY

### 1.1 Purpose
यह document एक Indian company के लिए HRMS (Human Resource Management System) की complete business requirements define करता है। यह system HR से related सभी processes को automate और streamline करेगा — hiring से लेकर retirement तक।

### 1.2 Scope
- **In Scope:** 12 core HR modules, Indian statutory compliance, Employee Self-Service portal, Manager portal, HR Admin portal
- **Out of Scope:** ERP integration (Phase 2), AI/ML features (Phase 5), WhatsApp Bot (future)

### 1.3 Key Numbers

| Metric | Value |
|---|---|
| Core Modules | 12 |
| Features | 50+ |
| Indian Compliance Acts | 6+ |
| User Portals | 3 (Admin, Manager, Employee) |
| Target Company Size | 50–5000 employees |
| Supported States | All 28 states + 8 UTs |

### 1.4 Business Objectives
1. Eliminate manual/paper-based HR processes
2. Ensure 100% Indian statutory compliance (PF, ESI, TDS, PT, LWF, Gratuity, Bonus)
3. Reduce payroll processing time from days to hours
4. Provide employees real-time self-service access
5. Enable data-driven HR decisions through analytics

---

## 2. STAKEHOLDERS

| Stakeholder | Role | Primary Need |
|---|---|---|
| CEO / MD | Sponsor | Compliance, Cost control, Workforce visibility |
| HR Head | Primary User | End-to-end HR process management |
| HR Team | Daily User | Employee data, payroll, compliance |
| Finance Team | Secondary User | Payroll costs, statutory payments |
| Dept Managers | Secondary User | Team attendance, leave approvals, appraisals |
| Employees | End User | Self-service: salary slips, leaves, profile |
| Payroll Admin | Daily User | Payroll processing, statutory filings |
| IT Admin | Admin User | User management, system config |
| Auditors | Read-only | Compliance reports, audit trails |
| Legal/Compliance | Secondary | POSH, Labour law reports |

---

## 3. MODULE-WISE BUSINESS REQUIREMENTS

### MODULE M1 — Employee Master (Central Database)

**Business Need:** Company के सभी employee data का एक single source of truth चाहिए।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M1-BR-01 | Unique Employee ID auto-generation (company-wise prefix) | High |
| M1-BR-02 | Complete personal profile: Name, DOB, Gender, Blood Group, Marital Status, Religion, Nationality | High |
| M1-BR-03 | Official details: Department, Designation, Grade, Location, Cost Center, Reporting Manager | High |
| M1-BR-04 | Contact info: Personal email, official email, mobile, emergency contact | High |
| M1-BR-05 | Address: Permanent + Current (with pincode, city, state) | High |
| M1-BR-06 | Government IDs: Aadhar (encrypted), PAN (encrypted), UAN, ESI Number, Passport | High |
| M1-BR-07 | Document management: Upload, verify, and track documents (Aadhar, PAN, Photo, etc.) | High |
| M1-BR-08 | Bank account details (account number encrypted, IFSC) for salary credit | High |
| M1-BR-09 | Education history: Degree, institution, passing year, percentage | Medium |
| M1-BR-10 | Work experience history: Previous companies, designation, duration | Medium |
| M1-BR-11 | Family/Nominee details for PF nomination | High |
| M1-BR-12 | Employment lifecycle tracking: Joining → Transfer → Promotion → Resignation → Exit | High |
| M1-BR-13 | Probation period tracking + confirmation workflow with notifications | High |
| M1-BR-14 | Company directory: searchable by name, dept, designation, location | Medium |
| M1-BR-15 | Org chart: hierarchical visual view of reporting structure | Medium |

---

### MODULE M2 — Recruitment (Applicant Tracking System)

**Business Need:** Vacancy से offer letter तक का पूरा hiring process एक platform पर।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M2-BR-01 | Manpower requisition: department head raises request with job description | High |
| M2-BR-02 | Multi-level approval for requisitions (Dept Head → HR → Finance → CEO) | High |
| M2-BR-03 | Candidate database: store resumes, contact info, skills, experience | High |
| M2-BR-04 | Resume parsing: extract data from uploaded PDF/Word resume | Medium |
| M2-BR-05 | Interview scheduling: date, time, interviewer assignment, mode (in-person/video) | High |
| M2-BR-06 | Interview feedback form per round (rating + comments) | High |
| M2-BR-07 | Application stage tracking: Applied → Shortlisted → Interview → Offer → Joined | High |
| M2-BR-08 | Offer letter generation from template (customizable per company) | High |
| M2-BR-09 | Offer acceptance tracking + expiry date | High |
| M2-BR-10 | Auto-convert accepted offer to employee record (trigger onboarding) | High |
| M2-BR-11 | Background verification tracking: status, agency, completion date | Medium |
| M2-BR-12 | Recruitment source tracking: Naukri, LinkedIn, Referral, Walk-in, Campus | Medium |
| M2-BR-13 | Recruitment cost tracking per position | Low |
| M2-BR-14 | Hiring analytics: funnel report, time-to-hire, cost-per-hire | Medium |

---

### MODULE M3 — Onboarding

**Business Need:** New joiner का experience smooth हो, कोई document या task miss न हो।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M3-BR-01 | Digital onboarding checklist: auto-assigned tasks per department/role | High |
| M3-BR-02 | Document collection: online form to collect required documents before joining | High |
| M3-BR-03 | Pre-joining portal: new employee can fill data before Day 1 | Medium |
| M3-BR-04 | Asset allocation tracking: laptop, ID card, access card, SIM card | High |
| M3-BR-05 | IT account creation trigger: email, software access requests | Medium |
| M3-BR-06 | Buddy/mentor assignment for new joiners | Low |
| M3-BR-07 | Induction training schedule auto-assignment | Medium |
| M3-BR-08 | Probation period auto-set based on offer letter / policy | High |
| M3-BR-09 | Confirmation reminder to manager 30 days before probation end | High |
| M3-BR-10 | Onboarding completion percentage tracking | Medium |

---

### MODULE M4 — Attendance & Time Management

**Business Need:** Accurate attendance tracking with multiple input methods, linked to payroll।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M4-BR-01 | Biometric integration: import punches from device via API/file | High |
| M4-BR-02 | Mobile app attendance: geo-fenced check-in/check-out with location capture | High |
| M4-BR-03 | Manual attendance entry for exceptions (HR admin only) | High |
| M4-BR-04 | Shift master: define multiple shifts with start/end time, grace period | High |
| M4-BR-05 | Shift assignment: per employee, effective date | High |
| M4-BR-06 | Shift rotation/roster planning | Medium |
| M4-BR-07 | Late mark rules: configurable grace period, half-day threshold | High |
| M4-BR-08 | Overtime calculation: as per Factories Act (1.5x / 2x configurable) | High |
| M4-BR-09 | Work From Home (WFH) marking with manager approval | High |
| M4-BR-10 | Attendance regularization: employee requests correction, manager approves | High |
| M4-BR-11 | Monthly attendance summary per employee (Present/Absent/Leave/Holiday/WFH count) | High |
| M4-BR-12 | Holiday calendar: National + State + Company holidays (location-wise) | High |
| M4-BR-13 | Weekly off configuration (Saturday, Sunday, alternate Saturday, etc.) | High |
| M4-BR-14 | Attendance linked to payroll: paid days auto-calculated | High |
| M4-BR-15 | Attendance reports: daily, monthly, department-wise, exceptions report | High |

---

### MODULE M5 — Leave Management

**Business Need:** Leave tracking as per Indian labour law, with online apply/approve flow।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M5-BR-01 | Leave types: Casual Leave (CL), Earned Leave (EL), Sick Leave (SL), Maternity Leave (ML), Paternity Leave (PL), Comp-off, Leave Without Pay (LWP) | High |
| M5-BR-02 | Leave policy configuration: max days/year, carry-forward rules, accrual schedule | High |
| M5-BR-03 | Monthly EL accrual (1.5 days/month after 1 year service) | High |
| M5-BR-04 | Leave balance display per employee per type | High |
| M5-BR-05 | Online leave application with date picker and reason | High |
| M5-BR-06 | Manager approval/rejection with remarks | High |
| M5-BR-07 | Leave cancellation (employee) with approval | High |
| M5-BR-08 | Leave carry-forward on year-end (configurable max) | High |
| M5-BR-09 | Leave encashment calculation (EL balance × Basic/26) | High |
| M5-BR-10 | Maternity Benefit Act 1961: 26 weeks paid ML auto-entitlement | High |
| M5-BR-11 | Paternity leave: 15 days (configurable) | Medium |
| M5-BR-12 | Comp-off: grant for working on holidays/weekends, expiry tracking | Medium |
| M5-BR-13 | Team leave calendar: manager can see team availability | Medium |
| M5-BR-14 | Holiday auto-deduction: if holiday falls within leave period | High |
| M5-BR-15 | Leave reports: utilization, balance, LWP summary | High |

---

### MODULE M6 — Payroll Engine (India-Specific)

**Business Need:** Accurate, compliant payroll processing with all Indian statutory deductions।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M6-BR-01 | CTC structuring: Basic, HRA, DA, Conveyance, Special Allowance, Perks, LTA | High |
| M6-BR-02 | PF deduction: Employee 12% + Employer 12% of Basic (capped at ₹15,000) | High |
| M6-BR-03 | ESI deduction: Employee 0.75% + Employer 3.25% (if Gross ≤ ₹21,000) | High |
| M6-BR-04 | TDS calculation: Income Tax as per applicable slabs (New & Old Regime, employee choice) | High |
| M6-BR-05 | Professional Tax: state-wise slab deduction (MH, KA, WB, TN, AP, TS, etc.) | High |
| M6-BR-06 | Labour Welfare Fund (LWF): state-specific half-yearly deduction | High |
| M6-BR-07 | Gratuity provision: (Basic+DA) × 15/26/12 per month (after 1 year service) | High |
| M6-BR-08 | Statutory Bonus: 8.33% of Basic (Bonus Act 1965, salary ≤ ₹21,000) | High |
| M6-BR-09 | LWP deduction: (Gross / Working days) × LWP days | High |
| M6-BR-10 | Overtime addition: auto from attendance module | High |
| M6-BR-11 | Reimbursements: Meal voucher, Medical, Phone, Internet (non-taxable limits) | Medium |
| M6-BR-12 | Arrears processing: for increment given late | Medium |
| M6-BR-13 | Payroll lock: once run is approved, no changes allowed | High |
| M6-BR-14 | Maker-Checker: payroll processed by Payroll Admin, approved by Finance/HR Head | High |
| M6-BR-15 | Salary slip PDF: company logo, employee details, earnings, deductions, net pay, YTD | High |
| M6-BR-16 | Bank transfer file: NEFT/RTGS format (bank-specific formats configurable) | High |
| M6-BR-17 | Form 16 / 12BA generation (annual) | High |
| M6-BR-18 | Form 24Q quarterly filing data | High |
| M6-BR-19 | PF monthly challan + ECR file generation | High |
| M6-BR-20 | ESI monthly challan generation | High |
| M6-BR-21 | Tax declaration: Form 12BB online submission by employee | High |
| M6-BR-22 | New vs Old Tax Regime comparison tool for employee | Medium |
| M6-BR-23 | Salary revision: increment letter, effective date, payroll auto-update | High |
| M6-BR-24 | Full & Final payroll on exit: includes leave encashment, gratuity, pending dues | High |

---

### MODULE M7 — Performance Management (PMS)

**Business Need:** Merit-based appraisal system with KRA/KPI framework and 360° feedback।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M7-BR-01 | Appraisal cycle configuration: Annual, Half-yearly, Quarterly | High |
| M7-BR-02 | Goal setting: KRA/KPI with description, target, weightage | High |
| M7-BR-03 | Mid-year review: update actuals against targets | Medium |
| M7-BR-04 | Year-end review: self-rating + manager rating on each KPI | High |
| M7-BR-05 | 360° feedback: from peers, subordinates, internal customers | Medium |
| M7-BR-06 | Overall rating with weighted average calculation | High |
| M7-BR-07 | Rating normalization / bell-curve calibration by HR | Medium |
| M7-BR-08 | Increment linking: rating to increment % mapping (configurable) | High |
| M7-BR-09 | Promotion recommendation in appraisal form | Medium |
| M7-BR-10 | Performance Improvement Plan (PIP): initiation, milestones, tracking | High |
| M7-BR-11 | Appraisal history per employee (multi-year view) | Medium |
| M7-BR-12 | Performance analytics: rating distribution, top performers, low performers | Medium |
| M7-BR-13 | OKR support (Objectives & Key Results framework) | Low |

---

### MODULE M8 — Training & Development (LMS)

**Business Need:** Skill development tracking, compliance training management, TNI process।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M8-BR-01 | Training need identification (TNI): from appraisal gaps + employee requests | High |
| M8-BR-02 | Training program catalog: internal, external, online, offline | High |
| M8-BR-03 | Training schedule & calendar | High |
| M8-BR-04 | Employee nomination: HR/Manager nominates, employee accepts | High |
| M8-BR-05 | Attendance tracking for training sessions | Medium |
| M8-BR-06 | Post-training feedback & effectiveness rating | Medium |
| M8-BR-07 | Certificate upload and expiry tracking (for regulatory/statutory trainings) | High |
| M8-BR-08 | Mandatory training compliance: flag employees who haven't completed | High |
| M8-BR-09 | Training cost tracking per program and per employee | Medium |
| M8-BR-10 | Skill matrix: track skills per employee, identify gaps | Medium |
| M8-BR-11 | Training ROI report | Low |

---

### MODULE M9 — Employee Self-Service (ESS)

**Business Need:** Employees ko 24/7 apna HR data access दो, HR team पर load कम करो।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M9-BR-01 | Profile view and limited self-update (contact, address, bank details) | High |
| M9-BR-02 | Salary slip download: any month, any year | High |
| M9-BR-03 | Leave apply, check balance, view history, cancel | High |
| M9-BR-04 | Attendance view: monthly calendar with status | High |
| M9-BR-05 | Attendance regularization request | High |
| M9-BR-06 | Tax declaration form (Form 12BB) online submission | High |
| M9-BR-07 | Investment proof upload for tax | High |
| M9-BR-08 | Reimbursement and expense claim submission | Medium |
| M9-BR-09 | Document download: offer letter, appointment letter, confirmation letter, Form 16 | High |
| M9-BR-10 | Helpdesk ticket: raise IT/HR queries, track status | Medium |
| M9-BR-11 | Company directory & org chart access | Low |
| M9-BR-12 | Birthday and work anniversary notifications | Low |
| M9-BR-13 | My goals and appraisal status | Medium |
| M9-BR-14 | Mobile app: all ESS features on iOS and Android | High |
| M9-BR-15 | Push notifications: leave approval, salary slip, important HR announcements | Medium |

---

### MODULE M10 — Separation & Exit Management

**Business Need:** Employee exit process legal aur smooth hona chahiye, timely F&F ho।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M10-BR-01 | Resignation submission: employee submits online with last working day | High |
| M10-BR-02 | Manager / HR acknowledgment and acceptance workflow | High |
| M10-BR-03 | Notice period calculation: as per offer letter / policy | High |
| M10-BR-04 | Notice period buyout/waiver calculation | High |
| M10-BR-05 | Exit interview: online questionnaire, responses captured | Medium |
| M10-BR-06 | No-dues clearance: multi-department checklist (IT, Finance, Admin, Library, etc.) | High |
| M10-BR-07 | Full & Final (F&F) settlement calculation: pending salary + leave encashment + gratuity + bonus - deductions | High |
| M10-BR-08 | PF withdrawal / transfer form generation (Form 19, Form 10C) | High |
| M10-BR-09 | Experience letter generation (auto from template) | High |
| M10-BR-10 | Relieving letter generation | High |
| M10-BR-11 | Termination workflow: HR initiation, reasons, documentation | High |
| M10-BR-12 | Absconding handling: mark and document | Medium |
| M10-BR-13 | Attrition analytics: exit reasons, department-wise, month-wise | Medium |

---

### MODULE M11 — Reports & Analytics

**Business Need:** HR decisions data-driven hon, statutory filings on time हों।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M11-BR-01 | Headcount report: total, active, on notice, by dept, by location, by grade | High |
| M11-BR-02 | Attrition report: monthly, quarterly, annual trend, by dept, by reason | High |
| M11-BR-03 | Payroll cost report: gross, net, CTC, component-wise, month-wise | High |
| M11-BR-04 | Attendance summary: present%, absent%, late%, WFH%, OT hours | High |
| M11-BR-05 | Leave utilization: type-wise, dept-wise, LWP summary | High |
| M11-BR-06 | Statutory reports: PF challan, ESI return, TDS (24Q), PT remittance | High |
| M11-BR-07 | Hiring report: open positions, TAT (time-to-hire), source analysis | Medium |
| M11-BR-08 | Performance distribution: rating bell curve, dept-wise ratings | Medium |
| M11-BR-09 | Training completion: completion %, cost, effectiveness | Medium |
| M11-BR-10 | HR dashboard: real-time KPIs (configurable cards and charts) | High |
| M11-BR-11 | Custom report builder: select fields, apply filters, export | Medium |
| M11-BR-12 | Export to Excel, CSV, PDF for all reports | High |
| M11-BR-13 | Scheduled report email: send reports to defined recipients on schedule | Low |
| M11-BR-14 | Manpower budget vs actual report | Medium |

---

### MODULE M12 — Organization & Compliance Management

**Business Need:** Legal compliance mandatory है, org structure maintained रहे।

#### Functional Requirements:
| Req ID | Requirement | Priority |
|---|---|---|
| M12-BR-01 | Company master: CIN, PAN, TAN, GSTIN, registered address, logo | High |
| M12-BR-02 | Department master: create, edit, parent-child hierarchy, HOD assignment | High |
| M12-BR-03 | Designation master: grade, level, pay band | High |
| M12-BR-04 | Location master: address, state (for PT/Shops Act), head office flag | High |
| M12-BR-05 | Cost center management | Medium |
| M12-BR-06 | POSH Act 2013: complaint registration, ICC committee, investigation tracking, annual report | High |
| M12-BR-07 | Grievance management: employee raises, HR tracks, resolution workflow | High |
| M12-BR-08 | Disciplinary action workflow: show cause, hearing, order, appeal | High |
| M12-BR-09 | Contract labour register | Medium |
| M12-BR-10 | Labour license & compliance certificate renewal tracker | Medium |
| M12-BR-11 | Shops & Establishments Act register (state-wise) | High |
| M12-BR-12 | Audit trail: who changed what and when (all modules) | High |
| M12-BR-13 | DPDP Act 2023: employee consent, data access log, deletion request | High |

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance
| Requirement | Target |
|---|---|
| Page load time | < 2 seconds |
| API response time | < 500ms for 95% requests |
| Payroll processing | 1000 employees in < 5 minutes |
| Concurrent users | 500+ simultaneous |
| Report generation | < 30 seconds for 12 months data |

### 4.2 Security
| Requirement | Detail |
|---|---|
| Password policy | Min 8 chars, uppercase, lowercase, number, special char |
| Session timeout | 8 hours active, 30 minutes idle |
| Sensitive data encryption | Aadhar, PAN, Bank Account — AES-256 at rest |
| Data in transit | TLS 1.3 minimum |
| Failed login lockout | 5 attempts → 30-minute lockout |
| Audit trail | All data changes logged with user, timestamp, old/new values |
| Role-based access | No data visible beyond user's role scope |

### 4.3 Availability
- Uptime: 99.5% (excluding planned maintenance)
- Maintenance window: Sunday 2 AM – 4 AM
- Backup: Daily automated, 30-day retention
- Disaster recovery: 4-hour RTO, 1-hour RPO

### 4.4 Usability
- Mobile-responsive UI
- Works on Chrome, Firefox, Safari, Edge (latest 2 versions)
- Hindi + English UI labels (bilingual support)
- Screen reader accessible (WCAG 2.1 AA)

---

## 5. INDIAN STATUTORY COMPLIANCE REQUIREMENTS

### 5.1 Employees' Provident Fund (EPF Act 1952)
- Employee contribution: 12% of Basic (employee's share)
- Employer contribution: 12% of Basic → EPS 8.33% (capped ₹1,250), EDLI 0.5%, Admin 0.5%, EPF balance
- Wage ceiling: ₹15,000/month for mandatory PF
- UAN management: generate, link, transfer
- Monthly ECR (Electronic Challan cum Return) file generation
- PF transfer on exit (Form 13)
- PF withdrawal support (Form 19, 10C, 31)
- KYC update facility

### 5.2 Employees' State Insurance (ESI Act 1948)
- Applicable: Gross salary ≤ ₹21,000/month
- Employee contribution: 0.75% of Gross
- Employer contribution: 3.25% of Gross
- IP (Insured Person) number generation
- Monthly challan and half-yearly return
- Form 7 register maintenance

### 5.3 Income Tax / TDS (Income Tax Act 1961)
- New Tax Regime (default from FY 2024-25) + Old Tax Regime (employee choice)
- Monthly TDS calculation with annualization
- Section 80C, 80D, HRA, LTA, Standard Deduction
- Form 12BB: employee investment declaration
- Form 16 Part A + Part B generation
- Form 12BA for perquisites
- Quarterly 24Q return data
- TDS certificate on exit

### 5.4 Professional Tax (State-specific)
- Applicable states: Maharashtra, Karnataka, West Bengal, Tamil Nadu, Andhra Pradesh, Telangana, Gujarat (some districts), Madhya Pradesh, Orissa
- State-wise slab configuration
- Monthly or annual deduction (state-wise)
- PT returns support

### 5.5 Gratuity (Payment of Gratuity Act 1972)
- Eligibility: 5+ years of continuous service
- Formula: (Last Basic + DA) × 15/26 × Years of service
- Maximum: ₹20 lakhs
- Auto-calculation on separation
- Gratuity provision monthly booking

### 5.6 Bonus (Payment of Bonus Act 1965)
- Applicable: Salary ≤ ₹21,000/month
- Minimum: 8.33% of Basic (or ₹100 × 8.33% if lower)
- Maximum: 20% of annual Basic
- Eligibility: worked 30+ days in accounting year

### 5.7 Maternity Benefits (Maternity Benefit Act 1961)
- 26 weeks paid leave for first 2 children
- 12 weeks for 3rd child onwards
- 12 weeks for adoption / commissioning mothers
- Medical bonus: ₹3,500 if no prenatal/postnatal care provided
- Crèche facility reminder if 50+ employees

### 5.8 Labour Welfare Fund (LWF)
- Applicable states: Maharashtra, Karnataka, Andhra Pradesh, Gujarat, Tamil Nadu, Madhya Pradesh, Goa, Odisha, Punjab, Telangana
- Employee + Employer contribution (state-wise amounts)
- June and December remittance

### 5.9 POSH Act 2013
- ICC (Internal Complaints Committee) committee management
- Complaint registration and tracking
- 90-day resolution timeline enforcement
- Annual report generation

### 5.10 DPDP Act 2023
- Employee data processing consent
- Data minimization principles
- Right to correction and erasure
- Data breach notification workflow
- Data localization (India servers)

---

## 6. USER STORY EXAMPLES

### Employee (Rahul, Software Engineer)
> "Mujhe aaj leave leni hai, toh main mobile se apply karunga, mere manager ko notification jayegi, aur unke approve karte hi mera balance update ho jayega. Salary slip bhi kabhi bhi download kar sakta hoon."

### Manager (Priya, Engineering Manager)
> "Main apni team ka aaj ka attendance ek screen pe dekh sakti hoon, pending leave requests approve kar sakti hoon, aur appraisal season mein sab ke goals rate kar sakti hoon."

### HR Admin (Amit, HR Manager)
> "Har mahine payroll ek click mein process ho jata hai. PF challan auto-generate ho jata hai. Form 16 sab employees ko automatically email ho jata hai."

### Payroll Admin (Sunita)
> "Payroll run ke baad ek bank file download karti hoon aur directly bank portal pe upload karti hoon. Koi manual calculation nahi."

---

## 7. BUSINESS PROCESS FLOWS

### 7.1 Employee Lifecycle Flow
```
Job Opening → Requisition Approval → Job Posting → Resume Screening
→ Interviews → Offer Letter → Acceptance → Background Verification
→ Pre-Joining Documentation → Day 1 Onboarding → Probation Period
→ Confirmation → Active Employment (Attendance + Leave + Payroll + PMS)
→ Resignation / Retirement → Notice Period → No-Dues → F&F Settlement → Exit
```

### 7.2 Monthly Payroll Process Flow
```
Attendance Finalization (by 28th)
→ Leave Reconciliation
→ New Joiners + Exits + Salary Revisions Input
→ Payroll Run Initiation (Payroll Admin)
→ Payroll Calculation (auto: TDS, PF, ESI, PT, OT, LWP)
→ Review Payroll Register
→ Payroll Approval (HR Head / Finance)
→ Bank File Generation + Upload
→ Salary Slip Distribution (email + ESS)
→ PF/ESI Challan Generation + Payment
→ TDS Deposit (7th of next month)
```

### 7.3 Leave Approval Flow
```
Employee Applies → Manager Notified → Manager Approves/Rejects
→ Employee Notified → Leave Balance Updated
→ Attendance Module Updated → Payroll Updated (if LWP)
```

### 7.4 Appraisal Cycle Flow
```
HR Opens Cycle → Employee Sets Goals (with manager)
→ Mid-Year Review (self + manager)
→ Year-End: Self Rating → Manager Rating → HR Review
→ Normalization / Calibration → Final Rating
→ Increment Letter → Payroll Updated
```

### 7.5 Separation Flow
```
Employee Submits Resignation → Manager Acknowledges → HR Accepts
→ Notice Period Starts → Exit Interview Scheduled
→ No-Dues Initiated (all depts clear) → F&F Calculated
→ F&F Approved → Final Salary + Gratuity + Encashment Paid
→ PF Transfer / Withdrawal Processed
→ Experience Letter + Relieving Letter Issued → Account Deactivated
```

---

## 8. DATA FLOW SUMMARY

### Data Inputs
| Source | Data |
|---|---|
| Biometric Device | Attendance punches (in/out timestamps) |
| Employee | Personal data, documents, leave applications, tax declaration |
| Manager | Approvals, ratings, feedback |
| HR Admin | Salary structures, policies, compliance data |
| Payroll Admin | Payroll overrides, statutory payments |

### Data Outputs
| Output | Recipient |
|---|---|
| Salary Slips | Employees (email + ESS download) |
| Form 16 | Employees (annual) |
| PF ECR File | EPFO portal |
| ESI Challan | ESIC portal |
| TDS 24Q | Income Tax portal |
| Bank Transfer File | Bank NEFT/RTGS portal |
| HR MIS Reports | Management |
| Attrition / Headcount | HR Head + CEO |

---

## 9. INTEGRATION REQUIREMENTS

| Integration | Purpose | Priority |
|---|---|---|
| Biometric Device | Attendance data import | High |
| Email Server (SMTP) | Notifications, salary slips, Form 16 | High |
| SMS Gateway | OTP, leave alerts, salary credit alert | Medium |
| Bank Portal | Salary transfer file (NEFT format) | High |
| EPFO Portal | PF ECR file upload | High |
| ESIC Portal | ESI return filing | High |
| Income Tax Portal | 24Q TDS return | High |
| Naukri / LinkedIn | Job posting (Phase 2) | Low |
| Tally / SAP | Payroll JV posting (Phase 2) | Medium |
| Azure AD / Google | SSO for enterprise login (Phase 2) | Medium |

---

## 10. IMPLEMENTATION PHASES

### Phase 1 — Foundation (Month 1–3)
**Go-Live Target:** Core HR operational
- Employee Master setup
- Organization structure (Dept, Designation, Location)
- Attendance (Biometric + Manual)
- Leave Management
- Basic Payroll (with PF, ESI, TDS, PT)
- Salary Slips
- HR Admin Dashboard

### Phase 2 — Compliance & ESS (Month 4–6)
**Go-Live Target:** Statutory compliance + employee portal live
- Complete statutory reports (PF ECR, ESI, 24Q, Form 16)
- Employee Self-Service portal
- Mobile app (basic: attendance, leave, salary slip)
- Onboarding module
- Bank transfer file

### Phase 3 — Talent Management (Month 7–10)
**Go-Live Target:** Hiring + performance automated
- Recruitment / ATS
- Performance Management (KRA/KPI + reviews)
- Training & Development
- Separation / F&F

### Phase 4 — Analytics & Compliance (Month 11–15)
**Go-Live Target:** Data-driven HR
- HR Analytics Dashboard
- Custom Report Builder
- POSH Module
- Grievance Management
- Complete audit trail

### Phase 5 — AI & Integrations (Month 16–18)
**Go-Live Target:** Smart HRMS
- Predictive attrition analysis
- AI-powered HR chatbot
- Tally/SAP payroll JV integration
- Job portal API integration (Naukri, LinkedIn)

---

## 11. GLOSSARY

| Term | Full Form / Meaning |
|---|---|
| CTC | Cost to Company |
| PF / EPF | Provident Fund / Employees' Provident Fund |
| ESI / ESIC | Employees' State Insurance (Corporation) |
| TDS | Tax Deducted at Source |
| PT | Professional Tax |
| LWF | Labour Welfare Fund |
| UAN | Universal Account Number (PF) |
| LWP | Leave Without Pay |
| EL | Earned Leave |
| CL | Casual Leave |
| SL | Sick Leave |
| ML | Maternity Leave |
| PL | Paternity Leave |
| F&F | Full and Final Settlement |
| TNI | Training Need Identification |
| PMS | Performance Management System |
| KRA | Key Result Area |
| KPI | Key Performance Indicator |
| OKR | Objectives and Key Results |
| PIP | Performance Improvement Plan |
| ATS | Applicant Tracking System |
| ICC | Internal Complaints Committee (POSH) |
| ECR | Electronic Challan cum Return (PF) |
| RBAC | Role-Based Access Control |
| ESS | Employee Self-Service |
| BRD | Business Requirement Document |
| DPDP | Digital Personal Data Protection (Act 2023) |
| POSH | Prevention of Sexual Harassment (Act 2013) |
| FY | Financial Year (April – March in India) |

---

*BRD Version 1.0 | IndiaHRMS | 2025 | Confidential*
