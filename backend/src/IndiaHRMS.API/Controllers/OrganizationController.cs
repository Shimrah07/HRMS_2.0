using AutoMapper;
using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.DTOs.Employee;
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

    // ─── Business Units ────────────────────────────────────────────────────────

    [HttpGet("business-units")]
    public async Task<ActionResult<ApiResponse<List<BusinessUnitDto>>>> GetBusinessUnits(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var list = await _context.BusinessUnits
            .Where(b => (!companyId.HasValue || b.CompanyId == companyId) && b.IsActive)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<BusinessUnitDto>>.Ok(_mapper.Map<List<BusinessUnitDto>>(list)));
    }

    [HttpPost("business-units")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<BusinessUnitDto>>> CreateBusinessUnit([FromBody] CreateBusinessUnitRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<BusinessUnitDto>.Fail("Company not configured."));

        var bu = _mapper.Map<BusinessUnit>(request);
        bu.CompanyId = company.CompanyId;
        _context.BusinessUnits.Add(bu);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<BusinessUnitDto>.Ok(_mapper.Map<BusinessUnitDto>(bu)));
    }

    [HttpPut("business-units/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<BusinessUnitDto>>> UpdateBusinessUnit(Guid id, [FromBody] UpdateBusinessUnitRequest request, CancellationToken ct)
    {
        var bu = await _context.BusinessUnits.FindAsync(new object[] { id }, ct);
        if (bu == null) return NotFound(ApiResponse<BusinessUnitDto>.Fail("Business unit not found."));

        _mapper.Map(request, bu);
        bu.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<BusinessUnitDto>.Ok(_mapper.Map<BusinessUnitDto>(bu)));
    }

    [HttpDelete("business-units/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteBusinessUnit(Guid id, CancellationToken ct)
    {
        var bu = await _context.BusinessUnits.FindAsync(new object[] { id }, ct);
        if (bu == null) return NotFound(ApiResponse<object>.Fail("Business unit not found."));

        bu.IsActive = false;
        bu.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Business unit deactivated."));
    }

    // ─── Divisions ─────────────────────────────────────────────────────────────

    [HttpGet("divisions")]
    public async Task<ActionResult<ApiResponse<List<DivisionDto>>>> GetDivisions([FromQuery] Guid? businessUnitId, CancellationToken ct)
    {
        var query = _context.Divisions.Include(d => d.BusinessUnit).Where(d => d.IsActive).AsQueryable();
        if (businessUnitId.HasValue)
            query = query.Where(d => d.BusinessUnitId == businessUnitId.Value);

        var list = await query.ToListAsync(ct);
        return Ok(ApiResponse<List<DivisionDto>>.Ok(_mapper.Map<List<DivisionDto>>(list)));
    }

    [HttpPost("divisions")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<DivisionDto>>> CreateDivision([FromBody] CreateDivisionRequest request, CancellationToken ct)
    {
        var div = _mapper.Map<Division>(request);
        _context.Divisions.Add(div);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<DivisionDto>.Ok(_mapper.Map<DivisionDto>(div)));
    }

    [HttpPut("divisions/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<DivisionDto>>> UpdateDivision(Guid id, [FromBody] UpdateDivisionRequest request, CancellationToken ct)
    {
        var div = await _context.Divisions.FindAsync(new object[] { id }, ct);
        if (div == null) return NotFound(ApiResponse<DivisionDto>.Fail("Division not found."));

        _mapper.Map(request, div);
        div.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<DivisionDto>.Ok(_mapper.Map<DivisionDto>(div)));
    }

    [HttpDelete("divisions/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteDivision(Guid id, CancellationToken ct)
    {
        var div = await _context.Divisions.FindAsync(new object[] { id }, ct);
        if (div == null) return NotFound(ApiResponse<object>.Fail("Division not found."));

        div.IsActive = false;
        div.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Division deactivated."));
    }

    // ─── Sub-Departments ───────────────────────────────────────────────────────

    [HttpGet("sub-departments")]
    public async Task<ActionResult<ApiResponse<List<SubDepartmentDto>>>> GetSubDepartments([FromQuery] Guid? deptId, CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var query = _context.Departments
            .Include(d => d.ParentDept)
            .Where(d => d.ParentDeptId != null && d.IsActive)
            .AsQueryable();

        if (companyId.HasValue)
            query = query.Where(d => d.CompanyId == companyId.Value);

        if (deptId.HasValue)
            query = query.Where(d => d.ParentDeptId == deptId.Value);

        var list = await query.ToListAsync(ct);
        return Ok(ApiResponse<List<SubDepartmentDto>>.Ok(_mapper.Map<List<SubDepartmentDto>>(list)));
    }

    [HttpPost("sub-departments")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<SubDepartmentDto>>> CreateSubDepartment([FromBody] CreateSubDepartmentRequest request, CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        if (!companyId.HasValue)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(ct);
            companyId = company?.CompanyId;
        }

        if (!companyId.HasValue)
        {
            return BadRequest(ApiResponse<SubDepartmentDto>.Fail("Company context not found."));
        }

        var sub = _mapper.Map<Department>(request);
        sub.CompanyId = companyId.Value;
        _context.Departments.Add(sub);
        await _context.SaveChangesAsync(ct);

        // Reload to include ParentDept for mapping
        var reloaded = await _context.Departments
            .Include(d => d.ParentDept)
            .FirstOrDefaultAsync(d => d.DeptId == sub.DeptId, ct);

        return Ok(ApiResponse<SubDepartmentDto>.Ok(_mapper.Map<SubDepartmentDto>(reloaded)));
    }

    [HttpPut("sub-departments/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<SubDepartmentDto>>> UpdateSubDepartment(Guid id, [FromBody] UpdateSubDepartmentRequest request, CancellationToken ct)
    {
        var sub = await _context.Departments.FindAsync(new object[] { id }, ct);
        if (sub == null || sub.ParentDeptId == null) return NotFound(ApiResponse<SubDepartmentDto>.Fail("Sub-department not found."));

        _mapper.Map(request, sub);
        sub.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        // Reload to include ParentDept for mapping
        var reloaded = await _context.Departments
            .Include(d => d.ParentDept)
            .FirstOrDefaultAsync(d => d.DeptId == sub.DeptId, ct);

        return Ok(ApiResponse<SubDepartmentDto>.Ok(_mapper.Map<SubDepartmentDto>(reloaded)));
    }

    [HttpDelete("sub-departments/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteSubDepartment(Guid id, CancellationToken ct)
    {
        var sub = await _context.Departments.FindAsync(new object[] { id }, ct);
        if (sub == null || sub.ParentDeptId == null) return NotFound(ApiResponse<object>.Fail("Sub-department not found."));

        // Check if there are any employees referencing this department as subDeptId
        var hasEmployees = await _context.Employees.AnyAsync(e => e.SubDeptId == id && e.IsActive, ct);
        if (hasEmployees)
        {
            return BadRequest(ApiResponse<object>.Fail("Cannot deactivate this sub-department because it is referenced by active employees."));
        }

        sub.IsActive = false;
        sub.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Sub-department deactivated."));
    }

    // ─── Teams ─────────────────────────────────────────────────────────────────

    [HttpGet("teams")]
    public async Task<ActionResult<ApiResponse<List<TeamDto>>>> GetTeams([FromQuery] Guid? subDeptId, CancellationToken ct)
    {
        var query = _context.Teams.Include(t => t.SubDepartment).Where(t => t.IsActive).AsQueryable();
        if (subDeptId.HasValue)
            query = query.Where(t => t.SubDeptId == subDeptId.Value);

        var list = await query.ToListAsync(ct);
        return Ok(ApiResponse<List<TeamDto>>.Ok(_mapper.Map<List<TeamDto>>(list)));
    }

    [HttpPost("teams")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<TeamDto>>> CreateTeam([FromBody] CreateTeamRequest request, CancellationToken ct)
    {
        var team = _mapper.Map<Team>(request);
        _context.Teams.Add(team);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<TeamDto>.Ok(_mapper.Map<TeamDto>(team)));
    }

    [HttpPut("teams/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<TeamDto>>> UpdateTeam(Guid id, [FromBody] UpdateTeamRequest request, CancellationToken ct)
    {
        var team = await _context.Teams.FindAsync(new object[] { id }, ct);
        if (team == null) return NotFound(ApiResponse<TeamDto>.Fail("Team not found."));

        _mapper.Map(request, team);
        team.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<TeamDto>.Ok(_mapper.Map<TeamDto>(team)));
    }

    [HttpDelete("teams/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTeam(Guid id, CancellationToken ct)
    {
        var team = await _context.Teams.FindAsync(new object[] { id }, ct);
        if (team == null) return NotFound(ApiResponse<object>.Fail("Team not found."));

        team.IsActive = false;
        team.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Team deactivated."));
    }

    // ─── Grades ────────────────────────────────────────────────────────────────

    [HttpGet("grades")]
    public async Task<ActionResult<ApiResponse<List<GradeMasterDto>>>> GetGrades(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var list = await _context.GradeMasters
            .Where(g => (!companyId.HasValue || g.CompanyId == companyId) && g.IsActive)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<GradeMasterDto>>.Ok(_mapper.Map<List<GradeMasterDto>>(list)));
    }

    [HttpPost("grades")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<GradeMasterDto>>> CreateGrade([FromBody] CreateGradeRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<GradeMasterDto>.Fail("Company not configured."));

        var grade = _mapper.Map<GradeMaster>(request);
        grade.CompanyId = company.CompanyId;
        _context.GradeMasters.Add(grade);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<GradeMasterDto>.Ok(_mapper.Map<GradeMasterDto>(grade)));
    }

    [HttpPut("grades/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<GradeMasterDto>>> UpdateGrade(Guid id, [FromBody] UpdateGradeRequest request, CancellationToken ct)
    {
        var grade = await _context.GradeMasters.FindAsync(new object[] { id }, ct);
        if (grade == null) return NotFound(ApiResponse<GradeMasterDto>.Fail("Grade not found."));

        _mapper.Map(request, grade);
        grade.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<GradeMasterDto>.Ok(_mapper.Map<GradeMasterDto>(grade)));
    }

    [HttpDelete("grades/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteGrade(Guid id, CancellationToken ct)
    {
        var grade = await _context.GradeMasters.FindAsync(new object[] { id }, ct);
        if (grade == null) return NotFound(ApiResponse<object>.Fail("Grade not found."));

        grade.IsActive = false;
        grade.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Grade deactivated."));
    }

    // ─── Bands ─────────────────────────────────────────────────────────────────

    [HttpGet("bands")]
    public async Task<ActionResult<ApiResponse<List<BandMasterDto>>>> GetBands(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var list = await _context.BandMasters
            .Where(b => (!companyId.HasValue || b.CompanyId == companyId) && b.IsActive)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<BandMasterDto>>.Ok(_mapper.Map<List<BandMasterDto>>(list)));
    }

    [HttpPost("bands")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<BandMasterDto>>> CreateBand([FromBody] CreateBandRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<BandMasterDto>.Fail("Company not configured."));

        var band = _mapper.Map<BandMaster>(request);
        band.CompanyId = company.CompanyId;
        _context.BandMasters.Add(band);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<BandMasterDto>.Ok(_mapper.Map<BandMasterDto>(band)));
    }

    [HttpPut("bands/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<BandMasterDto>>> UpdateBand(Guid id, [FromBody] UpdateBandRequest request, CancellationToken ct)
    {
        var band = await _context.BandMasters.FindAsync(new object[] { id }, ct);
        if (band == null) return NotFound(ApiResponse<BandMasterDto>.Fail("Band not found."));

        _mapper.Map(request, band);
        band.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<BandMasterDto>.Ok(_mapper.Map<BandMasterDto>(band)));
    }

    [HttpDelete("bands/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteBand(Guid id, CancellationToken ct)
    {
        var band = await _context.BandMasters.FindAsync(new object[] { id }, ct);
        if (band == null) return NotFound(ApiResponse<object>.Fail("Band not found."));

        band.IsActive = false;
        band.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Band deactivated."));
    }

    // ─── Job Families ──────────────────────────────────────────────────────────

    [HttpGet("job-families")]
    public async Task<ActionResult<ApiResponse<List<JobFamilyDto>>>> GetJobFamilies(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var list = await _context.JobFamilies
            .Where(j => (!companyId.HasValue || j.CompanyId == companyId) && j.IsActive)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<JobFamilyDto>>.Ok(_mapper.Map<List<JobFamilyDto>>(list)));
    }

    [HttpPost("job-families")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<JobFamilyDto>>> CreateJobFamily([FromBody] CreateJobFamilyRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<JobFamilyDto>.Fail("Company not configured."));

        var jf = _mapper.Map<JobFamily>(request);
        jf.CompanyId = company.CompanyId;
        _context.JobFamilies.Add(jf);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<JobFamilyDto>.Ok(_mapper.Map<JobFamilyDto>(jf)));
    }

    [HttpPut("job-families/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<JobFamilyDto>>> UpdateJobFamily(Guid id, [FromBody] UpdateJobFamilyRequest request, CancellationToken ct)
    {
        var jf = await _context.JobFamilies.FindAsync(new object[] { id }, ct);
        if (jf == null) return NotFound(ApiResponse<JobFamilyDto>.Fail("Job family not found."));

        _mapper.Map(request, jf);
        jf.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<JobFamilyDto>.Ok(_mapper.Map<JobFamilyDto>(jf)));
    }

    [HttpDelete("job-families/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteJobFamily(Guid id, CancellationToken ct)
    {
        var jf = await _context.JobFamilies.FindAsync(new object[] { id }, ct);
        if (jf == null) return NotFound(ApiResponse<object>.Fail("Job family not found."));

        jf.IsActive = false;
        jf.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Job family deactivated."));
    }

    // ─── Job Functions ─────────────────────────────────────────────────────────

    [HttpGet("job-functions")]
    public async Task<ActionResult<ApiResponse<List<JobFunctionDto>>>> GetJobFunctions([FromQuery] Guid? jobFamilyId, CancellationToken ct)
    {
        var query = _context.JobFunctions.Include(j => j.JobFamily).Where(j => j.IsActive).AsQueryable();
        if (jobFamilyId.HasValue)
            query = query.Where(j => j.JobFamilyId == jobFamilyId.Value);

        var list = await query.ToListAsync(ct);
        return Ok(ApiResponse<List<JobFunctionDto>>.Ok(_mapper.Map<List<JobFunctionDto>>(list)));
    }

    [HttpPost("job-functions")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<JobFunctionDto>>> CreateJobFunction([FromBody] CreateJobFunctionRequest request, CancellationToken ct)
    {
        var jfn = _mapper.Map<JobFunction>(request);
        _context.JobFunctions.Add(jfn);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<JobFunctionDto>.Ok(_mapper.Map<JobFunctionDto>(jfn)));
    }

    [HttpPut("job-functions/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<JobFunctionDto>>> UpdateJobFunction(Guid id, [FromBody] UpdateJobFunctionRequest request, CancellationToken ct)
    {
        var jfn = await _context.JobFunctions.FindAsync(new object[] { id }, ct);
        if (jfn == null) return NotFound(ApiResponse<JobFunctionDto>.Fail("Job function not found."));

        _mapper.Map(request, jfn);
        jfn.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<JobFunctionDto>.Ok(_mapper.Map<JobFunctionDto>(jfn)));
    }

    [HttpDelete("job-functions/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteJobFunction(Guid id, CancellationToken ct)
    {
        var jfn = await _context.JobFunctions.FindAsync(new object[] { id }, ct);
        if (jfn == null) return NotFound(ApiResponse<object>.Fail("Job function not found."));

        jfn.IsActive = false;
        jfn.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Job function deactivated."));
    }

    // ─── Profit Centers ────────────────────────────────────────────────────────

    [HttpGet("profit-centers")]
    public async Task<ActionResult<ApiResponse<List<ProfitCenterDto>>>> GetProfitCenters(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var list = await _context.ProfitCenters
            .Where(p => (!companyId.HasValue || p.CompanyId == companyId) && p.IsActive)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<ProfitCenterDto>>.Ok(_mapper.Map<List<ProfitCenterDto>>(list)));
    }

    [HttpPost("profit-centers")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<ProfitCenterDto>>> CreateProfitCenter([FromBody] CreateProfitCenterRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<ProfitCenterDto>.Fail("Company not configured."));

        var pc = _mapper.Map<ProfitCenter>(request);
        pc.CompanyId = company.CompanyId;
        _context.ProfitCenters.Add(pc);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<ProfitCenterDto>.Ok(_mapper.Map<ProfitCenterDto>(pc)));
    }

    [HttpPut("profit-centers/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<ProfitCenterDto>>> UpdateProfitCenter(Guid id, [FromBody] UpdateProfitCenterRequest request, CancellationToken ct)
    {
        var pc = await _context.ProfitCenters.FindAsync(new object[] { id }, ct);
        if (pc == null) return NotFound(ApiResponse<ProfitCenterDto>.Fail("Profit center not found."));

        _mapper.Map(request, pc);
        pc.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<ProfitCenterDto>.Ok(_mapper.Map<ProfitCenterDto>(pc)));
    }

    [HttpDelete("profit-centers/{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProfitCenter(Guid id, CancellationToken ct)
    {
        var pc = await _context.ProfitCenters.FindAsync(new object[] { id }, ct);
        if (pc == null) return NotFound(ApiResponse<object>.Fail("Profit center not found."));

        pc.IsActive = false;
        pc.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Profit center deactivated."));
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
