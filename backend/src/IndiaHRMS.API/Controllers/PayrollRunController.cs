using IndiaHRMS.Application.Services;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Infrastructure.Services;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Filters = IndiaHRMS.API.Filters;

namespace IndiaHRMS.API.Controllers;

/// <summary>
/// Module 5.4 — Payroll Processing Engine
/// Full 20-step state machine: Draft→InputsLocked→Calculated→UnderReview→Approved→Locked→Disbursed→Closed
/// </summary>
[ApiController]
[Route("api/v1/payroll")]
[Authorize]
public class PayrollRunController : ControllerBase
{
    private readonly AppDbContext _ctx;
    private readonly ICurrentUserService _currentUser;
    private readonly IStatutoryDeductionCalculator _statCalc;
    private readonly ISalaryCalculationEngine _salaryEngine;

    public PayrollRunController(AppDbContext ctx, ICurrentUserService currentUser,
        IStatutoryDeductionCalculator statCalc, ISalaryCalculationEngine salaryEngine)
    {
        _ctx = ctx;
        _currentUser = currentUser;
        _statCalc = statCalc;
        _salaryEngine = salaryEngine;
    }

    // NOTE: Access control is handled by [Filters.RequirePermission(...)] attributes on each endpoint.
    // The previous IsPayrollAdmin/IsFinanceOrAbove => IsAuthenticated was a regression that allowed
    // any authenticated user to access payroll endpoints. Removed as part of RBAC fix.

