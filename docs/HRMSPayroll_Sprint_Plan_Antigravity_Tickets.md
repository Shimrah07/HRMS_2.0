# Payroll Module (M5) — Polish Tickets for Antigravity

Single file, meant to be worked through top to bottom in one session. Two phases: **verify what's actually there** (payroll is "previously working" but that doesn't mean it matches every nuance in this spec — find out before polishing blind), then **polish the highest-risk areas** — the calculations where a subtle bug produces a wrong number on someone's paycheck rather than a visibly broken screen.

---

## How to work every ticket below

For any ticket that involves writing or changing calculation logic (Section B, and any fix arising from Section A), use this loop — don't write it once and call it done:

1. **Pin down the requirement** — restate what the code must do, inputs/outputs, in one or two sentences before touching anything. If something is genuinely ambiguous, ask one direct question; for small stuff (naming, minor defaults) state an assumption and move on.
2. **Write the smallest correct implementation** — no `TODO`s, no placeholder branches, no hand-waved edge cases. If a piece can't be written for real, the requirement isn't pinned down yet — go back to step 1.
3. **Run it for real** against at least one realistic input and one edge case (zero LOP days, mid-month joiner, salary below a statutory threshold, etc. — whatever fits the specific ticket). Capture the actual output or the actual error, verbatim — not "it worked" or "it crashed."
4. **Analyze before fixing**: what line caused it, why (bad assumption / wrong formula / off-by-one / missing case), and is this a narrow bug or a sign the approach itself is wrong? If the approach is wrong, redesign that piece properly rather than patching around it.
5. **Fix, then re-run** — a fix that hasn't been re-verified isn't a fix.

Track attempts explicitly ("Attempt 2 of 3"). The counter increments only on a failed run. **After 3 failed attempts, stop** — don't guess a 4th time. Report back in this shape instead:
- **The problem** — what's failing, plainly
- **Why it's stuck** — what the 3 attempts tried and why each fell short
- **Preferred solution** — the fix you'd pick, concrete enough to act on
- **Drawbacks** — real costs of that fix (complexity, behavior change, scope creep) — don't invent balance, state what's actually true
- **Alternative(s)** — a genuinely different approach, in a sentence, if one exists

This matters more here than in most modules — payroll bugs don't throw errors, they just quietly pay someone the wrong amount. Prefer a caught, escalated ambiguity over a confident guess.

---

# Phase A — Verify Before Polishing

Quick, factual checks. For each, report what's actually implemented vs. what the spec describes — don't assume "previously working" means "matches every line of this spec."

### A1 — Salary structure & CTC calculator
```
Confirm: does the salary component master support at least the components listed 
in spec 3.0 (Basic, HRA, DA, Conveyance, Special Allowance, CCA, LTA, Medical, 
Children Education Allowance, etc. — 14+ components), each with a calculation 
basis (fixed % of CTC/Basic vs fixed amount) and a taxability flag?

Test the CTC-to-in-hand calculator (POST /api/v1/salary/ctc-calculator or 
equivalent) with a real annual_ctc + grade + city_category input. Does it 
return a believable breakup, or does it stub/hardcode certain components?
```

### A2 — Statutory deduction formulas
```
Confirm the ACTUAL formulas in code match spec 4.0, not just that fields exist:
- PF: 12% of (Basic+DA), mandatory when Basic+DA ≤ ₹15,000, optional above
- ESI: 0.75% employee / 3.25% employer of Gross, only when Gross ≤ ₹21,000/month
- Professional Tax: state-wise slab, not a flat number (confirm at least 
  Maharashtra's slab structure exists, since that's the sample in spec 4.0)
- Gratuity: 4.81% of Basic as an accrual provision, not a hardcoded deduction

Test with a salary that sits exactly AT the PF/ESI eligibility thresholds 
(Basic+DA = ₹15,000 exactly, Gross = ₹21,000 exactly) — this is where 
boundary bugs live. Report actual behavior at the boundary.
```

