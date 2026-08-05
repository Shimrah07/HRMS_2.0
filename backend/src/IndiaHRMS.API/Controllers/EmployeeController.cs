using AutoMapper;
using IndiaHRMS.Application.DTOs.Employee;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/employees")]
[ApiVersion("1.0")]
[Authorize]
public class EmployeeController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;
    private readonly IEncryptionService _encryption;
    private readonly IFileService _fileService;

    public EmployeeController(AppDbContext context, IMapper mapper, ICurrentUserService currentUser,
        IEncryptionService encryption, IFileService fileService)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
        _encryption = encryption;
        _fileService = fileService;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<List<EmployeeListDto>>>> GetEmployees([FromQuery] EmployeeQueryRequest request, CancellationToken ct)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.Location)
            .Include(e => e.ReportingManager)
            .Include(e => e.Grade)
            .Include(e => e.Band)
            .Include(e => e.JobFamily)
            .Include(e => e.BusinessUnit)
            .Include(e => e.CostCenter)
            .Include(e => e.Shift)
            .AsQueryable();

        var isAdmin = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin);
        if (isAdmin)
        {
            if (string.Equals(request.ActiveStatus, "inactive", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(e => !e.IsActive);
            }
            else if (string.Equals(request.ActiveStatus, "all", StringComparison.OrdinalIgnoreCase))
            {
                // Show all
            }
            else
            {
                query = query.Where(e => e.IsActive);
            }
        }
        else
        {
            query = query.Where(e => e.IsActive);
        }

        // Data scoping by role
        if ((_currentUser.HasRole(RoleCodes.DeptManager) || _currentUser.HasRole(RoleCodes.ReportingManager)) && !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
        {
            query = query.Where(e => e.ReportingManagerId == _currentUser.EmployeeId || e.L2ReportingManagerId == _currentUser.EmployeeId);
        }

        if (_currentUser.HasRole(RoleCodes.HRExecutive) && !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin) && _currentUser.EmployeeId.HasValue)
        {
            var hrExec = _context.Employees.FirstOrDefault(e => e.EmployeeId == _currentUser.EmployeeId.Value);
            if (hrExec != null)
            {
                query = query.Where(e => e.DeptId == hrExec.DeptId);
            }
        }

        if (_currentUser.CompanyId.HasValue)
            query = query.Where(e => e.CompanyId == _currentUser.CompanyId);

        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(e => e.FirstName.Contains(search) || e.LastName.Contains(search) ||
                (e.FirstName + " " + e.LastName).Contains(search) ||
                e.EmployeeCode.Contains(search) || (e.OfficialEmail != null && e.OfficialEmail.Contains(search)));
        }

        if (request.DeptId.HasValue) query = query.Where(e => e.DeptId == request.DeptId);
        if (request.LocationId.HasValue) query = query.Where(e => e.LocationId == request.LocationId);
        if (request.DesignationId.HasValue) query = query.Where(e => e.DesignationId == request.DesignationId);
        if (request.Status.HasValue) query = query.Where(e => e.EmploymentStatus == request.Status);
        if (request.ReportingManagerId.HasValue) query = query.Where(e => e.ReportingManagerId == request.ReportingManagerId);

        if (request.Type != null && request.Type.Any())
            query = query.Where(e => request.Type.Contains(e.EmploymentType));
        if (request.GradeId != null && request.GradeId.Any())
            query = query.Where(e => e.GradeId.HasValue && request.GradeId.Contains(e.GradeId.Value));
        if (request.WorkMode != null && request.WorkMode.Any())
            query = query.Where(e => e.WorkMode.HasValue && request.WorkMode.Contains(e.WorkMode.Value));
        if (request.ShiftId != null && request.ShiftId.Any())
            query = query.Where(e => e.ShiftId.HasValue && request.ShiftId.Contains(e.ShiftId.Value));
        if (request.PayrollGroup != null && request.PayrollGroup.Any())
            query = query.Where(e => e.PayrollGroup.HasValue && request.PayrollGroup.Contains(e.PayrollGroup.Value));
        if (request.BusinessUnitId != null && request.BusinessUnitId.Any())
            query = query.Where(e => e.BusinessUnitId.HasValue && request.BusinessUnitId.Contains(e.BusinessUnitId.Value));
        if (request.CostCenterId != null && request.CostCenterId.Any())
            query = query.Where(e => e.CostCenterId.HasValue && request.CostCenterId.Contains(e.CostCenterId.Value));

        var total = await query.CountAsync(ct);
        var employees = await query
            .OrderBy(e => e.FirstName).ThenBy(e => e.LastName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return Ok(ApiResponse<List<EmployeeListDto>>.PagedOk(_mapper.Map<List<EmployeeListDto>>(employees), request.Page, request.PageSize, total));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> GetEmployee(Guid id, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var hasViewPermission = _currentUser.HasPermission(PermissionCodes.Employee.View);
        if (!isSelf && !hasViewPermission)
        {
            return StatusCode(403, ApiResponse<EmployeeDetailDto>.Fail("Access Denied. You do not have permission to view these details."));
        }

        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.Location)
            .Include(e => e.CostCenter)
            .Include(e => e.ProfitCenter)
            .Include(e => e.BusinessUnit)
            .Include(e => e.Division)
            .Include(e => e.SubDepartment)
            .Include(e => e.Team)
            .Include(e => e.Grade)
            .Include(e => e.Band)
            .Include(e => e.JobFamily)
            .Include(e => e.JobFunction)
            .Include(e => e.ReportingManager)
            .Include(e => e.L2ReportingManager)
            .Include(e => e.FunctionalManager)
            .Include(e => e.Shift)
            .Include(e => e.Documents)
            .Include(e => e.BankDetails)
            .Include(e => e.Educations)
            .Include(e => e.Experiences)
            .Include(e => e.PFNominees)
            .FirstOrDefaultAsync(e => e.EmployeeId == id, ct);

        if (employee == null) return NotFound(ApiResponse<EmployeeDetailDto>.Fail("Employee not found."));

        if (!employee.IsActive && !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin))
        {
            return StatusCode(403, ApiResponse<EmployeeDetailDto>.Fail("Access Denied. Profile is inactive."));
        }

        var dto = _mapper.Map<EmployeeDetailDto>(employee);
        var hasSensitivePermission = _currentUser.HasPermission(PermissionCodes.Security.ViewSensitiveData);

        // Aadhar
        if (!string.IsNullOrEmpty(employee.AadharNumber))
        {
            try
            {
                var decrypted = _encryption.Decrypt(employee.AadharNumber);
                dto.MaskedAadhar = hasSensitivePermission ? decrypted : _encryption.MaskValue(decrypted);
            }
            catch
            {
                dto.MaskedAadhar = "********";
            }
        }
        else
        {
            dto.MaskedAadhar = null;
        }

        // PAN
        if (!string.IsNullOrEmpty(employee.PANNumber))
        {
            try
            {
                var decrypted = _encryption.Decrypt(employee.PANNumber);
                dto.MaskedPAN = hasSensitivePermission ? decrypted : _encryption.MaskValue(decrypted, 4);
            }
            catch
            {
                dto.MaskedPAN = "********";
            }
        }
        else
        {
            dto.MaskedPAN = null;
        }

        // Bank Details Account Numbers
        foreach (var bank in dto.BankDetails)
        {
            var raw = employee.BankDetails.FirstOrDefault(b => b.BankDetailId == bank.BankDetailId);
            if (raw != null && !string.IsNullOrEmpty(raw.AccountNumber))
            {
                try
                {
                    var decrypted = _encryption.Decrypt(raw.AccountNumber);
                    bank.MaskedAccountNumber = hasSensitivePermission ? decrypted : _encryption.MaskValue(decrypted);
                }
                catch
                {
                    bank.MaskedAccountNumber = "********";
                }
            }
            else
            {
                bank.MaskedAccountNumber = null;
            }
        }

        // Nominees Aadhar Numbers
        foreach (var nom in dto.PFNominees)
        {
            var raw = employee.PFNominees.FirstOrDefault(n => n.NomineeId == nom.NomineeId);
            if (raw != null && !string.IsNullOrEmpty(raw.AadharNumber))
            {
                try
                {
                    var decrypted = _encryption.Decrypt(raw.AadharNumber);
                    nom.AadharNumber = hasSensitivePermission ? decrypted : _encryption.MaskValue(decrypted);
                }
                catch
                {
                    nom.AadharNumber = "********";
                }
            }
        }

        return Ok(ApiResponse<EmployeeDetailDto>.Ok(dto));
    }

    [HttpGet("{id:guid}/summary")]
    [Filters.RequirePermission(PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<EmployeeSummaryDto>>> GetEmployeeSummary(Guid id, CancellationToken ct)
    {
        var employee = await _context.Employees
            .Include(e => e.Department).Include(e => e.Designation)
            .FirstOrDefaultAsync(e => e.EmployeeId == id, ct);
        if (employee == null) return NotFound(ApiResponse<EmployeeSummaryDto>.Fail("Employee not found."));
        return Ok(ApiResponse<EmployeeSummaryDto>.Ok(_mapper.Map<EmployeeSummaryDto>(employee)));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.Employee.Create)]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> CreateEmployee([FromBody] CreateEmployeeRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Company not configured."));

        if (await _context.Employees.AnyAsync(e => e.OfficialEmail == request.OfficialEmail, ct))
            return Conflict(ApiResponse<EmployeeDetailDto>.Fail("Official email already exists."));

        var empId = Guid.NewGuid();

        // ─── Reporting Managers Validations ────────────────────────────────────
        if (request.ReportingManagerId.HasValue)
        {
            if (request.ReportingManagerId.Value == empId)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as L1 Reporting Manager."));
            if (await IsCircularReportingAsync(empId, request.ReportingManagerId.Value, ct))
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Circular reporting detected for L1 Reporting Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.ReportingManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("L1 Reporting Manager must be an active employee."));
        }
        if (request.L2ReportingManagerId.HasValue)
        {
            if (request.L2ReportingManagerId.Value == empId)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as L2 Reporting Manager."));
            if (await IsCircularReportingAsync(empId, request.L2ReportingManagerId.Value, ct))
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Circular reporting detected for L2 Reporting Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.L2ReportingManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("L2 Reporting Manager must be an active employee."));
        }
        if (request.L3ReportingManagerId.HasValue)
        {
            if (request.L3ReportingManagerId.Value == empId)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as L3 Reporting Manager."));
            if (await IsCircularReportingAsync(empId, request.L3ReportingManagerId.Value, ct))
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Circular reporting detected for L3 Reporting Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.L3ReportingManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("L3 Reporting Manager must be an active employee."));
        }
        if (request.L4ReportingManagerId.HasValue)
        {
            if (request.L4ReportingManagerId.Value == empId)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as L4 Reporting Manager."));
            if (await IsCircularReportingAsync(empId, request.L4ReportingManagerId.Value, ct))
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Circular reporting detected for L4 Reporting Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.L4ReportingManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("L4 Reporting Manager must be an active employee."));
        }
        if (request.FunctionalManagerId.HasValue)
        {
            if (request.FunctionalManagerId.Value == empId)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as Functional Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.FunctionalManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Functional Manager must be an active employee."));
        }

        // ─── Notice Period Validation ──────────────────────────────────────────
        if (request.NoticePeriodDays < 0 || request.NoticePeriodDays > 365)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Notice period days must be between 0 and 365."));

        // ─── Employment Type Checks ────────────────────────────────────────────
        if (request.EmploymentType == EmploymentType.Contract)
        {
            if (!request.ContractEndDate.HasValue)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Contract End Date is required for Contract employment type."));
            if (request.ContractEndDate.Value <= request.JoiningDate)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Contract End Date must be after joining date."));
        }
        else if (request.EmploymentType == EmploymentType.Intern)
        {
            if (!request.InternshipDurationMonths.HasValue)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Internship duration is required for Intern employment type."));
        }

        // ─── Mandatory Enterprise Checks ───────────────────────────────────────
        if (!request.ShiftId.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Shift assignment is required."));
        if (!request.PayrollGroup.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Payroll Group mapping is required."));
        if (!request.GradeId.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Grade is required."));
        if (!request.CostCenterId.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cost Center mapping is required."));

        var employee = _mapper.Map<Employee>(request);
        employee.EmployeeId = empId;
        employee.CompanyId = company.CompanyId;

        // Employee ID logic based on Category
        if (request.EmployeeCategory == "TCS Employee")
        {
            if (string.IsNullOrWhiteSpace(request.EmployeeCode))
            {
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Employee ID is required for TCS Employees."));
            }

            var codeExists = await _context.Employees.AnyAsync(e => e.EmployeeCode == request.EmployeeCode.Trim(), ct);
            if (codeExists)
            {
                return Conflict(ApiResponse<EmployeeDetailDto>.Fail("Employee ID already exists."));
            }

            employee.EmployeeCode = request.EmployeeCode.Trim();
            employee.EmployeeCategory = "TCS Employee";
        }
        else
        {
            employee.EmployeeCode = await GenerateEmployeeCodeAsync(company.CompanyId, ct);
            employee.EmployeeCategory = "MPOnline Employee";
        }

        employee.ProbationEndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(request.ProbationPeriodDays));

        if (!string.IsNullOrEmpty(request.PersonalPhone))
        {
            var phoneExists = await _context.Employees.AnyAsync(e => e.PersonalPhone == request.PersonalPhone.Trim(), ct);
            if (phoneExists)
                return Conflict(ApiResponse<EmployeeDetailDto>.Fail("Personal mobile number already exists."));
        }

        if (string.IsNullOrWhiteSpace(request.AadharNumber))
        {
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Aadhaar Number is required."));
        }
        var aadharHash = _encryption.HashValue(request.AadharNumber);
        if (await _context.Employees.AnyAsync(e => e.AadharHash == aadharHash, ct))
            return Conflict(ApiResponse<EmployeeDetailDto>.Fail("An employee with this Aadhaar number already exists."));
        employee.AadharHash = aadharHash;
        employee.AadharNumber = _encryption.Encrypt(request.AadharNumber);

        if (string.IsNullOrWhiteSpace(request.PANNumber))
        {
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("PAN Number is required."));
        }
        var panUpper = request.PANNumber.Trim().ToUpper();
        var panHash = _encryption.HashValue(panUpper);
        if (await _context.Employees.AnyAsync(e => e.PANHash == panHash, ct))
            return Conflict(ApiResponse<EmployeeDetailDto>.Fail("An employee with this PAN number already exists."));
        employee.PANHash = panHash;
        employee.PANNumber = _encryption.Encrypt(panUpper);

        _context.Employees.Add(employee);

        if (request.CreateUserAccount)
        {
            var baseUsername = string.IsNullOrEmpty(request.OfficialEmail)
                ? employee.EmployeeCode.ToLower()
                : request.OfficialEmail.ToLower();
            var username = baseUsername;
            int suffix = 1;
            while (await _context.Users.AnyAsync(u => u.Username == username, ct))
            {
                username = $"{baseUsername}_{suffix}";
                suffix++;
            }

            var defaultPasswordSetting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.SettingKey == "DEFAULT_PASSWORD", ct);
            var password = request.InitialPassword 
                ?? defaultPasswordSetting?.SettingValue 
                ?? "Welcome@123";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

            var user = new User
            {
                UserId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId,
                Username = username,
                Email = request.OfficialEmail ?? $"{employee.EmployeeCode.ToLower()}@acme.example.com",
                FirstName = request.FirstName,
                LastName = request.LastName,
                PasswordHash = passwordHash,
                PasswordSalt = "",
                MustChangePassword = true,
                CreatedAt = DateTime.UtcNow
            };

            // Assign default EMPLOYEE role
            var employeeRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == RoleCodes.Employee, ct);
            if (employeeRole != null)
                user.UserRoles.Add(new UserRole 
                { 
                    UserRoleId = Guid.NewGuid(),
                    UserId = user.UserId,
                    RoleId = employeeRole.RoleId,
                    AssignedAt = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });

            _context.Users.Add(user);

            // Add Password History
            _context.PasswordHistories.Add(new PasswordHistory
            {
                HistoryId = Guid.NewGuid(),
                UserId = user.UserId,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.UtcNow
            });

            // Write Security Audit Log
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "unknown";
            _context.SecurityAuditLogs.Add(new SecurityAuditLog
            {
                LogId = Guid.NewGuid(),
                EventType = "USER_CREATED",
                UserId = user.UserId,
                Username = user.Username,
                IpAddress = clientIp,
                UserAgent = userAgent,
                Details = $"User account created for EmployeeCode {employee.EmployeeCode}. Role EMPLOYEE assigned. Initial password set.",
                IsSuccess = true,
                CreatedAt = DateTime.UtcNow
            });

            // Create welcome notification for the new employee
            var welcomeNotif = new Notification
            {
                NotificationId = Guid.NewGuid(),
                UserId = user.UserId,
                Title = "Welcome to IndiaHRMS",
                Message = $"Welcome to Acme Technologies Pvt Ltd! Your profile is created. Your initial username is '{user.Username}'. Please complete your profile details.",
                Type = NotificationType.System,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(welcomeNotif);
        }

        // Notify the HR Admin / Creator
        // Guard: only insert if the creator's UserId actually exists in the Users table
        // (avoids FK_Notifications_Users_UserId violation if JWT token refers to a stale/re-seeded user)
        if (_currentUser.UserId.HasValue &&
            await _context.Users.AnyAsync(u => u.UserId == _currentUser.UserId.Value, ct))
        {
            var creatorNotif = new Notification
            {
                NotificationId = Guid.NewGuid(),
                UserId = _currentUser.UserId.Value,
                Title = "Employee Created Successfully",
                Message = $"New employee {employee.FirstName} {employee.LastName} ({employee.EmployeeCode}) has been successfully onboarded.",
                Type = NotificationType.NewJoinerToday,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(creatorNotif);
        }

        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<EmployeeDetailDto>.Ok(
            _mapper.Map<EmployeeDetailDto>(await _context.Employees
                .Include(e => e.Department).Include(e => e.Designation)
                .Include(e => e.Location).Include(e => e.Grade).Include(e => e.Band)
                .Include(e => e.JobFamily).Include(e => e.BusinessUnit)
                .Include(e => e.CostCenter).Include(e => e.Shift)
                .FirstAsync(e => e.EmployeeId == employee.EmployeeId, ct)),
            "Employee created successfully."));
    }

    [HttpPut("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeRequest request, CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<EmployeeDetailDto>.Fail("Employee not found."));

        var isHrAdminOrSuper = _currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin);
        if (!isHrAdminOrSuper && _currentUser.HasRole(RoleCodes.HRExecutive))
        {
            // HR Executive cannot modify DOB
            if (request.DateOfBirth.HasValue && request.DateOfBirth.Value != employee.DateOfBirth)
                return StatusCode(403, ApiResponse<EmployeeDetailDto>.Fail("Access Denied. Date of Birth can only be modified by an HR Admin or Super Admin."));

            // HR Executive cannot modify Employment details
            if (request.DeptId != employee.DeptId ||
                request.DesignationId != employee.DesignationId ||
                request.LocationId != employee.LocationId ||
                request.GradeId != employee.GradeId ||
                request.BandId != employee.BandId ||
                request.ShiftId != employee.ShiftId ||
                request.CostCenterId != employee.CostCenterId ||
                request.BusinessUnitId != employee.BusinessUnitId ||
                request.DivisionId != employee.DivisionId ||
                request.SubDeptId != employee.SubDeptId ||
                request.TeamId != employee.TeamId ||
                request.JobFamilyId != employee.JobFamilyId ||
                request.JobFunctionId != employee.JobFunctionId ||
                request.ProfitCenterId != employee.ProfitCenterId ||
                request.ReportingManagerId != employee.ReportingManagerId ||
                request.L2ReportingManagerId != employee.L2ReportingManagerId ||
                request.L3ReportingManagerId != employee.L3ReportingManagerId ||
                request.L4ReportingManagerId != employee.L4ReportingManagerId ||
                request.FunctionalManagerId != employee.FunctionalManagerId ||
                request.EmploymentType != employee.EmploymentType)
            {
                return StatusCode(403, ApiResponse<EmployeeDetailDto>.Fail("Access Denied. Employment and organizational fields can only be modified by an HR Admin or Super Admin."));
            }
        }

        // ─── Reporting Managers Validations ────────────────────────────────────
        if (request.ReportingManagerId.HasValue)
        {
            if (request.ReportingManagerId.Value == id)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as L1 Reporting Manager."));
            if (await IsCircularReportingAsync(id, request.ReportingManagerId.Value, ct))
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Circular reporting detected for L1 Reporting Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.ReportingManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("L1 Reporting Manager must be an active employee."));
        }
        if (request.L2ReportingManagerId.HasValue)
        {
            if (request.L2ReportingManagerId.Value == id)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as L2 Reporting Manager."));
            if (await IsCircularReportingAsync(id, request.L2ReportingManagerId.Value, ct))
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Circular reporting detected for L2 Reporting Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.L2ReportingManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("L2 Reporting Manager must be an active employee."));
        }
        if (request.L3ReportingManagerId.HasValue)
        {
            if (request.L3ReportingManagerId.Value == id)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as L3 Reporting Manager."));
            if (await IsCircularReportingAsync(id, request.L3ReportingManagerId.Value, ct))
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Circular reporting detected for L3 Reporting Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.L3ReportingManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("L3 Reporting Manager must be an active employee."));
        }
        if (request.L4ReportingManagerId.HasValue)
        {
            if (request.L4ReportingManagerId.Value == id)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as L4 Reporting Manager."));
            if (await IsCircularReportingAsync(id, request.L4ReportingManagerId.Value, ct))
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Circular reporting detected for L4 Reporting Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.L4ReportingManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("L4 Reporting Manager must be an active employee."));
        }
        if (request.FunctionalManagerId.HasValue)
        {
            if (request.FunctionalManagerId.Value == id)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cannot assign self as Functional Manager."));
            var active = await _context.Employees.AnyAsync(e => e.EmployeeId == request.FunctionalManagerId.Value && e.IsActive, ct);
            if (!active) return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Functional Manager must be an active employee."));
        }

        // ─── Notice Period Validation ──────────────────────────────────────────
        if (request.NoticePeriodDays < 0 || request.NoticePeriodDays > 365)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Notice period days must be between 0 and 365."));

        // ─── Employment Type Checks ────────────────────────────────────────────
        if (request.EmploymentType == EmploymentType.Contract)
        {
            if (!request.ContractEndDate.HasValue)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Contract End Date is required for Contract employment type."));
            if (request.ContractEndDate.Value <= employee.JoiningDate)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Contract End Date must be after joining date."));
        }
        else if (request.EmploymentType == EmploymentType.Intern)
        {
            if (!request.InternshipDurationMonths.HasValue)
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Internship duration is required for Intern employment type."));
        }

        // ─── Mandatory Enterprise Checks ───────────────────────────────────────
        if (!request.ShiftId.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Shift assignment is required."));
        if (!request.PayrollGroup.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Payroll Group mapping is required."));
        if (!request.GradeId.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Grade is required."));
        if (!request.CostCenterId.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Cost Center mapping is required."));

        // Preserve existing identity fields before mapping to handle missing/empty values correctly
        var existingAadharNumber = employee.AadharNumber;
        var existingAadharHash = employee.AadharHash;
        var existingPANNumber = employee.PANNumber;
        var existingPANHash = employee.PANHash;
        var existingEmployeeCode = employee.EmployeeCode;

        _mapper.Map(request, employee);

        // Employee ID update logic based on Category
        if (request.EmployeeCategory == "TCS Employee")
        {
            if (string.IsNullOrWhiteSpace(request.EmployeeCode))
            {
                return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("Employee ID is required for TCS Employees."));
            }

            if (request.EmployeeCode.Trim() != existingEmployeeCode)
            {
                var codeExists = await _context.Employees.AnyAsync(e => e.EmployeeId != id && e.EmployeeCode == request.EmployeeCode.Trim(), ct);
                if (codeExists)
                {
                    return Conflict(ApiResponse<EmployeeDetailDto>.Fail("Employee ID already exists."));
                }
                employee.EmployeeCode = request.EmployeeCode.Trim();
            }
            employee.EmployeeCategory = "TCS Employee";
        }
        else
        {
            // For MPOnline Employee or other categories, do not allow modifying the EmployeeCode
            employee.EmployeeCode = existingEmployeeCode;
            employee.EmployeeCategory = "MPOnline Employee";
        }

        // Personal Mobile uniqueness check
        if (!string.IsNullOrEmpty(request.PersonalPhone))
        {
            var phoneExists = await _context.Employees.AnyAsync(e => e.EmployeeId != id && e.PersonalPhone == request.PersonalPhone.Trim(), ct);
            if (phoneExists)
                return Conflict(ApiResponse<EmployeeDetailDto>.Fail("Personal mobile number already exists."));
        }

        // Aadhaar logic
        if (!string.IsNullOrEmpty(request.AadharNumber))
        {
            var cleanInput = request.AadharNumber.Trim();
            if (cleanInput.Contains('*'))
            {
                employee.AadharNumber = existingAadharNumber;
                employee.AadharHash = existingAadharHash;
            }
            else
            {
                var newHash = _encryption.HashValue(cleanInput);
                if (await _context.Employees.AnyAsync(e => e.EmployeeId != id && e.AadharHash == newHash, ct))
                    return Conflict(ApiResponse<EmployeeDetailDto>.Fail("An employee with this Aadhaar number already exists."));
                
                employee.AadharHash = newHash;
                employee.AadharNumber = _encryption.Encrypt(cleanInput);
            }
        }
        else
        {
            employee.AadharNumber = existingAadharNumber;
            employee.AadharHash = existingAadharHash;
        }

        // PAN logic
        if (!string.IsNullOrEmpty(request.PANNumber))
        {
            var cleanInput = request.PANNumber.Trim().ToUpper();
            if (cleanInput.Contains('*'))
            {
                employee.PANNumber = existingPANNumber;
                employee.PANHash = existingPANHash;
            }
            else
            {
                var newHash = _encryption.HashValue(cleanInput);
                if (await _context.Employees.AnyAsync(e => e.EmployeeId != id && e.PANHash == newHash, ct))
                    return Conflict(ApiResponse<EmployeeDetailDto>.Fail("An employee with this PAN number already exists."));
                
                employee.PANHash = newHash;
                employee.PANNumber = _encryption.Encrypt(cleanInput);
            }
        }
        else
        {
            employee.PANNumber = existingPANNumber;
            employee.PANHash = existingPANHash;
        }

        employee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        var updatedEmployee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.Location)
            .Include(e => e.CostCenter)
            .Include(e => e.ProfitCenter)
            .Include(e => e.BusinessUnit)
            .Include(e => e.Division)
            .Include(e => e.SubDepartment)
            .Include(e => e.Team)
            .Include(e => e.Grade)
            .Include(e => e.Band)
            .Include(e => e.JobFamily)
            .Include(e => e.JobFunction)
            .Include(e => e.ReportingManager)
            .Include(e => e.L2ReportingManager)
            .Include(e => e.FunctionalManager)
            .Include(e => e.Shift)
            .FirstOrDefaultAsync(e => e.EmployeeId == id, ct);

        return Ok(ApiResponse<EmployeeDetailDto>.Ok(_mapper.Map<EmployeeDetailDto>(updatedEmployee)));
    }

    [HttpPut("{id:guid}/photo")]
    public async Task<ActionResult<ApiResponse<string>>> UploadPhoto(Guid id, IFormFile file, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var hasEditPermission = _currentUser.HasPermission(PermissionCodes.Employee.Edit);

        if (!isSelf && !hasEditPermission)
        {
            return StatusCode(403, ApiResponse<string>.Fail("Access Denied. You do not have permission to edit this profile photo."));
        }

        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<string>.Fail("Employee not found."));
        if (!fileService.IsValidExtension(file.FileName)) return BadRequest(ApiResponse<string>.Fail("Invalid file type."));
        if (!fileService.IsValidSize(file.Length)) return BadRequest(ApiResponse<string>.Fail("File too large."));
        var path = await fileService.SaveAsync(file.OpenReadStream(), file.FileName, $"employees/{id}/photos", ct);
        employee.ProfilePhoto = path;
        employee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<string>.Ok(path));
    }

    [HttpPut("{id:guid}/status")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> UpdateStatus(Guid id, [FromBody] UpdateEmployeeStatusRequest request, CancellationToken ct)
    {
        if (!_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin))
        {
            return StatusCode(403, ApiResponse<object>.Fail("Access Denied. Only HR Admins or Super Admins can modify employee status."));
        }

        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        employee.EmploymentStatus = request.Status;
        employee.IsActive = request.Status == EmploymentStatus.Active;
        employee.UpdatedAt = DateTime.UtcNow;

        if (!employee.IsActive)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == id, ct);
            if (user != null)
            {
                user.IsActive = false;
                user.RefreshToken = null;
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(-1);
                user.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Status updated."));
    }

    [HttpPut("{id:guid}/confirm")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmEmployee(Guid id, CancellationToken ct)
    {
        if (!_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.SuperAdmin))
        {
            return StatusCode(403, ApiResponse<object>.Fail("Access Denied. Only HR Admins or Super Admins can confirm employees."));
        }

        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        employee.ConfirmationDate = DateOnly.FromDateTime(DateTime.UtcNow);
        employee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Employee confirmed successfully."));
    }

    // ─── Documents ────────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/documents")]
    public async Task<ActionResult<ApiResponse<List<EmployeeDocumentDto>>>> GetDocuments(Guid id, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var hasViewPermission = _currentUser.HasPermission(PermissionCodes.Employee.View);
        if (!isSelf && !hasViewPermission)
        {
            return StatusCode(403, ApiResponse<List<EmployeeDocumentDto>>.Fail("Access Denied. You do not have permission to view these details."));
        }

        var docs = await _context.EmployeeDocuments.Where(d => d.EmployeeId == id).ToListAsync(ct);
        return Ok(ApiResponse<List<EmployeeDocumentDto>>.Ok(_mapper.Map<List<EmployeeDocumentDto>>(docs)));
    }

    [HttpPost("{id:guid}/documents")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<EmployeeDocumentDto>>> UploadDocument(
        Guid id, 
        IFormFile file, 
        [FromForm] DocumentType docType, 
        [FromForm] string? documentNumber,
        [FromForm] DateOnly? expiryDate,
        [FromForm] string? remarks,
        CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<EmployeeDocumentDto>.Fail("Employee not found."));
        if (!_fileService.IsValidExtension(file.FileName)) return BadRequest(ApiResponse<EmployeeDocumentDto>.Fail("Invalid file type."));
        if (!_fileService.IsValidSize(file.Length)) return BadRequest(ApiResponse<EmployeeDocumentDto>.Fail("File too large."));

        var path = await _fileService.SaveAsync(file.OpenReadStream(), file.FileName, $"employees/{id}/documents", ct);
        var doc = new EmployeeDocument
        {
            EmployeeId = id,
            DocType = docType,
            DocName = file.FileName,
            FilePath = path,
            FileSize = file.Length,
            DocumentNumber = documentNumber,
            ExpiryDate = expiryDate,
            Remarks = remarks
        };
        _context.EmployeeDocuments.Add(doc);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<EmployeeDocumentDto>.Ok(_mapper.Map<EmployeeDocumentDto>(doc)));
    }

    [HttpPut("{id:guid}/documents/{docId:guid}/verify")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> VerifyDocument(Guid id, Guid docId, CancellationToken ct)
    {
        var doc = await _context.EmployeeDocuments.FirstOrDefaultAsync(d => d.DocId == docId && d.EmployeeId == id, ct);
        if (doc == null) return NotFound(ApiResponse<object>.Fail("Document not found."));
        doc.IsVerified = true;
        doc.VerifiedAt = DateTime.UtcNow;
        doc.VerifiedBy = _currentUser.UserId;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Document verified."));
    }

    // ─── Bank Details ─────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/bank-details")]
    public async Task<ActionResult<ApiResponse<List<BankDetailDto>>>> GetBankDetails(Guid id, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var hasViewPermission = _currentUser.HasPermission(PermissionCodes.Employee.View);
        if (!isSelf && !hasViewPermission)
        {
            return StatusCode(403, ApiResponse<List<BankDetailDto>>.Fail("Access Denied. You do not have permission to view these details."));
        }

        var hasSensitivePermission = _currentUser.HasPermission(PermissionCodes.Security.ViewSensitiveData);
        var banks = await _context.EmployeeBankDetails.Where(b => b.EmployeeId == id && b.IsActive).ToListAsync(ct);
        var dtos = banks.Select(b =>
        {
            var dto = _mapper.Map<BankDetailDto>(b);
            if (!string.IsNullOrEmpty(b.AccountNumber))
            {
                try
                {
                    var decrypted = _encryption.Decrypt(b.AccountNumber);
                    dto.MaskedAccountNumber = hasSensitivePermission ? decrypted : _encryption.MaskValue(decrypted);
                }
                catch
                {
                    dto.MaskedAccountNumber = "********";
                }
            }
            else
            {
                dto.MaskedAccountNumber = string.Empty;
            }
            return dto;
        }).ToList();
        return Ok(ApiResponse<List<BankDetailDto>>.Ok(dtos));
    }

    [HttpPost("{id:guid}/bank-details")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<BankDetailDto>>> AddBankDetail(Guid id, [FromBody] AddBankDetailRequest request, CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<BankDetailDto>.Fail("Employee not found."));

        if (request.IsPrimary)
        {
            var existing = await _context.EmployeeBankDetails.Where(b => b.EmployeeId == id && b.IsPrimary).ToListAsync(ct);
            existing.ForEach(b => b.IsPrimary = false);
        }

        var bank = new EmployeeBankDetail
        {
            EmployeeId = id,
            BankName = request.BankName,
            AccountNumber = _encryption.Encrypt(request.AccountNumber),
            IFSCCode = request.IFSCCode.ToUpper(),
            AccountType = request.AccountType,
            IsPrimary = request.IsPrimary
        };
        _context.EmployeeBankDetails.Add(bank);
        await _context.SaveChangesAsync(ct);

        var hasSensitivePermission = _currentUser.HasPermission(PermissionCodes.Security.ViewSensitiveData);
        var dto = _mapper.Map<BankDetailDto>(bank);
        dto.MaskedAccountNumber = hasSensitivePermission ? request.AccountNumber : _encryption.MaskValue(request.AccountNumber);
        return Ok(ApiResponse<BankDetailDto>.Ok(dto));
    }

    [HttpDelete("{id:guid}/bank-details/{bankId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteBankDetail(Guid id, Guid bankId, CancellationToken ct)
    {
        var bank = await _context.EmployeeBankDetails.FirstOrDefaultAsync(b => b.BankDetailId == bankId && b.EmployeeId == id, ct);
        if (bank == null) return NotFound(ApiResponse<object>.Fail("Bank detail not found."));
        bank.IsActive = false;
        bank.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Bank detail removed."));
    }

    // ─── Education ────────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/educations")]
    public async Task<ActionResult<ApiResponse<List<EducationDto>>>> GetEducations(Guid id, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var hasViewPermission = _currentUser.HasPermission(PermissionCodes.Employee.View);
        if (!isSelf && !hasViewPermission)
        {
            return StatusCode(403, ApiResponse<List<EducationDto>>.Fail("Access Denied. You do not have permission to view these details."));
        }

        var records = await _context.EmployeeEducations.Where(e => e.EmployeeId == id).ToListAsync(ct);
        return Ok(ApiResponse<List<EducationDto>>.Ok(_mapper.Map<List<EducationDto>>(records)));
    }

    [HttpPost("{id:guid}/educations")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<EducationDto>>> AddEducation(Guid id, [FromBody] AddEducationRequest request, CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<EducationDto>.Fail("Employee not found."));
        var edu = _mapper.Map<EmployeeEducation>(request);
        edu.EmployeeId = id;
        _context.EmployeeEducations.Add(edu);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<EducationDto>.Ok(_mapper.Map<EducationDto>(edu)));
    }

    [HttpPut("{id:guid}/educations/{eduId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<EducationDto>>> UpdateEducation(Guid id, Guid eduId, [FromBody] UpdateEducationRequest request, CancellationToken ct)
    {
        var edu = await _context.EmployeeEducations.FirstOrDefaultAsync(e => e.EduId == eduId && e.EmployeeId == id, ct);
        if (edu == null) return NotFound(ApiResponse<EducationDto>.Fail("Education record not found."));
        _mapper.Map(request, edu);
        edu.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<EducationDto>.Ok(_mapper.Map<EducationDto>(edu)));
    }

    [HttpDelete("{id:guid}/educations/{eduId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteEducation(Guid id, Guid eduId, CancellationToken ct)
    {
        var edu = await _context.EmployeeEducations.FirstOrDefaultAsync(e => e.EduId == eduId && e.EmployeeId == id, ct);
        if (edu == null) return NotFound(ApiResponse<object>.Fail("Education record not found."));
        _context.EmployeeEducations.Remove(edu);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Education record deleted."));
    }

    // ─── Experience ───────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/experiences")]
    public async Task<ActionResult<ApiResponse<List<ExperienceDto>>>> GetExperiences(Guid id, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var hasViewPermission = _currentUser.HasPermission(PermissionCodes.Employee.View);
        if (!isSelf && !hasViewPermission)
        {
            return StatusCode(403, ApiResponse<List<ExperienceDto>>.Fail("Access Denied. You do not have permission to view these details."));
        }

        var records = await _context.EmployeeExperiences.Where(e => e.EmployeeId == id).ToListAsync(ct);
        return Ok(ApiResponse<List<ExperienceDto>>.Ok(_mapper.Map<List<ExperienceDto>>(records)));
    }

    [HttpPost("{id:guid}/experiences")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<ExperienceDto>>> AddExperience(Guid id, [FromBody] AddExperienceRequest request, CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<ExperienceDto>.Fail("Employee not found."));
        var exp = _mapper.Map<EmployeeExperience>(request);
        exp.EmployeeId = id;
        _context.EmployeeExperiences.Add(exp);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<ExperienceDto>.Ok(_mapper.Map<ExperienceDto>(exp)));
    }

    [HttpPut("{id:guid}/experiences/{expId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<ExperienceDto>>> UpdateExperience(Guid id, Guid expId, [FromBody] UpdateExperienceRequest request, CancellationToken ct)
    {
        var exp = await _context.EmployeeExperiences.FirstOrDefaultAsync(e => e.ExpId == expId && e.EmployeeId == id, ct);
        if (exp == null) return NotFound(ApiResponse<ExperienceDto>.Fail("Experience record not found."));
        _mapper.Map(request, exp);
        exp.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<ExperienceDto>.Ok(_mapper.Map<ExperienceDto>(exp)));
    }

    [HttpDelete("{id:guid}/experiences/{expId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteExperience(Guid id, Guid expId, CancellationToken ct)
    {
        var exp = await _context.EmployeeExperiences.FirstOrDefaultAsync(e => e.ExpId == expId && e.EmployeeId == id, ct);
        if (exp == null) return NotFound(ApiResponse<object>.Fail("Experience record not found."));
        _context.EmployeeExperiences.Remove(exp);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Experience record deleted."));
    }

    // ─── PF Nominees ─────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/nominees")]
    public async Task<ActionResult<ApiResponse<List<PFNomineeDto>>>> GetNominees(Guid id, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var hasViewPermission = _currentUser.HasPermission(PermissionCodes.Employee.View);
        if (!isSelf && !hasViewPermission)
        {
            return StatusCode(403, ApiResponse<List<PFNomineeDto>>.Fail("Access Denied. You do not have permission to view these details."));
        }

        var nominees = await _context.PFNominees.Where(n => n.EmployeeId == id).ToListAsync(ct);
        var hasSensitivePermission = _currentUser.HasPermission(PermissionCodes.Security.ViewSensitiveData);
        var nomineeDtos = nominees.Select(n =>
        {
            var dto = _mapper.Map<PFNomineeDto>(n);
            if (!string.IsNullOrEmpty(n.AadharNumber))
            {
                try
                {
                    var decrypted = _encryption.Decrypt(n.AadharNumber);
                    dto.AadharNumber = hasSensitivePermission ? decrypted : _encryption.MaskValue(decrypted);
                }
                catch
                {
                    dto.AadharNumber = "********";
                }
            }
            return dto;
        }).ToList();
        return Ok(ApiResponse<List<PFNomineeDto>>.Ok(nomineeDtos));
    }

    [HttpPost("{id:guid}/nominees")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<PFNomineeDto>>> AddNominee(Guid id, [FromBody] AddPFNomineeRequest request, CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<PFNomineeDto>.Fail("Employee not found."));
        var nominee = _mapper.Map<PFNominee>(request);
        nominee.EmployeeId = id;
        if (!string.IsNullOrEmpty(request.AadharNumber))
        {
            nominee.AadharNumber = _encryption.Encrypt(request.AadharNumber);
        }
        _context.PFNominees.Add(nominee);
        await _context.SaveChangesAsync(ct);
        
        var hasSensitivePermission = _currentUser.HasPermission(PermissionCodes.Security.ViewSensitiveData);
        var dto = _mapper.Map<PFNomineeDto>(nominee);
        if (!string.IsNullOrEmpty(nominee.AadharNumber))
        {
            try
            {
                var decrypted = _encryption.Decrypt(nominee.AadharNumber);
                dto.AadharNumber = hasSensitivePermission ? decrypted : _encryption.MaskValue(decrypted);
            }
            catch
            {
                dto.AadharNumber = "********";
            }
        }
        return Ok(ApiResponse<PFNomineeDto>.Ok(dto));
    }

    [HttpPut("{id:guid}/nominees/{nomineeId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<PFNomineeDto>>> UpdateNominee(Guid id, Guid nomineeId, [FromBody] UpdatePFNomineeRequest request, CancellationToken ct)
    {
        var nominee = await _context.PFNominees.FirstOrDefaultAsync(n => n.NomineeId == nomineeId && n.EmployeeId == id, ct);
        if (nominee == null) return NotFound(ApiResponse<PFNomineeDto>.Fail("Nominee not found."));
        _mapper.Map(request, nominee);
        if (!string.IsNullOrEmpty(request.AadharNumber))
        {
            nominee.AadharNumber = _encryption.Encrypt(request.AadharNumber);
        }
        else
        {
            nominee.AadharNumber = null;
        }
        nominee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        
        var hasSensitivePermission = _currentUser.HasPermission(PermissionCodes.Security.ViewSensitiveData);
        var dto = _mapper.Map<PFNomineeDto>(nominee);
        if (!string.IsNullOrEmpty(nominee.AadharNumber))
        {
            try
            {
                var decrypted = _encryption.Decrypt(nominee.AadharNumber);
                dto.AadharNumber = hasSensitivePermission ? decrypted : _encryption.MaskValue(decrypted);
            }
            catch
            {
                dto.AadharNumber = "********";
            }
        }
        return Ok(ApiResponse<PFNomineeDto>.Ok(dto));
    }

    [HttpDelete("{id:guid}/nominees/{nomineeId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteNominee(Guid id, Guid nomineeId, CancellationToken ct)
    {
        var nominee = await _context.PFNominees.FirstOrDefaultAsync(n => n.NomineeId == nomineeId && n.EmployeeId == id, ct);
        if (nominee == null) return NotFound(ApiResponse<object>.Fail("Nominee not found."));
        _context.PFNominees.Remove(nominee);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Nominee deleted."));
    }

    [HttpDelete("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteEmployee(Guid id, CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        
        employee.IsActive = false;
        employee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Employee soft-deleted successfully."));
    }

    // ─── Document Download ────────────────────────────────────────────────────

    [HttpGet("{id:guid}/documents/{docId:guid}/download")]
    public async Task<IActionResult> DownloadDocument(Guid id, Guid docId, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var hasViewPermission = _currentUser.HasPermission(PermissionCodes.Employee.View);
        if (!isSelf && !hasViewPermission)
        {
            return StatusCode(403);
        }

        var doc = await _context.EmployeeDocuments.FirstOrDefaultAsync(d => d.DocId == docId && d.EmployeeId == id, ct);
        if (doc == null) return NotFound();
        if (!System.IO.File.Exists(doc.FilePath))
            return NotFound("File not found on disk.");
        var contentType = doc.DocName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)
            ? "application/pdf"
            : doc.DocName.EndsWith(".png", StringComparison.OrdinalIgnoreCase) || doc.DocName.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || doc.DocName.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase)
                ? "image/jpeg"
                : "application/octet-stream";
        var fileBytes = await System.IO.File.ReadAllBytesAsync(doc.FilePath, ct);
        return File(fileBytes, contentType, doc.DocName);
    }

    // ─── My Profile (ESS) ─────────────────────────────────────────────────────

    [HttpGet("my-profile")]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> GetMyProfile(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<EmployeeDetailDto>.Fail("No employee profile linked to this account."));

        return await GetEmployee(_currentUser.EmployeeId.Value, ct);
    }

    [HttpPut("my-profile")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateMyProfile([FromBody] SelfUpdateEmployeeRequest request, CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile linked."));

        var employee = await _context.Employees.FindAsync(new object[] { _currentUser.EmployeeId.Value }, ct);
        if (employee == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));

        employee.PersonalEmail = request.PersonalEmail;
        employee.PersonalPhone = request.PersonalPhone;
        employee.WhatsAppNumber = request.WhatsAppNumber;
        employee.AlternateMobile = request.AlternateMobile;
        employee.EmergencyContactName = request.EmergencyContactName;
        employee.EmergencyContactPhone = request.EmergencyContactPhone;
        employee.EmergencyContactRelation = request.EmergencyContactRelation;
        employee.AlternateEmergencyContactPhone = request.AlternateEmergencyContactPhone;
        employee.CurrentAddress = request.CurrentAddress;
        employee.CurrentAddressLine1 = request.CurrentAddressLine1;
        employee.CurrentAddressLine2 = request.CurrentAddressLine2;
        employee.CurrentCity = request.CurrentCity;
        employee.CurrentDistrict = request.CurrentDistrict;
        employee.CurrentState = request.CurrentState;
        employee.CurrentPincode = request.CurrentPincode;
        employee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Profile updated successfully."));
    }

    // ─── Org Chart & Directory ────────────────────────────────────────────────

    [HttpGet("org-chart")]
    [Filters.RequirePermission(PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<List<OrgChartNodeDto>>>> GetOrgChart(CancellationToken ct)
    {
        var employees = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Where(e => e.IsActive && (_currentUser.CompanyId == null || e.CompanyId == _currentUser.CompanyId))
            .Select(e => new OrgChartNodeDto
            {
                EmployeeId = e.EmployeeId,
                FullName = $"{e.FirstName} {e.LastName}",
                ProfilePhoto = e.ProfilePhoto,
                DesignationTitle = e.Designation.Title,
                DepartmentName = e.Department.DeptName,
                ReportingManagerId = e.ReportingManagerId
            })
            .ToListAsync(ct);

        var lookup = employees.ToDictionary(e => e.EmployeeId);
        var roots = new List<OrgChartNodeDto>();

        foreach (var emp in employees)
        {
            if (emp.ReportingManagerId.HasValue && lookup.TryGetValue(emp.ReportingManagerId.Value, out var manager))
                manager.DirectReports.Add(emp);
            else
                roots.Add(emp);
        }
        return Ok(ApiResponse<List<OrgChartNodeDto>>.Ok(roots));
    }

    [HttpGet("directory")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<DirectoryEntryDto>>>> GetDirectory([FromQuery] string? search, CancellationToken ct)
    {
        var query = _context.Employees
            .Include(e => e.Department).Include(e => e.Designation).Include(e => e.Location)
            .Where(e => e.IsActive && (_currentUser.CompanyId == null || e.CompanyId == _currentUser.CompanyId))
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(e => e.FirstName.Contains(search) || e.LastName.Contains(search) || e.Department.DeptName.Contains(search));

        var employees = await query.OrderBy(e => e.FirstName).Take(100).ToListAsync(ct);
        return Ok(ApiResponse<List<DirectoryEntryDto>>.Ok(_mapper.Map<List<DirectoryEntryDto>>(employees)));
    }

    // ─── Salary History ───────────────────────────────────────────────────────

    [HttpGet("{id:guid}/salary-history")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetSalaryHistory(Guid id, CancellationToken ct)
    {
        var isSelf = _currentUser.EmployeeId == id;
        var isEmployee = _currentUser.HasRole(RoleCodes.Employee);
        var hasPayrollView = _currentUser.HasPermission(PermissionCodes.Payroll.View);

        if (isEmployee && !isSelf)
        {
            return StatusCode(403, ApiResponse<List<object>>.Fail("Access Denied. Employees can only view their own salary history."));
        }

        if (!isSelf && !hasPayrollView)
        {
            return StatusCode(403, ApiResponse<List<object>>.Fail("Access Denied. You do not have permission to view salary history."));
        }

        var history = await _context.EmployeeSalaries
            .Where(s => s.EmployeeId == id)
            .OrderByDescending(s => s.EffectiveFrom)
            .Select(s => new
            {
                s.EmpSalaryId,
                s.GrossCTC,
                s.BasicSalary,
                s.EffectiveFrom,
                s.EffectiveTo,
                s.RevisionReason,
                s.IsActive
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<object>>.Ok(history.Cast<object>().ToList()));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<string> GenerateEmployeeCodeAsync(Guid companyId, CancellationToken ct)
    {
        var prefix = await _context.SystemSettings
            .Where(s => s.CompanyId == companyId && s.SettingKey == SystemSettingKeys.EmployeeIdPrefix)
            .Select(s => s.SettingValue)
            .FirstOrDefaultAsync(ct) ?? "EMP";

        var maxCode = await _context.Employees
            .Where(e => e.CompanyId == companyId && e.EmployeeCode.StartsWith(prefix))
            .Select(e => e.EmployeeCode)
            .OrderByDescending(c => c)
            .FirstOrDefaultAsync(ct);

        var nextNum = 1;
        if (maxCode != null && int.TryParse(maxCode[prefix.Length..], out var current))
            nextNum = current + 1;

        return $"{prefix}{nextNum:D4}";
    }

    private static string GenerateInitialPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 10).Select(s => s[random.Next(s.Length)]).ToArray());
    }

    private async Task<bool> IsCircularReportingAsync(Guid employeeId, Guid managerId, CancellationToken ct)
    {
        if (employeeId == managerId) return true;
        var currentId = managerId;
        var visited = new HashSet<Guid> { employeeId };

        for (int i = 0; i < 10; i++)
        {
            if (visited.Contains(currentId)) return true;
            visited.Add(currentId);

            var parentId = await _context.Employees
                .Where(e => e.EmployeeId == currentId)
                .Select(e => e.ReportingManagerId)
                .FirstOrDefaultAsync(ct);

            if (!parentId.HasValue) break;
            currentId = parentId.Value;
        }
        return false;
    }

    private IFileService fileService => _fileService;
}

public record UpdateEmployeeStatusRequest(EmploymentStatus Status);
