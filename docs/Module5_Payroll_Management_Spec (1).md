# HRMS — Module 5: Payroll Management System
## Build Specification for Antigravity IDE

> **Context for Antigravity Agent:** This module is being added to an **existing HRMS project**. Modules 1–4 (Employee Master, Onboarding, Attendance, Leave) are already built and live in this codebase. Follow the SAME architecture, folder structure, naming conventions, auth/RBAC pattern, and coding style already used in Modules 1–4. Do not create a new solution/project — extend the existing one.

**Tech Stack (mandatory — match existing project):**
- **Frontend:** React (existing HRMS frontend app) — add Module 5 as new feature folder/routes
- **Backend:** .NET Core 8 (Web API) — add Module 5 as new Controllers/Services/Entities inside existing solution
- **Database:** Same DB used by Modules 1–4 (SQL Server assumed unless project uses another RDBMS — detect from existing `DbContext`/connection string and match it)
- **ORM:** Entity Framework Core (use existing `AppDbContext` — add new `DbSet`s for Payroll entities, generate migration, do not create a separate context unless the project already separates contexts per module)
- **Auth/RBAC:** Reuse existing JWT/Identity + Role/Claims-based authorization already implemented for Modules 1–4. Add the 7 new Payroll roles/permissions listed in Section 10 to the existing role/permission system (do not build a parallel auth system).
- **Integration:** Module 5 MUST consume real data from **Module 3 (Attendance)** and **Module 4 (Leave)** via their existing services/repositories or internal API calls — do not mock this data.

**Before starting, Antigravity should:**
1. Scan the existing solution structure (`/Controllers`, `/Services`, `/Entities` or `/Models`, `/DTOs`, `/Migrations` on backend; `/src/modules` or `/src/features` on frontend) and mirror it exactly for Module 5.
2. Identify how Modules 1–4 expose their APIs (versioning, response wrapper format, error handling middleware, pagination pattern) and reuse the same conventions for all new Payroll endpoints.
3. Identify the existing RBAC/permission table structure and extend it — do not redesign it.

---

## 1.0 Module Overview

**Purpose:** Payroll Management module employee ki salary ko attendance, leave, statutory deductions aur income tax rules ke saath accurately calculate karke, monthly disbursement tak process karta hai. India-specific compliance — PF, ESI, PT, TDS, Gratuity, Bonus — sab automated, aur Attendance (Module 3) & Leave (Module 4) se seedha data leta hai.

**Scope at a glance:**
| Metric | Value |
|---|---|
| Sub-Modules | 8 |
| Input Fields | 160+ |
| Statutory Deductions | 9 |
| User Roles | 7 |
| Workflow Steps | 20 |
| Reports | 18 |
| Notifications | 24+ |
| Sector Configs | 8 |
| API Endpoints | 16 |

### 8 Sub-Modules
1. **5.1** Salary Structure Setup
2. **5.2** Statutory Deductions
3. **5.3** Income Tax Management
4. **5.4** Payroll Processing Engine
5. **5.5** Payment & Disbursement
6. **5.6** Payroll Documents & Compliance Filing
7. **5.7** Sector-Specific Payroll Configuration
8. **5.8** Payroll Dashboard & Analytics

### Key Business Rules (implement as backend validation/domain rules, not just UI checks)
- Payroll run sirf attendance module se data **frozen** hone ke baad hi start hoga.
- PF = 12% employee + 12% employer, capped at ₹15,000 basic (statutory ceiling, must be **configurable** for higher PF).
- ESI applicable jab gross salary ≤ ₹21,000/month → 0.75% employee + 3.25% employer.
- TDS calculation: system compares **both** Old and New regime, then applies employee-selected regime.
- Payroll **lock** hone ke baad koi edit nahi — sirf Supplementary Run se correction possible.
- Gratuity: eligible after 5 years of service (exception for death/disability).
- Statutory bonus applicable only for employees with salary ≤ ₹21,000/month.
- Bank file generation only from **approved & locked** payroll.

### Key Metrics System Must Track
- Payroll Processing Accuracy % & TAT
- Total CTC vs Gross vs Net Payout
- Statutory Compliance Score (PF/ESI/PT/TDS filing status)
- LOP Impact & Attendance-Payroll Reconciliation
- Bank Disbursement Success Rate
- Tax Regime Split (Old vs New)
- Full & Final Settlement TAT
- Payroll Cost Trend (Month over Month)

---

## 2.0 Master Payroll Flow — End to End (20 Steps / State Machine)

Implement this as a **PayrollRun status/state machine** (backend-enforced, not just UI stepper).

### Phase 1: Input Collection & Validation
| # | Step | Actor | Detail |
|---|---|---|---|
| 1 | Attendance Data Pull | System (Auto) | From frozen Module 3 data |
| 2 | Leave & LOP Sync | System (Auto) | From Module 4 |
| 3 | Variable Inputs Collected | HR / Manager | Incentive, arrears, reimbursement |
| 4 | Input Validation | System (Auto) | Cross-check all sources |
| 5 | Inputs Locked | Payroll Admin | Ready for calculation |

