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
[Route("api/v{version:apiVersion}/job-requisitions")]
[ApiVersion("1.0")]
[Authorize]
public class JobRequisitionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;

    public JobRequisitionsController(
        AppDbContext context,
        IMapper mapper,
        ICurrentUserService currentUser,
        INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
        _notificationService = notificationService;
    }

    private async Task PopulateDtoNamesAsync(List<JobRequisitionDto> dtos, CancellationToken ct)
    {
        if (dtos == null || dtos.Count == 0) return;

        // Collect all IDs
        var empIds = dtos.SelectMany(d => new[] { d.HiringManagerId, d.ReplacingEmployeeId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var deptIds = dtos.Where(d => d.DeptId.HasValue).Select(d => d.DeptId!.Value)
            .Concat(dtos.Where(d => d.SubDeptId.HasValue).Select(d => d.SubDeptId!.Value))
            .Distinct().ToList();
        var desigIds = dtos.Where(d => d.DesignationId.HasValue).Select(d => d.DesignationId!.Value).Distinct().ToList();
        var gradeIds = dtos.Where(d => d.GradeId.HasValue).Select(d => d.GradeId!.Value).Distinct().ToList();
        var userIds = dtos.Where(d => d.ApprovedBy.HasValue).Select(d => d.ApprovedBy!.Value)
            .Concat(dtos.Select(d => d.RaisedBy))
            .Concat(dtos.Where(d => d.CurrentApproverId.HasValue).Select(d => d.CurrentApproverId!.Value))
            .Distinct().ToList();

        // Query databases
        var employees = await _context.Employees.Where(e => empIds.Contains(e.EmployeeId))
            .ToDictionaryAsync(e => e.EmployeeId, e => e.FirstName + " " + e.LastName, ct);
        
        var depts = await _context.Departments.Where(d => deptIds.Contains(d.DeptId))
            .ToDictionaryAsync(d => d.DeptId, d => d.DeptName, ct);

        var designations = await _context.Designations.Where(d => desigIds.Contains(d.DesignationId))
            .ToDictionaryAsync(d => d.DesignationId, d => d.Title, ct);

        var grades = await _context.GradeMasters.Where(g => gradeIds.Contains(g.GradeId))
            .ToDictionaryAsync(g => g.GradeId, g => g.Name, ct);

        var users = await _context.Users.Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.FirstName + " " + u.LastName, ct);
        
        var usernames = await _context.Users.Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.Username, ct);

        // Populate fields
        foreach (var dto in dtos)
        {
            if (dto.DeptId.HasValue && depts.TryGetValue(dto.DeptId.Value, out var dName))
                dto.DepartmentName = dName;

            if (dto.SubDeptId.HasValue && depts.TryGetValue(dto.SubDeptId.Value, out var sdName))
                dto.SubDepartmentName = sdName;

            if (dto.DesignationId.HasValue && designations.TryGetValue(dto.DesignationId.Value, out var dgName))
            {
                dto.DesignationTitle = dgName;
                dto.DesignationName = dgName;
            }

            if (dto.GradeId.HasValue && grades.TryGetValue(dto.GradeId.Value, out var gName))
                dto.GradeName = gName;

            if (dto.HiringManagerId.HasValue && employees.TryGetValue(dto.HiringManagerId.Value, out var hmName))
                dto.HiringManagerName = hmName;

            if (dto.ReplacingEmployeeId.HasValue && employees.TryGetValue(dto.ReplacingEmployeeId.Value, out var reName))
                dto.ReplacingEmployeeName = reName;

            if (users.TryGetValue(dto.RaisedBy, out var rbName))
                dto.RaisedByName = rbName;
            
            if (usernames.TryGetValue(dto.RaisedBy, out var rbUName))
                dto.RaisedByUserName = rbUName;

            if (dto.ApprovedBy.HasValue)
            {
                if (users.TryGetValue(dto.ApprovedBy.Value, out var abName))
                    dto.ApprovedByUserName = abName;
            }

            if (dto.CurrentApproverId.HasValue && users.TryGetValue(dto.CurrentApproverId.Value, out var caName))
                dto.CurrentApproverName = caName;
        }
    }

    private async Task LogAuditTrailAsync(Guid reqId, string action, string? remarks = null)
    {
        var audit = new RequisitionAuditTrail
        {
            AuditId = Guid.NewGuid(),
            ReqId = reqId,
            Action = action,
            ActionBy = _currentUser.UserId ?? Guid.Empty,
            Timestamp = DateTime.UtcNow,
            Remarks = remarks
        };
        _context.RequisitionAuditTrails.Add(audit);
        await _context.SaveChangesAsync();
    }

    private RequisitionStatus GetNextApprovalStatus(JobRequisition requisition, bool approved)
    {
        if (!approved) return RequisitionStatus.Rejected;
        var maxSalary = requisition.MaxSalary ?? 0;

        switch (requisition.Status)
        {
            case RequisitionStatus.Draft:
            case RequisitionStatus.ReturnedForCorrection:
            case RequisitionStatus.InternalReview:
                return RequisitionStatus.PendingHOD;

            case RequisitionStatus.PendingApproval:
            case RequisitionStatus.PendingHOD:
                return RequisitionStatus.PendingHR;

            case RequisitionStatus.PendingHR:
                if (maxSalary >= 1000000) // >= 10 LPA
                {
                    return RequisitionStatus.PendingFinance;
                }
                return RequisitionStatus.Approved;

            case RequisitionStatus.PendingFinance:
                if (maxSalary >= 2000000) // >= 20 LPA
                {
                    return RequisitionStatus.PendingCOO;
                }
                return RequisitionStatus.Approved;

            case RequisitionStatus.PendingCOO:
                return RequisitionStatus.Approved;

            default:
                return requisition.Status;
        }
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<JobRequisitionDto>>>> GetRequisitions(
        [FromQuery] Guid? deptId,
        [FromQuery] Guid? designationId,
        [FromQuery] RequisitionStatus? status,
        [FromQuery] bool? excludePosted,
        CancellationToken ct)
    {
        var query = _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .Include(r => r.ApprovedByUser)
            .AsQueryable();

        if (_currentUser.CompanyId.HasValue)
        {
            query = query.Where(r => r.CompanyId == _currentUser.CompanyId.Value);
        }

        var isHRAdminOrRecruitment = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.HRExecutive, RoleCodes.SuperAdmin, RoleCodes.RecruitmentManager);
        if (!isHRAdminOrRecruitment)
        {
            if (_currentUser.UserId.HasValue)
            {
                query = query.Where(r => r.RaisedBy == _currentUser.UserId.Value || r.CurrentApproverId == _currentUser.UserId.Value);
            }
        }

        if (deptId.HasValue)
        {
            query = query.Where(r => r.DeptId == deptId.Value);
        }
        if (designationId.HasValue)
        {
            query = query.Where(r => r.DesignationId == designationId.Value);
        }
        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }
        else
        {
            query = query.Where(r => r.Status != RequisitionStatus.Cancelled);
        }

        if (excludePosted == true)
        {
            query = query.Where(r => !_context.JobPostings.Any(p => p.ReqId == r.ReqId));
        }

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
        var dtos = _mapper.Map<List<JobRequisitionDto>>(list);
        await PopulateDtoNamesAsync(dtos, ct);
        return Ok(ApiResponse<List<JobRequisitionDto>>.Ok(dtos));
    }

    [HttpGet("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<JobRequisitionDto>>> GetRequisition(Guid id, CancellationToken ct)
    {
        var requisition = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync(r => r.ReqId == id, ct);

        if (requisition == null)
        {
            return NotFound(ApiResponse<JobRequisitionDto>.Fail("Job requisition not found."));
        }

        if (_currentUser.CompanyId.HasValue && requisition.CompanyId != _currentUser.CompanyId.Value)
        {
            return Forbid();
        }

        var isHRAdminOrRecruitment = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin, RoleCodes.RecruitmentManager);
        if (!isHRAdminOrRecruitment)
        {
            if (requisition.RaisedBy != _currentUser.UserId && requisition.CurrentApproverId != _currentUser.UserId)
            {
                return Forbid();
            }
        }

        var dto = _mapper.Map<JobRequisitionDto>(requisition);
        var list = new List<JobRequisitionDto> { dto };
        await PopulateDtoNamesAsync(list, ct);
        return Ok(ApiResponse<JobRequisitionDto>.Ok(list[0]));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Create)]
    public async Task<ActionResult<ApiResponse<JobRequisitionDto>>> CreateRequisition(
        [FromBody] CreateJobRequisitionRequest request,
        CancellationToken ct)
    {
        Console.WriteLine("Controller Hit: CreateRequisition. Request JSON: " + System.Text.Json.JsonSerializer.Serialize(request));
        
        // 4. Cascade Sub-Department Validation (only if provided)
        if (request.SubDeptId.HasValue && request.DeptId != Guid.Empty)
        {
            var subDept = await _context.Departments.FirstOrDefaultAsync(d => d.DeptId == request.SubDeptId.Value, ct);
            if (subDept == null || subDept.ParentDeptId != request.DeptId)
            {
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Selected sub-department is invalid or does not belong to the selected department."));
            }
        }

        if (request.DeptId.HasValue && request.DeptId.Value != Guid.Empty)
        {
            var deptExists = await _context.Departments.AnyAsync(d => d.DeptId == request.DeptId.Value, ct);
            if (!deptExists)
            {
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Selected department does not exist."));
            }
        }

        if (request.DesignationId.HasValue && request.DesignationId.Value != Guid.Empty)
        {
            var desig = await _context.Designations.FirstOrDefaultAsync(d => d.DesignationId == request.DesignationId.Value, ct);
            if (desig == null)
            {
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Selected designation does not exist."));
            }
            // Note: CTC band validation is intentionally skipped on draft saves.
            // It is enforced strictly at submission time in SubmitRequisition.
        }

        var canCreate = _currentUser.HasAnyRole(
            RoleCodes.DeptManager, RoleCodes.ReportingManager,
            RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin);
        if (!canCreate)
        {
            return Forbid();
        }

        var companyId = _currentUser.CompanyId ?? await _context.Companies.Select(c => c.CompanyId).FirstOrDefaultAsync(ct);
        if (companyId == Guid.Empty)
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Company is not configured in the system."));
        }

        var requisition = _mapper.Map<JobRequisition>(request);
        requisition.ReqId = Guid.NewGuid();
        requisition.CompanyId = companyId;
        requisition.RaisedBy = _currentUser.UserId ?? Guid.Empty;
        requisition.RequisitionDate = DateOnly.FromDateTime(DateTime.UtcNow);
        requisition.Status = RequisitionStatus.Draft;
        requisition.NoOfPositions = request.NoOfPositions ?? 1;
        requisition.JobTitle = request.JobTitle ?? string.Empty;
        requisition.Justification = request.Justification ?? string.Empty;
        requisition.Priority = request.Priority ?? "Medium";
        requisition.VacancyType = request.VacancyType ?? "New";
        requisition.SourcingPreference = request.SourcingPreference ?? "All";

        // Auto-generate MRF Number formatted as MRF-YYYY-0001
        var currentYear = DateTime.UtcNow.Year;
        var count = await _context.JobRequisitions.CountAsync(r => r.RequisitionDate.Year == currentYear, ct);
        var nextSeq = (count + 1).ToString().PadLeft(4, '0');
        requisition.MrfNumber = $"MRF-{currentYear}-{nextSeq}";

        _context.JobRequisitions.Add(requisition);
        await _context.SaveChangesAsync(ct);

        await LogAuditTrailAsync(requisition.ReqId, "Created", "MRF raised as draft.");

        var savedReq = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .FirstOrDefaultAsync(r => r.ReqId == requisition.ReqId, ct);

        var dto = _mapper.Map<JobRequisitionDto>(savedReq);
        var list = new List<JobRequisitionDto> { dto };
        await PopulateDtoNamesAsync(list, ct);
        return CreatedAtAction(nameof(GetRequisition), new { id = requisition.ReqId }, ApiResponse<JobRequisitionDto>.Ok(list[0]));
    }

    [HttpPut("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobRequisitionDto>>> UpdateRequisition(
        Guid id,
        [FromBody] UpdateJobRequisitionRequest request,
        CancellationToken ct)
    {
        Console.WriteLine($"[UpdateRequisition] RECEIVED DTO: DeptId={request.DeptId}, SubDeptId={request.SubDeptId}, DesignationId={request.DesignationId}, HiringManagerId={request.HiringManagerId}, GradeId={request.GradeId}, Priority={request.Priority}, VacancyType={request.VacancyType}, TargetDate={request.TargetDate}, MinSalary={request.MinSalary}, MaxSalary={request.MaxSalary}, Justification={request.Justification}, SkillsRequired={request.SkillsRequired}, SourcingPreference={request.SourcingPreference}, JobTitle={request.JobTitle}, JobDescription={request.JobDescription}, NoOfPositions={request.NoOfPositions}, MinExperience={request.MinExperience}, MaxExperience={request.MaxExperience}, ReplacingEmployeeId={request.ReplacingEmployeeId}");

        if (!ModelState.IsValid)
        {
            Console.WriteLine("[UpdateRequisition] ModelState is INVALID!");
            foreach (var key in ModelState.Keys)
            {
                var state = ModelState[key];
                if (state != null && state.Errors.Count > 0)
                {
                    foreach (var error in state.Errors)
                    {
                        Console.WriteLine($"[UpdateRequisition] ModelState Error: Key={key}, Error={error.ErrorMessage}");
                    }
                }
            }
            return BadRequest(ModelState);
        }

        var requisition = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == id, ct);
        if (requisition == null)
        {
            Console.WriteLine($"[UpdateRequisition] NotFound. ReqId {id} does not exist.");
            return NotFound(ApiResponse<JobRequisitionDto>.Fail("Job requisition not found."));
        }

        if (_currentUser.CompanyId.HasValue && requisition.CompanyId != _currentUser.CompanyId.Value)
        {
            Console.WriteLine($"[UpdateRequisition] Forbidden. User CompanyId: {_currentUser.CompanyId}, Requisition CompanyId: {requisition.CompanyId}");
            return Forbid();
        }

        // Validation 1: Role/Ownership Verification
        Console.WriteLine("[UpdateRequisition] Validation 1 (Role/Ownership Verification) START");
        var isHRAdminOrRecruitment = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin, RoleCodes.RecruitmentManager);
        if (!isHRAdminOrRecruitment && requisition.RaisedBy != _currentUser.UserId)
        {
            Console.WriteLine($"[UpdateRequisition] Validation 1 FAILED. RaisedBy: {requisition.RaisedBy}, Current User: {_currentUser.UserId}");
            return Forbid();
        }
        Console.WriteLine("[UpdateRequisition] Validation 1 PASS");

        // Validation 2: Requisition Status Verification
        Console.WriteLine("[UpdateRequisition] Validation 2 (Requisition Status Verification) START");
        if (requisition.Status != RequisitionStatus.Draft && requisition.Status != RequisitionStatus.Rejected && requisition.Status != RequisitionStatus.ReturnedForCorrection)
        {
            Console.WriteLine($"[UpdateRequisition] Validation 2 FAILED. Reason: Only draft, rejected, or returned requisitions can be updated. Current status is {requisition.Status}.");
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Only draft, rejected, or returned requisitions can be updated."));
        }
        Console.WriteLine("[UpdateRequisition] Validation 2 PASS");

        // Validation 3: Sub-Department Cascade Verification
        Console.WriteLine("[UpdateRequisition] Validation 3 (Sub-Department Cascade Verification) START");
        if (request.SubDeptId.HasValue && request.DeptId.HasValue && request.DeptId.Value != Guid.Empty)
        {
            var subDept = await _context.Departments.FirstOrDefaultAsync(d => d.DeptId == request.SubDeptId.Value, ct);
            if (subDept == null || subDept.ParentDeptId != request.DeptId.Value)
            {
                Console.WriteLine($"[UpdateRequisition] Validation 3 FAILED. Reason: Sub-department {request.SubDeptId} is invalid or does not belong to department {request.DeptId}.");
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Selected sub-department is invalid or does not belong to the selected department."));
            }
        }
        Console.WriteLine("[UpdateRequisition] Validation 3 PASS");

        // Validation 4: Department Existence Verification
        Console.WriteLine("[UpdateRequisition] Validation 4 (Department Existence Verification) START");
        if (request.DeptId.HasValue && request.DeptId.Value != Guid.Empty)
        {
            var deptExists = await _context.Departments.AnyAsync(d => d.DeptId == request.DeptId.Value, ct);
            if (!deptExists)
            {
                Console.WriteLine($"[UpdateRequisition] Validation 4 FAILED. Reason: Selected department {request.DeptId} does not exist.");
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Selected department does not exist."));
            }
        }
        Console.WriteLine("[UpdateRequisition] Validation 4 PASS");

        // Validation 5: Designation existence check only (CTC band validation skipped on draft saves)
        Console.WriteLine("[UpdateRequisition] Validation 5 (Designation existence check) START");
        if (request.DesignationId.HasValue && request.DesignationId.Value != Guid.Empty)
        {
            var desig = await _context.Designations.FirstOrDefaultAsync(d => d.DesignationId == request.DesignationId.Value, ct);
            if (desig == null)
            {
                Console.WriteLine($"[UpdateRequisition] Validation 5 FAILED. Reason: Selected designation {request.DesignationId} does not exist.");
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Selected designation does not exist."));
            }
            // Note: CTC band salary validation is intentionally skipped on draft saves.
            // It is enforced strictly at submission time in SubmitRequisition.
        }
        Console.WriteLine("[UpdateRequisition] Validation 5 PASS");

        // Explicit merge mapping to prevent AutoMapper from overwriting existing database values with nulls
        if (request.DeptId.HasValue && request.DeptId.Value != Guid.Empty)
            requisition.DeptId = request.DeptId.Value;
        if (request.DesignationId.HasValue && request.DesignationId.Value != Guid.Empty)
            requisition.DesignationId = request.DesignationId.Value;
        if (request.GradeId.HasValue && request.GradeId.Value != Guid.Empty)
            requisition.GradeId = request.GradeId.Value;
        if (request.SubDeptId.HasValue && request.SubDeptId.Value != Guid.Empty)
            requisition.SubDeptId = request.SubDeptId.Value;
        if (request.HiringManagerId.HasValue && request.HiringManagerId.Value != Guid.Empty)
            requisition.HiringManagerId = request.HiringManagerId.Value;

        // If vacancy type is Replacement, update ReplacingEmployeeId. Otherwise, clear it.
        if (request.VacancyType == "Replacement" || (string.IsNullOrEmpty(request.VacancyType) && requisition.VacancyType == "Replacement"))
        {
            if (request.ReplacingEmployeeId.HasValue && request.ReplacingEmployeeId.Value != Guid.Empty)
                requisition.ReplacingEmployeeId = request.ReplacingEmployeeId.Value;
        }
        else
        {
            requisition.ReplacingEmployeeId = null;
        }

        if (request.NoOfPositions.HasValue)
            requisition.NoOfPositions = request.NoOfPositions.Value;
        if (request.MinExperience.HasValue)
            requisition.MinExperience = request.MinExperience.Value;
        if (request.MaxExperience.HasValue)
            requisition.MaxExperience = request.MaxExperience.Value;
        if (request.MinSalary.HasValue)
            requisition.MinSalary = request.MinSalary.Value;
        if (request.MaxSalary.HasValue)
            requisition.MaxSalary = request.MaxSalary.Value;
        if (request.TargetDate.HasValue)
            requisition.TargetDate = request.TargetDate.Value;

        if (request.JobTitle != null)
            requisition.JobTitle = request.JobTitle;
        if (request.JobDescription != null)
            requisition.JobDescription = request.JobDescription;
        if (request.SkillsRequired != null)
            requisition.SkillsRequired = request.SkillsRequired;
        if (request.Priority != null)
            requisition.Priority = request.Priority;
        if (request.VacancyType != null)
            requisition.VacancyType = request.VacancyType;
        if (request.Justification != null)
            requisition.Justification = request.Justification;
        if (request.SourcingPreference != null)
            requisition.SourcingPreference = request.SourcingPreference;

        requisition.Status = RequisitionStatus.Draft;
        requisition.CurrentApproverId = null;
        requisition.CurrentApprovalLevel = 0;
        requisition.UpdatedAt = DateTime.UtcNow;
        requisition.UpdatedBy = _currentUser.UserId ?? Guid.Empty;

        await _context.SaveChangesAsync(ct);
        await LogAuditTrailAsync(requisition.ReqId, "Edited", "Requisition updated and reset to Draft.");

        var savedReq = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync(r => r.ReqId == id, ct);

        var dto = _mapper.Map<JobRequisitionDto>(savedReq);
        var list = new List<JobRequisitionDto> { dto };
        await PopulateDtoNamesAsync(list, ct);
        return Ok(ApiResponse<JobRequisitionDto>.Ok(list[0]));
    }

    [HttpPost("{id:guid}/submit")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobRequisitionDto>>> SubmitRequisition(Guid id, CancellationToken ct)
    {
        Console.WriteLine("Controller Hit: SubmitRequisition. Id: " + id);
        
        var requisition = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == id, ct);
        if (requisition == null)
        {
            return NotFound(ApiResponse<JobRequisitionDto>.Fail("Job requisition not found."));
        }

        if (_currentUser.CompanyId.HasValue && requisition.CompanyId != _currentUser.CompanyId.Value)
        {
            return Forbid();
        }

        var isHRAdminOrRecruitment = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin, RoleCodes.RecruitmentManager);
        if (!isHRAdminOrRecruitment && requisition.RaisedBy != _currentUser.UserId)
        {
            return Forbid();
        }

        if (requisition.Status != RequisitionStatus.Draft && requisition.Status != RequisitionStatus.Rejected && requisition.Status != RequisitionStatus.ReturnedForCorrection)
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Only draft, rejected, or returned requisitions can be submitted."));
        }

        // Strict Validations on Submit
        if (!requisition.DeptId.HasValue || requisition.DeptId.Value == Guid.Empty)
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Department is mandatory before submission."));
        }
        if (!requisition.DesignationId.HasValue || requisition.DesignationId.Value == Guid.Empty)
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Designation is mandatory before submission."));
        }
        if (string.IsNullOrWhiteSpace(requisition.Priority))
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Priority is mandatory before submission."));
        }
        if (!requisition.HiringManagerId.HasValue || requisition.HiringManagerId.Value == Guid.Empty)
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Hiring Manager is mandatory before submission."));
        }
        if (string.IsNullOrWhiteSpace(requisition.Justification) || requisition.Justification.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length < 10)
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Business justification is mandatory and must be at least 10 words before submission."));
        }
        if (requisition.TargetDate.HasValue && requisition.TargetDate.Value < DateOnly.FromDateTime(DateTime.UtcNow))
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Expected joining date (Target Date) cannot be in the past."));
        }

        var desig = await _context.Designations.FirstOrDefaultAsync(d => d.DesignationId == requisition.DesignationId, ct);
        if (desig != null && desig.MinBasic > 1000)
        {
            if (requisition.MinSalary.HasValue && requisition.MinSalary.Value < desig.MinBasic * 12)
            {
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail($"Minimum Salary budget cannot be lower than the designation min basic limit (₹ {desig.MinBasic * 12:N0} per annum)."));
            }
            if (requisition.MaxSalary.HasValue && desig.MaxBasic > 0 && requisition.MaxSalary.Value > desig.MaxBasic * 12 * 2.5m)
            {
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail($"Maximum Salary budget exceeds the allowed designation grade band ceiling (₹ {desig.MaxBasic * 12 * 2.5m:N0} per annum)."));
            }
        }

        Serilog.Log.Information("[SubmitRequisition] START - RequisitionId: {ReqId}, CompanyId: {CompanyId}", requisition.ReqId, requisition.CompanyId);

        // Route dynamically via ApprovalWorkflowConfigs configuration
        var routed = await RouteToWorkflowStepAsync(requisition, 1, ct);
        if (!routed)
        {
            Serilog.Log.Information("[SubmitRequisition] RouteToWorkflowStepAsync returned false. Reverting to Fallback.");
            // Fallback status if no config is found
            requisition.Status = RequisitionStatus.InternalReview;
        }

        Serilog.Log.Information("[SubmitRequisition] BEFORE SaveChanges - RequisitionId: {ReqId}, Workflow Step (CurrentApprovalLevel): {CurrentApprovalLevel}, CurrentApproverId: {CurrentApproverId}", requisition.ReqId, requisition.CurrentApprovalLevel, requisition.CurrentApproverId);

        await _context.SaveChangesAsync(ct);

        Serilog.Log.Information("[SubmitRequisition] AFTER SaveChanges - RequisitionId: {ReqId}, CurrentApproverId: {CurrentApproverId}", requisition.ReqId, requisition.CurrentApproverId);

        await LogAuditTrailAsync(requisition.ReqId, "Submitted", $"Requisition submitted and routed. Status: {requisition.Status}");

        if (requisition.RaisedBy != Guid.Empty)
        {
            await _notificationService.SendToUserAsync(
                requisition.RaisedBy,
                "MRF Submitted Successfully",
                $"Your manpower requisition MRF '{requisition.JobTitle}' ({requisition.MrfNumber}) has been submitted successfully and routed. Status: {requisition.Status}",
                NotificationType.General,
                requisition.ReqId.ToString(),
                "JobRequisition");
        }

        var savedReq = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync(r => r.ReqId == id, ct);

        var dto = _mapper.Map<JobRequisitionDto>(savedReq);
        var list = new List<JobRequisitionDto> { dto };
        await PopulateDtoNamesAsync(list, ct);
        return Ok(ApiResponse<JobRequisitionDto>.Ok(list[0], $"Requisition submitted successfully. Status: {requisition.Status}"));
    }

    [HttpPost("{id:guid}/approve")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Approve)]
    public async Task<ActionResult<ApiResponse<JobRequisitionDto>>> ApproveRequisition(
        Guid id,
        [FromBody] ApproveJobRequisitionRequest request,
        CancellationToken ct)
    {
        var requisition = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == id, ct);
        if (requisition == null)
        {
            return NotFound(ApiResponse<JobRequisitionDto>.Fail("Job requisition not found."));
        }

        if (_currentUser.CompanyId.HasValue && requisition.CompanyId != _currentUser.CompanyId.Value)
        {
            return Forbid();
        }

        var validStatuses = new[] { RequisitionStatus.PendingHOD, RequisitionStatus.PendingHR, RequisitionStatus.PendingFinance, RequisitionStatus.PendingCOO, RequisitionStatus.PendingApproval };
        if (!validStatuses.Contains(requisition.Status))
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Only pending requisitions can be approved or rejected."));
        }

        // Designated approver security check
        if (requisition.CurrentApproverId.HasValue && requisition.CurrentApproverId.Value != _currentUser.UserId)
        {
            return StatusCode(403, ApiResponse<JobRequisitionDto>.Fail("You are not the designated approver for this workflow step."));
        }

        var oldStatus = requisition.Status;
        if (!request.Approved)
        {
            requisition.Status = RequisitionStatus.Rejected;
            requisition.CurrentApproverId = null;
            requisition.ApprovedBy = _currentUser.UserId;
        }
        else
        {
            // Route to next step in dynamic workflow config
            var nextLevel = requisition.CurrentApprovalLevel + 1;
            var routed = await RouteToWorkflowStepAsync(requisition, nextLevel, ct);
            if (!routed)
            {
                // Fallback to old status calculation if dynamic route fails
                requisition.Status = GetNextApprovalStatus(requisition, request.Approved);
                if (requisition.Status == RequisitionStatus.Approved)
                {
                    requisition.ApprovedBy = _currentUser.UserId;
                    requisition.CurrentApproverId = null;
                }
            }
        }

        await _context.SaveChangesAsync(ct);

        var actionStr = request.Approved ? $"Approved ({oldStatus} -> {requisition.Status})" : "Rejected";
        await LogAuditTrailAsync(requisition.ReqId, actionStr, request.Comment);

        if (requisition.RaisedBy != Guid.Empty)
        {
            await _notificationService.SendToUserAsync(
                requisition.RaisedBy,
                $"Job Requisition Update: {requisition.Status}",
                $"Your job requisition for '{requisition.JobTitle}' status changed to {requisition.Status}. Remarks: {request.Comment}",
                NotificationType.General,
                requisition.ReqId.ToString(),
                "JobRequisition");
        }

        var savedReq = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync(r => r.ReqId == id, ct);

        var dto = _mapper.Map<JobRequisitionDto>(savedReq);
        var list = new List<JobRequisitionDto> { dto };
        await PopulateDtoNamesAsync(list, ct);
        return Ok(ApiResponse<JobRequisitionDto>.Ok(list[0], $"Requisition status updated to {requisition.Status}."));
    }

    [HttpPost("{id:guid}/return")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Approve)]
    public async Task<ActionResult<ApiResponse<JobRequisitionDto>>> ReturnRequisition(
        Guid id,
        [FromBody] ApproveJobRequisitionRequest request,
        CancellationToken ct)
    {
        var requisition = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == id, ct);
        if (requisition == null)
            return NotFound(ApiResponse<JobRequisitionDto>.Fail("Job requisition not found."));

        if (string.IsNullOrWhiteSpace(request.Comment))
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Comments are mandatory when returning for correction."));

        requisition.Status = RequisitionStatus.ReturnedForCorrection;
        await _context.SaveChangesAsync(ct);

        await LogAuditTrailAsync(requisition.ReqId, "ReturnedForCorrection", request.Comment);

        if (requisition.RaisedBy != Guid.Empty)
        {
            await _notificationService.SendToUserAsync(
                requisition.RaisedBy,
                "MRF Returned for Correction",
                $"Your job requisition '{requisition.JobTitle}' was returned. Reason: {request.Comment}",
                NotificationType.General,
                requisition.ReqId.ToString(),
                "JobRequisition");
        }

        var savedReq = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync(r => r.ReqId == id, ct);

        var dto = _mapper.Map<JobRequisitionDto>(savedReq);
        var list = new List<JobRequisitionDto> { dto };
        await PopulateDtoNamesAsync(list, ct);
        return Ok(ApiResponse<JobRequisitionDto>.Ok(list[0], "Requisition successfully returned to creator."));
    }

    [HttpPost("{id:guid}/cancel")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobRequisitionDto>>> CancelRequisition(Guid id, [FromQuery] string? reason, CancellationToken ct)
    {
        var requisition = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == id, ct);
        if (requisition == null)
            return NotFound(ApiResponse<JobRequisitionDto>.Fail("Job requisition not found."));

        if (_currentUser.CompanyId.HasValue && requisition.CompanyId != _currentUser.CompanyId.Value)
            return Forbid();

        requisition.Status = RequisitionStatus.Cancelled;
        requisition.CancelledBy = _currentUser.UserId ?? Guid.Empty;
        requisition.CancelledOn = DateTime.UtcNow;
        requisition.CancelReason = reason;

        await _context.SaveChangesAsync(ct);

        await LogAuditTrailAsync(requisition.ReqId, "Cancelled", $"MRF has been cancelled. Reason: {reason}");

        var savedReq = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync(r => r.ReqId == id, ct);

        var dto = _mapper.Map<JobRequisitionDto>(savedReq);
        var list = new List<JobRequisitionDto> { dto };
        await PopulateDtoNamesAsync(list, ct);
        return Ok(ApiResponse<JobRequisitionDto>.Ok(list[0], "Requisition successfully cancelled."));
    }

    [HttpDelete("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRequisition(Guid id, CancellationToken ct)
    {
        var requisition = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == id, ct);
        if (requisition == null)
            return NotFound(ApiResponse<object>.Fail("Job requisition not found."));

        if (_currentUser.CompanyId.HasValue && requisition.CompanyId != _currentUser.CompanyId.Value)
            return Forbid();

        if (requisition.Status != RequisitionStatus.Draft)
            return BadRequest(ApiResponse<object>.Fail("Only draft requisitions can be permanently deleted."));

        _context.JobRequisitions.Remove(requisition);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(null, "Draft requisition deleted successfully."));
    }

    [HttpPost("{id:guid}/internal-action")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<JobRequisitionDto>>> ProcessInternalAction(
        Guid id,
        [FromBody] InternalActionRequest request,
        CancellationToken ct)
    {
        var requisition = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == id, ct);
        if (requisition == null)
            return NotFound(ApiResponse<JobRequisitionDto>.Fail("Job requisition not found."));

        if (request.Action == "Assign")
        {
            requisition.Status = RequisitionStatus.Closed;
            requisition.InternalHiringRemarks = request.Remarks ?? $"Assigned internal employee ID: {request.EmployeeId}";
            await LogAuditTrailAsync(requisition.ReqId, "Assign Internal Employee", request.Remarks);
        }
        else if (request.Action == "Continue")
        {
            if (string.IsNullOrWhiteSpace(request.Justification))
            {
                return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Business justification is mandatory to continue external sourcing."));
            }
            requisition.InternalHiringJustification = request.Justification;
            requisition.InternalHiringRemarks = request.Remarks;
            await LogAuditTrailAsync(requisition.ReqId, "Continue External Sourcing", request.Justification);
        }
        else if (request.Action == "Cancel")
        {
            requisition.Status = RequisitionStatus.Cancelled;
            requisition.InternalHiringRemarks = request.Remarks;
            await LogAuditTrailAsync(requisition.ReqId, "Cancel Requisition", request.Remarks);
        }
        else
        {
            return BadRequest(ApiResponse<JobRequisitionDto>.Fail("Invalid action. Supported actions: Assign, Continue, Cancel."));
        }

        await _context.SaveChangesAsync(ct);

        if (requisition.RaisedBy != Guid.Empty)
        {
            var msg = request.Action == "Assign" 
                ? $"Your job requisition '{requisition.JobTitle}' has been filled internally and closed."
                : request.Action == "Continue"
                ? $"Your job requisition '{requisition.JobTitle}' has passed internal review and is now pending HOD approval."
                : $"Your job requisition '{requisition.JobTitle}' has been cancelled during internal review.";

            await _notificationService.SendToUserAsync(
                requisition.RaisedBy,
                $"MRF Internal Review: {request.Action}",
                msg,
                NotificationType.General,
                requisition.ReqId.ToString(),
                "JobRequisition");
        }

        var savedReq = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Include(r => r.RaisedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync(r => r.ReqId == id, ct);

        var dto = _mapper.Map<JobRequisitionDto>(savedReq);
        var list = new List<JobRequisitionDto> { dto };
        await PopulateDtoNamesAsync(list, ct);
        return Ok(ApiResponse<JobRequisitionDto>.Ok(list[0], "Internal talent action successfully processed."));
    }

    [HttpGet("{id:guid}/internal-check")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<object>>> InternalWorkforceCheck(Guid id, CancellationToken ct)
    {
        var requisition = await _context.JobRequisitions
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .FirstOrDefaultAsync(r => r.ReqId == id, ct);

        if (requisition == null)
            return NotFound(ApiResponse<object>.Fail("Requisition not found."));

        if (_currentUser.CompanyId.HasValue && requisition.CompanyId != _currentUser.CompanyId.Value)
            return Forbid();

        var query = _context.Employees
            .Include(e => e.Designation)
            .Include(e => e.Department)
            .Include(e => e.Grade)
            .Where(e => e.IsActive && e.EmploymentStatus == Domain.Enums.EmploymentStatus.Active);

        var candidates = await query
            .Where(e => e.DeptId == requisition.DeptId || e.DesignationId == requisition.DesignationId)
            .Select(e => new {
                e.EmployeeId,
                e.EmployeeCode,
                FullName = e.FirstName + " " + e.LastName,
                DepartmentName = e.Department != null ? e.Department.DeptName : "",
                DesignationName = e.Designation != null ? e.Designation.Title : "",
                GradeName = e.Grade != null ? e.Grade.Name : "",
                e.EmploymentType,
                e.EmploymentStatus,
                IsExactMatch = e.DeptId == requisition.DeptId && e.DesignationId == requisition.DesignationId
            })
            .Take(20)
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(new {
            totalMatches = candidates.Count,
            requisitionTitle = requisition.JobTitle,
            departmentName = requisition.Department?.DeptName,
            designationTitle = requisition.Designation?.Title,
            candidates
        }));
    }

    [HttpGet("{id:guid}/audit-trail")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetAuditTrail(Guid id, CancellationToken ct)
    {
        var requisition = await _context.JobRequisitions.FirstOrDefaultAsync(r => r.ReqId == id, ct);
        if (requisition == null)
            return NotFound(ApiResponse<List<object>>.Fail("Job requisition not found."));

        if (_currentUser.CompanyId.HasValue && requisition.CompanyId != _currentUser.CompanyId.Value)
            return Forbid();

        var trails = await _context.RequisitionAuditTrails
            .Where(t => t.ReqId == id)
            .OrderBy(t => t.Timestamp)
            .ToListAsync(ct);

        var actorIds = trails.Select(t => t.ActionBy).Distinct().ToList();
        var users = await _context.Users
            .Where(u => actorIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => new { FullName = u.FirstName + " " + u.LastName, u.Username }, ct);

        var result = trails.Select(t =>
        {
            users.TryGetValue(t.ActionBy, out var actor);
            return (object)new
            {
                auditId = t.AuditId,
                action = t.Action,
                actionBy = t.ActionBy,
                actionByName = actor?.FullName ?? "System",
                actionByUsername = actor?.Username ?? "-",
                timestamp = t.Timestamp,
                remarks = t.Remarks
            };
        }).ToList();

        return Ok(ApiResponse<List<object>>.Ok(result));
    }

    private async Task<bool> RouteToWorkflowStepAsync(JobRequisition requisition, int sequence, CancellationToken ct)
    {
        var config = await _context.ApprovalWorkflowConfigs
            .FirstOrDefaultAsync(c => c.CompanyId == requisition.CompanyId, ct);
        
        Serilog.Log.Information("[RouteToWorkflowStepAsync] RequisitionId: {ReqId}, Sequence: {Sequence}", requisition.ReqId, sequence);
        
        if (config == null || string.IsNullOrEmpty(config.ApproverRolesJson))
        {
            Serilog.Log.Information("[RouteToWorkflowStepAsync] No workflow config found.");
            return false;
        }

        var steps = System.Text.Json.JsonSerializer.Deserialize<List<WorkflowStep>>(config.ApproverRolesJson);
        if (steps == null)
        {
            Serilog.Log.Information("[RouteToWorkflowStepAsync] Deserialization of ApproverRolesJson failed.");
            return false;
        }

        var step = steps.FirstOrDefault(s => s.Sequence == sequence);
        if (step == null)
        {
            // No more steps -> Mark as Approved
            requisition.Status = RequisitionStatus.Approved;
            requisition.CurrentApproverId = null;
            requisition.CurrentApprovalLevel = sequence - 1;
            requisition.ApprovedBy = _currentUser.UserId;
            Serilog.Log.Information("[RouteToWorkflowStepAsync] No further steps. Requisition marked as Approved.");
            return true;
        }

        Serilog.Log.Information("[RouteToWorkflowStepAsync] Current Workflow Step: Sequence={Sequence}, RoleCode={RoleCode}, ExpectedStatus={Status}", step.Sequence, step.RoleCode, step.Status);

        // Map to status enum value (case-insensitive)
        if (Enum.TryParse<RequisitionStatus>(step.Status, true, out var nextStatus))
        {
            requisition.Status = nextStatus;
        }
        else
        {
            // Fallback status mapping
            requisition.Status = step.RoleCode switch
            {
                RoleCodes.COO => RequisitionStatus.PendingCOO,
                RoleCodes.HRAdmin => RequisitionStatus.PendingHR,
                RoleCodes.FinanceHead => RequisitionStatus.PendingFinance,
                _ => RequisitionStatus.PendingApproval
            };
        }

        requisition.CurrentApprovalLevel = step.Sequence;

        // Resolve user by role code
        User? approverUser = null;
        if (step.RoleCode == RoleCodes.DeptManager)
        {
            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.DeptId == requisition.DeptId, ct);
            if (dept != null && dept.HODEmployeeId.HasValue)
            {
                approverUser = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == dept.HODEmployeeId.Value, ct);
                Serilog.Log.Information("[RouteToWorkflowStepAsync] Resolved DeptManager HOD user: {Username} (UserId: {UserId})", approverUser?.Username, approverUser?.UserId);
            }
        }

        if (approverUser == null)
        {
            approverUser = await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .Where(ur => ur.Role.RoleCode == step.RoleCode && ur.IsActive)
                .Select(ur => ur.User)
                .FirstOrDefaultAsync(ct);
            Serilog.Log.Information("[RouteToWorkflowStepAsync] Resolved Role {RoleCode} user: {Username} (UserId: {UserId})", step.RoleCode, approverUser?.Username, approverUser?.UserId);
        }

        if (approverUser != null)
        {
            // Auto-advance if resolved approver is the submitter/creator
            var isSubmitter = approverUser.UserId == requisition.RaisedBy || 
                              approverUser.UserId == _currentUser.UserId || 
                              (requisition.RaisedBy == Guid.Empty && _currentUser.UserId.HasValue && approverUser.UserId == _currentUser.UserId.Value);
            
            if (isSubmitter)
            {
                Serilog.Log.Information("[RouteToWorkflowStepAsync] Auto-advancing from step {Sequence} ({RoleCode}) because resolved approver is the submitter.", sequence, step.RoleCode);
                return await RouteToWorkflowStepAsync(requisition, sequence + 1, ct);
            }

            requisition.CurrentApproverId = approverUser.UserId;
            Serilog.Log.Information("[RouteToWorkflowStepAsync] Selected Approver Role: {RoleCode}, Selected Approver UserId: {UserId}", step.RoleCode, approverUser.UserId);
        }
        else
        {
            requisition.CurrentApproverId = null;
            Serilog.Log.Information("[RouteToWorkflowStepAsync] Selected Approver Role: {RoleCode}, Selected Approver UserId: null", step.RoleCode);
        }

        return true;
    }
}

public class WorkflowStep
{
    public int Sequence { get; set; }
    public string RoleCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
