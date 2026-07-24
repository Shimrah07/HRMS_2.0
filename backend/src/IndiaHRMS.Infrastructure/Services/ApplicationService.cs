using System;
using System.Threading;
using System.Threading.Tasks;
using IndiaHRMS.Application.DTOs.Recruitment;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.Infrastructure.Services;

/// <summary>
/// Unified candidate application service for both Manual HR Entry and future Careers Portal.
/// ApplyToJobAsync() is the single entry point — zero code duplication.
/// </summary>
public class ApplicationService : IApplicationService
{
    private readonly AppDbContext _context;
    private readonly IFileService _fileService;

    public ApplicationService(AppDbContext context, IFileService fileService)
    {
        _context = context;
        _fileService = fileService;
    }

    /// <inheritdoc />
    public async Task<ApplyToJobResult> ApplyToJobAsync(ApplyToJobRequest request, CancellationToken ct = default)
    {
        // ─── Step 1: Validate the Job Posting (JobId only — ReqId resolved internally) ───
        var posting = await _context.JobPostings
            .Include(p => p.JobRequisition)
                .ThenInclude(r => r.Department)
            .FirstOrDefaultAsync(p => p.JobId == request.JobId, ct);

        if (posting == null)
            throw new InvalidOperationException("Job posting not found.");

        if (posting.Status != JobPostingStatus.Published)
            throw new InvalidOperationException("Candidates can only be added to Published job postings.");

        // ReqId is resolved here and never exposed outside this service
        var reqId = posting.ReqId;
        var jobTitle = posting.JobTitle;
        var departmentName = posting.JobRequisition?.Department?.DeptName ?? string.Empty;

        // ─── Step 2: Upsert Candidate ──────────────────────────────────────────────────
        Candidate? candidate = null;
        bool isNewCandidate = false;

        // Priority 1: Caller provided existing CandidateId
        if (request.ExistingCandidateId.HasValue)
        {
            candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.CandidateId == request.ExistingCandidateId.Value, ct);

            if (candidate == null)
                throw new InvalidOperationException("Specified existing candidate not found.");
        }