### Phase 2: Calculation & Review
| # | Step | Actor | Detail |
|---|---|---|---|
| 6 | Payroll Run Triggered | Payroll Admin | Monthly batch process |
| 7 | Gross Salary Calculated | Calculation Engine | Structure − LOP + arrears |
| 8 | Statutory Deductions Applied | Calculation Engine | PF, ESI, PT, LWF |
| 9 | TDS Calculated | Calculation Engine | Old vs New regime compare |
| 10 | Net Pay Computed | Calculation Engine | Gross − all deductions |
| 11 | Variance Report Review | Payroll Admin | Compare with last month |
| 12 | Finance/CHRO Approval | Finance Head | Sign-off before lock |

### Phase 3: Disbursement & Compliance
| # | Step | Actor | Detail |
|---|---|---|---|
| 13 | Payroll Locked | System (Auto) | No further edits allowed |
| 14 | Bank File Generated | System (Auto) | NEFT/RTGS format per bank |
| 15 | Bank Upload & Disbursement | Finance Team | Salary credited to employees |
| 16 | Payslip Generation | System (Auto) | Password-protected PDF |
| 17 | Statutory Challans Prepared | System (Auto) | PF, ESI, PT, TDS |
| 18 | Statutory Payment & Filing | Compliance Team | Before due dates |
| 19 | GL / Accounting Export | System (Auto) | To Finance/ERP system |
| 20 | Payroll Cycle Closed | System (Auto) | Archived, audit trail locked |

**PayrollRun.Status enum:** `Draft → InputsLocked → Calculated → UnderReview → Approved → Locked → Disbursed → Closed` (plus `OnHold`, `Rejected` as needed).

---

## 3.0 Sub-Module 5.1 — Salary Structure Setup

Flexible CTC component builder — Basic se Reimbursements tak.

### Salary Component Master (Entity: `SalaryComponent`)
| Component | Category | Calculation Basis | Taxability |
|---|---|---|---|
| Basic Salary | Earning - Fixed | % of CTC (typically 40–50%) | Fully Taxable |
| House Rent Allowance (HRA) | Earning - Fixed | % of Basic (metro 50%, non-metro 40%) | Partially exempt u/s 10(13A) |
| Dearness Allowance (DA) | Earning - Fixed | Fixed % or CPI-linked | Fully Taxable |
| Conveyance / Transport Allowance | Earning - Fixed | Fixed amount | Taxable (post-2018 amendment) |
| Special Allowance | Earning - Fixed | Balancing figure (CTC − other components) | Fully Taxable |
| City Compensatory Allowance (CCA) | Earning - Fixed | City-tier based fixed amount | Fully Taxable |
| Leave Travel Allowance (LTA) | Earning - Fixed | Fixed annual amount | Exempt on proof (2 in 4-yr block) |
| Medical Allowance | Earning - Fixed | Fixed amount | Taxable (post-2018) |
| Children Education Allowance | Earning - Fixed | ₹100/month/child (max 2 children) | Exempt up to statutory limit |
| Washing Allowance | Earning - Fixed | Fixed (uniform-based roles) | Taxable |
| Shift Allowance | Earning - Variable | Per shift, night shift premium | Fully Taxable |
| Performance Bonus / Incentive | Earning - Variable | KRA/target-linked | Fully Taxable |
| Reimbursements | Earning - Variable (Tax-free) | Actual bills against fixed limit | Exempt (fuel, telephone, books) |
| Employer PF Contribution | CTC Component (non-cash) | 12% of Basic (capped) | Not taxable to employee |

### CTC → In-Hand Calculator (UI widget + backend endpoint)
**Inputs:** Annual CTC*, Grade/Band* (Grade B - Executive, Grade C - Senior Executive, …), City Category (Metro/Non-Metro), Tax Regime Preference (New/Old)
**Outputs (calculated):** Basic (Monthly), HRA (Monthly), Special Allowance, Employer PF, Gross Monthly Salary, Est. Deductions, Estimated In-Hand

### Validation Rules
- Basic salary should not be less than statutory minimum wage (state-wise) for that grade/role.
- Sum of all fixed components must equal Fixed CTC (balancing via Special Allowance).
- HRA cannot exceed 50% of Basic (metro) / 40% (non-metro) for tax exemption eligibility.
- PF contribution mandatory if Basic+DA ≤ ₹15,000; optional above (employee can opt for higher PF).
- Reimbursement components require bill submission; unclaimed amount lapses or is taxed.

---

## 4.0 Sub-Module 5.2 — Statutory Deductions

