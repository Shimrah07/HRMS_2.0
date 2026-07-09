using AutoMapper;
using IndiaHRMS.Application.DTOs.Recruitment;
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
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/job-postings")]
[ApiVersion("1.0")]
[Authorize]
public class JobPostingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;

    public JobPostingsController(AppDbContext context, IMapper mapper, ICurrentUserService currentUser)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
    }

    // Public Endpoint - List active job postings
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<JobPostingDto>>>> GetActivePostings(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var postings = await _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Designation)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Grade)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .Where(p => p.Status == JobPostingStatus.Active && (p.ExpiryDate == null || p.ExpiryDate >= today))
            .OrderByDescending(p => p.PostedAt)
            .ToListAsync(ct);

        var dtos = _mapper.Map<List<JobPostingDto>>(postings);
        return Ok(ApiResponse<List<JobPostingDto>>.Ok(dtos));
    }

    // Public Endpoint - Get active job posting details
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<JobPostingDto>>> GetPostingDetails(Guid id, CancellationToken ct)
    {
        var posting = await _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Designation)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Grade)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        if (posting == null)
        {
            return NotFound(ApiResponse<JobPostingDto>.Fail("Job posting not found."));
        }

        // If not active or expired, restrict to authorized recruitment view users
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var isActive = posting.Status == JobPostingStatus.Active && (posting.ExpiryDate == null || posting.ExpiryDate >= today);
        if (!isActive)
        {
            if (!_currentUser.IsAuthenticated || !_currentUser.HasPermission(PermissionCodes.Recruitment.View))
            {
                return NotFound(ApiResponse<JobPostingDto>.Fail("Job posting is no longer active."));
            }
        }

        var dto = _mapper.Map<JobPostingDto>(posting);
        return Ok(ApiResponse<JobPostingDto>.Ok(dto));
    }

    // Admin Endpoint - List all job postings for HR workspace
    [HttpGet("admin")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<JobPostingDto>>>> GetAdminPostings(
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Designation)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Grade)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .AsQueryable();

        if (_currentUser.CompanyId.HasValue)
        {
            query = query.Where(p => p.JobRequisition.CompanyId == _currentUser.CompanyId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<JobPostingStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(p => p.Status == parsedStatus);
            }
            else
            {
                // Fallback to empty list or search string directly
                query = query.Where(p => false);
            }
        }

        var postings = await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        var dtos = _mapper.Map<List<JobPostingDto>>(postings);
        return Ok(ApiResponse<List<JobPostingDto>>.Ok(dtos));
    }

    // Admin Endpoint - Create new job posting from approved requisition
    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<JobPostingDto>>> CreatePosting(
        [FromBody] CreateJobPostingRequest request,
        CancellationToken ct)
    {
        // Requisition must exist and be Approved
        var req = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == request.ReqId, ct);
        if (req == null)
        {
            return BadRequest(ApiResponse<JobPostingDto>.Fail("Associated Job Requisition not found."));
        }

        if (req.Status != RequisitionStatus.Approved)
        {
            return BadRequest(ApiResponse<JobPostingDto>.Fail("Cannot create posting. Requisition is not Approved."));
        }

        // Check if there is already a posting for this requisition
        var exists = await _context.JobPostings.AnyAsync(p => p.ReqId == request.ReqId, ct);
        if (exists)
        {
            return BadRequest(ApiResponse<JobPostingDto>.Fail("A Job Posting already exists for this Requisition."));
        }

        var posting = _mapper.Map<JobPosting>(request);
        posting.JobId = Guid.NewGuid();
        posting.Status = JobPostingStatus.Draft;
        posting.PostedAt = DateTime.UtcNow;

        _context.JobPostings.Add(posting);
        await _context.SaveChangesAsync(ct);

        var savedPosting = await _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Designation)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Grade)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .FirstOrDefaultAsync(p => p.JobId == posting.JobId, ct);

        var dto = _mapper.Map<JobPostingDto>(savedPosting);
        return CreatedAtAction(nameof(GetPostingDetails), new { id = posting.JobId }, ApiResponse<JobPostingDto>.Ok(dto));
    }

    // Admin Endpoint - Update job posting details
    [HttpPut("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobPostingDto>>> UpdatePosting(
        Guid id,
        [FromBody] UpdateJobPostingRequest request,
        CancellationToken ct)
    {
        var posting = await _context.JobPostings
            .Include(p => p.JobRequisition)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        if (posting == null)
        {
            return NotFound(ApiResponse<JobPostingDto>.Fail("Job posting not found."));
        }

        // Scope validation
        if (_currentUser.CompanyId.HasValue && posting.JobRequisition.CompanyId != _currentUser.CompanyId.Value)
        {
            return Forbid();
        }

        // Remove old child collections to overwrite cleanly
        _context.JobPostingChannels.RemoveRange(posting.PublishingChannels);
        _context.JobPostingPerks.RemoveRange(posting.PerksAndBenefits);
        _context.JobPostingQuestions.RemoveRange(posting.JobPostingQuestions);

        _mapper.Map(request, posting);
        
        // Enforce valid status values
        if (Enum.TryParse<JobPostingStatus>(request.Status, true, out var statusVal))
        {
            posting.Status = statusVal;
        }
        else
        {
            posting.Status = JobPostingStatus.Draft;
        }

        await _context.SaveChangesAsync(ct);

        var savedPosting = await _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Designation)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Grade)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        var dto = _mapper.Map<JobPostingDto>(savedPosting);
        return Ok(ApiResponse<JobPostingDto>.Ok(dto, "Job posting updated successfully."));
    }

    // Admin Endpoint - Publish job posting
    [HttpPost("{id:guid}/publish")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobPostingDto>>> PublishPosting(Guid id, CancellationToken ct)
    {
        var posting = await _context.JobPostings
            .Include(p => p.JobRequisition)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        if (posting == null)
        {
            return NotFound(ApiResponse<JobPostingDto>.Fail("Job posting not found."));
        }

        // Scope validation
        if (_currentUser.CompanyId.HasValue && posting.JobRequisition.CompanyId != _currentUser.CompanyId.Value)
        {
            return Forbid();
        }

        posting.Status = JobPostingStatus.Active;
        posting.PostedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        var savedPosting = await _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Designation)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Grade)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        var dto = _mapper.Map<JobPostingDto>(savedPosting);
        return Ok(ApiResponse<JobPostingDto>.Ok(dto, "Job posting published successfully."));
    }

    // Admin Endpoint - Close job posting
    [HttpPost("{id:guid}/close")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobPostingDto>>> ClosePosting(Guid id, CancellationToken ct)
    {
        var posting = await _context.JobPostings
            .Include(p => p.JobRequisition)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        if (posting == null)
        {
            return NotFound(ApiResponse<JobPostingDto>.Fail("Job posting not found."));
        }

        // Scope validation
        if (_currentUser.CompanyId.HasValue && posting.JobRequisition.CompanyId != _currentUser.CompanyId.Value)
        {
            return Forbid();
        }

        posting.Status = JobPostingStatus.Closed;

        await _context.SaveChangesAsync(ct);

        var savedPosting = await _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Designation)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Grade)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        var dto = _mapper.Map<JobPostingDto>(savedPosting);
        return Ok(ApiResponse<JobPostingDto>.Ok(dto, "Job posting closed successfully."));
    }

    // Admin Endpoint - Unpublish job posting
    [HttpPost("{id:guid}/unpublish")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobPostingDto>>> UnpublishPosting(Guid id, CancellationToken ct)
    {
        var posting = await _context.JobPostings
            .Include(p => p.JobRequisition)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        if (posting == null)
        {
            return NotFound(ApiResponse<JobPostingDto>.Fail("Job posting not found."));
        }

        // Scope validation
        if (_currentUser.CompanyId.HasValue && posting.JobRequisition.CompanyId != _currentUser.CompanyId.Value)
        {
            return Forbid();
        }

        posting.Status = JobPostingStatus.Draft;

        await _context.SaveChangesAsync(ct);

        var savedPosting = await _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Designation)
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Grade)
            .Include(p => p.PublishingChannels)
            .Include(p => p.PerksAndBenefits)
            .Include(p => p.JobPostingQuestions)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        var dto = _mapper.Map<JobPostingDto>(savedPosting);
        return Ok(ApiResponse<JobPostingDto>.Ok(dto, "Job posting unpublished successfully."));
    }

    // Admin Endpoint - Delete job posting
    [HttpDelete("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePosting(Guid id, CancellationToken ct)
    {
        var posting = await _context.JobPostings
            .Include(p => p.JobRequisition)
            .FirstOrDefaultAsync(p => p.JobId == id, ct);

        if (posting == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Job posting not found."));
        }

        // Scope validation
        if (_currentUser.CompanyId.HasValue && posting.JobRequisition.CompanyId != _currentUser.CompanyId.Value)
        {
            return Forbid();
        }

        _context.JobPostings.Remove(posting);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<bool>.Ok(true, "Job posting deleted successfully."));
    }
}
