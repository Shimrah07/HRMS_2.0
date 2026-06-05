using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace IndiaHRMS.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _dbSet.FindAsync(new object[] { id }, ct);

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
        => await _dbSet.ToListAsync(ct);

    public async Task<PagedList<T>> GetPagedAsync(PaginationRequest request, Expression<Func<T, bool>>? filter = null, CancellationToken ct = default)
    {
        IQueryable<T> query = _dbSet;
        if (filter != null) query = query.Where(filter);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return new PagedList<T>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _dbSet.AddAsync(entity, ct);
        return entity;
    }

    public Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        => await _dbSet.AnyAsync(predicate, ct);

    public IQueryable<T> Query() => _dbSet.AsQueryable();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? _transaction;

    public IRepository<User> Users { get; }
    public IRepository<Role> Roles { get; }
    public IRepository<Permission> Permissions { get; }
    public IRepository<UserRole> UserRoles { get; }
    public IRepository<RolePermission> RolePermissions { get; }
    public IRepository<AuditLog> AuditLogs { get; }
    public IRepository<Company> Companies { get; }
    public IRepository<Department> Departments { get; }
    public IRepository<Designation> Designations { get; }
    public IRepository<Location> Locations { get; }
    public IRepository<CostCenter> CostCenters { get; }
    public IRepository<Employee> Employees { get; }
    public IRepository<EmployeeDocument> EmployeeDocuments { get; }
    public IRepository<EmployeeBankDetail> EmployeeBankDetails { get; }
    public IRepository<EmployeeEducation> EmployeeEducations { get; }
    public IRepository<EmployeeExperience> EmployeeExperiences { get; }
    public IRepository<PFNominee> PFNominees { get; }
    public IRepository<ShiftMaster> ShiftMasters { get; }
    public IRepository<EmployeeShift> EmployeeShifts { get; }
    public IRepository<HolidayCalendar> HolidayCalendars { get; }
    public IRepository<AttendanceRecord> AttendanceRecords { get; }
    public IRepository<AttendanceRegularization> AttendanceRegularizations { get; }
    public IRepository<LeaveType> LeaveTypes { get; }
    public IRepository<LeaveBalance> LeaveBalances { get; }
    public IRepository<LeaveApplication> LeaveApplications { get; }
    public IRepository<SalaryComponent> SalaryComponents { get; }
    public IRepository<SalaryStructure> SalaryStructures { get; }
    public IRepository<StructureComponent> StructureComponents { get; }
    public IRepository<EmployeeSalary> EmployeeSalaries { get; }
    public IRepository<PayrollRun> PayrollRuns { get; }
    public IRepository<PayrollDetail> PayrollDetails { get; }
    public IRepository<TaxDeclaration> TaxDeclarations { get; }
    public IRepository<JobRequisition> JobRequisitions { get; }
    public IRepository<Candidate> Candidates { get; }
    public IRepository<JobApplication> JobApplications { get; }
    public IRepository<InterviewRound> InterviewRounds { get; }
    public IRepository<OfferLetter> OfferLetters { get; }
    public IRepository<AppraisalCycle> AppraisalCycles { get; }
    public IRepository<EmployeeGoal> EmployeeGoals { get; }
    public IRepository<PerformanceReview> PerformanceReviews { get; }
    public IRepository<PIP> PIPs { get; }
    public IRepository<TrainingProgram> TrainingPrograms { get; }
    public IRepository<TrainingSchedule> TrainingSchedules { get; }
    public IRepository<TrainingNomination> TrainingNominations { get; }
    public IRepository<Separation> Separations { get; }
    public IRepository<NoDuesClearing> NoDuesItems { get; }
    public IRepository<FnFSettlement> FnFSettlements { get; }
    public IRepository<Notification> Notifications { get; }
    public IRepository<SystemSetting> SystemSettings { get; }
    public IRepository<EmailTemplate> EmailTemplates { get; }

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Users = new Repository<User>(context);
        Roles = new Repository<Role>(context);
        Permissions = new Repository<Permission>(context);
        UserRoles = new Repository<UserRole>(context);
        RolePermissions = new Repository<RolePermission>(context);
        AuditLogs = new Repository<AuditLog>(context);
        Companies = new Repository<Company>(context);
        Departments = new Repository<Department>(context);
        Designations = new Repository<Designation>(context);
        Locations = new Repository<Location>(context);
        CostCenters = new Repository<CostCenter>(context);
        Employees = new Repository<Employee>(context);
        EmployeeDocuments = new Repository<EmployeeDocument>(context);
        EmployeeBankDetails = new Repository<EmployeeBankDetail>(context);
        EmployeeEducations = new Repository<EmployeeEducation>(context);
        EmployeeExperiences = new Repository<EmployeeExperience>(context);
        PFNominees = new Repository<PFNominee>(context);
        ShiftMasters = new Repository<ShiftMaster>(context);
        EmployeeShifts = new Repository<EmployeeShift>(context);
        HolidayCalendars = new Repository<HolidayCalendar>(context);
        AttendanceRecords = new Repository<AttendanceRecord>(context);
        AttendanceRegularizations = new Repository<AttendanceRegularization>(context);
        LeaveTypes = new Repository<LeaveType>(context);
        LeaveBalances = new Repository<LeaveBalance>(context);
        LeaveApplications = new Repository<LeaveApplication>(context);
        SalaryComponents = new Repository<SalaryComponent>(context);
        SalaryStructures = new Repository<SalaryStructure>(context);
        StructureComponents = new Repository<StructureComponent>(context);
        EmployeeSalaries = new Repository<EmployeeSalary>(context);
        PayrollRuns = new Repository<PayrollRun>(context);
        PayrollDetails = new Repository<PayrollDetail>(context);
        TaxDeclarations = new Repository<TaxDeclaration>(context);
        JobRequisitions = new Repository<JobRequisition>(context);
        Candidates = new Repository<Candidate>(context);
        JobApplications = new Repository<JobApplication>(context);
        InterviewRounds = new Repository<InterviewRound>(context);
        OfferLetters = new Repository<OfferLetter>(context);
        AppraisalCycles = new Repository<AppraisalCycle>(context);
        EmployeeGoals = new Repository<EmployeeGoal>(context);
        PerformanceReviews = new Repository<PerformanceReview>(context);
        PIPs = new Repository<PIP>(context);
        TrainingPrograms = new Repository<TrainingProgram>(context);
        TrainingSchedules = new Repository<TrainingSchedule>(context);
        TrainingNominations = new Repository<TrainingNomination>(context);
        Separations = new Repository<Separation>(context);
        NoDuesItems = new Repository<NoDuesClearing>(context);
        FnFSettlements = new Repository<FnFSettlement>(context);
        Notifications = new Repository<Notification>(context);
        SystemSettings = new Repository<SystemSetting>(context);
        EmailTemplates = new Repository<EmailTemplate>(context);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);

    public async Task BeginTransactionAsync(CancellationToken ct = default)
        => _transaction = await _context.Database.BeginTransactionAsync(ct);

    public async Task CommitTransactionAsync(CancellationToken ct = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(ct);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken ct = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(ct);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