### Statutory Deduction Master
| Deduction | Employee Contribution | Employer Contribution | Applicability | Governing Act |
|---|---|---|---|---|
| Provident Fund (PF) | 12% of Basic+DA | 12% (3.67% PF + 8.33% EPS) | Basic+DA ≤ ₹15,000 mandatory; above optional | EPF & MP Act, 1952 |
| Employee State Insurance (ESI) | 0.75% of Gross | 3.25% of Gross | Gross salary ≤ ₹21,000/month | ESI Act, 1948 |
| Professional Tax (PT) | State-wise slab (max ₹2,500/yr) | N/A | State-specific, varies by income slab | State PT Acts |
| Labour Welfare Fund (LWF) | Small fixed amount (state-wise) | 2× employee contribution | State-specific, half-yearly/yearly | State LWF Acts |
| National Pension System (NPS) | Voluntary, employee choice | Up to 10% of Basic (optional benefit) | Optional, employee opt-in | PFRDA Regulations |
| Voluntary PF (VPF) | Employee choice, up to 100% of Basic | N/A | Optional, employee declared | EPF & MP Act, 1952 |
| Gratuity Provision | N/A (employer funded) | 4.81% of Basic (accrual provision) | All employees (payable after 5 yrs) | Payment of Gratuity Act, 1972 |
| TDS (Income Tax) | As per slab / regime | N/A | Based on annual taxable income | Income Tax Act, 1961 |

### Statutory Deduction Configuration (admin-configurable master, not hardcoded)
- PF Applicable: Yes / No (International Worker exempt)
- PF Calculation Base: Capped at ₹15,000 / Actual Basic+DA (higher PF)
- ESI Applicable: Yes (Gross ≤ ₹21,000) / No
- State (for PT/LWF): Maharashtra, Karnataka, Delhi, Tamil Nadu, … (extensible list)

### Professional Tax Slabs — Sample (Maharashtra) — store as configurable state-wise slab table
| Monthly Gross Salary | PT Amount |
|---|---|
| Up to ₹7,500 | Nil |
| ₹7,501 – ₹10,000 | ₹175/month |
| Above ₹10,000 | ₹200/month (₹300 in February) |

### Deduction Validation Rules
- PF wage ceiling ₹15,000 applied unless employee opts for actual-basis higher PF.
- ESI eligibility re-checked every contribution period (April–Sept, Oct–March).
- Once ESI-covered, continues till contribution period end even if salary increases mid-period.
- PT slab auto-applied basis employee's **work-state**, not registered office state.

### Compliance Auto-Generation (files/exports)
- ECR (Electronic Challan cum Return) file for PF portal upload
- ESI monthly contribution file for ESIC portal
- PT return generation state-wise (monthly/annual as applicable)
- LWF half-yearly/annual return as per state calendar

---

## 5.0 Sub-Module 5.3 — Income Tax Management

### Old vs New Tax Regime — Comparison Logic
| Aspect | Old Regime | New Regime |
|---|---|---|
| Tax Slabs | Higher rates, more slabs | Lower rates, revised slabs (default regime) |
| 80C Deductions (PF, LIC, ELSS, PPF) | Allowed, up to ₹1.5L | Not allowed |
| 80D (Medical Insurance) | Allowed | Not allowed |
| HRA Exemption | Allowed | Not allowed |
| Standard Deduction | ₹50,000 | ₹75,000 (revised) |
| System Behavior | Employee submits Form 12BB with proofs | Default regime; no proof submission needed |

### Investment Declaration Form (Form 12BB data — Entity: `InvestmentDeclaration`)
- Section 80C Investments* (PF, LIC, ELSS, PPF, etc.)
- Section 80D — Medical Insurance
- Section 80E — Education Loan Interest
- Section 80G — Donations
- HRA Exemption Claim (Yes-Rented / No-Own house)
- Home Loan Interest (Sec 24)
- Proof Submission Status (Pending / Submitted / Verified)
- Proof Upload (file attachment)
- Declaration Window (financial-year bound, open/close dates configurable)

### TDS Calculation Rules
- System auto-compares Old vs New regime tax liability and recommends the beneficial option (employee can override).
- TDS spread evenly across remaining months of the financial year.
- Surcharge applicable above ₹50L (10%), ₹1Cr (15%), ₹2Cr (25%), ₹5Cr (37%) income.
- Health & Education Cess 4% applied on tax + surcharge.
- Final proof verification (Jan–Feb) triggers TDS true-up in last 2–3 months.

### Multi-Employer / Previous Employer Income (Form 12B)
- Employee can declare previous employer's income for consolidated TDS calculation.
- Prevents under/over deduction when employee joins mid-year.
- Combined tax liability computed on total annual income.

---

## 6.0 Sub-Module 5.4 — Payroll Processing Engine

### Payroll Run Types
| Run Type | Trigger | Scope | Frequency |
|---|---|---|---|
| Regular Monthly Run | Scheduled, post attendance-freeze | All active employees | Monthly |
| Supplementary Run | Missed employee, correction needed | Specific employees | As needed |
| Arrears Run | Salary revision, retrospective increment | Affected employees | As needed |
| Full & Final Settlement (FFS) | Employee exit | Exiting employee | Per exit |
| Mid-month Salary Advance | Employee request / company policy | Eligible employees | Mid-month (optional) |
| Bonus Run | Festival/Statutory/Performance bonus cycle | Eligible employees | Annual/Bi-annual |

