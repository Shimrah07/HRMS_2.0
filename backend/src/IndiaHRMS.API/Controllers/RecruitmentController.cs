using ClosedXML.Excel;
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
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/recruitment")]
[ApiVersion("1.0")]
[Authorize]
public class RecruitmentController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IApplicationService _applicationService;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileService _fileService;

    public RecruitmentController(
        AppDbContext context,
        IApplicationService applicationService,
        ICurrentUserService currentUser,
        IFileService fileService)
    {
        _context = context;
        _applicationService = applicationService;
        _currentUser = currentUser;
        _fileService = fileService;
    }

    // ─── POST /public/apply ──────────────────────────────────────────────────────
    // Public (Careers Portal / external referrals) submission to the Pending Queue
    [HttpPost("public/apply")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<Guid>>> PublicApply(
        [FromForm] ApplyToJobRequest request,
        [FromForm] IFormFile? resumeFile,
        CancellationToken ct)
    {
        // Target job verification
        var jobExists = await _context.JobPostings.AnyAsync(j => j.JobId == request.JobId && j.Status == JobPostingStatus.Published, ct);
        if (!jobExists)
        {
            return NotFound(ApiResponse<Guid>.Fail("Active Job Opening not found."));
        }

        // Upload resume file if provided
        string? resumePath = null;
        if (resumeFile != null && resumeFile.Length > 0)
        {
            using var stream = resumeFile.OpenReadStream();
            var folder = $"resumes/pending/{request.JobId}";
            resumePath = await _fileService.SaveAsync(stream, resumeFile.FileName, folder, ct);
        }

        // Validate basic identity fields
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(ApiResponse<Guid>.Fail("First Name and Email are required."));
        }

        // Duplicate pending application check for same job and email
        var existingPending = await _context.PendingApplications
            .FirstOrDefaultAsync(p => p.JobId == request.JobId && p.Email.ToLower() == request.Email.Trim().ToLower() && p.Status == PendingApplicationStatus.Pending, ct);

        if (existingPending != null)
        {
            return Ok(ApiResponse<Guid>.Ok(existingPending.PendingAppId, "Your application for this position has already been received and is currently under review."));
        }

        // Add to PendingApplication table
        var pending = new PendingApplication
        {
            PendingAppId = Guid.NewGuid(),
            JobId = request.JobId,
            FirstName = request.FirstName.Trim(),
            LastName = string.IsNullOrWhiteSpace(request.LastName) ? null : request.LastName.Trim(),
            Email = request.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            CurrentCompany = request.CurrentCompany,
            CurrentDesignation = request.CurrentDesignation,
            CurrentCTC = request.CurrentCTC,
            ExpectedCTC = request.ExpectedCTC,
            NoticePeriodDays = request.NoticePeriodDays,
            TotalExperience = request.TotalExperience,
            Source = string.IsNullOrEmpty(request.Source) ? "CareerPortal" : request.Source,
            ResumeFilePath = resumePath,
            ReferralEmployeeId = request.ReferralEmployeeId,
            Status = PendingApplicationStatus.Pending,
            AppliedDate = DateTime.UtcNow
        };

        _context.PendingApplications.Add(pending);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<Guid>.Ok(pending.PendingAppId, "Your application has been received successfully and is in review."));
    }

    // ─── GET /pending ────────────────────────────────────────────────────────────
    // Lists pending applications for review in admin workspace
    [HttpGet("pending")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<PendingApplicationDto>>>> GetPendingQueue(
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = _context.PendingApplications
            .Include(p => p.JobPosting)
            .Include(p => p.ReferralEmployee)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<PendingApplicationStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(p => p.Status == parsedStatus);
        }
        else
        {
            query = query.Where(p => p.Status == PendingApplicationStatus.Pending);
        }

        var list = await query
            .OrderByDescending(p => p.AppliedDate)
            .ToListAsync(ct);

        var dtos = list.Select(p => new PendingApplicationDto
        {
            PendingAppId = p.PendingAppId,
            JobId = p.JobId,
            JobTitle = p.JobPosting?.JobTitle ?? "Unknown Job",
            FirstName = p.FirstName,
            LastName = p.LastName,
            Email = p.Email,
            Phone = p.Phone,
            CurrentCompany = p.CurrentCompany,
            CurrentDesignation = p.CurrentDesignation,
            CurrentCTC = p.CurrentCTC,
            ExpectedCTC = p.ExpectedCTC,
            NoticePeriodDays = p.NoticePeriodDays,
            TotalExperience = p.TotalExperience,
            Source = p.Source,
            ResumeFilePath = p.ResumeFilePath,
            ReferralEmployeeId = p.ReferralEmployeeId,
            ReferralEmployeeName = p.ReferralEmployee != null ? $"{p.ReferralEmployee.FirstName} {p.ReferralEmployee.LastName}".Trim() : null,
            Status = p.Status.ToString(),
            AppliedDate = p.AppliedDate,
            RejectionReason = p.RejectionReason
        }).ToList();

        return Ok(ApiResponse<List<PendingApplicationDto>>.Ok(dtos));
    }

    // ─── POST /pending/{id}/approve ──────────────────────────────────────────────
    // Approves a pending application and moves it into the main Candidates database
    [HttpPost("pending/{id:guid}/approve")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<ApplyToJobResult>>> ApproveApplication(
        Guid id,
        CancellationToken ct)
    {
        var pending = await _context.PendingApplications.FirstOrDefaultAsync(p => p.PendingAppId == id, ct);
        if (pending == null)
        {
            return NotFound(ApiResponse<ApplyToJobResult>.Fail("Pending application not found."));
        }

        if (pending.Status != PendingApplicationStatus.Pending)
        {
            return BadRequest(ApiResponse<ApplyToJobResult>.Fail($"Pending application is already {pending.Status}."));
        }

        // Build ApplyToJobRequest
        var applyReq = new ApplyToJobRequest
        {
            JobId = pending.JobId,
            FirstName = pending.FirstName,
            LastName = pending.LastName,
            Email = pending.Email,
            Phone = pending.Phone,
            CurrentCompany = pending.CurrentCompany,
            CurrentDesignation = pending.CurrentDesignation,
            CurrentCTC = pending.CurrentCTC,
            ExpectedCTC = pending.ExpectedCTC,
            NoticePeriodDays = pending.NoticePeriodDays,
            TotalExperience = pending.TotalExperience,
            Source = pending.Source,
            ResumeFilePath = pending.ResumeFilePath,
            ReferralEmployeeId = pending.ReferralEmployeeId,
            AddedByUserId = _currentUser.UserId
        };

        try
        {
            var result = await _applicationService.ApplyToJobAsync(applyReq, ct);
            
            pending.Status = PendingApplicationStatus.Approved;
            pending.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            return Ok(ApiResponse<ApplyToJobResult>.Ok(result, "Application approved and candidate created successfully."));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already applied"))
        {
            return Conflict(ApiResponse<ApplyToJobResult>.Fail("This candidate has already applied to this job opening."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ApplyToJobResult>.Fail(ex.Message));
        }
    }

    // ─── POST /pending/{id}/reject ───────────────────────────────────────────────
    // Rejects a pending application with optional reason
    [HttpPost("pending/{id:guid}/reject")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<bool>>> RejectApplication(
        Guid id,
        [FromBody] RejectPendingRequest request,
        CancellationToken ct)
    {
        var pending = await _context.PendingApplications.FirstOrDefaultAsync(p => p.PendingAppId == id, ct);
        if (pending == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Pending application not found."));
        }

        if (pending.Status != PendingApplicationStatus.Pending)
        {
            return BadRequest(ApiResponse<bool>.Fail($"Pending application is already {pending.Status}."));
        }

        pending.Status = PendingApplicationStatus.Rejected;
        pending.RejectionReason = request.Reason;
        pending.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<bool>.Ok(true, "Application rejected successfully."));
    }

    // ─── POST /import/preview ────────────────────────────────────────────────────
    // Accepts CSV/Excel sheet, parses and returns rows for preview
    [HttpPost("import/preview")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<List<CandidatesImportRow>>>> PreviewImport(
        IFormFile file,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<List<CandidatesImportRow>>.Fail("No file was uploaded."));
        }

        var extension = Path.GetExtension(file.FileName).ToLower();
        var list = new List<CandidatesImportRow>();

        if (extension == ".csv")
        {
            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                await reader.ReadLineAsync(); // Skip header
                while (!reader.EndOfStream)
                {
                    var line = await reader.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var values = line.Split(',');
                    if (values.Length < 3) continue;

                    var firstName = values[0].Trim();
                    var lastName = values.Length > 1 ? values[1].Trim() : "";
                    var email = values.Length > 2 ? values[2].Trim() : "";
                    var phone = values.Length > 3 ? values[3].Trim() : "";
                    var genderStr = values.Length > 4 ? values[4].Trim() : "";
                    var company = values.Length > 5 ? values[5].Trim() : "";
                    var designation = values.Length > 6 ? values[6].Trim() : "";
                    var totalExpStr = values.Length > 7 ? values[7].Trim() : "0";
                    var relExpStr = values.Length > 8 ? values[8].Trim() : "0";
                    var qualification = values.Length > 9 ? values[9].Trim() : "";
                    var currLoc = values.Length > 10 ? values[10].Trim() : "";
                    var prefLoc = values.Length > 11 ? values[11].Trim() : "";
                    var relocate = values.Length > 12 ? values[12].Trim() : "No";
                    var currCtcStr = values.Length > 13 ? values[13].Trim() : "0";
                    var expCtcStr = values.Length > 14 ? values[14].Trim() : "0";
                    var noticeStr = values.Length > 15 ? values[15].Trim() : "0";
                    var sourceStr = values.Length > 16 ? values[16].Trim() : "";

                    if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(email))
                        continue;

                    decimal.TryParse(totalExpStr, out var totalExp);
                    decimal.TryParse(currCtcStr, out var currCtc);
                    decimal.TryParse(expCtcStr, out var expCtc);
                    int.TryParse(noticeStr, out var noticePeriod);

                    list.Add(new CandidatesImportRow
                    {
                        FirstName = firstName,
                        LastName = string.IsNullOrEmpty(lastName) ? null : lastName,
                        Email = email,
                        Phone = string.IsNullOrEmpty(phone) ? null : phone,
                        CurrentCompany = string.IsNullOrEmpty(company) ? null : company,
                        CurrentDesignation = string.IsNullOrEmpty(designation) ? null : designation,
                        TotalExperience = totalExp,
                        CurrentCTC = currCtc,
                        ExpectedCTC = expCtc,
                        NoticePeriodDays = noticePeriod,
                        Source = string.IsNullOrEmpty(sourceStr) ? "CSVImport" : sourceStr
                    });
                }
            }
        }
        else if (extension == ".xlsx")
        {
            using (var workbook = new XLWorkbook(file.OpenReadStream()))
            {
                var worksheet = workbook.Worksheets.First();
                var rows = worksheet.RowsUsed().Skip(1);
                foreach (var row in rows)
                {
                    var firstName = row.Cell(1).GetValue<string>().Trim();
                    var lastName = row.Cell(2).GetValue<string>().Trim();
                    var email = row.Cell(3).GetValue<string>().Trim();
                    var phone = row.Cell(4).GetValue<string>().Trim();
                    var genderStr = row.Cell(5).GetValue<string>().Trim();
                    var company = row.Cell(6).GetValue<string>().Trim();
                    var designation = row.Cell(7).GetValue<string>().Trim();
                    var totalExpStr = row.Cell(8).GetValue<string>().Trim();
                    var relExpStr = row.Cell(9).GetValue<string>().Trim();
                    var qualification = row.Cell(10).GetValue<string>().Trim();
                    var currLoc = row.Cell(11).GetValue<string>().Trim();
                    var prefLoc = row.Cell(12).GetValue<string>().Trim();
                    var relocate = row.Cell(13).GetValue<string>().Trim();
                    var currCtcStr = row.Cell(14).GetValue<string>().Trim();
                    var expCtcStr = row.Cell(15).GetValue<string>().Trim();
                    var noticeStr = row.Cell(16).GetValue<string>().Trim();
                    var sourceStr = row.Cell(17).GetValue<string>().Trim();

                    if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(email))
                        continue;

                    decimal.TryParse(totalExpStr, out var totalExp);
                    decimal.TryParse(currCtcStr, out var currCtc);
                    decimal.TryParse(expCtcStr, out var expCtc);
                    int.TryParse(noticeStr, out var noticePeriod);

                    list.Add(new CandidatesImportRow
                    {
                        FirstName = firstName,
                        LastName = string.IsNullOrEmpty(lastName) ? null : lastName,
                        Email = email,
                        Phone = string.IsNullOrEmpty(phone) ? null : phone,
                        CurrentCompany = string.IsNullOrEmpty(company) ? null : company,
                        CurrentDesignation = string.IsNullOrEmpty(designation) ? null : designation,
                        TotalExperience = totalExp,
                        CurrentCTC = currCtc,
                        ExpectedCTC = expCtc,
                        NoticePeriodDays = noticePeriod,
                        Source = string.IsNullOrEmpty(sourceStr) ? "CSVImport" : sourceStr
                    });
                }
            }
        }
        else
        {
            return BadRequest(ApiResponse<List<CandidatesImportRow>>.Fail("Invalid file type. Only CSV or Excel (.xlsx) are supported."));
        }

        return Ok(ApiResponse<List<CandidatesImportRow>>.Ok(list));
    }

    // ─── POST /import/apply ──────────────────────────────────────────────────────
    // Confirms and imports parsed CSV/Excel rows directly into Candidate Database and (optional) ApplyToJob
    [HttpPost("import/apply")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<CandidatesImportResult>>> ConfirmImport(
        [FromBody] ConfirmCandidatesImportRequest request,
        CancellationToken ct)
    {
        var result = new CandidatesImportResult
        {
            TotalRows = request.Candidates.Count
        };

        bool hasJob = request.JobId.HasValue && request.JobId.Value != Guid.Empty;

        foreach (var row in request.Candidates)
        {
            if (string.IsNullOrWhiteSpace(row.FirstName) || string.IsNullOrWhiteSpace(row.Email))
            {
                result.FailedCount++;
                result.Errors.Add($"Row skipped: First Name and Email are required for candidate registration.");
                continue;
            }

            if (hasJob)
            {
                var applyReq = new ApplyToJobRequest
                {
                    JobId = request.JobId.Value,
                    FirstName = row.FirstName,
                    LastName = row.LastName,
                    Email = row.Email,
                    Phone = row.Phone,
                    CurrentCompany = row.CurrentCompany,
                    CurrentDesignation = row.CurrentDesignation,
                    TotalExperience = row.TotalExperience,
                    CurrentCTC = row.CurrentCTC,
                    ExpectedCTC = row.ExpectedCTC,
                    NoticePeriodDays = row.NoticePeriodDays,
                    Source = "CSVImport",
                    AddedByUserId = _currentUser.UserId
                };

                try
                {
                    await _applicationService.ApplyToJobAsync(applyReq, ct);
                    result.ImportedCount++;
                }
                catch (InvalidOperationException ex) when (ex.Message.Contains("already applied"))
                {
                    result.SkippedCount++;
                    result.Errors.Add($"Candidate {row.FirstName} <{row.Email}> skipped: Already applied to this job opening.");
                }
                catch (Exception ex)
                {
                    result.FailedCount++;
                    result.Errors.Add($"Candidate {row.FirstName} <{row.Email}> failed: {ex.Message}");
                }
            }
            else
            {
                // Direct Candidate Database Import (No JobId selected)
                try
                {
                    var cleanEmail = row.Email.Trim().ToLower();
                    var cleanPhone = string.IsNullOrWhiteSpace(row.Phone) ? null : row.Phone.Trim();

                    var dup = await _context.Candidates.AnyAsync(c =>
                        c.Email.ToLower() == cleanEmail ||
                        (cleanPhone != null && c.Phone == cleanPhone), ct);

                    if (dup)
                    {
                        result.SkippedCount++;
                        result.Errors.Add($"Candidate {row.FirstName} <{row.Email}> skipped: Candidate already exists in database.");
                        continue;
                    }

                    var candidate = new Candidate
                    {
                        CandidateId = Guid.NewGuid(),
                        FirstName = row.FirstName.Trim(),
                        LastName = string.IsNullOrWhiteSpace(row.LastName) ? null : row.LastName.Trim(),
                        Email = cleanEmail,
                        Phone = cleanPhone,
                        CurrentCompany = string.IsNullOrWhiteSpace(row.CurrentCompany) ? null : row.CurrentCompany.Trim(),
                        CurrentDesignation = string.IsNullOrWhiteSpace(row.CurrentDesignation) ? null : row.CurrentDesignation.Trim(),
                        TotalExperience = row.TotalExperience,
                        CurrentCTC = row.CurrentCTC,
                        ExpectedCTC = row.ExpectedCTC,
                        NoticePeriodDays = row.NoticePeriodDays,
                        Source = CandidateSource.CSVImport,
                        CandidateStatus = CandidateStatus.Active,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Candidates.Add(candidate);
                    await _context.SaveChangesAsync(ct);
                    result.ImportedCount++;
                }
                catch (Exception ex)
                {
                    result.FailedCount++;
                    result.Errors.Add($"Candidate {row.FirstName} <{row.Email}> failed: {ex.Message}");
                }
            }
        }

        return Ok(ApiResponse<CandidatesImportResult>.Ok(result, $"Import complete. Imported: {result.ImportedCount}, Skipped: {result.SkippedCount}, Failed: {result.FailedCount}."));
    }
}

public class RejectPendingRequest
{
    public string? Reason { get; set; }
}
