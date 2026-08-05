using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
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
/// TICKET-14: Super Admin Permission Bypass & Multi-Tenant Company Switching
/// Enables SuperAdmin to view and manage company-specific data across all tenants.
/// </summary>
[ApiController]
[Route("api/v1/admin/company-switch")]
[Authorize]
public class CompanySwitchController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    private static readonly Dictionary<Guid, Guid> _activeSuperAdminContexts = new();
    private static readonly object _lock = new();

    public CompanySwitchController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    private bool IsSuperAdmin =>
        _currentUser.HasRole(RoleCodes.SuperAdmin);

    /// <summary>
    /// GET /api/v1/admin/company-switch/companies
    /// Lists all registered companies in the enterprise for SuperAdmin company-switching UI selector.
    /// </summary>
    [HttpGet("companies")]
    public async Task<ActionResult<ApiResponse<object>>> ListCompanies(CancellationToken ct)
    {
        if (!IsSuperAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Access restricted to SuperAdmin role only."));

        var dbCompanies = await _context.Companies.ToListAsync(ct);
        var empList = await _context.Employees.ToListAsync(ct);
        var empCounts = empList
            .Where(e => e.CompanyId != Guid.Empty)
            .GroupBy(e => e.CompanyId)
            .ToDictionary(g => g.Key, g => g.Count());

        var companies = dbCompanies.Select(c => new
        {
            companyId = c.CompanyId,
            companyName = c.CompanyName,
            cin = c.CIN,
            gstin = c.GSTIN,
            city = c.City,
            state = c.State,
            isActive = c.IsActive,
            employeeCount = empCounts.TryGetValue(c.CompanyId, out var count) ? count : 0
        }).ToList();

        Guid? activeCompanyId = null;
        if (_currentUser.UserId.HasValue)
        {
            lock (_lock)
            {
                if (_activeSuperAdminContexts.TryGetValue(_currentUser.UserId.Value, out var compId))
                {
                    activeCompanyId = compId;
                }
            }
        }

        return Ok(ApiResponse<object>.Ok(new
        {
            activeCompanyId = activeCompanyId ?? _currentUser.CompanyId,
            totalCompanies = companies.Count,
            companies
        }));
    }

    /// <summary>
    /// POST /api/v1/admin/company-switch/switch/{targetCompanyId}
    /// Switches SuperAdmin active operational company context to target company ID.
    /// </summary>
    [HttpPost("switch/{targetCompanyId}")]
    public async Task<ActionResult<ApiResponse<object>>> SwitchCompanyContext(Guid targetCompanyId, CancellationToken ct)
    {
        if (!IsSuperAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Access restricted to SuperAdmin role only."));

        var company = await _context.Companies.FirstOrDefaultAsync(c => c.CompanyId == targetCompanyId, ct);
        if (company == null)
            return NotFound(ApiResponse<object>.Fail("Target company not found."));

        if (_currentUser.UserId.HasValue)
        {
            lock (_lock)
            {
                _activeSuperAdminContexts[_currentUser.UserId.Value] = targetCompanyId;
            }
        }

        return Ok(ApiResponse<object>.Ok(new
        {
            superAdminUserId = _currentUser.UserId,
            switchedToCompanyId = company.CompanyId,
            switchedToCompanyName = company.CompanyName,
            switchedAt = DateTime.UtcNow
        }, $"SuperAdmin context successfully switched to tenant: {company.CompanyName}."));
    }
}