### LOP & Attendance Integration
- LOP days pulled directly from frozen attendance data (Module 3).
- Per-day rate = Monthly Gross ÷ Days in month (or fixed 30, policy-based — must be configurable).
- LOP applied component-wise (proportionate deduction from each earning head).
- Partial month (new joiner/exit) pro-rated automatically.

### Arrears Calculation
- Triggered on salary revision with retrospective effective date.
- System recalculates each affected month's difference and consolidates.
- Arrears tax treatment: Section 89(1) relief calculation supported.
- Separate arrears payslip line item for transparency.

### Bonus & Gratuity Calculation
| Calculation Type | Formula / Rule | Applicable To |
|---|---|---|
| Statutory Bonus | 8.33% to 20% of wages (Payment of Bonus Act) | Salary ≤ ₹21,000/month |
| Gratuity | (Last Basic+DA × 15 × Years of Service) / 26 | > 5 years service (or death/disability) |
| Overtime (OT) | 2× normal rate (Factories Act) / 1.5× (other establishments) | Factory workers beyond statutory hours |
| Leave Encashment | (Basic+DA)/26 × Encashable Days | As per Leave Module policy |

### Payroll Lock & Audit Trail
- Payroll lock hone ke baad koi field edit nahi ho sakta — supplementary run hi correction ka rasta hai.
- Har calculation step ka audit log rakha jata hai (who ran, when, what inputs) — implement as `PayrollAuditLog`.
- Variance report auto-generated comparing current run vs previous month, threshold-based alerts (>20% change flagged).
- Multi-level approval mandatory before lock (Payroll Admin → Finance Head → CHRO for large orgs).

---

## 7.0 Sub-Module 5.5 — Payment & Disbursement

### Bank Disbursement Configuration
- Company Bank Account* (e.g. HDFC Bank - Current A/C, ICICI Bank - Current A/C — configurable list)
- Payment Mode*: NEFT / RTGS / IMPS
- File Format: HDFC Standard CSV / ICICI Corporate Format / SBI Bulk Upload (extensible, add bank-format strategy pattern in backend)
- Payroll Month, Total Employees, Total Disbursement Amount, Disbursement Date

### Payment Method Support
| Method | Use Case | File/Process |
|---|---|---|
| Bank Transfer (NEFT/RTGS) | Standard monthly salary disbursement | Bank-specific CSV/Excel bulk upload file |
| Cash Payment Register | Daily wage/contract workers, remote sites | Manual register with signature/thumb impression |
| Cheque Payment | Exception cases, F&F settlements | Cheque printing with payroll data merge |
| Multi-currency Payroll | Expat employees, overseas assignments | Currency conversion at RBI reference rate |

### Salary Hold Management
- Salary can be put on-hold for pending clearance (exit process, disciplinary action).
- Hold reason mandatory, approval required to release.
- Partial hold supported (e.g. hold only variable component).

### Payment Confirmation & Failure Handling
- Bank return file processed to confirm successful credits.
- Failed transactions (wrong account, closed account) auto-flagged for re-processing.
- Employee notified on both successful credit and failure.
- Re-disbursement workflow for failed transactions with updated bank details.

---

## 8.0 Sub-Module 5.6 — Payroll Documents & Compliance Filing

### Document & Filing Master
| Document / Filing | Purpose | Frequency | Format |
|---|---|---|---|
| Payslip | Monthly salary breakup for employee | Monthly | Password-protected PDF (EmpID+DOB) |
| Form 16 (Part A & B) | Annual TDS certificate for employee | Annual (by 15 June) | PDF, digitally signed |
| Form 16A | TDS certificate for contractor payments | Quarterly | PDF |
| Form 24Q | Quarterly TDS return for salary | Quarterly (by 31st of following month) | TRACES-compatible file |
| Form 26Q | Quarterly TDS return for non-salary payments | Quarterly | TRACES-compatible file |
| Salary Certificate | For loan/visa/personal use | On-demand | PDF, HR signed |
| CTC Breakup Letter | Offer/appointment annexure | On joining / revision | PDF |
| PF ECR Return | Monthly PF contribution filing | Monthly (by 15th) | EPFO portal ECR format |
| ESI Monthly Return | Monthly ESI contribution filing | Monthly (by 15th) | ESIC portal format |

### Payslip Generation Settings
- Delivery Method: Email + Portal / Portal Only / Email Only
- Password Protection: Yes - EmpID + DOB (DDMMYYYY) / Yes - Custom pattern
- Include YTD Summary: Yes / No

### Statutory Filing Due Date Tracker (implement as a scheduled compliance-calendar service)
- PF ECR: 15th of following month | ESI Return: 15th of following month
- Professional Tax: State-specific (typically monthly, 15th–20th)
- TDS Deposit: 7th of following month (30th April for March)
- Form 24Q Filing: 31st of month following quarter-end (31st May for Q4)
- System auto-alerts compliance team 5 days before each due date

