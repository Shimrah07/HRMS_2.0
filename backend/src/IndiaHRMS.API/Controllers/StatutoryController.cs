using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

/// <summary>
/// Module 5.2 & 5.6 — Statutory Deductions Configuration + Compliance Filing
/// PF ECR, ESI return, Form 24Q, PT slabs, compliance calendar
/// </summary>
[ApiController]
[Route("api/v1/statutory")]
[Authorize]
public class StatutoryController : ControllerBase
{
    private readonly AppDbContext _ctx;
    private readonly ICurrentUserService _currentUser;

    public StatutoryController(AppDbContext ctx, ICurrentUserService currentUser)
    {
        _ctx = ctx;
        _currentUser = currentUser;
    }

    private bool IsAdmin => _currentUser.IsAuthenticated;

    // ─── GET /api/v1/statutory/config ─────────────────────────────────────────
    [HttpGet("config")]
    public async Task<ActionResult<ApiResponse<object>>> GetConfig(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId ?? Guid.Empty;
        var config = await _ctx.StatutoryDeductionConfigs.FirstOrDefaultAsync(c => c.CompanyId == companyId, ct);
        if (config == null)
        {
            // Return defaults
            return Ok(ApiResponse<object>.Ok(new {
                pfApplicable = true, pfHigherBasis = false, pfWageCeiling = 15000m,
                esiApplicable = true, esiGrossLimit = 21000m,
                ptApplicable = true, lwfApplicable = false,
                lwfEmployeeAmount = 0m, lwfEmployerAmount = 0m,
                lopDivisor = "Fixed30", workState = "MH"
            }, "Default statutory config."));
        }

        return Ok(ApiResponse<object>.Ok(new {
            configId = config.ConfigId,
            pfApplicable = config.PFApplicable, pfHigherBasis = config.PFHigherBasis,
            pfWageCeiling = config.PFWageCeiling, esiApplicable = config.ESIApplicable,
            esiGrossLimit = config.ESIGrossLimit, ptApplicable = config.PTApplicable,
            lwfApplicable = config.LWFApplicable, lwfEmployeeAmount = config.LWFEmployeeAmount,
            lwfEmployerAmount = config.LWFEmployerAmount, lopDivisor = config.LopDivisor.ToString(),
            workState = config.WorkState
        }));
    }

