using AutoMapper;
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
        [FromQuery] bool? isGeneral,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = _context.InterviewRounds
            .Include(r => r.Interviewer)
            .Include(r => r.JobApplication)
                .ThenInclude(a => a.Candidate)
            .Include(r => r.JobApplication)
                .ThenInclude(a => a.Requisition)
            .Include(r => r.Panelists)
                .ThenInclude(p => p.Employee)
            .AsQueryable();

        if (appId.HasValue)
        {
            query = query.Where(r => r.AppId == appId.Value);
        }

        if (isGeneral.HasValue)
        {
            query = query.Where(r => r.IsGeneralInterview == isGeneral.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var list = await query.OrderByDescending(r => r.ScheduledAt).ToListAsync(ct);

        // Auto-check Overdue Feedback rule: Completed / FeedbackPending + > 7 days -> OverdueFeedback
        var now = DateTime.UtcNow;
        bool hasChanges = false;
        foreach (var r in list)
        {
            if ((r.Status == "Completed" || r.Status == "FeedbackPending") && string.IsNullOrWhiteSpace(r.Feedback))
            {
                var daysDiff = (now - r.ScheduledAt).TotalDays;
                if (daysDiff > 7)
                {
                    r.Status = "OverdueFeedback";
                    hasChanges = true;
                }
                else if (r.Status == "Completed")
                {
                    r.Status = "FeedbackPending";
                    hasChanges = true;
                }
            }
        }
        if (hasChanges)
        {
            await _context.SaveChangesAsync(ct);
        }

        var dtos = _mapper.Map<List<InterviewRoundDto>>(list);
        return Ok(ApiResponse<List<InterviewRoundDto>>.Ok(dtos));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<InterviewRoundDto>>> ScheduleInterview(
        [FromBody] ScheduleInterviewRequest request,
        CancellationToken ct)
    {
        JobApplication? app = null;
        if (request.AppId.HasValue && request.AppId.Value != Guid.Empty)
        {
            app = await _context.JobApplications
                .Include(a => a.Candidate)
                .FirstOrDefaultAsync(a => a.AppId == request.AppId.Value, ct);

            if (app == null)
            {
                return BadRequest(ApiResponse<InterviewRoundDto>.Fail("Job application not found."));
            }
        }

        if (request.InterviewerIds == null || !request.InterviewerIds.Any())
        {
            return BadRequest(ApiResponse<InterviewRoundDto>.Fail("At least one interviewer must be assigned."));
        }

        // Extensible Multi-Resource Conflict Detection (Candidate, Panelist, Venue)
        if (!request.AllowConflict)
        {
            var duration = request.DurationMinutes ?? 45;
            // 1. Panelist Conflict
            foreach (var interviewerId in request.InterviewerIds)
            {
                var conflict = await _context.InterviewRounds.AnyAsync(r =>
                    (r.InterviewerId == interviewerId || r.Panelists.Any(p => p.EmployeeId == interviewerId))
                    && Math.Abs(EF.Functions.DateDiffMinute(r.ScheduledAt, request.ScheduledAt)) < duration
                    && r.Status != "Cancelled", ct);

                if (conflict)
                {
                    var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == interviewerId, ct);
                    var empName = emp != null ? $"{emp.FirstName} {emp.LastName}" : "Assigned interviewer";
                    return BadRequest(ApiResponse<InterviewRoundDto>.Fail($"CONFLICT_WARNING: Panelist {empName} is already scheduled for another interview at this time ({request.ScheduledAt:hh:mm A})."));
                }
            }

            // 2. Candidate Conflict
            if (request.AppId.HasValue)
            {
                var candConflict = await _context.InterviewRounds.AnyAsync(r =>
                    r.AppId == request.AppId.Value
                    && Math.Abs(EF.Functions.DateDiffMinute(r.ScheduledAt, request.ScheduledAt)) < duration
                    && r.Status != "Cancelled", ct);

                if (candConflict)
                {
                    return BadRequest(ApiResponse<InterviewRoundDto>.Fail($"CONFLICT_WARNING: Candidate already has another interview scheduled at this time ({request.ScheduledAt:hh:mm A})."));
                }
            }

            // 3. Venue / Room Conflict
            if (!string.IsNullOrWhiteSpace(request.Venue))
            {
                var venueConflict = await _context.InterviewRounds.AnyAsync(r =>
                    r.Venue == request.Venue
                    && Math.Abs(EF.Functions.DateDiffMinute(r.ScheduledAt, request.ScheduledAt)) < duration
                    && r.Status != "Cancelled", ct);

                if (venueConflict)
                {
                    return BadRequest(ApiResponse<InterviewRoundDto>.Fail($"CONFLICT_WARNING: Room/Venue '{request.Venue}' is already reserved for another interview at this time."));
                }
            }
        }

        // Create main InterviewRound record (assigning the first ID as primary interviewer)
        var primaryId = request.InterviewerIds.First();
        var round = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = request.AppId,
            RoundName = string.IsNullOrWhiteSpace(request.RoundName) ? (request.Category ?? "General Interview") : request.RoundName,
            RoundType = request.RoundType ?? request.Category,
            ScheduledAt = request.ScheduledAt,
            DurationMinutes = request.DurationMinutes ?? 45,
            InterviewerId = primaryId,
            Venue = request.Venue,
            MeetingLink = request.MeetingLink,
            Status = "Scheduled",
            IsGeneralInterview = request.IsGeneralInterview || !request.AppId.HasValue,
            Category = request.Category,
            CandidateName = request.CandidateName ?? (app != null && app.Candidate != null ? $"{app.Candidate.FirstName} {app.Candidate.LastName}" : null),
            CandidateEmail = request.CandidateEmail ?? (app != null && app.Candidate != null ? app.Candidate.Email : null),
            CandidatePhone = request.CandidatePhone ?? (app != null && app.Candidate != null ? app.Candidate.Phone : null),
            Company = request.Company,
            Department = request.Department,
            Notes = request.Notes
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
                var candDisplayName = round.CandidateName ?? (app != null && app.Candidate != null ? $"{app.Candidate.FirstName} {app.Candidate.LastName}" : "Candidate");
                await _notificationService.SendToUserAsync(
                    user.UserId,
                    "Interview Scheduled",
                    $"You are assigned as panelist for '{round.RoundName}' candidate: {candDisplayName} scheduled at {round.ScheduledAt:dd MMM yyyy HH:mm}.",
                    NotificationType.InterviewScheduled,
                    round.RoundId.ToString(),
                    "InterviewRound"
                );
            }
        }

        if (app != null)
        {
            TimelineHelper.AddTimelineEvent(app, "Interview Scheduled", $"{request.RoundName} (Type: {request.RoundType}) scheduled at {request.ScheduledAt:dd MMM yyyy HH:mm}");
        }

        await _context.SaveChangesAsync(ct);

        // Reload to output mapping details
        var savedRound = await _context.InterviewRounds
            .Include(r => r.Interviewer)
            .Include(r => r.JobApplication)
                .ThenInclude(a => a.Candidate)
            .Include(r => r.JobApplication)
                .ThenInclude(a => a.Requisition)
            .Include(r => r.Panelists)
                .ThenInclude(p => p.Employee)
            .FirstOrDefaultAsync(r => r.RoundId == round.RoundId, ct);

        var dto = _mapper.Map<InterviewRoundDto>(savedRound);
        return Ok(ApiResponse<InterviewRoundDto>.Ok(dto, "Interview scheduled successfully."));
    }

    [HttpPut("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<InterviewRoundDto>>> UpdateInterview(
        Guid id,
        [FromBody] UpdateInterviewRequest request,
        CancellationToken ct)
    {
        var round = await _context.InterviewRounds
            .Include(r => r.Panelists)
            .FirstOrDefaultAsync(r => r.RoundId == id, ct);

        if (round == null)
            return NotFound(ApiResponse<InterviewRoundDto>.Fail("Interview round not found."));

        if (request.ScheduledAt.HasValue) round.ScheduledAt = request.ScheduledAt.Value;
        if (request.DurationMinutes.HasValue) round.DurationMinutes = request.DurationMinutes.Value;
        if (!string.IsNullOrWhiteSpace(request.RoundName)) round.RoundName = request.RoundName;
        if (!string.IsNullOrWhiteSpace(request.RoundType)) round.RoundType = request.RoundType;
        if (request.Venue != null) round.Venue = request.Venue;
        if (request.MeetingLink != null) round.MeetingLink = request.MeetingLink;
        if (!string.IsNullOrWhiteSpace(request.Status)) round.Status = request.Status;
        if (request.Notes != null) round.Notes = request.Notes;

        if (request.InterviewerIds != null && request.InterviewerIds.Any())
        {
            round.InterviewerId = request.InterviewerIds.First();
            _context.InterviewRoundPanelists.RemoveRange(round.Panelists);

            foreach (var empId in request.InterviewerIds)
            {
                _context.InterviewRoundPanelists.Add(new InterviewRoundPanelist
                {
                    PanelistId = Guid.NewGuid(),
                    RoundId = round.RoundId,
                    EmployeeId = empId,
                    Status = "Pending"
                });
            }
        }

        if (round.AppId.HasValue)
        {
            var app = await _context.JobApplications.FirstOrDefaultAsync(a => a.AppId == round.AppId.Value, ct);
            if (app != null)
            {
                TimelineHelper.AddTimelineEvent(app, "Interview Updated", $"{round.RoundName} updated/rescheduled to {round.ScheduledAt:dd MMM yyyy HH:mm}");
            }
        }

        await _context.SaveChangesAsync(ct);

        var updatedRound = await _context.InterviewRounds
            .Include(r => r.Interviewer)
            .Include(r => r.JobApplication)
                .ThenInclude(a => a.Candidate)
            .Include(r => r.JobApplication)
                .ThenInclude(a => a.Requisition)
            .Include(r => r.Panelists)
                .ThenInclude(p => p.Employee)
            .FirstOrDefaultAsync(r => r.RoundId == id, ct);

        return Ok(ApiResponse<InterviewRoundDto>.Ok(_mapper.Map<InterviewRoundDto>(updatedRound), "Interview updated successfully."));
    }

    [HttpPut("{id:guid}/checklist")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<InterviewRoundDto>>> UpdateChecklist(
        Guid id,
        [FromBody] object checklistObj,
        CancellationToken ct)
    {
        var round = await _context.InterviewRounds.FirstOrDefaultAsync(r => r.RoundId == id, ct);
        if (round == null) return NotFound(ApiResponse<InterviewRoundDto>.Fail("Interview round not found."));

        round.ChecklistJson = System.Text.Json.JsonSerializer.Serialize(checklistObj);
        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<InterviewRoundDto>(round);
        return Ok(ApiResponse<InterviewRoundDto>.Ok(dto, "Preparation checklist updated."));
    }

    [HttpPost("{id:guid}/attachments")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<InterviewRoundDto>>> UploadAttachment(
        Guid id,
        [FromForm] Microsoft.AspNetCore.Http.IFormFile file,
        [FromForm] string documentType,
        CancellationToken ct)
    {
        var round = await _context.InterviewRounds.FirstOrDefaultAsync(r => r.RoundId == id, ct);
        if (round == null) return NotFound(ApiResponse<InterviewRoundDto>.Fail("Interview round not found."));

        if (file == null || file.Length == 0) return BadRequest(ApiResponse<InterviewRoundDto>.Fail("No file provided."));

        var uploadsDir = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "uploads", "interviews");
        if (!System.IO.Directory.Exists(uploadsDir)) System.IO.Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = System.IO.Path.Combine(uploadsDir, fileName);
        using (var stream = new System.IO.FileStream(filePath, System.IO.FileMode.Create))
        {
            await file.CopyToAsync(stream, ct);
        }

        var relativePath = $"interviews/{fileName}";
        var sizeMB = (file.Length / (1024.0 * 1024.0)).ToString("0.2") + " MB";

        var newAttachment = new
        {
            id = Guid.NewGuid().ToString("N"),
            fileName = file.FileName,
            documentType = string.IsNullOrWhiteSpace(documentType) ? "Other" : documentType,
            fileUrl = relativePath,
            uploadedOn = DateTime.UtcNow.ToString("O"),
            size = sizeMB
        };

        var existingList = new List<object>();
        if (!string.IsNullOrWhiteSpace(round.AttachmentsJson))
        {
            try
            {
                var parsed = System.Text.Json.JsonSerializer.Deserialize<List<object>>(round.AttachmentsJson);
                if (parsed != null) existingList = parsed;
            }
            catch { }
        }

        existingList.Add(newAttachment);
        round.AttachmentsJson = System.Text.Json.JsonSerializer.Serialize(existingList);

        if (round.AppId.HasValue)
        {
            var app = await _context.JobApplications.FirstOrDefaultAsync(a => a.AppId == round.AppId.Value, ct);
            if (app != null)
            {
                TimelineHelper.AddTimelineEvent(app, "Attachment Uploaded", $"Uploaded {documentType ?? "Attachment"}: {file.FileName}");
            }
        }

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<InterviewRoundDto>.Ok(_mapper.Map<InterviewRoundDto>(round), "Attachment uploaded successfully."));
    }

    [HttpPost("{id:guid}/status")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<InterviewRoundDto>>> UpdateInterviewStatus(
        Guid id,
        [FromQuery] string status,
        CancellationToken ct)
    {
        var round = await _context.InterviewRounds.FirstOrDefaultAsync(r => r.RoundId == id, ct);
        if (round == null)
            return NotFound(ApiResponse<InterviewRoundDto>.Fail("Interview round not found."));

        round.Status = status;
        if (status == "Completed")
            round.CompletedAt = DateTime.UtcNow;

        if (round.AppId.HasValue)
        {
            var app = await _context.JobApplications.FirstOrDefaultAsync(a => a.AppId == round.AppId.Value, ct);
            if (app != null)
            {
                TimelineHelper.AddTimelineEvent(app, $"Interview Status: {status}", $"{round.RoundName} status changed to {status}.");
            }
        }

        await _context.SaveChangesAsync(ct);

        var updated = await _context.InterviewRounds
            .Include(r => r.Interviewer)
            .Include(r => r.Panelists).ThenInclude(p => p.Employee)
            .FirstOrDefaultAsync(r => r.RoundId == id, ct);

        return Ok(ApiResponse<InterviewRoundDto>.Ok(_mapper.Map<InterviewRoundDto>(updated), $"Status updated to {status}."));
    }

    [HttpPost("{id:guid}/send-invitation")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<InterviewRoundDto>>> SendInvitation(Guid id, CancellationToken ct)
    {
        var round = await _context.InterviewRounds
            .Include(r => r.Panelists).ThenInclude(p => p.Employee)
            .FirstOrDefaultAsync(r => r.RoundId == id, ct);

        if (round == null)
            return NotFound(ApiResponse<InterviewRoundDto>.Fail("Interview round not found."));

        round.Status = "InvitationSent";

        if (round.AppId.HasValue)
        {
            var app = await _context.JobApplications.FirstOrDefaultAsync(a => a.AppId == round.AppId.Value, ct);
            if (app != null)
            {
                TimelineHelper.AddTimelineEvent(app, "Invitation Sent", $"Interview invitations sent to candidate and interviewers for {round.RoundName}.");
            }
        }

        await _context.SaveChangesAsync(ct);

        var updated = await _context.InterviewRounds
            .Include(r => r.Interviewer)
            .Include(r => r.Panelists).ThenInclude(p => p.Employee)
            .FirstOrDefaultAsync(r => r.RoundId == id, ct);

        return Ok(ApiResponse<InterviewRoundDto>.Ok(_mapper.Map<InterviewRoundDto>(updated), "Interview invitations sent successfully."));
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
                    
                    TimelineHelper.AddTimelineEvent(app, "Rejected", $"Rejected in round {round.RoundName} due to non-unanimous panel feedback.");

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
                        app.CurrentStage = ApplicationStage.ManagerReview;
                    else if (app.CurrentStage == ApplicationStage.ManagerReview)
                        app.CurrentStage = ApplicationStage.HRInterview;

                    TimelineHelper.AddTimelineEvent(app, $"Interview Round Completed: {round.RoundName}", $"Cleared panel interview successfully with average score {round.Rating}/5.0.");

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
