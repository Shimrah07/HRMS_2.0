using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class LeavePolicyService : ILeavePolicyService
{
    private readonly AppDbContext _context;
    private readonly ILogger<LeavePolicyService> _logger;

    public LeavePolicyService(AppDbContext context, ILogger<LeavePolicyService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<LeaveTypeDto>> GetLeaveTypesAsync(Guid companyId)
    {
        var types = await _context.LeaveTypes
            .Include(x => x.PolicyRules)
            .ThenInclude(r => r.Department)
            .Include(x => x.PolicyRules)
            .ThenInclude(r => r.Location)
            .Where(x => x.CompanyId == companyId && x.IsActive)
            .OrderBy(x => x.LeaveCode)
            .ToListAsync();

        if (!types.Any())
        {
            await SeedDefaultLeaveTypesAsync(companyId);
            types = await _context.LeaveTypes
                .Include(x => x.PolicyRules)
                .Where(x => x.CompanyId == companyId && x.IsActive)
                .OrderBy(x => x.LeaveCode)
                .ToListAsync();
        }

        return types.Select(MapToDto);
    }

    public async Task<LeaveTypeDto?> GetLeaveTypeByIdAsync(Guid leaveTypeId)
    {
        var type = await _context.LeaveTypes
            .Include(x => x.PolicyRules)
            .ThenInclude(r => r.Department)
            .Include(x => x.PolicyRules)
            .ThenInclude(r => r.Location)
            .FirstOrDefaultAsync(x => x.LeaveTypeId == leaveTypeId && x.IsActive);

        return type == null ? null : MapToDto(type);
    }

    public async Task<LeaveTypeDto> CreateLeaveTypeAsync(CreateLeaveTypeDto dto)
    {
        var leaveType = new LeaveType
        {
            CompanyId = dto.CompanyId,
            LeaveTypeName = dto.LeaveTypeName,
            LeaveCode = dto.LeaveCode.ToUpper(),
            MaxDaysPerYear = dto.MaxDaysPerYear,
            MaxDaysPerApplication = dto.MaxDaysPerApplication,
            AccrualFrequency = dto.AccrualFrequency,
            AccrualRate = dto.AccrualRate,
            IsCarryForward = dto.IsCarryForward,
            MaxCarryForwardDays = dto.MaxCarryForwardDays,
            IsEncashable = dto.IsEncashable,
            EncashmentRule = dto.EncashmentRule,
            IsPaidLeave = dto.IsPaidLeave,
            ApplicableGender = dto.ApplicableGender,
            MinServiceDaysRequired = dto.MinServiceDaysRequired,
            MinNoticeDays = dto.MinNoticeDays,
            SandwichRuleApplicable = dto.SandwichRuleApplicable,
            ProRataForMidYear = dto.ProRataForMidYear,
            ClubbingRestrictedWith = dto.ClubbingRestrictedWith,
            IsActive = true
        };

        _context.LeaveTypes.Add(leaveType);
        await _context.SaveChangesAsync();
        return MapToDto(leaveType);
    }

    public async Task<LeaveTypeDto> UpdateLeaveTypeAsync(Guid leaveTypeId, CreateLeaveTypeDto dto)
    {
        var leaveType = await _context.LeaveTypes
            .FirstOrDefaultAsync(x => x.LeaveTypeId == leaveTypeId);

        if (leaveType == null)
            throw new KeyNotFoundException($"LeaveType with ID {leaveTypeId} not found.");

        leaveType.LeaveTypeName = dto.LeaveTypeName;
        leaveType.LeaveCode = dto.LeaveCode.ToUpper();
        leaveType.MaxDaysPerYear = dto.MaxDaysPerYear;
        leaveType.MaxDaysPerApplication = dto.MaxDaysPerApplication;
        leaveType.AccrualFrequency = dto.AccrualFrequency;
        leaveType.AccrualRate = dto.AccrualRate;
        leaveType.IsCarryForward = dto.IsCarryForward;
        leaveType.MaxCarryForwardDays = dto.MaxCarryForwardDays;
        leaveType.IsEncashable = dto.IsEncashable;
        leaveType.EncashmentRule = dto.EncashmentRule;
        leaveType.IsPaidLeave = dto.IsPaidLeave;
        leaveType.ApplicableGender = dto.ApplicableGender;
        leaveType.MinServiceDaysRequired = dto.MinServiceDaysRequired;
        leaveType.MinNoticeDays = dto.MinNoticeDays;
        leaveType.SandwichRuleApplicable = dto.SandwichRuleApplicable;
        leaveType.ProRataForMidYear = dto.ProRataForMidYear;
        leaveType.ClubbingRestrictedWith = dto.ClubbingRestrictedWith;
        leaveType.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(leaveType);
    }

    public async Task<bool> DeleteLeaveTypeAsync(Guid leaveTypeId)
    {
        var leaveType = await _context.LeaveTypes.FindAsync(leaveTypeId);
        if (leaveType == null) return false;

        leaveType.IsActive = false;
        leaveType.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<LeavePolicyRuleDto>> GetPolicyRulesAsync(Guid leaveTypeId)
    {
        var rules = await _context.LeavePolicyRules
            .Include(x => x.Department)
            .Include(x => x.Location)
            .Where(x => x.LeaveTypeId == leaveTypeId && x.IsActive)
            .ToListAsync();

        return rules.Select(MapRuleToDto);
    }

    public async Task<LeavePolicyRuleDto> CreatePolicyRuleAsync(CreateLeavePolicyRuleDto dto)
    {
        var rule = new LeavePolicyRule
        {
            LeaveTypeId = dto.LeaveTypeId,
            GradeCode = dto.GradeCode,
            DepartmentId = dto.DepartmentId,
            LocationId = dto.LocationId,
            QuotaOverride = dto.QuotaOverride,
            MinNoticeDays = dto.MinNoticeDays,
            MaxConsecutiveDays = dto.MaxConsecutiveDays,
            SandwichRule = dto.SandwichRule,
            IsActive = true
        };

        _context.LeavePolicyRules.Add(rule);
        await _context.SaveChangesAsync();

        return MapRuleToDto(rule);
    }

    public async Task<bool> DeletePolicyRuleAsync(Guid ruleId)
    {
        var rule = await _context.LeavePolicyRules.FindAsync(ruleId);
        if (rule == null) return false;

        rule.IsActive = false;
        rule.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task SeedDefaultLeaveTypesAsync(Guid companyId)
    {
        var defaults = new List<LeaveType>
        {
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Earned Leave / Privilege Leave", LeaveCode = "EL", MaxDaysPerYear = 18, MaxDaysPerApplication = 15, AccrualFrequency = "Monthly", AccrualRate = 1.5m, IsCarryForward = true, MaxCarryForwardDays = 45, IsEncashable = true, EncashmentRule = "YearEnd", IsPaidLeave = true, ApplicableGender = "All", MinNoticeDays = 3, SandwichRuleApplicable = true, ProRataForMidYear = true },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Casual Leave", LeaveCode = "CL", MaxDaysPerYear = 10, MaxDaysPerApplication = 3, AccrualFrequency = "Yearly", AccrualRate = 10m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, EncashmentRule = "None", IsPaidLeave = true, ApplicableGender = "All", MinNoticeDays = 1, SandwichRuleApplicable = false, ProRataForMidYear = true },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Sick Leave / Medical Leave", LeaveCode = "SL", MaxDaysPerYear = 8, MaxDaysPerApplication = 5, AccrualFrequency = "Yearly", AccrualRate = 8m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, EncashmentRule = "None", IsPaidLeave = true, ApplicableGender = "All", MinNoticeDays = 0, SandwichRuleApplicable = false, ProRataForMidYear = true },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Maternity Leave", LeaveCode = "ML", MaxDaysPerYear = 182, MaxDaysPerApplication = 182, AccrualFrequency = "Event", AccrualRate = 182m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, EncashmentRule = "None", IsPaidLeave = true, ApplicableGender = "Female", MinNoticeDays = 30, SandwichRuleApplicable = false, ProRataForMidYear = false },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Paternity Leave", LeaveCode = "PTL", MaxDaysPerYear = 10, MaxDaysPerApplication = 10, AccrualFrequency = "Event", AccrualRate = 10m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, EncashmentRule = "None", IsPaidLeave = true, ApplicableGender = "Male", MinNoticeDays = 7, SandwichRuleApplicable = false, ProRataForMidYear = false },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Bereavement Leave", LeaveCode = "BL", MaxDaysPerYear = 5, MaxDaysPerApplication = 5, AccrualFrequency = "Event", AccrualRate = 5m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, EncashmentRule = "None", IsPaidLeave = true, ApplicableGender = "All", MinNoticeDays = 0, SandwichRuleApplicable = false, ProRataForMidYear = false },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Marriage Leave", LeaveCode = "MRL", MaxDaysPerYear = 5, MaxDaysPerApplication = 5, AccrualFrequency = "Event", AccrualRate = 5m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, EncashmentRule = "None", IsPaidLeave = true, ApplicableGender = "All", MinNoticeDays = 15, SandwichRuleApplicable = false, ProRataForMidYear = false },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Compensatory Off", LeaveCode = "CO", MaxDaysPerYear = 12, MaxDaysPerApplication = 2, AccrualFrequency = "Event", AccrualRate = 1m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = true, EncashmentRule = "YearEnd", IsPaidLeave = true, ApplicableGender = "All", MinNoticeDays = 1, SandwichRuleApplicable = false, ProRataForMidYear = false },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Loss of Pay", LeaveCode = "LOP", MaxDaysPerYear = 365, MaxDaysPerApplication = 90, AccrualFrequency = "Event", AccrualRate = 0m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, EncashmentRule = "None", IsPaidLeave = false, ApplicableGender = "All", MinNoticeDays = 0, SandwichRuleApplicable = false, ProRataForMidYear = false },
            new LeaveType { CompanyId = companyId, LeaveTypeName = "Optional Holiday", LeaveCode = "OH", MaxDaysPerYear = 3, MaxDaysPerApplication = 1, AccrualFrequency = "Yearly", AccrualRate = 3m, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, EncashmentRule = "None", IsPaidLeave = true, ApplicableGender = "All", MinNoticeDays = 2, SandwichRuleApplicable = false, ProRataForMidYear = false }
        };

        _context.LeaveTypes.AddRange(defaults);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Seeded 10 default leave types for Company {CompanyId}", companyId);
    }

    private static LeaveTypeDto MapToDto(LeaveType x) => new()
    {
        LeaveTypeId = x.LeaveTypeId,
        CompanyId = x.CompanyId,
        LeaveTypeName = x.LeaveTypeName,
        LeaveCode = x.LeaveCode,
        MaxDaysPerYear = x.MaxDaysPerYear,
        MaxDaysPerApplication = x.MaxDaysPerApplication,
        AccrualFrequency = x.AccrualFrequency,
        AccrualRate = x.AccrualRate,
        IsCarryForward = x.IsCarryForward,
        MaxCarryForwardDays = x.MaxCarryForwardDays,
        IsEncashable = x.IsEncashable,
        EncashmentRule = x.EncashmentRule,
        IsPaidLeave = x.IsPaidLeave,
        ApplicableGender = x.ApplicableGender,
        MinServiceDaysRequired = x.MinServiceDaysRequired,
        MinNoticeDays = x.MinNoticeDays,
        SandwichRuleApplicable = x.SandwichRuleApplicable,
        ProRataForMidYear = x.ProRataForMidYear,
        ClubbingRestrictedWith = x.ClubbingRestrictedWith,
        IsActive = x.IsActive,
        PolicyRules = x.PolicyRules?.Select(MapRuleToDto).ToList() ?? new()
    };

    private static LeavePolicyRuleDto MapRuleToDto(LeavePolicyRule r) => new()
    {
        PolicyRuleId = r.PolicyRuleId,
        LeaveTypeId = r.LeaveTypeId,
        GradeCode = r.GradeCode,
        DepartmentId = r.DepartmentId,
        DepartmentName = r.Department?.DeptName,
        LocationId = r.LocationId,
        LocationName = r.Location?.LocationName,
        QuotaOverride = r.QuotaOverride,
        MinNoticeDays = r.MinNoticeDays,
        MaxConsecutiveDays = r.MaxConsecutiveDays,
        SandwichRule = r.SandwichRule,
        IsActive = r.IsActive
    };
}
