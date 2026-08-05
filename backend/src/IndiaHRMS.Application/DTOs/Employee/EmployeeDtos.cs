using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Shared;

namespace IndiaHRMS.Application.DTOs.Employee;

// ─── Employee List / Summary ──────────────────────────────────────────────────

public class EmployeeListDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string? EmployeeCategory { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {MiddleName} {LastName}".Replace("  ", " ").Trim();
    public string? OfficialEmail { get; set; }
    public string? PersonalPhone { get; set; }
    public string? ProfilePhoto { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public Guid DeptId { get; set; }
    public string DesignationTitle { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public Guid? ReportingManagerId { get; set; }
    public string? ReportingManagerName { get; set; }
    public EmploymentType EmploymentType { get; set; }
    public EmploymentStatus EmploymentStatus { get; set; }
    public DateOnly JoiningDate { get; set; }
    public bool IsActive { get; set; }
    public string? GradeCode { get; set; }
    public string? BandCode { get; set; }
    public string? JobFamilyName { get; set; }
    public string? BusinessUnitName { get; set; }
    public string? CostCenterName { get; set; }
    public string? ShiftName { get; set; }
    public WeeklyOffPattern? WeeklyOffPattern { get; set; }
    public PayrollGroup? PayrollGroup { get; set; }
    public WorkMode? WorkMode { get; set; }
    public int NoticePeriodDays { get; set; }
    public Guid? CandidateId { get; set; }
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
    public string? EmployeeCategory { get; set; }
    // Personal Info
    public string? Title { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string? FullNameAadhaar { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public BloodGroup? BloodGroup { get; set; }
    public MaritalStatus? MaritalStatus { get; set; }
    public DateOnly? MarriageDate { get; set; }
    public string? SpouseName { get; set; }
    public string? FatherName { get; set; }
    public string? Category { get; set; }
    public string? PwdStatus { get; set; }
    public string? PwdCertificateNo { get; set; }
    public string? MotherTongue { get; set; }
    public int? NumberOfDependents { get; set; }
    public string? Nationality { get; set; }
    public string? Religion { get; set; }
    // Contact
    public string? PersonalEmail { get; set; }
    public string? OfficialEmail { get; set; }
    public string? PersonalPhone { get; set; }
    public string? OfficialMobile { get; set; }
    public string? AlternateMobile { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? ExtensionNumber { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? AlternateEmergencyContactPhone { get; set; }
    // Address
    public string? PermanentAddress { get; set; }
    public string? PermanentAddressLine1 { get; set; }
    public string? PermanentAddressLine2 { get; set; }
    public string? PermanentCity { get; set; }
    public string? PermanentDistrict { get; set; }
    public string? PermanentTaluka { get; set; }
    public string? PermanentState { get; set; }
    public string? PermanentPincode { get; set; }
    public bool SameAddressFlag { get; set; }
    public string? CurrentAddress { get; set; }
    public string? CurrentAddressLine1 { get; set; }
    public string? CurrentAddressLine2 { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentDistrict { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
    public string? DomicileState { get; set; }
    // Identity (masked)
    public string? MaskedAadhar { get; set; }
    public string? MaskedPAN { get; set; }
    public string? UANNumber { get; set; }
    public string? ESINumber { get; set; }
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public string? NPSPRANNumber { get; set; }
    public string? PreviousEmployerPFNumber { get; set; }
    // Employment
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
    public Guid? L2ReportingManagerId { get; set; }
    public string? L2ReportingManagerName { get; set; }
    public Guid? L3ReportingManagerId { get; set; }
    public string? L3ReportingManagerName { get; set; }
    public Guid? L4ReportingManagerId { get; set; }
    public string? L4ReportingManagerName { get; set; }
    public Guid? FunctionalManagerId { get; set; }
    public string? FunctionalManagerName { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public string? BusinessUnitName { get; set; }
    public Guid? DivisionId { get; set; }
    public string? DivisionName { get; set; }
    public Guid? SubDeptId { get; set; }
    public string? SubDeptName { get; set; }
    public Guid? TeamId { get; set; }
    public string? TeamName { get; set; }
    public Guid? GradeId { get; set; }
    public string? GradeName { get; set; }
    public string? GradeCode { get; set; }
    public Guid? BandId { get; set; }
    public string? BandName { get; set; }
    public Guid? JobFamilyId { get; set; }
    public string? JobFamilyName { get; set; }
    public Guid? JobFunctionId { get; set; }
    public string? JobFunctionName { get; set; }
    public Guid? ProfitCenterId { get; set; }
    public string? ProfitCenterName { get; set; }
    public Guid? ShiftId { get; set; }
    public string? ShiftName { get; set; }
    public WeeklyOffPattern? WeeklyOffPattern { get; set; }
    public PayrollGroup? PayrollGroup { get; set; }
    public WorkMode? WorkMode { get; set; }
    public int NoticePeriodDays { get; set; }
    public DateOnly? ContractEndDate { get; set; }
    public int? InternshipDurationMonths { get; set; }
    public string? VendorName { get; set; }
    public EmploymentType EmploymentType { get; set; }
    public EmploymentStatus EmploymentStatus { get; set; }
    public string? ProfilePhoto { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CandidateId { get; set; }
    public List<EmployeeDocumentDto> Documents { get; set; } = new();
    public List<BankDetailDto> BankDetails { get; set; } = new();
    public List<EducationDto> Educations { get; set; } = new();
    public List<ExperienceDto> Experiences { get; set; } = new();
    public List<PFNomineeDto> PFNominees { get; set; } = new();
}

// ─── Create/Update Employee ───────────────────────────────────────────────────

public class CreateEmployeeRequest
{
    public string? EmployeeCode { get; set; }
    public string? EmployeeCategory { get; set; }
    public EmployeeTitle? Title { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string? FullNameAadhaar { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public BloodGroup? BloodGroup { get; set; }
    public MaritalStatus? MaritalStatus { get; set; }
    public DateOnly? MarriageDate { get; set; }
    public string? SpouseName { get; set; }
    public string? FatherName { get; set; }
    public EmployeeCategory? Category { get; set; }
    public PwdStatus? PwdStatus { get; set; }
    public string? PwdCertificateNo { get; set; }
    public MotherTongue? MotherTongue { get; set; }
    public int? NumberOfDependents { get; set; }
    public string? Nationality { get; set; }
    public string? Religion { get; set; }
    public string? PersonalEmail { get; set; }
    public string OfficialEmail { get; set; } = string.Empty;
    public string? PersonalPhone { get; set; }
    public string? OfficialMobile { get; set; }
    public string? AlternateMobile { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? ExtensionNumber { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? AlternateEmergencyContactPhone { get; set; }
    public string? PermanentAddress { get; set; }
    public string? PermanentAddressLine1 { get; set; }
    public string? PermanentAddressLine2 { get; set; }
    public string? PermanentCity { get; set; }
    public string? PermanentDistrict { get; set; }
    public string? PermanentTaluka { get; set; }
    public string? PermanentState { get; set; }
    public string? PermanentPincode { get; set; }
    public bool SameAddressFlag { get; set; }
    public string? CurrentAddress { get; set; }
    public string? CurrentAddressLine1 { get; set; }
    public string? CurrentAddressLine2 { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentDistrict { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
    public string? DomicileState { get; set; }
    public string? AadharNumber { get; set; }
    public string? PANNumber { get; set; }
    public string? UANNumber { get; set; }
    public string? ESINumber { get; set; }
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public string? NPSPRANNumber { get; set; }
    public string? PreviousEmployerPFNumber { get; set; }
    public DateOnly JoiningDate { get; set; }
    public int ProbationPeriodDays { get; set; } = 90;
    public Guid DeptId { get; set; }
    public Guid DesignationId { get; set; }
    public Guid LocationId { get; set; }
    public Guid? CostCenterId { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public Guid? L2ReportingManagerId { get; set; }
    public Guid? L3ReportingManagerId { get; set; }
    public Guid? L4ReportingManagerId { get; set; }
    public Guid? FunctionalManagerId { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public Guid? DivisionId { get; set; }
    public Guid? SubDeptId { get; set; }
    public Guid? TeamId { get; set; }
    public Guid? GradeId { get; set; }
    public Guid? BandId { get; set; }
    public Guid? JobFamilyId { get; set; }
    public Guid? JobFunctionId { get; set; }
    public Guid? ProfitCenterId { get; set; }
    public Guid? ShiftId { get; set; }
    public WeeklyOffPattern? WeeklyOffPattern { get; set; }
    public PayrollGroup? PayrollGroup { get; set; }
    public WorkMode? WorkMode { get; set; }
    public int NoticePeriodDays { get; set; }
    public DateOnly? ContractEndDate { get; set; }
    public int? InternshipDurationMonths { get; set; }
    public string? VendorName { get; set; }
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FullTime;
    public bool CreateUserAccount { get; set; } = true;
    public string? InitialPassword { get; set; }
}

public class UpdateEmployeeRequest
{
    public string? EmployeeCode { get; set; }
    public string? EmployeeCategory { get; set; }
    public EmployeeTitle? Title { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string? FullNameAadhaar { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public BloodGroup? BloodGroup { get; set; }
    public MaritalStatus? MaritalStatus { get; set; }
    public DateOnly? MarriageDate { get; set; }
    public string? SpouseName { get; set; }
    public string? FatherName { get; set; }
    public EmployeeCategory? Category { get; set; }
    public PwdStatus? PwdStatus { get; set; }
    public string? PwdCertificateNo { get; set; }
    public MotherTongue? MotherTongue { get; set; }
    public int? NumberOfDependents { get; set; }
    public string? Nationality { get; set; }
    public string? Religion { get; set; }
    public string? PersonalEmail { get; set; }
    public string? PersonalPhone { get; set; }
    public string? OfficialMobile { get; set; }
    public string? AlternateMobile { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? ExtensionNumber { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? AlternateEmergencyContactPhone { get; set; }
    public string? PermanentAddress { get; set; }
    public string? PermanentAddressLine1 { get; set; }
    public string? PermanentAddressLine2 { get; set; }
    public string? PermanentCity { get; set; }
    public string? PermanentDistrict { get; set; }
    public string? PermanentTaluka { get; set; }
    public string? PermanentState { get; set; }
    public string? PermanentPincode { get; set; }
    public bool SameAddressFlag { get; set; }
    public string? CurrentAddress { get; set; }
    public string? CurrentAddressLine1 { get; set; }
    public string? CurrentAddressLine2 { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentDistrict { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
    public string? DomicileState { get; set; }
    public string? AadharNumber { get; set; }
    public string? PANNumber { get; set; }
    public string? UANNumber { get; set; }
    public string? ESINumber { get; set; }
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public string? NPSPRANNumber { get; set; }
    public string? PreviousEmployerPFNumber { get; set; }
    public Guid? DeptId { get; set; }
    public Guid? DesignationId { get; set; }
    public Guid? LocationId { get; set; }
    public Guid? CostCenterId { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public Guid? L2ReportingManagerId { get; set; }
    public Guid? L3ReportingManagerId { get; set; }
    public Guid? L4ReportingManagerId { get; set; }
    public Guid? FunctionalManagerId { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public Guid? DivisionId { get; set; }
    public Guid? SubDeptId { get; set; }
    public Guid? TeamId { get; set; }
    public Guid? GradeId { get; set; }
    public Guid? BandId { get; set; }
    public Guid? JobFamilyId { get; set; }
    public Guid? JobFunctionId { get; set; }
    public Guid? ProfitCenterId { get; set; }
    public Guid? ShiftId { get; set; }
    public WeeklyOffPattern? WeeklyOffPattern { get; set; }
    public PayrollGroup? PayrollGroup { get; set; }
    public WorkMode? WorkMode { get; set; }
    public int NoticePeriodDays { get; set; }
    public DateOnly? ContractEndDate { get; set; }
    public int? InternshipDurationMonths { get; set; }
    public string? VendorName { get; set; }
    public EmploymentType EmploymentType { get; set; }
}

public class SelfUpdateEmployeeRequest
{
    public string? PersonalEmail { get; set; }
    public string? PersonalPhone { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? AlternateMobile { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? AlternateEmergencyContactPhone { get; set; }
    public string? CurrentAddress { get; set; }
    public string? CurrentAddressLine1 { get; set; }
    public string? CurrentAddressLine2 { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentDistrict { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
}

public class EmployeeQueryRequest : PaginationRequest
{
    public string? ActiveStatus { get; set; }
    public Guid? DeptId { get; set; }
    public Guid? LocationId { get; set; }
    public Guid? DesignationId { get; set; }
    public EmploymentStatus? Status { get; set; }
    public List<EmploymentType>? Type { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public List<Guid>? GradeId { get; set; }
    public List<WorkMode>? WorkMode { get; set; }
    public List<Guid>? ShiftId { get; set; }
    public List<PayrollGroup>? PayrollGroup { get; set; }
    public List<Guid>? BusinessUnitId { get; set; }
    public List<Guid>? CostCenterId { get; set; }
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
    public string? DocumentNumber { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? Remarks { get; set; }
}

public class BankDetailDto
{
    public Guid BankDetailId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string MaskedAccountNumber { get; set; } = string.Empty;
    public string IFSCCode { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public bool IsPrimary { get; set; }
    public BankVerificationStatus VerificationStatus { get; set; }
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
    public string? AadharNumber { get; set; }
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
    public string? AadharNumber { get; set; }
}

public class UpdatePFNomineeRequest
{
    public string NomineeName { get; set; } = string.Empty;
    public Relationship Relationship { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public decimal Percentage { get; set; }
    public string? AadharNumber { get; set; }
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

// ─── Masters DTOs ─────────────────────────────────────────────────────────────

public class BusinessUnitDto
{
    public Guid BusinessUnitId { get; set; }
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateBusinessUnitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UpdateBusinessUnitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class DivisionDto
{
    public Guid DivisionId { get; set; }
    public Guid BusinessUnitId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? BusinessUnitName { get; set; }
}

public class CreateDivisionRequest
{
    public Guid BusinessUnitId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UpdateDivisionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class SubDepartmentDto
{
    public Guid SubDeptId { get; set; }
    public Guid DeptId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? DepartmentName { get; set; }
}

public class CreateSubDepartmentRequest
{
    public Guid DeptId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UpdateSubDepartmentRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class TeamDto
{
    public Guid TeamId { get; set; }
    public Guid SubDeptId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? SubDepartmentName { get; set; }
}

public class CreateTeamRequest
{
    public Guid SubDeptId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UpdateTeamRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class GradeMasterDto
{
    public Guid GradeId { get; set; }
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int NoticePeriodDays { get; set; }
    public bool IsActive { get; set; }
}

public class CreateGradeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int NoticePeriodDays { get; set; }
}

public class UpdateGradeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int NoticePeriodDays { get; set; }
    public bool IsActive { get; set; }
}

public class BandMasterDto
{
    public Guid BandId { get; set; }
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateBandRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UpdateBandRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class JobFamilyDto
{
    public Guid JobFamilyId { get; set; }
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateJobFamilyRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UpdateJobFamilyRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class JobFunctionDto
{
    public Guid JobFunctionId { get; set; }
    public Guid JobFamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? JobFamilyName { get; set; }
}

public class CreateJobFunctionRequest
{
    public Guid JobFamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UpdateJobFunctionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class ProfitCenterDto
{
    public Guid ProfitCenterId { get; set; }
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateProfitCenterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UpdateProfitCenterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

