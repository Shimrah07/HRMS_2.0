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
[Route("api/v{version:apiVersion}/interviews")]
[ApiVersion("1.0")]
[Authorize]
public class InterviewsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public InterviewsController(AppDbContext context, IMapper mapper, INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<InterviewRoundDto>>>> GetInterviews(
        [FromQuery] Guid? appId,
        CancellationToken ct)
    {
        var query = _context.InterviewRounds
            .Include(r => r.Interviewer)
            .Include(r => r.Panelists)
                .ThenInclude(p => p.Employee)
            .AsQueryable();

        if (appId.HasValue)
        {
            query = query.Where(r => r.AppId == appId.Value);
        }

        var list = await query.OrderByDescending(r => r.ScheduledAt).ToListAsync(ct);
        var dtos = _mapper.Map<List<InterviewRoundDto>>(list);
        return Ok(ApiResponse<List<InterviewRoundDto>>.Ok(dtos));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<InterviewRoundDto>>> ScheduleInterview(
        [FromBody] ScheduleInterviewRequest request,
        CancellationToken ct)
    {
        var app = await _context.JobApplications
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.AppId == request.AppId, ct);

        if (app == null)
        {
            return BadRequest(ApiResponse<InterviewRoundDto>.Fail("Job application not found."));
        }

        if (request.InterviewerIds == null || !request.InterviewerIds.Any())
        {
            return BadRequest(ApiResponse<InterviewRoundDto>.Fail("At least one interviewer must be assigned."));
        }

        // 1. Conflict Check: check if any assigned interviewer is busy within 30 mins of ScheduledAt
        foreach (var interviewerId in request.InterviewerIds)
        {
            var conflict = await _context.InterviewRounds.AnyAsync(r => 
                (r.InterviewerId == interviewerId || r.Panelists.Any(p => p.EmployeeId == interviewerId))
                && Math.Abs(EF.Functions.DateDiffMinute(r.ScheduledAt, request.ScheduledAt)) < 30
                && r.Status != "Cancelled", ct);

            if (conflict)
            {
                var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == interviewerId, ct);
                var empName = emp != null ? $"{emp.FirstName} {emp.LastName}" : "Assigned employee";
                return BadRequest(ApiResponse<InterviewRoundDto>.Fail($"Conflict detected: {empName} is already scheduled for another interview at this time."));
            }
        }

        // Create main InterviewRound record (assigning the first ID as primary interviewer)
        var primaryId = request.InterviewerIds.First();
        var round = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = request.AppId,
            RoundName = request.RoundName,
            RoundType = request.RoundType,
            ScheduledAt = request.ScheduledAt,
            InterviewerId = primaryId,
            Venue = request.Venue,
            MeetingLink = request.MeetingLink,
            Status = "Scheduled"
        };

        _context.InterviewRounds.Add(round);

        // Add Panelists (including the primary interviewer)
        foreach (var interviewerId in request.InterviewerIds)
        {
            var panelist = new InterviewRoundPanelist
            {
                PanelistId = Guid.NewGuid(),
                RoundId = round.RoundId,
                EmployeeId = interviewerId,
                Status = "Pending"
            };
            _context.InterviewRoundPanelists.Add(panelist);

            // Send notification to the panelist
            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == interviewerId, ct);
            if (user != null)
            {
                await _notificationService.SendToUserAsync(
                    user.UserId,
                    "Interview Scheduled",
                    $"You are assigned as panelist for '{round.RoundName}' candidate: {app.Candidate.FirstName} {app.Candidate.LastName} scheduled at {round.ScheduledAt:dd MMM yyyy HH:mm}.",
                    NotificationType.InterviewScheduled,
                    round.RoundId.ToString(),
                    "InterviewRound"
                );
            }
        }

        await _context.SaveChangesAsync(ct);

        // Reload to output mapping details
        var savedRound = await _context.InterviewRounds
            .Include(r => r.Interviewer)
            .Include(r => r.Panelists)
                .ThenInclude(p => p.Employee)
            .FirstOrDefaultAsync(r => r.RoundId == round.RoundId, ct);

        var dto = _mapper.Map<InterviewRoundDto>(savedRound);
        return Ok(ApiResponse<InterviewRoundDto>.Ok(dto, "Interview scheduled successfully."));
    }

    [HttpPost("feedback")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<InterviewRoundDto>>> SubmitFeedback(
        [FromBody] SubmitInterviewerFeedbackRequest request,
        CancellationToken ct)
    {
        var panelist = await _context.InterviewRoundPanelists
            .Include(p => p.Employee)
            .FirstOrDefaultAsync(p => p.PanelistId == request.PanelistId, ct);

        if (panelist == null)
        {
            return NotFound(ApiResponse<InterviewRoundDto>.Fail("Interviewer panelist assignment not found."));
        }

        if (panelist.Status == "Submitted")
        {
            return BadRequest(ApiResponse<InterviewRoundDto>.Fail("Feedback has already been submitted for this panelist."));
        }

        // Save panelist evaluation feedback
        panelist.Rating = request.Rating;
        panelist.Feedback = request.Feedback;
        panelist.Status = "Submitted";
        panelist.SubmittedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        // Fetch round to check if all panelists have submitted their scores
        var round = await _context.InterviewRounds
            .Include(r => r.Panelists)
                .ThenInclude(p => p.Employee)
            .FirstOrDefaultAsync(r => r.RoundId == panelist.RoundId, ct);

        if (round == null)
        {
            return NotFound(ApiResponse<InterviewRoundDto>.Fail("Associated Interview Round not found."));
        }

        // If all panel members have submitted, aggregate feedback and apply selection rules
        var pendingCount = round.Panelists.Count(p => p.Status == "Pending");
        if (pendingCount == 0)
        {
            round.Status = "Completed";
            round.CompletedAt = DateTime.UtcNow;
            
            var submittedPanelists = round.Panelists.Where(p => p.Status == "Submitted").ToList();
            round.Rating = submittedPanelists.Average(p => p.Rating);
            round.Feedback = string.Join("\n\n", submittedPanelists.Select(p => 
                $"{p.Employee.FirstName} {p.Employee.LastName}: [{p.Rating}/5] {p.Feedback}"
            ));

            // Unanimous Selection Rule: even 1 reject (Rating < 3) causes the candidate to fail
            var hasRejection = submittedPanelists.Any(p => p.Rating.HasValue && p.Rating.Value < 3.0m);
            var app = await _context.JobApplications
                .Include(a => a.Candidate)
                .FirstOrDefaultAsync(a => a.AppId == round.AppId, ct);

            if (app != null)
            {
                if (hasRejection)
                {
                    app.CurrentStage = ApplicationStage.Rejected;
                    app.RejectionReason = $"Rejected in round {round.RoundName} due to non-unanimous panel feedback.";
                    
                    // Notify HR Admin
                    await _notificationService.SendToRoleAsync(
                        RoleCodes.HRAdmin,
                        "Candidate Rejection (Panel Rule)",
                        $"Candidate {app.Candidate.FirstName} {app.Candidate.LastName} was rejected due to rating below 3.0.",
                        NotificationType.General
                    );
                }
                else
                {
                    // Advance candidate stage logically
                    if (app.CurrentStage == ApplicationStage.Applied || app.CurrentStage == ApplicationStage.Shortlisted)
                        app.CurrentStage = ApplicationStage.InterviewL1;
                    else if (app.CurrentStage == ApplicationStage.InterviewL1)
                        app.CurrentStage = ApplicationStage.InterviewL2;
                    else if (app.CurrentStage == ApplicationStage.InterviewL2)
                        app.CurrentStage = ApplicationStage.HRInterview;
                    else if (app.CurrentStage == ApplicationStage.HRInterview)
                        app.CurrentStage = ApplicationStage.Offer;

                    // Notify HR Admin of selected candidate
                    await _notificationService.SendToRoleAsync(
                        RoleCodes.HRAdmin,
                        "Candidate Evaluation Completed",
                        $"Candidate {app.Candidate.FirstName} {app.Candidate.LastName} cleared panel interview round successfully.",
                        NotificationType.General
                    );
                }
            }
        }

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<InterviewRoundDto>(round);
        return Ok(ApiResponse<InterviewRoundDto>.Ok(dto, "Feedback submitted successfully."));
    }
}
