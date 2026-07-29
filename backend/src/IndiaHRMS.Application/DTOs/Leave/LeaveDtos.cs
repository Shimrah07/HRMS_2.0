namespace IndiaHRMS.Application.DTOs.Leave;

// ─── Sub-Module 4.1: Leave Type & Policy DTOs ─────────────────────────────────

public class LeaveTypeDto
{
    public Guid LeaveTypeId { get; set; }
    public Guid CompanyId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public string LeaveCode { get; set; } = string.Empty;
    public int MaxDaysPerYear { get; set; }
    public int MaxDaysPerApplication { get; set; }
    public string AccrualFrequency { get; set; } = "Monthly";
    public decimal AccrualRate { get; set; }
    public bool IsCarryForward { get; set; }
    public int MaxCarryForwardDays { get; set; }
    public bool IsEncashable { get; set; }
    public string EncashmentRule { get; set; } = "YearEnd";
    public bool IsPaidLeave { get; set; } = true;
    public string ApplicableGender { get; set; } = "All";
    public int MinServiceDaysRequired { get; set; }
    public int MinNoticeDays { get; set; } = 3;
    public bool SandwichRuleApplicable { get; set; }
    public bool ProRataForMidYear { get; set; } = true;
    public string? ClubbingRestrictedWith { get; set; }
    public bool IsActive { get; set; } = true;
    public List<LeavePolicyRuleDto> PolicyRules { get; set; } = new();
}

public class CreateLeaveTypeDto
{
    public Guid CompanyId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public string LeaveCode { get; set; } = string.Empty;
    public int MaxDaysPerYear { get; set; }
    public int MaxDaysPerApplication { get; set; }
    public string AccrualFrequency { get; set; } = "Monthly";
    public decimal AccrualRate { get; set; } = 1.5m;
    public bool IsCarryForward { get; set; }
    public int MaxCarryForwardDays { get; set; }
    public bool IsEncashable { get; set; }
    public string EncashmentRule { get; set; } = "YearEnd";
    public bool IsPaidLeave { get; set; } = true;
    public string ApplicableGender { get; set; } = "All";
    public int MinServiceDaysRequired { get; set; }
    public int MinNoticeDays { get; set; } = 3;
    public bool SandwichRuleApplicable { get; set; }
    public bool ProRataForMidYear { get; set; } = true;
    public string? ClubbingRestrictedWith { get; set; }
}

