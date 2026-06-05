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
            .Where(e => e.IsActive)
            .AsQueryable();

        // Data scoping by role
        if (_currentUser.HasRole(RoleCodes.DeptManager) && !_currentUser.HasAnyRole(RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.SuperAdmin))
            query = query.Where(e => e.ReportingManagerId == _currentUser.EmployeeId);

        if (_currentUser.CompanyId.HasValue)
            query = query.Where(e => e.CompanyId == _currentUser.CompanyId);

        if (!string.IsNullOrEmpty(request.Search))
            query = query.Where(e => e.FirstName.Contains(request.Search) || e.LastName.Contains(request.Search) ||
                e.EmployeeCode.Contains(request.Search) || (e.OfficialEmail != null && e.OfficialEmail.Contains(request.Search)));

        if (request.DeptId.HasValue) query = query.Where(e => e.DeptId == request.DeptId);
        if (request.LocationId.HasValue) query = query.Where(e => e.LocationId == request.LocationId);
        if (request.DesignationId.HasValue) query = query.Where(e => e.DesignationId == request.DesignationId);
        if (request.Status.HasValue) query = query.Where(e => e.EmploymentStatus == request.Status);
        if (request.Type.HasValue) query = query.Where(e => e.EmploymentType == request.Type);
        if (request.ReportingManagerId.HasValue) query = query.Where(e => e.ReportingManagerId == request.ReportingManagerId);

        var total = await query.CountAsync(ct);
        var employees = await query
            .OrderBy(e => e.FirstName).ThenBy(e => e.LastName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return Ok(ApiResponse<List<EmployeeListDto>>.PagedOk(_mapper.Map<List<EmployeeListDto>>(employees), request.Page, request.PageSize, total));
    }

    [HttpGet("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> GetEmployee(Guid id, CancellationToken ct)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.Location)
            .Include(e => e.CostCenter)
            .Include(e => e.ReportingManager)
            .Include(e => e.Documents)
            .Include(e => e.BankDetails)
            .Include(e => e.Educations)
            .Include(e => e.Experiences)
            .Include(e => e.PFNominees)
            .FirstOrDefaultAsync(e => e.EmployeeId == id, ct);

        if (employee == null) return NotFound(ApiResponse<EmployeeDetailDto>.Fail("Employee not found."));

        var dto = _mapper.Map<EmployeeDetailDto>(employee);
        dto.MaskedAadhar = !string.IsNullOrEmpty(employee.AadharNumber) ? _encryption.MaskValue(employee.AadharNumber) : null;
        dto.MaskedPAN = !string.IsNullOrEmpty(employee.PANNumber) ? _encryption.MaskValue(employee.PANNumber, 4) : null;

        foreach (var bank in dto.BankDetails)
        {
            var raw = employee.BankDetails.FirstOrDefault(b => b.BankDetailId == bank.BankDetailId);
            if (raw != null) bank.MaskedAccountNumber = _encryption.MaskValue(raw.AccountNumber);
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

        var employee = _mapper.Map<Employee>(request);
        employee.CompanyId = company.CompanyId;
        employee.EmployeeCode = await GenerateEmployeeCodeAsync(company.CompanyId, ct);
        employee.ProbationEndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(request.ProbationPeriodDays));

        if (!string.IsNullOrEmpty(request.AadharNumber))
            employee.AadharNumber = _encryption.Encrypt(request.AadharNumber);
        if (!string.IsNullOrEmpty(request.PANNumber))
            employee.PANNumber = _encryption.Encrypt(request.PANNumber);

        _context.Employees.Add(employee);

        if (request.CreateUserAccount)
        {
            var password = request.InitialPassword ?? GenerateInitialPassword();
            var user = new User
            {
                EmployeeId = employee.EmployeeId,
                Username = request.OfficialEmail.Split('@')[0].ToLower(),
                Email = request.OfficialEmail,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12),
                PasswordSalt = "",
                MustChangePassword = true
            };

            // Assign default EMPLOYEE role
            var employeeRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == RoleCodes.Employee, ct);
            if (employeeRole != null)
                user.UserRoles.Add(new UserRole { RoleId = employeeRole.RoleId });

            _context.Users.Add(user);
        }

        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<EmployeeDetailDto>.Ok(
            _mapper.Map<EmployeeDetailDto>(await _context.Employees
                .Include(e => e.Department).Include(e => e.Designation)
                .Include(e => e.Location).FirstAsync(e => e.EmployeeId == employee.EmployeeId, ct)),
            "Employee created successfully."));
    }

    [HttpPut("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeRequest request, CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<EmployeeDetailDto>.Fail("Employee not found."));
        _mapper.Map(request, employee);
        employee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<EmployeeDetailDto>.Ok(_mapper.Map<EmployeeDetailDto>(employee)));
    }

    [HttpPut("{id:guid}/photo")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<string>>> UploadPhoto(Guid id, IFormFile file, CancellationToken ct)
    {
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
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        employee.EmploymentStatus = request.Status;
        employee.IsActive = request.Status == EmploymentStatus.Active;
        employee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Status updated."));
    }

    [HttpPut("{id:guid}/confirm")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmEmployee(Guid id, CancellationToken ct)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, ct);
        if (employee == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        employee.ConfirmationDate = DateOnly.FromDateTime(DateTime.UtcNow);
        employee.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Employee confirmed successfully."));
    }

    // ─── Documents ────────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/documents")]
    [Filters.RequirePermission(PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<List<EmployeeDocumentDto>>>> GetDocuments(Guid id, CancellationToken ct)
    {
        var docs = await _context.EmployeeDocuments.Where(d => d.EmployeeId == id).ToListAsync(ct);
        return Ok(ApiResponse<List<EmployeeDocumentDto>>.Ok(_mapper.Map<List<EmployeeDocumentDto>>(docs)));
    }

    [HttpPost("{id:guid}/documents")]
    [Filters.RequirePermission(PermissionCodes.Employee.Edit)]
    public async Task<ActionResult<ApiResponse<EmployeeDocumentDto>>> UploadDocument(Guid id, IFormFile file, [FromForm] DocumentType docType, CancellationToken ct)
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
            FileSize = file.Length
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
    [Filters.RequirePermission(PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<List<BankDetailDto>>>> GetBankDetails(Guid id, CancellationToken ct)
    {
        var banks = await _context.EmployeeBankDetails.Where(b => b.EmployeeId == id && b.IsActive).ToListAsync(ct);
        var dtos = banks.Select(b =>
        {
            var dto = _mapper.Map<BankDetailDto>(b);
            dto.MaskedAccountNumber = _encryption.MaskValue(b.AccountNumber);
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

        var dto = _mapper.Map<BankDetailDto>(bank);
        dto.MaskedAccountNumber = _encryption.MaskValue(bank.AccountNumber);
        return Ok(ApiResponse<BankDetailDto>.Ok(dto));
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
        employee.EmergencyContactName = request.EmergencyContactName;
        employee.EmergencyContactPhone = request.EmergencyContactPhone;
        employee.EmergencyContactRelation = request.EmergencyContactRelation;
        employee.CurrentAddress = request.CurrentAddress;
        employee.CurrentCity = request.CurrentCity;
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
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetSalaryHistory(Guid id, CancellationToken ct)
    {
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

    private IFileService fileService => _fileService;
}

public record UpdateEmployeeStatusRequest(EmploymentStatus Status);
