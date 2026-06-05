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

// ─── Employee ─────────────────────────────────────────────────────────────────

public class Employee : BaseEntity
{
    public Guid EmployeeId { get; set; } = Guid.NewGuid();
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
    // AES-256 encrypted fields
    public string? AadharNumber { get; set; }
    public string? PANNumber { get; set; }
    public string? UANNumber { get; set; }
    public string? ESINumber { get; set; }
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public DateOnly JoiningDate { get; set; }
    public DateOnly? ConfirmationDate { get; set; }
    public DateOnly? ProbationEndDate { get; set; }
    public Guid DeptId { get; set; }
    public Guid DesignationId { get; set; }
    public Guid LocationId { get; set; }
    public Guid? CostCenterId { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FullTime;
    public EmploymentStatus EmploymentStatus { get; set; } = EmploymentStatus.Active;
    public string? ProfilePhoto { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public Department Department { get; set; } = null!;
    public Designation Designation { get; set; } = null!;
    public Location Location { get; set; } = null!;
    public CostCenter? CostCenter { get; set; }
    public Employee? ReportingManager { get; set; }
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

// ─── Leave ────────────────────────────────────────────────────────────────────

public class LeaveType : BaseEntity
{
    public Guid LeaveTypeId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public string LeaveCode { get; set; } = string.Empty;
    public int MaxDaysPerYear { get; set; }
    public int MaxDaysPerApplication { get; set; }
    public bool IsCarryForward { get; set; }
    public int MaxCarryForwardDays { get; set; }
    public bool IsEncashable { get; set; }
    public bool IsPaidLeave { get; set; } = true;
    public string ApplicableGender { get; set; } = "All";
    public int MinServiceDaysRequired { get; set; }
    public bool IsActive { get; set; } = true;

    public Company Company { get; set; } = null!;
    public ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();
    public ICollection<LeaveApplication> LeaveApplications { get; set; } = new List<LeaveApplication>();
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
    public string? Reason { get; set; }
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    public Guid? ApproverId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? AttachmentPath { get; set; }

    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
    public User? Approver { get; set; }
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
    public Guid ProcessedBy { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? DisbursedAt { get; set; }
    public decimal TotalGross { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal TotalNetPay { get; set; }
    public int TotalEmployees { get; set; }

    public Company Company { get; set; } = null!;
    public User ProcessedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public ICollection<PayrollDetail> PayrollDetails { get; set; } = new List<PayrollDetail>();
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

// ─── Recruitment ──────────────────────────────────────────────────────────────

public class JobRequisition : BaseEntity
{
    public Guid ReqId { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid DeptId { get; set; }
    public Guid DesignationId { get; set; }
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

    public Company Company { get; set; } = null!;
    public Department Department { get; set; } = null!;
    public Designation Designation { get; set; } = null!;
    public User RaisedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
}

public class Candidate : BaseEntity
{
    public Guid CandidateId { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CurrentDesignation { get; set; }
    public string? CurrentCompany { get; set; }
    public int? TotalExperience { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public string? ResumeFilePath { get; set; }
    public string? Source { get; set; }

    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
}

public class JobApplication : BaseEntity
{
    public Guid AppId { get; set; } = Guid.NewGuid();
    public Guid ReqId { get; set; }
    public Guid CandidateId { get; set; }
    public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
    public ApplicationStage CurrentStage { get; set; } = ApplicationStage.Applied;
    public string? RejectionReason { get; set; }

    public JobRequisition Requisition { get; set; } = null!;
    public Candidate Candidate { get; set; } = null!;
    public ICollection<InterviewRound> InterviewRounds { get; set; } = new List<InterviewRound>();
    public ICollection<OfferLetter> OfferLetters { get; set; } = new List<OfferLetter>();
}

public class InterviewRound : BaseEntity
{
    public Guid RoundId { get; set; } = Guid.NewGuid();
    public Guid AppId { get; set; }
    public string RoundName { get; set; } = string.Empty;
    public string? RoundType { get; set; }
    public DateTime ScheduledAt { get; set; }
    public Guid InterviewerId { get; set; }
    public string? Venue { get; set; }
    public string? MeetingLink { get; set; }
    public string Status { get; set; } = "Scheduled";
    public decimal? Rating { get; set; }
    public string? Feedback { get; set; }
    public DateTime? CompletedAt { get; set; }

    public JobApplication JobApplication { get; set; } = null!;
    public Employee Interviewer { get; set; } = null!;
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
