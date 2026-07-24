using AutoMapper;
using IndiaHRMS.Application.DTOs.Employee;
using IndiaHRMS.Application.DTOs.Recruitment;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Infrastructure.Services;
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
    private readonly IApplicationService _applicationService;
    private readonly ICurrentUserService _currentUser;
    private readonly IHiringService _hiringService;

    public JobApplicationsController(
        AppDbContext context,
        IMapper mapper,
        IApplicationService applicationService,
        ICurrentUserService currentUser,
        IHiringService hiringService)
    {
        _context = context;
        _mapper = mapper;
        _applicationService = applicationService;
        _currentUser = currentUser;
        _hiringService = hiringService;
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
                .ThenInclude(r => r.JobPostings)
            .Include(a => a.Requisition)
                .ThenInclude(r => r.Department)
            .Include(a => a.Candidate)
            .Include(a => a.AssignedRecruiter)
            .Include(a => a.InterviewRounds)
            .AsQueryable();

        // Scope validation
        var isHrOrAdmin = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin);
        if (!isHrOrAdmin)
        {
            query = query.Where(a => a.AssignedRecruiterId == _currentUser.UserId);
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
        var candidateIds = list.Select(a => a.CandidateId).ToList();
        var employeeMap = await _context.Employees
            .Where(e => e.CandidateId.HasValue && candidateIds.Contains(e.CandidateId.Value))
            .ToDictionaryAsync(e => e.CandidateId!.Value, e => e.EmployeeId, ct);

        foreach (var app in list)
        {
            var dto = _mapper.Map<JobApplicationDto>(app);
            dto.AiMatchScore = CalculateMatchScore(app.Candidate, app.Requisition);
            if (employeeMap.TryGetValue(app.CandidateId, out var employeeId))
            {
                dto.EmployeeId = employeeId;
            }
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
        dto.EmployeeId = await _context.Employees
            .Where(e => e.CandidateId == app.CandidateId)
            .Select(e => (Guid?)e.EmployeeId)
            .FirstOrDefaultAsync(ct);
        return Ok(ApiResponse<JobApplicationDto>.Ok(dto));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<JobApplicationDto>>> CreateApplication(
        [FromBody] CreateJobApplicationRequest request,
        CancellationToken ct)
    {
        var cand = await _context.Candidates.FirstOrDefaultAsync(c => c.CandidateId == request.CandidateId, ct);
        if (cand == null)
        {
            throw new InvalidOperationException("Candidate not found.");
        }

        // Resolve JobPosting using ReqId
        var posting = await _context.JobPostings
            .Include(p => p.JobRequisition)
            .FirstOrDefaultAsync(p => p.ReqId == request.ReqId, ct);
        
        if (posting == null)
        {
            throw new InvalidOperationException("No published job found.");
        }
        
        if (posting.Status != JobPostingStatus.Published)
        {
            throw new InvalidOperationException("Job opening is not published.");
        }

        var applyReq = new ApplyToJobRequest
        {
            JobId = posting.JobId,
            ExistingCandidateId = request.CandidateId,
            Source = "ManualHREntry",
            AddedByUserId = _currentUser.UserId
        };

        var result = await _applicationService.ApplyToJobAsync(applyReq, ct);

        // Reload to load navigations for response
        var savedApp = await _context.JobApplications
            .Include(a => a.Requisition)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.AppId == result.AppId, ct);

        var dto = _mapper.Map<JobApplicationDto>(savedApp);
        dto.AiMatchScore = CalculateMatchScore(cand, posting.JobRequisition);

        return CreatedAtAction(nameof(GetApplication), new { id = result.AppId }, ApiResponse<JobApplicationDto>.Ok(dto));
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

        var isHrOrAdmin = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin);
        if (!isHrOrAdmin && app.AssignedRecruiterId != _currentUser.UserId)
        {
            return BadRequest(ApiResponse<JobApplicationDto>.Fail("You can only modify your own assigned applications."));
        }

        // Validate stage transitions
        var current = app.CurrentStage;
        var target = request.Stage;

        if (target != ApplicationStage.Rejected && target != ApplicationStage.Withdrawn && target != current)
        {
            if (current == ApplicationStage.Joined || current == ApplicationStage.Rejected || current == ApplicationStage.Withdrawn)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail($"Cannot move candidate from terminal stage '{current}'."));
            }

            if (current == ApplicationStage.Applied && target != ApplicationStage.Screening)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Applied', candidate can only move to 'Screening'."));
            }
            if (current == ApplicationStage.Screening && target != ApplicationStage.Shortlisted && target != ApplicationStage.Applied && target != ApplicationStage.InterviewL1)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Screening', candidate can only move to 'Interview Round 1', 'Shortlisted', or back to 'Applied'."));
            }
            if (current == ApplicationStage.Shortlisted && 
                target != ApplicationStage.InterviewL1 && target != ApplicationStage.InterviewL2 && target != ApplicationStage.HRInterview && 
                target != ApplicationStage.Screening)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Shortlisted', candidate can only move to an Interview stage or back to 'Screening'."));
            }
            if ((current == ApplicationStage.InterviewL1 || current == ApplicationStage.InterviewL2 || current == ApplicationStage.ManagerReview || current == ApplicationStage.HRInterview) &&
                target != ApplicationStage.InterviewL1 && target != ApplicationStage.InterviewL2 && target != ApplicationStage.ManagerReview && target != ApplicationStage.HRInterview &&
                target != ApplicationStage.Offer && target != ApplicationStage.Shortlisted && target != ApplicationStage.Screening)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From an Interview/Review stage, candidate can only move to another Interview/Review, 'Offer', back to 'Shortlisted', or back to 'Screening'."));
            }
            if (current == ApplicationStage.Offer && 
                target != ApplicationStage.BackgroundCheck && target != ApplicationStage.Onboarding && target != ApplicationStage.Joined &&
                target != ApplicationStage.InterviewL1 && target != ApplicationStage.InterviewL2 && target != ApplicationStage.ManagerReview && target != ApplicationStage.HRInterview)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Offer', candidate can only move to 'Background Verification', 'Onboarding', 'Joined', or back to an Interview/Review stage."));
            }
            if (current == ApplicationStage.BackgroundCheck && 
                target != ApplicationStage.Onboarding && target != ApplicationStage.Joined && target != ApplicationStage.Offer)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Background Verification', candidate can only move to 'Onboarding', 'Joined', or back to 'Offer'."));
            }
            if (current == ApplicationStage.Onboarding && 
                target != ApplicationStage.Joined && target != ApplicationStage.BackgroundCheck && target != ApplicationStage.Offer)
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("From 'Onboarding', candidate can only move to 'Joined', or back to 'Background Verification' or 'Offer'."));
            }
        }
        // ─── Active Pipeline Conflict Gate: candidate cannot be in multiple active interview pipelines simultaneously ───
        var activePipelineStages = new[]
        {
            ApplicationStage.Shortlisted,
            ApplicationStage.InterviewL1,
            ApplicationStage.InterviewL2,
            ApplicationStage.ManagerReview,
            ApplicationStage.HRInterview,
            ApplicationStage.Offer,
            ApplicationStage.BackgroundCheck,
            ApplicationStage.Onboarding
        };

        if (activePipelineStages.Contains(target) && (!activePipelineStages.Contains(current) || target != current))
        {
            var conflictingApp = await _context.JobApplications
                .Include(other => other.Requisition)
                .Where(other => other.CandidateId == app.CandidateId && other.AppId != app.AppId && (other.Status != "Rejected" && other.Status != "Withdrawn"))
                .Where(other => activePipelineStages.Contains(other.CurrentStage) || other.CurrentStage == ApplicationStage.Joined)
                .FirstOrDefaultAsync(ct);

            if (conflictingApp != null)
            {
                var conflictingJobTitle = conflictingApp.Requisition?.JobTitle ?? "another role";
                return BadRequest(ApiResponse<JobApplicationDto>.Fail(
                    $"Candidate '{app.Candidate?.FirstName} {app.Candidate?.LastName}' is already in an active interview pipeline for '{conflictingJobTitle}'. A candidate cannot be in multiple active interview pipelines simultaneously."));
            }
        }

        // ─── Approval Gate: block promotion to Offer until all three approvals are confirmed ───
        if (target == ApplicationStage.Offer && target != current)
        {
            var pending = new List<string>();
            if (app.TechnicalApproved != true) pending.Add("Technical");
            if (app.HrApproved != true) pending.Add("HR");
            if (app.ManagerApproved != true) pending.Add("Manager");

            if (pending.Count > 0)
            {
                var bulletList = string.Join("\n• ", pending);
                return BadRequest(ApiResponse<JobApplicationDto>.Fail(
                    $"Pending Approvals:\n• {bulletList}"));
            }
        }

        // Mandatory remarks verification for Reject and BGV failure
        if (target == ApplicationStage.Rejected || target == ApplicationStage.Withdrawn)
        {
            if (request.ActionType == "BGVFailed" && (string.IsNullOrWhiteSpace(request.Remarks) || request.Remarks.Length < 20))
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("Mandatory remarks of at least 20 characters are required for BGV failure."));
            }
            if (target == ApplicationStage.Rejected && request.ActionType != "OfferDeclined" && (string.IsNullOrWhiteSpace(request.RejectionReason) || request.RejectionReason.Length < 20))
            {
                return BadRequest(ApiResponse<JobApplicationDto>.Fail("A mandatory rejection reason of at least 20 characters is required for rejection."));
            }
        }

        // Determine user display name for timeline logging
        string userDisplayName = _currentUser.Username ?? "Unknown";
        if (_currentUser.EmployeeId.HasValue)
        {
            var emp = await _context.Employees.FindAsync(_currentUser.EmployeeId.Value, ct);
            if (emp != null)
            {
                userDisplayName = $"{emp.FirstName} {emp.LastName}";
            }
        }

        string prevStageStr = current.ToString();
        string targetStageStr = target.ToString();

        // Persist approval flags if provided in request
        if (request.TechnicalApproved.HasValue) app.TechnicalApproved = request.TechnicalApproved.Value;
        if (request.HrApproved.HasValue) app.HrApproved = request.HrApproved.Value;
        if (request.ManagerApproved.HasValue) app.ManagerApproved = request.ManagerApproved.Value;
        if (!string.IsNullOrEmpty(request.StageDataJson)) app.StageDataJson = request.StageDataJson;

        // Generate timeline events for approval actions
        if (request.TechnicalApproved == true)
            TimelineHelper.AddTimelineEvent(app, "Technical Interview Approved", request.Remarks, userDisplayName, prevStageStr, prevStageStr);
        else if (request.TechnicalApproved == false)
            TimelineHelper.AddTimelineEvent(app, "Technical Interview Rejected", request.Remarks, userDisplayName, prevStageStr, prevStageStr);

        if (request.HrApproved == true)
            TimelineHelper.AddTimelineEvent(app, "HR Approved", request.Remarks, userDisplayName, prevStageStr, prevStageStr);
        else if (request.HrApproved == false)
            TimelineHelper.AddTimelineEvent(app, "HR Rejected", request.Remarks, userDisplayName, prevStageStr, prevStageStr);

        if (request.ManagerApproved == true)
            TimelineHelper.AddTimelineEvent(app, "Manager Approved", request.Remarks, userDisplayName, prevStageStr, prevStageStr);
        else if (request.ManagerApproved == false)
            TimelineHelper.AddTimelineEvent(app, "Manager Rejected", request.Remarks, userDisplayName, prevStageStr, prevStageStr);

        // Update target stage
        app.CurrentStage = target;

        // Custom action handlers and event message generation
        if (!string.IsNullOrEmpty(request.ActionType))
        {
            if (request.ActionType == "SendOffer")
            {
                TimelineHelper.AddTimelineEvent(app, "Offer Sent", request.Remarks, userDisplayName, prevStageStr, targetStageStr);
            }
            else if (request.ActionType == "StartBGV")
            {
                TimelineHelper.AddTimelineEvent(app, "Background Verification Started", request.Remarks, userDisplayName, prevStageStr, targetStageStr);
            }
            else if (request.ActionType == "DocsReceived")
            {
                TimelineHelper.AddTimelineEvent(app, "Documents Submitted", request.Remarks, userDisplayName, prevStageStr, targetStageStr);
            }
            else if (request.ActionType == "BGVPassed")
            {
                TimelineHelper.AddTimelineEvent(app, "Background Verification Passed", request.Remarks, userDisplayName, prevStageStr, targetStageStr);
            }
            else if (request.ActionType == "BGVFailed")
            {
                app.CurrentStage = ApplicationStage.Rejected;
                app.RejectionReason = request.Remarks;
                TimelineHelper.AddTimelineEvent(app, "Background Verification Failed", request.Remarks, userDisplayName, prevStageStr, "Rejected");
            }
            else if (request.ActionType == "OfferAccepted")
            {
                TimelineHelper.AddTimelineEvent(app, "Offer Accepted", request.Remarks, userDisplayName, prevStageStr, targetStageStr);
            }
            else if (request.ActionType == "OfferDeclined")
            {
                app.CurrentStage = ApplicationStage.Rejected;
                app.RejectionReason = "Offer Declined";
                TimelineHelper.AddTimelineEvent(app, "Candidate declined the offer.", request.Remarks ?? "Offer Declined", userDisplayName, prevStageStr, "Rejected");
            }
            else
            {
                TimelineHelper.AddTimelineEvent(app, $"Action: {request.ActionType}", request.Remarks, userDisplayName, prevStageStr, targetStageStr);
            }
        }
        else
        {
            if (target == ApplicationStage.Rejected)
            {
                app.RejectionReason = request.RejectionReason;
                TimelineHelper.AddTimelineEvent(app, "Rejected", request.RejectionReason, userDisplayName, prevStageStr, targetStageStr);
            }
            else if (target == ApplicationStage.Withdrawn)
            {
                TimelineHelper.AddTimelineEvent(app, "Withdrawn", request.Remarks ?? "Withdrawn by candidate", userDisplayName, prevStageStr, targetStageStr);
            }
            else
            {
                app.RejectionReason = null; // Clear if restored or moved forward

                // Dynamic vertical timeline label generation
                string eventMsg = $"Moved from {current} to {target}";
                if (current == ApplicationStage.Applied && target == ApplicationStage.Screening)
                    eventMsg = "Moved from Applied to Screening";
                else if (current == ApplicationStage.Screening && target == ApplicationStage.InterviewL1)
                    eventMsg = "Moved from Screening to Interview Round 1";
                else if (current == ApplicationStage.InterviewL1 && target == ApplicationStage.InterviewL2)
                    eventMsg = "Moved from Interview Round 1 to Interview Round 2";
                else if (target == ApplicationStage.Offer)
                    eventMsg = "Moved to Offer";
                else if (target == ApplicationStage.Joined)
                    eventMsg = "Moved to Joined";

                TimelineHelper.AddTimelineEvent(app, eventMsg, request.Remarks, userDisplayName, prevStageStr, targetStageStr);
            }
        }

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<JobApplicationDto>(app);
        dto.AiMatchScore = CalculateMatchScore(app.Candidate, app.Requisition);

        return Ok(ApiResponse<JobApplicationDto>.Ok(dto, $"Application stage updated successfully."));
    }

    // ─── Workspace Save ─────────────────────────────────────────────────────────
    // Saves stage-specific workspace data (screening remarks, interview feedback,
    // offer details, BGV status, onboarding checklist) WITHOUT changing the stage.
    [HttpPut("{id:guid}/workspace")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobApplicationDto>>> SaveWorkspace(
        Guid id,
        [FromBody] UpdateApplicationStageRequest request,
        CancellationToken ct)
    {
        var app = await _context.JobApplications
            .Include(a => a.Requisition)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.AppId == id, ct);

        if (app == null)
            return NotFound(ApiResponse<JobApplicationDto>.Fail("Job application not found."));

        var current = app.CurrentStage;
        string stageStr = current.ToString();

        string userDisplayName = _currentUser.Username ?? "Unknown";
        if (_currentUser.EmployeeId.HasValue)
        {
            var emp = await _context.Employees.FindAsync(_currentUser.EmployeeId.Value, ct);
            if (emp != null) userDisplayName = $"{emp.FirstName} {emp.LastName}";
        }

        // Persist workspace data
        if (!string.IsNullOrEmpty(request.StageDataJson)) app.StageDataJson = request.StageDataJson;

        // Persist approval flags and generate timeline entries
        if (request.TechnicalApproved.HasValue)
        {
            app.TechnicalApproved = request.TechnicalApproved.Value;
            var evtLabel = request.TechnicalApproved.Value ? "Technical Interview Approved" : "Technical Interview Rejected";
            TimelineHelper.AddTimelineEvent(app, evtLabel, request.Remarks, userDisplayName, stageStr, stageStr);
        }

        if (request.HrApproved.HasValue)
        {
            app.HrApproved = request.HrApproved.Value;
            var evtLabel = request.HrApproved.Value ? "HR Approved" : "HR Rejected";
            TimelineHelper.AddTimelineEvent(app, evtLabel, request.Remarks, userDisplayName, stageStr, stageStr);
        }

        if (request.ManagerApproved.HasValue)
        {
            app.ManagerApproved = request.ManagerApproved.Value;
            var evtLabel = request.ManagerApproved.Value ? "Manager Approved" : "Manager Rejected";
            TimelineHelper.AddTimelineEvent(app, evtLabel, request.Remarks, userDisplayName, stageStr, stageStr);
        }

        // Stage-specific timeline event for workspace save
        if (!request.TechnicalApproved.HasValue && !request.HrApproved.HasValue && !request.ManagerApproved.HasValue)
        {
            var evtMsg = current switch
            {
                ApplicationStage.Screening => "Screening Workspace Updated",
                ApplicationStage.InterviewL1 => "Interview Round 1 Feedback Saved",
                ApplicationStage.InterviewL2 => "Interview Round 2 Feedback Saved",
                ApplicationStage.ManagerReview or ApplicationStage.HRInterview => "Manager/HR Discussion Notes Saved",
                ApplicationStage.Offer => "Offer Details Updated",
                ApplicationStage.BackgroundCheck => "Background Verification Updated",
                ApplicationStage.Onboarding => "Onboarding Checklist Updated",
                _ => "Workspace Updated"
            };
            TimelineHelper.AddTimelineEvent(app, evtMsg, request.Remarks, userDisplayName, stageStr, stageStr);
        }

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<JobApplicationDto>(app);
        dto.AiMatchScore = CalculateMatchScore(app.Candidate, app.Requisition);
        return Ok(ApiResponse<JobApplicationDto>.Ok(dto, "Workspace data saved successfully."));
    }

    [HttpPost("{id:guid}/notes")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobApplicationDto>>> AddApplicationNote(
        Guid id,
        [FromBody] AddApplicationNoteRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Note))
        {
            return BadRequest(ApiResponse<JobApplicationDto>.Fail("Note content cannot be empty."));
        }

        var app = await _context.JobApplications
            .Include(a => a.Requisition)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.AppId == id, ct);

        if (app == null)
        {
            return NotFound(ApiResponse<JobApplicationDto>.Fail("Job application not found."));
        }

        var notesList = new List<ApplicationNote>();
        if (!string.IsNullOrEmpty(app.NotesJson))
        {
            try
            {
                notesList = System.Text.Json.JsonSerializer.Deserialize<List<ApplicationNote>>(app.NotesJson) ?? new List<ApplicationNote>();
            }
            catch {}
        }

        var authorName = "Recruiter";
        if (_currentUser.UserId.HasValue)
        {
            var user = await _context.Users.FindAsync(new object[] { _currentUser.UserId.Value }, ct);
            if (user != null)
            {
                authorName = $"{user.FirstName} {user.LastName}".Trim();
            }
        }

        notesList.Add(new ApplicationNote
        {
            Author = authorName,
            Timestamp = DateTime.UtcNow,
            Content = request.Note.Trim()
        });

        app.NotesJson = System.Text.Json.JsonSerializer.Serialize(notesList);

        TimelineHelper.AddTimelineEvent(app, "Recruiter Added Notes");

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<JobApplicationDto>(app);
        dto.AiMatchScore = CalculateMatchScore(app.Candidate, app.Requisition);

        return Ok(ApiResponse<JobApplicationDto>.Ok(dto, "Note added successfully."));
    }

    [HttpPost("{id:guid}/convert")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> ConvertCandidate(
        Guid id,
        [FromBody] ConvertCandidateRequest request,
        CancellationToken ct)
    {
        try
        {
            var empDto = await _hiringService.ConvertCandidateToEmployeeAsync(id, request, ct);
            return Ok(ApiResponse<EmployeeDetailDto>.Ok(empDto, "Candidate successfully converted to employee."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail(ex.Message));
        }
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
