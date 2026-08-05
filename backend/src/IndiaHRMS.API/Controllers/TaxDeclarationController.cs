using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
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
/// TICKET-4: Tax Declaration Admin Approval Workflow
/// Endpoints for employee submission and HR/Admin approval/rejection of tax declarations (80C, 80D, HRA, 24b).
/// </summary>
[ApiController]
[Route("api/v1/payroll/tax-declarations")]
[Authorize]
public class TaxDeclarationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public TaxDeclarationController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    private bool IsAdmin =>
        _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead);

    /// <summary>
    /// GET /api/v1/payroll/tax-declarations/me
    /// Gets tax declarations for logged-in employee for the current/given FY.
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyDeclarations([FromQuery] string? financialYear, CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == _currentUser.UserId, ct);
            empId = user?.EmployeeId;
        }
        if (!empId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile found for logged-in user."));

        var fy = string.IsNullOrWhiteSpace(financialYear) ? GetCurrentFYString() : financialYear.Trim();

        var decls = await _context.TaxDeclarations
            .Where(t => t.EmployeeId == empId.Value && t.FinancialYear == fy)
            .OrderByDescending(t => t.SubmittedAt)
            .Select(t => new
            {
                t.DeclarationId,
                t.EmployeeId,
                t.FinancialYear,
                taxRegime = t.TaxRegime.ToString(),
                hraClaimed = t.HRA_Claimed,
                section80C = t.Section80C,
                section80D = t.Section80D,
                houseLoanInterest = t.HouseLoanInterest,
                otherDeductions = t.OtherDeductions,
                t.SubmittedAt,
                t.IsApproved,
                t.ApprovedBy,
                status = t.IsApproved ? "Approved" : (t.ApprovedBy != null ? "Rejected" : "Pending")
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(decls));
    }

    /// <summary>
    /// POST /api/v1/payroll/tax-declarations
    /// Employee submits/updates tax declaration for financial year.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> SubmitDeclaration([FromBody] SubmitTaxDeclarationRequest req, CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == _currentUser.UserId, ct);
            empId = user?.EmployeeId;
        }
        if (!empId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile found for logged-in user."));

        var fy = string.IsNullOrWhiteSpace(req.FinancialYear) ? GetCurrentFYString() : req.FinancialYear.Trim();

        // Standard statutory capping limits for validation
        if (req.Section80C > 150000)
            return BadRequest(ApiResponse<object>.Fail("Section 80C declaration cannot exceed statutory ceiling of ₹1,50,000."));
        if (req.Section80D > 100000)
            return BadRequest(ApiResponse<object>.Fail("Section 80D declaration cannot exceed statutory ceiling of ₹1,00,000."));

        var existing = await _context.TaxDeclarations
            .FirstOrDefaultAsync(t => t.EmployeeId == empId.Value && t.FinancialYear == fy, ct);

        if (existing != null)
        {
            // If existing is already approved, re-submission resets to pending approval
            existing.TaxRegime = Enum.Parse<TaxRegime>(req.TaxRegime);
            existing.HRA_Claimed = req.HraClaimed;
            existing.Section80C = req.Section80C;
            existing.Section80D = req.Section80D;
            existing.HouseLoanInterest = req.HouseLoanInterest;
            existing.OtherDeductions = req.OtherDeductions;
            existing.SubmittedAt = DateTime.UtcNow;
            existing.IsApproved = false;
            existing.ApprovedBy = null;
        }
        else
        {
            existing = new TaxDeclaration
            {
                DeclarationId = Guid.NewGuid(),
                EmployeeId = empId.Value,
                FinancialYear = fy,
                TaxRegime = Enum.Parse<TaxRegime>(req.TaxRegime),
                HRA_Claimed = req.HraClaimed,
                Section80C = req.Section80C,
                Section80D = req.Section80D,
                HouseLoanInterest = req.HouseLoanInterest,
                OtherDeductions = req.OtherDeductions,
                SubmittedAt = DateTime.UtcNow,
                IsApproved = false,
                ApprovedBy = null
            };
            _context.TaxDeclarations.Add(existing);
        }

        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new
        {
            existing.DeclarationId,
            existing.FinancialYear,
            status = "Pending"
        }, "Tax declaration submitted successfully. Awaiting HR/Admin approval for proof verification."));
    }

    /// <summary>
    /// GET /api/v1/payroll/tax-declarations/pending
    /// Admin lists all pending or submitted declarations for approval queue.
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<ApiResponse<object>>> GetPendingDeclarations([FromQuery] string? financialYear, CancellationToken ct)
    {
        if (!IsAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only HRAdmin/PayrollAdmin can access pending tax declarations queue."));

        var fy = string.IsNullOrWhiteSpace(financialYear) ? GetCurrentFYString() : financialYear.Trim();
        var companyId = _currentUser.CompanyId;

        var query = _context.TaxDeclarations
            .Include(t => t.Employee)
                .ThenInclude(e => e.Department)
            .Where(t => t.FinancialYear == fy);

        if (companyId.HasValue)
            query = query.Where(t => t.Employee != null && t.Employee.CompanyId == companyId.Value);

        var list = await query
            .OrderByDescending(t => t.SubmittedAt)
            .Select(t => new
            {
                declarationId = t.DeclarationId,
                employeeId = t.EmployeeId,
                employeeCode = t.Employee != null ? t.Employee.EmployeeCode : "",
                employeeName = t.Employee != null ? $"{t.Employee.FirstName} {t.Employee.LastName}" : "",
                departmentName = t.Employee != null && t.Employee.Department != null ? t.Employee.Department.DeptName : "",
                financialYear = t.FinancialYear,
                taxRegime = t.TaxRegime.ToString(),
                hraClaimed = t.HRA_Claimed,
                section80C = t.Section80C,
                section80D = t.Section80D,
                houseLoanInterest = t.HouseLoanInterest,
                otherDeductions = t.OtherDeductions,
                totalExemptions = t.TaxRegime == TaxRegime.Old ? (t.HRA_Claimed + t.Section80C + t.Section80D + t.HouseLoanInterest + t.OtherDeductions) : 0,
                submittedAt = t.SubmittedAt,
                isApproved = t.IsApproved,
                approvedBy = t.ApprovedBy,
                status = t.IsApproved ? "Approved" : (t.ApprovedBy != null ? "Rejected" : "Pending")
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(list));
    }

    /// <summary>
    /// PUT /api/v1/payroll/tax-declarations/{id}/approve
    /// Admin approves tax declaration after investment proof verification.
    /// </summary>
    [HttpPut("{id}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveDeclaration(Guid id, CancellationToken ct)
    {
        if (!IsAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only HRAdmin/PayrollAdmin can approve tax declarations."));

        var decl = await _context.TaxDeclarations.FindAsync(new object[] { id }, ct);
        if (decl == null)
            return NotFound(ApiResponse<object>.Fail("Tax declaration not found."));

        decl.IsApproved = true;
        decl.ApprovedBy = _currentUser.UserId;

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { id, status = "Approved" }, "Tax declaration verified and approved. Figures will be applied to final TDS computation."));
    }

    /// <summary>
    /// PUT /api/v1/payroll/tax-declarations/{id}/reject
    /// Admin rejects tax declaration with remarks.
    /// </summary>
    [HttpPut("{id}/reject")]
    public async Task<ActionResult<ApiResponse<object>>> RejectDeclaration(Guid id, [FromBody] RejectDeclarationRequest req, CancellationToken ct)
    {
        if (!IsAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only HRAdmin/PayrollAdmin can reject tax declarations."));

        var decl = await _context.TaxDeclarations.FindAsync(new object[] { id }, ct);
        if (decl == null)
            return NotFound(ApiResponse<object>.Fail("Tax declaration not found."));

        decl.IsApproved = false;
        // Setting ApprovedBy to current user ID demarcates it as processed (Rejected)
        decl.ApprovedBy = _currentUser.UserId;

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { id, status = "Rejected", remarks = req.Remarks }, "Tax declaration rejected. Employee notified for correction."));
    }

    private static string GetCurrentFYString()
    {
        var now = DateTime.UtcNow;
        var startYear = now.Month >= 4 ? now.Year : now.Year - 1;
        return $"{startYear}-{(startYear + 1).ToString()[2..]}";
    }
}

public class SubmitTaxDeclarationRequest
{
    public string FinancialYear { get; set; } = string.Empty;
    public string TaxRegime { get; set; } = "New";
    public decimal HraClaimed { get; set; }
    public decimal Section80C { get; set; }
    public decimal Section80D { get; set; }
    public decimal HouseLoanInterest { get; set; }
    public decimal OtherDeductions { get; set; }
}

public class RejectDeclarationRequest
{
    public string Remarks { get; set; } = string.Empty;
}