        // Priority 2: Match by email
        if (candidate == null && !string.IsNullOrWhiteSpace(request.Email))
        {
            candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Email.ToLower() == request.Email.ToLower().Trim(), ct);
        }

        // Priority 3: Match by phone
        if (candidate == null && !string.IsNullOrWhiteSpace(request.Phone))
        {
            candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Phone == request.Phone.Trim(), ct);
        }

        if (candidate != null)
        {
            // Existing candidate — update professional fields (not identity)
            if (!string.IsNullOrWhiteSpace(request.CurrentCompany))
                candidate.CurrentCompany = request.CurrentCompany;
            if (!string.IsNullOrWhiteSpace(request.CurrentDesignation))
                candidate.CurrentDesignation = request.CurrentDesignation;
            if (request.CurrentCTC.HasValue)
                candidate.CurrentCTC = request.CurrentCTC;
            if (request.ExpectedCTC.HasValue)
                candidate.ExpectedCTC = request.ExpectedCTC;
            if (request.NoticePeriodDays.HasValue)
                candidate.NoticePeriodDays = request.NoticePeriodDays;
            if (request.TotalExperience.HasValue)
                candidate.TotalExperience = request.TotalExperience;
            if (!candidate.Source.HasValue && !string.IsNullOrWhiteSpace(request.Source) && Enum.TryParse<CandidateSource>(request.Source, true, out var src))
                candidate.Source = src;
            if (!string.IsNullOrWhiteSpace(request.ResumeFilePath))
                candidate.ResumeFilePath = request.ResumeFilePath;
            if (request.ReferralEmployeeId.HasValue)
                candidate.ReferralEmployeeId = request.ReferralEmployeeId;
            candidate.UpdatedAt = DateTime.UtcNow;
            isNewCandidate = false;
        }
        else
        {
            // New candidate — validate required identity fields
            if (string.IsNullOrWhiteSpace(request.FirstName))
                throw new InvalidOperationException("First Name is required for new candidates.");
            if (string.IsNullOrWhiteSpace(request.Email))
                throw new InvalidOperationException("Email is required for new candidates.");

            CandidateSource? source = null;
            if (!string.IsNullOrWhiteSpace(request.Source) && Enum.TryParse<CandidateSource>(request.Source, true, out var parsedSrc))
                source = parsedSrc;

            candidate = new Candidate
            {
                CandidateId = Guid.NewGuid(),
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
                Source = source,
                ResumeFilePath = request.ResumeFilePath,
                ReferralEmployeeId = request.ReferralEmployeeId,
                CandidateStatus = CandidateStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            _context.Candidates.Add(candidate);
            isNewCandidate = true;
        }

        // ─── Step 3: Duplicate application & Employee check ────────────────────────────
        var isAlreadyEmployee = await _context.Employees
            .AnyAsync(e => e.CandidateId == candidate.CandidateId, ct);

        if (isAlreadyEmployee)
            throw new InvalidOperationException("Internal Employee Job Application pipeline is not yet implemented. Existing employees cannot apply via the external portal.");

        var duplicateExists = await _context.JobApplications
            .AnyAsync(a => a.CandidateId == candidate.CandidateId && a.ReqId == reqId, ct);

        if (duplicateExists)
            throw new InvalidOperationException("This candidate has already applied to this job opening.");

        // ─── Step 4: Create JobApplication ─────────────────────────────────────────────
        var application = new JobApplication
        {
            AppId = Guid.NewGuid(),
            ReqId = reqId,
            CandidateId = candidate.CandidateId,
            ApplicationDate = DateTime.UtcNow,
            CurrentStage = ApplicationStage.Applied,
            AssignedRecruiterId = request.AddedByUserId,
            TimelineEventsJson = "[]"
        };

        // ─── Step 5: Timeline events ───────────────────────────────────────────────────
        var creationEvent = isNewCandidate ? "Candidate Created" : "Existing Candidate Linked";
        TimelineHelper.AddTimelineEvent(application, creationEvent);
        TimelineHelper.AddTimelineEvent(application, "Applied");

        if (!string.IsNullOrWhiteSpace(request.Source))
            TimelineHelper.AddTimelineEvent(application, $"Source: {request.Source}");

        TimelineHelper.AddTimelineEvent(application, $"Job Linked: {jobTitle}");

        // Resolve referring employee name for timeline
        if (request.ReferralEmployeeId.HasValue)
        {
            var referrer = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == request.ReferralEmployeeId.Value, ct);
            if (referrer != null)
            {
                var referrerName = $"{referrer.FirstName} {referrer.LastName}".Trim();
                TimelineHelper.AddTimelineEvent(application, $"Referred by {referrerName}");
            }
        }

        // Resolve recruiter name for timeline
        string? recruiterName = null;
        if (request.AddedByUserId.HasValue)
        {
            var recruiter = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == request.AddedByUserId.Value, ct);
            if (recruiter != null)
            {
                recruiterName = $"{recruiter.FirstName} {recruiter.LastName}".Trim();
                TimelineHelper.AddTimelineEvent(application, $"Recruiter Assigned: {recruiterName}");
            }
        }

        // ─── Step 6: Update LastApplicationDate ────────────────────────────────────────
        candidate.LastApplicationDate = DateTime.UtcNow;

        // ─── Step 7: Persist ───────────────────────────────────────────────────────────
        _context.JobApplications.Add(application);
        await _context.SaveChangesAsync(ct);

        return new ApplyToJobResult
        {
            CandidateId = candidate.CandidateId,
            AppId = application.AppId,
            JobTitle = jobTitle,
            Stage = "Applied",
            IsNewCandidate = isNewCandidate,
            AssignedRecruiterName = recruiterName
        };
    }
}
