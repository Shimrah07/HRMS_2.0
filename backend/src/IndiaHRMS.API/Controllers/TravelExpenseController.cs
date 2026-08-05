using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IndiaHRMS.Application.DTOs.TravelExpense;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class TravelExpenseController : ControllerBase
{
    private readonly ITravelExpenseService _service;
    private readonly ICurrentUserService _currentUserService;

    public TravelExpenseController(ITravelExpenseService service, ICurrentUserService currentUserService)
    {
        _service = service;
        _currentUserService = currentUserService;
    }

    // ─── Sub-Module 8.2: Travel Policy & Entitlements ───────────────────────────

    [HttpGet("travel/policies")]
    [Filters.RequirePermission(PermissionCodes.Travel.View)]
    public async Task<IActionResult> GetEntitlements()
    {
        var list = await _service.GetEntitlementsAsync();
        return Ok(list);
    }

    [HttpGet("travel/{gradeBand}/entitlement")]
    [Filters.RequirePermission(PermissionCodes.Travel.View)]
    public async Task<IActionResult> GetEntitlementByGrade(string gradeBand)
    {
        var entitlement = await _service.GetEntitlementByGradeAsync(gradeBand);
        return Ok(entitlement);
    }

    [HttpPost("travel/policies")]
    [Filters.RequirePermission(PermissionCodes.Travel.Configure)]
    public async Task<IActionResult> SaveEntitlement([FromBody] CreateEntitlementDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var created = await _service.SaveEntitlementAsync(dto);
        return Ok(created);
    }

    [HttpPost("travel/policy-exception")]
    [Filters.RequirePermission(PermissionCodes.Travel.Create)]
    public async Task<IActionResult> RequestPolicyException([FromBody] PolicyExceptionRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _service.RequestPolicyExceptionAsync(dto);
        return Ok(result);
    }

    [HttpPut("travel/policy-exception/{id:guid}/review")]
    [Filters.RequirePermission(PermissionCodes.Travel.Approve)]
    public async Task<IActionResult> ReviewPolicyException(Guid id, [FromQuery] string role, [FromQuery] bool isApproved)
    {
        var result = await _service.ReviewPolicyExceptionAsync(id, role, isApproved);
        return Ok(result);
    }


    // ─── Sub-Module 8.1: Travel Requests & Booking ──────────────────────────────

    [HttpPost("travel/request")]
    public async Task<IActionResult> CreateTravelRequest([FromBody] CreateTravelRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var empId = _currentUserService.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000009");
        try
        {
            var created = await _service.CreateTravelRequestAsync(empId, dto);
            return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("travel/requests")]
    public async Task<IActionResult> GetTravelRequests([FromQuery] Guid? employeeId, [FromQuery] string? status)
    {
        var list = await _service.GetTravelRequestsAsync(employeeId, status);
        return Ok(list);
    }

    [HttpGet("travel/requests/{id:guid}")]
    public async Task<IActionResult> GetTravelRequestById(Guid id)
    {
        var request = await _service.GetTravelRequestByIdAsync(id);
        return Ok(request);
    }

    [HttpPut("travel/requests/{id:guid}/approve")]
    public async Task<IActionResult> ApproveTravelRequest(Guid id, [FromBody] ApproveTravelRequestDto dto)
    {
        var userId = _currentUserService.UserId ?? Guid.Empty;
        var result = await _service.ApproveTravelRequestAsync(id, userId, dto);
        return Ok(result);
    }

    [HttpPost("travel/requests/{id:guid}/booking")]
    public async Task<IActionResult> ConfirmBooking(Guid id, [FromBody] ConfirmBookingDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        dto.TravelRequestId = id;
        var userId = _currentUserService.UserId ?? Guid.Empty;
        var result = await _service.ConfirmBookingAsync(id, userId, dto);
        return Ok(result);
    }

    // ─── Sub-Module 8.6: Travel Advance Management ─────────────────────────────

    [HttpPost("advance/request")]
    public async Task<IActionResult> RequestTravelAdvance([FromBody] TravelAdvanceRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var empId = _currentUserService.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000009");
        try
        {
            var created = await _service.RequestTravelAdvanceAsync(empId, dto);
            return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("advance/employee/{empId:guid}")]
    public async Task<IActionResult> GetEmployeeAdvances(Guid empId, [FromQuery] string? status)
    {
        var list = await _service.GetTravelAdvancesAsync(empId, status);
        return Ok(list);
    }

    [HttpGet("advance/outstanding")]
    public async Task<IActionResult> GetOutstandingAdvances()
    {
        var list = await _service.GetTravelAdvancesAsync(null, null);
        return Ok(list);
    }

    [HttpPut("advance/{id:guid}/disburse")]
    public async Task<IActionResult> DisburseAdvance(Guid id, [FromBody] DisburseAdvanceDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _service.DisburseAdvanceAsync(id, dto);
        return Ok(result);
    }

    // ─── Sub-Module 8.3 & 8.4: Expense Claims & OCR ─────────────────────────────

    [HttpPost("expense/claim")]
    public async Task<IActionResult> SubmitExpenseClaim([FromBody] CreateExpenseClaimDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var empId = _currentUserService.EmployeeId ?? Guid.Parse("00000001-0000-0000-0000-000000000009");
        try
        {
            var created = await _service.SubmitExpenseClaimAsync(empId, dto);
            return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("expense/claims")]
    public async Task<IActionResult> GetExpenseClaims([FromQuery] Guid? employeeId, [FromQuery] string? status)
    {
        var list = await _service.GetExpenseClaimsAsync(employeeId, status);
        return Ok(list);
    }

    [HttpGet("expense/claims/{id:guid}")]
    public async Task<IActionResult> GetExpenseClaimById(Guid id)
    {
        var claim = await _service.GetExpenseClaimByIdAsync(id);
        return Ok(claim);
    }

    [HttpPost("expense/ocr-scan")]
    public async Task<IActionResult> ProcessOcrScan([FromBody] OcrScanRequestDto dto)
    {
        var result = await _service.ProcessOcrScanAsync(dto);
        return Ok(result);
    }

    [HttpPut("expense/{claimId:guid}/approve")]
    public async Task<IActionResult> ApproveExpenseClaim(Guid claimId, [FromBody] ApproveExpenseClaimDto dto)
    {
        var userId = _currentUserService.UserId ?? Guid.Empty;
        var result = await _service.ApproveExpenseClaimAsync(claimId, userId, dto);
        return Ok(result);
    }

    [HttpGet("expense/gst-summary")]
    public async Task<IActionResult> GetGstSummary([FromQuery] string month)
    {
        var list = await _service.GetGstSummaryAsync(month);
        return Ok(list);
    }

    [HttpPost("expense/creditcard-reconcile")]
    public async Task<IActionResult> ReconcileCreditCardStatement([FromBody] object payload)
    {
        var result = await _service.ReconcileCreditCardStatementAsync(payload.ToString() ?? "");
        return Ok(new { success = result, message = "Corporate credit card statement auto-reconciled successfully." });
    }

    // ─── Sub-Module 8.5: Reimbursement Workflows ───────────────────────────────

    [HttpPost("expense/reimbursement-run")]
    public async Task<IActionResult> CreateReimbursementBatch([FromBody] ReimbursementBatchRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = _currentUserService.UserId ?? Guid.Empty;
        try
        {
            var result = await _service.CreateReimbursementBatchAsync(userId, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("expense/reimbursement-batches")]
    public async Task<IActionResult> GetReimbursementBatches()
    {
        var list = await _service.GetReimbursementBatchesAsync();
        return Ok(list);
    }

    // ─── Sub-Module 8.7: Sector Policy Config ──────────────────────────────────

    [HttpGet("travel/sector-configs")]
    public async Task<IActionResult> GetSectorConfigs()
    {
        var list = await _service.GetSectorConfigsAsync();
        return Ok(list);
    }

    [HttpPut("travel/sector-configs/{sectorName}")]
    public async Task<IActionResult> UpdateSectorConfig(string sectorName, [FromQuery] bool isActive, [FromBody] object payload)
    {
        var result = await _service.UpdateSectorConfigAsync(sectorName, isActive, payload.ToString() ?? "");
        return Ok(result);
    }

    // ─── Sub-Module 8.8: Analytics & Reports ───────────────────────────────────

    [HttpGet("travel/analytics")]
    public async Task<IActionResult> GetAnalyticsSummary()
    {
        var summary = await _service.GetAnalyticsSummaryAsync();
        return Ok(summary);
    }

    [HttpPost("travel/reports/export")]
    public async Task<IActionResult> GetReportData([FromBody] TEReportFilterDto filter)
    {
        var data = await _service.GetReportDataAsync(filter);
        return Ok(data);
    }
}