    // ─── GET /api/v1/payroll/runs ─────────────────────────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Process, PermissionCodes.Payroll.Configure, PermissionCodes.Payroll.Approve)]
    [HttpGet("runs")]
    public async Task<ActionResult<ApiResponse<object>>> GetRuns(
        [FromQuery] int? year, [FromQuery] int? month, CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId ?? Guid.Empty;
        var q = _ctx.PayrollRuns.Where(r => r.CompanyId == companyId);
        if (year.HasValue) q = q.Where(r => r.Year == year.Value);
        if (month.HasValue) q = q.Where(r => r.Month == month.Value);

        var runs = await q.OrderByDescending(r => r.Year).ThenByDescending(r => r.Month)
            .Select(r => new {
                runId = r.PayrollRunId,
                month = r.Month,
                year = r.Year,
                runType = r.RunType.ToString(),
                status = r.Status.ToString(),
                totalEmployees = r.TotalEmployees,
                totalGross = r.TotalGross,
                totalNetPay = r.TotalNetPay,
                totalCTC = r.TotalCTC,
                attendanceFrozen = r.AttendanceFrozen,
                lockedAt = r.LockedAt,
                disbursedAt = r.DisbursedAt,
                notes = r.Notes,
                createdAt = r.CreatedAt
            }).ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(runs, "Payroll runs fetched."));
    }

    // ─── POST /api/v1/payroll/runs — Initiate a new payroll run ──────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Process)]
    [HttpPost("runs")]
    public async Task<ActionResult<ApiResponse<object>>> InitiateRun([FromBody] InitiateRunRequest req, CancellationToken ct)
    {

        var companyId = _currentUser.CompanyId ?? Guid.Empty;

        // Prevent duplicate run for same month/year/type
        var existing = await _ctx.PayrollRuns.AnyAsync(r =>
            r.CompanyId == companyId && r.Month == req.Month && r.Year == req.Year &&
            r.RunType == Enum.Parse<PayrollRunType>(req.RunType ?? "Regular") &&
            r.Status != PayrollStatus.Closed && r.Status != PayrollStatus.Rejected, ct);

        if (existing)
            return BadRequest(ApiResponse<object>.Fail($"A {req.RunType ?? "Regular"} run for {req.Month}/{req.Year} already exists and is not closed."));

        var run = new PayrollRun
        {
            PayrollRunId = Guid.NewGuid(),
            CompanyId = companyId,
            Month = req.Month,
            Year = req.Year,
            RunType = Enum.Parse<PayrollRunType>(req.RunType ?? "Regular"),
            Status = PayrollStatus.Draft,
            ProcessedBy = _currentUser.UserId ?? Guid.Empty,
            ProcessedAt = DateTime.UtcNow,
            Notes = req.Notes
        };

        _ctx.PayrollRuns.Add(run);
        await LogAuditAsync(run.PayrollRunId, "Run Initiated", $"Type: {run.RunType}, Period: {run.Month}/{run.Year}", ct);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { runId = run.PayrollRunId, status = run.Status.ToString() }, "Payroll run initiated."));
    }

    // ─── POST /api/v1/payroll/runs/{runId}/lock-inputs ───────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Process)]
    [HttpPost("runs/{runId:guid}/lock-inputs")]
    public async Task<ActionResult<ApiResponse<object>>> LockInputs(Guid runId, CancellationToken ct)
    {
        var run = await GetRunOrFail(runId, ct);
        if (run == null) return NotFound(ApiResponse<object>.Fail("Run not found."));
        if (run.Status != PayrollStatus.Draft) return BadRequest(ApiResponse<object>.Fail($"Cannot lock inputs: run is in {run.Status} state."));

        run.Status = PayrollStatus.InputsLocked;
        run.AttendanceFrozen = true; // assume attendance confirmed
        run.UpdatedAt = DateTime.UtcNow;
        await LogAuditAsync(runId, "Inputs Locked", "All variable inputs locked for calculation.", ct);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { status = run.Status.ToString() }, "Inputs locked. Payroll ready for calculation."));
    }

    // ─── POST /api/v1/payroll/runs/{runId}/calculate ─────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Process)]
    [HttpPost("runs/{runId:guid}/calculate")]
    public async Task<ActionResult<ApiResponse<object>>> Calculate(Guid runId, CancellationToken ct)
    {
        var run = await GetRunOrFail(runId, ct);
        if (run == null) return NotFound(ApiResponse<object>.Fail("Run not found."));
        if (run.Status != PayrollStatus.InputsLocked) return BadRequest(ApiResponse<object>.Fail($"Cannot calculate: inputs must be locked first. Current: {run.Status}"));

        var companyId = run.CompanyId;
        var daysInMonth = DateTime.DaysInMonth(run.Year, run.Month);

        // Get all active employees with salary structures
        var employees = await _ctx.EmployeeSalaryStructures
            .Where(e => e.IsActive && e.Employee.CompanyId == companyId)
            .Include(e => e.Employee)
            .Include(e => e.Allocations).ThenInclude(a => a.Component)
            .ToListAsync(ct);

        decimal totalGross = 0, totalDeductions = 0, totalNet = 0, totalCTC = 0;
        int count = 0;

        foreach (var empStruct in employees)
        {
            var emp = empStruct.Employee;

            // Get LWP from attendance for this period (if available)
            decimal lwpDays = await _ctx.AttendanceRecords
                .Where(a => a.EmployeeId == emp.EmployeeId &&
                            a.AttendanceDate.Year == run.Year && a.AttendanceDate.Month == run.Month &&
                            a.Status == AttendanceStatus.Absent)
                .CountAsync(ct);

            // Monthly salary breakdown from allocation
            decimal basicMonthly = 0m, grossMonthly = 0m;
            foreach (var alloc in empStruct.Allocations.Where(a => a.Group == ComponentGroup.SalaryStructure))
            {
                grossMonthly += alloc.MonthlyAmount;
                if (alloc.Component?.ComponentCode?.Contains("BASIC", StringComparison.OrdinalIgnoreCase) == true)
                    basicMonthly = alloc.MonthlyAmount;
            }

            // LOP deduction
            decimal lopDeduction = lwpDays > 0 ? Math.Round(grossMonthly / daysInMonth * lwpDays, 2) : 0m;
            decimal adjustedGross = Math.Max(0, grossMonthly - lopDeduction);

            // Variable pay
            var variablePay = await _ctx.VariablePayInputs
                .Where(v => v.PayrollRunId == runId && v.EmployeeId == emp.EmployeeId && v.IsApproved)
                .SumAsync(v => v.Amount, ct);

            decimal grossEarnings = adjustedGross + variablePay;

            // Statutory deductions
            var statInput = new StatutoryInput(
                EmployeeId: emp.EmployeeId,
                CompanyId: companyId,
                BasicPlusDA: basicMonthly,
                GrossSalary: grossEarnings,
                WorkState: "MH",
                Month: run.Month
            );
            var statResult = await _statCalc.CalculateAsync(statInput, ct);

            decimal totalDed = statResult.PFEmployee + statResult.ESIEmployee +
                               statResult.ProfessionalTax + statResult.LWFEmployee +
                               statResult.VPF;
            decimal netPay = Math.Round(grossEarnings - totalDed, 2);

            // Save or update PayrollDetail
            var existing = await _ctx.PayrollDetails.FirstOrDefaultAsync(
                d => d.PayrollRunId == runId && d.EmployeeId == emp.EmployeeId, ct);

            if (existing != null)
            {
                existing.WorkingDays = daysInMonth;
                existing.PaidDays = daysInMonth - lwpDays;
                existing.LWPDays = lwpDays;
                existing.GrossEarnings = grossEarnings;
                existing.TotalDeductions = totalDed;
                existing.NetPay = netPay;
                existing.PFEmployee = statResult.PFEmployee;
                existing.PFEmployer = statResult.PFEmployer;
                existing.ESIEmployee = statResult.ESIEmployee;
                existing.ESIEmployer = statResult.ESIEmployer;
                existing.ProfessionalTax = statResult.ProfessionalTax;
                existing.LWF = statResult.LWFEmployee;
                existing.GratuityProvision = statResult.GratuityProvision;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _ctx.PayrollDetails.Add(new PayrollDetail
                {
                    DetailId = Guid.NewGuid(),
                    PayrollRunId = runId,
                    EmployeeId = emp.EmployeeId,
                    WorkingDays = daysInMonth,
                    PaidDays = daysInMonth - lwpDays,
                    LWPDays = lwpDays,
                    GrossEarnings = grossEarnings,
                    TotalDeductions = totalDed,
                    NetPay = netPay,
                    PFEmployee = statResult.PFEmployee,
                    PFEmployer = statResult.PFEmployer,
                    ESIEmployee = statResult.ESIEmployee,
                    ESIEmployer = statResult.ESIEmployer,
                    ProfessionalTax = statResult.ProfessionalTax,
                    LWF = statResult.LWFEmployee,
                    GratuityProvision = statResult.GratuityProvision
                });
            }

            totalGross += grossEarnings;
            totalDeductions += totalDed;
            totalNet += netPay;
            totalCTC += empStruct.AnnualCTC / 12m;
            count++;
        }

        run.Status = PayrollStatus.Calculated;
        run.TotalGross = Math.Round(totalGross, 2);
        run.TotalDeductions = Math.Round(totalDeductions, 2);
        run.TotalNetPay = Math.Round(totalNet, 2);
        run.TotalCTC = Math.Round(totalCTC, 2);
        run.TotalEmployees = count;
        run.UpdatedAt = DateTime.UtcNow;

        await LogAuditAsync(runId, "Calculated", $"Employees: {count}, Gross: {totalGross:N2}, Net: {totalNet:N2}", ct);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new {
            status = run.Status.ToString(),
            totalEmployees = count,
            totalGross = run.TotalGross,
            totalDeductions = run.TotalDeductions,
            totalNetPay = run.TotalNetPay
        }, "Payroll calculated successfully."));
    }

    // ─── POST /api/v1/payroll/runs/{runId}/submit-review ─────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Process)]
    [HttpPost("runs/{runId:guid}/submit-review")]
    public async Task<ActionResult<ApiResponse<object>>> SubmitForReview(Guid runId, CancellationToken ct)
    {
        var run = await GetRunOrFail(runId, ct);
        if (run == null) return NotFound(ApiResponse<object>.Fail("Run not found."));
        if (run.Status != PayrollStatus.Calculated) return BadRequest(ApiResponse<object>.Fail($"Must be Calculated before review. Current: {run.Status}"));

        run.Status = PayrollStatus.UnderReview;
        run.UpdatedAt = DateTime.UtcNow;
        await LogAuditAsync(runId, "Submitted for Review", "Variance report generated. Awaiting Finance Head approval.", ct);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { status = run.Status.ToString() }, "Submitted for Finance review."));
    }

    // ─── POST /api/v1/payroll/runs/{runId}/approve ───────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Approve)]
    [HttpPost("runs/{runId:guid}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(Guid runId, CancellationToken ct)
    {
        var run = await GetRunOrFail(runId, ct);
        if (run == null) return NotFound(ApiResponse<object>.Fail("Run not found."));
        if (run.Status != PayrollStatus.UnderReview) return BadRequest(ApiResponse<object>.Fail($"Run must be UnderReview to approve. Current: {run.Status}"));

        run.Status = PayrollStatus.Approved;
        run.ApprovedBy = _currentUser.UserId;
        run.ApprovedAt = DateTime.UtcNow;
        run.UpdatedAt = DateTime.UtcNow;
        await LogAuditAsync(runId, "Approved", $"Approved by {_currentUser.UserId}", ct);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { status = run.Status.ToString() }, "Payroll approved."));
    }

    // ─── POST /api/v1/payroll/runs/{runId}/lock ──────────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Approve)]
    [HttpPost("runs/{runId:guid}/lock")]
    public async Task<ActionResult<ApiResponse<object>>> Lock(Guid runId, CancellationToken ct)
    {
        var run = await GetRunOrFail(runId, ct);
        if (run == null) return NotFound(ApiResponse<object>.Fail("Run not found."));
        if (run.Status != PayrollStatus.Approved) return BadRequest(ApiResponse<object>.Fail($"Run must be Approved before locking. Current: {run.Status}"));

        run.Status = PayrollStatus.Locked;
        run.LockedAt = DateTime.UtcNow;
        run.LockedBy = _currentUser.UserId;
        run.UpdatedAt = DateTime.UtcNow;
        await LogAuditAsync(runId, "Locked", "Payroll locked. No further edits allowed. Bank file generation enabled.", ct);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { status = run.Status.ToString(), lockedAt = run.LockedAt }, "Payroll locked. Bank file can now be generated."));
    }

    // ─── POST /api/v1/payroll/runs/{runId}/close ─────────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Approve)]
    [HttpPost("runs/{runId:guid}/close")]
    public async Task<ActionResult<ApiResponse<object>>> Close(Guid runId, CancellationToken ct)
    {
        var run = await GetRunOrFail(runId, ct);
        if (run == null) return NotFound(ApiResponse<object>.Fail("Run not found."));
        if (run.Status != PayrollStatus.Disbursed) return BadRequest(ApiResponse<object>.Fail($"Run must be Disbursed before closing. Current: {run.Status}"));

        run.Status = PayrollStatus.Closed;
        run.UpdatedAt = DateTime.UtcNow;
        await LogAuditAsync(runId, "Closed", "Payroll cycle closed and archived.", ct);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { status = run.Status.ToString() }, "Payroll cycle closed."));
    }

    // ─── GET /api/v1/payroll/runs/{runId}/variance ───────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("runs/{runId:guid}/variance")]
    public async Task<ActionResult<ApiResponse<object>>> GetVarianceReport(Guid runId, CancellationToken ct)
    {
        var run = await GetRunOrFail(runId, ct);
        if (run == null) return NotFound(ApiResponse<object>.Fail("Run not found."));

        // Previous month run
        int prevMonth = run.Month == 1 ? 12 : run.Month - 1;
        int prevYear = run.Month == 1 ? run.Year - 1 : run.Year;

        var prevRun = await _ctx.PayrollRuns
            .Where(r => r.CompanyId == run.CompanyId && r.Month == prevMonth && r.Year == prevYear && r.RunType == PayrollRunType.Regular)
            .OrderByDescending(r => r.CreatedAt).FirstOrDefaultAsync(ct);

        var currentDetails = await _ctx.PayrollDetails
            .Include(d => d.Employee)
            .Where(d => d.PayrollRunId == runId)
            .Select(d => new { d.EmployeeId, name = d.Employee.FirstName + " " + d.Employee.LastName, d.GrossEarnings, d.NetPay, d.TotalDeductions })
            .ToListAsync(ct);

        object? prevSummary = null;
        if (prevRun != null)
        {
            var prevDetails = await _ctx.PayrollDetails.Where(d => d.PayrollRunId == prevRun.PayrollRunId)
                .Select(d => new { d.EmployeeId, d.GrossEarnings, d.NetPay }).ToListAsync(ct);

            var variances = currentDetails.Select(cur => {
                var prev = prevDetails.FirstOrDefault(p => p.EmployeeId == cur.EmployeeId);
                var diff = prev == null ? cur.NetPay : cur.NetPay - prev.NetPay;
                var pct = prev == null || prev.NetPay == 0 ? 0m : Math.Round(diff / prev.NetPay * 100, 2);
                return new { cur.EmployeeId, cur.name, current = cur.NetPay, previous = prev?.NetPay ?? 0, variance = diff, variancePct = pct, flagged = Math.Abs(pct) > 20 };
            }).ToList();

            prevSummary = new {
                previousMonth = $"{prevMonth}/{prevYear}",
                previousNetPay = prevRun.TotalNetPay,
                currentNetPay = run.TotalNetPay,
                variance = run.TotalNetPay - prevRun.TotalNetPay,
                flaggedCount = variances.Count(v => v.flagged),
                employeeVariances = variances.Where(v => v.flagged).ToList()
            };
        }

        return Ok(ApiResponse<object>.Ok(new {
            runId,
            month = run.Month,
            year = run.Year,
            totalGross = run.TotalGross,
            totalNet = run.TotalNetPay,
            totalEmployees = run.TotalEmployees,
            variance = prevSummary,
            employees = currentDetails
        }, "Variance report generated."));
    }

    // ─── GET /api/v1/payroll/runs/{runId}/details ────────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("runs/{runId:guid}/details")]
    public async Task<ActionResult<ApiResponse<object>>> GetRunDetails(Guid runId, CancellationToken ct)
    {
        var details = await _ctx.PayrollDetails
            .Include(d => d.Employee)
            .Where(d => d.PayrollRunId == runId)
            .Select(d => new {
                employeeId = d.EmployeeId,
                employeeCode = d.Employee.EmployeeCode,
                name = d.Employee.FirstName + " " + d.Employee.LastName,
                workingDays = d.WorkingDays,
                paidDays = d.PaidDays,
                lwpDays = d.LWPDays,
                grossEarnings = d.GrossEarnings,
                pfEmployee = d.PFEmployee,
                pfEmployer = d.PFEmployer,
                esiEmployee = d.ESIEmployee,
                esiEmployer = d.ESIEmployer,
                professionalTax = d.ProfessionalTax,
                lwf = d.LWF,
                gratuityProvision = d.GratuityProvision,
                totalDeductions = d.TotalDeductions,
                netPay = d.NetPay
            }).ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(details, "Payroll details fetched."));
    }

    // ─── GET /api/v1/payroll/runs/{runId}/audit ───────────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("runs/{runId:guid}/audit")]
    public async Task<ActionResult<ApiResponse<object>>> GetAuditTrail(Guid runId, CancellationToken ct)
    {
        var logs = await _ctx.PayrollAuditLogs
            .Where(l => l.PayrollRunId == runId)
            .OrderBy(l => l.PerformedAt)
            .Select(l => new { l.Action, l.Details, l.PerformedAt, performedBy = l.PerformedBy })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(logs, "Audit trail fetched."));
    }

    // ─── POST /api/v1/payroll/variable-inputs ─────────────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.Process)]
    [HttpPost("variable-inputs")]
    public async Task<ActionResult<ApiResponse<object>>> SubmitVariableInput([FromBody] VariableInputRequest req, CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId ?? Guid.Empty;
        var run = await _ctx.PayrollRuns.FindAsync(new object[] { req.RunId }, ct);
        if (run == null) return NotFound(ApiResponse<object>.Fail("Payroll run not found."));
        if (run.Status == PayrollStatus.Locked || run.Status == PayrollStatus.Disbursed)
            return BadRequest(ApiResponse<object>.Fail("Cannot add variable input to a locked/disbursed run."));

        var input = new VariablePayInput
        {
            InputId = Guid.NewGuid(),
            PayrollRunId = req.RunId,
            EmployeeId = req.EmployeeId,
            InputType = req.InputType,
            Amount = req.Amount,
            Remarks = req.Remarks,
            SubmittedBy = _currentUser.UserId ?? Guid.Empty,
            // Auto-approve if the submitting user has PAYROLL.CONFIGURE permission
            // (i.e. PAYROLL_ADMIN, FINANCE_HEAD, HR_ADMIN, SUPER_ADMIN)
            IsApproved = _currentUser.HasPermission(PermissionCodes.Payroll.Configure)
        };

        _ctx.VariablePayInputs.Add(input);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { inputId = input.InputId, approved = input.IsApproved }, "Variable pay input submitted."));
    }

    // ─── GET /api/v1/payroll/variable-inputs ──────────────────────────────────
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("variable-inputs")]
    public async Task<ActionResult<ApiResponse<object>>> GetVariableInputs(
        [FromQuery] Guid? runId, [FromQuery] Guid? empId, CancellationToken ct)
    {
        var q = _ctx.VariablePayInputs.Include(v => v.Employee).AsQueryable();
        if (runId.HasValue) q = q.Where(v => v.PayrollRunId == runId.Value);
        if (empId.HasValue) q = q.Where(v => v.EmployeeId == empId.Value);

        var result = await q.Select(v => new {
            v.InputId, v.PayrollRunId, v.EmployeeId,
            employeeName = v.Employee.FirstName + " " + v.Employee.LastName,
            v.InputType, v.Amount, v.Remarks, v.IsApproved, v.SubmittedBy, v.CreatedAt
        }).ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(result));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private async Task<PayrollRun?> GetRunOrFail(Guid runId, CancellationToken ct) =>
        await _ctx.PayrollRuns.FirstOrDefaultAsync(r => r.PayrollRunId == runId, ct);

    private async Task LogAuditAsync(Guid runId, string action, string details, CancellationToken ct)
    {
        _ctx.PayrollAuditLogs.Add(new PayrollAuditLog
        {
            AuditId = Guid.NewGuid(),
            PayrollRunId = runId,
            Action = action,
            Details = details,
            PerformedBy = _currentUser.UserId ?? Guid.Empty,
            PerformedAt = DateTime.UtcNow
        });
    }
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────
public record InitiateRunRequest(int Month, int Year, string? RunType, string? Notes);
public record VariableInputRequest(Guid RunId, Guid EmployeeId, string InputType, decimal Amount, string? Remarks);
