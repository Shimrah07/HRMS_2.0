using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Application.Services;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Infrastructure.Services;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

/// <summary>
/// Module 5.6 — Payroll Documents: Form 16, Salary Certificate, CTC Letter, GL Export, TDS declaration management
/// </summary>
[ApiController]
[Route("api/v1/documents")]
[Authorize]
public class PayrollDocumentsController : ControllerBase
{
    private readonly AppDbContext _ctx;
    private readonly ICurrentUserService _currentUser;
    private readonly ITdsCalculationService _tdsCalc;

    public PayrollDocumentsController(AppDbContext ctx, ICurrentUserService currentUser, ITdsCalculationService tdsCalc)
    {
        _ctx = ctx;
        _currentUser = currentUser;
        _tdsCalc = tdsCalc;
    }

    private bool IsAdmin => _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead);

    // ─── GET /api/v1/documents/form16/{empId} ─────────────────────────────────
    [HttpGet("form16/{empId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetForm16(Guid empId, [FromQuery] string fy, CancellationToken ct)
    {
        var isOwn = _currentUser.EmployeeId == empId;
        if (!isOwn && !IsAdmin) return StatusCode(403, ApiResponse<object>.Fail("Access denied."));

        var emp = await _ctx.Employees.FindAsync(new object[] { empId }, ct);
        if (emp == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));

        // Aggregate annual payroll data for the FY
        var fyParts = fy?.Split('-');
        int fyYear = fyParts?.Length == 2 ? int.Parse(fyParts[0]) : DateTime.UtcNow.Year;

        // April to March: months 4-12 of fyYear and 1-3 of fyYear+1
        var details = await _ctx.PayrollDetails
            .Include(d => d.PayrollRun)
            .Where(d => d.EmployeeId == empId &&
                ((d.PayrollRun.Year == fyYear && d.PayrollRun.Month >= 4) ||
                 (d.PayrollRun.Year == fyYear + 1 && d.PayrollRun.Month <= 3)))
            .ToListAsync(ct);

        decimal grossAnnual = details.Sum(d => d.GrossEarnings);
        decimal tdsDeducted = details.Sum(d => d.TDSDeducted);
        decimal pfEmployee = details.Sum(d => d.PFEmployee);

        // Get investment declaration
        var declaration = await _ctx.InvestmentDeclarations
            .FirstOrDefaultAsync(d => d.EmployeeId == empId && d.FinancialYear == fy, ct);

        // Compute regime comparison
        var empSalary = await _ctx.EmployeeSalaryStructures.FirstOrDefaultAsync(s => s.EmployeeId == empId && s.IsActive, ct);
        decimal annualBasic = empSalary != null ? empSalary.AnnualCTC * 0.50m : grossAnnual * 0.50m;

        var tdsInput = new TdsInput(
            EmployeeId: empId,
            AnnualCTC: grossAnnual,
            AnnualBasic: annualBasic,
            SelectedRegime: declaration?.TaxRegime ?? TaxRegime.New,
            Section80C: declaration?.Section80C ?? 0,
            Section80D: declaration?.Section80D ?? 0,
            Section80E: declaration?.Section80E ?? 0,
            Section80G: declaration?.Section80G ?? 0,
            HraClaimAmount: declaration?.HraClaimAmount ?? 0,
            HomeLoanInterest: declaration?.HomeLoanInterest ?? 0,
            PreviousEmployerIncome: declaration?.PreviousEmployerIncome ?? 0,
            PreviousEmployerTds: declaration?.PreviousEmployerTds ?? 0,
            AnnualPFEmployee: pfEmployee * 12,
            CurrentMonth: 3 // End of FY
        );
        var tdsResult = _tdsCalc.Calculate(tdsInput);

        return Ok(ApiResponse<object>.Ok(new {
            employeeId = empId,
            employeeName = emp.FirstName + " " + emp.LastName,
            employeeCode = emp.EmployeeCode,
            pan = emp.PANNumber,
            financialYear = fy,
            grossAnnualIncome = grossAnnual,
            taxableIncome = tdsResult.AppliedRegime == TaxRegime.New ? tdsResult.NewRegimeTaxableIncome : tdsResult.OldRegimeTaxableIncome,
            taxLiability = tdsResult.AppliedRegime == TaxRegime.New ? tdsResult.NewRegimeTax : tdsResult.OldRegimeTax,
            tdsDeducted,
            regime = tdsResult.AppliedRegime.ToString(),
            section80C = declaration?.Section80C ?? 0,
            section80D = declaration?.Section80D ?? 0,
            hraExemption = declaration?.HraClaimAmount ?? 0,
            homeLoanInterest = declaration?.HomeLoanInterest ?? 0,
            generatedAt = DateTime.UtcNow,
            form = "Form 16 Part A & B",
            note = "For actual digitally-signed Form 16, generate via TAN-registered software (TRACES)."
        }, "Form 16 data generated."));
    }

    // ─── POST /api/v1/documents/salary-certificate ────────────────────────────
    [HttpPost("salary-certificate")]
    public async Task<ActionResult<ApiResponse<object>>> GenerateSalaryCertificate([FromBody] SalaryCertRequest req, CancellationToken ct)
    {
        var empId = req.EmployeeId ?? _currentUser.EmployeeId ?? Guid.Empty;
        var isOwn = _currentUser.EmployeeId == empId;
        if (!isOwn && !IsAdmin) return StatusCode(403, ApiResponse<object>.Fail("Access denied."));

        var emp = await _ctx.Employees.Include(e => e.Designation).Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.EmployeeId == empId, ct);
        if (emp == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));

        var latestSalary = await _ctx.EmployeeSalaryStructures
            .Where(s => s.EmployeeId == empId && s.IsActive)
            .OrderByDescending(s => s.EffectiveFrom)
            .FirstOrDefaultAsync(ct);

        decimal monthlyGross = latestSalary != null ? latestSalary.AnnualCTC / 12m : 0m;

        // Log document record
        _ctx.PayrollDocuments.Add(new PayrollDocument {
            DocumentId = Guid.NewGuid(),
            EmployeeId = empId,
            CompanyId = _currentUser.CompanyId,
            DocumentType = PayrollDocumentType.SalaryCertificate,
            Period = DateTime.UtcNow.ToString("yyyy-MM"),
            FileName = $"SalaryCertificate_{emp.EmployeeCode}_{DateTime.UtcNow:yyyyMMdd}.pdf",
            GeneratedAt = DateTime.UtcNow
        });
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new {
            employeeCode = emp.EmployeeCode,
            employeeName = emp.FirstName + " " + emp.LastName,
            designation = emp.Designation?.Title,
            department = emp.Department?.DeptName,
            dateOfJoining = emp.JoiningDate,
            monthlyGrossSalary = Math.Round(monthlyGross, 2),
            annualCTC = latestSalary?.AnnualCTC ?? 0,
            purpose = req.Purpose ?? "General Purpose",
            issuedDate = DateOnly.FromDateTime(DateTime.UtcNow),
            validUpto = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            note = "This certificate is system-generated and valid for 30 days from issue date."
        }, "Salary certificate generated."));
    }

    // ─── GET /api/v1/documents/gl-export ──────────────────────────────────────
    [HttpGet("gl-export")]
    public async Task<ActionResult<ApiResponse<object>>> GetGLExport([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        if (!IsAdmin) return StatusCode(403, ApiResponse<object>.Fail("Finance access required."));
        var companyId = _currentUser.CompanyId ?? Guid.Empty;

        var run = await _ctx.PayrollRuns
            .FirstOrDefaultAsync(r => r.CompanyId == companyId && r.Month == month && r.Year == year &&
                r.RunType == PayrollRunType.Regular, ct);

        if (run == null) return BadRequest(ApiResponse<object>.Fail("No payroll run found for that period."));

        var details = await _ctx.PayrollDetails.Where(d => d.PayrollRunId == run.PayrollRunId).ToListAsync(ct);

        var glEntries = new[] {
            new { glCode = "5001", description = "Salary & Wages (Gross Earnings)", debit = details.Sum(d => d.GrossEarnings), credit = 0m },
            new { glCode = "2101", description = "PF Payable (Employee)", debit = 0m, credit = details.Sum(d => d.PFEmployee) },
            new { glCode = "2102", description = "PF Payable (Employer)", debit = details.Sum(d => d.PFEmployer), credit = details.Sum(d => d.PFEmployer) },
            new { glCode = "2103", description = "ESI Payable (Employee)", debit = 0m, credit = details.Sum(d => d.ESIEmployee) },
            new { glCode = "2104", description = "ESI Payable (Employer)", debit = details.Sum(d => d.ESIEmployer), credit = details.Sum(d => d.ESIEmployer) },
            new { glCode = "2105", description = "TDS Payable", debit = 0m, credit = details.Sum(d => d.TDSDeducted) },
            new { glCode = "2106", description = "PT Payable", debit = 0m, credit = details.Sum(d => d.ProfessionalTax) },
            new { glCode = "2201", description = "Gratuity Provision", debit = details.Sum(d => d.GratuityProvision), credit = details.Sum(d => d.GratuityProvision) },
            new { glCode = "1001", description = "Bank / Salary Payable", debit = 0m, credit = details.Sum(d => d.NetPay) }
        };

        return Ok(ApiResponse<object>.Ok(new {
            month, year, period = $"{month:D2}/{year}",
            totalDebit = glEntries.Sum(e => e.debit),
            totalCredit = glEntries.Sum(e => e.credit),
            generatedAt = DateTime.UtcNow,
            entries = glEntries
        }, "GL export generated."));
    }

    // ─── GET /api/v1/documents/tds-projection/{empId} ────────────────────────
    [HttpGet("tds-projection/{empId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetTDSProjection(Guid empId, [FromQuery] string? fy, CancellationToken ct)
    {
        var isOwn = _currentUser.EmployeeId == empId;
        if (!isOwn && !IsAdmin) return StatusCode(403, ApiResponse<object>.Fail("Access denied."));

        var declaration = await _ctx.InvestmentDeclarations
            .FirstOrDefaultAsync(d => d.EmployeeId == empId && d.FinancialYear == (fy ?? GetCurrentFY()), ct);

        var empSalary = await _ctx.EmployeeSalaryStructures
            .Where(s => s.EmployeeId == empId && s.IsActive)
            .FirstOrDefaultAsync(ct);

        if (empSalary == null) return BadRequest(ApiResponse<object>.Fail("No active salary structure for employee."));

        var tdsInput = new TdsInput(
            EmployeeId: empId,
            AnnualCTC: empSalary.AnnualCTC,
            AnnualBasic: empSalary.AnnualCTC * 0.50m,
            SelectedRegime: declaration?.TaxRegime ?? TaxRegime.New,
            Section80C: declaration?.Section80C ?? 0,
            Section80D: declaration?.Section80D ?? 0,
            HraClaimAmount: declaration?.HraClaimAmount ?? 0,
            HomeLoanInterest: declaration?.HomeLoanInterest ?? 0,
            CurrentMonth: DateTime.UtcNow.Month
        );
        var tdsResult = _tdsCalc.Calculate(tdsInput);

        return Ok(ApiResponse<object>.Ok(new {
            employeeId = empId,
            financialYear = fy ?? GetCurrentFY(),
            annualCTC = empSalary.AnnualCTC,
            regime = tdsResult.AppliedRegime.ToString(),
            recommendedRegime = tdsResult.RecommendedRegime.ToString(),
            oldRegimeTax = tdsResult.OldRegimeTax,
            newRegimeTax = tdsResult.NewRegimeTax,
            annualTds = tdsResult.AnnualTds,
            monthlyTds = tdsResult.MonthlyTds,
            remainingMonths = tdsResult.RemainingFYMonths,
            breakdown = tdsResult.Breakdown
        }, "TDS projection computed."));
    }

    private static string GetCurrentFY()
    {
        var now = DateTime.UtcNow;
        int startYear = now.Month >= 4 ? now.Year : now.Year - 1;
        return $"{startYear}-{startYear + 1}";
    }
}

public record SalaryCertRequest(Guid? EmployeeId, string? Purpose);