---

## 9.0 Sub-Module 5.7 — Sector-Specific Payroll Configuration

Har industry ki alag payroll zaroorat — configurable calculation templates.

### Sector-Wise Payroll Matrix
| Sector | Special Requirement | Configuration | Priority |
|---|---|---|---|
| Manufacturing / Factory | Piece-rate wages, OT per Factories Act, minimum wage compliance | Attendance-linked variable pay, state minimum wage table | Critical |
| IT / Software | Variable pay/bonus heavy structure, stock options (ESOP) | Quarterly variable payout, ESOP taxation (perquisite) | High |
| Retail / FMCG | Incentive-based pay for sales staff, multi-location payroll | Sales target-linked incentive calculation | High |
| Healthcare / Hospital | On-call allowance, night duty allowance, professional fee for doctors | Separate consultant/employee payroll streams | Critical |
| Construction / Site | Contract labour wages, daily/weekly payment cycle | Contractor payroll module, wage register (Form XVII) | Critical |
| Transport / Logistics | Trip-based/mileage incentive, driver allowance | Trip-linked variable component | Medium |
| Education | Academic year-based pay cycle, honorarium for guest faculty | 10-month/12-month pay structure options | Medium |
| Government / PSU | Pay Commission-based structure (7th CPC), DA revision cycles | Pay matrix table, bi-annual DA rate update | Critical |

### Construction / Contract Labour Payroll
- Separate wage register per Contract Labour (Regulation & Abolition) Act.
- Daily/weekly wage cycle support alongside monthly cycle.
- Principal employer vs contractor liability tracking for statutory dues.
- Minimum wage auto-validation per state/skill category.

### Government / PSU Pay Structure
- 7th Pay Commission pay matrix (Level 1–18) mapping.
- Dearness Allowance auto-revision as per government notification (Jan/July).
- House Rent Allowance based on city classification (X/Y/Z).
- Transport Allowance with DA thereon.

> Implementation note: build this as a **strategy/template pattern** — a `SectorPayrollConfig` entity per company/sector that plugs into the core calculation engine, rather than hardcoding sector logic.

---

## 10.0 RBAC — Payroll Module Access Control

### Role Definitions
| Role Code | Role | Who | Scope | Key Permissions |
|---|---|---|---|---|
| R01 | CHRO / HR Head | Chief HR Officer | All employees, all entities | Full CRUD, final approval, policy configuration |
| R02 | Payroll Admin | Payroll Manager/Executive | Assigned entities/locations | Run payroll, manage inputs, generate documents |
| R03 | Finance Head | CFO / Finance Manager | All entities | Approve payroll before lock, view cost reports |
| R04 | Compliance Team | Statutory compliance officer | Statutory data only | File returns, generate challans, audit trail view |
| R05 | Employee | Any employee | Own record only | View payslip, submit investment declaration |
| R06 | Reporting Manager | Team lead | Own team (limited) | Submit variable pay inputs (incentive) for team |
| R07 | Auditor | Internal/External auditor | Read-only, all data | View audit trail, export reports, no edit rights |

### RBAC Matrix — Payroll Actions
Legend: **✏️ Full Access** (Create/Edit/Delete) · **V** View Only · **🔒** No Access · **Own** Only own data

| Action / Feature | CHRO | Payroll Admin | Finance Head | Compliance | Employee | Manager | Auditor |
|---|---|---|---|---|---|---|---|
| **Salary Structure** |
| Configure Salary Structure | ✏️ | ✏️ | V | 🔒 | 🔒 | 🔒 | V |
| View Own CTC Breakup | ✏️ | V | V | 🔒 | Own | 🔒 | 🔒 |
| **Payroll Processing** |
| Run Payroll | ✏️ | ✏️ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| Approve & Lock Payroll | ✏️ | 🔒 | ✏️ | 🔒 | 🔒 | 🔒 | 🔒 |
| Submit Variable Pay Input | ✏️ | ✏️ | 🔒 | 🔒 | 🔒 | ✏️ | 🔒 |
| **Disbursement & Documents** |
| Generate Bank File | ✏️ | ✏️ | V | 🔒 | 🔒 | 🔒 | 🔒 |
| View/Download Own Payslip | ✏️ | V | 🔒 | 🔒 | Own | 🔒 | 🔒 |
| File Statutory Returns | ✏️ | V | V | ✏️ | 🔒 | 🔒 | V |
| Submit Investment Declaration | 🔒 | V | 🔒 | 🔒 | ✏️ | 🔒 | 🔒 |
| View Audit Trail | ✏️ | V | V | V | 🔒 | 🔒 | V |

> Implementation note: extend the existing permission/claims table with these `Feature + Role → Access Level` combinations; enforce at API level (authorization policy/attribute per endpoint) AND at UI level (hide/disable controls), same as Modules 1–4.

