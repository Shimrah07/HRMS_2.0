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
[Route("api/v{version:apiVersion}/job-applications")]
[ApiVersion("1.0")]
[Authorize]
public class JobApplicationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public JobApplicationsController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<JobApplicationDto>>>> GetApplications(
        [FromQuery] Guid? reqId,
        [FromQuery] Guid? candidateId,
        [FromQuery] ApplicationStage? stage,
        CancellationToken ct)
    {
        var query = _context.JobApplications
            .Include(a => a.Requisition)
            .Include(a => a.Candidate)
            .AsQueryable();

        // Scope validation
        if (_context.UserRoles.Any()) // Only filter by company if DB has records
        {
            // E.g., filters if company scope is available
        }

        if (reqId.HasValue)
        {
            query = query.Where(a => a.ReqId == reqId.Value);
        }

        if (candidateId.HasValue)
        {
            query = query.Where(a => a.CandidateId == candidateId.Value);
        }

        if (stage.HasValue)
        {
            query = query.Where(a => a.CurrentStage == stage.Value);
        }

        var list = await query.OrderByDescending(a => a.ApplicationDate).ToListAsync(ct);
        
        var dtos = new List<JobApplicationDto>();
        foreach (var app in list)
        {
            var dto = _mapper.Map<JobApplicationDto>(app);
            dto.AiMatchScore = CalculateMatchScore(app.Candidate, app.Requisition);
            dtos.Add(dto);
        }

        return Ok(ApiResponse<List<JobApplicationDto>>.Ok(dtos));
    }

    [HttpGet("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<JobApplicationDto>>> GetApplication(Guid id, CancellationToken ct)
    {
        var app = await _context.JobApplications
            .Include(a => a.Requisition)
            .Include(a => a.Candidate)
            .Include(a => a.InterviewRounds)
            .FirstOrDefaultAsync(a => a.AppId == id, ct);

        if (app == null)
        {
            return NotFound(ApiResponse<JobApplicationDto>.Fail("Job application not found."));
        }

        var dto = _mapper.Map<JobApplicationDto>(app);
        dto.AiMatchScore = CalculateMatchScore(app.Candidate, app.Requisition);
        return Ok(ApiResponse<JobApplicationDto>.Ok(dto));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<JobApplicationDto>>> CreateApplication(
        [FromBody] CreateJobApplicationRequest request,
        CancellationToken ct)
    {
        var req = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == request.ReqId, ct);
        if (req == null)
        {
            return BadRequest(ApiResponse<JobApplicationDto>.Fail("Job requisition not found."));
        }

        var cand = await _context.Candidates.FirstOrDefaultAsync(c => c.CandidateId == request.CandidateId, ct);
        if (cand == null)
        {
            return BadRequest(ApiResponse<JobApplicationDto>.Fail("Candidate not found."));
        }

        // Check if application already exists
        var exists = await _context.JobApplications.AnyAsync(a => 
            a.ReqId == request.ReqId && a.CandidateId == request.CandidateId, ct);
        if (exists)
        {
            return Conflict(ApiResponse<JobApplicationDto>.Fail("Candidate has already applied for this job requisition."));
        }

        var app = new JobApplication
        {
            AppId = Guid.NewGuid(),
            ReqId = request.ReqId,
            CandidateId = request.CandidateId,
            ApplicationDate = DateTime.UtcNow,
            CurrentStage = ApplicationStage.Applied
        };

        _context.JobApplications.Add(app);
        await _context.SaveChangesAsync(ct);

        // Reload to load navigations for response
        var savedApp = await _context.JobApplications
            .Include(a => a.Requisition)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.AppId == app.AppId, ct);

        var dto = _mapper.Map<JobApplicationDto>(savedApp);
        dto.AiMatchScore = CalculateMatchScore(cand, req);

        return CreatedAtAction(nameof(GetApplication), new { id = app.AppId }, ApiResponse<JobApplicationDto>.Ok(dto));
    }

    [HttpPut("{id:guid}/stage")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobApplicationDto>>> UpdateApplicationStage(
        Guid id,
        [FromBody] UpdateApplicationStageRequest request,
        CancellationToken ct)
    {
        var app = await _context.JobApplications
            .Include(a => a.Requisition)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.AppId == id, ct);

        if (app == null)
        {
            return NotFound(ApiResponse<JobApplicationDto>.Fail("Job application not found."));
        }

        // Validate stage transitions
        var current = app.CurrentStage;
        var target = request.Stage;

        if (target != ApplicationStage.Rejected && target != ApplicationStage.Withdrawn)
        {
            if (current == ApplicationStage.Joined)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("Cannot move candidate from 'Joined' stage."));
            }

            if (current == ApplicationStage.Applied && target != ApplicationStage.Screening)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Applied', candidate can only move to 'Screening'."));
            }
            if (current == ApplicationStage.Screening && target != ApplicationStage.Shortlisted && target != ApplicationStage.Applied)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Screening', candidate can only move to 'Shortlisted' or back to 'Applied'."));
            }
            if (current == ApplicationStage.Shortlisted && 
                target != ApplicationStage.InterviewL1 && target != ApplicationStage.InterviewL2 && target != ApplicationStage.HRInterview && 
                target != ApplicationStage.Screening)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Shortlisted', candidate can only move to an Interview stage or back to 'Screening'."));
            }
            if ((current == ApplicationStage.InterviewL1 || current == ApplicationStage.InterviewL2 || current == ApplicationStage.ManagerReview || current == ApplicationStage.HRInterview) &&
                target != ApplicationStage.InterviewL1 && target != ApplicationStage.InterviewL2 && target != ApplicationStage.ManagerReview && target != ApplicationStage.HRInterview &&
                target != ApplicationStage.Offer && target != ApplicationStage.Shortlisted)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From an Interview/Review stage, candidate can only move to another Interview/Review, 'Offer', or back to 'Shortlisted'."));
            }
            if (current == ApplicationStage.Offer && target != ApplicationStage.Joined && target != ApplicationStage.BackgroundCheck && 
                target != ApplicationStage.InterviewL1 && target != ApplicationStage.InterviewL2 && target != ApplicationStage.HRInterview)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Offer', candidate can only move to 'Joined' or 'BackgroundCheck'."));
            }
            if (current == ApplicationStage.BackgroundCheck && target != ApplicationStage.Joined && target != ApplicationStage.Offer)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'BackgroundCheck', candidate can only move to 'Joined' or back to 'Offer'."));
            }
        }

        app.CurrentStage = request.Stage;
        if (request.Stage == ApplicationStage.Rejected)
        {
            app.RejectionReason = request.RejectionReason;
        }
        else
        {
            app.RejectionReason = null; // Clear if transitioned back
        }

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<JobApplicationDto>(app);
        dto.AiMatchScore = CalculateMatchScore(app.Candidate, app.Requisition);

        return Ok(ApiResponse<JobApplicationDto>.Ok(dto, $"Application stage updated to {request.Stage}."));
    }

    private decimal CalculateMatchScore(Candidate candidate, JobRequisition requisition)
    {
        decimal score = 50; // Base matching score

        // 1. Experience Match
        if (requisition.MinExperience.HasValue)
        {
            var candExp = candidate.TotalExperience ?? 0;
            var min = requisition.MinExperience.Value;
            var max = requisition.MaxExperience ?? (min + 5);

            if (candExp >= min && candExp <= max)
            {
                score += 20;
            }
            else if (candExp >= min)
            {
                score += 15; // Overexperienced
            }
            else if (candExp >= min - 1)
            {
                score += 10; // Slightly underexperienced
            }
        }
        else
        {
            score += 10;
        }

        // 2. Skills Match (Keyword Matcher Stub)
        if (!string.IsNullOrEmpty(requisition.SkillsRequired))
        {
            var reqSkills = requisition.SkillsRequired.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim().ToLower())
                .ToList();
            
            var matchSource = (candidate.CurrentDesignation ?? "") + " " + (candidate.Source?.ToString() ?? "");
            var candSkills = matchSource.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(w => w.Trim().ToLower())
                .ToList();

            var matches = reqSkills.Intersect(candSkills).Count();
            score += Math.Min(matches * 15, 30); // Max 30 points for skills match
        }

        return Math.Clamp(score, 0, 100);
    }
}
