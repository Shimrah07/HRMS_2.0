using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v1/leave")]
[Authorize]
public class LeaveController : ControllerBase
{
    private readonly ILeavePolicyService _policyService;
    private readonly ILeaveApplicationService _appService;
    private readonly ILeaveEngineService _engineService;
    private readonly IHolidayService _holidayService;
    private readonly IStatutoryLeaveService _statutoryService;
    private readonly ILeaveEncashmentService _encashmentService;
    private readonly ISectorLeaveService _sectorService;
    private readonly ILeaveAnalyticsService _analyticsService;

    public LeaveController(
        ILeavePolicyService policyService,
        ILeaveApplicationService appService,
        ILeaveEngineService engineService,
        IHolidayService holidayService,
        IStatutoryLeaveService statutoryService,
        ILeaveEncashmentService encashmentService,
        ISectorLeaveService sectorService,
        ILeaveAnalyticsService analyticsService)
    {
        _policyService = policyService;
        _appService = appService;
        _engineService = engineService;
        _holidayService = holidayService;
        _statutoryService = statutoryService;
        _encashmentService = encashmentService;
        _sectorService = sectorService;
        _analyticsService = analyticsService;
    }

    // ─── Sub-Module 4.1: Leave Types & Policy Master ─────────────────────────────

    [HttpGet("types")]
    public async Task<IActionResult> GetLeaveTypes([FromQuery] Guid companyId)
    {
        if (companyId == Guid.Empty)
        {
            companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        }

        var types = await _policyService.GetLeaveTypesAsync(companyId);
        return Ok(types);
    }

    [HttpGet("types/{id:guid}")]
    public async Task<IActionResult> GetLeaveTypeById(Guid id)
    {
        var type = await _policyService.GetLeaveTypeByIdAsync(id);
        if (type == null) return NotFound(new { message = "Leave type not found" });
        return Ok(type);
    }

    [HttpPost("types")]
    public async Task<IActionResult> CreateLeaveType([FromBody] CreateLeaveTypeDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var created = await _policyService.CreateLeaveTypeAsync(dto);
        return CreatedAtAction(nameof(GetLeaveTypeById), new { id = created.LeaveTypeId }, created);
    }

    [HttpPut("types/{id:guid}")]
    public async Task<IActionResult> UpdateLeaveType(Guid id, [FromBody] CreateLeaveTypeDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var updated = await _policyService.UpdateLeaveTypeAsync(id, dto);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("types/{id:guid}")]
    public async Task<IActionResult> DeleteLeaveType(Guid id)
    {
        var result = await _policyService.DeleteLeaveTypeAsync(id);
        if (!result) return NotFound(new { message = "Leave type not found" });
        return Ok(new { message = "Leave type deactivated successfully" });
    }

    [HttpGet("types/{id:guid}/rules")]
    public async Task<IActionResult> GetPolicyRules(Guid id)
    {
        var rules = await _policyService.GetPolicyRulesAsync(id);
        return Ok(rules);
    }

    [HttpPost("policies/rules")]
    public async Task<IActionResult> CreatePolicyRule([FromBody] CreateLeavePolicyRuleDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var created = await _policyService.CreatePolicyRuleAsync(dto);
        return Ok(created);
    }

    [HttpDelete("policies/rules/{ruleId:guid}")]
    public async Task<IActionResult> DeletePolicyRule(Guid ruleId)
    {
        var result = await _policyService.DeletePolicyRuleAsync(ruleId);
        if (!result) return NotFound(new { message = "Policy rule override not found" });
        return Ok(new { message = "Policy rule removed successfully" });
    }

    // ─── Sub-Module 4.2: Leave Applications & Approvals Workflow ─────────────────

