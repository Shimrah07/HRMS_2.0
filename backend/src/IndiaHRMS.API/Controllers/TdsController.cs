using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

/// <summary>
/// TICKET-3: Cumulative YTD TDS Tracking
/// Provides:
///  - GET /api/v1/payroll/tds-ytd/{employeeId} — YTD TDS summary for the current/given FY
///  - GET /api/v1/payroll/tds-ytd/me — self-service YTD summary for the logged-in employee
/// The correct financial year (Apr–Mar) is used for all calculations.
/// </summary>
[ApiController]
[Route("api/v1/payroll")]
[Authorize]
public class TdsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public TdsController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // ─── Financial Year Helpers ────────────────────────────────────────────────

    /// <summary>Returns the Indian FY start year for a given calendar date. Apr → Mar cycle.</summary>
    private static int GetFYStartYear(DateTime date) =>
        date.Month >= 4 ? date.Year : date.Year - 1;

    private static (int fyStartYear, int fyEndYear) GetCurrentFY()
    {
        var now = DateTime.UtcNow;
        var fyStart = GetFYStartYear(now);
        return (fyStart, fyStart + 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GET /api/v1/payroll/tds-ytd/me
    /// Returns YTD TDS summary for the currently logged-in employee.
    /// </summary>
    [HttpGet("tds-ytd/me")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyYtdTds([FromQuery] int? fyYear, CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == _currentUser.UserId, ct);
            empId = user?.EmployeeId;
        }
        if (!empId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile found for logged-in user."));

        return Ok(await BuildYtdSummaryAsync(empId.Value, fyYear, ct));
    }

    /// <summary>
    /// GET /api/v1/payroll/tds-ytd/{employeeId}
    /// Returns YTD TDS summary for a specific employee. Accessible to admin roles or own employee.
    /// </summary>
    [HttpGet("tds-ytd/{employeeId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetYtdTdsByEmployee(Guid employeeId, [FromQuery] int? fyYear, CancellationToken ct)
    {
        var isOwn = _currentUser.EmployeeId == employeeId;
        var isAdmin = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead);
        if (!isOwn && !isAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("You can only view your own TDS summary."));

        return Ok(await BuildYtdSummaryAsync(employeeId, fyYear, ct));
    }

    /// <summary>
    /// GET /api/v1/payroll/tds-ytd/company-summary
    /// Returns aggregate TDS deducted by month for the current FY (PayrollAdmin only).
    /// </summary>
    [HttpGet("tds-ytd/company-summary")]
    public async Task<ActionResult<ApiResponse<object>>> GetCompanyYtdSummary([FromQuery] int? fyYear, CancellationToken ct)
    {
        if (!_currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead))
            return StatusCode(403, ApiResponse<object>.Fail("Insufficient permissions."));

        var (fyStart, fyEnd) = fyYear.HasValue
            ? (fyYear.Value, fyYear.Value + 1)
            : GetCurrentFY();

        var companyId = _currentUser.CompanyId;

        // Build a month-by-month TDS breakdown across the FY
        // FY months: Apr(4)–Mar(3) spanning two calendar years
        var monthBands = GetFYMonths(fyStart);

        var query = _context.PayrollDetails
            .Include(d => d.PayrollRun)
            .Include(d => d.Employee)
            .Where(d => (d.PayrollRun.Year == fyStart && d.PayrollRun.Month >= 4) || (d.PayrollRun.Year == fyStart + 1 && d.PayrollRun.Month <= 3));

        if (companyId.HasValue)
            query = query.Where(d => d.Employee != null && d.Employee.CompanyId == companyId.Value);

        var rows = await query
            .Select(d => new { d.PayrollRun.Year, d.PayrollRun.Month, d.TDSDeducted })
            .ToListAsync(ct);

        var monthly = monthBands.Select(m => new
        {
            year = m.Year,
            month = m.Month,
            label = $"{System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(m.Month)}-{m.Year}",
            totalTDS = rows.Where(r => r.Year == m.Year && r.Month == m.Month).Sum(r => r.TDSDeducted)
        }).ToList();

        return Ok(ApiResponse<object>.Ok(new
        {
            fyStartYear = fyStart,
            fyEndYear = fyEnd,
            fyLabel = $"FY {fyStart}-{fyEnd.ToString()[2..]}",
            totalYtdTds = monthly.Sum(m => m.totalTDS),
            monthlyBreakdown = monthly
        }));
    }

    // ─── Core YTD computation logic ───────────────────────────────────────────

    private async Task<ApiResponse<object>> BuildYtdSummaryAsync(Guid employeeId, int? fyYear, CancellationToken ct)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, ct);

        if (employee == null)
            return ApiResponse<object>.Fail("Employee not found.");

        var (fyStart, fyEnd) = fyYear.HasValue
            ? (fyYear.Value, fyYear.Value + 1)
            : GetCurrentFY();

        // Pull all PayrollDetail rows for this employee in the given FY (Apr–Mar)
        var details = await _context.PayrollDetails
            .Include(d => d.PayrollRun)
            .Where(d => d.EmployeeId == employeeId && ((d.PayrollRun.Year == fyStart && d.PayrollRun.Month >= 4) || (d.PayrollRun.Year == fyStart + 1 && d.PayrollRun.Month <= 3)))
            .OrderBy(d => d.PayrollRun.Year)
            .ThenBy(d => d.PayrollRun.Month)
            .Select(d => new
            {
                year = d.PayrollRun.Year,
                month = d.PayrollRun.Month,
                grossEarnings = d.GrossEarnings,
                tdsDeducted = d.TDSDeducted,
                netPay = d.NetPay,
                status = d.PayrollRun.Status.ToString()
            })
            .ToListAsync(ct);

        decimal ytdTds = details.Sum(d => d.tdsDeducted);
        decimal ytdGross = details.Sum(d => d.grossEarnings);
        int processedMonths = details.Count;

        // Estimate remaining months in FY
        var now = DateTime.UtcNow;
        var fyMonths = GetFYMonths(fyStart);
        int totalFYMonths = 12;
        int futureMonths = fyMonths.Count(m => m.Year > now.Year || (m.Year == now.Year && m.Month > now.Month));

        // Projected annual TDS (simple linear projection from current months processed)
        decimal projectedAnnualTds = processedMonths > 0
            ? (ytdTds / processedMonths) * totalFYMonths
            : 0;

        var monthlyRows = fyMonths.Select(m =>
        {
            var row = details.FirstOrDefault(d => d.year == m.Year && d.month == m.Month);
            return new
            {
                label = $"{System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(m.Month)}-{m.Year}",
                year = m.Year,
                month = m.Month,
                tdsDeducted = row?.tdsDeducted ?? 0m,
                grossEarnings = row?.grossEarnings ?? 0m,
                status = row?.status ?? "NotProcessed"
            };
        }).ToList();

        return ApiResponse<object>.Ok(new
        {
            employeeId,
            employeeCode = employee.EmployeeCode,
            employeeName = $"{employee.FirstName} {employee.LastName}",
            fyStartYear = fyStart,
            fyEndYear = fyEnd,
            fyLabel = $"FY {fyStart}-{fyEnd.ToString()[2..]}",
            ytdTdsDeducted = ytdTds,
            ytdGrossEarnings = ytdGross,
            processedMonths,
            remainingMonths = futureMonths,
            projectedAnnualTds = Math.Round(projectedAnnualTds, 2),
            monthlyBreakdown = monthlyRows
        });
    }

    // ─── FY boundary helpers ──────────────────────────────────────────────────

    /// <summary>
    /// Returns true if the given (month, year) falls within the financial year starting at fyStartYear.
    /// FY Apr fyStartYear → Mar fyStartYear+1.
    /// </summary>
    private static bool IsInFY(int month, int year, int fyStartYear) =>
        (year == fyStartYear && month >= 4) ||
        (year == fyStartYear + 1 && month <= 3);

    /// <summary>Returns the 12 (Month, Year) tuples for a financial year starting in fyStartYear.</summary>
    private static System.Collections.Generic.List<(int Month, int Year)> GetFYMonths(int fyStartYear)
    {
        var months = new System.Collections.Generic.List<(int Month, int Year)>();
        for (int m = 4; m <= 12; m++) months.Add((m, fyStartYear));
        for (int m = 1; m <= 3; m++) months.Add((m, fyStartYear + 1));
        return months;
    }
}
