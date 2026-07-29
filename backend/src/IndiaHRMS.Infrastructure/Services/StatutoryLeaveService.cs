using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class StatutoryLeaveService : IStatutoryLeaveService
{
    private readonly AppDbContext _context;
    private readonly ILogger<StatutoryLeaveService> _logger;

    public StatutoryLeaveService(AppDbContext context, ILogger<StatutoryLeaveService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<StatutoryLeaveEventDto> ApplyMaternityLeaveAsync(ApplyMaternityLeaveDto dto)
    {
        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
            throw new KeyNotFoundException("Employee not found.");

        // Calculate entitlement based on Maternity Benefit Act 1961 (2017 Amendment)
        int entitlementDays = 182; // 26 weeks standard for 1st & 2nd child
        if (dto.Category.Equals("Adoption", StringComparison.OrdinalIgnoreCase) ||
            dto.Category.Equals("Commissioning", StringComparison.OrdinalIgnoreCase))
        {
            entitlementDays = 84; // 12 weeks for adoption of child < 3 months
        }
        else if (dto.ChildOrder >= 3)
        {
            entitlementDays = 84; // 12 weeks for 3rd child onwards
        }

        // Get Maternity Leave Type (ML)
        var mlType = await _context.LeaveTypes.FirstOrDefaultAsync(l => l.LeaveCode == "ML");
        if (mlType == null)
        {
            mlType = new LeaveType
            {
                CompanyId = employee.CompanyId,
                LeaveCode = "ML",
                LeaveTypeName = "Maternity Leave",
                IsPaidLeave = true,
                MaxDaysPerYear = 182,
                ApplicableGender = "Female"
            };
            _context.LeaveTypes.Add(mlType);
            await _context.SaveChangesAsync();
        }

        // Create Statutory Event record
        var statEvent = new StatutoryLeaveEvent
        {
            EmployeeId = dto.EmployeeId,
            EventType = dto.Category.Equals("Adoption", StringComparison.OrdinalIgnoreCase) ? "Adoption" : "Maternity",
            EventDate = dto.FromDate,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            ChildOrder = dto.ChildOrder,
            EntitlementDays = entitlementDays,
            MedicalCertPath = dto.MedicalCertPath,
            Status = "Approved",
            CreatedAt = DateTime.UtcNow
        };

        _context.StatutoryLeaveEvents.Add(statEvent);

        // Also create a Leave Application record automatically
        var app = new LeaveApplication
        {
            EmployeeId = dto.EmployeeId,
            LeaveTypeId = mlType.LeaveTypeId,
            FromDate = dto.FromDate,
            ToDate = dto.FromDate.AddDays(entitlementDays - 1),
            TotalDays = entitlementDays,
            IsHalfDay = false,
            Reason = $"Maternity Leave ({dto.Category}, Child Order #{dto.ChildOrder}): {dto.Remarks}",
            Status = Domain.Enums.LeaveStatus.Approved,
            AppliedAt = DateTime.UtcNow
        };

        _context.LeaveApplications.Add(app);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Applied Maternity Leave for Employee {EmpId}, Entitlement: {Days} days", dto.EmployeeId, entitlementDays);

        return new StatutoryLeaveEventDto
        {
            EventId = statEvent.EventId,
            EmployeeId = statEvent.EmployeeId,
            EmployeeName = $"{employee.FirstName} {employee.LastName}",
            EventType = statEvent.EventType,
            EventDate = statEvent.EventDate,
            ExpectedDeliveryDate = statEvent.ExpectedDeliveryDate,
            ChildOrder = statEvent.ChildOrder,
            EntitlementDays = statEvent.EntitlementDays,
            MedicalCertPath = statEvent.MedicalCertPath,
            Status = statEvent.Status
        };
    }

    public async Task<StatutoryLeaveEventDto> ApplyPaternityLeaveAsync(ApplyPaternityLeaveDto dto)
    {
        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
            throw new KeyNotFoundException("Employee not found.");

        if (dto.ChildOrder > 2)
        {
            throw new InvalidOperationException("Paternity leave entitlement applies to maximum of first 2 surviving children.");
        }

        int entitlementDays = 15; // 15 days paid paternity leave

        // Get Paternity Leave Type (PL_PAT)
        var patType = await _context.LeaveTypes.FirstOrDefaultAsync(l => l.LeaveCode == "PL_PAT");
        if (patType == null)
        {
            patType = new LeaveType
            {
                CompanyId = employee.CompanyId,
                LeaveCode = "PL_PAT",
                LeaveTypeName = "Paternity Leave",
                IsPaidLeave = true,
                MaxDaysPerYear = 15,
                ApplicableGender = "Male"
            };
            _context.LeaveTypes.Add(patType);
            await _context.SaveChangesAsync();
        }

        var statEvent = new StatutoryLeaveEvent
        {
            EmployeeId = dto.EmployeeId,
            EventType = "Paternity",
            EventDate = dto.ChildBirthDate,
            ChildOrder = dto.ChildOrder,
            EntitlementDays = entitlementDays,
            MedicalCertPath = dto.BirthCertificatePath,
            Status = "Approved",
            CreatedAt = DateTime.UtcNow
        };

        _context.StatutoryLeaveEvents.Add(statEvent);

        var app = new LeaveApplication
        {
            EmployeeId = dto.EmployeeId,
            LeaveTypeId = patType.LeaveTypeId,
            FromDate = dto.FromDate,
            ToDate = dto.FromDate.AddDays(entitlementDays - 1),
            TotalDays = entitlementDays,
            IsHalfDay = false,
            Reason = $"Paternity Leave (Child Order #{dto.ChildOrder}): {dto.Remarks}",
            Status = Domain.Enums.LeaveStatus.Approved,
            AppliedAt = DateTime.UtcNow
        };

        _context.LeaveApplications.Add(app);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Applied Paternity Leave for Employee {EmpId}, Entitlement: 15 days", dto.EmployeeId);

        return new StatutoryLeaveEventDto
        {
            EventId = statEvent.EventId,
            EmployeeId = statEvent.EmployeeId,
            EmployeeName = $"{employee.FirstName} {employee.LastName}",
            EventType = statEvent.EventType,
            EventDate = statEvent.EventDate,
            ExpectedDeliveryDate = null,
            ChildOrder = statEvent.ChildOrder,
            EntitlementDays = statEvent.EntitlementDays,
            MedicalCertPath = statEvent.MedicalCertPath,
            Status = statEvent.Status
        };
    }

    public async Task<IEnumerable<StatutoryLeaveEventDto>> GetEmployeeStatutoryEventsAsync(Guid employeeId)
    {
        var events = await _context.StatutoryLeaveEvents
            .Include(s => s.Employee)
            .Where(s => s.EmployeeId == employeeId)
            .OrderByDescending(s => s.EventDate)
            .ToListAsync();

        return events.Select(s => new StatutoryLeaveEventDto
        {
            EventId = s.EventId,
            EmployeeId = s.EmployeeId,
            EmployeeName = s.Employee != null ? $"{s.Employee.FirstName} {s.Employee.LastName}" : "Employee",
            EventType = s.EventType,
            EventDate = s.EventDate,
            ExpectedDeliveryDate = s.ExpectedDeliveryDate,
            ChildOrder = s.ChildOrder,
            EntitlementDays = s.EntitlementDays,
            MedicalCertPath = s.MedicalCertPath,
            Status = s.Status
        });
    }
}