    [HttpPost("applications")]
    public async Task<IActionResult> ApplyLeave([FromBody] CreateLeaveApplicationDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var created = await _appService.ApplyLeaveAsync(dto);
            return Ok(created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("applications/employee/{employeeId:guid}")]
    public async Task<IActionResult> GetEmployeeApplications(Guid employeeId)
    {
        var list = await _appService.GetEmployeeApplicationsAsync(employeeId);
        return Ok(list);
    }

    [HttpGet("applications/pending")]
    public async Task<IActionResult> GetPendingApprovals([FromQuery] Guid managerId)
    {
        var list = await _appService.GetPendingApprovalsAsync(managerId);
        return Ok(list);
    }

    [HttpGet("applications/{id:guid}")]
    public async Task<IActionResult> GetApplicationById(Guid id)
    {
        var app = await _appService.GetApplicationByIdAsync(id);
        if (app == null) return NotFound(new { message = "Leave application not found" });
        return Ok(app);
    }

    [HttpPost("applications/{id:guid}/approve")]
    public async Task<IActionResult> ApproveLeave(Guid id, [FromBody] ApproveRejectLeaveDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var approved = await _appService.ApproveLeaveAsync(id, dto);
            return Ok(approved);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("applications/{id:guid}/reject")]
    public async Task<IActionResult> RejectLeave(Guid id, [FromBody] ApproveRejectLeaveDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var rejected = await _appService.RejectLeaveAsync(id, dto);
            return Ok(rejected);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("applications/{id:guid}/cancel")]
    public async Task<IActionResult> CancelLeave(Guid id, [FromQuery] Guid userId)
    {
        var result = await _appService.CancelLeaveAsync(id, userId);
        if (!result) return NotFound(new { message = "Leave application not found" });
        return Ok(new { message = "Leave application cancelled successfully" });
    }

    [HttpGet("team-overlap")]
    public async Task<IActionResult> GetTeamOverlap([FromQuery] Guid deptId, [FromQuery] string fromDate, [FromQuery] string toDate)
    {
        if (!DateOnly.TryParse(fromDate, out var from) || !DateOnly.TryParse(toDate, out var to))
        {
            return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD." });
        }

        var overlapPct = await _appService.CheckTeamOverlapPercentageAsync(deptId, from, to);
        return Ok(new { departmentId = deptId, overlapPercentage = overlapPct, isHighOverlap = overlapPct >= 30.0m });
    }

    // ─── Sub-Module 4.3: Leave Balance & Pro-Rata Accrual Ledger Engine ─────────

    [HttpGet("balances/employee/{employeeId:guid}")]
    public async Task<IActionResult> GetEmployeeBalances(Guid employeeId, [FromQuery] int? year)
    {
        int targetYear = year ?? DateTime.UtcNow.Year;
        var balances = await _engineService.GetEmployeeBalancesAsync(employeeId, targetYear);
        return Ok(balances);
    }

    [HttpGet("ledger/employee/{employeeId:guid}")]
    public async Task<IActionResult> GetEmployeeLedger(Guid employeeId, [FromQuery] Guid? leaveTypeId, [FromQuery] int? year)
    {
        var ledger = await _engineService.GetEmployeeLedgerAsync(employeeId, leaveTypeId, year);
        return Ok(ledger);
    }

    [HttpPost("balances/adjust")]
    public async Task<IActionResult> AdjustBalance([FromBody] AdjustLeaveBalanceDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var updated = await _engineService.AdjustBalanceAsync(dto);
        return Ok(updated);
    }

    [HttpPost("accrual/run-monthly")]
    public async Task<IActionResult> RunMonthlyAccrual([FromQuery] int? year, [FromQuery] int? month)
    {
        int targetYear = year ?? DateTime.UtcNow.Year;
        int targetMonth = month ?? DateTime.UtcNow.Month;

        int processed = await _engineService.RunMonthlyAccrualAsync(targetYear, targetMonth);
        return Ok(new { message = $"Monthly accrual completed for {targetMonth:D2}/{targetYear}", processedEntries = processed });
    }

    // ─── Sub-Module 4.4: Location-Aware Holiday Calendar Management ─────────────

    [HttpGet("holidays")]
    public async Task<IActionResult> GetHolidays([FromQuery] Guid? companyId, [FromQuery] Guid? locationId, [FromQuery] int? year)
    {
        var targetCompanyId = companyId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var holidays = await _holidayService.GetHolidayCalendarAsync(targetCompanyId, locationId, year);
        return Ok(holidays);
    }

    [HttpPost("holidays")]
    public async Task<IActionResult> CreateHoliday([FromBody] CreateHolidayDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (dto.CompanyId == Guid.Empty) dto.CompanyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var created = await _holidayService.CreateHolidayAsync(dto);
        return CreatedAtAction(nameof(GetHolidays), new { companyId = created.CompanyId }, created);
    }

    [HttpPost("holidays/select-optional")]
    public async Task<IActionResult> SelectOptionalHoliday([FromQuery] Guid employeeId, [FromQuery] Guid holidayId)
    {
        try
        {
            var success = await _holidayService.SelectOptionalHolidayAsync(employeeId, holidayId);
            if (!success) return BadRequest(new { message = "Failed to select optional holiday." });
            return Ok(new { message = "Optional holiday selected and approved successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("holidays/export-ical")]
    public async Task<IActionResult> ExportICalendar([FromQuery] Guid? companyId, [FromQuery] Guid? locationId, [FromQuery] int? year)
    {
        var targetCompanyId = companyId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        int targetYear = year ?? DateTime.UtcNow.Year;

        var icalString = await _holidayService.GenerateICalendarFeedAsync(targetCompanyId, locationId, targetYear);
        var bytes = System.Text.Encoding.UTF8.GetBytes(icalString);
        return File(bytes, "text/calendar", $"IndiaHRMS_Holidays_{targetYear}.ics");
    }

    // ─── Sub-Module 4.5: Statutory Leave Foundation ──────────────────────────────

    [HttpPost("statutory/maternity/apply")]
    public async Task<IActionResult> ApplyMaternityLeave([FromBody] ApplyMaternityLeaveDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var result = await _statutoryService.ApplyMaternityLeaveAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("statutory/paternity/apply")]
    public async Task<IActionResult> ApplyPaternityLeave([FromBody] ApplyPaternityLeaveDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var result = await _statutoryService.ApplyPaternityLeaveAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("statutory/events/employee/{employeeId:guid}")]
    public async Task<IActionResult> GetEmployeeStatutoryEvents(Guid employeeId)
    {
        var list = await _statutoryService.GetEmployeeStatutoryEventsAsync(employeeId);
        return Ok(list);
    }

    // ─── Sub-Module 4.6: Carry Forward & Encashment Engine ───────────────────────

    [HttpPost("encashment/process")]
    public async Task<IActionResult> ProcessEncashment([FromBody] ProcessEncashmentRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var result = await _encashmentService.ProcessLeaveEncashmentAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("carry-forward/run-year-end")]
    public async Task<IActionResult> RunYearEndCarryForward([FromQuery] Guid? companyId, [FromQuery] int? fromYear)
    {
        var targetCompanyId = companyId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        int targetYear = fromYear ?? DateTime.UtcNow.Year;

        var result = await _encashmentService.RunYearEndCarryForwardAsync(targetCompanyId, targetYear);
        return Ok(result);
    }

    [HttpGet("encashment/history/employee/{employeeId:guid}")]
    public async Task<IActionResult> GetEmployeeEncashments(Guid employeeId)
    {
        var list = await _encashmentService.GetEmployeeEncashmentsAsync(employeeId);
        return Ok(list);
    }

    // ─── Sub-Module 4.7: Sector-Specific Rules Matrix ───────────────────────────

    [HttpGet("sector/configs")]
    public async Task<IActionResult> GetSectorConfigs([FromQuery] Guid? companyId)
    {
        var targetCompanyId = companyId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var configs = await _sectorService.GetSectorConfigsAsync(targetCompanyId);
        return Ok(configs);
    }

    [HttpPost("sector/config")]
    public async Task<IActionResult> SaveSectorConfig([FromBody] SectorLeaveConfigDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (dto.CompanyId == Guid.Empty) dto.CompanyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var result = await _sectorService.SaveSectorConfigAsync(dto);
        return Ok(result);
    }

    [HttpPost("sector/factories-act/accrual")]
    public async Task<IActionResult> CalculateFactoriesActAccrual([FromQuery] Guid employeeId, [FromQuery] int daysWorked)
    {
        try
        {
            var result = await _sectorService.CalculateFactoriesActAccrualAsync(employeeId, daysWorked);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sector/blackout-check")]
    public async Task<IActionResult> CheckBlackoutWindow([FromQuery] Guid? companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate)
    {
        var targetCompanyId = companyId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var result = await _sectorService.CheckBlackoutWindowAsync(targetCompanyId, fromDate, toDate);
        return Ok(result);
    }

    // ─── Sub-Module 4.8: Leave Dashboard, Analytics & Enterprise Reports ──────────

    [HttpGet("analytics/dashboard-summary")]
    public async Task<IActionResult> GetDashboardSummary([FromQuery] Guid? companyId, [FromQuery] Guid? employeeId)
    {
        var targetCompanyId = companyId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var result = await _analyticsService.GetDashboardSummaryAsync(targetCompanyId, employeeId);
        return Ok(result);
    }

    [HttpGet("analytics/reports/{reportType}/export")]
    public async Task<IActionResult> ExportEnterpriseReport(string reportType, [FromQuery] Guid? companyId, [FromQuery] int? year)
    {
        var targetCompanyId = companyId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        int targetYear = year ?? DateTime.UtcNow.Year;

        var csvBytes = await _analyticsService.ExportEnterpriseReportAsync(targetCompanyId, reportType, targetYear);
        return File(csvBytes, "text/csv", $"IndiaHRMS_Leave_Report_{reportType}_{targetYear}.csv");
    }
}
