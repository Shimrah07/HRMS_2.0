using IndiaHRMS.Shared;

namespace IndiaHRMS.Application.DTOs.Organization;

// ─── Company ──────────────────────────────────────────────────────────────────

public class CompanyDto
{
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CIN { get; set; }
    public string? PAN { get; set; }
    public string? TAN { get; set; }
    public string? GSTIN { get; set; }
    public string? RegisteredAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string? Logo { get; set; }
    public string? Website { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public DateTime? IncorporationDate { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateCompanyRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string? CIN { get; set; }
    public string? PAN { get; set; }
    public string? TAN { get; set; }
    public string? GSTIN { get; set; }
    public string? RegisteredAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string? Website { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public DateTime? IncorporationDate { get; set; }
}

// ─── Department ───────────────────────────────────────────────────────────────

public class DepartmentDto
{
    public Guid DeptId { get; set; }
    public Guid CompanyId { get; set; }
    public string DeptName { get; set; } = string.Empty;
    public string DeptCode { get; set; } = string.Empty;
    public Guid? ParentDeptId { get; set; }
    public string? ParentDeptName { get; set; }
    public Guid? HODEmployeeId { get; set; }
    public string? HODName { get; set; }
    public bool IsActive { get; set; }
    public int EmployeeCount { get; set; }
    public List<DepartmentDto> Children { get; set; } = new();
}

public class CreateDepartmentRequest
{
    public string DeptName { get; set; } = string.Empty;
    public string DeptCode { get; set; } = string.Empty;
    public Guid? ParentDeptId { get; set; }
    public Guid? HODEmployeeId { get; set; }
}

public class UpdateDepartmentRequest : CreateDepartmentRequest { }

// ─── Designation ─────────────────────────────────────────────────────────────

public class DesignationDto
{
    public Guid DesignationId { get; set; }
    public Guid CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Grade { get; set; }
    public int? Level { get; set; }
    public decimal MinBasic { get; set; }
    public decimal MaxBasic { get; set; }
    public bool IsActive { get; set; }
    public int EmployeeCount { get; set; }
}

public class CreateDesignationRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Grade { get; set; }
    public int? Level { get; set; }
    public decimal MinBasic { get; set; }
    public decimal MaxBasic { get; set; }
}

public class UpdateDesignationRequest : CreateDesignationRequest { }

// ─── Location ─────────────────────────────────────────────────────────────────

public class LocationDto
{
    public Guid LocationId { get; set; }
    public Guid CompanyId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public bool IsHeadOffice { get; set; }
    public bool IsActive { get; set; }
    public int EmployeeCount { get; set; }
}

public class CreateLocationRequest
{
    public string LocationName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public bool IsHeadOffice { get; set; }
}

public class UpdateLocationRequest : CreateLocationRequest { }

// ─── Cost Center ──────────────────────────────────────────────────────────────

public class CostCenterDto
{
    public Guid CostCenterId { get; set; }
    public Guid CompanyId { get; set; }
    public string CostCenterName { get; set; } = string.Empty;
    public string CostCenterCode { get; set; } = string.Empty;
    public Guid? ManagerEmployeeId { get; set; }
    public string? ManagerName { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCostCenterRequest
{
    public string CostCenterName { get; set; } = string.Empty;
    public string CostCenterCode { get; set; } = string.Empty;
    public Guid? ManagerEmployeeId { get; set; }
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

public class AuditLogDto
{
    public Guid AuditLogId { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IPAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuditLogQueryRequest : PaginationRequest
{
    public string? TableName { get; set; }
    public string? Action { get; set; }
    public Guid? UserId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

// ─── Notification ─────────────────────────────────────────────────────────────

public class NotificationDto
{
    public Guid NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

public class HRDashboardDto
{
    public int TotalActiveEmployees { get; set; }
    public int NewJoinersThisMonth { get; set; }
    public int EmployeesOnNotice { get; set; }
    public int OpenPositions { get; set; }
    public decimal AttritionRatePercent { get; set; }
    public int PendingLeaveApprovals { get; set; }
    public int PendingRegularizations { get; set; }
    public string? PayrollStatus { get; set; }
    public List<DepartmentHeadcountDto> HeadcountByDept { get; set; } = new();
    public List<MonthlyJoiningDto> MonthlyJoiningTrend { get; set; } = new();
}

public class DepartmentHeadcountDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class MonthlyJoiningDto
{
    public string Month { get; set; } = string.Empty;
    public int Joinings { get; set; }
    public int Exits { get; set; }
}

public class ManagerDashboardDto
{
    public int TeamSize { get; set; }
    public int PresentToday { get; set; }
    public int AbsentToday { get; set; }
    public int OnLeaveToday { get; set; }
    public int WFHToday { get; set; }
    public int PendingLeaveApprovals { get; set; }
    public int PendingRegularizations { get; set; }
}

public class EmployeeDashboardDto
{
    public int AttendanceThisMonth { get; set; }
    public string? TodayStatus { get; set; }
    public DateTime? TodayCheckIn { get; set; }
    public Dictionary<string, decimal> LeaveBalances { get; set; } = new();
    public int PendingLeaveApplications { get; set; }
    public List<UpcomingHolidayDto> UpcomingHolidays { get; set; } = new();
}

public class UpcomingHolidayDto
{
    public DateOnly Date { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public class AttendanceTodayDto
{
    public int TotalEmployees { get; set; }
    public int Present { get; set; }
    public int Absent { get; set; }
    public int OnLeave { get; set; }
    public int WFH { get; set; }
    public int Holiday { get; set; }
    public int NotMarked { get; set; }
}

public class SystemSettingDto
{
    public Guid SettingId { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateSettingRequest
{
    public string SettingValue { get; set; } = string.Empty;
}
