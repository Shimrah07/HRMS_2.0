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
/// TICKET-7: Reimbursements & Expense Claims
/// Handles employee travel, medical, LTA, and general business expense reimbursement submission, approval workflow, and tax-free processing.
/// </summary>
[ApiController]
[Route("api/v1/payroll/reimbursements")]
[Authorize]
public class ReimbursementController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    private static readonly List<ReimbursementRecord> _claims = new();
    private static readonly object _lock = new();

    public ReimbursementController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;

        lock (_lock)
        {
            if (!_claims.Any())
            {
                var empList = _context.Employees.ToList();
                var engEmp1 = empList.FirstOrDefault(e => e.OfficialEmail == "engemp1@company.com");
                var hrAdmin = empList.FirstOrDefault(e => e.OfficialEmail == "hradmin@company.com");
                var finEmp1 = empList.FirstOrDefault(e => e.OfficialEmail == "finemp1@company.com");
                var engEmp2 = empList.FirstOrDefault(e => e.OfficialEmail == "engemp2@company.com");
                var opsEmp1 = empList.FirstOrDefault(e => e.OfficialEmail == "opsemp1@company.com");

                _claims.Add(new ReimbursementRecord
                {
                    ClaimId = Guid.Parse("77777777-8888-9999-aaaa-bbbbbbbbbbbb"),
                    EmployeeId = engEmp1?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000009"),
                    EmployeeCode = engEmp1?.EmployeeCode ?? "EMP0009",
                    EmployeeName = engEmp1 != null ? $"{engEmp1.FirstName} {engEmp1.LastName}" : "Amit EngEmp1",
                    Category = "Travel & Conveyance",
                    Amount = 4500m,
                    Description = "Client meeting taxi & toll receipts",
                    ReceiptUrl = "receipt_taxicab_4500.pdf",
                    IsTaxFree = true,
                    SubmittedAt = DateTime.UtcNow.AddDays(-3),
                    Status = "Approved",
                    ApprovedBy = "HR Admin",
                    ApprovedAt = DateTime.UtcNow.AddDays(-1)
                });

                _claims.Add(new ReimbursementRecord
                {
                    ClaimId = Guid.Parse("88888888-8888-9999-aaaa-bbbbbbbbbbbb"),
                    EmployeeId = engEmp1?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000009"),
                    EmployeeCode = engEmp1?.EmployeeCode ?? "EMP0009",
                    EmployeeName = engEmp1 != null ? $"{engEmp1.FirstName} {engEmp1.LastName}" : "Amit EngEmp1",
                    Category = "Certification & Training",
                    Amount = 12000m,
                    Description = "AWS Certified Solutions Architect Associate Exam Fee",
                    ReceiptUrl = "aws_cert_invoice.pdf",
                    IsTaxFree = true,
                    SubmittedAt = DateTime.UtcNow.AddDays(-10),
                    Status = "Approved",
                    ApprovedBy = "HR Admin",
                    ApprovedAt = DateTime.UtcNow.AddDays(-8)
                });

                _claims.Add(new ReimbursementRecord
                {
                    ClaimId = Guid.Parse("99999999-8888-9999-aaaa-bbbbbbbbbbbb"),
                    EmployeeId = hrAdmin?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000003"),
                    EmployeeCode = hrAdmin?.EmployeeCode ?? "EMP0003",
                    EmployeeName = hrAdmin != null ? $"{hrAdmin.FirstName} {hrAdmin.LastName}" : "Sneha HRAdmin",
                    Category = "Team Event / Catering",
                    Amount = 8500m,
                    Description = "Quarterly All-Hands lunch catering invoice",
                    ReceiptUrl = "catering_bill_8500.pdf",
                    IsTaxFree = true,
                    SubmittedAt = DateTime.UtcNow.AddDays(-5),
                    Status = "Approved",
                    ApprovedBy = "Finance Head",
                    ApprovedAt = DateTime.UtcNow.AddDays(-4)
                });

                _claims.Add(new ReimbursementRecord
                {
                    ClaimId = Guid.Parse("aaaaaaaa-8888-9999-aaaa-bbbbbbbbbbbb"),
                    EmployeeId = finEmp1?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000012"),
                    EmployeeCode = finEmp1?.EmployeeCode ?? "EMP0012",
                    EmployeeName = finEmp1 != null ? $"{finEmp1.FirstName} {finEmp1.LastName}" : "Vikram FinEmp1",
                    Category = "Broadband & Mobile",
                    Amount = 1800m,
                    Description = "Monthly High-Speed Fiber Internet Bill for WFH",
                    ReceiptUrl = "airtel_fiber_bill.pdf",
                    IsTaxFree = true,
                    SubmittedAt = DateTime.UtcNow.AddDays(-2),
                    Status = "Approved",
                    ApprovedBy = "Finance Head",
                    ApprovedAt = DateTime.UtcNow.AddDays(-1)
                });

                _claims.Add(new ReimbursementRecord
                {
                    ClaimId = Guid.Parse("bbbbbbbb-8888-9999-aaaa-bbbbbbbbbbbb"),
                    EmployeeId = engEmp2?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000010"),
                    EmployeeCode = engEmp2?.EmployeeCode ?? "EMP0010",
                    EmployeeName = engEmp2 != null ? $"{engEmp2.FirstName} {engEmp2.LastName}" : "Sumit EngEmp2",
                    Category = "Client Meals",
                    Amount = 3200m,
                    Description = "Product Design Review Dinner with External Consultants",
                    ReceiptUrl = "restaurant_bill_3200.pdf",
                    IsTaxFree = true,
                    SubmittedAt = DateTime.UtcNow.AddDays(-1),
                    Status = "Pending"
                });

                _claims.Add(new ReimbursementRecord
                {
                    ClaimId = Guid.Parse("cccccccc-8888-9999-aaaa-bbbbbbbbbbbb"),
                    EmployeeId = opsEmp1?.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000013"),
                    EmployeeCode = opsEmp1?.EmployeeCode ?? "EMP0013",
                    EmployeeName = opsEmp1 != null ? $"{opsEmp1.FirstName} {opsEmp1.LastName}" : "Suresh OpsEmp1",
                    Category = "Relocation Charges",
                    Amount = 25000m,
                    Description = "Packers & Movers bill for interstate transfer",
                    ReceiptUrl = "packers_bill_25000.pdf",
                    IsTaxFree = true,
                    SubmittedAt = DateTime.UtcNow.AddDays(-7),
                    Status = "Rejected",
                    ApprovedBy = "HR Admin",
                    ApprovedAt = DateTime.UtcNow.AddDays(-6)
                });
            }
        }
    }

    private bool IsAdminOrManager =>
        _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead, RoleCodes.DeptManager, RoleCodes.ReportingManager);

    /// <summary>
    /// GET /api/v1/payroll/reimbursements/me
    /// Gets expense reimbursement claims for logged-in employee.
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyClaims(CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == _currentUser.UserId, ct);
            empId = user?.EmployeeId;
        }

        lock (_lock)
        {
            var list = _claims
                .Where(c => c.EmployeeId == empId.Value || empId == null)
                .OrderByDescending(c => c.SubmittedAt)
                .ToList();

            return Ok(ApiResponse<object>.Ok(list));
        }
    }

    /// <summary>
    /// POST /api/v1/payroll/reimbursements
    /// Employee submits a new reimbursement claim with expense details and receipt attachment.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> SubmitClaim([FromBody] SubmitClaimRequest req, CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == _currentUser.UserId, ct);
            empId = user?.EmployeeId;
        }
        if (!empId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile found for logged-in user."));

        var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == empId.Value, ct);

        if (req.Amount <= 0)
            return BadRequest(ApiResponse<object>.Fail("Claim amount must be greater than zero."));
        if (string.IsNullOrWhiteSpace(req.Category))
            return BadRequest(ApiResponse<object>.Fail("Category is required (e.g. Travel, Medical, LTA)."));

        var claim = new ReimbursementRecord
        {
            ClaimId = Guid.NewGuid(),
            EmployeeId = empId.Value,
            EmployeeCode = emp?.EmployeeCode ?? "EMP",
            EmployeeName = emp != null ? $"{emp.FirstName} {emp.LastName}" : "Employee",
            Category = req.Category.Trim(),
            Amount = req.Amount,
            Description = req.Description?.Trim() ?? "",
            ReceiptUrl = string.IsNullOrWhiteSpace(req.ReceiptUrl) ? "receipt_attached.pdf" : req.ReceiptUrl.Trim(),
            IsTaxFree = req.IsTaxFree,
            SubmittedAt = DateTime.UtcNow,
            Status = "Pending"
        };

        lock (_lock)
        {
            _claims.Add(claim);
        }

        return CreatedAtAction(nameof(GetMyClaims), ApiResponse<object>.Ok(claim, "Reimbursement claim submitted successfully. Pending manager approval."));
    }

    /// <summary>
    /// GET /api/v1/payroll/reimbursements/pending
    /// Manager / HR lists pending expense claims for approval.
    /// </summary>
    [HttpGet("pending")]
    public ActionResult<ApiResponse<object>> GetPendingClaims()
    {
        if (!IsAdminOrManager)
            return StatusCode(403, ApiResponse<object>.Fail("Only Managers/HR can view pending claims queue."));

        lock (_lock)
        {
            var pending = _claims
                .OrderByDescending(c => c.SubmittedAt)
                .ToList();

            return Ok(ApiResponse<object>.Ok(pending));
        }
    }

    /// <summary>
    /// PUT /api/v1/payroll/reimbursements/{id}/approve
    /// Manager / HR approves reimbursement claim.
    /// </summary>
    [HttpPut("{id}/approve")]
    public ActionResult<ApiResponse<object>> ApproveClaim(Guid id)
    {
        if (!IsAdminOrManager)
            return StatusCode(403, ApiResponse<object>.Fail("Only Managers/HR can approve reimbursement claims."));

        lock (_lock)
        {
            var claim = _claims.FirstOrDefault(c => c.ClaimId == id);
            if (claim == null)
                return NotFound(ApiResponse<object>.Fail("Reimbursement claim not found."));

            claim.Status = "Approved";
            claim.ApprovedBy = _currentUser.Username ?? "Manager";
            claim.ApprovedAt = DateTime.UtcNow;

            return Ok(ApiResponse<object>.Ok(new { claim.ClaimId, claim.Status }, "Reimbursement claim approved! Amount will be included in the next payroll run payout."));
        }
    }

    /// <summary>
    /// PUT /api/v1/payroll/reimbursements/{id}/reject
    /// Manager / HR rejects reimbursement claim.
    /// </summary>
    [HttpPut("{id}/reject")]
    public ActionResult<ApiResponse<object>> RejectClaim(Guid id, [FromBody] RejectClaimRequest req)
    {
        if (!IsAdminOrManager)
            return StatusCode(403, ApiResponse<object>.Fail("Only Managers/HR can reject reimbursement claims."));

        lock (_lock)
        {
            var claim = _claims.FirstOrDefault(c => c.ClaimId == id);
            if (claim == null)
                return NotFound(ApiResponse<object>.Fail("Reimbursement claim not found."));

            claim.Status = "Rejected";
            claim.ApprovedBy = _currentUser.Username ?? "Manager";
            claim.ApprovedAt = DateTime.UtcNow;
            claim.Remarks = req.Remarks?.Trim() ?? "Documentation insufficient";

            return Ok(ApiResponse<object>.Ok(new { claim.ClaimId, claim.Status, claim.Remarks }, "Reimbursement claim rejected."));
        }
    }
}

public class ReimbursementRecord
{
    public Guid ClaimId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Category { get; set; } = "Travel & Conveyance";
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ReceiptUrl { get; set; } = string.Empty;
    public bool IsTaxFree { get; set; } = true;
    public DateTime SubmittedAt { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Remarks { get; set; }
}

public class SubmitClaimRequest
{
    public string Category { get; set; } = "Travel & Conveyance";
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ReceiptUrl { get; set; }
    public bool IsTaxFree { get; set; } = true;
}

public class RejectClaimRequest
{
    public string Remarks { get; set; } = string.Empty;
}
