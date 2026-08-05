# Team Scoping Bug + Full RBAC Matrix Implementation — Tickets

Exact code included per ticket — implement as written, adapt only variable/namespace names to match actual codebase conventions. Do not summarize or approximate the seed data tables; transcribe them exactly as given.

---

## Ticket 1 — Fix Team Attendance (the confirmed, visible bug)

**Evidence**: Org Chart correctly shows Rahul Sharma (`manager.eng@company.com`) managing 2 direct reports. `GET` team attendance for the same manager returns empty. This means Team Attendance is not querying `ReportingManagerId` the way Org Chart does — it's either querying the wrong ID field, comparing against `UserId` instead of `EmployeeId`, or was never wired to real data at all.

```csharp
// AttendanceController.cs — replace whatever the current team-attendance 
// action does with this exact query shape:

[HttpGet("team")]
[RequirePermission(PermissionCodes.Attendance.ViewTeam)]
public async Task<IActionResult> GetTeamAttendance([FromQuery] DateOnly? date)
{
    var managerEmployeeId = _currentUserService.EmployeeId; // NOT UserId — 
                                                              // confirm which 
                                                              // one the current 
                                                              // broken query uses
    var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);

    var directReportIds = await _context.Employees
        .Where(e => e.ReportingManagerId == managerEmployeeId && e.IsActive)
        .Select(e => e.EmployeeId)
        .ToListAsync();

    if (!directReportIds.Any())
    {
        return Ok(new { data = new List<object>(), 
                         message = "This manager has no direct reports." });
    }

    var records = await _context.AttendanceRecords
        .Where(a => directReportIds.Contains(a.EmployeeId) && a.AttendanceDate == targetDate)
        .Include(a => a.Employee)
        .Select(a => new
        {
            a.EmployeeId,
            EmployeeName = a.Employee.FirstName + " " + a.Employee.LastName,
            a.Status,
            a.CheckIn,
            a.CheckOut,
            a.WorkingHours
        })
        .ToListAsync();

    // A manager WITH reports but no attendance rows for the date is a 
    // DIFFERENT state than a manager with NO reports — don't collapse both 
    // into the same "no team members found" message, that's what made this 
    // bug hard to diagnose from the UI.
    var message = records.Any() 
        ? null 
        : $"{directReportIds.Count} direct report(s) found, but no attendance recorded for {targetDate}.";

    return Ok(new { data = records, message });
}
```

**Test**: log in as `manager.eng@company.com`, hit this endpoint for a date that has seeded attendance data for emp1/emp2. Must return 2 rows, not empty. Paste the actual response.

**Also check**: is `directReportIds.Contains(a.EmployeeId)` going to translate to reasonable SQL (an `IN` clause), or does the current ORM/query pattern in this codebase do something else for list-containment checks? Confirm the generated SQL isn't doing something pathological before calling this done.

---

## Ticket 2 — Audit every other "Team *" endpoint for the identical bug

If Team Attendance had this bug, Team Leave, Team Performance, and Team Reports (all "Team" scope per the matrix) may have the same root cause. Fix this once, shared, instead of per-endpoint.

```csharp
// New shared service — every "Team X" endpoint across every module calls THIS, 
// not its own ad hoc filter:

public interface IReportingScopeService
{
    Task<List<Guid>> GetDirectReportIdsAsync(Guid managerId);
    Task<bool> IsDirectReportAsync(Guid managerId, Guid employeeId);
}

public class ReportingScopeService : IReportingScopeService
{
    private readonly AppDbContext _context;
    public ReportingScopeService(AppDbContext context) => _context = context;

    public async Task<List<Guid>> GetDirectReportIdsAsync(Guid managerId)
    {
        return await _context.Employees
            .Where(e => e.ReportingManagerId == managerId && e.IsActive)
            .Select(e => e.EmployeeId)
            .ToListAsync();
    }

    public async Task<bool> IsDirectReportAsync(Guid managerId, Guid employeeId)
    {
        return await _context.Employees.AnyAsync(e =>
            e.EmployeeId == employeeId &&
            e.ReportingManagerId == managerId &&
            e.IsActive);
    }
}

// Program.cs / DI registration:
builder.Services.AddScoped<IReportingScopeService, ReportingScopeService>();
```

```
Grep the codebase for every endpoint whose route or method name contains 
"team" (case-insensitive) — Leave approval queue, Performance team view, 
Training team view, Reports team scope, Separation team view. For each one 
found:
1. Report whether it currently uses ReportingManagerId correctly, uses 
   something else, or is similarly broken/empty
2. Replace its filtering logic to call IReportingScopeService instead of 
   reimplementing the query
3. Test each one the same way as Ticket 1 — log in as manager.eng, confirm 
   real data for emp1/emp2 appears, confirm data for emp3 (Operations, 
   different manager) does NOT appear
```

---

## Ticket 3 — Data integrity check: duplicate "Priya Nair"

