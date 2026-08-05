using IndiaHRMS.Application.DTOs.Exit;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v1/exit")]
[Authorize]
public class ExitManagementController : ControllerBase
{
    private readonly IExitManagementService _exitService;
    private readonly ICurrentUserService _currentUser;

    public ExitManagementController(IExitManagementService exitService, ICurrentUserService currentUser)
    {
        _exitService = exitService;
        _currentUser = currentUser;
    }

    [HttpPost("resignation")]
    public async Task<IActionResult> SubmitResignation([FromBody] ResignationSubmitDto dto, CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
        {
            return BadRequest("Current user is not associated with an employee record.");
        }

        var result = await _exitService.SubmitResignationAsync(_currentUser.EmployeeId.Value, dto, ct);
        return Ok(result);
    }

    [HttpGet("records")]
    public async Task<IActionResult> GetExitRecords([FromQuery] PaginationRequest request, [FromQuery] string? status, [FromQuery] Guid? deptId, CancellationToken ct)
    {
        var result = await _exitService.GetExitRecordsAsync(request, status, deptId, ct);
        return Ok(result);
    }

    [HttpGet("my-record")]
    public async Task<IActionResult> GetMyExitRecord(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue) return BadRequest("No employee record.");
        var result = await _exitService.GetMyExitRecordAsync(_currentUser.EmployeeId.Value, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetExitRecordById(Guid id, CancellationToken ct)
    {
        var result = await _exitService.GetExitRecordByIdAsync(id, ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{empId:guid}/notice-period")]
    public async Task<IActionResult> CalculateNoticePeriod(Guid empId, CancellationToken ct)
    {
        var result = await _exitService.CalculateNoticePeriodAsync(empId, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}/confirm-lwd")]
    public async Task<IActionResult> ConfirmLastWorkingDay(Guid id, [FromBody] ConfirmLwdDto dto, CancellationToken ct)
    {
        var result = await _exitService.ConfirmLastWorkingDayAsync(id, dto, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/withdraw")]
    public async Task<IActionResult> WithdrawResignation(Guid id, [FromBody] ResignationWithdrawDto dto, CancellationToken ct)
    {
        var result = await _exitService.WithdrawResignationAsync(id, dto, ct);
        return Ok(result);
    }

    // ─── Counter Offer ──────────────────────────────────────────────────────────
    [HttpPost("{id:guid}/counter-offer")]
    public async Task<IActionResult> CreateCounterOffer(Guid id, [FromBody] CounterOfferCreateDto dto, CancellationToken ct)
    {
        var result = await _exitService.CreateCounterOfferAsync(id, dto, ct);
        return Ok(result);
    }

    [HttpPut("counter-offer/{offerId:guid}/respond")]
    public async Task<IActionResult> RespondToCounterOffer(Guid offerId, [FromBody] CounterOfferResponseDto dto, CancellationToken ct)
    {
        var result = await _exitService.RespondToCounterOfferAsync(offerId, dto, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/counter-offers")]
    public async Task<IActionResult> GetCounterOffers(Guid id, CancellationToken ct)
    {
        var result = await _exitService.GetCounterOffersAsync(id, ct);
        return Ok(result);
    }

    // ─── Multi-Dept Clearance ───────────────────────────────────────────────────
    [HttpGet("{id:guid}/clearance-status")]
    public async Task<IActionResult> GetClearanceStatus(Guid id, CancellationToken ct)
    {
        var result = await _exitService.GetClearanceStatusAsync(id, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}/clearance/{dept}/approve")]
    public async Task<IActionResult> ApproveClearance(Guid id, ClearanceDepartment dept, [FromBody] ClearanceApproveDto dto, CancellationToken ct)
    {
        var result = await _exitService.ApproveClearanceAsync(id, dept, dto, ct);
        return Ok(result);
    }

    // ─── Exit Interview ────────────────────────────────────────────────────────
    [HttpPost("{id:guid}/interview")]
    public async Task<IActionResult> SubmitExitInterview(Guid id, [FromBody] ExitInterviewSubmitDto dto, CancellationToken ct)
    {
        var result = await _exitService.SubmitExitInterviewAsync(id, dto, ct);
        return Ok(result);
    }

    [HttpGet("interview-analytics")]
    public async Task<IActionResult> GetInterviewAnalytics([FromQuery] Guid? deptId, CancellationToken ct)
    {
        var result = await _exitService.GetInterviewAnalyticsAsync(deptId, ct);
        return Ok(result);
    }

    // ─── Full & Final Settlement (FFS) ──────────────────────────────────────────
    [HttpPost("{id:guid}/ffs-calculate")]
    public async Task<IActionResult> CalculateFFS(Guid id, CancellationToken ct)
    {
        var result = await _exitService.CalculateFFSAsync(id, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}/ffs-approve")]
    public async Task<IActionResult> ApproveFFS(Guid id, [FromBody] FFSApproveDto dto, CancellationToken ct)
    {
        var result = await _exitService.ApproveFFSAsync(id, dto, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/ffs-disburse")]
    public async Task<IActionResult> DisburseFFS(Guid id, [FromBody] FFSDisburseDto dto, CancellationToken ct)
    {
        var result = await _exitService.DisburseFFSAsync(id, dto, ct);
        return Ok(result);
    }

    // ─── Documentation ──────────────────────────────────────────────────────────
    [HttpPost("{id:guid}/generate-document")]
    public async Task<IActionResult> GenerateDocument(Guid id, [FromQuery] ExitDocumentType documentType, [FromQuery] ExitConductRemark conductRemark = ExitConductRemark.Satisfactory, CancellationToken ct = default)
    {
        var result = await _exitService.GenerateDocumentAsync(id, documentType, conductRemark, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/documents")]
    public async Task<IActionResult> GetExitDocuments(Guid id, CancellationToken ct)
    {
        var result = await _exitService.GetExitDocumentsAsync(id, ct);
        return Ok(result);
    }

    // ─── Sector Configuration ────────────────────────────────────────────────────
    [HttpGet("sector-rules")]
    public async Task<IActionResult> GetSectorConfigs(CancellationToken ct)
    {
        Guid companyId = _currentUser.CompanyId ?? Guid.Parse("00000000-0000-0000-0000-000000000001");
        var result = await _exitService.GetSectorConfigsAsync(companyId, ct);
        return Ok(result);
    }

    [HttpPost("sector-rules")]
    public async Task<IActionResult> SaveSectorConfig([FromBody] SectorExitConfigDto dto, CancellationToken ct)
    {
        Guid companyId = _currentUser.CompanyId ?? Guid.Parse("00000000-0000-0000-0000-000000000001");
        var result = await _exitService.SaveSectorConfigAsync(companyId, dto, ct);
        return Ok(result);
    }

    // ─── Attrition Analytics ─────────────────────────────────────────────────────
    [HttpGet("attrition-summary")]
    public async Task<IActionResult> GetAttritionSummary([FromQuery] int? year, CancellationToken ct)
    {
        Guid companyId = _currentUser.CompanyId ?? Guid.Parse("00000000-0000-0000-0000-000000000001");
        var result = await _exitService.GetAttritionSummaryAsync(companyId, year, ct);
        return Ok(result);
    }
}
