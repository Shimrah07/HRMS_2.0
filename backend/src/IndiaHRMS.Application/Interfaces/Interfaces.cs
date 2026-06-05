using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Shared;
using System.Linq.Expressions;

namespace IndiaHRMS.Application.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);
    Task<PagedList<T>> GetPagedAsync(PaginationRequest request, Expression<Func<T, bool>>? filter = null, CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    IQueryable<T> Query();
}

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Role> Roles { get; }
    IRepository<Permission> Permissions { get; }
    IRepository<UserRole> UserRoles { get; }
    IRepository<RolePermission> RolePermissions { get; }
    IRepository<AuditLog> AuditLogs { get; }
    IRepository<Company> Companies { get; }
    IRepository<Department> Departments { get; }
    IRepository<Designation> Designations { get; }
    IRepository<Location> Locations { get; }
    IRepository<CostCenter> CostCenters { get; }
    IRepository<Employee> Employees { get; }
    IRepository<EmployeeDocument> EmployeeDocuments { get; }
    IRepository<EmployeeBankDetail> EmployeeBankDetails { get; }
    IRepository<EmployeeEducation> EmployeeEducations { get; }
    IRepository<EmployeeExperience> EmployeeExperiences { get; }
    IRepository<PFNominee> PFNominees { get; }
    IRepository<ShiftMaster> ShiftMasters { get; }
    IRepository<EmployeeShift> EmployeeShifts { get; }
    IRepository<HolidayCalendar> HolidayCalendars { get; }
    IRepository<AttendanceRecord> AttendanceRecords { get; }
    IRepository<AttendanceRegularization> AttendanceRegularizations { get; }
    IRepository<LeaveType> LeaveTypes { get; }
    IRepository<LeaveBalance> LeaveBalances { get; }
    IRepository<LeaveApplication> LeaveApplications { get; }
    IRepository<SalaryComponent> SalaryComponents { get; }
    IRepository<SalaryStructure> SalaryStructures { get; }
    IRepository<StructureComponent> StructureComponents { get; }
    IRepository<EmployeeSalary> EmployeeSalaries { get; }
    IRepository<PayrollRun> PayrollRuns { get; }
    IRepository<PayrollDetail> PayrollDetails { get; }
    IRepository<TaxDeclaration> TaxDeclarations { get; }
    IRepository<JobRequisition> JobRequisitions { get; }
    IRepository<Candidate> Candidates { get; }
    IRepository<JobApplication> JobApplications { get; }
    IRepository<InterviewRound> InterviewRounds { get; }
    IRepository<OfferLetter> OfferLetters { get; }
    IRepository<AppraisalCycle> AppraisalCycles { get; }
    IRepository<EmployeeGoal> EmployeeGoals { get; }
    IRepository<PerformanceReview> PerformanceReviews { get; }
    IRepository<PIP> PIPs { get; }
    IRepository<TrainingProgram> TrainingPrograms { get; }
    IRepository<TrainingSchedule> TrainingSchedules { get; }
    IRepository<TrainingNomination> TrainingNominations { get; }
    IRepository<Separation> Separations { get; }
    IRepository<NoDuesClearing> NoDuesItems { get; }
    IRepository<FnFSettlement> FnFSettlements { get; }
    IRepository<Notification> Notifications { get; }
    IRepository<SystemSetting> SystemSettings { get; }
    IRepository<EmailTemplate> EmailTemplates { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task BeginTransactionAsync(CancellationToken ct = default);
    Task CommitTransactionAsync(CancellationToken ct = default);
    Task RollbackTransactionAsync(CancellationToken ct = default);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? EmployeeId { get; }
    string? Username { get; }
    string? Email { get; }
    Guid? CompanyId { get; }
    IEnumerable<string> Roles { get; }
    IEnumerable<string> Permissions { get; }
    bool IsAuthenticated { get; }
    bool HasPermission(string permission);
    bool HasRole(string role);
    bool HasAnyRole(params string[] roles);
}

public interface IEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
    string MaskValue(string value, int visibleChars = 4);
}

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
    Task SendFromTemplateAsync(string to, string templateCode, Dictionary<string, string> variables, Guid companyId, CancellationToken ct = default);
    Task SendBulkAsync(IEnumerable<string> recipients, string subject, string htmlBody, CancellationToken ct = default);
}

public interface IFileService
{
    Task<string> SaveAsync(Stream fileStream, string fileName, string folder, CancellationToken ct = default);
    Task<Stream> GetAsync(string filePath, CancellationToken ct = default);
    Task DeleteAsync(string filePath, CancellationToken ct = default);
    bool IsValidExtension(string fileName);
    bool IsValidSize(long fileSize);
}

public interface IPermissionService
{
    Task<List<string>> GetUserPermissionsAsync(Guid userId, CancellationToken ct = default);
    Task<List<string>> GetUserRolesAsync(Guid userId, CancellationToken ct = default);
    Task<bool> UserHasPermissionAsync(Guid userId, string permission, CancellationToken ct = default);
    Task InvalidateUserCacheAsync(Guid userId, CancellationToken ct = default);
}

public interface INotificationService
{
    Task SendToUserAsync(Guid userId, string title, string message, Domain.Enums.NotificationType type, string? referenceId = null, string? referenceType = null);
    Task SendToRoleAsync(string roleCode, string title, string message, Domain.Enums.NotificationType type);
    Task SendToCompanyAsync(Guid companyId, string title, string message, Domain.Enums.NotificationType type);
}

public interface IPdfGenerationService
{
    Task<byte[]> GenerateSalarySlipAsync(Guid payrollDetailId, CancellationToken ct = default);
    Task<byte[]> GenerateForm16Async(Guid employeeId, string financialYear, CancellationToken ct = default);
    Task<byte[]> GenerateOfferLetterAsync(Guid offerId, CancellationToken ct = default);
    Task<byte[]> GenerateExperienceLetterAsync(Guid separationId, CancellationToken ct = default);
    Task<byte[]> GenerateRelievingLetterAsync(Guid separationId, CancellationToken ct = default);
}
