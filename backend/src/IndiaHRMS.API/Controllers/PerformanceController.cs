using AutoMapper;
using IndiaHRMS.Application.DTOs.Performance;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/performance")]
[ApiVersion("1.0")]
[Authorize]
public class PerformanceController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;

    public PerformanceController(AppDbContext context, IMapper mapper, ICurrentUserService currentUser)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
    }

    // ─── Appraisal Cycles ────────────────────────────────────────────────────────

    [HttpGet("cycles")]
    public async Task<ActionResult<ApiResponse<List<AppraisalCycleDto>>>> GetCycles(CancellationToken ct)
    {
        var query = _context.AppraisalCycles.AsQueryable();
        if (_currentUser.CompanyId.HasValue)
            query = query.Where(c => c.CompanyId == _currentUser.CompanyId.Value);

        var cycles = await query.OrderByDescending(c => c.StartDate).ToListAsync(ct);
        return Ok(ApiResponse<List<AppraisalCycleDto>>.Ok(_mapper.Map<List<AppraisalCycleDto>>(cycles)));
    }

    [HttpPost("cycles")]
    [Filters.RequirePermission(PermissionCodes.Performance.Create)]
    public async Task<ActionResult<ApiResponse<AppraisalCycleDto>>> CreateCycle([FromBody] CreateAppraisalCycleRequest request, CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        if (!companyId.HasValue)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(ct);
            if (company == null) return BadRequest(ApiResponse<AppraisalCycleDto>.Fail("Company not configured."));
            companyId = company.CompanyId;
        }

        var cycle = _mapper.Map<AppraisalCycle>(request);
        cycle.CompanyId = companyId.Value;

        _context.AppraisalCycles.Add(cycle);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<AppraisalCycleDto>.Ok(_mapper.Map<AppraisalCycleDto>(cycle), "Appraisal cycle created successfully."));
    }

    // ─── Employee Goals (OKRs) ───────────────────────────────────────────────────

    [HttpGet("goals")]
    public async Task<ActionResult<ApiResponse<List<EmployeeGoalDto>>>> GetGoals([FromQuery] Guid? employeeId, [FromQuery] Guid? cycleId, CancellationToken ct)
    {
        var query = _context.EmployeeGoals
            .Include(g => g.Employee)
            .AsQueryable();

        if (_currentUser.CompanyId.HasValue)
            query = query.Where(g => g.Employee.CompanyId == _currentUser.CompanyId.Value);

        // Filter by EmployeeId
        if (employeeId.HasValue)
        {
            if (employeeId.Value != _currentUser.EmployeeId && 
                !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
            {
                var emp = await _context.Employees.FindAsync(new object[] { employeeId.Value }, ct);
                if (emp == null || emp.ReportingManagerId != _currentUser.EmployeeId)
                {
                    return Forbid();
                }
            }
            query = query.Where(g => g.EmployeeId == employeeId.Value);
        }
        else
        {
            if (!_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin) && 
                !_currentUser.HasRole(RoleCodes.DeptManager))
            {
                if (!_currentUser.EmployeeId.HasValue)
                    return BadRequest(ApiResponse<List<EmployeeGoalDto>>.Fail("No employee linked to this user account."));
                query = query.Where(g => g.EmployeeId == _currentUser.EmployeeId.Value);
            }
            else if (_currentUser.HasRole(RoleCodes.DeptManager) && 
                     !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
            {
                query = query.Where(g => g.Employee.ReportingManagerId == _currentUser.EmployeeId || g.EmployeeId == _currentUser.EmployeeId);
            }
        }

        if (cycleId.HasValue)
        {
            query = query.Where(g => g.CycleId == cycleId.Value);
        }

        var goals = await query.ToListAsync(ct);
        return Ok(ApiResponse<List<EmployeeGoalDto>>.Ok(_mapper.Map<List<EmployeeGoalDto>>(goals)));
    }

    [HttpPost("goals")]
    public async Task<ActionResult<ApiResponse<EmployeeGoalDto>>> CreateGoal([FromBody] CreateGoalRequest request, CancellationToken ct)
    {
        var targetEmployeeId = request.EmployeeId ?? _currentUser.EmployeeId;
        if (!targetEmployeeId.HasValue)
            return BadRequest(ApiResponse<EmployeeGoalDto>.Fail("Employee ID must be provided."));

        if (targetEmployeeId.Value != _currentUser.EmployeeId && 
            !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
        {
            var emp = await _context.Employees.FindAsync(new object[] { targetEmployeeId.Value }, ct);
            if (emp == null || emp.ReportingManagerId != _currentUser.EmployeeId)
            {
                return Forbid();
            }
        }

        var cycle = await _context.AppraisalCycles.FindAsync(new object[] { request.CycleId }, ct);
        if (cycle == null)
            return NotFound(ApiResponse<EmployeeGoalDto>.Fail("Appraisal cycle not found."));

        var goal = _mapper.Map<EmployeeGoal>(request);
        goal.EmployeeId = targetEmployeeId.Value;

        _context.EmployeeGoals.Add(goal);
        await _context.SaveChangesAsync(ct);

        var savedGoal = await _context.EmployeeGoals
            .Include(g => g.Employee)
            .FirstAsync(g => g.GoalId == goal.GoalId, ct);

        return Ok(ApiResponse<EmployeeGoalDto>.Ok(_mapper.Map<EmployeeGoalDto>(savedGoal), "Goal created successfully."));
    }

    [HttpPut("goals/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EmployeeGoalDto>>> UpdateGoal(Guid id, [FromBody] UpdateGoalRequest request, CancellationToken ct)
    {
        var goal = await _context.EmployeeGoals
            .Include(g => g.Employee)
            .FirstOrDefaultAsync(g => g.GoalId == id, ct);

        if (goal == null)
            return NotFound(ApiResponse<EmployeeGoalDto>.Fail("Goal not found."));

        bool isAdmin = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin);
        bool isSelf = goal.EmployeeId == _currentUser.EmployeeId;
        bool isManager = goal.Employee.ReportingManagerId == _currentUser.EmployeeId;

        if (!isSelf && !isManager && !isAdmin)
            return Forbid();

        if (isSelf || isAdmin)
        {
            goal.GoalTitle = request.GoalTitle;
            goal.Description = request.Description;
            goal.KPI = request.KPI;
            goal.TargetValue = request.TargetValue;
            goal.ActualValue = request.ActualValue;
            goal.Weightage = request.Weightage;
            goal.SelfRating = request.SelfRating;
            goal.Status = request.Status;
        }

        if (isManager || isAdmin)
        {
            if (request.ManagerRating.HasValue)
            {
                goal.ManagerRating = request.ManagerRating;
                goal.Status = "Completed";
            }
        }

        goal.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<EmployeeGoalDto>.Ok(_mapper.Map<EmployeeGoalDto>(goal), "Goal updated successfully."));
    }

    [HttpDelete("goals/{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteGoal(Guid id, CancellationToken ct)
    {
        var goal = await _context.EmployeeGoals
            .Include(g => g.Employee)
            .FirstOrDefaultAsync(g => g.GoalId == id, ct);

        if (goal == null)
            return NotFound(ApiResponse<object>.Fail("Goal not found."));

        if (goal.EmployeeId != _currentUser.EmployeeId && 
            !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin) &&
            goal.Employee.ReportingManagerId != _currentUser.EmployeeId)
        {
            return Forbid();
        }

        _context.EmployeeGoals.Remove(goal);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(null, "Goal deleted successfully."));
    }

    // ─── Performance Reviews ─────────────────────────────────────────────────────

    [HttpGet("reviews")]
    public async Task<ActionResult<ApiResponse<List<PerformanceReviewDto>>>> GetReviews([FromQuery] Guid? employeeId, [FromQuery] Guid? reviewerId, [FromQuery] Guid? cycleId, CancellationToken ct)
    {
        var query = _context.PerformanceReviews
            .Include(r => r.Cycle)
            .Include(r => r.Employee).ThenInclude(e => e.Department)
            .Include(r => r.Employee).ThenInclude(e => e.Designation)
            .Include(r => r.Reviewer)
            .AsQueryable();

        if (_currentUser.CompanyId.HasValue)
            query = query.Where(r => r.Employee.CompanyId == _currentUser.CompanyId.Value);

        if (employeeId.HasValue)
        {
            if (employeeId.Value != _currentUser.EmployeeId && 
                !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
            {
                var emp = await _context.Employees.FindAsync(new object[] { employeeId.Value }, ct);
                if (emp == null || emp.ReportingManagerId != _currentUser.EmployeeId)
                {
                    return Forbid();
                }
            }
            query = query.Where(r => r.EmployeeId == employeeId.Value);
        }
        else
        {
            if (!_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin) && 
                !_currentUser.HasRole(RoleCodes.DeptManager))
            {
                if (!_currentUser.EmployeeId.HasValue)
                    return BadRequest(ApiResponse<List<PerformanceReviewDto>>.Fail("No employee profile linked to this user account."));
                query = query.Where(r => r.EmployeeId == _currentUser.EmployeeId.Value);
            }
            else if (_currentUser.HasRole(RoleCodes.DeptManager) && 
                     !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
            {
                query = query.Where(r => r.Employee.ReportingManagerId == _currentUser.EmployeeId || r.EmployeeId == _currentUser.EmployeeId || r.ReviewerId == _currentUser.EmployeeId);
            }
        }

        if (reviewerId.HasValue)
            query = query.Where(r => r.ReviewerId == reviewerId.Value);

        if (cycleId.HasValue)
            query = query.Where(r => r.CycleId == cycleId.Value);

        var reviews = await query.ToListAsync(ct);
        return Ok(ApiResponse<List<PerformanceReviewDto>>.Ok(_mapper.Map<List<PerformanceReviewDto>>(reviews)));
    }

    [HttpPost("reviews")]
    public async Task<ActionResult<ApiResponse<PerformanceReviewDto>>> SubmitReview([FromBody] CreateReviewRequest request, CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<PerformanceReviewDto>.Fail("No employee profile linked."));

        if (request.EmployeeId != _currentUser.EmployeeId && 
            !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin, RoleCodes.DeptManager))
        {
            return Forbid();
        }

        if (request.EmployeeId != _currentUser.EmployeeId)
        {
            var emp = await _context.Employees.FindAsync(new object[] { request.EmployeeId }, ct);
            if (emp == null) return NotFound(ApiResponse<PerformanceReviewDto>.Fail("Employee not found."));
            if (emp.ReportingManagerId != _currentUser.EmployeeId && 
                !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
            {
                return Forbid();
            }
        }

        var existing = await _context.PerformanceReviews
            .FirstOrDefaultAsync(r => r.CycleId == request.CycleId && 
                                      r.EmployeeId == request.EmployeeId && 
                                      r.ReviewType == request.ReviewType, ct);

        PerformanceReview review;
        if (existing != null)
        {
            review = existing;
            _mapper.Map(request, review);
            review.ReviewerId = _currentUser.EmployeeId.Value;
            review.SubmittedAt = DateTime.UtcNow;
            review.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            review = _mapper.Map<PerformanceReview>(request);
            review.ReviewerId = _currentUser.EmployeeId.Value;
            review.SubmittedAt = DateTime.UtcNow;
            _context.PerformanceReviews.Add(review);
        }

        await _context.SaveChangesAsync(ct);

        var savedReview = await _context.PerformanceReviews
            .Include(r => r.Cycle)
            .Include(r => r.Employee).ThenInclude(e => e.Department)
            .Include(r => r.Employee).ThenInclude(e => e.Designation)
            .Include(r => r.Reviewer)
            .FirstAsync(r => r.ReviewId == review.ReviewId, ct);

        return Ok(ApiResponse<PerformanceReviewDto>.Ok(_mapper.Map<PerformanceReviewDto>(savedReview), "Performance review submitted successfully."));
    }

    // ─── PIP (Performance Improvement Plan) ──────────────────────────────────────

    [HttpGet("pips")]
    public async Task<ActionResult<ApiResponse<List<PipDto>>>> GetPips([FromQuery] Guid? employeeId, CancellationToken ct)
    {
        var query = _context.PIPs
            .Include(p => p.Employee).ThenInclude(e => e.Department)
            .Include(p => p.Employee).ThenInclude(e => e.Designation)
            .AsQueryable();

        if (_currentUser.CompanyId.HasValue)
            query = query.Where(p => p.Employee.CompanyId == _currentUser.CompanyId.Value);

        if (employeeId.HasValue)
        {
            if (employeeId.Value != _currentUser.EmployeeId && 
                !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
            {
                var emp = await _context.Employees.FindAsync(new object[] { employeeId.Value }, ct);
                if (emp == null || emp.ReportingManagerId != _currentUser.EmployeeId)
                    return Forbid();
            }
            query = query.Where(p => p.EmployeeId == employeeId.Value);
        }
        else
        {
            if (!_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin) && 
                !_currentUser.HasRole(RoleCodes.DeptManager))
            {
                if (!_currentUser.EmployeeId.HasValue)
                    return BadRequest(ApiResponse<List<PipDto>>.Fail("No employee linked."));
                query = query.Where(p => p.EmployeeId == _currentUser.EmployeeId.Value);
            }
            else if (_currentUser.HasRole(RoleCodes.DeptManager) && 
                     !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
            {
                query = query.Where(p => p.Employee.ReportingManagerId == _currentUser.EmployeeId || p.EmployeeId == _currentUser.EmployeeId);
            }
        }

        var pips = await query.ToListAsync(ct);
        var dtos = new List<PipDto>();

        foreach (var pip in pips)
        {
            var dto = _mapper.Map<PipDto>(pip);
            var initiator = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == pip.InitiatedBy, ct);
            dto.InitiatorName = initiator != null ? $"{initiator.FirstName} {initiator.LastName}" : "System / Manager";
            dtos.Add(dto);
        }

        return Ok(ApiResponse<List<PipDto>>.Ok(dtos));
    }

    [HttpPost("pips")]
    public async Task<ActionResult<ApiResponse<PipDto>>> CreatePip([FromBody] CreatePipRequest request, CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<PipDto>.Fail("No employee linked."));

        if (!_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin, RoleCodes.DeptManager))
            return Forbid();

        if (!_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
        {
            var emp = await _context.Employees.FindAsync(new object[] { request.EmployeeId }, ct);
            if (emp == null || emp.ReportingManagerId != _currentUser.EmployeeId)
                return Forbid();
        }

        var pip = _mapper.Map<PIP>(request);
        pip.InitiatedBy = _currentUser.EmployeeId.Value;
        pip.Status = PIPStatus.Active;

        _context.PIPs.Add(pip);
        await _context.SaveChangesAsync(ct);

        var savedPip = await _context.PIPs
            .Include(p => p.Employee).ThenInclude(e => e.Department)
            .Include(p => p.Employee).ThenInclude(e => e.Designation)
            .FirstAsync(p => p.PIPId == pip.PIPId, ct);

        var dto = _mapper.Map<PipDto>(savedPip);
        var initiator = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == pip.InitiatedBy, ct);
        dto.InitiatorName = initiator != null ? $"{initiator.FirstName} {initiator.LastName}" : "System / Manager";

        return Ok(ApiResponse<PipDto>.Ok(dto, "PIP initiated successfully."));
    }

    [HttpPut("pips/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PipDto>>> UpdatePip(Guid id, [FromBody] UpdatePipRequest request, CancellationToken ct)
    {
        var pip = await _context.PIPs
            .Include(p => p.Employee)
            .FirstOrDefaultAsync(p => p.PIPId == id, ct);

        if (pip == null)
            return NotFound(ApiResponse<PipDto>.Fail("PIP not found."));

        bool isAdmin = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin);
        bool isInitiator = pip.InitiatedBy == _currentUser.EmployeeId;
        bool isManager = pip.Employee.ReportingManagerId == _currentUser.EmployeeId;

        if (!isAdmin && !isInitiator && !isManager)
            return Forbid();

        pip.ImprovementAreas = request.ImprovementAreas;
        pip.Milestones = request.Milestones;
        pip.Status = request.Status;
        if (request.Status == PIPStatus.Closed || request.Status == PIPStatus.Completed || request.Status == PIPStatus.Terminated)
        {
            pip.ClosedAt = DateTime.UtcNow;
        }
        pip.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        var savedPip = await _context.PIPs
            .Include(p => p.Employee).ThenInclude(e => e.Department)
            .Include(p => p.Employee).ThenInclude(e => e.Designation)
            .FirstAsync(p => p.PIPId == pip.PIPId, ct);

        var dto = _mapper.Map<PipDto>(savedPip);
        var initiator = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == pip.InitiatedBy, ct);
        dto.InitiatorName = initiator != null ? $"{initiator.FirstName} {initiator.LastName}" : "System / Manager";

        return Ok(ApiResponse<PipDto>.Ok(dto, "PIP updated successfully."));
    }
}
