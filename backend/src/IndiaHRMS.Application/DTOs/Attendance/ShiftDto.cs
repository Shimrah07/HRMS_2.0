namespace IndiaHRMS.Application.DTOs.Attendance;

public class ShiftMasterDto
{
    public Guid ShiftId { get; set; }
    public Guid CompanyId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public string ShiftCode { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int GracePeriodMins { get; set; }
    public decimal HalfDayThresholdHrs { get; set; }
    public bool IsNightShift { get; set; }
    public string WeeklyOffDays { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateShiftRequest
{
    public string ShiftName { get; set; } = string.Empty;
    public string ShiftCode { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int GracePeriodMins { get; set; }
    public decimal HalfDayThresholdHrs { get; set; }
    public bool IsNightShift { get; set; }
    public string WeeklyOffDays { get; set; } = string.Empty;
}

public class UpdateShiftRequest : CreateShiftRequest
{
}
