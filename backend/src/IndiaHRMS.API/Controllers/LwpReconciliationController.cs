using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

/// <summary>
/// TICKET-8: Attendance vs Leave Reconciliation for LWP
/// Cross-references AttendanceRecords (absences vs approved leaves)
/// to distinguish "approved unpaid leave (LWP)" from "unauthorized absence / truancy" in monthly payroll.
/// </summary>
[ApiController]
[Route("api/v1/payroll/attendance-reconciliation")]
[Authorize]
public class LwpReconciliationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public LwpReconciliationController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    private bool IsAdmin =>
        _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead);

    /// <summary>
    /// GET /api/v1/payroll/attendance-reconciliation/employee/{employeeId}
    /// Reconciles monthly attendance records for an employee to separate approved LWP vs truancy.
    /// </summary>
    [HttpGet("employee/{employeeId}")]
    public async Task<ActionResult<ApiResponse<object>>> ReconcileEmployee(Guid employeeId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var isOwn = _currentUser.EmployeeId == employeeId;
        if (!isOwn && !IsAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Unauthorized access to attendance reconciliation records."));

        var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == employeeId, ct);
        if (emp == null)
            return NotFound(ApiResponse<object>.Fail("Employee record not found."));

        if (year < 2000 || month < 1 || month > 12)
            return BadRequest(ApiResponse<object>.Fail("Valid year and month (1-12) are required."));

        var daysInMonth = DateTime.DaysInMonth(year, month);
        var startDate = new DateOnly(year, month, 1);
        var endDate = new DateOnly(year, month, daysInMonth);

        // Fetch monthly attendance records
        var records = await _context.AttendanceRecords
            .Where(a => a.EmployeeId == employeeId && a.AttendanceDate >= startDate && a.AttendanceDate <= endDate)
            .ToListAsync(ct);

        int approvedUnpaidDays = 0;
        int unauthorizedAbsenceDays = 0;
        int paidDays = 0;

        var breakdown = new List<object>();

        for (int day = 1; day <= daysInMonth; day++)
        {
            var date = new DateOnly(year, month, day);
            var rec = records.FirstOrDefault(r => r.AttendanceDate == date);

            string classification;

            if (rec == null)
            {
                // Default if no punch record: assume present unless weekend/holiday
                paidDays++;
                classification = "Present / Unrecorded";
            }
            else if (rec.Status == AttendanceStatus.Leave)
            {
                // Check if remarks or type indicates LWP
                bool isUnpaid = (rec.Remarks ?? "").Contains("LWP", StringComparison.OrdinalIgnoreCase) ||
                                (rec.Remarks ?? "").Contains("Unpaid", StringComparison.OrdinalIgnoreCase);
                if (isUnpaid)
                {
                    approvedUnpaidDays++;
                    classification = "Approved Unpaid Leave (LWP)";
                }
                else
                {
                    paidDays++;
                    classification = "Approved Paid Leave";
                }
            }
            else if (rec.Status == AttendanceStatus.Absent)
            {
                bool isRegularizedLwp = rec.IsRegularized && (rec.Remarks ?? "").Contains("LWP", StringComparison.OrdinalIgnoreCase);
                if (isRegularizedLwp)
                {
                    approvedUnpaidDays++;
                    classification = "Approved Unpaid Leave (Regularized LWP)";
                }
                else
                {
                    unauthorizedAbsenceDays++;
                    classification = "Unauthorized Absence (Truancy)";
                }
            }
            else if (rec.Status == AttendanceStatus.HalfDay)
            {
                paidDays += 1; // Counted as half
                classification = "Half Day";
            }
            else
            {
                paidDays++;
                classification = rec.Status.ToString();
            }

            if (rec?.Status == AttendanceStatus.Absent || rec?.Status == AttendanceStatus.Leave)
            {
                breakdown.Add(new
                {
                    date = date.ToString("yyyy-MM-dd"),
                    status = rec?.Status.ToString(),
                    remarks = rec?.Remarks ?? "",
                    isRegularized = rec?.IsRegularized ?? false,
                    reconciliationResult = classification
                });
            }
        }

        int totalLwpDays = approvedUnpaidDays + unauthorizedAbsenceDays;

        return Ok(ApiResponse<object>.Ok(new
        {
            employeeId,
            employeeCode = emp.EmployeeCode,
            employeeName = $"{emp.FirstName} {emp.LastName}",
            year,
            month,
            totalWorkingDays = daysInMonth,
            approvedUnpaidLeaveDays = approvedUnpaidDays,
            unauthorizedAbsenceDays = unauthorizedAbsenceDays,
            totalLWPDays = totalLwpDays,
            netPaidDays = Math.Max(0, daysInMonth - totalLwpDays),
            attendanceBreakdown = breakdown
        }));
    }

    /// <summary>
    /// GET /api/v1/payroll/attendance-reconciliation/reconcile-run/{year}/{month}
    /// Batch reconciliation report for payroll run month across all active employees.
    /// </summary>
    [HttpGet("reconcile-run/{year}/{month}")]
    public async Task<ActionResult<ApiResponse<object>>> ReconcilePayrollRun(int year, int month, CancellationToken ct)
    {
        if (!IsAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only PayrollAdmin can run batch attendance reconciliation."));

        var companyId = _currentUser.CompanyId;
        var employees = await _context.Employees
            .Where(e => e.IsActive && (!companyId.HasValue || e.CompanyId == companyId.Value))
            .Take(50)
            .ToListAsync(ct);

        var list = new List<object>();

        foreach (var emp in employees)
        {
            var res = await ReconcileEmployee(emp.EmployeeId, year, month, ct);
            if (res.Result is OkObjectResult ok && ok.Value is ApiResponse<object> apiRes && apiRes.Data != null)
            {
                list.Add(apiRes.Data);
            }
        }

        return Ok(ApiResponse<object>.Ok(new
        {
            year,
            month,
            totalEmployeesReconciled = list.Count,
            reconciliationList = list
        }));
    }
}
