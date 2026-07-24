using AutoMapper;
using IndiaHRMS.Application.DTOs.Recruitment;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
    private readonly IApplicationService _applicationService;
    private readonly IFileService _fileService;

    public JobPostingsController(
        AppDbContext context,
        IMapper mapper,
        ICurrentUserService currentUser,
        IApplicationService applicationService,
        IFileService fileService)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
        _applicationService = applicationService;
        _fileService = fileService;
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
            .Where(p => p.Status == JobPostingStatus.Published && (p.ExpiryDate == null || p.ExpiryDate >= today))
            .OrderByDescending(p => p.PostedAt)
            .ToListAsync(ct);

        var dtos = _mapper.Map<List<JobPostingDto>>(postings);
        await PopulateMetadataAsync(dtos, ct);
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
        var isActive = posting.Status == JobPostingStatus.Published && (posting.ExpiryDate == null || posting.ExpiryDate >= today);
        if (!isActive)
        {
            if (!_currentUser.IsAuthenticated || !_currentUser.HasPermission(PermissionCodes.Recruitment.View))
            {
                return NotFound(ApiResponse<JobPostingDto>.Fail("Job posting is no longer active."));
            }
        }

        var dto = _mapper.Map<JobPostingDto>(posting);
        await PopulateMetadataAsync(new List<JobPostingDto> { dto }, ct);
        return Ok(ApiResponse<JobPostingDto>.Ok(dto));
    }

    // Admin Endpoint - List all job postings for HR workspace
    [HttpGet("admin")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<JobPostingDto>>>> GetAdminPostings(
        [FromQuery] string? status,
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? hiringManagerId,
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

        if (departmentId.HasValue)
        {
            query = query.Where(p => p.JobRequisition.DeptId == departmentId.Value);
        }

        if (hiringManagerId.HasValue)
        {
            query = query.Where(p => p.JobRequisition.HiringManagerId == hiringManagerId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            var statusToParse = status;
            if (status.Equals("Active", StringComparison.OrdinalIgnoreCase))
            {
                statusToParse = "Published";
            }
            else if (status.Equals("Expired", StringComparison.OrdinalIgnoreCase))
            {
                statusToParse = "Closed";
            }

            if (Enum.TryParse<JobPostingStatus>(statusToParse, true, out var parsedStatus))
            {
                query = query.Where(p => p.Status == parsedStatus);
            }
            else
            {
                query = query.Where(p => false);
            }
        }

        var postings = await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        var dtos = _mapper.Map<List<JobPostingDto>>(postings);
        
        await PopulateMetadataAsync(dtos, ct);
        
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
        await PopulateMetadataAsync(new List<JobPostingDto> { dto }, ct);
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

        posting.PublishingChannels.Clear();
        posting.PerksAndBenefits.Clear();
        posting.JobPostingQuestions.Clear();

        _mapper.Map(request, posting);

        // Map collection properties manually to avoid EF concurrency tracking conflicts
        if (request.PublishingChannels != null)
        {
            foreach (var ch in request.PublishingChannels)
            {
                var item = new JobPostingChannel
                {
                    JobId = posting.JobId,
                    ChannelName = ch
                };
                _context.Entry(item).State = EntityState.Added;
                posting.PublishingChannels.Add(item);
            }
        }

        if (request.PerksAndBenefits != null)
        {
            foreach (var perk in request.PerksAndBenefits)
            {
                var item = new JobPostingPerk
                {
                    JobId = posting.JobId,
                    PerkName = perk
                };
                _context.Entry(item).State = EntityState.Added;
                posting.PerksAndBenefits.Add(item);
            }
        }

        if (request.JobPostingQuestions != null)
        {
            foreach (var q in request.JobPostingQuestions)
            {
                var item = new JobPostingQuestion
                {
                    JobPostingId = posting.JobId,
                    Question = q.Question,
                    QuestionType = q.QuestionType,
                    Required = q.Required,
                    DealBreaker = q.DealBreaker,
                    ExpectedAnswer = q.ExpectedAnswer,
                    Sequence = q.Sequence,
                    Weightage = q.Weightage
                };
                _context.Entry(item).State = EntityState.Added;
                posting.JobPostingQuestions.Add(item);
            }
        }
        
        // Enforce valid status values
        var statusStr = request.Status;
        if (!string.IsNullOrEmpty(statusStr))
        {
            if (statusStr.Equals("Active", StringComparison.OrdinalIgnoreCase)) statusStr = "Published";
            else if (statusStr.Equals("Expired", StringComparison.OrdinalIgnoreCase)) statusStr = "Closed";
        }
        
        if (Enum.TryParse<JobPostingStatus>(statusStr, true, out var statusVal))
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
        await PopulateMetadataAsync(new List<JobPostingDto> { dto }, ct);
        return Ok(ApiResponse<JobPostingDto>.Ok(dto, "Job posting updated successfully."));
    }

    // Admin Endpoint - Publish job posting
    [HttpPost("{id:guid}/publish")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobPostingDto>>> PublishPosting(Guid id, CancellationToken ct)
    {
        // Enforce RBAC Check: Only HR Admin or Super Admin can publish jobs!
        var isAuthorized = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin);
        if (!isAuthorized)
        {
            return Forbid();
        }

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

        posting.Status = JobPostingStatus.Published;
        posting.PostedAt = DateTime.UtcNow;
        posting.PublishedById = _currentUser.UserId;

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
        await PopulateMetadataAsync(new List<JobPostingDto> { dto }, ct);
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
        await PopulateMetadataAsync(new List<JobPostingDto> { dto }, ct);
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
        await PopulateMetadataAsync(new List<JobPostingDto> { dto }, ct);
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

    private async Task PopulateMetadataAsync(List<JobPostingDto> dtos, CancellationToken ct)
    {
        if (dtos == null || !dtos.Any()) return;

        var reqIds = dtos.Select(d => d.ReqId).Distinct().ToList();

        // Fetch applicant counts grouped by ReqId
        var appCounts = await _context.JobApplications
            .Where(a => reqIds.Contains(a.ReqId))
            .GroupBy(a => a.ReqId)
            .Select(g => new { ReqId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReqId, x => x.Count, ct);

        // Fetch requisition details (MrfNumber, HiringManagerId, NoOfPositions)
        var requisitions = await _context.JobRequisitions
            .Where(r => reqIds.Contains(r.ReqId))
            .Select(r => new { r.ReqId, r.MrfNumber, r.HiringManagerId, r.NoOfPositions })
            .ToDictionaryAsync(x => x.ReqId, x => x, ct);

        // Fetch all employees to resolve Hiring Manager names
        var managerIds = requisitions.Values
            .Select(r => r.HiringManagerId)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var employeeNames = await _context.Employees
            .Where(e => managerIds.Contains(e.EmployeeId))
            .Select(e => new { e.EmployeeId, Name = $"{e.FirstName} {e.LastName}" })
            .ToDictionaryAsync(x => x.EmployeeId, x => x.Name, ct);

        // Fetch user names for PublishedBy
        var publisherUserIds = dtos
            .Select(d => d.PublishedById)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var userNames = await _context.Users
            .Where(u => publisherUserIds.Contains(u.UserId))
            .Select(u => new { u.UserId, Name = $"{u.FirstName} {u.LastName}" })
            .ToDictionaryAsync(x => x.UserId, x => x.Name, ct);

        foreach (var dto in dtos)
        {
            if (appCounts.TryGetValue(dto.ReqId, out var count))
            {
                dto.ApplicantCount = count;
            }

            if (requisitions.TryGetValue(dto.ReqId, out var req))
            {
                dto.MrfNumber = req.MrfNumber;
                dto.NoOfPositions = req.NoOfPositions;
                if (req.HiringManagerId.HasValue && employeeNames.TryGetValue(req.HiringManagerId.Value, out var hmName))
                {
                    dto.HiringManagerName = hmName;
                }
            }

            if (dto.PublishedById.HasValue && userNames.TryGetValue(dto.PublishedById.Value, out var pubName))
            {
                dto.PublishedByName = pubName;
            }
        }
    }

    // ─── POST /job-postings/{id}/apply ─────────────────────────────────────────
    // Unified candidate entry: Manual HR Entry + future Careers Portal
    [HttpPost("{id:guid}/apply")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<ApplyToJobResult>>> ApplyToJob(
        Guid id,
        [FromForm] ApplyToJobRequest request,
        [FromForm] IFormFile? resumeFile,
        CancellationToken ct)
    {
        // Set JobId from route
        request.JobId = id;

        // Auto-assign recruiter = the currently logged-in HR Admin / Super Admin
        request.AddedByUserId = _currentUser.UserId;

        // Upload resume first if provided
        if (resumeFile != null && resumeFile.Length > 0)
        {
            using var stream = resumeFile.OpenReadStream();
            var folder = $"resumes/{id}";
            request.ResumeFilePath = await _fileService.SaveAsync(stream, resumeFile.FileName, folder, ct);
        }


        try
        {
            var result = await _applicationService.ApplyToJobAsync(request, ct);
            return Ok(ApiResponse<ApplyToJobResult>.Ok(result,
                result.IsNewCandidate
                    ? $"New candidate added successfully. Recruiter: {result.AssignedRecruiterName ?? "Unassigned"}."
                    : $"Existing candidate linked to job. Recruiter: {result.AssignedRecruiterName ?? "Unassigned"}."));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already applied"))
        {
            return Conflict(ApiResponse<ApplyToJobResult>.Fail("This candidate has already applied for this job opening."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ApplyToJobResult>.Fail(ex.Message));
        }
    }
}

