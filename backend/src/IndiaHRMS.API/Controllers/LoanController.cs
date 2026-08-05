using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

/// <summary>
/// TICKET-6: Loans & Salary Advance Recovery
/// Manages employee loans/advances, EMI calculations, payroll recovery, and loan status lifecycle.
/// </summary>
[ApiController]
[Route("api/v1/payroll/loans")]
[Authorize]
public class LoanController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    // In-memory/transient data store structure for loan tracking if DB table is unmigrated
    private static readonly List<EmployeeLoanRecord> _loans = new();
    private static readonly object _lock = new();

    public LoanController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;

        // Seed initial sample loan data if empty
        lock (_lock)
        {
            if (!_loans.Any())
            {
                var empList = _context.Employees.ToList();
                var engEmp1 = empList.FirstOrDefault(e => e.OfficialEmail == "engemp1@company.com");
                var hrAdmin = empList.FirstOrDefault(e => e.OfficialEmail == "hradmin@company.com");
                var engEmp2 = empList.FirstOrDefault(e => e.OfficialEmail == "engemp2@company.com");
                var finEmp1 = empList.FirstOrDefault(e => e.OfficialEmail == "finemp1@company.com");
                var superAdmin = empList.FirstOrDefault(e => e.OfficialEmail == "superadmin@company.com");

                _loans.Add(new EmployeeLoanRecord
                {
                    LoanId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
                    EmployeeId = engEmp1?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000009"),
                    EmployeeCode = engEmp1?.EmployeeCode ?? "EMP0009",
                    EmployeeName = engEmp1 != null ? $"{engEmp1.FirstName} {engEmp1.LastName}" : "Amit EngEmp1",
                    LoanType = "Personal Advance",
                    PrincipalAmount = 120000m,
                    InterestRate = 8.5m,
                    TenureMonths = 12,
                    MonthlyEMI = 10467m,
                    OutstandingBalance = 83736m,
                    DisbursedDate = DateTime.UtcNow.AddMonths(-4),
                    Status = "Active"
                });

                _loans.Add(new EmployeeLoanRecord
                {
                    LoanId = Guid.Parse("22222222-2222-3333-4444-555555555555"),
                    EmployeeId = hrAdmin?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000003"),
                    EmployeeCode = hrAdmin?.EmployeeCode ?? "EMP0003",
                    EmployeeName = hrAdmin != null ? $"{hrAdmin.FirstName} {hrAdmin.LastName}" : "Sneha HRAdmin",
                    LoanType = "Salary Advance",
                    PrincipalAmount = 50000m,
                    InterestRate = 0m,
                    TenureMonths = 5,
                    MonthlyEMI = 10000m,
                    OutstandingBalance = 20000m,
                    DisbursedDate = DateTime.UtcNow.AddMonths(-3),
                    Status = "Active"
                });

                _loans.Add(new EmployeeLoanRecord
                {
                    LoanId = Guid.Parse("33333333-2222-3333-4444-555555555555"),
                    EmployeeId = engEmp2?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000010"),
                    EmployeeCode = engEmp2?.EmployeeCode ?? "EMP0010",
                    EmployeeName = engEmp2 != null ? $"{engEmp2.FirstName} {engEmp2.LastName}" : "Sumit EngEmp2",
                    LoanType = "Festival Advance",
                    PrincipalAmount = 30000m,
                    InterestRate = 0m,
                    TenureMonths = 6,
                    MonthlyEMI = 5000m,
                    OutstandingBalance = 30000m,
                    DisbursedDate = DateTime.UtcNow.AddDays(-2),
                    Status = "Pending"
                });

                _loans.Add(new EmployeeLoanRecord
                {
                    LoanId = Guid.Parse("44444444-2222-3333-4444-555555555555"),
                    EmployeeId = finEmp1?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000012"),
                    EmployeeCode = finEmp1?.EmployeeCode ?? "EMP0012",
                    EmployeeName = finEmp1 != null ? $"{finEmp1.FirstName} {finEmp1.LastName}" : "Vikram FinEmp1",
                    LoanType = "Vehicle Loan",
                    PrincipalAmount = 250000m,
                    InterestRate = 7.5m,
                    TenureMonths = 24,
                    MonthlyEMI = 11250m,
                    OutstandingBalance = 180000m,
                    DisbursedDate = DateTime.UtcNow.AddMonths(-6),
                    Status = "Active"
                });

                _loans.Add(new EmployeeLoanRecord
                {
                    LoanId = Guid.Parse("55555555-2222-3333-4444-555555555555"),
                    EmployeeId = superAdmin?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000001"),
                    EmployeeCode = superAdmin?.EmployeeCode ?? "EMP0001",
                    EmployeeName = superAdmin != null ? $"{superAdmin.FirstName} {superAdmin.LastName}" : "System Admin",
                    LoanType = "Computer Equipment Advance",
                    PrincipalAmount = 80000m,
                    InterestRate = 0m,
                    TenureMonths = 10,
                    MonthlyEMI = 8000m,
                    OutstandingBalance = 0m,
                    DisbursedDate = DateTime.UtcNow.AddMonths(-10),
                    Status = "Closed"
                });
            }
        }
    }

    private bool IsPayrollAdmin =>
        _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead);

    /// <summary>
    /// GET /api/v1/payroll/loans/me
    /// Gets active loans and EMI schedule for logged-in employee.
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyLoans(CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == _currentUser.UserId, ct);
            empId = user?.EmployeeId;
        }

        lock (_lock)
        {
            var myLoans = _loans
                .Where(l => l.EmployeeId == empId.Value || empId == null)
                .OrderByDescending(l => l.DisbursedDate)
                .ToList();

            return Ok(ApiResponse<object>.Ok(myLoans));
        }
    }

    /// <summary>
    /// GET /api/v1/payroll/loans
    /// Admin lists all employee loan records.
    /// </summary>
    [HttpGet]
    public ActionResult<ApiResponse<object>> GetAllLoans([FromQuery] string? status)
    {
        if (!IsPayrollAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only HRAdmin/PayrollAdmin can view company loan registry."));

        lock (_lock)
        {
            var query = _loans.AsQueryable();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(l => l.Status.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));

            return Ok(ApiResponse<object>.Ok(query.ToList()));
        }
    }

    /// <summary>
    /// POST /api/v1/payroll/loans
    /// Admin issues a new loan or salary advance to an employee.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> CreateLoan([FromBody] CreateLoanRequest req, CancellationToken ct)
    {
        if (!IsPayrollAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only HRAdmin/PayrollAdmin can issue loans."));

        var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == req.EmployeeId, ct);
        if (emp == null)
            return NotFound(ApiResponse<object>.Fail("Employee record not found."));

        if (req.PrincipalAmount <= 0)
            return BadRequest(ApiResponse<object>.Fail("Principal amount must be greater than zero."));
        if (req.TenureMonths <= 0)
            return BadRequest(ApiResponse<object>.Fail("Tenure months must be at least 1."));

        // Calculate monthly EMI (simple flat interest or 0% for salary advance)
        decimal totalInterest = req.PrincipalAmount * (req.InterestRate / 100m) * (req.TenureMonths / 12m);
        decimal totalRepayable = req.PrincipalAmount + totalInterest;
        decimal emi = Math.Round(totalRepayable / req.TenureMonths, 2);

        var record = new EmployeeLoanRecord
        {
            LoanId = Guid.NewGuid(),
            EmployeeId = emp.EmployeeId,
            EmployeeCode = emp.EmployeeCode,
            EmployeeName = $"{emp.FirstName} {emp.LastName}",
            LoanType = string.IsNullOrWhiteSpace(req.LoanType) ? "Personal Loan" : req.LoanType.Trim(),
            PrincipalAmount = req.PrincipalAmount,
            InterestRate = req.InterestRate,
            TenureMonths = req.TenureMonths,
            MonthlyEMI = emi,
            OutstandingBalance = totalRepayable,
            DisbursedDate = DateTime.UtcNow,
            Status = "Active"
        };

        lock (_lock)
        {
            _loans.Add(record);
        }

        return CreatedAtAction(nameof(GetMyLoans), ApiResponse<object>.Ok(record, "Loan issued successfully and EMI recovery scheduled."));
    }

    /// <summary>
    /// PUT /api/v1/payroll/loans/{id}/deduct-emi
    /// Deducts a monthly EMI payment (e.g. during payroll processing or manual recovery).
    /// </summary>
    [HttpPut("{id}/deduct-emi")]
    public ActionResult<ApiResponse<object>> DeductEMI(Guid id, [FromQuery] decimal? customAmount)
    {
        if (!IsPayrollAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only PayrollAdmin can process EMI recovery."));

        lock (_lock)
        {
            var loan = _loans.FirstOrDefault(l => l.LoanId == id);
            if (loan == null)
                return NotFound(ApiResponse<object>.Fail("Loan record not found."));

            if (loan.Status == "Closed")
                return BadRequest(ApiResponse<object>.Fail("This loan is already fully settled and closed."));

            decimal recovery = customAmount ?? loan.MonthlyEMI;
            loan.OutstandingBalance = Math.Max(0m, loan.OutstandingBalance - recovery);

            if (loan.OutstandingBalance == 0m)
            {
                loan.Status = "Closed";
            }

            return Ok(ApiResponse<object>.Ok(new
            {
                loan.LoanId,
                deductedAmount = recovery,
                remainingBalance = loan.OutstandingBalance,
                loan.Status
            }, loan.Status == "Closed" ? "EMI deducted. Loan fully repaid and closed!" : $"EMI of ₹{recovery:N2} recovered successfully."));
        }
    }

    /// <summary>
    /// PUT /api/v1/payroll/loans/{id}/close
    /// Admin early-closes or writes off an active loan.
    /// </summary>
    [HttpPut("{id}/close")]
    public ActionResult<ApiResponse<object>> CloseLoan(Guid id, [FromBody] CloseLoanRequest req)
    {
        if (!IsPayrollAdmin)
            return StatusCode(403, ApiResponse<object>.Fail("Only PayrollAdmin can close loans."));

        lock (_lock)
        {
            var loan = _loans.FirstOrDefault(l => l.LoanId == id);
            if (loan == null)
                return NotFound(ApiResponse<object>.Fail("Loan record not found."));

            loan.OutstandingBalance = 0m;
            loan.Status = string.IsNullOrWhiteSpace(req.Reason) ? "Closed" : $"Closed ({req.Reason.Trim()})";

            return Ok(ApiResponse<object>.Ok(new { loan.LoanId, loan.Status }, "Loan closed successfully."));
        }
    }
}

public class EmployeeLoanRecord
{
    public Guid LoanId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string LoanType { get; set; } = "Salary Advance";
    public decimal PrincipalAmount { get; set; }
    public decimal InterestRate { get; set; }
    public int TenureMonths { get; set; }
    public decimal MonthlyEMI { get; set; }
    public decimal OutstandingBalance { get; set; }
    public DateTime DisbursedDate { get; set; }
    public string Status { get; set; } = "Active";
}

public class CreateLoanRequest
{
    public Guid EmployeeId { get; set; }
    public string LoanType { get; set; } = "Salary Advance";
    public decimal PrincipalAmount { get; set; }
    public decimal InterestRate { get; set; } = 0m;
    public int TenureMonths { get; set; } = 6;
}

public class CloseLoanRequest
{
    public string Reason { get; set; } = "Full Repayment";
}
