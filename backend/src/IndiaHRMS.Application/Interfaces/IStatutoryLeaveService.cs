using IndiaHRMS.Application.DTOs.Leave;

namespace IndiaHRMS.Application.Interfaces;

public interface IStatutoryLeaveService
{
    Task<StatutoryLeaveEventDto> ApplyMaternityLeaveAsync(ApplyMaternityLeaveDto dto);
    Task<StatutoryLeaveEventDto> ApplyPaternityLeaveAsync(ApplyPaternityLeaveDto dto);
    Task<IEnumerable<StatutoryLeaveEventDto>> GetEmployeeStatutoryEventsAsync(Guid employeeId);
}

public class ApplyMaternityLeaveDto
{
    public Guid EmployeeId { get; set; }
    public string Category { get; set; } = "Biological"; // Biological, Adoption, Commissioning
    public int ChildOrder { get; set; } = 1; // 1st, 2nd, 3rd child
    public DateOnly ExpectedDeliveryDate { get; set; }
    public DateOnly FromDate { get; set; }
    public string? MedicalCertPath { get; set; }
    public string? Remarks { get; set; }
}

public class ApplyPaternityLeaveDto
{
    public Guid EmployeeId { get; set; }
    public int ChildOrder { get; set; } = 1;
    public DateOnly ChildBirthDate { get; set; }
    public DateOnly FromDate { get; set; }
    public string? BirthCertificatePath { get; set; }
    public string? Remarks { get; set; }
}
