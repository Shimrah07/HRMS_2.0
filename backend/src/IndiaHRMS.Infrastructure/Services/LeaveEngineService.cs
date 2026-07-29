using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class LeaveEngineService : ILeaveEngineService
{
    private readonly AppDbContext _context;
    private readonly ILogger<LeaveEngineService> _logger;

    public LeaveEngineService(AppDbContext context, ILogger<LeaveEngineService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<LeaveBalanceDto>> GetEmployeeBalancesAsync(Guid employeeId, int year)
    {
        // Ensure balances exist for current year
        await InitializeEmployeeBalancesForYearAsync(employeeId, year);

        var balances = await _context.LeaveBalances
            .Include(b => b.LeaveType)
            .Where(b => b.EmployeeId == employeeId && b.Year == year)
            .ToListAsync();

        return balances.Select(b => new LeaveBalanceDto
        {
            BalanceId = b.BalanceId,
            EmployeeId = b.EmployeeId,
            LeaveTypeId = b.LeaveTypeId,
            LeaveTypeName = b.LeaveType?.LeaveTypeName ?? string.Empty,
            LeaveCode = b.LeaveType?.LeaveCode ?? string.Empty,
            Year = b.Year,
            OpeningBalance = b.OpeningBalance,
            Accrued = b.Accrued,
            Taken = b.Taken,
            Encashed = b.Encashed,
            Lapsed = b.Lapsed,
            ClosingBalance = b.ClosingBalance
        });
    }

    public async Task<IEnumerable<LeaveLedgerDto>> GetEmployeeLedgerAsync(Guid employeeId, Guid? leaveTypeId = null, int? year = null)
    {
        var query = _context.LeaveLedgers
            .Include(l => l.LeaveType)
            .Where(l => l.EmployeeId == employeeId);

        if (leaveTypeId.HasValue)
        {
            query = query.Where(l => l.LeaveTypeId == leaveTypeId.Value);
        }

        if (year.HasValue)
        {
            query = query.Where(l => l.TxnDate.Year == year.Value);
        }

        var list = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

        return list.Select(l => new LeaveLedgerDto
        {
            LedgerId = l.LedgerId,
            EmployeeId = l.EmployeeId,
            LeaveTypeId = l.LeaveTypeId,
            LeaveTypeName = l.LeaveType?.LeaveTypeName ?? string.Empty,
            LeaveCode = l.LeaveType?.LeaveCode ?? string.Empty,
            TxnType = l.TxnType,
            TxnDate = l.TxnDate,
            Days = l.Days,
            RunningBalance = l.RunningBalance,
            ReferenceId = l.ReferenceId,
            Remarks = l.Remarks,
            CreatedAt = l.CreatedAt
        });
    }

    public async Task<LeaveBalanceDto> AdjustBalanceAsync(AdjustLeaveBalanceDto dto)
    {
        var balance = await _context.LeaveBalances
            .Include(b => b.LeaveType)
            .FirstOrDefaultAsync(b => b.EmployeeId == dto.EmployeeId && b.LeaveTypeId == dto.LeaveTypeId && b.Year == dto.Year);

        if (balance == null)
        {
            balance = new LeaveBalance
            {
                EmployeeId = dto.EmployeeId,
                LeaveTypeId = dto.LeaveTypeId,
                Year = dto.Year,
                OpeningBalance = 0,
                Accrued = 0,
                Taken = 0,
                Encashed = 0,
                Lapsed = 0,
                ClosingBalance = 0,
                CreatedAt = DateTime.UtcNow
            };
            _context.LeaveBalances.Add(balance);
        }

        if (dto.AdjustmentDays > 0)
        {
            balance.Accrued += dto.AdjustmentDays;
        }
        else
        {
            balance.Lapsed += Math.Abs(dto.AdjustmentDays);
        }

        balance.ClosingBalance = balance.OpeningBalance + balance.Accrued - balance.Taken - balance.Encashed - balance.Lapsed;
        balance.UpdatedAt = DateTime.UtcNow;

        var ledgerEntry = new LeaveLedger
        {
            EmployeeId = dto.EmployeeId,
            LeaveTypeId = dto.LeaveTypeId,
            TxnType = "Adjustment",
            TxnDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Days = dto.AdjustmentDays,
            RunningBalance = balance.ClosingBalance,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow
        };

        _context.LeaveLedgers.Add(ledgerEntry);
        await _context.SaveChangesAsync();

        return new LeaveBalanceDto
        {
            BalanceId = balance.BalanceId,
            EmployeeId = balance.EmployeeId,
            LeaveTypeId = balance.LeaveTypeId,
            LeaveTypeName = balance.LeaveType?.LeaveTypeName ?? string.Empty,
            LeaveCode = balance.LeaveType?.LeaveCode ?? string.Empty,
            Year = balance.Year,
            OpeningBalance = balance.OpeningBalance,
            Accrued = balance.Accrued,
            Taken = balance.Taken,
            Encashed = balance.Encashed,
            Lapsed = balance.Lapsed,
            ClosingBalance = balance.ClosingBalance
        };
    }

    public async Task<int> RunMonthlyAccrualAsync(int year, int month)
    {
        var activeEmployees = await _context.Employees.Where(e => e.IsActive).ToListAsync();
        var leaveTypes = await _context.LeaveTypes.Where(l => l.IsActive && l.AccrualFrequency == "Monthly").ToListAsync();

        int processedCount = 0;

        foreach (var emp in activeEmployees)
        {
            foreach (var lt in leaveTypes)
            {
                var balance = await _context.LeaveBalances
                    .FirstOrDefaultAsync(b => b.EmployeeId == emp.EmployeeId && b.LeaveTypeId == lt.LeaveTypeId && b.Year == year);

                if (balance == null)
                {
                    balance = new LeaveBalance
                    {
                        EmployeeId = emp.EmployeeId,
                        LeaveTypeId = lt.LeaveTypeId,
                        Year = year,
                        OpeningBalance = 0,
                        Accrued = 0,
                        Taken = 0,
                        Encashed = 0,
                        Lapsed = 0,
                        ClosingBalance = 0,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.LeaveBalances.Add(balance);
                }

                decimal monthlyAccrual = lt.AccrualRate > 0 ? lt.AccrualRate : (lt.MaxDaysPerYear > 0 ? Math.Round((decimal)lt.MaxDaysPerYear / 12m, 2) : 0m);

                if (monthlyAccrual > 0)
                {
                    balance.Accrued += monthlyAccrual;
                    balance.ClosingBalance = balance.OpeningBalance + balance.Accrued - balance.Taken - balance.Encashed - balance.Lapsed;
                    balance.UpdatedAt = DateTime.UtcNow;

                    var ledger = new LeaveLedger
                    {
                        EmployeeId = emp.EmployeeId,
                        LeaveTypeId = lt.LeaveTypeId,
                        TxnType = "Accrual",
                        TxnDate = new DateOnly(year, month, 1),
                        Days = monthlyAccrual,
                        RunningBalance = balance.ClosingBalance,
                        Remarks = $"Automated monthly accrual ({month:D2}/{year})",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.LeaveLedgers.Add(ledger);
                    processedCount++;
                }
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Completed monthly accrual for {Month}/{Year}. Processed {Count} entries.", month, year, processedCount);
        return processedCount;
    }

    public async Task InitializeEmployeeBalancesForYearAsync(Guid employeeId, int year)
    {
        var employee = await _context.Employees.FindAsync(employeeId);
        if (employee == null) return;

        var leaveTypes = await _context.LeaveTypes.Where(l => l.IsActive).ToListAsync();

        foreach (var lt in leaveTypes)
        {
            var exists = await _context.LeaveBalances
                .AnyAsync(b => b.EmployeeId == employeeId && b.LeaveTypeId == lt.LeaveTypeId && b.Year == year);

            if (!exists)
            {
                decimal initialQuota = lt.MaxDaysPerYear;

                // Mid-Year Pro-Rata Calculation
                if (lt.ProRataForMidYear && employee.JoiningDate.Year == year)
                {
                    int remainingMonths = 12 - employee.JoiningDate.Month + 1;
                    initialQuota = Math.Round((lt.MaxDaysPerYear / 12m) * remainingMonths, 1);
                }

                var balance = new LeaveBalance
                {
                    EmployeeId = employeeId,
                    LeaveTypeId = lt.LeaveTypeId,
                    Year = year,
                    OpeningBalance = lt.AccrualFrequency == "Annual" ? initialQuota : 0,
                    Accrued = lt.AccrualFrequency == "Annual" ? initialQuota : 0,
                    Taken = 0,
                    Encashed = 0,
                    Lapsed = 0,
                    ClosingBalance = lt.AccrualFrequency == "Annual" ? initialQuota : 0,
                    CreatedAt = DateTime.UtcNow
                };

                _context.LeaveBalances.Add(balance);

                if (balance.OpeningBalance > 0)
                {
                    var ledger = new LeaveLedger
                    {
                        EmployeeId = employeeId,
                        LeaveTypeId = lt.LeaveTypeId,
                        TxnType = "Opening",
                        TxnDate = new DateOnly(year, 1, 1),
                        Days = balance.OpeningBalance,
                        RunningBalance = balance.ClosingBalance,
                        Remarks = $"Annual quota initialization ({year})",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.LeaveLedgers.Add(ledger);
                }
            }
        }

        await _context.SaveChangesAsync();
    }
}
