using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Filters = IndiaHRMS.API.Filters;

namespace IndiaHRMS.API.Controllers;

/// <summary>
/// TICKET-5: Bank Disbursement Batch File Generator
/// Generates corporate banking payout files (HDFC, ICICI, SBI) for bulk NEFT/RTGS salary transfers.
/// </summary>
[ApiController]
[Route("api/v1/payroll/disbursement")]
[Authorize]
public class DisbursementController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DisbursementController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    /// <summary>
    /// POST /api/v1/payroll/disbursement/{payrollRunId}/generate-batch-file
    /// Generates a bank-formatted corporate CSV file for NEFT/RTGS disbursement.
    /// Restricted to PAYROLL_ADMIN and FINANCE_HEAD (via PAYROLL.DISBURSE permission).
    /// </summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Disburse)]
    [HttpPost("{payrollRunId}/generate-batch-file")]
    public async Task<IActionResult> GenerateBatchFile(Guid payrollRunId, [FromQuery] string bankFormat = "HDFC", CancellationToken ct = default)
    {
        var run = await _context.PayrollRuns.FirstOrDefaultAsync(r => r.PayrollRunId == payrollRunId, ct);
        if (run == null)
            return NotFound(ApiResponse<object>.Fail("Payroll run not found."));

        var details = await _context.PayrollDetails
            .Include(d => d.Employee)
            .Where(d => d.PayrollRunId == payrollRunId && d.NetPay > 0)
            .ToListAsync(ct);

        if (!details.Any())
            return BadRequest(ApiResponse<object>.Fail("No payable net pay records found for this payroll run."));

        var empIds = details.Select(d => d.EmployeeId).Distinct().ToList();
        var bankDetails = await _context.EmployeeBankDetails
            .Where(b => empIds.Contains(b.EmployeeId))
            .ToDictionaryAsync(b => b.EmployeeId, b => b, ct);

        var format = bankFormat.Trim().ToUpper();
        var csvContent = new StringBuilder();
        var valueDate = DateTime.UtcNow.ToString("dd/MM/yyyy");
        var corporateAccNo = "999888777666"; // Standard corporate salary disbursement account

        if (format == "HDFC")
        {
            // HDFC CMS Format: Transaction Type, Beneficiary Code, Account Number, Amount, Beneficiary Name, Payment Date, IFSC Code
            csvContent.AppendLine("Transaction Type,Beneficiary Code,Beneficiary Account Number,Amount,Beneficiary Name,Value Date,IFSC Code,Debit Account");
            foreach (var item in details)
            {
                bankDetails.TryGetValue(item.EmployeeId, out var bank);
                var accNo = bank?.AccountNumber ?? "00000000000";
                var ifsc = bank?.IFSCCode ?? "HDFC0000001";
                var empName = item.Employee != null ? $"{item.Employee.FirstName} {item.Employee.LastName}" : "Employee";
                var payType = item.NetPay > 200000 ? "RTGS" : "NEFT";

                csvContent.AppendLine($"{payType},{item.Employee?.EmployeeCode ?? "EMP"},{accNo},{item.NetPay:F2},{EscapeCsv(empName)},{valueDate},{ifsc},{corporateAccNo}");
            }
        }
        else if (format == "ICICI")
        {
            // ICICI CIB Format: Debit Acc No, Beneficiary Name, Beneficiary Acc No, IFSC Code, Amount, Currency, Value Date, Payment Mode
            csvContent.AppendLine("Debit Account No,Beneficiary Name,Beneficiary Account No,IFSC Code,Amount,Currency,Value Date,Payment Mode");
            foreach (var item in details)
            {
                bankDetails.TryGetValue(item.EmployeeId, out var bank);
                var accNo = bank?.AccountNumber ?? "00000000000";
                var ifsc = bank?.IFSCCode ?? "ICIC0000001";
                var empName = item.Employee != null ? $"{item.Employee.FirstName} {item.Employee.LastName}" : "Employee";
                var payType = item.NetPay > 200000 ? "RTGS" : "NEFT";

                csvContent.AppendLine($"{corporateAccNo},{EscapeCsv(empName)},{accNo},{ifsc},{item.NetPay:F2},INR,{valueDate},{payType}");
            }
        }
        else // SBI / Default
        {
            // SBI CMP Format: Record Type, Amount, Account No, Beneficiary Name, IFSC, Narration
            csvContent.AppendLine("Record Type,Amount,Beneficiary Account No,Beneficiary Name,IFSC Code,Value Date,Narration");
            foreach (var item in details)
            {
                bankDetails.TryGetValue(item.EmployeeId, out var bank);
                var accNo = bank?.AccountNumber ?? "00000000000";
                var ifsc = bank?.IFSCCode ?? "SBIN0000001";
                var empName = item.Employee != null ? $"{item.Employee.FirstName} {item.Employee.LastName}" : "Employee";

                csvContent.AppendLine($"N,{item.NetPay:F2},{accNo},{EscapeCsv(empName)},{ifsc},{valueDate},Salary_{run.Month}_{run.Year}");
            }
        }

        var fileName = $"Salary_Batch_{format}_{run.Year}_{run.Month:D2}.csv";
        var bytes = Encoding.UTF8.GetBytes(csvContent.ToString());

        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// GET /api/v1/payroll/disbursement/summary/{payrollRunId}
    /// Gets payout breakdown summary before batch generation.
    /// Restricted to PAYROLL.VIEW — read-only so FINANCE_HEAD and PAYROLL_ADMIN both qualify.
    /// </summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("summary/{payrollRunId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetPayoutSummary(Guid payrollRunId, CancellationToken ct)
    {
        var run = await _context.PayrollRuns.FirstOrDefaultAsync(r => r.PayrollRunId == payrollRunId, ct);
        if (run == null)
            return NotFound(ApiResponse<object>.Fail("Payroll run not found."));

        var details = await _context.PayrollDetails
            .Include(d => d.Employee)
            .Where(d => d.PayrollRunId == payrollRunId)
            .ToListAsync(ct);

        var empIds = details.Select(d => d.EmployeeId).Distinct().ToList();
        var bankCount = await _context.EmployeeBankDetails
            .Where(b => empIds.Contains(b.EmployeeId) && !string.IsNullOrEmpty(b.AccountNumber))
            .Select(b => b.EmployeeId)
            .Distinct()
            .CountAsync(ct);

        var totalNetPay = details.Sum(d => d.NetPay);
        var totalEmployees = details.Count;

        return Ok(ApiResponse<object>.Ok(new
        {
            payrollRunId,
            month = run.Month,
            year = run.Year,
            status = run.Status.ToString(),
            totalEmployees,
            totalNetPay,
            validBankDetailsCount = bankCount,
            missingBankDetailsCount = totalEmployees - bankCount
        }));
    }

    /// <summary>
    /// POST /api/v1/payroll/disbursement/expense-batch/{batchId}/generate-batch-file
    /// Generates a bank-formatted corporate CSV file for Travel & Expense reimbursement batch disbursement.
    /// </summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Disburse)]
    [HttpPost("expense-batch/{batchId}/generate-batch-file")]
    public async Task<IActionResult> GenerateExpenseBatchFile(Guid batchId, [FromQuery] string bankFormat = "HDFC", CancellationToken ct = default)
    {
        var batch = await _context.ReimbursementBatches.FirstOrDefaultAsync(b => b.BatchId == batchId, ct);
        if (batch == null)
            return NotFound(ApiResponse<object>.Fail("Reimbursement batch not found."));

        var claims = await _context.ExpenseClaims
            .Include(c => c.Employee)
            .Where(c => c.Status == "Reimbursed")
            .ToListAsync(ct);

        if (!claims.Any())
            return BadRequest(ApiResponse<object>.Fail("No expense claims found for this reimbursement batch."));

        var empIds = claims.Select(c => c.EmployeeId).Distinct().ToList();
        var bankDetails = await _context.EmployeeBankDetails
            .Where(b => empIds.Contains(b.EmployeeId))
            .ToDictionaryAsync(b => b.EmployeeId, b => b, ct);

        var format = bankFormat.Trim().ToUpper();
        var csvContent = new StringBuilder();
        var valueDate = DateTime.UtcNow.ToString("dd/MM/yyyy");
        var corporateAccNo = "999888777666";

        if (format == "HDFC")
        {
            csvContent.AppendLine("Transaction Type,Beneficiary Code,Beneficiary Account Number,Amount,Beneficiary Name,Value Date,IFSC Code,Debit Account");
            foreach (var item in claims)
            {
                bankDetails.TryGetValue(item.EmployeeId, out var bank);
                var accNo = bank?.AccountNumber ?? "00000000000";
                var ifsc = bank?.IFSCCode ?? "HDFC0000001";
                var empName = item.Employee != null ? $"{item.Employee.FirstName} {item.Employee.LastName}" : "Employee";
                var payType = item.NetPayable > 200000 ? "RTGS" : "NEFT";
                csvContent.AppendLine($"{payType},{item.Employee?.EmployeeCode ?? "EMP"},{accNo},{item.NetPayable:F2},{EscapeCsv(empName)},{valueDate},{ifsc},{corporateAccNo}");
            }
        }
        else
        {
            csvContent.AppendLine("Debit Account No,Beneficiary Name,Beneficiary Account No,IFSC Code,Amount,Currency,Value Date,Payment Mode");
            foreach (var item in claims)
            {
                bankDetails.TryGetValue(item.EmployeeId, out var bank);
                var accNo = bank?.AccountNumber ?? "00000000000";
                var ifsc = bank?.IFSCCode ?? "ICIC0000001";
                var empName = item.Employee != null ? $"{item.Employee.FirstName} {item.Employee.LastName}" : "Employee";
                var payType = item.NetPayable > 200000 ? "RTGS" : "NEFT";
                csvContent.AppendLine($"{corporateAccNo},{EscapeCsv(empName)},{accNo},{ifsc},{item.NetPayable:F2},INR,{valueDate},{payType}");
            }
        }

        var fileName = $"Expense_Reimbursement_Batch_{format}_{batch.BatchCode}.csv";
        var bytes = Encoding.UTF8.GetBytes(csvContent.ToString());
        return File(bytes, "text/csv", fileName);
    }

    private static string EscapeCsv(string str)
    {
        if (string.IsNullOrEmpty(str)) return "";
        if (str.Contains(',') || str.Contains('"') || str.Contains('\n'))
            return $"\"{str.Replace("\"", "\"\"")}\"";
        return str;
    }
}