```
Query for employees named "Priya Nair" — there appear to be two: one Senior 
Accountant under Aditya Sharma (Finance), one Software Engineer under Rahul 
Sharma (Product Engineering). Confirm these are two DIFFERENT EmployeeIds 
(two real people who share a name) or the SAME EmployeeId incorrectly 
appearing under two managers (a data bug that would corrupt reporting-scope 
logic — an employee can only have one ReportingManagerId at a time).

Report the two EmployeeIds and their actual ReportingManagerId values. If 
it's a genuine duplicate/bug, fix the incorrect assignment before Ticket 1/2 
testing relies on this data.
```

---

## Ticket 4 — Transcribe the full RBAC matrix exactly (no summarizing)

The uploaded `HRMS_RBAC_Role_Matrix.md` uses scope qualifiers per cell (Full / Team / Own / View / No / and module-specific ones like Referral, Interview, F&F, IT Tasks) — richer than a simple allow/deny. Model this properly:

```csharp
public enum PermissionScope 
{ 
    None,       // "No" in the matrix
    Own,        // "Own" — self-data only
    Team,       // "Team" — direct reports only (via IReportingScopeService)
    AssignedDept, // "Assigned departments" — HR_MANAGER's data scope
    Full,       // "Full" — everything
    View,       // "View" — read-only, all records in scope
    Special     // module-specific: Referral, Interview, F&F, IT Tasks, System
}

public class RolePermission
{
    public string RoleCode { get; set; }
    public string Module { get; set; }
    public PermissionScope Scope { get; set; }
    public string? SpecialNote { get; set; } // e.g. "Referral" or "Interview" for RECRUITMENT_MANAGER row
}
```

**Worked example — transcribe the Employee Master row exactly like this, then repeat for every remaining row in the matrix file (Recruitment, Onboarding, Attendance, Leave, Payroll, Performance, Training, Separation, Reports) — every cell, no omissions:**

```csharp
var employeeMasterPermissions = new List<RolePermission>
{
    new() { RoleCode = "SUPER_ADMIN",         Module = "EMPLOYEE_MASTER", Scope = PermissionScope.Full },
    new() { RoleCode = "HR_ADMIN",            Module = "EMPLOYEE_MASTER", Scope = PermissionScope.Full },
    new() { RoleCode = "HR_MANAGER",          Module = "EMPLOYEE_MASTER", Scope = PermissionScope.AssignedDept, SpecialNote = "Manage" },
    new() { RoleCode = "PAYROLL_ADMIN",       Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
    new() { RoleCode = "RECRUITMENT_MANAGER", Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
    new() { RoleCode = "DEPT_MANAGER",        Module = "EMPLOYEE_MASTER", Scope = PermissionScope.Team },
    new() { RoleCode = "EMPLOYEE",            Module = "EMPLOYEE_MASTER", Scope = PermissionScope.Own },
    new() { RoleCode = "AUDITOR",             Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
    new() { RoleCode = "IT_ADMIN",            Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
    new() { RoleCode = "FINANCE_VIEWER",      Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
};
```

Every controller action then checks `Scope`, and when `Scope == Team`, calls `IReportingScopeService` (Ticket 2) to actually enforce it — a `Team` scope row in this table means nothing if the endpoint doesn't call the service.

---

## Ticket 5 — Unresolved role gap, still open across BOTH matrix documents now

Neither the earlier B4.3 matrix nor this new `HRMS_RBAC_Role_Matrix.md` defines `HR_EXEC` or `FINANCE_HEAD` — but both roles have real logins (`hrexec@company.com`, `finance@company.com`) already in use for testing. This is now the second official-looking document that omits them. Do not pick a default silently a third time.

```
Report back explicitly asking: should HR_EXEC and FINANCE_HEAD be:
(a) merged into existing roles (HR_EXEC → a view-only subset of HR_MANAGER; 
    FINANCE_HEAD → PAYROLL_ADMIN or a superset of FINANCE_VIEWER with 
    approval rights), or
(b) added as two new formal rows in the matrix, defined explicitly

Do not proceed with Ticket 4's full transcription for these two roles until 
this is answered — leave them out of the seed for now rather than guessing 
a third time.
```

---

## Ticket 6 — Frontend: hide by scope, not by hardcoded role list

```
Sidebar/ProtectedRoute must render "Team Attendance", "Team Leave", etc. 
based on the logged-in user's actual RolePermission.Scope for that module 
being Team or higher — fetched from their permission set, not a hardcoded 
role-name array (this is the same anti-pattern from the earlier regression 
— don't reintroduce it here). A DEPT_MANAGER with Scope.Team on Attendance 
sees "Team Attendance" in the nav; an EMPLOYEE with Scope.Own does not.
```

---

## Ticket 7 — Re-verification (exact steps)

```
1. Log in as manager.eng@company.com → Team Attendance → must show Amit 
   Kumar and Priya Nair (his actual 2 reports per the org chart), with real 
   attendance data, not "no team members found."
2. Same login → attempt to view Sana Iyer's attendance (Operations, 
   reports to Karan Mehta, not Rahul Sharma) by direct ID → must be rejected.
3. Log in as manager.ops@company.com (Karan Mehta) → Team Attendance → 
   must show Sana Iyer only.
4. Repeat steps 1-3 for Team Leave once Ticket 2's audit confirms/fixes it.
5. Paste actual responses for all of the above — not a summary.
```
