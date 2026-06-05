using AutoMapper;
using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/organization")]
[ApiVersion("1.0")]
[Authorize]
public class OrganizationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;

    public OrganizationController(AppDbContext context, IMapper mapper, ICurrentUserService currentUser)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
    }

    // ─── Company ──────────────────────────────────────────────────────────────

    [HttpGet("company")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.View)]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> GetCompany(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var company = companyId.HasValue
            ? await _context.Companies.FirstOrDefaultAsync(c => c.CompanyId == companyId, ct)
            : await _context.Companies.FirstOrDefaultAsync(ct);

        if (company == null) return NotFound(ApiResponse<CompanyDto>.Fail("Company not found."));
        return Ok(ApiResponse<CompanyDto>.Ok(_mapper.Map<CompanyDto>(company)));
    }

    [HttpPut("company")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> UpdateCompany([FromBody] UpdateCompanyRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return NotFound(ApiResponse<CompanyDto>.Fail("Company not found."));
        _mapper.Map(request, company);
        company.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<CompanyDto>.Ok(_mapper.Map<CompanyDto>(company)));
    }

    [HttpPost("company/logo")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<string>>> UploadLogo(IFormFile file, [FromServices] IFileService fileService, CancellationToken ct)
    {
        if (!fileService.IsValidExtension(file.FileName)) return BadRequest(ApiResponse<string>.Fail("Invalid file type."));
        if (!fileService.IsValidSize(file.Length)) return BadRequest(ApiResponse<string>.Fail("File too large."));
        var path = await fileService.SaveAsync(file.OpenReadStream(), file.FileName, "company/logos", ct);
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company != null) { company.Logo = path; await _context.SaveChangesAsync(ct); }
        return Ok(ApiResponse<string>.Ok(path));
    }

    // ─── Departments ──────────────────────────────────────────────────────────

    [HttpGet("departments")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.View, PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<List<DepartmentDto>>>> GetDepartments(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var departments = await _context.Departments
            .Include(d => d.Company)
            .Include(d => d.ParentDept)
            .Include(d => d.HODEmployee)
            .Include(d => d.Employees)
            .Where(d => !companyId.HasValue || d.CompanyId == companyId)
            .Where(d => d.IsActive)
            .ToListAsync(ct);

        var deptDtos = _mapper.Map<List<DepartmentDto>>(departments);
        return Ok(ApiResponse<List<DepartmentDto>>.Ok(BuildDepartmentTree(deptDtos)));
    }

    [HttpPost("departments")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> CreateDepartment([FromBody] CreateDepartmentRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<DepartmentDto>.Fail("Company not configured."));

        if (await _context.Departments.AnyAsync(d => d.DeptCode == request.DeptCode, ct))
            return Conflict(ApiResponse<DepartmentDto>.Fail("Department code already exists."));

        var dept = _mapper.Map<Department>(request);
        dept.CompanyId = company.CompanyId;
        _context.Departments.Add(dept);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<DepartmentDto>.Ok(_mapper.Map<DepartmentDto>(dept)));
    }

    [HttpPut("departments/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentRequest request, CancellationToken ct)
    {
        var dept = await _context.Departments.FindAsync(new object[] { id }, ct);
        if (dept == null) return NotFound(ApiResponse<DepartmentDto>.Fail("Department not found."));
        _mapper.Map(request, dept);
        dept.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<DepartmentDto>.Ok(_mapper.Map<DepartmentDto>(dept)));
    }

    [HttpDelete("departments/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteDepartment(Guid id, CancellationToken ct)
    {
        var dept = await _context.Departments.FindAsync(new object[] { id }, ct);
        if (dept == null) return NotFound(ApiResponse<object>.Fail("Department not found."));
        if (await _context.Employees.AnyAsync(e => e.DeptId == id && e.IsActive, ct))
            return Conflict(ApiResponse<object>.Fail("Cannot delete department with active employees."));
        dept.IsActive = false;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Department deactivated."));
    }

    // ─── Designations ─────────────────────────────────────────────────────────

    [HttpGet("designations")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.View, PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<List<DesignationDto>>>> GetDesignations(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var designations = await _context.Designations
            .Include(d => d.Employees)
            .Where(d => !companyId.HasValue || d.CompanyId == companyId)
            .Where(d => d.IsActive)
            .OrderBy(d => d.Level)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<DesignationDto>>.Ok(_mapper.Map<List<DesignationDto>>(designations)));
    }

    [HttpPost("designations")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<DesignationDto>>> CreateDesignation([FromBody] CreateDesignationRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<DesignationDto>.Fail("Company not configured."));
        var designation = _mapper.Map<Designation>(request);
        designation.CompanyId = company.CompanyId;
        _context.Designations.Add(designation);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<DesignationDto>.Ok(_mapper.Map<DesignationDto>(designation)));
    }

    [HttpPut("designations/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<DesignationDto>>> UpdateDesignation(Guid id, [FromBody] UpdateDesignationRequest request, CancellationToken ct)
    {
        var designation = await _context.Designations.FindAsync(new object[] { id }, ct);
        if (designation == null) return NotFound(ApiResponse<DesignationDto>.Fail("Designation not found."));
        _mapper.Map(request, designation);
        designation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<DesignationDto>.Ok(_mapper.Map<DesignationDto>(designation)));
    }

    // ─── Locations ────────────────────────────────────────────────────────────

    [HttpGet("locations")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.View, PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<List<LocationDto>>>> GetLocations(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var locations = await _context.Locations
            .Include(l => l.Employees)
            .Where(l => !companyId.HasValue || l.CompanyId == companyId)
            .Where(l => l.IsActive)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<LocationDto>>.Ok(_mapper.Map<List<LocationDto>>(locations)));
    }

    [HttpPost("locations")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<LocationDto>>> CreateLocation([FromBody] CreateLocationRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<LocationDto>.Fail("Company not configured."));
        var location = _mapper.Map<Location>(request);
        location.CompanyId = company.CompanyId;
        _context.Locations.Add(location);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<LocationDto>.Ok(_mapper.Map<LocationDto>(location)));
    }

    [HttpPut("locations/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<LocationDto>>> UpdateLocation(Guid id, [FromBody] UpdateLocationRequest request, CancellationToken ct)
    {
        var location = await _context.Locations.FindAsync(new object[] { id }, ct);
        if (location == null) return NotFound(ApiResponse<LocationDto>.Fail("Location not found."));
        _mapper.Map(request, location);
        location.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<LocationDto>.Ok(_mapper.Map<LocationDto>(location)));
    }

    // ─── Cost Centers ─────────────────────────────────────────────────────────

    [HttpGet("cost-centers")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.View)]
    public async Task<ActionResult<ApiResponse<List<CostCenterDto>>>> GetCostCenters(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var costCenters = await _context.CostCenters
            .Include(c => c.ManagerEmployee)
            .Where(c => !companyId.HasValue || c.CompanyId == companyId)
            .Where(c => c.IsActive)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<CostCenterDto>>.Ok(_mapper.Map<List<CostCenterDto>>(costCenters)));
    }

    [HttpPost("cost-centers")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<CostCenterDto>>> CreateCostCenter([FromBody] CreateCostCenterRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<CostCenterDto>.Fail("Company not configured."));
        var costCenter = new CostCenter
        {
            CompanyId = company.CompanyId,
            CostCenterName = request.CostCenterName,
            CostCenterCode = request.CostCenterCode,
            ManagerEmployeeId = request.ManagerEmployeeId
        };
        _context.CostCenters.Add(costCenter);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<CostCenterDto>.Ok(_mapper.Map<CostCenterDto>(costCenter)));
    }

    // ─── System Settings ──────────────────────────────────────────────────────

    [HttpGet("settings")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.View)]
    public async Task<ActionResult<ApiResponse<List<SystemSettingDto>>>> GetSettings(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var settings = await _context.SystemSettings
            .Where(s => !companyId.HasValue || s.CompanyId == companyId)
            .Select(s => new SystemSettingDto { SettingId = s.SettingId, SettingKey = s.SettingKey, SettingValue = s.SettingValue, DataType = s.DataType, Description = s.Description })
            .ToListAsync(ct);
        return Ok(ApiResponse<List<SystemSettingDto>>.Ok(settings));
    }

    [HttpPut("settings/{key}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<SystemSettingDto>>> UpdateSetting(string key, [FromBody] UpdateSettingRequest request, CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == key && (!companyId.HasValue || s.CompanyId == companyId), ct);
        if (setting == null) return NotFound(ApiResponse<SystemSettingDto>.Fail("Setting not found."));
        setting.SettingValue = request.SettingValue;
        setting.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<SystemSettingDto>.Ok(new SystemSettingDto { SettingId = setting.SettingId, SettingKey = setting.SettingKey, SettingValue = setting.SettingValue, DataType = setting.DataType }));
    }

    // ─── Audit Logs ───────────────────────────────────────────────────────────

    [HttpGet("audit-logs")]
    [Filters.RequirePermission(PermissionCodes.Audit.View)]
    public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetAuditLogs([FromQuery] AuditLogQueryRequest request, CancellationToken ct)
    {
        var query = _context.AuditLogs.Include(a => a.User).AsQueryable();
        if (!string.IsNullOrEmpty(request.TableName)) query = query.Where(a => a.TableName == request.TableName);
        if (!string.IsNullOrEmpty(request.Action)) query = query.Where(a => a.Action == request.Action);
        if (request.UserId.HasValue) query = query.Where(a => a.UserId == request.UserId);
        if (request.FromDate.HasValue) query = query.Where(a => a.CreatedAt >= request.FromDate);
        if (request.ToDate.HasValue) query = query.Where(a => a.CreatedAt <= request.ToDate);

        var total = await query.CountAsync(ct);
        var logs = await query.OrderByDescending(a => a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return Ok(ApiResponse<List<AuditLogDto>>.PagedOk(_mapper.Map<List<AuditLogDto>>(logs), request.Page, request.PageSize, total));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static List<DepartmentDto> BuildDepartmentTree(List<DepartmentDto> depts)
    {
        var lookup = depts.ToDictionary(d => d.DeptId);
        var roots = new List<DepartmentDto>();
        foreach (var dept in depts)
        {
            if (dept.ParentDeptId.HasValue && lookup.TryGetValue(dept.ParentDeptId.Value, out var parent))
                parent.Children.Add(dept);
            else
                roots.Add(dept);
        }
        return roots;
    }
}