---

## 11.0 API Specifications — Payroll Module

Implement as .NET Core 8 Web API controllers, matching existing route/versioning convention (adjust `/api/v1/...` prefix if project uses a different convention already).

**Salary Structure APIs**
- `POST /api/v1/salary-structure` — Create/assign structure to employee
- `GET /api/v1/salary-structure/{emp_id}` — Get current CTC breakup
- `POST /api/v1/salary/ctc-calculator` — CTC to in-hand estimate — Body: `{ annual_ctc, grade, city_category }`

**Payroll Processing APIs**
- `POST /api/v1/payroll/run` — Trigger monthly payroll run — Body: `{ month, entity_id, run_type }`
- `GET /api/v1/payroll/{emp_id}/payslip?month=2024-01` — Fetch payslip data
- `POST /api/v1/payroll/lock` — Lock payroll for the month
- `GET /api/v1/payroll/variance-report?month=2024-01` — Month-over-month variance

**Tax Declaration APIs**
- `POST /api/v1/tax/investment-declaration` — Submit Form 12BB data — Body: `{ emp_id, section_80c, section_80d, hra_claim }`

**Disbursement APIs**
- `POST /api/v1/payroll/bank-file` — Generate bank disbursement file — Body: `{ month, bank_code, payment_mode }`
- `POST /api/v1/payroll/payment-status-update` — Bank return file processing

**Statutory Compliance APIs**
- `GET /api/v1/statutory/pf-ecr?month=2024-01` — Generate PF ECR file
- `GET /api/v1/statutory/esi-return?month=2024-01` — Generate ESI return
- `GET /api/v1/statutory/form24q?quarter=Q4-2024` — Quarterly TDS return

**Documents APIs**
- `GET /api/v1/documents/form16/{emp_id}?fy=2023-24` — Generate Form 16
- `POST /api/v1/documents/salary-certificate` — On-demand salary certificate
- `GET /api/v1/payroll/gl-export?month=2024-01` — Accounting/ERP journal export

---

## 12.0 Notifications & Triggers — Payroll Module

Reuse existing notification service (email/SMS/portal) from Modules 1–4; add these Payroll events.

| Event | To Whom | Channel | Timing | Auto Action |
|---|---|---|---|---|
| Payroll Run Started | Payroll Admin, HR Admin | Email + Portal | On trigger | Progress tracker activated |
| Variable Input Deadline Reminder | Reporting Managers | Email | 3 days before cut-off | — |
| Payroll Calculated - Review Ready | Payroll Admin, Finance Head | Email + Portal | On completion | Variance report attached |
| High Variance Detected | Payroll Admin, Finance Head | Email | If >20% change vs last month | Flagged for manual review |
| Approval Pending | Finance Head / CHRO | Email + Portal | Post calculation | Approval task created |
| Payroll Locked | Payroll Admin, Compliance Team | Email + Portal | On lock | Bank file generation enabled |
| Bank File Generated | Finance Team | Email + Portal | On generation | Ready for bank upload |
| Salary Credited | All employees | SMS + Email + Push | On bank confirmation | Payslip link shared |
| Payment Failed | Employee, Payroll Admin | Email + SMS | On failure detection | Re-disbursement task created |
| Payslip Available | Employee | Email + Portal | On generation | Password-protected PDF attached |
| Investment Declaration Window Open | All employees | Email + Portal Banner | Start of financial year | — |
| Proof Submission Deadline | Employees with pending proof | Email + Push | 15 / 7 / 1 days before deadline | — |
| Statutory Filing Due Soon | Compliance Team | Email + Portal | 5 days before due date | Draft return prepared |
| Statutory Filing Overdue | Compliance Team, CHRO | Email (Escalation) | On due date breach | Penalty risk flag raised |
| Form 16 Generated | Employee | Email + Portal | Annual (by 15 June) | — |
| Salary On-Hold Applied | Employee, HR Admin | Email | On hold applied | Reason & release process shared |
| FFS Processed | Exiting employee, Payroll Admin | Email + Portal | On completion | Settlement statement shared |
| Salary Revision Effective | Employee, Manager | Email | On effective date | Arrears run auto-triggered |

---

## 13.0 Reports & Analytics — Payroll Module

