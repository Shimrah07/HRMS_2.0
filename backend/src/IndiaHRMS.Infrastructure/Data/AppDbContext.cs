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
    public DbSet<PasswordHistory> PasswordHistories => Set<PasswordHistory>();
    public DbSet<SecurityAuditLog> SecurityAuditLogs => Set<SecurityAuditLog>();

    // ─── Organization ─────────────────────────────────────────────────────────
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<CostCenter> CostCenters => Set<CostCenter>();
    public DbSet<BusinessUnit> BusinessUnits => Set<BusinessUnit>();
    public DbSet<Division> Divisions => Set<Division>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<GradeMaster> GradeMasters => Set<GradeMaster>();
    public DbSet<BandMaster> BandMasters => Set<BandMaster>();
    public DbSet<JobFamily> JobFamilies => Set<JobFamily>();
    public DbSet<JobFunction> JobFunctions => Set<JobFunction>();
    public DbSet<ProfitCenter> ProfitCenters => Set<ProfitCenter>();

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
    public DbSet<CompOffLedger> CompOffLedgers => Set<CompOffLedger>();
    // ─── Leave ────────────────────────────────────────────────────────────────
    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<LeavePolicyRule> LeavePolicyRules => Set<LeavePolicyRule>();
    public DbSet<LeaveBalance> LeaveBalances => Set<LeaveBalance>();
    public DbSet<LeaveApplication> LeaveApplications => Set<LeaveApplication>();
    public DbSet<LeaveLedger> LeaveLedgers => Set<LeaveLedger>();
    public DbSet<StatutoryLeaveEvent> StatutoryLeaveEvents => Set<StatutoryLeaveEvent>();
    public DbSet<LeaveEncashment> LeaveEncashments => Set<LeaveEncashment>();
    public DbSet<SectorLeaveConfig> SectorLeaveConfigs => Set<SectorLeaveConfig>();

    // ─── Payroll ──────────────────────────────────────────────────────────────
    public DbSet<SalaryComponent> SalaryComponents => Set<SalaryComponent>();
    public DbSet<SalaryStructure> SalaryStructures => Set<SalaryStructure>();
    public DbSet<StructureComponent> StructureComponents => Set<StructureComponent>();
    public DbSet<EmployeeSalary> EmployeeSalaries => Set<EmployeeSalary>();
    public DbSet<PayrollRun> PayrollRuns => Set<PayrollRun>();
    public DbSet<PayrollDetail> PayrollDetails => Set<PayrollDetail>();
    public DbSet<PayrollComponentValue> PayrollComponentValues => Set<PayrollComponentValue>();
    public DbSet<TaxDeclaration> TaxDeclarations => Set<TaxDeclaration>();
    public DbSet<ProfessionalTaxSlab> ProfessionalTaxSlabs => Set<ProfessionalTaxSlab>();
    public DbSet<StatutoryDeductionConfig> StatutoryDeductionConfigs => Set<StatutoryDeductionConfig>();
    public DbSet<PayrollAuditLog> PayrollAuditLogs => Set<PayrollAuditLog>();
    public DbSet<VariablePayInput> VariablePayInputs => Set<VariablePayInput>();
    public DbSet<EmployeeSalaryStructure> EmployeeSalaryStructures => Set<EmployeeSalaryStructure>();
    public DbSet<EmployeeSalaryComponentAllocation> EmployeeSalaryComponentAllocations => Set<EmployeeSalaryComponentAllocation>();
    public DbSet<InvestmentDeclaration> InvestmentDeclarations => Set<InvestmentDeclaration>();
    public DbSet<PayrollDocument> PayrollDocuments => Set<PayrollDocument>();

    // ─── Recruitment ──────────────────────────────────────────────────────────
    public DbSet<JobRequisition> JobRequisitions => Set<JobRequisition>();
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<PendingApplication> PendingApplications => Set<PendingApplication>();
    public DbSet<InterviewRound> InterviewRounds => Set<InterviewRound>();
    public DbSet<OfferLetter> OfferLetters => Set<OfferLetter>();
    public DbSet<JobPosting> JobPostings => Set<JobPosting>();
    public DbSet<JobPostingQuestion> JobPostingQuestions => Set<JobPostingQuestion>();
    public DbSet<JobPostingChannel> JobPostingChannels => Set<JobPostingChannel>();
    public DbSet<JobPostingPerk> JobPostingPerks => Set<JobPostingPerk>();
    public DbSet<CandidateAnswer> CandidateAnswers => Set<CandidateAnswer>();
    public DbSet<InterviewRoundPanelist> InterviewRoundPanelists => Set<InterviewRoundPanelist>();
    public DbSet<BGVRecord> BGVRecords => Set<BGVRecord>();
    public DbSet<OnboardingProcess> OnboardingProcesses => Set<OnboardingProcess>();
    public DbSet<OnboardingTask> OnboardingTasks => Set<OnboardingTask>();
    public DbSet<ApprovalWorkflowConfig> ApprovalWorkflowConfigs => Set<ApprovalWorkflowConfig>();
    public DbSet<RequisitionAuditTrail> RequisitionAuditTrails => Set<RequisitionAuditTrail>();

    // ─── Performance ──────────────────────────────────────────────────────────
    public DbSet<AppraisalCycle> AppraisalCycles => Set<AppraisalCycle>();
    public DbSet<EmployeeGoal> EmployeeGoals => Set<EmployeeGoal>();
    public DbSet<PerformanceReview> PerformanceReviews => Set<PerformanceReview>();
    public DbSet<PIP> PIPs => Set<PIP>();
    public DbSet<ProbationReview> ProbationReviews => Set<ProbationReview>();

    // ─── Training ─────────────────────────────────────────────────────────────
    public DbSet<TrainingProgram> TrainingPrograms => Set<TrainingProgram>();
    public DbSet<TrainingSchedule> TrainingSchedules => Set<TrainingSchedule>();
    public DbSet<TrainingNomination> TrainingNominations => Set<TrainingNomination>();

    // ─── Separation ───────────────────────────────────────────────────────────
    public DbSet<Separation> Separations => Set<Separation>();
    public DbSet<NoDuesClearing> NoDuesItems => Set<NoDuesClearing>();
    public DbSet<FnFSettlement> FnFSettlements => Set<FnFSettlement>();

    // ─── Module 10: Exit Management ───────────────────────────────────────────
    public DbSet<ExitRecord> ExitRecords => Set<ExitRecord>();
    public DbSet<CounterOffer> CounterOffers => Set<CounterOffer>();
    public DbSet<ExitClearance> ExitClearances => Set<ExitClearance>();
    public DbSet<ExitInterview> ExitInterviews => Set<ExitInterview>();
    public DbSet<FFSCalculation> FFSCalculations => Set<FFSCalculation>();
    public DbSet<ExitDocument> ExitDocuments => Set<ExitDocument>();
    public DbSet<SectorExitConfig> SectorExitConfigs => Set<SectorExitConfig>();


    // ─── Module 8: Travel & Expense Management ────────────────────────────────────
    public DbSet<TravelEntitlement> TravelEntitlements => Set<TravelEntitlement>();
    public DbSet<TravelRequest> TravelRequests => Set<TravelRequest>();
    public DbSet<TravelPolicyException> TravelPolicyExceptions => Set<TravelPolicyException>();
    public DbSet<TravelBooking> TravelBookings => Set<TravelBooking>();
    public DbSet<TravelAdvance> TravelAdvances => Set<TravelAdvance>();
    public DbSet<ExpenseClaim> ExpenseClaims => Set<ExpenseClaim>();
    public DbSet<ExpenseLineItem> ExpenseLineItems => Set<ExpenseLineItem>();
    public DbSet<OcrExtractionLog> OcrExtractionLogs => Set<OcrExtractionLog>();
    public DbSet<ReimbursementBatch> ReimbursementBatches => Set<ReimbursementBatch>();
    public DbSet<SectorPolicyConfig> SectorPolicyConfigs => Set<SectorPolicyConfig>();

    // ─── Misc ─────────────────────────────────────────────────────────────────
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();

    // ─── Asset Management ──────────────────────────────────────────────────────
    public DbSet<AssetMaster> Assets => Set<AssetMaster>();
    public DbSet<AssetAssignment> AssetAssignments => Set<AssetAssignment>();

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

        // ─── PasswordHistories ──────────────────────────────────────────────────
        modelBuilder.Entity<PasswordHistory>(e =>
        {
            e.HasKey(x => x.HistoryId);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.User).WithMany(x => x.PasswordHistories).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── SecurityAuditLogs ─────────────────────────────────────────────────
        modelBuilder.Entity<SecurityAuditLog>(e =>
        {
            e.HasKey(x => x.LogId);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.EventType);
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.EventType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Username).HasMaxLength(100);
            e.Property(x => x.IpAddress).HasMaxLength(50);
            e.Property(x => x.UserAgent).HasMaxLength(500);
            e.Property(x => x.Details).HasColumnType("nvarchar(max)");
            e.HasOne(x => x.User).WithMany(x => x.SecurityAuditLogs).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
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
            e.HasIndex(x => x.AadharHash).IsUnique().HasFilter("[AadharHash] IS NOT NULL");
            e.HasIndex(x => x.PANHash).IsUnique().HasFilter("[PANHash] IS NOT NULL");
            e.Property(x => x.EmployeeCode).HasMaxLength(20).IsRequired();
            e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            e.Property(x => x.AadharNumber).HasMaxLength(500); // encrypted
            e.Property(x => x.PANNumber).HasMaxLength(500);    // encrypted
            e.Property(x => x.AadharHash).HasMaxLength(100);
            e.Property(x => x.PANHash).HasMaxLength(100);
            e.Property(x => x.EmploymentType).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.EmploymentStatus).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.Gender).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.BloodGroup).HasConversion<string>().HasMaxLength(10);
            e.Property(x => x.MaritalStatus).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.WeeklyOffPattern).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.PayrollGroup).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.WorkMode).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.VendorName).HasMaxLength(200);
            e.Property(x => x.RecruitmentSource).HasMaxLength(100);

            e.HasOne(x => x.Company).WithMany(x => x.Employees).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Department).WithMany(x => x.Employees).HasForeignKey(x => x.DeptId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Designation).WithMany(x => x.Employees).HasForeignKey(x => x.DesignationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Location).WithMany(x => x.Employees).HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CostCenter).WithMany().HasForeignKey(x => x.CostCenterId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ProfitCenter).WithMany().HasForeignKey(x => x.ProfitCenterId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.BusinessUnit).WithMany().HasForeignKey(x => x.BusinessUnitId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Division).WithMany().HasForeignKey(x => x.DivisionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.SubDepartment).WithMany().HasForeignKey(x => x.SubDeptId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Team).WithMany().HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Grade).WithMany().HasForeignKey(x => x.GradeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Band).WithMany().HasForeignKey(x => x.BandId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.JobFamily).WithMany().HasForeignKey(x => x.JobFamilyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.JobFunction).WithMany().HasForeignKey(x => x.JobFunctionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ReportingManager).WithMany(x => x.DirectReports).HasForeignKey(x => x.ReportingManagerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.L2ReportingManager).WithMany().HasForeignKey(x => x.L2ReportingManagerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.L3ReportingManager).WithMany().HasForeignKey(x => x.L3ReportingManagerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.L4ReportingManager).WithMany().HasForeignKey(x => x.L4ReportingManagerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.FunctionalManager).WithMany().HasForeignKey(x => x.FunctionalManagerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Shift).WithMany().HasForeignKey(x => x.ShiftId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BusinessUnit>(e =>
        {
            e.HasKey(x => x.BusinessUnitId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Code).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Division>(e =>
        {
            e.HasKey(x => x.DivisionId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Code).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.BusinessUnit).WithMany(x => x.Divisions).HasForeignKey(x => x.BusinessUnitId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Team>(e =>
        {
            e.HasKey(x => x.TeamId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Code).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.SubDepartment).WithMany().HasForeignKey(x => x.SubDeptId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GradeMaster>(e =>
        {
            e.HasKey(x => x.GradeId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Code).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BandMaster>(e =>
        {
            e.HasKey(x => x.BandId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Code).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<JobFamily>(e =>
        {
            e.HasKey(x => x.JobFamilyId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Code).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<JobFunction>(e =>
        {
            e.HasKey(x => x.JobFunctionId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Code).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.JobFamily).WithMany(x => x.JobFunctions).HasForeignKey(x => x.JobFamilyId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProfitCenter>(e =>
        {
            e.HasKey(x => x.ProfitCenterId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Code).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
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
            e.HasOne(x => x.Employee).WithMany(x => x.AttendanceRecords).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        });


        modelBuilder.Entity<ShiftMaster>(e => e.HasKey(x => x.ShiftId));
        modelBuilder.Entity<EmployeeShift>(e => e.HasKey(x => x.EmpShiftId));
        modelBuilder.Entity<HolidayCalendar>(e => e.HasKey(x => x.HolidayId));
        modelBuilder.Entity<AttendanceRegularization>(e => e.HasKey(x => x.RegId));
        modelBuilder.Entity<CompOffLedger>(e => e.HasKey(x => x.LedgerId));

        // ─── Leave Module (M4) ──────────────────────────────────────────────────
        modelBuilder.Entity<LeaveType>(e =>
        {
            e.HasKey(x => x.LeaveTypeId);
            e.HasIndex(x => new { x.CompanyId, x.LeaveCode });
            e.Property(x => x.LeaveTypeName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LeaveCode).HasMaxLength(20).IsRequired();
            e.Property(x => x.AccrualRate).HasColumnType("decimal(5,2)");
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LeavePolicyRule>(e =>
        {
            e.HasKey(x => x.PolicyRuleId);
            e.Property(x => x.QuotaOverride).HasColumnType("decimal(5,2)");
            e.HasOne(x => x.LeaveType).WithMany(x => x.PolicyRules).HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Location).WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.SetNull);
        });

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
            e.ToTable(t => t.HasCheckConstraint("CK_LeaveBalance_NonNegativeClosing", "[ClosingBalance] >= 0"));
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
            e.HasOne(x => x.Employee).WithMany(x => x.LeaveApplications).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.LeaveType).WithMany(x => x.LeaveApplications).HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.BackupEmployee).WithMany().HasForeignKey(x => x.BackupEmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Approver).WithMany().HasForeignKey(x => x.ApproverId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Level2Approver).WithMany().HasForeignKey(x => x.Level2ApproverId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LeaveLedger>(e =>
        {
            e.HasKey(x => x.LedgerId);
            e.HasIndex(x => new { x.EmployeeId, x.LeaveTypeId, x.TxnDate });
            e.Property(x => x.Days).HasColumnType("decimal(6,2)");
            e.Property(x => x.RunningBalance).HasColumnType("decimal(6,2)");
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.LeaveType).WithMany(x => x.LeaveLedgers).HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StatutoryLeaveEvent>(e =>
        {
            e.HasKey(x => x.EventId);
            e.HasIndex(x => new { x.EmployeeId, x.EventType });
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LeaveEncashment>(e =>
        {
            e.HasKey(x => x.EncashmentId);
            e.HasIndex(x => new { x.EmployeeId, x.ProcessedMonth });
            e.Property(x => x.DaysEncashed).HasColumnType("decimal(5,2)");
            e.Property(x => x.DailyRate).HasColumnType("decimal(12,2)");
            e.Property(x => x.TotalAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.TaxExemptAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.TaxableAmount).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.LeaveType).WithMany().HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SectorLeaveConfig>(e =>
        {
            e.HasKey(x => x.SectorConfigId);
            e.HasIndex(x => new { x.CompanyId, x.IndustryType, x.RuleKey }).IsUnique();
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

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
            e.HasIndex(x => new { x.PayrollRunId, x.EmployeeId }).IsUnique();
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

        // ─── Payroll Extended Entities ─────────────────────────────────────────
        modelBuilder.Entity<PayrollAuditLog>(e =>
        {
            e.HasKey(x => x.AuditId);
            e.HasOne(x => x.PayrollRun).WithMany(x => x.AuditLogs).HasForeignKey(x => x.PayrollRunId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.PerformedByUser).WithMany().HasForeignKey(x => x.PerformedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<VariablePayInput>(e =>
        {
            e.HasKey(x => x.InputId);
            e.Property(x => x.Amount).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.PayrollRun).WithMany().HasForeignKey(x => x.PayrollRunId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.SubmittedByUser).WithMany().HasForeignKey(x => x.SubmittedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<EmployeeSalaryStructure>(e =>
        {
            e.HasKey(x => x.StructureId);
            e.Property(x => x.AnnualCTC).HasColumnType("decimal(14,2)");
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmployeeSalaryComponentAllocation>(e =>
        {
            e.HasKey(x => x.AllocationId);
            e.Property(x => x.Percentage).HasColumnType("decimal(5,2)");
            e.Property(x => x.AnnualAmount).HasColumnType("decimal(14,2)");
            e.Property(x => x.MonthlyAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.InputMode).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Group).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.Structure).WithMany(x => x.Allocations).HasForeignKey(x => x.StructureId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Component).WithMany().HasForeignKey(x => x.ComponentId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InvestmentDeclaration>(e =>
        {
            e.HasKey(x => x.DeclarationId);
            e.HasIndex(x => new { x.EmployeeId, x.FinancialYear }).IsUnique();
            e.Property(x => x.Section80C).HasColumnType("decimal(12,2)");
            e.Property(x => x.Section80D).HasColumnType("decimal(12,2)");
            e.Property(x => x.Section80E).HasColumnType("decimal(12,2)");
            e.Property(x => x.Section80G).HasColumnType("decimal(12,2)");
            e.Property(x => x.HraClaimAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.HomeLoanInterest).HasColumnType("decimal(12,2)");
            e.Property(x => x.PreviousEmployerIncome).HasColumnType("decimal(12,2)");
            e.Property(x => x.PreviousEmployerTds).HasColumnType("decimal(12,2)");
            e.Property(x => x.TaxRegime).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.ProofStatus).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.VerifiedByUser).WithMany().HasForeignKey(x => x.VerifiedBy).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PayrollDocument>(e =>
        {
            e.HasKey(x => x.DocumentId);
            e.Property(x => x.DocumentType).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProfessionalTaxSlab>(e =>
        {
            e.HasKey(x => x.SlabId);
            e.Property(x => x.FromAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.ToAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.MonthlyPTAmount).HasColumnType("decimal(8,2)");
            e.Property(x => x.FebruaryOverride).HasColumnType("decimal(8,2)");
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StatutoryDeductionConfig>(e =>
        {
            e.HasKey(x => x.ConfigId);
            e.HasIndex(x => new { x.CompanyId, x.WorkState }).IsUnique();
            e.Property(x => x.PFWageCeiling).HasColumnType("decimal(10,2)");
            e.Property(x => x.ESIGrossLimit).HasColumnType("decimal(10,2)");
            e.Property(x => x.LWFEmployeeAmount).HasColumnType("decimal(8,2)");
            e.Property(x => x.LWFEmployerAmount).HasColumnType("decimal(8,2)");
            e.Property(x => x.LopDivisor).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── SalaryComponent extended fields ───────────────────────────────────
        modelBuilder.Entity<SalaryComponent>(e =>
        {
            e.HasKey(x => x.ComponentId);
            e.Property(x => x.Group).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.CalculationBasis).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.ApplicableTo).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.DefaultPercentage).HasColumnType("decimal(5,2)");
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
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
            e.Property(x => x.MinSalary).HasColumnType("decimal(18,2)");
            e.Property(x => x.MaxSalary).HasColumnType("decimal(18,2)");
            // Explicit FK mappings to prevent EF generating shadow DepartmentDeptId column
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DeptId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Designation).WithMany().HasForeignKey(x => x.DesignationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Grade).WithMany().HasForeignKey(x => x.GradeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.RaisedByUser).WithMany().HasForeignKey(x => x.RaisedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ApprovalWorkflowConfig>(e =>
        {
            e.HasKey(x => x.ConfigId);
            e.Property(x => x.BudgetThreshold).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<RequisitionAuditTrail>(e =>
        {
            e.HasKey(x => x.AuditId);
            e.HasOne(x => x.JobRequisition)
                .WithMany()
                .HasForeignKey(x => x.ReqId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Candidate>(e =>
        {
            e.HasKey(x => x.CandidateId);
            e.Property(x => x.TotalExperience).HasColumnType("decimal(4,1)");
            e.Property(x => x.RelevantExperience).HasColumnType("decimal(4,1)");
            e.Property(x => x.CurrentCTC).HasColumnType("decimal(12,2)");
            e.Property(x => x.ExpectedCTC).HasColumnType("decimal(12,2)");
            e.Property(x => x.Gender).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.CandidateStatus).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Source).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.ReferralEmployee).WithMany().HasForeignKey(x => x.ReferralEmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── JobApplication ────────────────────────────────────────────────────
        modelBuilder.Entity<JobApplication>(e =>
        {
            e.HasKey(x => x.AppId);
            e.Property(x => x.CurrentStage).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.AiMatchScore).HasColumnType("decimal(5,2)");
            e.HasOne(x => x.Requisition)
                .WithMany(x => x.JobApplications)
                .HasForeignKey(x => x.ReqId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── PendingApplication ────────────────────────────────────────────────
        modelBuilder.Entity<PendingApplication>(e =>
        {
            e.HasKey(x => x.PendingAppId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.CurrentCTC).HasColumnType("decimal(12,2)");
            e.Property(x => x.ExpectedCTC).HasColumnType("decimal(12,2)");
            e.Property(x => x.TotalExperience).HasColumnType("decimal(4,1)");
            e.HasOne(x => x.JobPosting)
                .WithMany()
                .HasForeignKey(x => x.JobId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ReferralEmployee)
                .WithMany()
                .HasForeignKey(x => x.ReferralEmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
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

        // ─── JobPosting ────────────────────────────────────────────────────────
        modelBuilder.Entity<JobPosting>(e =>
        {
            e.HasKey(x => x.JobId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.ExperienceMin).HasColumnType("decimal(4,1)");
            e.Property(x => x.ExperienceMax).HasColumnType("decimal(4,1)");
            e.HasOne(x => x.JobRequisition).WithMany(x => x.JobPostings).HasForeignKey(x => x.ReqId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.PublishedByUser).WithMany().HasForeignKey(x => x.PublishedById).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Screening Questions & Answers ──────────────────────────────────────
        modelBuilder.Entity<JobPostingQuestion>(e =>
        {
            e.HasKey(x => x.QuestionId);
            e.HasOne(x => x.JobPosting).WithMany(x => x.JobPostingQuestions).HasForeignKey(x => x.JobPostingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<JobPostingChannel>(e =>
        {
            e.HasKey(x => x.ChannelId);
            e.HasOne(x => x.JobPosting).WithMany(x => x.PublishingChannels).HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<JobPostingPerk>(e =>
        {
            e.HasKey(x => x.PerkId);
            e.HasOne(x => x.JobPosting).WithMany(x => x.PerksAndBenefits).HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CandidateAnswer>(e =>
        {
            e.HasKey(x => x.AnswerId);
            e.HasOne(x => x.Candidate).WithMany(x => x.CandidateAnswers).HasForeignKey(x => x.CandidateId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.JobPostingQuestion).WithMany(x => x.CandidateAnswers).HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── InterviewRoundPanelist ─────────────────────────────────────────────
        modelBuilder.Entity<InterviewRoundPanelist>(e =>
        {
            e.HasKey(x => x.PanelistId);
            e.Property(x => x.Rating).HasColumnType("decimal(3,1)");
            e.HasOne(x => x.InterviewRound).WithMany(x => x.Panelists).HasForeignKey(x => x.RoundId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── BGVRecord ──────────────────────────────────────────────────────────
        modelBuilder.Entity<BGVRecord>(e =>
        {
            e.HasKey(x => x.BGVId);
            e.HasOne(x => x.Candidate).WithMany(x => x.BGVRecords).HasForeignKey(x => x.CandidateId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── OnboardingProcess ──────────────────────────────────────────────────
        modelBuilder.Entity<OnboardingProcess>(e =>
        {
            e.HasKey(x => x.OnboardingId);
            e.HasOne(x => x.Candidate).WithMany(x => x.Onboardings).HasForeignKey(x => x.CandidateId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.BuddyEmployee).WithMany().HasForeignKey(x => x.BuddyEmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── OnboardingTask ─────────────────────────────────────────────────────
        modelBuilder.Entity<OnboardingTask>(e =>
        {
            e.HasKey(x => x.TaskId);
            e.HasOne(x => x.OnboardingProcess).WithMany(x => x.Tasks).HasForeignKey(x => x.OnboardingId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
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

        // ─── ProbationReview ────────────────────────────────────────────────────
        modelBuilder.Entity<ProbationReview>(e =>
        {
            e.HasKey(x => x.ReviewId);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
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

        // ─── Module 8: Travel & Expense ─────────────────────────────────────────
        modelBuilder.Entity<TravelEntitlement>(e =>
        {
            e.HasKey(x => x.EntitlementId);
            e.Property(x => x.DAMetro).HasColumnType("decimal(10,2)");
            e.Property(x => x.DANonMetro).HasColumnType("decimal(10,2)");
        });

        modelBuilder.Entity<TravelRequest>(e =>
        {
            e.HasKey(x => x.RequestId);
            e.HasIndex(x => x.TravelCode).IsUnique();
            e.Property(x => x.TravelCode).HasMaxLength(30).IsRequired();
            e.Property(x => x.ForexAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.EstimatedCost).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.Employee).WithMany(x => x.TravelRequests).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Approver).WithMany().HasForeignKey(x => x.ApproverId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TravelPolicyException>(e =>
        {
            e.HasKey(x => x.ExceptionId);
            e.Property(x => x.AdditionalCostImpact).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.TravelRequest).WithOne(x => x.PolicyException).HasForeignKey<TravelPolicyException>(x => x.TravelRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TravelBooking>(e =>
        {
            e.HasKey(x => x.BookingId);
            e.HasOne(x => x.TravelRequest).WithOne(x => x.Booking).HasForeignKey<TravelBooking>(x => x.TravelRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TravelAdvance>(e =>
        {
            e.HasKey(x => x.AdvanceId);
            e.HasIndex(x => x.AdvanceCode).IsUnique();
            e.Property(x => x.AdvanceCode).HasMaxLength(30).IsRequired();
            e.Property(x => x.EstimatedTripCost).HasColumnType("decimal(12,2)");
            e.Property(x => x.AmountRequested).HasColumnType("decimal(12,2)");
            e.Property(x => x.AmountDisbursed).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.Employee).WithMany(x => x.TravelAdvances).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.TravelRequest).WithOne(x => x.Advance).HasForeignKey<TravelAdvance>(x => x.TravelRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExpenseClaim>(e =>
        {
            e.HasKey(x => x.ClaimId);
            e.HasIndex(x => x.ClaimCode).IsUnique();
            e.Property(x => x.ClaimCode).HasMaxLength(30).IsRequired();
            e.Property(x => x.TotalAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.AdvanceAdjusted).HasColumnType("decimal(12,2)");
            e.Property(x => x.NetPayable).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.Employee).WithMany(x => x.ExpenseClaims).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.TravelRequest).WithOne(x => x.ExpenseClaim).HasForeignKey<ExpenseClaim>(x => x.TravelRequestId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ExpenseLineItem>(e =>
        {
            e.HasKey(x => x.LineItemId);
            e.Property(x => x.Amount).HasColumnType("decimal(12,2)");
            e.Property(x => x.GstAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.ClientMarkupPercent).HasColumnType("decimal(5,2)");
            e.HasOne(x => x.Claim).WithMany(x => x.LineItems).HasForeignKey(x => x.ClaimId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OcrExtractionLog>(e =>
        {
            e.HasKey(x => x.ExtractionId);
            e.Property(x => x.ExtractedAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.ConfidenceScore).HasColumnType("decimal(5,2)");
            e.HasOne(x => x.LineItem).WithOne(x => x.OcrLog).HasForeignKey<OcrExtractionLog>(x => x.LineItemId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReimbursementBatch>(e =>
        {
            e.HasKey(x => x.BatchId);
            e.HasIndex(x => x.BatchCode).IsUnique();
            e.Property(x => x.BatchCode).HasMaxLength(30).IsRequired();
            e.Property(x => x.TotalAmount).HasColumnType("decimal(14,2)");
        });

        modelBuilder.Entity<SectorPolicyConfig>(e =>
        {
            e.HasKey(x => x.SectorConfigId);
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Module 10: Exit Management Fluent Mappings ──────────────────────────
        modelBuilder.Entity<ExitRecord>(e =>
        {
            e.HasKey(x => x.ExitId);
            e.HasIndex(x => new { x.EmployeeId, x.Status });
            e.Property(x => x.ExitType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(40);
            e.Property(x => x.PrimaryReason).HasMaxLength(200).IsRequired();
            e.Property(x => x.BuyoutAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.WithdrawalStatus).HasMaxLength(30);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ConfirmedByUser).WithMany().HasForeignKey(x => x.ConfirmedBy).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ReportingManager).WithMany().HasForeignKey(x => x.ReportingManagerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CounterOffer>(e =>
        {
            e.HasKey(x => x.OfferId);
            e.Property(x => x.CurrentCtc).HasColumnType("decimal(12,2)");
            e.Property(x => x.ProposedCtc).HasColumnType("decimal(12,2)");
            e.Property(x => x.EmployeeResponse).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.ExitRecord).WithMany(x => x.CounterOffers).HasForeignKey(x => x.ExitId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ExitClearance>(e =>
        {
            e.HasKey(x => x.ClearanceId);
            e.Property(x => x.Department).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.DuesAmount).HasColumnType("decimal(10,2)");
            e.HasOne(x => x.ExitRecord).WithMany(x => x.Clearances).HasForeignKey(x => x.ExitId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ClearedByUser).WithMany().HasForeignKey(x => x.ClearedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ExitInterview>(e =>
        {
            e.HasKey(x => x.InterviewId);
            e.Property(x => x.InterviewMode).HasMaxLength(50);
            e.Property(x => x.WouldRecommend).HasMaxLength(50);
            e.HasOne(x => x.ExitRecord).WithOne(x => x.ExitInterview).HasForeignKey<ExitInterview>(x => x.ExitId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FFSCalculation>(e =>
        {
            e.HasKey(x => x.FFSId);
            e.Property(x => x.PendingSalary).HasColumnType("decimal(12,2)");
            e.Property(x => x.LeaveEncashment).HasColumnType("decimal(12,2)");
            e.Property(x => x.Gratuity).HasColumnType("decimal(12,2)");
            e.Property(x => x.ProRataBonus).HasColumnType("decimal(12,2)");
            e.Property(x => x.AssetDeduction).HasColumnType("decimal(12,2)");
            e.Property(x => x.LoanDeduction).HasColumnType("decimal(12,2)");
            e.Property(x => x.NoticeShortfallDeduction).HasColumnType("decimal(12,2)");
            e.Property(x => x.TdsDeduction).HasColumnType("decimal(12,2)");
            e.Property(x => x.GrossPayable).HasColumnType("decimal(12,2)");
            e.Property(x => x.NetPayable).HasColumnType("decimal(12,2)");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.ExitRecord).WithOne(x => x.FFSCalculation).HasForeignKey<FFSCalculation>(x => x.ExitId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ExitDocument>(e =>
        {
            e.HasKey(x => x.DocumentId);
            e.Property(x => x.DocumentType).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.ConductRemark).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.ExitRecord).WithMany(x => x.Documents).HasForeignKey(x => x.ExitId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SectorExitConfig>(e =>
        {
            e.HasKey(x => x.ConfigId);
            e.HasIndex(x => new { x.CompanyId, x.SectorName }).IsUnique();
            e.Property(x => x.SectorName).HasMaxLength(50).IsRequired();
            e.Property(x => x.Priority).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}

