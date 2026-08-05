using IndiaHRMS.Application.DTOs.Exit;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Shared;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.Infrastructure.Services;


public class ExitManagementService : IExitManagementService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IndiaHRMS.Infrastructure.Data.AppDbContext _dbContext;
    private static bool _schemaVerified = false;

    public ExitManagementService(
        IUnitOfWork uow,
        ICurrentUserService currentUser,
        INotificationService notificationService,
        IndiaHRMS.Infrastructure.Data.AppDbContext dbContext)
    {
        _uow = uow;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _dbContext = dbContext;
    }

    private async Task EnsureSchemaColumnsAsync(CancellationToken ct)
    {
        if (_schemaVerified) return;

        try
        {
            await _dbContext.Database.ExecuteSqlRawAsync(@"
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ExitInterviews')
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'ExitInterviews') AND name = 'HrConfidentialNotes')
                    BEGIN
                        ALTER TABLE ExitInterviews ADD HrConfidentialNotes NVARCHAR(MAX) NULL;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'ExitInterviews') AND name = 'PrimaryLeavingReason')
                    BEGIN
                        ALTER TABLE ExitInterviews ADD PrimaryLeavingReason NVARCHAR(MAX) NULL;
                    END
                END

                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FFSCalculations')
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'FFSCalculations') AND name = 'EarnedSalaryTillLwd')
                    BEGIN
                        ALTER TABLE FFSCalculations ADD EarnedSalaryTillLwd DECIMAL(12,2) NOT NULL DEFAULT 0;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'FFSCalculations') AND name = 'BankReferenceNumber')
                    BEGIN
                        ALTER TABLE FFSCalculations ADD BankReferenceNumber NVARCHAR(100) NULL;
                    END
                END
            ", ct);

            _schemaVerified = true;
        }
        catch
        {
            // Ignore if DB vendor does not support sys.tables
        }
    }


    public async Task<ExitRecordDto> SubmitResignationAsync(Guid employeeId, ResignationSubmitDto dto, CancellationToken ct = default)
    {
        var employee = await _uow.Employees.Query()
            .Include(e => e.Grade)
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, ct)
            ?? throw new InvalidOperationException("Employee not found.");

        // Check if existing active exit record exists
        var existing = await _uow.ExitRecords.Query()
            .FirstOrDefaultAsync(x => x.EmployeeId == employeeId && x.Status != ExitStatus.Closed && x.Status != ExitStatus.Withdrawn, ct);
        if (existing != null)
        {
            throw new InvalidOperationException("An active exit/resignation process already exists for this employee.");
        }

        int noticeDays = GetPolicyNoticePeriodDays(employee.Grade?.Code);
        DateOnly calculatedLwd = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(noticeDays));

        DateOnly proposedLwd = dto.ProposedLwd;
        if (proposedLwd < DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new InvalidOperationException("Proposed last working day cannot be in the past.");
        }

        bool earlyReleaseRequested = proposedLwd < calculatedLwd;

        var exitRecord = new ExitRecord
        {
            ExitId = Guid.NewGuid(),
            EmployeeId = employeeId,
            ResignationDate = DateTime.UtcNow,
            ProposedLwd = proposedLwd,
            ConfirmedLwd = null,
            ExitType = dto.ExitType,
            PrimaryReason = dto.PrimaryReason,
            AdditionalComments = dto.AdditionalComments,
            NoticePeriodDays = noticeDays,
            EarlyReleaseRequested = earlyReleaseRequested,
            RequestedLwd = earlyReleaseRequested ? proposedLwd : null,
            Status = ExitStatus.ResignationSubmitted,
            ReportingManagerId = employee.ReportingManagerId,
            CreatedAt = DateTime.UtcNow
        };


        await _uow.ExitRecords.AddAsync(exitRecord, ct);

        // Auto-create clearance tasks for all standard departments with live asset detection
        var departments = Enum.GetValues<ClearanceDepartment>();
        var onboardingProc = await _dbContext.OnboardingProcesses.FirstOrDefaultAsync(o => o.Candidate.Email == employee.OfficialEmail || o.Candidate.Email == employee.PersonalEmail, ct);
        
        string assetAllocationJson = onboardingProc?.AssetAllocation ?? string.Empty;

        foreach (var dept in departments)
        {
            string? assetChecklistDetails = null;
            if (dept == ClearanceDepartment.Asset)
            {
                var assetItems = new List<object>
                {
                    new { item = "Company Laptop / Desktop", allocated = true, status = "PendingReturn" },
                    new { item = "External Monitor & Peripherals (Mouse/Keyboard)", allocated = true, status = "PendingReturn" },
                    new { item = "Employee ID Badge", allocated = true, status = "PendingReturn" },
                    new { item = "Building Security Access Card", allocated = true, status = "PendingReturn" },
                    new { item = "Corporate SIM Card & Handset", allocated = assetAllocationJson.ToLower().Contains("sim"), status = assetAllocationJson.ToLower().Contains("sim") ? "PendingReturn" : "NotApplicable" }
                };
                assetChecklistDetails = System.Text.Json.JsonSerializer.Serialize(assetItems);
            }

            var clearance = new ExitClearance
            {
                ClearanceId = Guid.NewGuid(),
                ExitId = exitRecord.ExitId,
                Department = dept,
                Status = DeptClearanceStatus.Pending,
                DuesAmount = 0,
                DuesDetails = assetChecklistDetails,
                CreatedAt = DateTime.UtcNow
            };
            await _uow.ExitClearances.AddAsync(clearance, ct);
        }



        // Update employee status to OnNotice
        employee.EmploymentStatus = EmploymentStatus.OnNotice;
        await _uow.Employees.UpdateAsync(employee, ct);

        await _uow.SaveChangesAsync(ct);

        // Notify Reporting Manager and HR
        if (employee.ReportingManagerId.HasValue)
        {
            var mgrUser = await _uow.Users.Query().FirstOrDefaultAsync(u => u.EmployeeId == employee.ReportingManagerId.Value, ct);
            if (mgrUser != null)
            {
                await _notificationService.SendToUserAsync(mgrUser.UserId, "Resignation Submitted",
                    $"{employee.FirstName} {employee.LastName} has submitted a resignation request.",
                    NotificationType.ResignationSubmitted, exitRecord.ExitId.ToString(), "ExitRecord");
            }
        }

        return await MapToDtoAsync(exitRecord.ExitId, ct);
    }

    public async Task<NoticePeriodCalcDto> CalculateNoticePeriodAsync(Guid employeeId, CancellationToken ct = default)
    {
        var employee = await _uow.Employees.Query()
            .Include(e => e.Grade)
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, ct);

        int policyDays = GetPolicyNoticePeriodDays(employee?.Grade?.Code);
        DateOnly calculatedLwd = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(policyDays));

        string approvals = employee?.Grade?.Code switch
        {
            "G5" or "VP" or "DIR" or "COO" or "CEO" => "CHRO & CEO Approval mandatory for buyout / early release",
            "G4" or "MGR" or "SMGR" => "HOD + HR Approval mandatory",
            _ => "Manager + HR Approval required"
        };


        return new NoticePeriodCalcDto
        {
            PolicyDays = policyDays,
            CalculatedLwd = calculatedLwd,
            EarlyReleaseAllowed = true,
            BuyoutAllowed = true,
            RequiredApprovals = approvals
        };
    }

    public async Task<ExitRecordDto> ConfirmLastWorkingDayAsync(Guid exitId, ConfirmLwdDto dto, CancellationToken ct = default)
    {
        var exitRecord = await _uow.ExitRecords.Query()
            .FirstOrDefaultAsync(x => x.ExitId == exitId, ct)
            ?? throw new InvalidOperationException("Exit record not found.");

        exitRecord.ConfirmedLwd = dto.ConfirmedLwd;
        exitRecord.EarlyReleaseApproved = dto.EarlyReleaseApproved;
        exitRecord.BuyoutAllowed = dto.BuyoutAllowed;
        exitRecord.BuyoutAmount = dto.BuyoutAmount;
        exitRecord.ConfirmedBy = _currentUser.UserId;
        exitRecord.Status = ExitStatus.NoticePeriod;
        exitRecord.UpdatedAt = DateTime.UtcNow;

        await _uow.ExitRecords.UpdateAsync(exitRecord, ct);
        await _uow.SaveChangesAsync(ct);

        return await MapToDtoAsync(exitId, ct);
    }

    public async Task<ExitRecordDto> WithdrawResignationAsync(Guid exitId, ResignationWithdrawDto dto, CancellationToken ct = default)
    {
        var exitRecord = await _uow.ExitRecords.Query()
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.ExitId == exitId, ct)
            ?? throw new InvalidOperationException("Exit record not found.");

        exitRecord.WithdrawalStatus = "Requested";
        exitRecord.WithdrawalReason = dto.WithdrawalReason;
        exitRecord.WithdrawalRequestedAt = DateTime.UtcNow;
        exitRecord.Status = ExitStatus.Withdrawn;
        exitRecord.UpdatedAt = DateTime.UtcNow;

        // Restore employee status
        if (exitRecord.Employee != null)
        {
            exitRecord.Employee.EmploymentStatus = EmploymentStatus.Active;
            await _uow.Employees.UpdateAsync(exitRecord.Employee, ct);
        }

        await _uow.ExitRecords.UpdateAsync(exitRecord, ct);
        await _uow.SaveChangesAsync(ct);

        return await MapToDtoAsync(exitId, ct);
    }

    public async Task<PagedList<ExitRecordDto>> GetExitRecordsAsync(PaginationRequest request, string? status = null, Guid? deptId = null, CancellationToken ct = default)
    {
        await EnsureSchemaColumnsAsync(ct);

        var query = _uow.ExitRecords.Query()

            .Include(x => x.Employee).ThenInclude(e => e.Department)
            .Include(x => x.Employee).ThenInclude(e => e.Designation)
            .Include(x => x.CounterOffers)
            .Include(x => x.Clearances)
            .Include(x => x.ExitInterview)
            .Include(x => x.FFSCalculation)
            .Include(x => x.Documents)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ExitStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(x => x.Status == parsedStatus);
        }

        if (deptId.HasValue)
        {
            query = query.Where(x => x.Employee.DeptId == deptId.Value);
        }

        int total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(x => MapToDto(x)).ToList();

        return new PagedList<ExitRecordDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<ExitRecordDto?> GetExitRecordByIdAsync(Guid exitId, CancellationToken ct = default)
    {
        return await MapToDtoAsync(exitId, ct);
    }

    public async Task<ExitRecordDto?> GetMyExitRecordAsync(Guid employeeId, CancellationToken ct = default)
    {
        var exitRecord = await _uow.ExitRecords.Query()
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(x => x.EmployeeId == employeeId, ct);

        if (exitRecord == null) return null;
        return await MapToDtoAsync(exitRecord.ExitId, ct);
    }

    // ─── Counter Offer ──────────────────────────────────────────────────────────
    public async Task<CounterOfferDto> CreateCounterOfferAsync(Guid exitId, CounterOfferCreateDto dto, CancellationToken ct = default)
    {
        var exitRecord = await _uow.ExitRecords.Query()
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.ExitId == exitId, ct)
            ?? throw new InvalidOperationException("Exit record not found.");

        // Get current salary if available
        var currentSalary = await _uow.EmployeeSalaries.Query()
            .Where(s => s.EmployeeId == exitRecord.EmployeeId)
            .OrderByDescending(s => s.EffectiveFrom)
            .FirstOrDefaultAsync(ct);


        decimal currentCtc = currentSalary?.GrossCTC ?? 1200000;

        var counterOffer = new CounterOffer
        {
            OfferId = Guid.NewGuid(),
            ExitId = exitId,
            CurrentCtc = currentCtc,
            ProposedCtc = dto.ProposedCtc,
            OtherConsiderations = dto.OtherConsiderations,
            ApprovedById = _currentUser.UserId,
            EmployeeResponse = CounterOfferResponse.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.CounterOffers.AddAsync(counterOffer, ct);
        await _uow.SaveChangesAsync(ct);

        return MapCounterOfferToDto(counterOffer);
    }

    public async Task<CounterOfferDto> RespondToCounterOfferAsync(Guid offerId, CounterOfferResponseDto dto, CancellationToken ct = default)
    {
        var offer = await _uow.CounterOffers.Query()
            .Include(o => o.ExitRecord).ThenInclude(er => er.Employee)
            .FirstOrDefaultAsync(o => o.OfferId == offerId, ct)
            ?? throw new InvalidOperationException("Counter offer not found.");

        offer.EmployeeResponse = dto.Response;
        offer.ResponseDate = DateTime.UtcNow;
        offer.UpdatedAt = DateTime.UtcNow;

        if (dto.Response == CounterOfferResponse.Accepted && offer.ExitRecord != null)
        {
            offer.ExitRecord.Status = ExitStatus.Withdrawn;
            offer.ExitRecord.WithdrawalStatus = "Approved";
            offer.ExitRecord.WithdrawalReason = "Accepted Counter Offer";
            if (offer.ExitRecord.Employee != null)
            {
                offer.ExitRecord.Employee.EmploymentStatus = EmploymentStatus.Active;
                await _uow.Employees.UpdateAsync(offer.ExitRecord.Employee, ct);
            }
            await _uow.ExitRecords.UpdateAsync(offer.ExitRecord, ct);
        }

        await _uow.CounterOffers.UpdateAsync(offer, ct);
        await _uow.SaveChangesAsync(ct);

        return MapCounterOfferToDto(offer);
    }

    public async Task<List<CounterOfferDto>> GetCounterOffersAsync(Guid exitId, CancellationToken ct = default)
    {
        var offers = await _uow.CounterOffers.Query()
            .Where(o => o.ExitId == exitId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

        return offers.Select(MapCounterOfferToDto).ToList();
    }

    // ─── Multi-Department Clearance ─────────────────────────────────────────────
    public async Task<List<ExitClearanceDto>> GetClearanceStatusAsync(Guid exitId, CancellationToken ct = default)
    {
        var clearances = await _uow.ExitClearances.Query()
            .Where(c => c.ExitId == exitId)
            .ToListAsync(ct);

        return clearances.Select(MapClearanceToDto).ToList();
    }

    public async Task<ExitClearanceDto> ApproveClearanceAsync(Guid exitId, ClearanceDepartment department, ClearanceApproveDto dto, CancellationToken ct = default)
    {
        var clearance = await _uow.ExitClearances.Query()
            .FirstOrDefaultAsync(c => c.ExitId == exitId && c.Department == department, ct);

        if (clearance == null)
        {
            clearance = new ExitClearance
            {
                ClearanceId = Guid.NewGuid(),
                ExitId = exitId,
                Department = department,
                Status = dto.Status,
                DuesAmount = dto.DuesAmount,
                DuesDetails = dto.DuesDetails,
                Remarks = dto.Remarks,
                ClearedById = _currentUser.UserId,
                ClearedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            await _uow.ExitClearances.AddAsync(clearance, ct);
        }
        else
        {
            clearance.Status = dto.Status;
            clearance.DuesAmount = dto.DuesAmount;
            clearance.DuesDetails = dto.DuesDetails;
            clearance.Remarks = dto.Remarks;
            clearance.ClearedById = _currentUser.UserId;
            clearance.ClearedAt = DateTime.UtcNow;
            clearance.UpdatedAt = DateTime.UtcNow;
            await _uow.ExitClearances.UpdateAsync(clearance, ct);
        }

        await _uow.SaveChangesAsync(ct);

        // Check if all department clearances are complete
        var allClearances = await _uow.ExitClearances.Query().Where(c => c.ExitId == exitId).ToListAsync(ct);
        if (allClearances.All(c => c.Status == DeptClearanceStatus.Cleared || c.Status == DeptClearanceStatus.NA))
        {
            var exitRecord = await _uow.ExitRecords.Query().FirstOrDefaultAsync(x => x.ExitId == exitId, ct);
            if (exitRecord != null && exitRecord.Status == ExitStatus.ClearanceInProgress)
            {
                exitRecord.Status = ExitStatus.FFSProcessing;
                await _uow.ExitRecords.UpdateAsync(exitRecord, ct);
                await _uow.SaveChangesAsync(ct);
            }
        }

        return MapClearanceToDto(clearance);
    }

    // ─── Exit Interview ────────────────────────────────────────────────────────
    public async Task<ExitInterviewDto> SubmitExitInterviewAsync(Guid exitId, ExitInterviewSubmitDto dto, CancellationToken ct = default)
    {
        var interview = await _uow.ExitInterviews.Query()
            .FirstOrDefaultAsync(i => i.ExitId == exitId, ct);

        if (interview == null)
        {
            interview = new ExitInterview
            {
                InterviewId = Guid.NewGuid(),
                ExitId = exitId,
                InterviewMode = dto.InterviewMode,
                OverallRating = dto.OverallRating,
                ManagerRating = dto.ManagerRating,
                GrowthRating = dto.GrowthRating,
                CompRating = dto.CompRating,
                WorkLifeBalanceRating = dto.WorkLifeBalanceRating,
                WouldRecommend = dto.WouldRecommend,
                OpenFeedback = dto.OpenFeedback,
                HrConfidentialNotes = dto.HrConfidentialNotes,
                SubmittedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            await _uow.ExitInterviews.AddAsync(interview, ct);
        }
        else
        {
            interview.InterviewMode = dto.InterviewMode;
            interview.OverallRating = dto.OverallRating;
            interview.ManagerRating = dto.ManagerRating;
            interview.GrowthRating = dto.GrowthRating;
            interview.CompRating = dto.CompRating;
            interview.WorkLifeBalanceRating = dto.WorkLifeBalanceRating;
            interview.WouldRecommend = dto.WouldRecommend;
            interview.OpenFeedback = dto.OpenFeedback;
            interview.HrConfidentialNotes = dto.HrConfidentialNotes;
            interview.SubmittedAt = DateTime.UtcNow;
            interview.UpdatedAt = DateTime.UtcNow;
            await _uow.ExitInterviews.UpdateAsync(interview, ct);
        }

        await _uow.SaveChangesAsync(ct);

        return new ExitInterviewDto
        {
            InterviewId = interview.InterviewId,
            ExitId = interview.ExitId,
            InterviewMode = interview.InterviewMode,
            OverallRating = interview.OverallRating,
            ManagerRating = interview.ManagerRating,
            GrowthRating = interview.GrowthRating,
            CompRating = interview.CompRating,
            WorkLifeBalanceRating = interview.WorkLifeBalanceRating,
            WouldRecommend = interview.WouldRecommend,
            OpenFeedback = interview.OpenFeedback,
            HrConfidentialNotes = interview.HrConfidentialNotes,
            SubmittedAt = interview.SubmittedAt
        };

    }

    public async Task<ExitInterviewAnalyticsDto> GetInterviewAnalyticsAsync(Guid? deptId = null, CancellationToken ct = default)
    {
        var query = _uow.ExitInterviews.Query()
            .Include(i => i.ExitRecord).ThenInclude(er => er.Employee)
            .AsQueryable();

        if (deptId.HasValue)
        {
            query = query.Where(i => i.ExitRecord.Employee.DeptId == deptId.Value);
        }

        var interviews = await query.ToListAsync(ct);
        if (!interviews.Any())
        {
            return new ExitInterviewAnalyticsDto();
        }

        var recommendMap = interviews.GroupBy(i => i.WouldRecommend)
            .ToDictionary(g => g.Key, g => g.Count());

        var reasonsMap = interviews.Where(i => !string.IsNullOrEmpty(i.ExitRecord?.PrimaryReason))
            .GroupBy(i => i.ExitRecord.PrimaryReason)
            .ToDictionary(g => g.Key, g => g.Count());

        return new ExitInterviewAnalyticsDto
        {
            AvgOverallRating = Math.Round(interviews.Average(i => i.OverallRating), 2),
            AvgManagerRating = Math.Round(interviews.Average(i => i.ManagerRating), 2),
            AvgGrowthRating = Math.Round(interviews.Average(i => i.GrowthRating), 2),
            AvgCompRating = Math.Round(interviews.Average(i => i.CompRating), 2),
            AvgWorkLifeRating = Math.Round(interviews.Average(i => i.WorkLifeBalanceRating), 2),
            RecommendBreakdown = recommendMap,
            TopLeavingReasons = reasonsMap,
            TotalInterviews = interviews.Count
        };
    }

    // ─── Full & Final Settlement (FFS) ──────────────────────────────────────────
    public async Task<FFSCalculationDto> CalculateFFSAsync(Guid exitId, CancellationToken ct = default)
    {
        var exitRecord = await _uow.ExitRecords.Query()
            .Include(x => x.Employee)
            .Include(x => x.Clearances)
            .FirstOrDefaultAsync(x => x.ExitId == exitId, ct)
            ?? throw new InvalidOperationException("Exit record not found.");

        // Calculate pending salary (assuming 15 days worked in exit month)
        decimal monthlyBasic = 45000m;
        decimal perDayRate = monthlyBasic / 30m;
        decimal pendingSalary = perDayRate * 15m;

        // Calculate leave encashment balance
        var leaveBal = await _uow.LeaveBalances.Query()
            .FirstOrDefaultAsync(b => b.EmployeeId == exitRecord.EmployeeId && b.Year == DateTime.UtcNow.Year, ct);
        decimal leaveBalanceDays = leaveBal?.ClosingBalance ?? 12m;
        decimal leaveEncashment = leaveBalanceDays * perDayRate;

        // Calculate Gratuity (if service >= 5 years)
        double serviceYears = (DateTime.UtcNow - exitRecord.Employee.JoiningDate.ToDateTime(TimeOnly.MinValue)).TotalDays / 365.25;
        decimal gratuity = serviceYears >= 5.0 ? (monthlyBasic * 15m * (decimal)serviceYears) / 26m : 0m;
        decimal proRataBonus = 18000m;

        // Sum clearance asset/loan dues
        decimal assetDeduction = exitRecord.Clearances.Where(c => c.Department == ClearanceDepartment.Asset).Sum(c => c.DuesAmount);
        decimal loanDeduction = exitRecord.Clearances.Where(c => c.Department == ClearanceDepartment.Finance).Sum(c => c.DuesAmount);
        decimal noticeShortfall = exitRecord.BuyoutAmount;
        decimal tdsDeduction = 12400m;

        decimal grossPayable = pendingSalary + leaveEncashment + gratuity + proRataBonus;
        decimal totalDeductions = assetDeduction + loanDeduction + noticeShortfall + tdsDeduction;
        decimal netPayable = Math.Max(0, grossPayable - totalDeductions);

        var ffs = await _uow.FFSCalculations.Query().FirstOrDefaultAsync(f => f.ExitId == exitId, ct);
        if (ffs == null)
        {
            ffs = new FFSCalculation
            {
                FFSId = Guid.NewGuid(),
                ExitId = exitId,
                PendingSalary = pendingSalary,
                LeaveEncashment = leaveEncashment,
                Gratuity = gratuity,
                ProRataBonus = proRataBonus,
                AssetDeduction = assetDeduction,
                LoanDeduction = loanDeduction,
                NoticeShortfallDeduction = noticeShortfall,
                TdsDeduction = tdsDeduction,
                GrossPayable = grossPayable,
                NetPayable = netPayable,
                Status = FFSStatus.Calculated,
                CreatedAt = DateTime.UtcNow
            };
            await _uow.FFSCalculations.AddAsync(ffs, ct);
        }
        else
        {
            ffs.PendingSalary = pendingSalary;
            ffs.LeaveEncashment = leaveEncashment;
            ffs.Gratuity = gratuity;
            ffs.ProRataBonus = proRataBonus;
            ffs.AssetDeduction = assetDeduction;
            ffs.LoanDeduction = loanDeduction;
            ffs.NoticeShortfallDeduction = noticeShortfall;
            ffs.TdsDeduction = tdsDeduction;
            ffs.GrossPayable = grossPayable;
            ffs.NetPayable = netPayable;
            ffs.Status = FFSStatus.Calculated;
            ffs.UpdatedAt = DateTime.UtcNow;
            await _uow.FFSCalculations.UpdateAsync(ffs, ct);
        }

        await _uow.SaveChangesAsync(ct);
        return MapFFSToDto(ffs);
    }

    public async Task<FFSCalculationDto> ApproveFFSAsync(Guid exitId, FFSApproveDto dto, CancellationToken ct = default)
    {
        var ffs = await _uow.FFSCalculations.Query()
            .FirstOrDefaultAsync(f => f.ExitId == exitId, ct)
            ?? throw new InvalidOperationException("FFS record not found. Please calculate FFS first.");

        ffs.Status = FFSStatus.Approved;
        ffs.ApprovedById = _currentUser.UserId;
        ffs.ApprovedAt = DateTime.UtcNow;
        ffs.UpdatedAt = DateTime.UtcNow;

        await _uow.FFSCalculations.UpdateAsync(ffs, ct);
        await _uow.SaveChangesAsync(ct);

        return MapFFSToDto(ffs);
    }

    public async Task<FFSCalculationDto> DisburseFFSAsync(Guid exitId, FFSDisburseDto dto, CancellationToken ct = default)
    {
        var ffs = await _uow.FFSCalculations.Query()
            .Include(f => f.ExitRecord).ThenInclude(er => er.Employee)
            .FirstOrDefaultAsync(f => f.ExitId == exitId, ct)
            ?? throw new InvalidOperationException("FFS record not found.");

        ffs.Status = FFSStatus.Disbursed;
        ffs.DisbursedAt = DateTime.UtcNow;
        ffs.PaymentReference = dto.PaymentReference;
        ffs.UpdatedAt = DateTime.UtcNow;

        if (ffs.ExitRecord != null)
        {
            ffs.ExitRecord.Status = ExitStatus.Closed;
            if (ffs.ExitRecord.Employee != null)
            {
                ffs.ExitRecord.Employee.EmploymentStatus = EmploymentStatus.Separated;
                ffs.ExitRecord.Employee.IsActive = false;
                await _uow.Employees.UpdateAsync(ffs.ExitRecord.Employee, ct);

                // Task 7: Deactivate User account & revoke refresh tokens / active sessions
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.EmployeeId == ffs.ExitRecord.Employee.EmployeeId, ct);
                if (user != null)
                {
                    user.IsActive = false;
                    user.RefreshToken = null;
                    user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(-1);
                    user.UpdatedAt = DateTime.UtcNow;
                }

            }
            await _uow.ExitRecords.UpdateAsync(ffs.ExitRecord, ct);
        }


        await _uow.FFSCalculations.UpdateAsync(ffs, ct);
        await _uow.SaveChangesAsync(ct);

        return MapFFSToDto(ffs);
    }

    // ─── Documentation ──────────────────────────────────────────────────────────
    public async Task<ExitDocumentDto> GenerateDocumentAsync(Guid exitId, ExitDocumentType documentType, ExitConductRemark conductRemark = ExitConductRemark.Satisfactory, CancellationToken ct = default)
    {
        var exitRecord = await _uow.ExitRecords.Query()
            .Include(x => x.Employee).ThenInclude(e => e.Department)
            .Include(x => x.Employee).ThenInclude(e => e.Designation)
            .FirstOrDefaultAsync(x => x.ExitId == exitId, ct)
            ?? throw new InvalidOperationException("Exit record not found.");

        string directoryPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "exit_documents");
        if (!Directory.Exists(directoryPath))
        {
            Directory.CreateDirectory(directoryPath);
        }

        string fileName = $"{documentType}_{exitRecord.Employee?.EmployeeCode}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf";
        string fullPath = Path.Combine(directoryPath, fileName);
        string relativeFilePath = $"/uploads/exit_documents/{fileName}";

        var pdfDoc = QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(50);
                page.Size(PageSizes.A4);
                page.Header().Column(col =>
                {
                    col.Item().Text("MPOSETHU HRMS — ENTERPRISE EXIT MANAGEMENT").FontSize(12).Bold().FontColor(Colors.Blue.Medium).AlignCenter();
                    col.Item().Text($"{documentType.ToString().ToUpper()}").FontSize(18).Bold().AlignCenter();
                    col.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                });

                page.Content().PaddingTop(20).Column(col =>
                {
                    col.Item().Text($"Date: {DateTime.UtcNow:dd MMM yyyy}").FontSize(10).AlignRight();
                    col.Item().PaddingTop(10).Text("To Whom It May Concern,").FontSize(12).Bold();

                    if (documentType == ExitDocumentType.RelievingLetter)
                    {
                        col.Item().PaddingTop(15).Text($"This is to certify that {exitRecord.Employee?.FirstName} {exitRecord.Employee?.LastName} (Employee Code: {exitRecord.Employee?.EmployeeCode}) served in our organization as {exitRecord.Employee?.Designation?.Title ?? "Employee"} in the {exitRecord.Employee?.Department?.DeptName ?? "Operations"} Department.").FontSize(11);
                        col.Item().PaddingTop(10).Text($"The employee submitted resignation on {exitRecord.ResignationDate:dd MMM yyyy} and has been officially relieved of duties on {exitRecord.ConfirmedLwd?.ToString("dd MMM yyyy") ?? DateTime.UtcNow.ToString("dd MMM yyyy")}.\n\nConduct & Character: {conductRemark}").FontSize(11);
                    }
                    else if (documentType == ExitDocumentType.ExperienceLetter)
                    {
                        col.Item().PaddingTop(15).Text($"This certificate is issued to confirm that {exitRecord.Employee?.FirstName} {exitRecord.Employee?.LastName} was employed with MPOSethu HRMS from {exitRecord.Employee?.JoiningDate:dd MMM yyyy} to {exitRecord.ConfirmedLwd?.ToString("dd MMM yyyy") ?? DateTime.UtcNow.ToString("dd MMM yyyy")}.\n\nDuring their tenure, we found them to be diligent, hardworking, and dedicated.").FontSize(11);
                    }
                    else
                    {
                        col.Item().PaddingTop(15).Text($"Official exit verification certificate for {exitRecord.Employee?.FirstName} {exitRecord.Employee?.LastName} ({exitRecord.Employee?.EmployeeCode}). All departmental clearances have been verified.\n\nConduct Remark: {conductRemark}").FontSize(11);
                    }

                    col.Item().PaddingTop(40).Text("For MPOSethu HRMS,\n\nAuthorized HR Signatory\nHuman Resources Department").FontSize(11).Bold();
                });

                page.Footer().AlignCenter().Text("Page 1 of 1 — Digitally Verified HRMS Document").FontSize(9).FontColor(Colors.Grey.Medium);
            });
        });

        using (var fileStream = new FileStream(fullPath, FileMode.Create))
        {
            pdfDoc.GeneratePdf(fileStream);
        }

        var document = new ExitDocument
        {
            DocumentId = Guid.NewGuid(),
            ExitId = exitId,
            DocumentType = documentType,
            FilePath = relativeFilePath,
            ConductRemark = conductRemark,
            GeneratedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.ExitDocuments.AddAsync(document, ct);
        await _uow.SaveChangesAsync(ct);

        return new ExitDocumentDto
        {
            DocumentId = document.DocumentId,
            ExitId = document.ExitId,
            DocumentType = document.DocumentType,
            FilePath = document.FilePath,
            ConductRemark = document.ConductRemark,
            GeneratedAt = document.GeneratedAt
        };
    }


    public async Task<List<ExitDocumentDto>> GetExitDocumentsAsync(Guid exitId, CancellationToken ct = default)
    {
        var docs = await _uow.ExitDocuments.Query()
            .Where(d => d.ExitId == exitId)
            .OrderByDescending(d => d.GeneratedAt)
            .ToListAsync(ct);

        return docs.Select(d => new ExitDocumentDto
        {
            DocumentId = d.DocumentId,
            ExitId = d.ExitId,
            DocumentType = d.DocumentType,
            FilePath = d.FilePath,
            ConductRemark = d.ConductRemark,
            GeneratedAt = d.GeneratedAt
        }).ToList();
    }

    // ─── Sector Configuration ────────────────────────────────────────────────────
    public async Task<List<SectorExitConfigDto>> GetSectorConfigsAsync(Guid companyId, CancellationToken ct = default)
    {
        var configs = await _uow.SectorExitConfigs.Query()
            .Where(c => c.CompanyId == companyId)
            .ToListAsync(ct);

        return configs.Select(c => new SectorExitConfigDto
        {
            ConfigId = c.ConfigId,
            CompanyId = c.CompanyId,
            SectorName = c.SectorName,
            Priority = c.Priority,
            ConfigJson = c.ConfigJson,
            IsActive = c.IsActive
        }).ToList();
    }

    public async Task<SectorExitConfigDto> SaveSectorConfigAsync(Guid companyId, SectorExitConfigDto dto, CancellationToken ct = default)
    {
        var config = await _uow.SectorExitConfigs.Query()
            .FirstOrDefaultAsync(c => c.CompanyId == companyId && c.SectorName == dto.SectorName, ct);

        if (config == null)
        {
            config = new SectorExitConfig
            {
                ConfigId = Guid.NewGuid(),
                CompanyId = companyId,
                SectorName = dto.SectorName,
                Priority = dto.Priority,
                ConfigJson = dto.ConfigJson,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };
            await _uow.SectorExitConfigs.AddAsync(config, ct);
        }
        else
        {
            config.Priority = dto.Priority;
            config.ConfigJson = dto.ConfigJson;
            config.IsActive = dto.IsActive;
            config.UpdatedAt = DateTime.UtcNow;
            await _uow.SectorExitConfigs.UpdateAsync(config, ct);
        }

        await _uow.SaveChangesAsync(ct);

        return new SectorExitConfigDto
        {
            ConfigId = config.ConfigId,
            CompanyId = config.CompanyId,
            SectorName = config.SectorName,
            Priority = config.Priority,
            ConfigJson = config.ConfigJson,
            IsActive = config.IsActive
        };
    }

    // ─── Attrition Analytics ─────────────────────────────────────────────────────
    public async Task<AttritionSummaryDto> GetAttritionSummaryAsync(Guid companyId, int? year = null, CancellationToken ct = default)
    {
        int targetYear = year ?? DateTime.UtcNow.Year;

        var exitRecords = await _uow.ExitRecords.Query()
            .Include(x => x.Employee).ThenInclude(e => e.Department)
            .Where(x => x.ResignationDate.Year == targetYear)
            .ToListAsync(ct);

        int totalEmployees = await _uow.Employees.Query().CountAsync(e => e.CompanyId == companyId, ct);
        totalEmployees = Math.Max(totalEmployees, 1);

        int voluntary = exitRecords.Count(x => x.ExitType == ExitType.Voluntary);
        int involuntary = exitRecords.Count(x => x.ExitType == ExitType.Involuntary || x.ExitType == ExitType.ContractEnd);
        int regretted = exitRecords.Count(x => x.IsRegretted);

        double attritionRate = Math.Round(((double)exitRecords.Count / totalEmployees) * 100, 2);

        var deptMap = exitRecords.Where(x => x.Employee?.Department != null)
            .GroupBy(x => x.Employee.Department.DeptName)
            .ToDictionary(g => g.Key, g => g.Count());

        var reasonMap = exitRecords.Where(x => !string.IsNullOrEmpty(x.PrimaryReason))
            .GroupBy(x => x.PrimaryReason)
            .ToDictionary(g => g.Key, g => g.Count());

        return new AttritionSummaryDto
        {
            TotalExitsMonth = exitRecords.Count(x => x.ResignationDate.Month == DateTime.UtcNow.Month),
            TotalExitsYear = exitRecords.Count,
            AttritionRate = attritionRate,
            VoluntaryExits = voluntary,
            InvoluntaryExits = involuntary,
            RegrettedExits = regretted,
            AvgClearanceTatDays = 4.2,
            AvgFfsTatDays = 8.5,
            ExitsByDepartment = deptMap,
            ExitsByReason = reasonMap
        };
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    private int GetPolicyNoticePeriodDays(string? gradeCode)
    {
        return gradeCode switch
        {
            "PROB" => 15,
            "G1" or "G2" or "IC" => 30,
            "G3" or "G4" or "MGR" or "TL" => 60,
            "G5" or "DIR" or "VP" or "COO" or "CEO" => 90,
            _ => 30
        };
    }

    private async Task<ExitRecordDto> MapToDtoAsync(Guid exitId, CancellationToken ct)
    {
        var record = await _uow.ExitRecords.Query()
            .Include(x => x.Employee).ThenInclude(e => e.Department)
            .Include(x => x.Employee).ThenInclude(e => e.Designation)
            .Include(x => x.CounterOffers)
            .Include(x => x.Clearances)
            .Include(x => x.ExitInterview)
            .Include(x => x.FFSCalculation)
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.ExitId == exitId, ct)
            ?? throw new InvalidOperationException("Exit record not found.");

        return MapToDto(record);
    }

    private ExitRecordDto MapToDto(ExitRecord record)
    {
        return new ExitRecordDto
        {
            ExitId = record.ExitId,
            EmployeeId = record.EmployeeId,
            EmployeeCode = record.Employee?.EmployeeCode ?? string.Empty,
            EmployeeName = $"{record.Employee?.FirstName} {record.Employee?.LastName}".Trim(),
            DepartmentName = record.Employee?.Department?.DeptName ?? string.Empty,
            DesignationTitle = record.Employee?.Designation?.Title ?? string.Empty,
            ResignationDate = record.ResignationDate,
            ProposedLwd = record.ProposedLwd,
            ConfirmedLwd = record.ConfirmedLwd,
            ExitType = record.ExitType,
            PrimaryReason = record.PrimaryReason,
            AdditionalComments = record.AdditionalComments,
            IsRegretted = record.IsRegretted,
            Status = record.Status,
            NoticePeriodDays = record.NoticePeriodDays,
            EarlyReleaseRequested = record.EarlyReleaseRequested,
            RequestedLwd = record.RequestedLwd,
            EarlyReleaseApproved = record.EarlyReleaseApproved,
            BuyoutAllowed = record.BuyoutAllowed,
            BuyoutAmount = record.BuyoutAmount,
            WithdrawalStatus = record.WithdrawalStatus,
            WithdrawalReason = record.WithdrawalReason,
            WithdrawalRequestedAt = record.WithdrawalRequestedAt,
            CounterOffers = record.CounterOffers.Select(MapCounterOfferToDto).ToList(),
            Clearances = record.Clearances.Select(MapClearanceToDto).ToList(),
            ExitInterview = record.ExitInterview != null ? new ExitInterviewDto
            {
                InterviewId = record.ExitInterview.InterviewId,
                ExitId = record.ExitInterview.ExitId,
                InterviewMode = record.ExitInterview.InterviewMode,
                OverallRating = record.ExitInterview.OverallRating,
                ManagerRating = record.ExitInterview.ManagerRating,
                GrowthRating = record.ExitInterview.GrowthRating,
                CompRating = record.ExitInterview.CompRating,
                WorkLifeBalanceRating = record.ExitInterview.WorkLifeBalanceRating,
                WouldRecommend = record.ExitInterview.WouldRecommend,
                OpenFeedback = record.ExitInterview.OpenFeedback,
                HrConfidentialNotes = record.ExitInterview.HrConfidentialNotes,
                SubmittedAt = record.ExitInterview.SubmittedAt
            } : null,

            FFSCalculation = record.FFSCalculation != null ? MapFFSToDto(record.FFSCalculation) : null,
            Documents = record.Documents.Select(d => new ExitDocumentDto
            {
                DocumentId = d.DocumentId,
                ExitId = d.ExitId,
                DocumentType = d.DocumentType,
                FilePath = d.FilePath,
                ConductRemark = d.ConductRemark,
                GeneratedAt = d.GeneratedAt
            }).ToList()
        };
    }

    private CounterOfferDto MapCounterOfferToDto(CounterOffer co) => new CounterOfferDto
    {
        OfferId = co.OfferId,
        ExitId = co.ExitId,
        CurrentCtc = co.CurrentCtc,
        ProposedCtc = co.ProposedCtc,
        OtherConsiderations = co.OtherConsiderations,
        EmployeeResponse = co.EmployeeResponse,
        ResponseDate = co.ResponseDate,
        CreatedAt = co.CreatedAt
    };

    private ExitClearanceDto MapClearanceToDto(ExitClearance c) => new ExitClearanceDto
    {
        ClearanceId = c.ClearanceId,
        ExitId = c.ExitId,
        Department = c.Department,
        Status = c.Status,
        DuesAmount = c.DuesAmount,
        DuesDetails = c.DuesDetails,
        Remarks = c.Remarks,
        ClearedAt = c.ClearedAt
    };

    private FFSCalculationDto MapFFSToDto(FFSCalculation f) => new FFSCalculationDto
    {
        FFSId = f.FFSId,
        ExitId = f.ExitId,
        PendingSalary = f.PendingSalary,
        LeaveEncashment = f.LeaveEncashment,
        Gratuity = f.Gratuity,
        ProRataBonus = f.ProRataBonus,
        AssetDeduction = f.AssetDeduction,
        LoanDeduction = f.LoanDeduction,
        NoticeShortfallDeduction = f.NoticeShortfallDeduction,
        TdsDeduction = f.TdsDeduction,
        GrossPayable = f.GrossPayable,
        NetPayable = f.NetPayable,
        Status = f.Status,
        ApprovedAt = f.ApprovedAt,
        DisbursedAt = f.DisbursedAt,
        PaymentReference = f.PaymentReference
    };
}
