using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class SectorLeaveService : ISectorLeaveService
{
    private readonly AppDbContext _context;
    private readonly ILogger<SectorLeaveService> _logger;

    public SectorLeaveService(AppDbContext context, ILogger<SectorLeaveService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<SectorLeaveConfigDto>> GetSectorConfigsAsync(Guid companyId)
    {
        var configs = await _context.SectorLeaveConfigs
            .Where(s => s.CompanyId == companyId && s.IsActive)
            .ToListAsync();

        if (!configs.Any())
        {
            // Seed default sector configurations if empty
            await SeedDefaultSectorConfigsAsync(companyId);
            configs = await _context.SectorLeaveConfigs
                .Where(s => s.CompanyId == companyId && s.IsActive)
                .ToListAsync();
        }

        return configs.Select(s => new SectorLeaveConfigDto
        {
            SectorConfigId = s.SectorConfigId,
            CompanyId = s.CompanyId,
            IndustryType = s.IndustryType,
            RuleKey = s.RuleKey,
            RuleValue = s.RuleValue,
            IsActive = s.IsActive
        });
    }

    public async Task<SectorLeaveConfigDto> SaveSectorConfigAsync(SectorLeaveConfigDto dto)
    {
        var config = await _context.SectorLeaveConfigs.FirstOrDefaultAsync(s => s.SectorConfigId == dto.SectorConfigId);
        if (config == null)
        {
            config = new SectorLeaveConfig
            {
                CompanyId = dto.CompanyId,
                IndustryType = dto.IndustryType,
                RuleKey = dto.RuleKey,
                RuleValue = dto.RuleValue,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.SectorLeaveConfigs.Add(config);
        }
        else
        {
            config.IndustryType = dto.IndustryType;
            config.RuleKey = dto.RuleKey;
            config.RuleValue = dto.RuleValue;
            config.IsActive = dto.IsActive;
            config.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new SectorLeaveConfigDto
        {
            SectorConfigId = config.SectorConfigId,
            CompanyId = config.CompanyId,
            IndustryType = config.IndustryType,
            RuleKey = config.RuleKey,
            RuleValue = config.RuleValue,
            IsActive = config.IsActive
        };
    }

    public async Task<FactoriesActAccrualResultDto> CalculateFactoriesActAccrualAsync(Guid employeeId, int daysWorkedInYear)
    {
        var employee = await _context.Employees.FindAsync(employeeId);
        if (employee == null)
            throw new KeyNotFoundException("Employee not found.");

        // Factories Act 1948 Section 79 Rules:
        // 1. Employee must have worked for at least 240 days in the calendar year to qualify.
        // 2. Adult Workers: 1 day of leave for every 20 days worked.
        bool meetsEligibility = daysWorkedInYear >= 240;
        decimal accruedLeave = meetsEligibility ? Math.Floor(daysWorkedInYear / 20.0m) : 0m;

        string ruleDesc = meetsEligibility
            ? $"Eligible under Factories Act 1948 Sec 79 ({daysWorkedInYear} days worked >= 240 day cap). Accrued {accruedLeave} Earned Leave days (1 per 20 worked)."
            : $"Ineligible under Factories Act 1948 Sec 79 ({daysWorkedInYear} days worked is below 240 day minimum threshold).";

        return new FactoriesActAccrualResultDto
        {
            EmployeeId = employeeId,
            EmployeeName = $"{employee.FirstName} {employee.LastName}",
            DaysWorkedInYear = daysWorkedInYear,
            Meets240DaysEligibility = meetsEligibility,
            EarnedLeaveAccrued = accruedLeave,
            RuleDescription = ruleDesc
        };
    }

    public async Task<BlackoutCheckResultDto> CheckBlackoutWindowAsync(Guid companyId, DateOnly fromDate, DateOnly toDate)
    {
        // Check active Retail/IT Blackout Period rules in SectorLeaveConfig
        var blackoutConfigs = await _context.SectorLeaveConfigs
            .Where(s => s.CompanyId == companyId && s.IsActive && s.RuleKey.StartsWith("Blackout_"))
            .ToListAsync();

        foreach (var cfg in blackoutConfigs)
        {
            // RuleValue format: YYYY-MM-DD|YYYY-MM-DD|Reason
            var parts = cfg.RuleValue.Split('|');
            if (parts.Length >= 3 && DateOnly.TryParse(parts[0], out var bFrom) && DateOnly.TryParse(parts[1], out var bTo))
            {
                if (fromDate <= bTo && toDate >= bFrom)
                {
                    return new BlackoutCheckResultDto
                    {
                        IsBlackoutConflict = true,
                        BlackoutReason = parts[2],
                        AffectedPeriod = $"{bFrom:dd MMM YYYY} to {bTo:dd MMM YYYY}",
                        CanOverride = cfg.RuleKey.EndsWith("_OverrideAllowed")
                    };
                }
            }
        }

        return new BlackoutCheckResultDto { IsBlackoutConflict = false };
    }

    private async Task SeedDefaultSectorConfigsAsync(Guid companyId)
    {
        var defaults = new List<SectorLeaveConfig>
        {
            new() { CompanyId = companyId, IndustryType = "Manufacturing", RuleKey = "FactoriesAct_240DayRule", RuleValue = "Enabled|1_per_20_days", IsActive = true },
            new() { CompanyId = companyId, IndustryType = "IT", RuleKey = "Flexi_WorkFromHomeOverlay", RuleValue = "Max_4_WFH_per_month", IsActive = true },
            new() { CompanyId = companyId, IndustryType = "Retail", RuleKey = "Blackout_DiwaliSeason", RuleValue = "2026-11-01|2026-11-15|Peak Festive Season Blackout", IsActive = true },
            new() { CompanyId = companyId, IndustryType = "Retail", RuleKey = "Blackout_YearEndAudit_OverrideAllowed", RuleValue = "2026-12-24|2026-12-31|Year-End Inventory Audit", IsActive = true }
        };

        _context.SectorLeaveConfigs.AddRange(defaults);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Seeded default sector-specific rules for company {Id}", companyId);
    }
}