### A3 — Tax regime handling
```
Confirm both old and new regime tax calculations exist and are actually 
different (not the same formula with a label swapped). Confirm Form 12BB 
investment declaration (80C, 80D, 80E, 80G, HRA claim) is captured and 
actually feeds the OLD regime calculation only — new regime should ignore 
these per spec 5.0. Test: submit identical declarations under both regimes 
and confirm the new regime result is unaffected by them.
```

### A4 — Payroll processing engine & run types
```
Confirm all 6 run types from spec 6.0 exist and are distinguishable in the 
database (payroll_run.run_type): Regular, Supplementary, Arrears, FFS, 
Advance, Bonus — not just "Regular" with everything else unimplemented.

Confirm LOP (loss of pay) actually pulls from frozen attendance data (the 
M3 attendance freeze mechanism) rather than being manually entered. Test: 
does a payroll run for an employee with unfrozen attendance get blocked or 
produce a warning, per the dependency the spec implies between modules?

Confirm LOP is applied component-wise (proportionate deduction from each 
earning head), not just subtracted as one lump sum from gross.
```

### A5 — Disbursement
```
Confirm bank file generation actually produces bank-specific formats (spec 
lists HDFC Standard CSV, ICICI Corporate Format, SBI Bulk Upload as distinct) 
rather than one generic CSV regardless of selected bank. Confirm payment 
status tracking (success/failure per employee) exists and that a failed 
disbursement doesn't silently look identical to a successful one.
```

### A6 — Documents & compliance filing
```
Confirm which of these actually generate real output vs. return a stub: 
Payslip (password-protected PDF, password = EmpID+DOB per spec), Form 16 
Part A & B, Form 16A, Form 24Q, Form 26Q, PF ECR return, ESI monthly return. 
For each: real PDF/file generation, or placeholder/not built. Report 
plainly — this list is likely to have gaps, that's expected and fine to 
report as such.
```

### A7 — Sector-specific configuration
```
Confirm whether ANY sector-specific payroll logic exists (spec 9.0 marks 
Manufacturing, Healthcare, Construction, and Government/PSU as "Critical" 
priority — piece-rate wages, on-call/night duty allowance, contractor wage 
registers, 7th Pay Commission matrices respectively). It's plausible none of 
this exists yet if the org only operates in one sector — report what's 
actually there, don't assume gaps here are urgent without confirming they're 
needed for your actual business.
```

### A8 — RBAC matrix
```
Confirm the 7 roles from spec 10.0 (CHRO, Payroll Admin, Finance Head, 
Compliance Team, Employee, Reporting Manager, Auditor) exist and that 
action-level permissions actually differ between them — specifically 
confirm Auditor is truly read-only (no edit/create/delete succeeds for that 
role on any payroll endpoint) and that Employee can only ever see their own 
record, never another employee's payslip or declaration via ID manipulation 
on the API (try requesting another employee's payslip by ID as an EMPLOYEE-
role token — this should be rejected, not just hidden in the UI).
```

---

# Phase B — Polish the High-Risk Calculations

These are the areas most likely to have subtle correctness bugs — apply the self-correcting loop from the top of this file to each. Prioritize in the order listed; each is roughly independent so they can also be parallelized across sessions.

### B1 — LOP calculation correctness
```
Requirement: LOP per-day rate should be configurable as either 
(Monthly Gross ÷ Days in that specific month) or a fixed 30-day divisor, per 
company policy — and once chosen, applied consistently and component-wise 
(each earning head reduced proportionately, not just gross).

Test cases to actually run, not just reason about:
- An employee with 2 LOP days in a 31-day month vs. the same 2 LOP days in a 
  28-day month (February) — confirm the divisor policy is applied 
  consistently and the deducted amount differs correctly between the two if 
  using the days-in-month method
- A mid-month joiner (joins on the 15th) — confirm pro-ration doesn't double-
  count or under-count days
- Zero LOP days — confirm this doesn't produce a division artifact or a 
  non-zero deduction
```

