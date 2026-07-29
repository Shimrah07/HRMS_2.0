using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class LeaveEncashmentService : ILeaveEncashmentService
{
    private readonly AppDbContext _context;
    private readonly ILogger<LeaveEncashmentService> _logger;

    public LeaveEncashmentService(AppDbContext context, ILogger<LeaveEncashmentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<LeaveEncashmentDto> ProcessLeaveEncashmentAsync(ProcessEncashmentRequestDto dto)
    {
        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
            throw new KeyNotFoundException("Employee not found.");

        var leaveType = await _context.LeaveTypes.FindAsync(dto.LeaveTypeId);
        if (leaveType == null)
            throw new KeyNotFoundException("Leave type not found.");

        // Check if encashable
        if (!leaveType.IsEncashable)
        {
            throw new InvalidOperationException($"Leave type '{leaveType.LeaveTypeName}' is not configured for encashment.");
        }

        // Check employee closing balance for current year
        var currentYear = DateTime.UtcNow.Year;
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.EmployeeId == dto.EmployeeId && b.LeaveTypeId == dto.LeaveTypeId && b.Year == currentYear);

        decimal availableDays = balance?.ClosingBalance ?? 0m;
        if (availableDays < dto.DaysToEncash)
        {
            throw new InvalidOperationException($"Insufficient leave balance ({availableDays} days available) to encash {dto.DaysToEncash} days.");
        }

        // Daily Rate Formula: (Basic + DA) / 26
        decimal dailyRate = (dto.BasicSalary + dto.DearnessAllowance) / 26.0m;
        decimal totalAmount = Math.Round(dailyRate * dto.DaysToEncash, 2);

        // Income Tax Act Section 10(10AA) Exemption Calculation
        decimal taxExemptAmount = 0m;
        decimal taxableAmount = totalAmount;

        if (dto.EncashmentType.Equals("ExitSettlement", StringComparison.OrdinalIgnoreCase))
        {
            if (dto.IsGovernmentEmployee)
            {
                // Fully exempt for Central/State Govt employees upon retirement/exit
                taxExemptAmount = totalAmount;
                taxableAmount = 0m;
            }
            else
            {
                // Non-Government employees: Exempt least of:
                // 1. Actual amount received
                // 2. Statutory limit (₹25,00,000 post Union Budget 2023)
                // 3. 10 months average salary
                // 4. Cash equivalent of leave balance (max 30 days per year of service)
                decimal statutoryCap = 2500000m;
                decimal tenMonthsSalary = 10 * (dto.BasicSalary + dto.DearnessAllowance);
                taxExemptAmount = Math.Min(totalAmount, Math.Min(statutoryCap, tenMonthsSalary));
                taxableAmount = Math.Max(0, totalAmount - taxExemptAmount);
            }
        }
        else
        {
            // Leave encashment during service (Year-End) is fully taxable for non-govt employees
            taxExemptAmount = dto.IsGovernmentEmployee ? totalAmount : 0m;
            taxableAmount = totalAmount - taxExemptAmount;
        }

        // Deduct encashed days from LeaveBalance
        if (balance != null)
        {
            balance.Encashed += dto.DaysToEncash;
            balance.ClosingBalance -= dto.DaysToEncash;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        // Audit log in LeaveLedger
        var ledger = new LeaveLedger
        {
            EmployeeId = dto.EmployeeId,
            LeaveTypeId = dto.LeaveTypeId,
            TxnType = "Encashed",
            TxnDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Days = dto.DaysToEncash,
            RunningBalance = balance?.ClosingBalance ?? 0m,
            Remarks = $"Encashment Processed ({dto.EncashmentType}): ₹{totalAmount} (Exempt: ₹{taxExemptAmount}, Taxable: ₹{taxableAmount})",
            CreatedAt = DateTime.UtcNow
        };
        _context.LeaveLedgers.Add(ledger);

        // Record Encashment
        var encashment = new LeaveEncashment
        {
            EmployeeId = dto.EmployeeId,
            LeaveTypeId = dto.LeaveTypeId,
            DaysEncashed = dto.DaysToEncash,
            DailyRate = Math.Round(dailyRate, 2),
            TotalAmount = totalAmount,
            TaxExemptAmount = Math.Round(taxExemptAmount, 2),
            TaxableAmount = Math.Round(taxableAmount, 2),
            ProcessedMonth = DateTime.UtcNow.ToString("yyyy-MM"),
            Status = "Processed",
            CreatedAt = DateTime.UtcNow
        };

        _context.LeaveEncashments.Add(encashment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Processed Leave Encashment for Emp {EmpId}: {Days} days = ₹{Total}", dto.EmployeeId, dto.DaysToEncash, totalAmount);

        return new LeaveEncashmentDto
        {
            EncashmentId = encashment.EncashmentId,
            EmployeeId = encashment.EmployeeId,
            EmployeeName = $"{employee.FirstName} {employee.LastName}",
            LeaveTypeName = leaveType.LeaveTypeName,
            DaysEncashed = encashment.DaysEncashed,
            DailyRate = encashment.DailyRate,
            TotalAmount = encashment.TotalAmount,
            TaxExemptAmount = encashment.TaxExemptAmount,
            TaxableAmount = encashment.TaxableAmount,
            ProcessedMonth = encashment.ProcessedMonth,
            Status = encashment.Status
        };
    }

    public async Task<YearEndCarryForwardResultDto> RunYearEndCarryForwardAsync(Guid companyId, int fromYear)
    {
        int toYear = fromYear + 1;
        var employees = await _context.Employees.Where(e => e.CompanyId == companyId && e.IsActive).ToListAsync();
        var leaveTypes = await _context.LeaveTypes.Where(l => l.CompanyId == companyId && l.IsActive).ToListAsync();

        int processedCount = 0;
        decimal totalCarriedForward = 0m;
        decimal totalLapsed = 0m;

        foreach (var emp in employees)
        {
            foreach (var lt in leaveTypes)
            {
                var oldBalance = await _context.LeaveBalances
                    .FirstOrDefaultAsync(b => b.EmployeeId == emp.EmployeeId && b.LeaveTypeId == lt.LeaveTypeId && b.Year == fromYear);

                if (oldBalance == null || oldBalance.ClosingBalance <= 0) continue;

                decimal available = oldBalance.ClosingBalance;
                decimal carryForward = 0m;
                decimal lapsed = 0m;

                if (lt.IsCarryForward)
                {
                    carryForward = Math.Min(available, lt.MaxCarryForwardDays);
                    lapsed = available - carryForward;
                }
                else
                {
                    lapsed = available;
                }

                // Update old year lapse
                if (lapsed > 0)
                {
                    oldBalance.Lapsed += lapsed;
                    oldBalance.ClosingBalance -= lapsed;
                    oldBalance.UpdatedAt = DateTime.UtcNow;

                    _context.LeaveLedgers.Add(new LeaveLedger
                    {
                        EmployeeId = emp.EmployeeId,
                        LeaveTypeId = lt.LeaveTypeId,
                        TxnType = "Lapsed",
                        TxnDate = new DateOnly(fromYear, 12, 31),
                        Days = lapsed,
                        RunningBalance = oldBalance.ClosingBalance,
                        Remarks = $"Year-End Lapsed Balance for {fromYear}",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                // Create or update new year balance
                var newBalance = await _context.LeaveBalances
                    .FirstOrDefaultAsync(b => b.EmployeeId == emp.EmployeeId && b.LeaveTypeId == lt.LeaveTypeId && b.Year == toYear);

                if (newBalance == null)
                {
                    newBalance = new LeaveBalance
                    {
                        EmployeeId = emp.EmployeeId,
                        LeaveTypeId = lt.LeaveTypeId,
                        Year = toYear,
                        OpeningBalance = carryForward,
                        Accrued = 0m,
                        Taken = 0m,
                        Encashed = 0m,
                        Lapsed = 0m,
                        ClosingBalance = carryForward,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.LeaveBalances.Add(newBalance);
                }
                else
                {
                    newBalance.OpeningBalance += carryForward;
                    newBalance.ClosingBalance += carryForward;
                    newBalance.UpdatedAt = DateTime.UtcNow;
                }

                if (carryForward > 0)
                {
                    _context.LeaveLedgers.Add(new LeaveLedger
                    {
                        EmployeeId = emp.EmployeeId,
                        LeaveTypeId = lt.LeaveTypeId,
                        TxnType = "CarriedForward",
                        TxnDate = new DateOnly(toYear, 1, 1),
                        Days = carryForward,
                        RunningBalance = newBalance.ClosingBalance,
                        Remarks = $"Carried forward from year {fromYear}",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                totalCarriedForward += carryForward;
                totalLapsed += lapsed;
            }
            processedCount++;
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Executed Year-End Carry Forward {From} -> {To}: Processed {Count} employees, Carried {CF} days, Lapsed {L} days",
            fromYear, toYear, processedCount, totalCarriedForward, totalLapsed);

        return new YearEndCarryForwardResultDto
        {
            FromYear = fromYear,
            ToYear = toYear,
            EmployeesProcessed = processedCount,
            TotalDaysCarriedForward = totalCarriedForward,
            TotalDaysLapsed = totalLapsed
        };
    }

    public async Task<IEnumerable<LeaveEncashmentDto>> GetEmployeeEncashmentsAsync(Guid employeeId)
    {
        var list = await _context.LeaveEncashments
            .Include(e => e.Employee)
            .Include(e => e.LeaveType)
            .Where(e => e.EmployeeId == employeeId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return list.Select(e => new LeaveEncashmentDto
        {
            EncashmentId = e.EncashmentId,
            EmployeeId = e.EmployeeId,
            EmployeeName = e.Employee != null ? $"{e.Employee.FirstName} {e.Employee.LastName}" : "Employee",
            LeaveTypeName = e.LeaveType != null ? e.LeaveType.LeaveTypeName : "Privilege Leave",
            DaysEncashed = e.DaysEncashed,
            DailyRate = e.DailyRate,
            TotalAmount = e.TotalAmount,
            TaxExemptAmount = e.TaxExemptAmount,
            TaxableAmount = e.TaxableAmount,
            ProcessedMonth = e.ProcessedMonth,
            Status = e.Status
        });
    }
}
