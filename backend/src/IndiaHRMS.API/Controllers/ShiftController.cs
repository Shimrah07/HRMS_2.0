using AutoMapper;
using IndiaHRMS.Application.DTOs.Attendance;
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
[Route("api/v{version:apiVersion}/shifts")]
[ApiVersion("1.0")]
[Authorize]
public class ShiftController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;

    public ShiftController(AppDbContext context, IMapper mapper, ICurrentUserService currentUser)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.View, PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<List<ShiftMasterDto>>>> GetShifts(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var shifts = await _context.ShiftMasters
            .Where(s => (!companyId.HasValue || s.CompanyId == companyId) && s.IsActive)
            .ToListAsync(ct);

        return Ok(ApiResponse<List<ShiftMasterDto>>.Ok(_mapper.Map<List<ShiftMasterDto>>(shifts)));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<ShiftMasterDto>>> CreateShift([FromBody] CreateShiftRequest request, CancellationToken ct)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(ct);
        if (company == null) return BadRequest(ApiResponse<ShiftMasterDto>.Fail("Company not configured."));

        var shift = _mapper.Map<ShiftMaster>(request);
        shift.CompanyId = company.CompanyId;
        
        _context.ShiftMasters.Add(shift);
        await _context.SaveChangesAsync(ct);
        
        return Ok(ApiResponse<ShiftMasterDto>.Ok(_mapper.Map<ShiftMasterDto>(shift)));
    }

    [HttpPut("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<ShiftMasterDto>>> UpdateShift(Guid id, [FromBody] UpdateShiftRequest request, CancellationToken ct)
    {
        var shift = await _context.ShiftMasters.FindAsync(new object[] { id }, ct);
        if (shift == null) return NotFound(ApiResponse<ShiftMasterDto>.Fail("Shift not found."));

        _mapper.Map(request, shift);
        shift.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<ShiftMasterDto>.Ok(_mapper.Map<ShiftMasterDto>(shift)));
    }

    [HttpDelete("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Delete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteShift(Guid id, CancellationToken ct)
    {
        var shift = await _context.ShiftMasters.FindAsync(new object[] { id }, ct);
        if (shift == null) return NotFound(ApiResponse<object>.Fail("Shift not found."));

        var hasEmployees = await _context.Employees.AnyAsync(e => e.ShiftId == id && e.IsActive, ct);
        if (hasEmployees)
        {
            return BadRequest(ApiResponse<object>.Fail("Cannot deactivate this shift because it is referenced by active employees."));
        }

        shift.IsActive = false;
        shift.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Shift deactivated."));
    }
}