    // ─── PUT /api/v1/statutory/config ─────────────────────────────────────────
    [HttpPut("config")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateConfig([FromBody] StatutoryConfigRequest req, CancellationToken ct)
    {
        if (!IsAdmin) return StatusCode(403, ApiResponse<object>.Fail("Admin access required."));
        var companyId = _currentUser.CompanyId ?? Guid.Empty;
        var config = await _ctx.StatutoryDeductionConfigs.FirstOrDefaultAsync(c => c.CompanyId == companyId, ct);

        if (config == null)
        {
            config = new StatutoryDeductionConfig { ConfigId = Guid.NewGuid(), CompanyId = companyId };
            _ctx.StatutoryDeductionConfigs.Add(config);
        }

        config.PFApplicable = req.PFApplicable;
        config.PFHigherBasis = req.PFHigherBasis;
        config.PFWageCeiling = req.PFWageCeiling;
        config.ESIApplicable = req.ESIApplicable;
        config.ESIGrossLimit = req.ESIGrossLimit;
        config.PTApplicable = req.PTApplicable;
        config.LWFApplicable = req.LWFApplicable;
        config.LWFEmployeeAmount = req.LWFEmployeeAmount;
        config.LWFEmployerAmount = req.LWFEmployerAmount;
        config.LopDivisor = Enum.Parse<LopDivisorPolicy>(req.LopDivisor ?? "Fixed30");
        config.WorkState = req.WorkState ?? "MH";
        config.UpdatedAt = DateTime.UtcNow;

        await _ctx.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { configId = config.ConfigId }, "Statutory config updated."));
    }

    // ─── GET /api/v1/statutory/pt-slabs ───────────────────────────────────────
    [HttpGet("pt-slabs")]
    public async Task<ActionResult<ApiResponse<object>>> GetPTSlabs([FromQuery] string state = "MH", CancellationToken ct = default)
    {
        var companyId = _currentUser.CompanyId ?? Guid.Empty;
        var slabs = await _ctx.ProfessionalTaxSlabs
            .Where(s => s.CompanyId == companyId && s.StateCode == state)
            .OrderBy(s => s.FromAmount)
            .Select(s => new { s.SlabId, s.StateCode, s.FromAmount, s.ToAmount, s.MonthlyPTAmount, s.FebruaryOverride })
            .ToListAsync(ct);

        // Return Maharashtra defaults if none configured
        if (!slabs.Any() && state == "MH")
        {
            return Ok(ApiResponse<object>.Ok(new[] {
                new { slabId = Guid.Empty, stateCode = "MH", fromAmount = 0m, toAmount = (decimal?)7500m, monthlyPTAmount = 0m, februaryOverride = (decimal?)null },
                new { slabId = Guid.Empty, stateCode = "MH", fromAmount = 7501m, toAmount = (decimal?)10000m, monthlyPTAmount = 175m, februaryOverride = (decimal?)null },
                new { slabId = Guid.Empty, stateCode = "MH", fromAmount = 10001m, toAmount = (decimal?)null, monthlyPTAmount = 200m, februaryOverride = (decimal?)300m }
            }, "Default Maharashtra PT slabs."));
        }

        return Ok(ApiResponse<object>.Ok(slabs));
    }

    // ─── POST /api/v1/statutory/pt-slabs ──────────────────────────────────────
    [HttpPost("pt-slabs")]
    public async Task<ActionResult<ApiResponse<object>>> UpsertPTSlabs([FromBody] List<PTSlabRequest> slabs, [FromQuery] string state = "MH", CancellationToken ct = default)
    {
        if (!IsAdmin) return StatusCode(403, ApiResponse<object>.Fail("Admin access required."));
        var companyId = _currentUser.CompanyId ?? Guid.Empty;

        // Delete existing for this state
        var existing = await _ctx.ProfessionalTaxSlabs.Where(s => s.CompanyId == companyId && s.StateCode == state).ToListAsync(ct);
        _ctx.ProfessionalTaxSlabs.RemoveRange(existing);

        foreach (var s in slabs)
        {
            _ctx.ProfessionalTaxSlabs.Add(new ProfessionalTaxSlab {
                SlabId = Guid.NewGuid(), CompanyId = companyId, StateCode = state,
                FromAmount = s.FromAmount, ToAmount = s.ToAmount,
                MonthlyPTAmount = s.MonthlyPTAmount, FebruaryOverride = s.FebruaryOverride
            });
        }

        await _ctx.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { count = slabs.Count }, $"PT slabs saved for state {state}."));
    }

    // ─── GET /api/v1/statutory/pf-ecr ─────────────────────────────────────────
    [HttpGet("pf-ecr")]
    public async Task<ActionResult<ApiResponse<object>>> GetPFECR([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        if (!IsAdmin) return StatusCode(403, ApiResponse<object>.Fail("Admin access required."));
        var companyId = _currentUser.CompanyId ?? Guid.Empty;

        var run = await _ctx.PayrollRuns
            .FirstOrDefaultAsync(r => r.CompanyId == companyId && r.Month == month && r.Year == year &&
                r.RunType == PayrollRunType.Regular && r.Status >= PayrollStatus.Locked, ct);

        if (run == null)
            return BadRequest(ApiResponse<object>.Fail($"No locked payroll run found for {month}/{year}."));

        var details = await _ctx.PayrollDetails
            .Include(d => d.Employee)
            .Where(d => d.PayrollRunId == run.PayrollRunId && d.PFEmployee > 0)
            .Select(d => new {
                uan = d.Employee.UANNumber ?? "N/A",
                empName = d.Employee.FirstName + " " + d.Employee.LastName,
                grossWages = d.GrossEarnings,
                epfWages = d.PFEmployee / 0.12m, // back-compute base
                epfContribution = d.PFEmployee,
                eps = d.PFEmployer * 0.6944m, // approx EPS share
                epfDiff = d.PFEmployer * 0.3056m,
                ncp = d.LWPDays
            }).ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(new {
            month, year, generatedAt = DateTime.UtcNow,
            totalMembers = details.Count,
            totalEPFContribution = details.Sum(d => d.epfContribution),
            records = details
        }, "PF ECR data generated."));
    }

    // ─── GET /api/v1/statutory/esi-return ─────────────────────────────────────
    [HttpGet("esi-return")]
    public async Task<ActionResult<ApiResponse<object>>> GetESIReturn([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        if (!IsAdmin) return StatusCode(403, ApiResponse<object>.Fail("Admin access required."));
        var companyId = _currentUser.CompanyId ?? Guid.Empty;

        var run = await _ctx.PayrollRuns
            .FirstOrDefaultAsync(r => r.CompanyId == companyId && r.Month == month && r.Year == year &&
                r.RunType == PayrollRunType.Regular, ct);

        if (run == null) return BadRequest(ApiResponse<object>.Fail("No payroll run found for that period."));

        var details = await _ctx.PayrollDetails
            .Include(d => d.Employee)
            .Where(d => d.PayrollRunId == run.PayrollRunId && d.ESIEmployee > 0)
            .Select(d => new {
                esicInsuranceNo = d.Employee.ESINumber ?? "N/A",
                empName = d.Employee.FirstName + " " + d.Employee.LastName,
                grossSalary = d.GrossEarnings,
                esiEmployee = d.ESIEmployee,
                esiEmployer = d.ESIEmployer,
                totalESI = d.ESIEmployee + d.ESIEmployer
            }).ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(new {
            month, year, generatedAt = DateTime.UtcNow,
            totalESIMembers = details.Count,
            totalESIContribution = details.Sum(d => d.totalESI),
            records = details
        }, "ESI return data generated."));
    }

    // ─── GET /api/v1/statutory/compliance-calendar ────────────────────────────
    [HttpGet("compliance-calendar")]
    public async Task<ActionResult<ApiResponse<object>>> GetComplianceCalendar(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var currentMonth = now.Month;
        var currentYear = now.Year;

        var calendar = new[]
        {
            new { filing = "PF ECR", dueDate = new DateTime(currentYear, currentMonth == 12 ? 1 : currentMonth + 1, 15), frequency = "Monthly", status = "Pending" },
            new { filing = "ESI Monthly Return", dueDate = new DateTime(currentYear, currentMonth == 12 ? 1 : currentMonth + 1, 15), frequency = "Monthly", status = "Pending" },
            new { filing = "TDS Deposit (Salary)", dueDate = new DateTime(currentYear, currentMonth == 12 ? 1 : currentMonth + 1, 7), frequency = "Monthly", status = "Pending" },
            new { filing = "Professional Tax", dueDate = new DateTime(currentYear, currentMonth == 12 ? 1 : currentMonth + 1, 15), frequency = "Monthly", status = "Pending" },
            new { filing = "Form 24Q (Q1)", dueDate = new DateTime(currentYear, 7, 31), frequency = "Quarterly", status = now > new DateTime(currentYear, 7, 31) ? "Overdue" : "Upcoming" },
            new { filing = "Form 24Q (Q2)", dueDate = new DateTime(currentYear, 10, 31), frequency = "Quarterly", status = now > new DateTime(currentYear, 10, 31) ? "Overdue" : "Upcoming" },
            new { filing = "Form 24Q (Q3)", dueDate = new DateTime(currentYear + 1, 1, 31), frequency = "Quarterly", status = "Upcoming" },
            new { filing = "Form 24Q (Q4)", dueDate = new DateTime(currentYear + 1, 5, 31), frequency = "Quarterly", status = "Upcoming" },
            new { filing = "Form 16 (Annual)", dueDate = new DateTime(currentYear + 1, 6, 15), frequency = "Annual", status = "Upcoming" },
        };

        var result = calendar.Select(c => new {
            c.filing, c.dueDate, c.frequency, c.status,
            daysRemaining = (c.dueDate - now).Days,
            alertLevel = (c.dueDate - now).Days <= 5 ? "Critical" : (c.dueDate - now).Days <= 15 ? "Warning" : "Normal"
        });

        return Ok(ApiResponse<object>.Ok(result, "Compliance calendar fetched."));
    }
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────
public record StatutoryConfigRequest(
    bool PFApplicable, bool PFHigherBasis, decimal PFWageCeiling,
    bool ESIApplicable, decimal ESIGrossLimit,
    bool PTApplicable, bool LWFApplicable,
    decimal LWFEmployeeAmount, decimal LWFEmployerAmount,
    string? LopDivisor, string? WorkState
);
public record PTSlabRequest(decimal FromAmount, decimal? ToAmount, decimal MonthlyPTAmount, decimal? FebruaryOverride);