public class LeavePolicyRuleDto
{
    public Guid PolicyRuleId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public string? GradeCode { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid? LocationId { get; set; }
    public string? LocationName { get; set; }
    public decimal? QuotaOverride { get; set; }
    public int? MinNoticeDays { get; set; }
    public int? MaxConsecutiveDays { get; set; }
    public bool? SandwichRule { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateLeavePolicyRuleDto
{
    public Guid LeaveTypeId { get; set; }
    public string? GradeCode { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? LocationId { get; set; }
    public decimal? QuotaOverride { get; set; }
    public int? MinNoticeDays { get; set; }
    public int? MaxConsecutiveDays { get; set; }
    public bool? SandwichRule { get; set; }
}

// ─── Sub-Module 4.2: Application & Approval DTOs ──────────────────────────────

public class LeaveApplicationDto
{
    public Guid LeaveAppId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public Guid LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public string LeaveCode { get; set; } = string.Empty;
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public decimal TotalDays { get; set; }
    public bool IsHalfDay { get; set; }
    public string? HalfDayType { get; set; }
    public string? Reason { get; set; }
    public Guid? BackupEmployeeId { get; set; }
    public string? BackupEmployeeName { get; set; }
    public string? ContactPhone { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime AppliedAt { get; set; }
    public Guid? ApproverId { get; set; }
    public string? ApproverName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? Level2ApproverId { get; set; }
    public string? Level2ApproverName { get; set; }
    public DateTime? Level2ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? AttachmentPath { get; set; }
}

public class CreateLeaveApplicationDto
{
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public bool IsHalfDay { get; set; }
    public string? HalfDayType { get; set; }
    public string? Reason { get; set; }
    public Guid? BackupEmployeeId { get; set; }
    public string? ContactPhone { get; set; }
    public string? AttachmentPath { get; set; }
}

public class ApproveRejectLeaveDto
{
    public Guid ApproverUserId { get; set; }
    public bool IsApproved { get; set; }
    public string? Remarks { get; set; }
}

// ─── Sub-Module 4.3: Balance & Ledger DTOs ─────────────────────────────────────

public class LeaveBalanceDto
{
    public Guid BalanceId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public string LeaveCode { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal Accrued { get; set; }
    public decimal Taken { get; set; }
    public decimal Encashed { get; set; }
    public decimal Lapsed { get; set; }
    public decimal ClosingBalance { get; set; }
}

public class LeaveLedgerDto
{
    public Guid LedgerId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public string LeaveCode { get; set; } = string.Empty;
    public string TxnType { get; set; } = string.Empty;
    public DateOnly TxnDate { get; set; }
    public decimal Days { get; set; }
    public decimal RunningBalance { get; set; }
    public string? ReferenceId { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdjustLeaveBalanceDto
{
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public int Year { get; set; }
    public decimal AdjustmentDays { get; set; } // Positive for Credit, Negative for Debit
    public string Remarks { get; set; } = string.Empty;
    public Guid AdjustedByUserId { get; set; }
}

// ─── Sub-Module 4.4: Holiday Calendar DTOs ────────────────────────────────────

public class HolidayCalendarDto
{
    public Guid HolidayId { get; set; }
    public Guid CompanyId { get; set; }
    public Guid? LocationId { get; set; }
    public string? LocationName { get; set; }
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = string.Empty;
    public string HolidayType { get; set; } = "National"; // National, State, Mandatory, Optional
    public string? StateCode { get; set; }
    public bool IsRestrictedHoliday { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateHolidayDto
{
    public Guid CompanyId { get; set; }
    public Guid? LocationId { get; set; }
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = string.Empty;
    public string HolidayType { get; set; } = "Mandatory"; // Mandatory, Optional, State, National
    public string? StateCode { get; set; }
    public bool IsRestrictedHoliday { get; set; }
    public string? Description { get; set; }
}

// ─── Sub-Module 4.5: Statutory Leave DTOs ─────────────────────────────────────

public class StatutoryLeaveEventDto
{
    public Guid EventId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateOnly EventDate { get; set; }
    public DateOnly? ExpectedDeliveryDate { get; set; }
    public int ChildOrder { get; set; }
    public int EntitlementDays { get; set; }
    public string? MedicalCertPath { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CreateStatutoryLeaveDto
{
    public Guid EmployeeId { get; set; }
    public string EventType { get; set; } = "Maternity";
    public DateOnly EventDate { get; set; }
    public DateOnly? ExpectedDeliveryDate { get; set; }
    public int ChildOrder { get; set; } = 1;
    public string? MedicalCertPath { get; set; }
}

// ─── Sub-Module 4.6: Encashment DTOs ──────────────────────────────────────────

public class LeaveEncashmentDto
{
    public Guid EncashmentId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public Guid LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public decimal DaysEncashed { get; set; }
    public decimal DailyRate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TaxExemptAmount { get; set; }
    public decimal TaxableAmount { get; set; }
    public string ProcessedMonth { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class CalculateEncashmentDto
{
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public decimal DaysToEncash { get; set; }
}

// ─── Sub-Module 4.7: Sector Configuration DTOs ────────────────────────────────

public class SectorLeaveConfigDto
{
    public Guid SectorConfigId { get; set; }
    public Guid CompanyId { get; set; }
    public string IndustryType { get; set; } = string.Empty;
    public string RuleKey { get; set; } = string.Empty;
    public string RuleValue { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

// ─── Sub-Module 4.8: Dashboard & Analytics DTOs ───────────────────────────────

public class LeaveDashboardSummaryDto
{
    public int PendingApprovalsCount { get; set; }
    public int OnLeaveTodayCount { get; set; }
    public int OnMaternityPaternityCount { get; set; }
    public int CancelledThisWeekCount { get; set; }
    public int RejectedThisWeekCount { get; set; }
    public int ApprovedThisMonthCount { get; set; }
    public List<LeaveBalanceDto> UserBalances { get; set; } = new();
    public List<LeaveApplicationDto> RecentApplications { get; set; } = new();
    public List<HolidayCalendarDto> UpcomingHolidays { get; set; } = new();
}
