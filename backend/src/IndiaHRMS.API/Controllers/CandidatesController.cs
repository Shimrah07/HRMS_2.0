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
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ClosedXML.Excel;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/candidates")]
[ApiVersion("1.0")]
[Authorize]
public class CandidatesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFileService _fileService;

    public CandidatesController(AppDbContext context, IMapper mapper, IFileService fileService)
    {
        _context = context;
        _mapper = mapper;
        _fileService = fileService;
    }

    // ─── Lookup: search by Name, Email, or Mobile (for smart Add Candidate modal) ─
    [HttpGet("lookup")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<CandidateLookupDto>>>> LookupCandidates(
        [FromQuery] string q,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return Ok(ApiResponse<List<CandidateLookupDto>>.Ok(new List<CandidateLookupDto>()));

        var search = q.Trim().ToLower();

        var matches = await _context.Candidates
            .Where(c =>
                (c.FirstName + " " + (c.LastName ?? "")).ToLower().Contains(search) ||
                c.Email.ToLower().Contains(search) ||
                (c.Phone != null && c.Phone.Contains(search)))
            .OrderBy(c => c.FirstName)
            .Take(5)
            .Select(c => new CandidateLookupDto
            {
                CandidateId = c.CandidateId,
                FullName = (c.FirstName + " " + (c.LastName ?? "")).Trim(),
                Email = c.Email,
                Phone = c.Phone,
                CurrentCompany = c.CurrentCompany,
                CurrentDesignation = c.CurrentDesignation,
                CurrentCTC = c.CurrentCTC,
                ExpectedCTC = c.ExpectedCTC,
                NoticePeriodDays = c.NoticePeriodDays,
                TotalExperience = c.TotalExperience,
                Source = c.Source.HasValue ? c.Source.Value.ToString() : null,
                ResumeFilePath = c.ResumeFilePath
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<CandidateLookupDto>>.Ok(matches));
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<CandidateDto>>>> GetCandidates(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? source,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortOrder,
        [FromQuery] Guid? jobId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var query = _context.Candidates
            .Include(c => c.ReferralEmployee)
            .Include(c => c.CandidateAnswers)
            .AsQueryable();

        // Filter by job posting (jobId filter)
        if (jobId.HasValue)
        {
            query = query.Where(c => c.JobApplications.Any(a =>
                a.Requisition.JobPostings.Any(p => p.JobId == jobId.Value)));
        }

        if (!string.IsNullOrEmpty(search))
        {
            var cleanSearch = search.Trim().ToLower();
            query = query.Where(c =>
                c.FirstName.ToLower().Contains(cleanSearch) ||
                (c.LastName != null && c.LastName.ToLower().Contains(cleanSearch)) ||
                c.Email.ToLower().Contains(cleanSearch) ||
                (c.Phone != null && c.Phone.Contains(cleanSearch)) ||
                (c.CurrentCompany != null && c.CurrentCompany.ToLower().Contains(cleanSearch))
            );
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<CandidateStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(c => c.CandidateStatus == parsedStatus);
            }
        }

        if (!string.IsNullOrEmpty(source))
        {
            if (Enum.TryParse<CandidateSource>(source, true, out var parsedSource))
            {
                query = query.Where(c => c.Source == parsedSource);
            }
        }

        var isDesc = string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(sortBy))
        {
            var cleanSort = sortBy.Trim().ToLower();
            query = cleanSort switch
            {
                "name" => isDesc ? query.OrderByDescending(c => c.FirstName).ThenByDescending(c => c.LastName) : query.OrderBy(c => c.FirstName).ThenBy(c => c.LastName),
                "email" => isDesc ? query.OrderByDescending(c => c.Email) : query.OrderBy(c => c.Email),
                "phone" => isDesc ? query.OrderByDescending(c => c.Phone) : query.OrderBy(c => c.Phone),
                "company" => isDesc ? query.OrderByDescending(c => c.CurrentCompany) : query.OrderBy(c => c.CurrentCompany),
                "experience" => isDesc ? query.OrderByDescending(c => c.TotalExperience) : query.OrderBy(c => c.TotalExperience),
                "currentctc" => isDesc ? query.OrderByDescending(c => c.CurrentCTC) : query.OrderBy(c => c.CurrentCTC),
                "expectedctc" => isDesc ? query.OrderByDescending(c => c.ExpectedCTC) : query.OrderBy(c => c.ExpectedCTC),
                "source" => isDesc ? query.OrderByDescending(c => c.Source) : query.OrderBy(c => c.Source),
                "status" => isDesc ? query.OrderByDescending(c => c.CandidateStatus) : query.OrderBy(c => c.CandidateStatus),
                "lastupdated" => isDesc ? query.OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt) : query.OrderBy(c => c.UpdatedAt ?? c.CreatedAt),
                _ => isDesc ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt)
            };
        }
        else
        {
            query = query.OrderByDescending(c => c.CreatedAt);
        }

        var total = await query.CountAsync(ct);
        var pagedCandidates = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var candidateIds = pagedCandidates.Select(c => c.CandidateId).ToList();

        // Enrich with latest application metadata
        var latestApps = await _context.JobApplications
            .Include(a => a.Requisition)
                .ThenInclude(r => r.Department)
            .Include(a => a.Requisition)
                .ThenInclude(r => r.JobPostings)
            .Include(a => a.AssignedRecruiter)
            .Where(a => candidateIds.Contains(a.CandidateId))
            .GroupBy(a => a.CandidateId)
            .Select(g => g.OrderByDescending(a => a.ApplicationDate).First())
            .ToListAsync(ct);

        var appLookup = latestApps.ToDictionary(a => a.CandidateId);

        // Resolve recruiter user names for any apps that have AssignedRecruiterId
        var recruiterIds = latestApps
            .Where(a => a.AssignedRecruiterId.HasValue)
            .Select(a => a.AssignedRecruiterId!.Value)
            .Distinct()
            .ToList();
        var recruiterNames = await _context.Users
            .Where(u => recruiterIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => $"{u.FirstName} {u.LastName}".Trim(), ct);

        var appCounts = await _context.JobApplications
            .Where(a => candidateIds.Contains(a.CandidateId))
            .GroupBy(a => a.CandidateId)
            .Select(g => new { CandidateId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CandidateId, x => x.Count, ct);

        var dtos = _mapper.Map<List<CandidateDto>>(pagedCandidates);

        foreach (var dto in dtos)
        {
            if (appCounts.TryGetValue(dto.CandidateId, out var count))
            {
                dto.ApplicationsCount = count;
            }

            if (appLookup.TryGetValue(dto.CandidateId, out var app))
            {
                // Job title from posting if available, else requisition title
                dto.LatestJobTitle = app.Requisition?.JobPostings?.FirstOrDefault()?.JobTitle
                    ?? app.Requisition?.JobTitle;
                dto.LatestDepartmentName = app.Requisition?.Department?.DeptName;
                dto.LatestApplicationDate = app.ApplicationDate;
                dto.LatestStage = app.CurrentStage.ToString();

                if (app.AssignedRecruiterId.HasValue &&
                    recruiterNames.TryGetValue(app.AssignedRecruiterId.Value, out var rName))
                {
                    dto.AssignedRecruiterName = rName;
                }
            }
        }

        return Ok(ApiResponse<List<CandidateDto>>.PagedOk(dtos, page, pageSize, total));
    }

    [HttpGet("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<CandidateDto>>> GetCandidate(Guid id, CancellationToken ct)
    {
        var candidate = await _context.Candidates
            .Include(c => c.ReferralEmployee)
            .Include(c => c.CandidateAnswers)
            .Include(c => c.JobApplications)
                .ThenInclude(a => a.Requisition)
            .FirstOrDefaultAsync(c => c.CandidateId == id, ct);

        if (candidate == null)
        {
            return NotFound(ApiResponse<CandidateDto>.Fail("Candidate not found."));
        }

        var dto = _mapper.Map<CandidateDto>(candidate);
        dto.ApplicationsCount = candidate.JobApplications?.Count ?? 0;
        return Ok(ApiResponse<CandidateDto>.Ok(dto));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<CandidateDto>>> CreateCandidate(
        [FromBody] CreateCandidateRequest request,
        CancellationToken ct)
    {
        // Duplicate check (matching email or mobile)
        var exists = await _context.Candidates.AnyAsync(c => 
            c.Email.ToLower() == request.Email.ToLower() || 
            (request.Phone != null && c.Phone == request.Phone), ct);

        if (exists)
        {
            return Conflict(ApiResponse<CandidateDto>.Fail("A candidate with this email or phone number already exists."));
        }

        var candidate = _mapper.Map<Candidate>(request);
        candidate.CandidateId = Guid.NewGuid();
        candidate.CandidateStatus = CandidateStatus.Active;

        _context.Candidates.Add(candidate);
        await _context.SaveChangesAsync(ct);

        // Fetch fully populated candidate for mapping name info
        var savedCandidate = await _context.Candidates
            .Include(c => c.ReferralEmployee)
            .FirstOrDefaultAsync(c => c.CandidateId == candidate.CandidateId, ct);

        var dto = _mapper.Map<CandidateDto>(savedCandidate);
        return CreatedAtAction(nameof(GetCandidate), new { id = candidate.CandidateId }, ApiResponse<CandidateDto>.Ok(dto));
    }

    [HttpPut("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<CandidateDto>>> UpdateCandidate(
        Guid id,
        [FromBody] UpdateCandidateRequest request,
        CancellationToken ct)
    {
        var candidate = await _context.Candidates
            .Include(c => c.ReferralEmployee)
            .FirstOrDefaultAsync(c => c.CandidateId == id, ct);

        if (candidate == null)
        {
            return NotFound(ApiResponse<CandidateDto>.Fail("Candidate not found."));
        }

        // Validate duplicates for other candidate records
        var emailDup = await _context.Candidates.AnyAsync(c => 
            c.CandidateId != id && c.Email.ToLower() == request.Email.ToLower(), ct);
        if (emailDup)
        {
            return Conflict(ApiResponse<CandidateDto>.Fail("Another candidate is already using this email address."));
        }

        if (!string.IsNullOrEmpty(request.Phone))
        {
            var phoneDup = await _context.Candidates.AnyAsync(c => 
                c.CandidateId != id && c.Phone == request.Phone, ct);
            if (phoneDup)
            {
                return Conflict(ApiResponse<CandidateDto>.Fail("Another candidate is already using this phone number."));
            }
        }

        _mapper.Map(request, candidate);
        await _context.SaveChangesAsync(ct);

        // Fetch fully populated candidate for mapping name info
        var savedCandidate = await _context.Candidates
            .Include(c => c.ReferralEmployee)
            .Include(c => c.CandidateAnswers)
            .FirstOrDefaultAsync(c => c.CandidateId == id, ct);

        var dto = _mapper.Map<CandidateDto>(savedCandidate);
        return Ok(ApiResponse<CandidateDto>.Ok(dto, "Candidate details updated successfully."));
    }

    [HttpPost("{id:guid}/resume")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<CandidateDto>>> UploadResume(
        Guid id,
        IFormFile resume,
        CancellationToken ct)
    {
        var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.CandidateId == id, ct);
        if (candidate == null)
        {
            return NotFound(ApiResponse<CandidateDto>.Fail("Candidate not found."));
        }

        if (resume == null || resume.Length == 0)
        {
            return BadRequest(ApiResponse<CandidateDto>.Fail("No file was uploaded."));
        }

        if (!_fileService.IsValidExtension(resume.FileName))
        {
            return BadRequest(ApiResponse<CandidateDto>.Fail("Unsupported file extension. Only PDF, DOC, DOCX and images are allowed."));
        }

        if (!_fileService.IsValidSize(resume.Length))
        {
            return BadRequest(ApiResponse<CandidateDto>.Fail("File size exceeds the allowed limit."));
        }

        // Save resume using file service
        using var stream = resume.OpenReadStream();
        var folder = $"candidates/{id}/resume";
        var savedPath = await _fileService.SaveAsync(stream, resume.FileName, folder, ct);

        // Update candidate path
        candidate.ResumeFilePath = savedPath;
        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<CandidateDto>(candidate);
        return Ok(ApiResponse<CandidateDto>.Ok(dto, "Resume uploaded successfully."));
    }

    [HttpDelete("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCandidate(Guid id, CancellationToken ct)
    {
        var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.CandidateId == id, ct);
        if (candidate == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Candidate not found."));
        }

        _context.Candidates.Remove(candidate);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<bool>.Ok(true, "Candidate deleted successfully."));
    }

    [HttpPost("import")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<string>>> ImportCandidates(
        IFormFile file,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<string>.Fail("No file was uploaded."));
        }

        var extension = Path.GetExtension(file.FileName).ToLower();

        if (extension == ".zip")
        {
            using (var archive = new ZipArchive(file.OpenReadStream()))
            {
                int imported = 0;
                foreach (var entry in archive.Entries)
                {
                    if (entry.Length > 0 && (entry.FullName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) || 
                                             entry.FullName.EndsWith(".doc", StringComparison.OrdinalIgnoreCase) || 
                                             entry.FullName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase)))
                    {
                        var entryFileName = Path.GetFileName(entry.FullName);
                        var fileNameWithoutExt = Path.GetFileNameWithoutExtension(entryFileName);
                        var parts = fileNameWithoutExt.Split(new[] { '_', ' ', '-' }, StringSplitOptions.RemoveEmptyEntries);
                        var firstName = parts.Length > 0 ? parts[0] : "Imported";
                        var lastName = parts.Length > 1 ? parts[1] : "Candidate";

                        var email = $"{firstName.ToLower()}.{lastName.ToLower()}@placeholder-import.com";
                        int suffix = 1;
                        while (await _context.Candidates.AnyAsync(c => c.Email.ToLower() == email.ToLower(), ct))
                        {
                            email = $"{firstName.ToLower()}.{lastName.ToLower()}{suffix}@placeholder-import.com";
                            suffix++;
                        }

                        var candidate = new Candidate
                        {
                            CandidateId = Guid.NewGuid(),
                            FirstName = firstName,
                            LastName = lastName,
                            Email = email,
                            Phone = null,
                            CandidateStatus = CandidateStatus.Active,
                            Source = CandidateSource.Other,
                            CreatedAt = DateTime.UtcNow
                        };

                        using (var entryStream = entry.Open())
                        {
                            var savedPath = await _fileService.SaveAsync(entryStream, entryFileName, $"candidates/{candidate.CandidateId}/resume", ct);
                            candidate.ResumeFilePath = savedPath;
                        }

                        _context.Candidates.Add(candidate);
                        imported++;
                    }
                }
                await _context.SaveChangesAsync(ct);
                return Ok(ApiResponse<string>.Ok($"Successfully imported {imported} candidates from ZIP resumes."));
            }
        }
        else if (extension == ".csv")
        {
            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                await reader.ReadLineAsync(); // Skip header
                int imported = 0;
                int skipped = 0;
                List<string> errors = new();

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
                    var tags = values.Length > 17 ? values[17].Trim() : "";

                    if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(email))
                    {
                        skipped++;
                        continue;
                    }

                    var dup = await _context.Candidates.AnyAsync(c => 
                        c.Email.ToLower() == email.ToLower() || 
                        (!string.IsNullOrEmpty(phone) && c.Phone == phone), ct);

                    if (dup)
                    {
                        skipped++;
                        continue;
                    }

                    Gender? gender = null;
                    if (Enum.TryParse<Gender>(genderStr, true, out var parsedGender))
                        gender = parsedGender;

                    CandidateSource? source = CandidateSource.Other;
                    if (Enum.TryParse<CandidateSource>(sourceStr, true, out var parsedSource))
                        source = parsedSource;

                    decimal.TryParse(totalExpStr, out var totalExp);
                    decimal.TryParse(relExpStr, out var relExp);
                    decimal.TryParse(currCtcStr, out var currCtc);
                    decimal.TryParse(expCtcStr, out var expCtc);
                    int.TryParse(noticeStr, out var noticePeriod);

                    var candidate = new Candidate
                    {
                        CandidateId = Guid.NewGuid(),
                        FirstName = firstName,
                        LastName = string.IsNullOrEmpty(lastName) ? null : lastName,
                        Email = email,
                        Phone = string.IsNullOrEmpty(phone) ? null : phone,
                        Gender = gender,
                        CurrentCompany = string.IsNullOrEmpty(company) ? null : company,
                        CurrentDesignation = string.IsNullOrEmpty(designation) ? null : designation,
                        TotalExperience = totalExp,
                        RelevantExperience = relExp,
                        HighestQualification = string.IsNullOrEmpty(qualification) ? null : qualification,
                        CurrentLocation = string.IsNullOrEmpty(currLoc) ? null : currLoc,
                        PreferredLocation = string.IsNullOrEmpty(prefLoc) ? null : prefLoc,
                        WillingToRelocate = relocate,
                        CurrentCTC = currCtc,
                        ExpectedCTC = expCtc,
                        NoticePeriodDays = noticePeriod,
                        Source = source,
                        CandidateTags = string.IsNullOrEmpty(tags) ? null : tags,
                        CandidateStatus = CandidateStatus.Active,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Candidates.Add(candidate);
                    imported++;
                }

                await _context.SaveChangesAsync(ct);
                var msg = $"Successfully imported {imported} candidates. Skipped {skipped} duplicate(s).";
                return Ok(ApiResponse<string>.Ok(msg));
            }
        }
        else if (extension == ".xlsx")
        {
            using (var workbook = new XLWorkbook(file.OpenReadStream()))
            {
                var worksheet = workbook.Worksheets.First();
                var rows = worksheet.RowsUsed().Skip(1);
                int imported = 0;
                int skipped = 0;

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
                    var tags = row.Cell(18).GetValue<string>().Trim();

                    if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(email))
                    {
                        skipped++;
                        continue;
                    }

                    var dup = await _context.Candidates.AnyAsync(c => 
                        c.Email.ToLower() == email.ToLower() || 
                        (!string.IsNullOrEmpty(phone) && c.Phone == phone), ct);

                    if (dup)
                    {
                        skipped++;
                        continue;
                    }

                    Gender? gender = null;
                    if (Enum.TryParse<Gender>(genderStr, true, out var parsedGender))
                        gender = parsedGender;

                    CandidateSource? source = CandidateSource.Other;
                    if (Enum.TryParse<CandidateSource>(sourceStr, true, out var parsedSource))
                        source = parsedSource;

                    decimal.TryParse(totalExpStr, out var totalExp);
                    decimal.TryParse(relExpStr, out var relExp);
                    decimal.TryParse(currCtcStr, out var currCtc);
                    decimal.TryParse(expCtcStr, out var expCtc);
                    int.TryParse(noticeStr, out var noticePeriod);

                    var candidate = new Candidate
                    {
                        CandidateId = Guid.NewGuid(),
                        FirstName = firstName,
                        LastName = string.IsNullOrEmpty(lastName) ? null : lastName,
                        Email = email,
                        Phone = string.IsNullOrEmpty(phone) ? null : phone,
                        Gender = gender,
                        CurrentCompany = string.IsNullOrEmpty(company) ? null : company,
                        CurrentDesignation = string.IsNullOrEmpty(designation) ? null : designation,
                        TotalExperience = totalExp,
                        RelevantExperience = relExp,
                        HighestQualification = string.IsNullOrEmpty(qualification) ? null : qualification,
                        CurrentLocation = string.IsNullOrEmpty(currLoc) ? null : currLoc,
                        PreferredLocation = string.IsNullOrEmpty(prefLoc) ? null : prefLoc,
                        WillingToRelocate = relocate,
                        CurrentCTC = currCtc,
                        ExpectedCTC = expCtc,
                        NoticePeriodDays = noticePeriod,
                        Source = source,
                        CandidateTags = string.IsNullOrEmpty(tags) ? null : tags,
                        CandidateStatus = CandidateStatus.Active,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Candidates.Add(candidate);
                    imported++;
                }

                await _context.SaveChangesAsync(ct);
                var msg = $"Successfully imported {imported} candidates. Skipped {skipped} duplicate(s).";
                return Ok(ApiResponse<string>.Ok(msg));
            }
        }
        else
        {
            return BadRequest(ApiResponse<string>.Fail("Invalid file type. Only CSV, Excel (.xlsx), or ZIP are supported."));
        }
    }

    public class BlacklistCandidateRequest
    {
        public string Reason { get; set; } = string.Empty;
    }

    [HttpPost("{id:guid}/blacklist")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> BlacklistCandidate(Guid id, [FromBody] BlacklistCandidateRequest request, CancellationToken ct)
    {
        var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.CandidateId == id, ct);
        if (candidate == null) return NotFound(ApiResponse<object>.Fail("Candidate not found."));

        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(ApiResponse<object>.Fail("Blacklist reason is mandatory."));

        candidate.IsBlacklisted = true;
        candidate.BlacklistReason = request.Reason;
        candidate.BlacklistedAt = DateTime.UtcNow;
        candidate.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Candidate has been blacklisted."));
    }

    [HttpPost("{id:guid}/unblacklist")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> UnblacklistCandidate(Guid id, CancellationToken ct)
    {
        var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.CandidateId == id, ct);
        if (candidate == null) return NotFound(ApiResponse<object>.Fail("Candidate not found."));

        candidate.IsBlacklisted = false;
        candidate.BlacklistReason = null;
        candidate.BlacklistedBy = null;
        candidate.BlacklistedAt = null;
        candidate.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Candidate has been removed from the blacklist."));
    }
}