| # | Report Name | Filters | Key Metrics | Format | Access | Frequency |
|---|---|---|---|---|---|---|
| 1 | Monthly Payroll Register | Month, Entity, Dept | Employee-wise gross, deductions, net pay | Excel, PDF | Payroll Admin, Finance | Monthly |
| 2 | Payroll Summary Dashboard | Month, Entity | Total CTC, Gross, Deductions, Net Payout | Live Dashboard | CHRO, Finance Head | Real-time |
| 3 | Payroll Variance Report | Month vs Month | Component-wise change, flagged anomalies | Excel, Chart | Payroll Admin, Finance | Monthly |
| 4 | PF Contribution Report | Month, Location | Employee + employer PF, ECR-ready | Excel, ECR file | Compliance, Payroll Admin | Monthly |
| 5 | ESI Contribution Report | Month, Location | ESI eligible headcount, contribution amount | Excel | Compliance | Monthly |
| 6 | Professional Tax Report | State, Month | State-wise PT liability | Excel | Compliance | Monthly |
| 7 | TDS Summary Report | Month, Quarter, Employee | Tax deducted, regime split, YTD tax | Excel | Payroll Admin, Compliance | Monthly/Quarterly |
| 8 | Investment Declaration Status | Employee, Dept | Declared vs proof-submitted vs verified | Excel | Payroll Admin | Quarterly |
| 9 | Gratuity Provision Report | Employee, Tenure | Accrued gratuity liability | Excel | Finance, HR Admin | Quarterly |
| 10 | Bonus Payout Report | Year, Dept | Statutory + performance bonus disbursed | Excel | Payroll Admin, Finance | Annual |
| 11 | Full & Final Settlement Report | Date range, Employee | F&F amount, TAT, recovery items | Excel | HR Admin, Payroll Admin | On exit / Monthly summary |
| 12 | Cost to Company (CTC) Analysis | Dept, Grade, Location | Component-wise cost breakup and trends | Excel, Chart | CHRO, Finance Head | Monthly |
| 13 | Bank Disbursement Report | Month, Bank | Success/failed transactions, reconciliation | Excel | Finance Team | Monthly |
| 14 | Salary On-Hold Report | Employee, Status | Held amount, reason, release status | Excel | HR Admin, Payroll Admin | As needed |
| 15 | Statutory Compliance Calendar | Month, Filing Type | Due dates, filed status, penalty risk | Dashboard, Excel | Compliance Team | Real-time |
| 16 | Arrears Report | Employee, Effective Date | Retrospective payment breakup | Excel | Payroll Admin | As needed |
| 17 | Old vs New Regime Split Report | Dept, Grade | Employee count & tax impact by regime | Excel, Chart | Payroll Admin, Finance | Annual |
| 18 | GL / Accounting Reconciliation Report | Month, Cost Center | Payroll cost mapped to GL heads | Excel, API | Finance Team | Monthly |

Also implement **Sub-Module 5.8 (Payroll Dashboard & Analytics)** as a live dashboard combining: current cycle status (inputs locked / calculated / under review / on hold / approved & locked / disbursed counts), key metrics from Section 1.0, and quick links into the reports above.

---

## 14.0 Database Design — Payroll Module

> Translate to EF Core entities + `DbSet<T>` in the existing `AppDbContext`, then generate a migration. Adjust data types to match project's existing SQL dialect (below uses generic SQL). All FKs should reference the existing `Employees` table from Module 1.