### B2 — Old vs New tax regime comparison
```
Requirement: given an employee's declared investments and salary structure, 
compute tax liability under BOTH regimes and show the comparison (spec 5.0), 
so the employee can make an informed choice — not just calculate whichever 
regime is currently selected.

Test cases:
- An employee with heavy 80C/80D/HRA claims — old regime should come out 
  lower; confirm the numbers, don't just confirm both render
- An employee with zero declarations — new regime should almost always be 
  neutral-to-better; confirm the comparison reflects that
- Confirm the new regime calculation genuinely ignores 80C/80D/HRA inputs 
  even if they're present in the submitted Form 12BB data (this was flagged 
  as unconfirmed in A3 — fix if it's currently leaking through)
```

### B3 — Gratuity eligibility gate
```
Requirement: gratuity accrual (4.81% of Basic) should be tracked for every 
employee, but actual PAYOUT only applies after 5 years of continuous service 
per the Payment of Gratuity Act (spec 4.0).

Test: run an FFS (Full & Final Settlement) for an employee who exits at 4 
years 11 months vs. one at 5 years 1 month. Confirm the accrued gratuity is 
correctly withheld for the first and paid for the second — this boundary is 
exactly the kind of thing worth a real test, not an assumption.
```

### B4 — Professional Tax state-slab engine
```
Requirement: PT should be calculated from a state-specific slab table, not 
a single hardcoded value — an employee in Maharashtra and one in Karnataka 
on the same salary can owe different PT.

Test: create two otherwise-identical salary records differing only in work 
location's state, run payroll for both, confirm PT differs according to 
each state's actual slab (use Maharashtra's slab from spec 4.0 as the known-
correct reference point). If only one state's slab is currently configured, 
report that as a real gap rather than silently defaulting every state to it.
```

### B5 — Payroll lock enforcement
```
This is the same class of bug found and fixed in the Attendance module 
(punch freeze) — check whether payroll has the equivalent problem before 
assuming it doesn't.

Requirement: once a payroll run's status is set to Locked (payroll_run.
status), no further edits to payroll_detail for that run should be possible 
through any endpoint.

Test: lock a payroll run, then attempt a direct edit to an employee's 
payroll_detail row via the API (not just the "expected" UI path). Confirm 
it's rejected with a clear error, not silently accepted. If this isn't 
enforced yet, fix it — reuse the same pattern from the attendance freeze fix 
if that implementation is a good reference.
```

### B6 — Bank file format correctness
```
Requirement: generated bank files must match each bank's actual expected 
format (HDFC Standard CSV, ICICI Corporate Format, SBI Bulk Upload are 
named specifically in spec 7.0 — these are real formats with real column 
requirements, not interchangeable).

Test: generate a file for each configured bank format with a small batch of 
test employees, and validate the output against that bank's actual documented 
column/field requirements (search for the real format spec if not already 
known — don't guess at column order). A malformed bank file is a hard 
failure mode — it either gets rejected by the bank or, worse, misroutes 
money, so this deserves real validation, not a visual "looks about right" 
check.
```

### B7 — High-variance detection
```
Requirement: per spec 12.0, a >20% month-over-month change in an employee's 
payroll should trigger a "High Variance Detected" flag to Payroll Admin and 
Finance Head for manual review before the run proceeds to approval.

Test: run payroll for an employee with a >20% jump (e.g. a mid-cycle salary 
revision) and confirm the flag actually fires and blocks/holds approval 
until reviewed, versus just logging silently. Also test a employee with a 
15% change — confirm it does NOT falsely trigger.
```

### B8 — Statutory return format compliance
```
Requirement: PF ECR and ESI monthly return files must match the exact format 
those portals (EPFO, ESIC) require for upload (spec 8.0) — these are 
externally validated formats, not internal documents, so "close enough" 
fails silently at upload time on the government portal, not in your own 
tests.

Test: generate both files for a real test payroll run and check the output 
against the actual EPFO ECR format spec and ESIC return format spec (search 
for the current official format documentation — these occasionally change 
and should be verified against the current version, not assumed from memory).
```

---

## Output expected back

For Phase A: a plain status per item (confirmed matches spec / partial / not implemented), same evidence standard as the earlier module audits — pasted output, not summarized claims.

For Phase B: for each ticket, the attempt log (which attempt number it resolved on, or the escalation writeup if it hit 3 failed attempts), plus the actual test case results — not just "implemented and working."
