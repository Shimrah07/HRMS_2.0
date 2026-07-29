using IndiaHRMS.Application.DTOs.Leave;

namespace IndiaHRMS.Application.Interfaces;

public interface ISectorLeaveService
{
    Task<IEnumerable<SectorLeaveConfigDto>> GetSectorConfigsAsync(Guid companyId);
    Task<SectorLeaveConfigDto> SaveSectorConfigAsync(SectorLeaveConfigDto dto);
    Task<FactoriesActAccrualResultDto> CalculateFactoriesActAccrualAsync(Guid employeeId, int daysWorkedInYear);
    Task<BlackoutCheckResultDto> CheckBlackoutWindowAsync(Guid companyId, DateOnly fromDate, DateOnly toDate);
}

public class FactoriesActAccrualResultDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int DaysWorkedInYear { get; set; }
    public bool Meets240DaysEligibility { get; set; }
    public decimal EarnedLeaveAccrued { get; set; } // 1 day per 20 worked
    public string RuleDescription { get; set; } = string.Empty;
}

public class BlackoutCheckResultDto
{
    public bool IsBlackoutConflict { get; set; }
    public string? BlackoutReason { get; set; }
    public string? AffectedPeriod { get; set; }
    public bool CanOverride { get; set; } = false;
}
