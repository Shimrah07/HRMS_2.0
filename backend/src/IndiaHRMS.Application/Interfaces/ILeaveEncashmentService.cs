using IndiaHRMS.Application.DTOs.Leave;

namespace IndiaHRMS.Application.Interfaces;

public interface ILeaveEncashmentService
{
    Task<LeaveEncashmentDto> ProcessLeaveEncashmentAsync(ProcessEncashmentRequestDto dto);
    Task<YearEndCarryForwardResultDto> RunYearEndCarryForwardAsync(Guid companyId, int fromYear);
    Task<IEnumerable<LeaveEncashmentDto>> GetEmployeeEncashmentsAsync(Guid employeeId);
}

public class ProcessEncashmentRequestDto
{
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public decimal DaysToEncash { get; set; }
    public string EncashmentType { get; set; } = "YearEnd"; // YearEnd, ExitSettlement
    public decimal BasicSalary { get; set; }
    public decimal DearnessAllowance { get; set; }
    public bool IsGovernmentEmployee { get; set; } = false;
}

public class YearEndCarryForwardResultDto
{
    public int FromYear { get; set; }
    public int ToYear { get; set; }
    public int EmployeesProcessed { get; set; }
    public decimal TotalDaysCarriedForward { get; set; }
    public decimal TotalDaysLapsed { get; set; }
}
