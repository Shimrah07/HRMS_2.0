using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ─── Auth & RBAC ──────────────────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // ─── Organization ─────────────────────────────────────────────────────────
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<CostCenter> CostCenters => Set<CostCenter>();

    // ─── Employee ─────────────────────────────────────────────────────────────
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeDocument> EmployeeDocuments => Set<EmployeeDocument>();
    public DbSet<EmployeeBankDetail> EmployeeBankDetails => Set<EmployeeBankDetail>();
    public DbSet<EmployeeEducation> EmployeeEducations => Set<EmployeeEducation>();
    public DbSet<EmployeeExperience> EmployeeExperiences => Set<EmployeeExperience>();
    public DbSet<PFNominee> PFNominees => Set<PFNominee>();

    // ─── Attendance ───────────────────────────────────────────────────────────
    public DbSet<ShiftMaster> ShiftMasters => Set<ShiftMaster>();
    public DbSet<EmployeeShift> EmployeeShifts => Set<EmployeeShift>();
    public DbSet<HolidayCalendar> HolidayCalendars => Set<HolidayCalendar>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AttendanceRegularization> AttendanceRegularizations => Set<AttendanceRegularization>();

    // ─── Leave ────────────────────────────────────────────────────────────────
    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<LeaveBalance> LeaveBalances => Set<LeaveBalance>();
    public DbSet<LeaveApplication> LeaveApplications => Set<LeaveApplication>();

    // ─── Payroll ──────────────────────────────────────────────────────────────
    public DbSet<SalaryComponent> SalaryComponents => Set<SalaryComponent>();
    public DbSet<SalaryStructure> SalaryStructures => Set<SalaryStructure>();
    public DbSet<StructureComponent> StructureComponents => Set<StructureComponent>();
    public DbSet<EmployeeSalary> EmployeeSalaries => Set<EmployeeSalary>();
    public DbSet<PayrollRun> PayrollRuns => Set<PayrollRun>();
    public DbSet<PayrollDetail> PayrollDetails => Set<PayrollDetail>();
    public DbSet<PayrollComponentValue> PayrollComponentValues => Set<PayrollComponentValue>();
    public DbSet<TaxDeclaration> TaxDeclarations => Set<TaxDeclaration>();

    // ─── Recruitment ──────────────────────────────────────────────────────────
    public DbSet<JobRequisition> JobRequisitions => Set<JobRequisition>();
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<InterviewRound> InterviewRounds => Set<InterviewRound>();
    public DbSet<OfferLetter> OfferLetters => Set<OfferLetter>();

    // ─── Performance ──────────────────────────────────────────────────────────
    public DbSet<AppraisalCycle> AppraisalCycles => Set<AppraisalCycle>();
    public DbSet<EmployeeGoal> EmployeeGoals => Set<EmployeeGoal>();
    public DbSet<PerformanceReview> PerformanceReviews => Set<PerformanceReview>();
    public DbSet<PIP> PIPs => Set<PIP>();

    // ─── Training ─────────────────────────────────────────────────────────────
    public DbSet<TrainingProgram> TrainingPrograms => Set<TrainingProgram>();
    public DbSet<TrainingSchedule> TrainingSchedules => Set<TrainingSchedule>();
    public DbSet<TrainingNomination> TrainingNominations => Set<TrainingNomination>();

    // ─── Separation ───────────────────────────────────────────────────────────
    public DbSet<Separation> Separations => Set<Separation>();
    public DbSet<NoDuesClearing> NoDuesItems => Set<NoDuesClearing>();
    public DbSet<FnFSettlement> FnFSettlements => Set<FnFSettlement>();

    // ─── Misc ─────────────────────────────────────────────────────────────────
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ─── Users ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.PasswordSalt).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.Employee).WithOne(x => x.User).HasForeignKey<User>(x => x.EmployeeId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Roles ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Role>(e =>
        {
            e.HasKey(x => x.RoleId);
            e.HasIndex(x => x.RoleCode).IsUnique();
            e.Property(x => x.RoleName).HasMaxLength(100).IsRequired();
            e.Property(x => x.RoleCode).HasMaxLength(50).IsRequired();
        });

        // ─── Permissions ───────────────────────────────────────────────────────
        modelBuilder.Entity<Permission>(e =>
        {
            e.HasKey(x => x.PermissionId);
            e.HasIndex(x => x.PermissionCode).IsUnique();
            e.Property(x => x.PermissionCode).HasMaxLength(100).IsRequired();
            e.Property(x => x.Module).HasMaxLength(50).IsRequired();
            e.Property(x => x.Action).HasMaxLength(50).IsRequired();
        });

        // ─── RolePermissions ───────────────────────────────────────────────────
        modelBuilder.Entity<RolePermission>(e =>
        {
            e.HasKey(x => x.RolePermissionId);
            e.HasIndex(x => new { x.RoleId, x.PermissionId }).IsUnique();
            e.HasOne(x => x.Role).WithMany(x => x.RolePermissions).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Permission).WithMany(x => x.RolePermissions).HasForeignKey(x => x.PermissionId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── UserRoles ─────────────────────────────────────────────────────────
        modelBuilder.Entity<UserRole>(e =>
        {
            e.HasKey(x => x.UserRoleId);
            e.HasOne(x => x.User).WithMany(x => x.UserRoles).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Role).WithMany(x => x.UserRoles).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── AuditLogs ─────────────────────────────────────────────────────────
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.AuditLogId);
            e.HasIndex(x => new { x.TableName, x.RecordId });
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.OldValues).HasColumnType("nvarchar(max)");
            e.Property(x => x.NewValues).HasColumnType("nvarchar(max)");
            e.HasOne(x => x.User).WithMany(x => x.AuditLogs).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Company ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Company>(e =>
        {
            e.HasKey(x => x.CompanyId);
            e.Property(x => x.CompanyName).HasMaxLength(200).IsRequired();
        });

        // ─── Department ────────────────────────────────────────────────────────
        modelBuilder.Entity<Department>(e =>
        {
            e.HasKey(x => x.DeptId);
            e.HasIndex(x => x.DeptCode).IsUnique();
            e.Property(x => x.DeptName).HasMaxLength(100).IsRequired();
            e.Property(x => x.DeptCode).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Company).WithMany(x => x.Departments).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ParentDept).WithMany(x => x.ChildDepts).HasForeignKey(x => x.ParentDeptId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.HODEmployee).WithMany().HasForeignKey(x => x.HODEmployeeId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Designation ───────────────────────────────────────────────────────
        modelBuilder.Entity<Designation>(e =>
        {
            e.HasKey(x => x.DesignationId);
            e.Property(x => x.Title).HasMaxLength(100).IsRequired();
            e.Property(x => x.MinBasic).HasColumnType("decimal(12,2)");
            e.Property(x => x.MaxBasic).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.Company).WithMany(x => x.Designations).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Location ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Location>(e =>
        {
            e.HasKey(x => x.LocationId);
            e.Property(x => x.LocationName).HasMaxLength(100).IsRequired();
            e.HasOne(x => x.Company).WithMany(x => x.Locations).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── CostCenter ────────────────────────────────────────────────────────
        modelBuilder.Entity<CostCenter>(e =>
        {
            e.HasKey(x => x.CostCenterId);
            e.Property(x => x.CostCenterName).HasMaxLength(100).IsRequired();
            e.Property(x => x.CostCenterCode).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Company).WithMany(x => x.CostCenters).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ManagerEmployee).WithMany().HasForeignKey(x => x.ManagerEmployeeId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Employee ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Employee>(e =>
        {
            e.HasKey(x => x.EmployeeId);
            e.HasIndex(x => x.EmployeeCode).IsUnique();
            e.HasIndex(x => new { x.CompanyId, x.EmploymentStatus });
            e.HasIndex(x => x.DeptId);
            e.HasIndex(x => x.ReportingManagerId);
            e.Property(x => x.EmployeeCode).HasMaxLength(20).IsRequired();
            e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            e.Property(x => x.AadharNumber).HasMaxLength(500); // encrypted
            e.Property(x => x.PANNumber).HasMaxLength(500);    // encrypted
            e.Property(x => x.EmploymentType).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.EmploymentStatus).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.Gender).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.BloodGroup).HasConversion<string>().HasMaxLength(10);
            e.Property(x => x.MaritalStatus).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Company).WithMany(x => x.Employees).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Department).WithMany(x => x.Employees).HasForeignKey(x => x.DeptId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Designation).WithMany(x => x.Employees).HasForeignKey(x => x.DesignationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Location).WithMany(x => x.Employees).HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CostCenter).WithMany().HasForeignKey(x => x.CostCenterId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ReportingManager).WithMany(x => x.DirectReports).HasForeignKey(x => x.ReportingManagerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EmployeeEducation>(e => e.HasKey(x => x.EduId));
        modelBuilder.Entity<EmployeeExperience>(e => e.HasKey(x => x.ExpId));
        modelBuilder.Entity<PFNominee>(e => e.HasKey(x => x.NomineeId));

        // ─── EmployeeDocuments ─────────────────────────────────────────────────
        modelBuilder.Entity<EmployeeDocument>(e =>
        {
            e.HasKey(x => x.DocId);
            e.Property(x => x.DocType).HasConversion<string>().HasMaxLength(50);
            e.HasOne(x => x.Employee).WithMany(x => x.Documents).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.VerifiedByUser).WithMany().HasForeignKey(x => x.VerifiedBy).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── EmployeeBankDetails ───────────────────────────────────────────────
        modelBuilder.Entity<EmployeeBankDetail>(e =>
        {
            e.HasKey(x => x.BankDetailId);
            e.Property(x => x.AccountNumber).HasMaxLength(500); // encrypted
            e.Property(x => x.AccountType).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Employee).WithMany(x => x.BankDetails).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Attendance ────────────────────────────────────────────────────────
        modelBuilder.Entity<AttendanceRecord>(e =>
        {
            e.HasKey(x => x.AttendanceId);
            e.HasIndex(x => new { x.EmployeeId, x.AttendanceDate }).IsUnique();
            e.HasIndex(x => new { x.AttendanceDate, x.Status });
            e.Property(x => x.WorkingHours).HasColumnType("decimal(5,2)");
            e.Property(x => x.OvertimeHours).HasColumnType("decimal(5,2)");
            e.Property(x => x.Latitude).HasColumnType("decimal(9,6)");
            e.Property(x => x.Longitude).HasColumnType("decimal(9,6)");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Source).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.Employee).WithMany(x => x.AttendanceRecords).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShiftMaster>(e => e.HasKey(x => x.ShiftId));
        modelBuilder.Entity<EmployeeShift>(e => e.HasKey(x => x.EmpShiftId));
        modelBuilder.Entity<HolidayCalendar>(e => e.HasKey(x => x.HolidayId));
        modelBuilder.Entity<AttendanceRegularization>(e => e.HasKey(x => x.RegId));

        // ─── Leave ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<LeaveBalance>(e =>
        {
            e.HasKey(x => x.BalanceId);
            e.HasIndex(x => new { x.EmployeeId, x.LeaveTypeId, x.Year }).IsUnique();
            e.Property(x => x.OpeningBalance).HasColumnType("decimal(6,2)");
            e.Property(x => x.Accrued).HasColumnType("decimal(6,2)");
            e.Property(x => x.Taken).HasColumnType("decimal(6,2)");
            e.Property(x => x.Encashed).HasColumnType("decimal(6,2)");
            e.Property(x => x.Lapsed).HasColumnType("decimal(6,2)");
            e.Property(x => x.ClosingBalance).HasColumnType("decimal(6,2)");
            e.HasOne(x => x.Employee).WithMany(x => x.LeaveBalances).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.LeaveType).WithMany(x => x.LeaveBalances).HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LeaveApplication>(e =>
        {
            e.HasKey(x => x.LeaveAppId);
            e.HasIndex(x => new { x.EmployeeId, x.Status });
            e.HasIndex(x => new { x.ApproverId, x.Status });
            e.Property(x => x.TotalDays).HasColumnType("decimal(5,2)");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Employee).WithMany(x => x.LeaveApplications).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.LeaveType).WithMany(x => x.LeaveApplications).HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Approver).WithMany().HasForeignKey(x => x.ApproverId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<LeaveType>(e => e.HasKey(x => x.LeaveTypeId));

        // ─── Payroll ───────────────────────────────────────────────────────────
        modelBuilder.Entity<EmployeeSalary>(e =>
        {
            e.HasKey(x => x.EmpSalaryId);
            e.Property(x => x.GrossCTC).HasColumnType("decimal(12,2)");
            e.Property(x => x.BasicSalary).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.Employee).WithMany(x => x.EmployeeSalaries).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Structure).WithMany(x => x.EmployeeSalaries).HasForeignKey(x => x.StructureId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.RevisedByUser).WithMany().HasForeignKey(x => x.RevisedBy).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<StructureComponent>(e =>
    {
    e.HasKey(x => x.Id);

    e.HasOne(x => x.Structure)
        .WithMany(x => x.StructureComponents)
        .HasForeignKey(x => x.StructureId);

    e.HasOne(x => x.Component)
        .WithMany(x => x.StructureComponents)
        .HasForeignKey(x => x.ComponentId)
        .OnDelete(DeleteBehavior.Restrict);

    e.HasOne(x => x.PercentageOfComponent)
        .WithMany()
        .HasForeignKey(x => x.PercentageOfComponentId)
        .OnDelete(DeleteBehavior.Restrict);
});

        modelBuilder.Entity<SalaryComponent>(e => e.HasKey(x => x.ComponentId));
        modelBuilder.Entity<SalaryStructure>(e => e.HasKey(x => x.StructureId));
        modelBuilder.Entity<PayrollComponentValue>(e => e.HasKey(x => x.ValueId));
        modelBuilder.Entity<TaxDeclaration>(e => e.HasKey(x => x.DeclarationId));

        modelBuilder.Entity<PayrollRun>(e =>
        {
            e.HasKey(x => x.PayrollRunId);
            e.HasIndex(x => new { x.CompanyId, x.Month, x.Year }).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.TotalGross).HasColumnType("decimal(14,2)");
            e.Property(x => x.TotalDeductions).HasColumnType("decimal(14,2)");
            e.Property(x => x.TotalNetPay).HasColumnType("decimal(14,2)");
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ProcessedByUser).WithMany().HasForeignKey(x => x.ProcessedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PayrollDetail>(e =>
        {
            e.HasKey(x => x.DetailId);
            e.Property(x => x.PaidDays).HasColumnType("decimal(5,2)");
            e.Property(x => x.LWPDays).HasColumnType("decimal(5,2)");
            e.Property(x => x.GrossEarnings).HasColumnType("decimal(12,2)");
            e.Property(x => x.TotalDeductions).HasColumnType("decimal(12,2)");
            e.Property(x => x.NetPay).HasColumnType("decimal(12,2)");
            e.Property(x => x.TDSDeducted).HasColumnType("decimal(10,2)");
            e.Property(x => x.PFEmployee).HasColumnType("decimal(10,2)");
            e.Property(x => x.PFEmployer).HasColumnType("decimal(10,2)");
            e.Property(x => x.ESIEmployee).HasColumnType("decimal(10,2)");
            e.Property(x => x.ESIEmployer).HasColumnType("decimal(10,2)");
            e.HasOne(x => x.PayrollRun).WithMany(x => x.PayrollDetails).HasForeignKey(x => x.PayrollRunId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Employee).WithMany(x => x.PayrollDetails).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Notification ──────────────────────────────────────────────────────
        modelBuilder.Entity<Notification>(e =>
        {
            e.HasKey(x => x.NotificationId);
            e.HasIndex(x => new { x.UserId, x.IsRead });
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(50);
            e.HasOne(x => x.User).WithMany(x => x.Notifications).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── JobRequisition ────────────────────────────────────────────────────
        modelBuilder.Entity<JobRequisition>(e =>
        {
            e.HasKey(x => x.ReqId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.RaisedByUser).WithMany().HasForeignKey(x => x.RaisedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Candidate>(e => e.HasKey(x => x.CandidateId));

        // ─── JobApplication ────────────────────────────────────────────────────
        modelBuilder.Entity<JobApplication>(e =>
        {
            e.HasKey(x => x.AppId);
            e.Property(x => x.CurrentStage).HasConversion<string>().HasMaxLength(30);
        });

        // ─── InterviewRound ────────────────────────────────────────────────────
        modelBuilder.Entity<InterviewRound>(e =>
        {
            e.HasKey(x => x.RoundId);
            e.Property(x => x.Rating).HasColumnType("decimal(3,1)");
            e.HasOne(x => x.Interviewer).WithMany().HasForeignKey(x => x.InterviewerId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── OfferLetter ───────────────────────────────────────────────────────
        modelBuilder.Entity<OfferLetter>(e =>
        {
            e.HasKey(x => x.OfferId);
            e.Property(x => x.OfferedCTC).HasColumnType("decimal(12,2)");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        });

        // ─── Performance ───────────────────────────────────────────────────────
        modelBuilder.Entity<AppraisalCycle>(e =>
        {
            e.HasKey(x => x.CycleId);
            e.Property(x => x.CycleType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        });

        modelBuilder.Entity<PIP>(e => e.HasKey(x => x.PIPId));

        modelBuilder.Entity<EmployeeGoal>(e =>
        {
            e.HasKey(x => x.GoalId);
            e.Property(x => x.Weightage).HasColumnType("decimal(5,2)");
            e.Property(x => x.SelfRating).HasColumnType("decimal(3,1)");
            e.Property(x => x.ManagerRating).HasColumnType("decimal(3,1)");
        });

        modelBuilder.Entity<PerformanceReview>(e =>
        {
            e.HasKey(x => x.ReviewId);
            e.Property(x => x.ReviewType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.OverallRating).HasColumnType("decimal(3,1)");
            e.Property(x => x.IncrementRecommended).HasColumnType("decimal(5,2)");
            e.HasOne(x => x.Reviewer).WithMany().HasForeignKey(x => x.ReviewerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TrainingProgram>(e => e.HasKey(x => x.ProgramId));
        modelBuilder.Entity<TrainingSchedule>(e => e.HasKey(x => x.ScheduleId));

        // ─── Training ──────────────────────────────────────────────────────────
        modelBuilder.Entity<TrainingNomination>(e =>
        {
            e.HasKey(x => x.NomId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Rating).HasColumnType("decimal(3,1)");
            e.HasOne(x => x.NominatedByUser).WithMany().HasForeignKey(x => x.NominatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<NoDuesClearing>(e => e.HasKey(x => x.NoDuesId));

        // ─── Separation ────────────────────────────────────────────────────────
        modelBuilder.Entity<Separation>(e =>
        {
            e.HasKey(x => x.SeparationId);
            e.Property(x => x.SeparationType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.BuyoutAmount).HasColumnType("decimal(10,2)");
            e.HasOne(x => x.InitiatedByUser).WithMany().HasForeignKey(x => x.InitiatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FnFSettlement>(e =>
        {
            e.HasKey(x => x.FnFId);
            e.HasOne(x => x.Separation).WithOne(x => x.FnFSettlement).HasForeignKey<FnFSettlement>(x => x.SeparationId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.GrossPayable).HasColumnType("decimal(12,2)");
            e.Property(x => x.NetPayable).HasColumnType("decimal(12,2)");
        });

        // ─── SystemSettings ────────────────────────────────────────────────────
        modelBuilder.Entity<SystemSetting>(e =>
        {
            e.HasKey(x => x.SettingId);
            e.HasIndex(x => new { x.CompanyId, x.SettingKey }).IsUnique();
            e.Property(x => x.SettingKey).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<EmailTemplate>(e => e.HasKey(x => x.TemplateId));
    }
}
