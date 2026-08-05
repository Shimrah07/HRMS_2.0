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
/// TICKET-11: Statutory Ceiling Configuration (Super Admin)
/// Runtime management of Indian statutory compliance ceilings (EPF, ESIC, Bonus, Gratuity, LWF).
/// </summary>
[ApiController]
[Route("api/v1/admin/statutory-settings")]
[Authorize]
public class StatutorySettingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    private static StatutorySettingsConfig _currentSettings = new()
    {
        EpfWageCeiling = 15000m,
        EpfRatePercentage = 12.0m,
        EsicWageCeiling = 21000m,
        EsicEmployeeRatePercentage = 0.75m,
        EsicEmployerRatePercentage = 3.25m,
        BonusWageCeiling = 21000m,
        GratuityMaxLimit = 2000000m,
        LwfMonthlyCeiling = 25.0m,
        LastUpdatedBy = "System Default",
        LastUpdatedAt = DateTime.UtcNow
    };

    private static readonly List<StatutoryAuditRecord> _auditLog = new();
    private static readonly object _lock = new();

    public StatutorySettingsController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    private bool IsSuperAdmin =>
        _currentUser.HasRole(RoleCodes.SuperAdmin) || _currentUser.HasRole(RoleCodes.HRAdmin);

    /// <summary>
    /// GET /api/v1/admin/statutory-settings
    /// Retrieves current statutory ceiling configurations.
    /// </summary>
    [HttpGet]
    public ActionResult<ApiResponse<object>> GetStatutorySettings()
    {
        if (!IsSuperAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Access restricted to SuperAdmin role."));

        lock (_lock)
        {
            return Ok(ApiResponse<object>.Ok(new
            {
                settings = _currentSettings,
                auditTrail = _auditLog.OrderByDescending(a => a.Timestamp).Take(20).ToList()
            }));
        }
    }

    /// <summary>
    /// PUT /api/v1/admin/statutory-settings
    /// Updates statutory ceiling configurations with audit logging.
    /// </summary>
    [HttpPut]
    public ActionResult<ApiResponse<object>> UpdateStatutorySettings([FromBody] StatutorySettingsUpdateRequest req)
    {
        if (!IsSuperAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only SuperAdmin can modify statutory ceiling configurations."));

        if (req.EpfWageCeiling <= 0 || req.EsicWageCeiling <= 0 || req.BonusWageCeiling <= 0 || req.GratuityMaxLimit <= 0)
        {
            return BadRequest(ApiResponse<object>.Fail("Ceiling values must be positive non-zero numbers."));
        }

        lock (_lock)
        {
            var oldSettings = _currentSettings;

            _currentSettings = new StatutorySettingsConfig
            {
                EpfWageCeiling = req.EpfWageCeiling,
                EpfRatePercentage = req.EpfRatePercentage > 0 ? req.EpfRatePercentage : oldSettings.EpfRatePercentage,
                EsicWageCeiling = req.EsicWageCeiling,
                EsicEmployeeRatePercentage = req.EsicEmployeeRatePercentage > 0 ? req.EsicEmployeeRatePercentage : oldSettings.EsicEmployeeRatePercentage,
                EsicEmployerRatePercentage = req.EsicEmployerRatePercentage > 0 ? req.EsicEmployerRatePercentage : oldSettings.EsicEmployerRatePercentage,
                BonusWageCeiling = req.BonusWageCeiling,
                GratuityMaxLimit = req.GratuityMaxLimit,
                LwfMonthlyCeiling = req.LwfMonthlyCeiling > 0 ? req.LwfMonthlyCeiling : oldSettings.LwfMonthlyCeiling,
                LastUpdatedBy = _currentUser.Email ?? _currentUser.UserId.ToString() ?? "SuperAdmin",
                LastUpdatedAt = DateTime.UtcNow
            };

            _auditLog.Add(new StatutoryAuditRecord
            {
                AuditId = Guid.NewGuid(),
                UpdatedBy = _currentSettings.LastUpdatedBy,
                Timestamp = _currentSettings.LastUpdatedAt,
                ChangesDescription = $"Updated EPF Ceiling to ₹{req.EpfWageCeiling:N0}, ESIC Ceiling to ₹{req.EsicWageCeiling:N0}, Bonus Ceiling to ₹{req.BonusWageCeiling:N0}, Gratuity Max to ₹{req.GratuityMaxLimit:N0}"
            });

            return Ok(ApiResponse<object>.Ok(_currentSettings, "Statutory ceiling configurations updated successfully."));
        }
    }
}

public class StatutorySettingsConfig
{
    public decimal EpfWageCeiling { get; set; }
    public decimal EpfRatePercentage { get; set; }
    public decimal EsicWageCeiling { get; set; }
    public decimal EsicEmployeeRatePercentage { get; set; }
    public decimal EsicEmployerRatePercentage { get; set; }
    public decimal BonusWageCeiling { get; set; }
    public decimal GratuityMaxLimit { get; set; }
    public decimal LwfMonthlyCeiling { get; set; }
    public string LastUpdatedBy { get; set; } = string.Empty;
    public DateTime LastUpdatedAt { get; set; }
}

public class StatutorySettingsUpdateRequest
{
    public decimal EpfWageCeiling { get; set; }
    public decimal EpfRatePercentage { get; set; }
    public decimal EsicWageCeiling { get; set; }
    public decimal EsicEmployeeRatePercentage { get; set; }
    public decimal EsicEmployerRatePercentage { get; set; }
    public decimal BonusWageCeiling { get; set; }
    public decimal GratuityMaxLimit { get; set; }
    public decimal LwfMonthlyCeiling { get; set; }
}

public class StatutoryAuditRecord
{
    public Guid AuditId { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string ChangesDescription { get; set; } = string.Empty;
}
