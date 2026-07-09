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
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/offers")]
[ApiVersion("1.0")]
[Authorize]
public class OffersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IPdfGenerationService _pdfService;
    private readonly IFileService _fileService;
    private readonly INotificationService _notificationService;
    private readonly OnboardingOrchestrator _orchestrator;

    public OffersController(
        AppDbContext context,
        IMapper mapper,
        IPdfGenerationService pdfService,
        IFileService fileService,
        INotificationService notificationService,
        OnboardingOrchestrator orchestrator)
    {
        _context = context;
        _mapper = mapper;
        _pdfService = pdfService;
        _fileService = fileService;
        _notificationService = notificationService;
        _orchestrator = orchestrator;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<OfferLetterDto>>>> GetOffers(CancellationToken ct)
    {
        var query = _context.OfferLetters
            .Include(o => o.JobApplication)
                .ThenInclude(a => a.Candidate)
            .Include(o => o.JobApplication)
                .ThenInclude(a => a.Requisition)
            .AsQueryable();

        var list = await query.OrderByDescending(o => o.OfferDate).ToListAsync(ct);
        var dtos = _mapper.Map<List<OfferLetterDto>>(list);
        return Ok(ApiResponse<List<OfferLetterDto>>.Ok(dtos));
    }

    [HttpGet("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<OfferLetterDto>>> GetOffer(Guid id, CancellationToken ct)
    {
        var offer = await _context.OfferLetters
            .Include(o => o.JobApplication)
                .ThenInclude(a => a.Candidate)
            .Include(o => o.JobApplication)
                .ThenInclude(a => a.Requisition)
            .FirstOrDefaultAsync(o => o.OfferId == id, ct);

        if (offer == null)
        {
            return NotFound(ApiResponse<OfferLetterDto>.Fail("Offer letter not found."));
        }

        var dto = _mapper.Map<OfferLetterDto>(offer);
        return Ok(ApiResponse<OfferLetterDto>.Ok(dto));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<OfferLetterDto>>> CreateOffer(
        [FromBody] CreateOfferRequest request,
        CancellationToken ct)
    {
        var app = await _context.JobApplications
            .Include(a => a.Candidate)
            .Include(a => a.Requisition)
            .FirstOrDefaultAsync(a => a.AppId == request.AppId, ct);

        if (app == null)
        {
            return BadRequest(ApiResponse<OfferLetterDto>.Fail("Job application not found."));
        }

        // Check if an offer already exists for this application
        var exists = await _context.OfferLetters.AnyAsync(o => o.AppId == request.AppId, ct);
        if (exists)
        {
            return BadRequest(ApiResponse<OfferLetterDto>.Fail("An offer letter is already generated or pending for this job application."));
        }

        var offer = new OfferLetter
        {
            OfferId = Guid.NewGuid(),
            AppId = request.AppId,
            OfferedCTC = request.OfferedCTC,
            JoiningDate = request.JoiningDate,
            OfferDate = DateTime.UtcNow,
            ExpiryDate = DateTime.UtcNow.AddDays(request.ExpiryDays),
            Status = OfferStatus.Draft
        };

        _context.OfferLetters.Add(offer);
        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<OfferLetterDto>(offer);
        dto.CandidateName = $"{app.Candidate.FirstName} {app.Candidate.LastName}";
        dto.JobTitle = app.Requisition.JobTitle;

        return CreatedAtAction(nameof(GetOffer), new { id = offer.OfferId }, ApiResponse<OfferLetterDto>.Ok(dto));
    }

    [HttpPost("{id:guid}/approve")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Approve)]
    public async Task<ActionResult<ApiResponse<OfferLetterDto>>> ApproveOffer(
        Guid id,
        [FromBody] ApproveJobRequisitionRequest request,
        CancellationToken ct)
    {
        var offer = await _context.OfferLetters
            .Include(o => o.JobApplication)
                .ThenInclude(a => a.Candidate)
            .Include(o => o.JobApplication)
                .ThenInclude(a => a.Requisition)
            .FirstOrDefaultAsync(o => o.OfferId == id, ct);

        if (offer == null)
        {
            return NotFound(ApiResponse<OfferLetterDto>.Fail("Offer letter not found."));
        }

        if (offer.Status != OfferStatus.Draft)
        {
            return BadRequest(ApiResponse<OfferLetterDto>.Fail("Only draft offers can be approved or rejected."));
        }

        if (request.Approved)
        {
            offer.Status = OfferStatus.Sent;
            offer.JobApplication.CurrentStage = ApplicationStage.Offer;

            // Generate Offer Letter PDF on the fly using QuestPDF
            var pdfBytes = await _pdfService.GenerateOfferLetterAsync(offer.OfferId, ct);
            
            // Save to Document Vault
            using var ms = new MemoryStream(pdfBytes);
            var fileName = $"OfferLetter_{offer.OfferId}.pdf";
            var folder = $"candidates/{offer.JobApplication.CandidateId}/offers";
            var savedPath = await _fileService.SaveAsync(ms, fileName, folder, ct);
            
            offer.LetterFilePath = savedPath;

            // Notify candidate / recruitment manager
            await _notificationService.SendToRoleAsync(
                RoleCodes.HRAdmin, 
                "Offer Released", 
                $"Offer letter has been successfully released for {offer.JobApplication.Candidate.FirstName} {offer.JobApplication.Candidate.LastName}.", 
                NotificationType.General
            );
        }
        else
        {
            offer.Status = OfferStatus.Rejected;
            offer.JobApplication.CurrentStage = ApplicationStage.Rejected;
            offer.JobApplication.RejectionReason = $"Offer rejected by approver. Comments: {request.Comment}";
        }

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<OfferLetterDto>(offer);
        return Ok(ApiResponse<OfferLetterDto>.Ok(dto, request.Approved ? "Offer letter approved and sent successfully." : "Offer letter rejected."));
    }

    [HttpGet("{id:guid}/download")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<IActionResult> DownloadOfferLetter(Guid id, CancellationToken ct)
    {
        var offer = await _context.OfferLetters.FirstOrDefaultAsync(o => o.OfferId == id, ct);
        if (offer == null)
        {
            return NotFound(ApiResponse<object>.Fail("Offer letter not found."));
        }

        if (string.IsNullOrEmpty(offer.LetterFilePath))
        {
            return BadRequest(ApiResponse<object>.Fail("Offer letter PDF has not been generated or approved yet."));
        }

        var stream = await _fileService.GetAsync(offer.LetterFilePath, ct);
        return File(stream, "application/pdf", $"OfferLetter_{id}.pdf");
    }

    [HttpPut("{id:guid}/accept")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OfferLetterDto>>> AcceptOffer(Guid id, [FromBody] AcceptOfferRequest request, CancellationToken ct)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var offer = await _context.OfferLetters
                .Include(o => o.JobApplication)
                    .ThenInclude(ja => ja.Candidate)
                .FirstOrDefaultAsync(o => o.OfferId == id, ct);

            if (offer == null)
            {
                return NotFound(ApiResponse<OfferLetterDto>.Fail("Offer letter not found."));
            }

            if (offer.Status == OfferStatus.Accepted)
            {
                return BadRequest(ApiResponse<OfferLetterDto>.Fail("Offer letter has already been accepted."));
            }

            offer.Status = OfferStatus.Accepted;
            offer.JobApplication.CurrentStage = ApplicationStage.Joined;

            // Initialize Onboarding Process
            var onboarding = new OnboardingProcess
            {
                OnboardingId = Guid.NewGuid(),
                CandidateId = offer.JobApplication.CandidateId,
                AccessToken = Guid.NewGuid().ToString("N"),
                TokenExpiresAt = DateTime.UtcNow.AddDays(30),
                Status = "PreJoining",
                PersonalInfoCompleted = false,
                DocumentsUploaded = false,
                HRChecklistJson = "[]",
                ITChecklistJson = "[]",
                AdminChecklistJson = "[]"
            };

            var transition = new
            {
                fromState = "None",
                toState = "PreJoining",
                updatedBy = "Candidate",
                timestamp = DateTime.UtcNow,
                remarks = $"Offer accepted. Comments: {request.Remarks}"
            };
            onboarding.TransitionHistoryJson = System.Text.Json.JsonSerializer.Serialize(new[] { transition });

            _context.OnboardingProcesses.Add(onboarding);
            await _context.SaveChangesAsync(ct);

            // Generate Default Checklist Tasks using Orchestrator
            await _orchestrator.GenerateDefaultTasksAsync(onboarding.OnboardingId, _context, ct);

            // Initialize BGV Record
            var bgv = new BGVRecord
            {
                BGVId = Guid.NewGuid(),
                CandidateId = offer.JobApplication.CandidateId,
                IdentityStatus = "Pending",
                EmploymentStatus = "Pending",
                EducationStatus = "Pending",
                CriminalStatus = "Pending",
                ReferenceStatus = "Pending",
                CreditStatus = "Pending",
                Status = "Pending",
                DiscrepancyNotes = "BGV initiated automatically upon offer acceptance."
            };
            _context.BGVRecords.Add(bgv);

            // Write Audit Log
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "unknown";

            _context.SecurityAuditLogs.Add(new SecurityAuditLog
            {
                LogId = Guid.NewGuid(),
                EventType = "OFFER_ACCEPTED",
                UserId = null,
                Username = offer.JobApplication.Candidate.Email,
                IpAddress = clientIp,
                UserAgent = userAgent,
                Details = $"Offer accepted by Candidate {offer.JobApplication.Candidate.FirstName} {offer.JobApplication.Candidate.LastName}. BGV and Tasks initialized.",
                IsSuccess = true,
                CreatedAt = DateTime.UtcNow
            });

            _context.AuditLogs.Add(new AuditLog
            {
                AuditLogId = Guid.NewGuid(),
                UserId = null,
                Action = "Offer Accepted",
                TableName = "OfferLetters",
                RecordId = offer.OfferId.ToString(),
                NewValues = System.Text.Json.JsonSerializer.Serialize(new { Status = "Accepted", OnboardingId = onboarding.OnboardingId }),
                IPAddress = clientIp,
                UserAgent = userAgent,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            // Trigger Notification to HR Admin
            await _notificationService.SendToRoleAsync(
                RoleCodes.HRAdmin,
                "Offer Accepted",
                $"Candidate {offer.JobApplication.Candidate.FirstName} {offer.JobApplication.Candidate.LastName} has accepted the offer letter.",
                NotificationType.General
            );

            var dto = _mapper.Map<OfferLetterDto>(offer);
            return Ok(ApiResponse<OfferLetterDto>.Ok(dto, "Offer accepted successfully. Onboarding and BGV processes have been initialized."));
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}
