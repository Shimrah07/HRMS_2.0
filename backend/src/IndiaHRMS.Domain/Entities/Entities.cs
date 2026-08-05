using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Domain.Entities;

public abstract class BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}

// ─── Auth & RBAC ──────────────────────────────────────────────────────────────

public class User : BaseEntity
{
    public Guid UserId { get; set; } = Guid.NewGuid();
    public Guid? EmployeeId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTime? LockedUntil { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public bool MustChangePassword { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }

    public Employee? Employee { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<PasswordHistory> PasswordHistories { get; set; } = new List<PasswordHistory>();
    public ICollection<SecurityAuditLog> SecurityAuditLogs { get; set; } = new List<SecurityAuditLog>();
}

public class PasswordHistory
{
    public Guid HistoryId { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class SecurityAuditLog
{
    public Guid LogId { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = string.Empty; // LOGIN_SUCCESS, LOGIN_FAILURE, ACCOUNT_LOCKED, PASSWORD_CHANGE, PASSWORD_RESET, ACCOUNT_UNLOCKED, ACCESS_DENIED, LOGOUT
    public Guid? UserId { get; set; }
    public string? Username { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Details { get; set; }
    public bool IsSuccess { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

public class Role : BaseEntity
{
    public Guid RoleId { get; set; } = Guid.NewGuid();
    public string RoleName { get; set; } = string.Empty;
    public string RoleCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class Permission : BaseEntity
{
    public Guid PermissionId { get; set; } = Guid.NewGuid();
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class RolePermission
{
    public Guid RolePermissionId { get; set; } = Guid.NewGuid();
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }

    public Role Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}

public class UserRole : BaseEntity
{
    public Guid UserRoleId { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public Guid? AssignedBy { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}

public class AuditLog
{
    public Guid AuditLogId { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IPAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

// ─── Organization ─────────────────────────────────────────────────────────────

public class Company : BaseEntity
{
    public Guid CompanyId { get; set; } = Guid.NewGuid();
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
    public bool IsActive { get; set; } = true;

    public ICollection<Department> Departments { get; set; } = new List<Department>();
    public ICollection<Designation> Designations { get; set; } = new List<Designation>();
    public ICollection<Location> Locations { get; set; } = new List<Location>();
    public ICollection<CostCenter> CostCenters { get; set; } = new List<CostCenter>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}

public class Department : BaseEntity
{
    public Guid DeptId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string DeptName { get; set; } = string.Empty;
    public string DeptCode { get; set; } = string.Empty;
    public Guid? ParentDeptId { get; set; }
    public Guid? HODEmployeeId { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public Department? ParentDept { get; set; }
    public ICollection<Department> ChildDepts { get; set; } = new List<Department>();
    public Employee? HODEmployee { get; set; }
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}

public class Designation : BaseEntity
{
    public Guid DesignationId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Grade { get; set; }
    public int? Level { get; set; }
    public decimal MinBasic { get; set; }
    public decimal MaxBasic { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}

public class Location : BaseEntity
{
    public Guid LocationId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public bool IsHeadOffice { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<HolidayCalendar> HolidayCalendars { get; set; } = new List<HolidayCalendar>();
}

public class CostCenter : BaseEntity
{
    public Guid CostCenterId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string CostCenterName { get; set; } = string.Empty;
    public string CostCenterCode { get; set; } = string.Empty;
    public Guid? ManagerEmployeeId { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public Employee? ManagerEmployee { get; set; }
}

public class BusinessUnit : BaseEntity
{
    public Guid BusinessUnitId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<Division> Divisions { get; set; } = new List<Division>();
}

public class Division : BaseEntity
{
    public Guid DivisionId { get; set; } = Guid.NewGuid();
    public Guid BusinessUnitId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public BusinessUnit BusinessUnit { get; set; } = null!;
}


public class Team : BaseEntity
{
    public Guid TeamId { get; set; } = Guid.NewGuid();
    public Guid SubDeptId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Department SubDepartment { get; set; } = null!;
}

public class GradeMaster : BaseEntity
{
    public Guid GradeId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int NoticePeriodDays { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
}

public class BandMaster : BaseEntity
{
    public Guid BandId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
}

public class JobFamily : BaseEntity
{
    public Guid JobFamilyId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<JobFunction> JobFunctions { get; set; } = new List<JobFunction>();
}

public class JobFunction : BaseEntity
{
    public Guid JobFunctionId { get; set; } = Guid.NewGuid();
    public Guid JobFamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public JobFamily JobFamily { get; set; } = null!;
}

public class ProfitCenter : BaseEntity
{
    public Guid ProfitCenterId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
}


// ─── Employee ─────────────────────────────────────────────────────────────────

public class Employee : BaseEntity
{
    public Guid EmployeeId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string? EmployeeCategory { get; set; }
    // ── Personal Information ─────────────────────────────────────────────
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
    // ── Contact Information ──────────────────────────────────────────────
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
    // ── Address ─────────────────────────────────────────────────────────
    public string? PermanentAddress { get; set; }  // legacy free-text (backward compat)
    public string? PermanentAddressLine1 { get; set; }
    public string? PermanentAddressLine2 { get; set; }
    public string? PermanentCity { get; set; }
    public string? PermanentDistrict { get; set; }
    public string? PermanentTaluka { get; set; }
    public string? PermanentState { get; set; }
    public string? PermanentPincode { get; set; }
    public bool SameAddressFlag { get; set; }
    public string? CurrentAddress { get; set; }    // legacy free-text (backward compat)
    public string? CurrentAddressLine1 { get; set; }
    public string? CurrentAddressLine2 { get; set; }
    public string? CurrentCity { get; set; }
    public string? CurrentDistrict { get; set; }
    public string? CurrentState { get; set; }
    public string? CurrentPincode { get; set; }
    public string? DomicileState { get; set; }
    // ── Identity Documents (AES-256 encrypted) ───────────────────────────
    public string? AadharNumber { get; set; }
    public string? PANNumber { get; set; }
    public string? AadharHash { get; set; }
    public string? PANHash { get; set; }
    public string? UANNumber { get; set; }
    public string? ESINumber { get; set; }
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public string? NPSPRANNumber { get; set; }
    public string? PreviousEmployerPFNumber { get; set; }
    public DateOnly JoiningDate { get; set; }
    public DateOnly? ConfirmationDate { get; set; }
    public DateOnly? ProbationEndDate { get; set; }
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
    public EmploymentStatus EmploymentStatus { get; set; } = EmploymentStatus.Active;
    public string? ProfilePhoto { get; set; }
    public string? RecruitmentSource { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? CandidateId { get; set; }

    public Company Company { get; set; } = null!;
    public Department Department { get; set; } = null!;
    public Designation Designation { get; set; } = null!;
    public Location Location { get; set; } = null!;
    public CostCenter? CostCenter { get; set; }
    public ProfitCenter? ProfitCenter { get; set; }
    public BusinessUnit? BusinessUnit { get; set; }
    public Division? Division { get; set; }
    public Department? SubDepartment { get; set; }
    public Team? Team { get; set; }
    public GradeMaster? Grade { get; set; }
    public BandMaster? Band { get; set; }
    public JobFamily? JobFamily { get; set; }
    public JobFunction? JobFunction { get; set; }
    public Employee? ReportingManager { get; set; }
    public Employee? L2ReportingManager { get; set; }
    public Employee? L3ReportingManager { get; set; }
    public Employee? L4ReportingManager { get; set; }
    public Employee? FunctionalManager { get; set; }
    public ShiftMaster? Shift { get; set; }
    public ICollection<Employee> DirectReports { get; set; } = new List<Employee>();
    public ICollection<EmployeeDocument> Documents { get; set; } = new List<EmployeeDocument>();
    public ICollection<EmployeeBankDetail> BankDetails { get; set; } = new List<EmployeeBankDetail>();
    public ICollection<EmployeeEducation> Educations { get; set; } = new List<EmployeeEducation>();
    public ICollection<EmployeeExperience> Experiences { get; set; } = new List<EmployeeExperience>();
    public ICollection<PFNominee> PFNominees { get; set; } = new List<PFNominee>();
    public User? User { get; set; }
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();
    public ICollection<LeaveApplication> LeaveApplications { get; set; } = new List<LeaveApplication>();
    public ICollection<PayrollDetail> PayrollDetails { get; set; } = new List<PayrollDetail>();
    public ICollection<EmployeeSalary> EmployeeSalaries { get; set; } = new List<EmployeeSalary>();
    public ICollection<TravelRequest> TravelRequests { get; set; } = new List<TravelRequest>();
    public ICollection<TravelAdvance> TravelAdvances { get; set; } = new List<TravelAdvance>();
    public ICollection<ExpenseClaim> ExpenseClaims { get; set; } = new List<ExpenseClaim>();
}

public class EmployeeDocument : BaseEntity
{
    public Guid DocId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public DocumentType DocType { get; set; }
    public string DocName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public Guid? VerifiedBy { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public bool IsVerified { get; set; }
    public string? DocumentNumber { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? Remarks { get; set; }

    public Employee Employee { get; set; } = null!;
    public User? VerifiedByUser { get; set; }
}

public class EmployeeBankDetail : BaseEntity
{
    public Guid BankDetailId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public string BankName { get; set; } = string.Empty;
    // AES-256 encrypted
    public string AccountNumber { get; set; } = string.Empty;
    public string IFSCCode { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; } = true;
    public BankVerificationStatus VerificationStatus { get; set; } = BankVerificationStatus.Pending;
    public DateTime? VerifiedAt { get; set; }
    public Guid? VerifiedBy { get; set; }

    public Employee Employee { get; set; } = null!;
}

public class EmployeeEducation : BaseEntity
{
    public Guid EduId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public string Degree { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string? University { get; set; }
    public int? PassingYear { get; set; }
    public decimal? Percentage { get; set; }
    public bool IsHighest { get; set; }

    public Employee Employee { get; set; } = null!;
}

public class EmployeeExperience : BaseEntity
{
    public Guid ExpId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public string? ReasonForLeaving { get; set; }
    public bool IsVerified { get; set; }

    public Employee Employee { get; set; } = null!;
}

public class PFNominee : BaseEntity
{
    public Guid NomineeId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public string NomineeName { get; set; } = string.Empty;
    public Relationship Relationship { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public decimal Percentage { get; set; }
    // AES-256 encrypted
    public string? AadharNumber { get; set; }

    public Employee Employee { get; set; } = null!;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

public class ShiftMaster : BaseEntity
{
    public Guid ShiftId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public string ShiftCode { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int GracePeriodMins { get; set; }
    public decimal HalfDayThresholdHrs { get; set; } = 4.0m;
    public bool IsNightShift { get; set; }
    public string WeeklyOffDays { get; set; } = "Saturday,Sunday";
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<EmployeeShift> EmployeeShifts { get; set; } = new List<EmployeeShift>();
}

public class EmployeeShift : BaseEntity
{
    public Guid EmpShiftId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public Guid ShiftId { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }

    public Employee Employee { get; set; } = null!;
    public ShiftMaster Shift { get; set; } = null!;
}

public class HolidayCalendar : BaseEntity
{
    public Guid HolidayId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid? LocationId { get; set; }
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = string.Empty;
    public HolidayType HolidayType { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public Location? Location { get; set; }
}

public class AttendanceRecord : BaseEntity
{
    public Guid AttendanceId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public DateTime? CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public decimal WorkingHours { get; set; }
    public decimal OvertimeHours { get; set; }
    public AttendanceStatus Status { get; set; }
    public AttendanceSource Source { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Remarks { get; set; }
    public bool IsRegularized { get; set; }
    public bool IsFrozen { get; set; }

    public Employee Employee { get; set; } = null!;
}

public class AttendanceRegularization : BaseEntity
{
    public Guid RegId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime? RequestedCheckIn { get; set; }
    public DateTime? RequestedCheckOut { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }

    public Employee Employee { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
}

public class CompOffLedger : BaseEntity
{
    public Guid LedgerId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public DateOnly EarnedDate { get; set; }
    public DateOnly ExpiryDate { get; set; }
    public CompOffStatus Status { get; set; } = CompOffStatus.Available;

    public Employee Employee { get; set; } = null!;
}

// ─── Leave Module (M4 Enterprise Engine) ──────────────────────────────────────

public class LeaveType : BaseEntity
{
    public Guid LeaveTypeId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public string LeaveCode { get; set; } = string.Empty;
    public int MaxDaysPerYear { get; set; }
    public int MaxDaysPerApplication { get; set; }
    public string AccrualFrequency { get; set; } = "Monthly"; // Monthly, Quarterly, Yearly, Event
    public decimal AccrualRate { get; set; } = 1.5m;
    public bool IsCarryForward { get; set; }
    public int MaxCarryForwardDays { get; set; }
    public bool IsEncashable { get; set; }
    public string EncashmentRule { get; set; } = "YearEnd"; // YearEnd, ExitOnly, None
    public bool IsPaidLeave { get; set; } = true;
    public string ApplicableGender { get; set; } = "All"; // All, Male, Female
    public int MinServiceDaysRequired { get; set; }
    public int MinNoticeDays { get; set; } = 3;
    public bool SandwichRuleApplicable { get; set; } = false;
    public bool ProRataForMidYear { get; set; } = true;
    public string? ClubbingRestrictedWith { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<LeavePolicyRule> PolicyRules { get; set; } = new List<LeavePolicyRule>();
    public ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();
    public ICollection<LeaveApplication> LeaveApplications { get; set; } = new List<LeaveApplication>();
    public ICollection<LeaveLedger> LeaveLedgers { get; set; } = new List<LeaveLedger>();
}

public class LeavePolicyRule : BaseEntity
{
    public Guid PolicyRuleId { get; set; } = Guid.NewGuid();
    public Guid LeaveTypeId { get; set; }
    public string? GradeCode { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? LocationId { get; set; }
    public decimal? QuotaOverride { get; set; }
    public int? MinNoticeDays { get; set; }
    public int? MaxConsecutiveDays { get; set; }
    public bool? SandwichRule { get; set; }
    public bool IsActive { get; set; } = true;

    public LeaveType LeaveType { get; set; } = null!;
    public Department? Department { get; set; }
    public Location? Location { get; set; }
}

public class LeaveBalance : BaseEntity
{
    public Guid BalanceId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public int Year { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal Accrued { get; set; }
    public decimal Taken { get; set; }
    public decimal Encashed { get; set; }
    public decimal Lapsed { get; set; }
    public decimal ClosingBalance { get; set; }

    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
}

public class LeaveApplication : BaseEntity
{
    public Guid LeaveAppId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public decimal TotalDays { get; set; }
    public bool IsHalfDay { get; set; }
    public string? HalfDayType { get; set; } // FirstHalf, SecondHalf
    public string? Reason { get; set; }
    public Guid? BackupEmployeeId { get; set; }
    public string? ContactPhone { get; set; }
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    public Guid? ApproverId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? Level2ApproverId { get; set; }
    public DateTime? Level2ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? AttachmentPath { get; set; }

    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
    public Employee? BackupEmployee { get; set; }
    public User? Approver { get; set; }
    public User? Level2Approver { get; set; }
}

public class LeaveLedger : BaseEntity
{
    public Guid LedgerId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public string TxnType { get; set; } = "Accrual"; // Accrual, Availed, Encashed, Lapsed, CarriedForward, Adjustment
    public DateOnly TxnDate { get; set; }
    public decimal Days { get; set; }
    public decimal RunningBalance { get; set; }
    public string? ReferenceId { get; set; }
    public string? Remarks { get; set; }

    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
}

public class StatutoryLeaveEvent : BaseEntity
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public string EventType { get; set; } = "Maternity"; // Maternity, Paternity, Adoption, Miscarriage
    public DateOnly EventDate { get; set; }
    public DateOnly? ExpectedDeliveryDate { get; set; }
    public int ChildOrder { get; set; } = 1; // 1, 2, 3+
    public int EntitlementDays { get; set; }
    public string? MedicalCertPath { get; set; }
    public string Status { get; set; } = "Approved"; // Pending, Approved, Completed

    public Employee Employee { get; set; } = null!;
}

public class LeaveEncashment : BaseEntity
{
    public Guid EncashmentId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public decimal DaysEncashed { get; set; }
    public decimal DailyRate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TaxExemptAmount { get; set; }
    public decimal TaxableAmount { get; set; }
    public string ProcessedMonth { get; set; } = string.Empty; // YYYY-MM
    public string Status { get; set; } = "Pending"; // Pending, Processed, Paid

    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
}

public class SectorLeaveConfig : BaseEntity
{
    public Guid SectorConfigId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string IndustryType { get; set; } = "General"; // Manufacturing, IT, Retail, Healthcare, Construction, Government
    public string RuleKey { get; set; } = string.Empty;
    public string RuleValue { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

public class SalaryComponent : BaseEntity
{
    public Guid ComponentId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentCode { get; set; } = string.Empty;
    public ComponentType ComponentType { get; set; }
    public CalculationType CalculationType { get; set; }
    public ComponentGroup Group { get; set; } = ComponentGroup.SalaryStructure;
    public CalculationBasis CalculationBasis { get; set; } = CalculationBasis.PercentOfCTC;
    public decimal? DefaultPercentage { get; set; }
    public ApplicableTo ApplicableTo { get; set; } = ApplicableTo.Both;
    public bool IsBalancingComponent { get; set; } = false;
    public bool IsStatutory { get; set; }
    public bool IsTaxable { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<StructureComponent> StructureComponents { get; set; } = new List<StructureComponent>();
}

public class SalaryStructure : BaseEntity
{
    public Guid StructureId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string StructureName { get; set; } = string.Empty;
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<StructureComponent> StructureComponents { get; set; } = new List<StructureComponent>();
    public ICollection<EmployeeSalary> EmployeeSalaries { get; set; } = new List<EmployeeSalary>();
}

public class StructureComponent : BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StructureId { get; set; }
    public Guid ComponentId { get; set; }
    public Guid? PercentageOfComponentId { get; set; }
    public decimal FixedValue { get; set; }
    public string? Formula { get; set; }
    public int Sequence { get; set; }

    public SalaryStructure Structure { get; set; } = null!;
    public SalaryComponent Component { get; set; } = null!;
    public SalaryComponent? PercentageOfComponent { get; set; }
}

public class EmployeeSalary : BaseEntity
{
    public Guid EmpSalaryId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public Guid StructureId { get; set; }
    public decimal GrossCTC { get; set; }
    public decimal BasicSalary { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? RevisedBy { get; set; }
    public string? RevisionReason { get; set; }

    public Employee Employee { get; set; } = null!;
    public SalaryStructure Structure { get; set; } = null!;
    public User? RevisedByUser { get; set; }
}

public class PayrollRun : BaseEntity
{
    public Guid PayrollRunId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public PayrollStatus Status { get; set; } = PayrollStatus.Draft;
    public PayrollRunType RunType { get; set; } = PayrollRunType.Regular;
    public Guid ProcessedBy { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? LockedAt { get; set; }
    public Guid? LockedBy { get; set; }
    public DateTime? DisbursedAt { get; set; }
    public decimal TotalGross { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal TotalNetPay { get; set; }
    public decimal TotalCTC { get; set; }
    public int TotalEmployees { get; set; }
    public string? Notes { get; set; }
    public bool AttendanceFrozen { get; set; } = false;

    public Company Company { get; set; } = null!;
    public User ProcessedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public ICollection<PayrollDetail> PayrollDetails { get; set; } = new List<PayrollDetail>();
    public ICollection<PayrollAuditLog> AuditLogs { get; set; } = new List<PayrollAuditLog>();
}

public class PayrollDetail : BaseEntity
{
    public Guid DetailId { get; set; } = Guid.NewGuid();
    public Guid PayrollRunId { get; set; }
    public Guid EmployeeId { get; set; }
    public int WorkingDays { get; set; }
    public decimal PaidDays { get; set; }
    public decimal LWPDays { get; set; }
    public decimal OvertimeHours { get; set; }
    public decimal GrossEarnings { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal NetPay { get; set; }
    public decimal TDSDeducted { get; set; }
    public decimal PFEmployee { get; set; }
    public decimal PFEmployer { get; set; }
    public decimal ESIEmployee { get; set; }
    public decimal ESIEmployer { get; set; }
    public decimal ProfessionalTax { get; set; }
    public decimal LWF { get; set; }
    public decimal GratuityProvision { get; set; }

    public PayrollRun PayrollRun { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
    public ICollection<PayrollComponentValue> ComponentValues { get; set; } = new List<PayrollComponentValue>();
}

public class PayrollComponentValue
{
    public Guid ValueId { get; set; } = Guid.NewGuid();
    public Guid DetailId { get; set; }
    public Guid ComponentId { get; set; }
    public ComponentType ComponentType { get; set; }
    public decimal Amount { get; set; }

    public PayrollDetail PayrollDetail { get; set; } = null!;
    public SalaryComponent Component { get; set; } = null!;
}

public class TaxDeclaration : BaseEntity
{
    public Guid DeclarationId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public string FinancialYear { get; set; } = string.Empty;
    public TaxRegime TaxRegime { get; set; } = TaxRegime.New;
    public decimal HRA_Claimed { get; set; }
    public decimal Section80C { get; set; }
    public decimal Section80D { get; set; }
    public decimal HouseLoanInterest { get; set; }
    public decimal OtherDeductions { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public bool IsApproved { get; set; }
    public Guid? ApprovedBy { get; set; }

    public Employee Employee { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
}

public class PayrollAuditLog
{
    public Guid AuditId { get; set; } = Guid.NewGuid();
    public Guid? PayrollRunId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public Guid PerformedBy { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;

    public PayrollRun? PayrollRun { get; set; }
    public User PerformedByUser { get; set; } = null!;
}

public class VariablePayInput : BaseEntity
{
    public Guid InputId { get; set; } = Guid.NewGuid();
    public Guid PayrollRunId { get; set; }
    public Guid EmployeeId { get; set; }
    public string InputType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Remarks { get; set; }
    public Guid SubmittedBy { get; set; }
    public bool IsApproved { get; set; } = false;
    public Guid? ApprovedBy { get; set; }

    public PayrollRun PayrollRun { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
    public User SubmittedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
}

public class EmployeeSalaryStructure : BaseEntity
{
    public Guid StructureId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public decimal AnnualCTC { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;

    public Employee Employee { get; set; } = null!;
    public ICollection<EmployeeSalaryComponentAllocation> Allocations { get; set; } = new List<EmployeeSalaryComponentAllocation>();
}

public class EmployeeSalaryComponentAllocation : BaseEntity
{
    public Guid AllocationId { get; set; } = Guid.NewGuid();
    public Guid StructureId { get; set; }
    public Guid ComponentId { get; set; }
    public ComponentGroup Group { get; set; }
    public AllocationInputMode InputMode { get; set; } = AllocationInputMode.Percent;
    public decimal? Percentage { get; set; }
    public decimal AnnualAmount { get; set; }
    public decimal MonthlyAmount { get; set; }
    public bool IsBalancingComponent { get; set; }

    public EmployeeSalaryStructure Structure { get; set; } = null!;
    public SalaryComponent Component { get; set; } = null!;
}

public class InvestmentDeclaration : BaseEntity
{
    public Guid DeclarationId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public string FinancialYear { get; set; } = string.Empty;
    public TaxRegime TaxRegime { get; set; } = TaxRegime.New;
    public decimal Section80C { get; set; } = 0m;
    public decimal Section80D { get; set; } = 0m;
    public decimal Section80E { get; set; } = 0m;
    public decimal Section80G { get; set; } = 0m;
    public bool HraRentedHouse { get; set; } = false;
    public decimal HraClaimAmount { get; set; } = 0m;
    public string? LandlordName { get; set; }
    public string? RentedCity { get; set; }
    public bool IsMetroCity { get; set; } = false;
    public decimal HomeLoanInterest { get; set; } = 0m;
    public decimal PreviousEmployerIncome { get; set; } = 0m;
    public decimal PreviousEmployerTds { get; set; } = 0m;
    public ProofStatus ProofStatus { get; set; } = ProofStatus.Pending;
    public DateTime? ProofSubmittedAt { get; set; }
    public Guid? VerifiedBy { get; set; }

    public Employee Employee { get; set; } = null!;
    public User? VerifiedByUser { get; set; }
}

public class ProfessionalTaxSlab
{
    public Guid SlabId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string StateCode { get; set; } = "MH";
    public decimal FromAmount { get; set; }
    public decimal? ToAmount { get; set; }
    public decimal MonthlyPTAmount { get; set; }
    public decimal? FebruaryOverride { get; set; }

    public Company Company { get; set; } = null!;
}

public class StatutoryDeductionConfig : BaseEntity
{
    public Guid ConfigId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string WorkState { get; set; } = "MH";
    public bool PFApplicable { get; set; } = true;
    public bool PFHigherBasis { get; set; } = false;
    public decimal PFWageCeiling { get; set; } = 15000m;
    public bool ESIApplicable { get; set; } = true;
    public decimal ESIGrossLimit { get; set; } = 21000m;
    public bool PTApplicable { get; set; } = true;
    public bool LWFApplicable { get; set; } = false;
    public decimal LWFEmployeeAmount { get; set; } = 0m;
    public decimal LWFEmployerAmount { get; set; } = 0m;
    public LopDivisorPolicy LopDivisor { get; set; } = LopDivisorPolicy.Fixed30;

    public Company Company { get; set; } = null!;
}

public class PayrollDocument : BaseEntity
{
    public Guid DocumentId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public Guid? CompanyId { get; set; }
    public PayrollDocumentType DocumentType { get; set; }
    public string Period { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public bool IsDelivered { get; set; } = false;

    public Employee Employee { get; set; } = null!;
}

// ─── Recruitment ──────────────────────────────────────────────────────────────

public class JobRequisition : BaseEntity
{
    public Guid ReqId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid? DeptId { get; set; }
    public Guid? DesignationId { get; set; }
    public Guid? GradeId { get; set; }
    public int NoOfPositions { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? JobDescription { get; set; }
    public int? MinExperience { get; set; }
    public int? MaxExperience { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public string? SkillsRequired { get; set; }
    public DateOnly RequisitionDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly? TargetDate { get; set; }
    public RequisitionStatus Status { get; set; } = RequisitionStatus.Draft;
    public Guid RaisedBy { get; set; }
    public Guid? ApprovedBy { get; set; }

    public GradeMaster? Grade { get; set; }

    // Enterprise Enhancements
    public string MrfNumber { get; set; } = string.Empty;
    public Guid? SubDeptId { get; set; }
    public Guid? HiringManagerId { get; set; }
    public string Priority { get; set; } = "Normal";
    public string VacancyType { get; set; } = "New";
    public Guid? ReplacingEmployeeId { get; set; }
    public string Justification { get; set; } = string.Empty;
    public string SourcingPreference { get; set; } = "All";
    public string? InternalHiringJustification { get; set; }
    public string? InternalHiringRemarks { get; set; }
    public Guid? CurrentApproverId { get; set; }
    public int CurrentApprovalLevel { get; set; } = 0;
    public Guid? CancelledBy { get; set; }
    public DateTime? CancelledOn { get; set; }
    public string? CancelReason { get; set; }

    public Company Company { get; set; } = null!;
    public Department? Department { get; set; }
    public Designation? Designation { get; set; }
    public User RaisedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
    public ICollection<JobPosting> JobPostings { get; set; } = new List<JobPosting>();
}

public class ApprovalWorkflowConfig : BaseEntity
{
    public Guid ConfigId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid? DeptId { get; set; }
    public string? EmploymentType { get; set; }
    public decimal? BudgetThreshold { get; set; }
    public string ApproverRolesJson { get; set; } = string.Empty;
}

public class RequisitionAuditTrail : BaseEntity
{
    public Guid AuditId { get; set; } = Guid.NewGuid();
    public Guid ReqId { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid ActionBy { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Remarks { get; set; }

    public JobRequisition JobRequisition { get; set; } = null!;
}

public class JobPosting : BaseEntity
{
    public Guid JobId { get; set; } = Guid.NewGuid();
    public Guid ReqId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? JobDescription { get; set; }
    public string? PublishChannels { get; set; } // Deprecated string channel column for backward compatibility
    public DateTime PostedAt { get; set; } = DateTime.UtcNow;
    public DateOnly? ExpiryDate { get; set; }
    public bool ShowSalary { get; set; } = false; // Deprecated flag
    public JobPostingStatus Status { get; set; } = JobPostingStatus.Draft;

    // Publisher tracking
    public Guid? PublishedById { get; set; }
    public User? PublishedByUser { get; set; }

    // Extensibility fields for career portals/job boards
    public string? WorkMode { get; set; } = "Onsite"; // Onsite, Remote, Hybrid
    public string? LocationName { get; set; }
    public string? ExternalLink { get; set; }
    public string? MetadataJson { get; set; }

    // Enterprise ATS Sourcing Schema
    public string? JobCategory { get; set; }
    public string? Industry { get; set; }
    public string? EmploymentType { get; set; }
    public decimal? ExperienceMin { get; set; }
    public decimal? ExperienceMax { get; set; }
    public bool ShowSalaryRange { get; set; } = false;
    public bool ShowCompanyName { get; set; } = true;
    public bool AutoUnpublish { get; set; } = false;
    public bool ScreeningEnabled { get; set; } = false;

    public string? RolesAndResponsibilities { get; set; }
    public string? Requirements { get; set; }
    public string? SkillsRequired { get; set; }
    public string? Benefits { get; set; }

    public JobRequisition JobRequisition { get; set; } = null!;
    public ICollection<JobPostingQuestion> JobPostingQuestions { get; set; } = new List<JobPostingQuestion>();
    public ICollection<JobPostingChannel> PublishingChannels { get; set; } = new List<JobPostingChannel>();
    public ICollection<JobPostingPerk> PerksAndBenefits { get; set; } = new List<JobPostingPerk>();
}

public class Candidate : BaseEntity
{
    public Guid CandidateId { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public Gender? Gender { get; set; }
    public string? CurrentDesignation { get; set; }
    public string? CurrentCompany { get; set; }
    public decimal? TotalExperience { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public string? ResumeFilePath { get; set; }
    public CandidateSource? Source { get; set; }

    // Enterprise ATS Sourcing Schema
    public decimal? RelevantExperience { get; set; }
    public string? HighestQualification { get; set; }
    public string? PreferredLocation { get; set; }
    public string? CurrentLocation { get; set; }
    public string? WillingToRelocate { get; set; }
    public Guid? ReferralEmployeeId { get; set; }
    public string? CandidateTags { get; set; }
    public CandidateStatus CandidateStatus { get; set; } = CandidateStatus.Active;
    public DateTime? LastApplicationDate { get; set; }

    public DateOnly? DateOfBirth { get; set; }
    public string? LinkedIn { get; set; }
    public string? Portfolio { get; set; }
    public string? Skills { get; set; }
    public string? Languages { get; set; }

    public Employee? ReferralEmployee { get; set; }
    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
    public ICollection<BGVRecord> BGVRecords { get; set; } = new List<BGVRecord>();
    public ICollection<OnboardingProcess> Onboardings { get; set; } = new List<OnboardingProcess>();
    public ICollection<CandidateAnswer> CandidateAnswers { get; set; } = new List<CandidateAnswer>();
}

public class JobApplication : BaseEntity
{
    public Guid AppId { get; set; } = Guid.NewGuid();
    public Guid ReqId { get; set; }
    public Guid CandidateId { get; set; }
    public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
    public ApplicationStage CurrentStage { get; set; } = ApplicationStage.Applied;
    public string? RejectionReason { get; set; }
    public decimal? AiMatchScore { get; set; }
    public string TimelineEventsJson { get; set; } = "[]";
    public string NotesJson { get; set; } = "[]";

    // The HR Admin / Super Admin who added this candidate.
    // Auto-populated on creation. Null when submitted via Careers Portal.
    public Guid? AssignedRecruiterId { get; set; }

    public JobRequisition Requisition { get; set; } = null!;
    public Candidate Candidate { get; set; } = null!;
    public User? AssignedRecruiter { get; set; }
    public ICollection<InterviewRound> InterviewRounds { get; set; } = new List<InterviewRound>();
    public ICollection<OfferLetter> OfferLetters { get; set; } = new List<OfferLetter>();

    public bool? TechnicalApproved { get; set; }
    public bool? HrApproved { get; set; }
    public bool? ManagerApproved { get; set; }
    public string StageDataJson { get; set; } = "{}";
    public string Status { get; set; } = "Active";
}


public class JobPostingQuestion : BaseEntity
{
    public Guid QuestionId { get; set; } = Guid.NewGuid();
    public Guid JobPostingId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "YesNo"; // YesNo, Number, Text
    public bool Required { get; set; } = false;
    public bool DealBreaker { get; set; } = false;
    public string? ExpectedAnswer { get; set; }
    public int Sequence { get; set; }
    public int Weightage { get; set; } = 10;

    public JobPosting JobPosting { get; set; } = null!;
    public ICollection<CandidateAnswer> CandidateAnswers { get; set; } = new List<CandidateAnswer>();
}

public class JobPostingChannel : BaseEntity
{
    public Guid ChannelId { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public string ChannelName { get; set; } = string.Empty;

    public JobPosting JobPosting { get; set; } = null!;
}

public class JobPostingPerk : BaseEntity
{
    public Guid PerkId { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public string PerkName { get; set; } = string.Empty;

    public JobPosting JobPosting { get; set; } = null!;
}

public class CandidateAnswer : BaseEntity
{
    public Guid AnswerId { get; set; } = Guid.NewGuid();
    public Guid CandidateId { get; set; }
    public Guid QuestionId { get; set; }
    public string Answer { get; set; } = string.Empty;
    public bool Passed { get; set; } = true;
    public DateTime AnsweredOn { get; set; } = DateTime.UtcNow;
    public Guid? AnsweredBy { get; set; }

    public Candidate Candidate { get; set; } = null!;
    public JobPostingQuestion JobPostingQuestion { get; set; } = null!;
}

public class InterviewRound : BaseEntity
{
    public Guid RoundId { get; set; } = Guid.NewGuid();
    public Guid? AppId { get; set; }
    public string RoundName { get; set; } = string.Empty;
    public string? RoundType { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public Guid InterviewerId { get; set; }
    public string? Venue { get; set; }
    public string? MeetingLink { get; set; }
    public string Status { get; set; } = "Scheduled";
    public decimal? Rating { get; set; }
    public string? Feedback { get; set; }
    public DateTime? CompletedAt { get; set; }

    // General Interview & Extra Fields
    public bool IsGeneralInterview { get; set; } = false;
    public string? Category { get; set; }
    public string? CandidateName { get; set; }
    public string? CandidateEmail { get; set; }
    public string? CandidatePhone { get; set; }
    public string? Company { get; set; }
    public string? Department { get; set; }
    public string? Notes { get; set; }
    public string? AttachmentsJson { get; set; }
    public string? ChecklistJson { get; set; }

    public JobApplication? JobApplication { get; set; }
    public Employee Interviewer { get; set; } = null!;
    public ICollection<InterviewRoundPanelist> Panelists { get; set; } = new List<InterviewRoundPanelist>();
}

public class InterviewRoundPanelist : BaseEntity
{
    public Guid PanelistId { get; set; } = Guid.NewGuid();
    public Guid RoundId { get; set; }
    public Guid EmployeeId { get; set; }
    public string Status { get; set; } = "Pending";
    public decimal? Rating { get; set; }
    public string? Feedback { get; set; }
    public DateTime? SubmittedAt { get; set; }

    public InterviewRound InterviewRound { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
}

public class BGVRecord : BaseEntity
{
    public Guid BGVId { get; set; } = Guid.NewGuid();
    public Guid CandidateId { get; set; }
    public string AgencyName { get; set; } = string.Empty;
    public string BGVType { get; set; } = "Standard";
    public string Status { get; set; } = "Pending";
    public string? DiscrepancyNotes { get; set; }
    public DateTime? InitiatedAt { get; set; }
    public string IdentityStatus { get; set; } = "Pending";
    public string EmploymentStatus { get; set; } = "Pending";
    public string EducationStatus { get; set; } = "Pending";
    public string CriminalStatus { get; set; } = "Pending";
    public string ReferenceStatus { get; set; } = "Pending";
    public string CreditStatus { get; set; } = "Pending";

    public Candidate Candidate { get; set; } = null!;
}

public class OnboardingProcess : BaseEntity
{
    public Guid OnboardingId { get; set; } = Guid.NewGuid();
    public Guid CandidateId { get; set; }
    public string AccessToken { get; set; } = string.Empty;
    public DateTime TokenExpiresAt { get; set; }
    public string Status { get; set; } = "PreJoining";
    public bool PersonalInfoCompleted { get; set; }
    public bool DocumentsUploaded { get; set; }
    public string HRChecklistJson { get; set; } = "[]";
    public string ITChecklistJson { get; set; } = "[]";
    public string AdminChecklistJson { get; set; } = "[]";
    public string? AssetAllocation { get; set; }
    public Guid? BuddyEmployeeId { get; set; }
    public string? InductionSchedule { get; set; }
    public string TransitionHistoryJson { get; set; } = "[]";

    public Candidate Candidate { get; set; } = null!;
    public Employee? BuddyEmployee { get; set; }
    public ICollection<OnboardingTask> Tasks { get; set; } = new List<OnboardingTask>();
}

public class OnboardingTask : BaseEntity
{
    public Guid TaskId { get; set; } = Guid.NewGuid();
    public Guid OnboardingId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty; // HR, IT, Admin, Manager, Employee
    public Guid? OwnerId { get; set; } // EmployeeId of task owner
    public string OwnerName { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    public DateOnly? DueDate { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed, Overdue, Blocked
    public int? SLADays { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public string? AttachmentPath { get; set; }
    public string AuditHistoryJson { get; set; } = "[]"; // Log edits to this task

    public OnboardingProcess OnboardingProcess { get; set; } = null!;
    public Employee? Owner { get; set; }
}

public class OfferLetter : BaseEntity
{
    public Guid OfferId { get; set; } = Guid.NewGuid();
    public Guid AppId { get; set; }
    public decimal OfferedCTC { get; set; }
    public DateOnly JoiningDate { get; set; }
    public DateTime OfferDate { get; set; } = DateTime.UtcNow;
    public DateTime ExpiryDate { get; set; }
    public OfferStatus Status { get; set; } = OfferStatus.Draft;
    public string? LetterFilePath { get; set; }
    public DateTime? AcceptedAt { get; set; }

    public JobApplication JobApplication { get; set; } = null!;
}

// ─── Performance ──────────────────────────────────────────────────────────────

public class AppraisalCycle : BaseEntity
{
    public Guid CycleId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string CycleName { get; set; } = string.Empty;
    public AppraisalCycleType CycleType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateOnly? GoalSettingDeadline { get; set; }
    public DateOnly? MidYearDeadline { get; set; }
    public DateOnly? FinalReviewDeadline { get; set; }
    public AppraisalCycleStatus Status { get; set; } = AppraisalCycleStatus.Draft;

    public Company Company { get; set; } = null!;
    public ICollection<EmployeeGoal> EmployeeGoals { get; set; } = new List<EmployeeGoal>();
    public ICollection<PerformanceReview> PerformanceReviews { get; set; } = new List<PerformanceReview>();
}

public class EmployeeGoal : BaseEntity
{
    public Guid GoalId { get; set; } = Guid.NewGuid();
    public Guid CycleId { get; set; }
    public Guid EmployeeId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? KPI { get; set; }
    public string? TargetValue { get; set; }
    public string? ActualValue { get; set; }
    public decimal Weightage { get; set; }
    public decimal? SelfRating { get; set; }
    public decimal? ManagerRating { get; set; }
    public string Status { get; set; } = "Active";

    public AppraisalCycle Cycle { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
}

public class PerformanceReview : BaseEntity
{
    public Guid ReviewId { get; set; } = Guid.NewGuid();
    public Guid CycleId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ReviewerId { get; set; }
    public ReviewType ReviewType { get; set; }
    public decimal? OverallRating { get; set; }
    public string? Strengths { get; set; }
    public string? AreasForImprovement { get; set; }
    public string? TrainingRecommendations { get; set; }
    public decimal? IncrementRecommended { get; set; }
    public bool PromotionRecommended { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? SubmittedAt { get; set; }

    public AppraisalCycle Cycle { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
    public Employee Reviewer { get; set; } = null!;
}

public class ProbationReview : BaseEntity
{
    public Guid ReviewId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public int CheckpointDays { get; set; } // 30, 60, 90
    public DateOnly ReviewDueDate { get; set; }
    public DateOnly? CompletedDate { get; set; }
    public string Rating { get; set; } = string.Empty; // Meets Expectations, Needs Improvement, Unsatisfactory
    public string Comments { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Completed
    public Guid? ReviewerId { get; set; }

    public Employee Employee { get; set; } = null!;
    public Employee? Reviewer { get; set; }
}

public class PIP : BaseEntity
{
    public Guid PIPId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ImprovementAreas { get; set; }
    public string? Milestones { get; set; }
    public PIPStatus Status { get; set; } = PIPStatus.Active;
    public Guid InitiatedBy { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? ClosureRemark { get; set; }

    public Employee Employee { get; set; } = null!;
    public User InitiatedByUser { get; set; } = null!;
}

// ─── Training ─────────────────────────────────────────────────────────────────

public class TrainingProgram : BaseEntity
{
    public Guid ProgramId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public TrainingMode Mode { get; set; }
    public string? Vendor { get; set; }
    public decimal CostPerPerson { get; set; }
    public int DurationHours { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<TrainingSchedule> Schedules { get; set; } = new List<TrainingSchedule>();
}

public class TrainingSchedule : BaseEntity
{
    public Guid ScheduleId { get; set; } = Guid.NewGuid();
    public Guid ProgramId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? Venue { get; set; }
    public int MaxParticipants { get; set; }
    public Guid? TrainerId { get; set; }
    public string Status { get; set; } = "Scheduled";

    public TrainingProgram Program { get; set; } = null!;
    public Employee? Trainer { get; set; }
    public ICollection<TrainingNomination> Nominations { get; set; } = new List<TrainingNomination>();
}

public class TrainingNomination : BaseEntity
{
    public Guid NomId { get; set; } = Guid.NewGuid();
    public Guid ScheduleId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid NominatedBy { get; set; }
    public NominationStatus Status { get; set; } = NominationStatus.Nominated;
    public string? Feedback { get; set; }
    public decimal? Rating { get; set; }
    public DateTime? CompletionDate { get; set; }
    public string? CertificatePath { get; set; }
    public DateTime? ExpiryDate { get; set; }

    public TrainingSchedule Schedule { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
    public User NominatedByUser { get; set; } = null!;
}

// ─── Separation ───────────────────────────────────────────────────────────────

public class Separation : BaseEntity
{
    public Guid SeparationId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public SeparationType SeparationType { get; set; }
    public DateTime? ResignationDate { get; set; }
    public DateOnly? LastWorkingDate { get; set; }
    public int NoticePeriodDays { get; set; }
    public bool NoticePeriodWaived { get; set; }
    public decimal BuyoutAmount { get; set; }
    public bool ExitInterviewDone { get; set; }
    public string? ExitFeedback { get; set; }
    public string Status { get; set; } = "Initiated";
    public Guid InitiatedBy { get; set; }

    public Employee Employee { get; set; } = null!;
    public User InitiatedByUser { get; set; } = null!;
    public ICollection<NoDuesClearing> NoDuesItems { get; set; } = new List<NoDuesClearing>();
    public FnFSettlement? FnFSettlement { get; set; }
}

public class NoDuesClearing : BaseEntity
{
    public Guid NoDuesId { get; set; } = Guid.NewGuid();
    public Guid SeparationId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public ClearanceStatus ClearanceStatus { get; set; } = ClearanceStatus.Pending;
    public Guid? ClearedBy { get; set; }
    public DateTime? ClearedAt { get; set; }
    public string? Remarks { get; set; }

    public Separation Separation { get; set; } = null!;
    public User? ClearedByUser { get; set; }
}

public class FnFSettlement : BaseEntity
{
    public Guid FnFId { get; set; } = Guid.NewGuid();
    public Guid SeparationId { get; set; }
    public decimal PendingSalary { get; set; }
    public decimal LeaveEncashment { get; set; }
    public decimal GratuityAmount { get; set; }
    public decimal BonusPayable { get; set; }
    public decimal NoticePeriodDeduction { get; set; }
    public decimal OtherDeductions { get; set; }
    public decimal GrossPayable { get; set; }
    public decimal NetPayable { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public Guid? ApprovedBy { get; set; }
    public DateTime? PaidAt { get; set; }

    public Separation Separation { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

public class Notification : BaseEntity
{
    public Guid NotificationId { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public bool IsRead { get; set; }

    public User User { get; set; } = null!;
}

public class SystemSetting : BaseEntity
{
    public Guid SettingId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string DataType { get; set; } = "string";
    public string? Description { get; set; }

    public Company Company { get; set; } = null!;
}

public class EmailTemplate : BaseEntity
{
    public Guid TemplateId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string TemplateCode { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
}

public enum PendingApplicationStatus
{
    Pending,
    Approved,
    Rejected
}

public class PendingApplication : BaseEntity
{
    public Guid PendingAppId { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    
    public string? CurrentCompany { get; set; }
    public string? CurrentDesignation { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public decimal? TotalExperience { get; set; }
    public string? Source { get; set; }
    public string? ResumeFilePath { get; set; }
    public Guid? ReferralEmployeeId { get; set; }
    
    public PendingApplicationStatus Status { get; set; } = PendingApplicationStatus.Pending;
    public DateTime AppliedDate { get; set; } = DateTime.UtcNow;
    public string? RejectionReason { get; set; }
    
    public JobPosting JobPosting { get; set; } = null!;
    public Employee? ReferralEmployee { get; set; }
}

// ─── Module 8: Travel & Expense Management ────────────────────────────────────

public class TravelEntitlement : BaseEntity
{
    public Guid EntitlementId { get; set; } = Guid.NewGuid();
    public string GradeBand { get; set; } = string.Empty; // Band A, Band B, Band C, Band D, Band E
    public string FlightClass { get; set; } = "Economy";
    public string TrainClass { get; set; } = "AC 3-Tier";
    public string HotelCategory { get; set; } = "3-Star";
    public decimal DAMetro { get; set; } = 1500;
    public decimal DANonMetro { get; set; } = 1000;
    public bool IsActive { get; set; } = true;
}

public class TravelRequest : BaseEntity
{
    public Guid RequestId { get; set; } = Guid.NewGuid();
    public string TravelCode { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public string TravelType { get; set; } = "Domestic"; // Domestic, International
    public string Purpose { get; set; } = string.Empty;
    public string ProjectCode { get; set; } = string.Empty;
    public string FromCity { get; set; } = string.Empty;
    public string ToCity { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string ModeOfTravel { get; set; } = "Flight";
    public bool HotelRequired { get; set; } = true;
    public string? CoTravelers { get; set; }
    public string BusinessJustification { get; set; } = string.Empty;
    
    // International Specifics
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public string? VisaStatus { get; set; }
    public string? ForexCurrency { get; set; }
    public decimal ForexAmount { get; set; }
    public string? TravelInsuranceInfo { get; set; }

    public decimal EstimatedCost { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, BookingConfirmed, Completed
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    public Guid? ApproverId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }

    public Employee Employee { get; set; } = null!;
    public User? Approver { get; set; }
    public TravelBooking? Booking { get; set; }
    public TravelAdvance? Advance { get; set; }
    public ExpenseClaim? ExpenseClaim { get; set; }
    public TravelPolicyException? PolicyException { get; set; }
}

public class TravelPolicyException : BaseEntity
{
    public Guid ExceptionId { get; set; } = Guid.NewGuid();
    public Guid TravelRequestId { get; set; }
    public string EntitledCategory { get; set; } = string.Empty;
    public string RequestedCategory { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal AdditionalCostImpact { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public Guid? ApprovedByHOD { get; set; }
    public Guid? ApprovedByFinance { get; set; }

    public TravelRequest TravelRequest { get; set; } = null!;
}

public class TravelBooking : BaseEntity
{
    public Guid BookingId { get; set; } = Guid.NewGuid();
    public Guid TravelRequestId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string TicketDetails { get; set; } = string.Empty;
    public string HotelDetails { get; set; } = string.Empty;
    public string? AttachmentPath { get; set; }
    public Guid? ConfirmedBy { get; set; }
    public DateTime? ConfirmedAt { get; set; }

    public TravelRequest TravelRequest { get; set; } = null!;
}

public class TravelAdvance : BaseEntity
{
    public Guid AdvanceId { get; set; } = Guid.NewGuid();
    public string AdvanceCode { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public Guid TravelRequestId { get; set; }
    public decimal EstimatedTripCost { get; set; }
    public decimal AmountRequested { get; set; }
    public decimal AmountDisbursed { get; set; }
    public string DisbursementMode { get; set; } = "Bank Transfer";
    public DateTime? DisbursedAt { get; set; }
    public DateOnly ExpectedSettlementDate { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Disbursed, Settled, PartiallySettled, OverdueRecovery
    public int AgingDays { get; set; }

    public Employee Employee { get; set; } = null!;
    public TravelRequest TravelRequest { get; set; } = null!;
}

public class ExpenseClaim : BaseEntity
{
    public Guid ClaimId { get; set; } = Guid.NewGuid();
    public string ClaimCode { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public Guid? TravelRequestId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AdvanceAdjusted { get; set; }
    public decimal NetPayable { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Submitted, ManagerApproved, FinanceApproved, Rejected, Reimbursed
    public DateTime? SubmittedAt { get; set; }
    public Guid? ManagerApproverId { get; set; }
    public DateTime? ManagerApprovedAt { get; set; }
    public Guid? FinanceApproverId { get; set; }
    public DateTime? FinanceApprovedAt { get; set; }
    public string? RejectionReason { get; set; }

    public Employee Employee { get; set; } = null!;
    public TravelRequest? TravelRequest { get; set; }
    public ICollection<ExpenseLineItem> LineItems { get; set; } = new List<ExpenseLineItem>();
}

public class ExpenseLineItem : BaseEntity
{
    public Guid LineItemId { get; set; } = Guid.NewGuid();
    public Guid ClaimId { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateOnly ExpenseDate { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public decimal GstAmount { get; set; }
    public string? VendorGstin { get; set; }
    public string? BillPath { get; set; }
    public bool IsPolicyCompliant { get; set; } = true;
    public bool IsBillable { get; set; } = false;
    public decimal ClientMarkupPercent { get; set; }
    public string? GuestDetails { get; set; }
    public string Description { get; set; } = string.Empty;

    public ExpenseClaim Claim { get; set; } = null!;
    public OcrExtractionLog? OcrLog { get; set; }
}

public class OcrExtractionLog : BaseEntity
{
    public Guid ExtractionId { get; set; } = Guid.NewGuid();
    public Guid? LineItemId { get; set; }
    public decimal ExtractedAmount { get; set; }
    public DateOnly? ExtractedDate { get; set; }
    public string? ExtractedVendor { get; set; }
    public string? ExtractedGstin { get; set; }
    public decimal ConfidenceScore { get; set; }
    public string? RawOcrText { get; set; }

    public ExpenseLineItem? LineItem { get; set; }
}

public class ReimbursementBatch : BaseEntity
{
    public Guid BatchId { get; set; } = Guid.NewGuid();
    public string BatchCode { get; set; } = string.Empty;
    public DateTime RunDate { get; set; } = DateTime.UtcNow;
    public int TotalClaims { get; set; }
    public decimal TotalAmount { get; set; }
    public string DisbursementMode { get; set; } = "Payroll"; // Payroll, BankTransfer
    public Guid? ProcessedBy { get; set; }
}

public class SectorPolicyConfig : BaseEntity
{
    public Guid SectorConfigId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string SectorName { get; set; } = "IT"; // IT, Sales, Consulting, Healthcare, Government, Construction, Manufacturing, Education
    public bool IsDefaultActive { get; set; } = false;
    public string ConfigJson { get; set; } = string.Empty;

    public Company Company { get; set; } = null!;
}

// ─── Module 10: Exit Management (Offboarding) ─────────────────────────

public class ExitRecord : BaseEntity
{
    public Guid ExitId { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public DateTime ResignationDate { get; set; } = DateTime.UtcNow;
    public DateOnly ProposedLwd { get; set; }
    public DateOnly? ConfirmedLwd { get; set; }
    public ExitType ExitType { get; set; } = ExitType.Voluntary;
    public string PrimaryReason { get; set; } = string.Empty;
    public string? AdditionalComments { get; set; }
    public bool IsRegretted { get; set; } = false;
    public ExitStatus Status { get; set; } = ExitStatus.ResignationSubmitted;
    public int NoticePeriodDays { get; set; } = 30;
    
    // Early Release / Buyout
    public bool EarlyReleaseRequested { get; set; } = false;
    public DateOnly? RequestedLwd { get; set; }
    public bool EarlyReleaseApproved { get; set; } = false;
    public bool BuyoutAllowed { get; set; } = false;
    public decimal BuyoutAmount { get; set; } = 0;

    // Withdrawal Workflow
    public string WithdrawalStatus { get; set; } = "None"; // None, Requested, Approved, Rejected
    public string? WithdrawalReason { get; set; }
    public DateTime? WithdrawalRequestedAt { get; set; }

    public Guid? ConfirmedBy { get; set; }
    public Guid? ReportingManagerId { get; set; }

    public Employee Employee { get; set; } = null!;
    public User? ConfirmedByUser { get; set; }
    public Employee? ReportingManager { get; set; }
    public ICollection<CounterOffer> CounterOffers { get; set; } = new List<CounterOffer>();
    public ICollection<ExitClearance> Clearances { get; set; } = new List<ExitClearance>();
    public ExitInterview? ExitInterview { get; set; }
    public FFSCalculation? FFSCalculation { get; set; }
    public ICollection<ExitDocument> Documents { get; set; } = new List<ExitDocument>();
}

public class CounterOffer : BaseEntity
{
    public Guid OfferId { get; set; } = Guid.NewGuid();
    public Guid ExitId { get; set; }
    public decimal CurrentCtc { get; set; }
    public decimal ProposedCtc { get; set; }
    public string? OtherConsiderations { get; set; }
    public Guid? ApprovedById { get; set; }
    public CounterOfferResponse EmployeeResponse { get; set; } = CounterOfferResponse.Pending;
    public DateTime? ResponseDate { get; set; }

    public ExitRecord ExitRecord { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
}

public class ExitClearance : BaseEntity
{
    public Guid ClearanceId { get; set; } = Guid.NewGuid();
    public Guid ExitId { get; set; }
    public ClearanceDepartment Department { get; set; }
    public DeptClearanceStatus Status { get; set; } = DeptClearanceStatus.Pending;
    public decimal DuesAmount { get; set; } = 0;
    public string? DuesDetails { get; set; }
    public string? Remarks { get; set; }
    public Guid? ClearedById { get; set; }
    public DateTime? ClearedAt { get; set; }

    public ExitRecord ExitRecord { get; set; } = null!;
    public User? ClearedByUser { get; set; }
}

public class ExitInterview : BaseEntity
{
    public Guid InterviewId { get; set; } = Guid.NewGuid();
    public Guid ExitId { get; set; }
    public string InterviewMode { get; set; } = "Online Self-Service Form"; // Form, 1:1, SkipLevel
    public int OverallRating { get; set; } = 5;
    public int ManagerRating { get; set; } = 5;
    public int GrowthRating { get; set; } = 5;
    public int CompRating { get; set; } = 5;
    public int WorkLifeBalanceRating { get; set; } = 5;
    public string WouldRecommend { get; set; } = "Definitely Yes";
    public string? OpenFeedback { get; set; }
    public string? HrConfidentialNotes { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;


    public ExitRecord ExitRecord { get; set; } = null!;
}

public class FFSCalculation : BaseEntity
{
    public Guid FFSId { get; set; } = Guid.NewGuid();
    public Guid ExitId { get; set; }
    public decimal PendingSalary { get; set; } = 0;
    public decimal LeaveEncashment { get; set; } = 0;
    public decimal Gratuity { get; set; } = 0;
    public decimal ProRataBonus { get; set; } = 0;
    public decimal AssetDeduction { get; set; } = 0;
    public decimal LoanDeduction { get; set; } = 0;
    public decimal NoticeShortfallDeduction { get; set; } = 0;
    public decimal TdsDeduction { get; set; } = 0;
    public decimal GrossPayable { get; set; } = 0;
    public decimal NetPayable { get; set; } = 0;
    public FFSStatus Status { get; set; } = FFSStatus.Calculated;
    public Guid? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? DisbursedAt { get; set; }
    public string? PaymentReference { get; set; }

    public ExitRecord ExitRecord { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
}

public class ExitDocument : BaseEntity
{
    public Guid DocumentId { get; set; } = Guid.NewGuid();
    public Guid ExitId { get; set; }
    public ExitDocumentType DocumentType { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public ExitConductRemark ConductRemark { get; set; } = ExitConductRemark.Satisfactory;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public ExitRecord ExitRecord { get; set; } = null!;
}

public class SectorExitConfig : BaseEntity
{
    public Guid ConfigId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string SectorName { get; set; } = "IT"; // IT, Manufacturing, Healthcare, BFSI, Sales, Government, Consulting, Retail
    public string Priority { get; set; } = "High"; // Critical, High, Medium, Low
    public string ConfigJson { get; set; } = "{}";
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
}

// ─── Asset Management (Module 9) ─────────────────────────────────────────────
public class AssetMaster : BaseEntity
{
    public Guid AssetId { get; set; } = Guid.NewGuid();
    public string AssetTag { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string Category { get; set; } = "Laptop"; // Laptop, Desktop, Mobile, Monitor, Accessory
    public string SerialNumber { get; set; } = string.Empty;
    public decimal PurchaseValue { get; set; } = 0;
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Available"; // Available, Assigned, InRepair, Retired
    public Guid? CompanyId { get; set; }
    public bool IsActive { get; set; } = true;

    public Company? Company { get; set; }
    public ICollection<AssetAssignment> Assignments { get; set; } = new List<AssetAssignment>();
}

public class AssetAssignment : BaseEntity
{
    public Guid AssignmentId { get; set; } = Guid.NewGuid();
    public Guid AssetId { get; set; }
    public Guid EmployeeId { get; set; }
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ReturnedDate { get; set; }
    public string Status { get; set; } = "Assigned"; // Assigned, Returned, Damaged, Lost
    public string? Remarks { get; set; }

    public AssetMaster Asset { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
}


