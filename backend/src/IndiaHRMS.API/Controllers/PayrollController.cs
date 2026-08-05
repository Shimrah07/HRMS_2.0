using IndiaHRMS.API.Filters;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v1/payroll")]
[Authorize]
public class PayrollController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPdfGenerationService _pdfService;
    private readonly ICurrentUserService _currentUser;

    public PayrollController(AppDbContext context, IPdfGenerationService pdfService, ICurrentUserService currentUser)
    {
        _context = context;
        _pdfService = pdfService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Gets salary slips archive for the logged-in employee.
    /// </summary>
    [HttpGet("my-salary-slips")]
    public async Task<ActionResult<ApiResponse<object>>> GetMySalarySlips(CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
        {
            // If user has no employee ID, find employee record linked to current User ID
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == _currentUser.UserId, ct);
            if (user?.EmployeeId != null) empId = user.EmployeeId;
        }

        if (!empId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("No employee profile found for logged-in user."));
        }

        var details = await _context.PayrollDetails
            .Include(d => d.PayrollRun)
            .Where(d => d.EmployeeId == empId.Value)
            .OrderByDescending(d => d.PayrollRun.Year)
            .ThenByDescending(d => d.PayrollRun.Month)
            .Select(d => new
            {
                detailId = d.DetailId,
                month = GetMonthName(d.PayrollRun.Month) + " " + d.PayrollRun.Year,
                year = d.PayrollRun.Year,
                monthNumber = d.PayrollRun.Month,
                workedDays = (int)d.PaidDays,
                workingDays = d.WorkingDays,
                lwpDays = d.LWPDays,
                grossEarnings = d.GrossEarnings,
                totalDeductions = d.TotalDeductions,
                netPay = d.NetPay,
                status = d.PayrollRun.Status.ToString()
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(details, "My salary slips fetched successfully."));
    }

    /// <summary>
    /// Downloads server-side PDF payslip for a specific payroll detail ID.
    /// </summary>
    [HttpGet("salary-slips/{payrollDetailId}/pdf")]
    public async Task<IActionResult> DownloadPayslipPdf(Guid payrollDetailId, CancellationToken ct)
    {
        var detail = await _context.PayrollDetails
            .Include(d => d.Employee)
            .FirstOrDefaultAsync(d => d.DetailId == payrollDetailId, ct);

        if (detail == null)
            return NotFound(ApiResponse<object>.Fail("Payroll detail record not found."));

        // Authorization check: Only own payslip OR Payroll/HR/Super Admin can download
        var isOwn = _currentUser.EmployeeId == detail.EmployeeId;
        var isAdmin = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead);

        if (!isOwn && !isAdmin)
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Unauthorized access to employee payslip PDF."));

        var pdfBytes = await _pdfService.GenerateSalarySlipAsync(payrollDetailId, ct);
        var fileName = $"Payslip_{detail.Employee?.EmployeeCode ?? "Emp"}_{payrollDetailId.ToString()[..8]}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }

    /// <summary>
    /// Downloads server-side PDF payslip for an employee by year and month.
    /// </summary>
    [HttpGet("salary-slips/{employeeId}/{year}/{month}/pdf")]
    public async Task<IActionResult> DownloadPayslipByMonthPdf(Guid employeeId, int year, int month, CancellationToken ct)
    {
        var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == employeeId, ct);
        if (emp == null)
            return NotFound(ApiResponse<object>.Fail("Employee record not found."));

        // Authorization check: Only own payslip OR Payroll/HR/Super Admin can download
        var isOwn = _currentUser.EmployeeId == employeeId;
        var isAdmin = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead);

        if (!isOwn && !isAdmin)
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Unauthorized access to employee payslip PDF."));

        var pdfBytes = await _pdfService.GenerateSalarySlipByEmployeeAndMonthAsync(employeeId, year, month, ct);
        var monthName = GetMonthName(month);
        var fileName = $"Payslip_{emp.EmployeeCode ?? "Emp"}_{monthName}_{year}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }

    /// <summary>
    /// Downloads logged-in employee's own PDF payslip by year and month.
    /// </summary>
    [HttpGet("my-salary-slips/{year}/{month}/pdf")]
    public async Task<IActionResult> DownloadMyPayslipPdf(int year, int month, CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == _currentUser.UserId, ct);
            if (user?.EmployeeId != null) empId = user.EmployeeId;
        }

        if (!empId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile found for logged-in user."));

        var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == empId.Value, ct);
        var pdfBytes = await _pdfService.GenerateSalarySlipByEmployeeAndMonthAsync(empId.Value, year, month, ct);
        var monthName = GetMonthName(month);
        var fileName = $"Payslip_{emp?.EmployeeCode ?? "Emp"}_{monthName}_{year}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }

    private static string GetMonthName(int month)
    {
        if (month < 1 || month > 12) return "Month";
        return System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);
    }
}
