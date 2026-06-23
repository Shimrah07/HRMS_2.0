using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Shared;

namespace IndiaHRMS.Application.DTOs.Employee;

// ─── Employee List / Summary ──────────────────────────────────────────────────

public class EmployeeListDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {MiddleName} {LastName}".Replace("  ", " ").Trim();
    public string? OfficialEmail { get; set; }
    public string? PersonalPhone { get; set; }
    public string? ProfilePhoto { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public Guid? ReportingManagerId { get; set; }
    public string? ReportingManagerName { get; set; }
    public EmploymentType EmploymentType { get; set; }
    public EmploymentStatus EmploymentStatus { get; set; }
    public DateOnly JoiningDate { get; set; }
    public bool IsActive { get; set; }
}

public class EmployeeSummaryDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePhoto { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public string? PersonalPhone { get; set; }
    public string? OfficialEmail { get; set; }
    public EmploymentStatus Status { get; set; }
}

// ─── Employee Detail ──────────────────────────────────────────────────────────

public class EmployeeDetailDto
{
    public Guid EmployeeId { get; set; }
    public Guid CompanyId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public BloodGroup? BloodGroup { get; set; }
    public MaritalStatus? MaritalStatus { get; set; }
    public string? PersonalEmail { get; set; }
    public string? OfficialEmail { get; set; }
    public string? PersonalPhone { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? PermanentAddress { get; set; }
    public string? PermanentCity { get; set; }
    public string? PermanentState { get; set; }
    public string? PermanentPincode { get; set; }
    public string? CurrentAddress { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
    public string? Nationality { get; set; }
    public string? Religion { get; set; }
    public string? MaskedAadhar { get; set; }
    public string? MaskedPAN { get; set; }
    public string? UANNumber { get; set; }
    public string? ESINumber { get; set; }
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public DateOnly JoiningDate { get; set; }
    public DateOnly? ConfirmationDate { get; set; }
    public DateOnly? ProbationEndDate { get; set; }
    public Guid DeptId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public Guid DesignationId { get; set; }
    public string DesignationTitle { get; set; } = string.Empty;
    public Guid LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public Guid? CostCenterId { get; set; }
    public string? CostCenterName { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public string? ReportingManagerName { get; set; }
    public EmploymentType EmploymentType { get; set; }
    public EmploymentStatus EmploymentStatus { get; set; }
    public string? ProfilePhoto { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<EmployeeDocumentDto> Documents { get; set; } = new();
    public List<BankDetailDto> BankDetails { get; set; } = new();
    public List<EducationDto> Educations { get; set; } = new();
    public List<ExperienceDto> Experiences { get; set; } = new();
    public List<PFNomineeDto> PFNominees { get; set; } = new();
}

// ─── Create/Update Employee ───────────────────────────────────────────────────

public class CreateEmployeeRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public BloodGroup? BloodGroup { get; set; }
    public MaritalStatus? MaritalStatus { get; set; }
    public string? PersonalEmail { get; set; }
    public string OfficialEmail { get; set; } = string.Empty;
    public string? PersonalPhone { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? PermanentAddress { get; set; }
    public string? PermanentCity { get; set; }
    public string? PermanentState { get; set; }
    public string? PermanentPincode { get; set; }
    public string? CurrentAddress { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
    public string? Nationality { get; set; }
    public string? AadharNumber { get; set; }
    public string? PANNumber { get; set; }
    public string? UANNumber { get; set; }
    public string? ESINumber { get; set; }
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public DateOnly JoiningDate { get; set; }
    public int ProbationPeriodDays { get; set; } = 90;
    public Guid DeptId { get; set; }
    public Guid DesignationId { get; set; }
    public Guid LocationId { get; set; }
    public Guid? CostCenterId { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FullTime;
    public bool CreateUserAccount { get; set; } = true;
    public string? InitialPassword { get; set; }
}

public class UpdateEmployeeRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public BloodGroup? BloodGroup { get; set; }
    public MaritalStatus? MaritalStatus { get; set; }
    public string? PersonalEmail { get; set; }
    public string? PersonalPhone { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? PermanentAddress { get; set; }
    public string? PermanentCity { get; set; }
    public string? PermanentState { get; set; }
    public string? PermanentPincode { get; set; }
    public string? CurrentAddress { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
    public string? Nationality { get; set; }
    public Guid DeptId { get; set; }
    public Guid DesignationId { get; set; }
    public Guid LocationId { get; set; }
    public Guid? CostCenterId { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public EmploymentType EmploymentType { get; set; }
}

public class SelfUpdateEmployeeRequest
{
    public string? PersonalEmail { get; set; }
    public string? PersonalPhone { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? CurrentAddress { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
}

public class EmployeeQueryRequest : PaginationRequest
{
    public Guid? DeptId { get; set; }
    public Guid? LocationId { get; set; }
    public Guid? DesignationId { get; set; }
    public EmploymentStatus? Status { get; set; }
    public EmploymentType? Type { get; set; }
    public Guid? ReportingManagerId { get; set; }
}

// ─── Sub-DTOs ─────────────────────────────────────────────────────────────────

public class EmployeeDocumentDto
{
    public Guid DocId { get; set; }
    public DocumentType DocType { get; set; }
    public string DocName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
}

public class BankDetailDto
{
    public Guid BankDetailId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string MaskedAccountNumber { get; set; } = string.Empty;
    public string IFSCCode { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public bool IsPrimary { get; set; }
}

public class AddBankDetailRequest
{
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string IFSCCode { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public bool IsPrimary { get; set; }
}

public class EducationDto
{
    public Guid EduId { get; set; }
    public string Degree { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string? University { get; set; }
    public int? PassingYear { get; set; }
    public decimal? Percentage { get; set; }
    public bool IsHighest { get; set; }
}

public class ExperienceDto
{
    public Guid ExpId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public string? ReasonForLeaving { get; set; }
}

public class PFNomineeDto
{
    public Guid NomineeId { get; set; }
    public string NomineeName { get; set; } = string.Empty;
    public Relationship Relationship { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public decimal Percentage { get; set; }
}

// ─── Request DTOs for Education ───────────────────────────────────────────────

public class AddEducationRequest
{
    public string Degree { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string? University { get; set; }
    public int? PassingYear { get; set; }
    public decimal? Percentage { get; set; }
    public bool IsHighest { get; set; }
}

public class UpdateEducationRequest
{
    public string Degree { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string? University { get; set; }
    public int? PassingYear { get; set; }
    public decimal? Percentage { get; set; }
    public bool IsHighest { get; set; }
}

// ─── Request DTOs for Experience ──────────────────────────────────────────────

public class AddExperienceRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public string? ReasonForLeaving { get; set; }
}

public class UpdateExperienceRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public string? ReasonForLeaving { get; set; }
}

// ─── Request DTOs for PF Nominees ────────────────────────────────────────────

public class AddPFNomineeRequest
{
    public string NomineeName { get; set; } = string.Empty;
    public Relationship Relationship { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public decimal Percentage { get; set; }
}

public class UpdatePFNomineeRequest
{
    public string NomineeName { get; set; } = string.Empty;
    public Relationship Relationship { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public decimal Percentage { get; set; }
}

// ─── Org Chart ────────────────────────────────────────────────────────────────

public class OrgChartNodeDto
{
    public Guid EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePhoto { get; set; }
    public string DesignationTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public Guid? ReportingManagerId { get; set; }
    public List<OrgChartNodeDto> DirectReports { get; set; } = new();
}

// ─── Directory ────────────────────────────────────────────────────────────────

public class DirectoryEntryDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePhoto { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string? OfficialEmail { get; set; }
    public string? PersonalPhone { get; set; }
}
