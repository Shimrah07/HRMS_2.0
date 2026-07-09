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
[Route("api/v{version:apiVersion}/bgv")]
[ApiVersion("1.0")]
[Authorize]
public class BGVController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public BGVController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<BGVRecordDto>>>> GetBGVRecords(
        [FromQuery] Guid? candidateId,
        CancellationToken ct)
    {
        var query = _context.BGVRecords.AsQueryable();

        if (candidateId.HasValue)
        {
            query = query.Where(b => b.CandidateId == candidateId.Value);
        }

        var list = await query.OrderByDescending(b => b.InitiatedAt).ToListAsync(ct);
        var dtos = _mapper.Map<List<BGVRecordDto>>(list);
        return Ok(ApiResponse<List<BGVRecordDto>>.Ok(dtos));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<BGVRecordDto>>> InitiateBGV(
        [FromBody] InitiateBGVRequest request,
        CancellationToken ct)
    {
        var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.CandidateId == request.CandidateId, ct);
        if (candidate == null)
        {
            return BadRequest(ApiResponse<BGVRecordDto>.Fail("Candidate not found."));
        }

        var exists = await _context.BGVRecords.AnyAsync(b => b.CandidateId == request.CandidateId && b.Status == "Pending", ct);
        if (exists)
        {
            return BadRequest(ApiResponse<BGVRecordDto>.Fail("BGV check is already pending/initiated for this candidate."));
        }

        var bgv = new BGVRecord
        {
            BGVId = Guid.NewGuid(),
            CandidateId = request.CandidateId,
            AgencyName = request.AgencyName,
            BGVType = request.BGVType,
            Status = "Pending",
            InitiatedAt = DateTime.UtcNow,
            IdentityStatus = "Pending",
            EmploymentStatus = "Pending",
            EducationStatus = "Pending",
            CriminalStatus = "Pending",
            ReferenceStatus = "Pending",
            CreditStatus = "Pending"
        };

        _context.BGVRecords.Add(bgv);

        // Auto transition active application to BackgroundCheck stage
        var activeApp = await _context.JobApplications
            .FirstOrDefaultAsync(a => a.CandidateId == request.CandidateId && a.CurrentStage == ApplicationStage.Offer, ct);
        if (activeApp != null)
        {
            activeApp.CurrentStage = ApplicationStage.BackgroundCheck;
        }

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<BGVRecordDto>(bgv);
        return Ok(ApiResponse<BGVRecordDto>.Ok(dto, "Background verification initiated successfully."));
    }

    [HttpPut("{id:guid}/check")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<BGVRecordDto>>> UpdateCheck(
        Guid id,
        [FromBody] UpdateBGVCheckRequest request,
        CancellationToken ct)
    {
        var bgv = await _context.BGVRecords.FirstOrDefaultAsync(b => b.BGVId == id, ct);
        if (bgv == null)
        {
            return NotFound(ApiResponse<BGVRecordDto>.Fail("BGV record not found."));
        }

        var checkType = request.CheckType.Trim().ToLower();
        var status = request.Status.Trim(); // Pending, InProgress, Cleared, Failed, Conditional

        switch (checkType)
        {
            case "identity":
                bgv.IdentityStatus = status;
                break;
            case "employment":
                bgv.EmploymentStatus = status;
                break;
            case "education":
                bgv.EducationStatus = status;
                break;
            case "criminal":
                bgv.CriminalStatus = status;
                break;
            case "reference":
                bgv.ReferenceStatus = status;
                break;
            case "credit":
                bgv.CreditStatus = status;
                break;
            default:
                return BadRequest(ApiResponse<BGVRecordDto>.Fail($"Invalid check type: {request.CheckType}. Valid types are: Identity, Employment, Education, Criminal, Reference, Credit."));
        }

        if (!string.IsNullOrEmpty(request.Notes))
        {
            bgv.DiscrepancyNotes = string.IsNullOrEmpty(bgv.DiscrepancyNotes)
                ? $"{request.CheckType}: {request.Notes}"
                : $"{bgv.DiscrepancyNotes}\n{request.CheckType}: {request.Notes}";
        }

        // Recalculate overall status
        var statuses = new[] 
        { 
            bgv.IdentityStatus, bgv.EmploymentStatus, bgv.EducationStatus, 
            bgv.CriminalStatus, bgv.ReferenceStatus, bgv.CreditStatus 
        };

        if (statuses.Any(s => s == "Failed"))
        {
            bgv.Status = "Failed";
        }
        else if (statuses.All(s => s == "Cleared"))
        {
            bgv.Status = "Cleared";

            // Advance candidate stage logically if BGV is cleared
            var app = await _context.JobApplications
                .FirstOrDefaultAsync(a => a.CandidateId == bgv.CandidateId && a.CurrentStage == ApplicationStage.BackgroundCheck, ct);
            if (app != null)
            {
                app.CurrentStage = ApplicationStage.Joined; // Ready for pre-joining/onboarding
            }
        }
        else
        {
            bgv.Status = "InProgress";
        }

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<BGVRecordDto>(bgv);
        return Ok(ApiResponse<BGVRecordDto>.Ok(dto, "Verification check updated successfully."));
    }
}