```sql
-- Salary Structure Master
CREATE TABLE salary_structure (
    structure_id    BIGINT PRIMARY KEY IDENTITY,
    emp_id          VARCHAR(20) NOT NULL,   -- FK -> employees.emp_id
    effective_date  DATE NOT NULL,
    annual_ctc      DECIMAL(12,2) NOT NULL,
    grade_code      VARCHAR(20),
    is_active       BIT DEFAULT 1,
    CONSTRAINT FK_salary_structure_employee FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

-- Salary Component Detail
CREATE TABLE salary_components (
    component_id    BIGINT PRIMARY KEY IDENTITY,
    structure_id    BIGINT NOT NULL,
    component_code  VARCHAR(20),
    component_name  VARCHAR(50),
    component_type  VARCHAR(20) CHECK (component_type IN ('Earning','Deduction','CTC-NonCash')),
    monthly_amount  DECIMAL(10,2),
    is_taxable      BIT,
    CONSTRAINT FK_salary_components_structure FOREIGN KEY (structure_id) REFERENCES salary_structure(structure_id)
);

-- Payroll Run Master
CREATE TABLE payroll_run (
    run_id      VARCHAR(20) PRIMARY KEY,
    run_month   VARCHAR(7) NOT NULL,          -- e.g. '2024-01'
    entity_id   INT NOT NULL,
    run_type    VARCHAR(20) CHECK (run_type IN ('Regular','Supplementary','Arrears','FFS','Bonus')),
    status      VARCHAR(20) CHECK (status IN ('Draft','InputsLocked','Calculated','UnderReview','Approved','Locked','Disbursed','Closed','OnHold','Rejected')),
    locked_at   DATETIME2,
    locked_by   VARCHAR(20)                    -- FK -> users/employees
);

-- Payroll Detail (Employee-wise)
CREATE TABLE payroll_detail (
    payroll_detail_id  BIGINT PRIMARY KEY IDENTITY,
    run_id              VARCHAR(20) NOT NULL,
    emp_id              VARCHAR(20) NOT NULL,
    gross_salary        DECIMAL(10,2),
    lop_days            DECIMAL(4,2),
    total_deductions    DECIMAL(10,2),
    net_pay             DECIMAL(10,2),
    CONSTRAINT FK_payroll_detail_run FOREIGN KEY (run_id) REFERENCES payroll_run(run_id),
    CONSTRAINT FK_payroll_detail_emp FOREIGN KEY (emp_id) REFERENCES employees(emp_id),
    CONSTRAINT UQ_payroll_detail_run_emp UNIQUE (run_id, emp_id)
);

-- Statutory Deduction Detail
CREATE TABLE statutory_deductions (
    deduction_id        BIGINT PRIMARY KEY IDENTITY,
    payroll_detail_id   BIGINT NOT NULL,
    deduction_type       VARCHAR(10) CHECK (deduction_type IN ('PF','ESI','PT','LWF','NPS','VPF','TDS')),
    employee_amount      DECIMAL(10,2),
    employer_amount      DECIMAL(10,2),
    CONSTRAINT FK_statutory_deductions_detail FOREIGN KEY (payroll_detail_id) REFERENCES payroll_detail(payroll_detail_id)
);

-- Investment Declaration
CREATE TABLE investment_declaration (
    declaration_id   BIGINT PRIMARY KEY IDENTITY,
    emp_id           VARCHAR(20) NOT NULL,
    financial_year   VARCHAR(9),           -- e.g. '2024-2025'
    section_80c      DECIMAL(10,2),
    section_80d      DECIMAL(10,2),
    hra_claim_amount DECIMAL(10,2),
    tax_regime       VARCHAR(3) CHECK (tax_regime IN ('Old','New')),
    proof_status     VARCHAR(10) CHECK (proof_status IN ('Pending','Submitted','Verified')),
    CONSTRAINT FK_investment_declaration_emp FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

-- Bank Disbursement
CREATE TABLE bank_disbursement (
    disbursement_id   BIGINT PRIMARY KEY IDENTITY,
    run_id            VARCHAR(20) NOT NULL,
    emp_id            VARCHAR(20) NOT NULL,
    bank_account_no   VARCHAR(30),
    amount            DECIMAL(10,2),
    txn_status        VARCHAR(10) CHECK (txn_status IN ('Pending','Success','Failed')),
    txn_ref_no        VARCHAR(50),
    CONSTRAINT FK_bank_disbursement_run FOREIGN KEY (run_id) REFERENCES payroll_run(run_id),
    CONSTRAINT FK_bank_disbursement_emp FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

-- Payroll Documents
CREATE TABLE payroll_documents (
    document_id     BIGINT PRIMARY KEY IDENTITY,
    emp_id          VARCHAR(20) NOT NULL,
    document_type   VARCHAR(20) CHECK (document_type IN ('Payslip','Form16','Form16A','SalaryCertificate')),
    period          VARCHAR(20),
    file_path       VARCHAR(500),
    generated_at    DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_payroll_documents_emp FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

-- Payroll Audit Log (referenced in Section 6.0 — not in original diagram but required by business rules)
CREATE TABLE payroll_audit_log (
    audit_id      BIGINT PRIMARY KEY IDENTITY,
    run_id        VARCHAR(20),
    action        VARCHAR(100),
    performed_by  VARCHAR(20),
    performed_at  DATETIME2 DEFAULT GETDATE(),
    details       NVARCHAR(MAX)
);
```

---

## 15.0 Suggested Build Order for Antigravity

1. **Data layer:** Add entities above to existing `AppDbContext`, run migration.
2. **Salary Structure module (5.1):** CRUD + CTC calculator (Section 3.0).
3. **Statutory Deductions engine (5.2):** Configurable rule engine for PF/ESI/PT/LWF (Section 4.0) — this is the calculation core, build it as a testable, injectable service (`IStatutoryDeductionCalculator`).
4. **Income Tax module (5.3):** Regime comparison + investment declaration + TDS calculator.
5. **Payroll Processing Engine (5.4):** State machine + integration with Module 3 (Attendance) & Module 4 (Leave), LOP/arrears/bonus/gratuity logic.
6. **Payment & Disbursement (5.5):** Bank file generators (strategy pattern per bank format).
7. **Documents & Compliance Filing (5.6):** Payslip/Form16/ECR/ESI generators (PDF generation — reuse existing PDF library if Modules 1–4 already use one).
8. **Sector-Specific Config (5.7):** Config-driven overrides on top of the core engine.
9. **RBAC (Section 10.0):** Extend existing role/permission system with these 7 roles and the RBAC matrix.
10. **APIs (Section 11.0):** Wire up all controllers per existing convention.
11. **Notifications (Section 12.0):** Hook into existing notification service.
12. **Reports & Dashboard (Section 13.0, Sub-Module 5.8):** Build report generation service + live dashboard using the metrics in Section 1.0.

---

**✅ Module 5 Complete — Payroll Management System**
160+ Fields | 8 Sub-Modules | Full RBAC | India-Specific Compliance | Bank Disbursement | Statutory Filing | 16 API Endpoints | 18 Reports
