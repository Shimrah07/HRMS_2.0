using AutoMapper;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
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
[Route("api/v{version:apiVersion}/assets")]
[ApiVersion("1.0")]
[Authorize]
public class AssetController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AssetController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.View)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetAssets([FromQuery] string? status, [FromQuery] string? category, CancellationToken ct = default)
    {
        var companyId = _currentUser.CompanyId;
        var query = _context.Assets
            .Include(a => a.Assignments)
                .ThenInclude(asg => asg.Employee)
            .Where(a => (!companyId.HasValue || a.CompanyId == companyId) && a.IsActive)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(a => a.Category == category);

        var list = await query.ToListAsync(ct);

        var result = list.Select(a => {
            var activeAssignment = a.Assignments.FirstOrDefault(asg => asg.Status == "Assigned");
            return (object)new
            {
                assetId = a.AssetId,
                assetTag = a.AssetTag,
                assetName = a.AssetName,
                category = a.Category,
                serialNumber = a.SerialNumber,
                purchaseValue = a.PurchaseValue,
                purchaseDate = a.PurchaseDate.ToString("yyyy-MM-dd"),
                status = a.Status,
                assignedToEmployeeId = activeAssignment?.EmployeeId,
                assignedToEmployeeName = activeAssignment?.Employee != null ? $"{activeAssignment.Employee.FirstName} {activeAssignment.Employee.LastName}" : null
            };
        }).ToList();

        return Ok(ApiResponse<List<object>>.Ok(result));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Create)]
    public async Task<ActionResult<ApiResponse<object>>> CreateAsset([FromBody] CreateAssetRequest request, CancellationToken ct = default)
    {
        var companyId = _currentUser.CompanyId;
        var asset = new AssetMaster
        {
            AssetId = Guid.NewGuid(),
            AssetTag = request.AssetTag,
            AssetName = request.AssetName,
            Category = request.Category ?? "Laptop",
            SerialNumber = request.SerialNumber,
            PurchaseValue = request.PurchaseValue,
            PurchaseDate = request.PurchaseDate ?? DateTime.UtcNow,
            Status = "Available",
            CompanyId = companyId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(asset, "Asset created successfully."));
    }

    [HttpPost("{id:guid}/assign")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> AssignAsset(Guid id, [FromBody] AssignAssetRequest request, CancellationToken ct = default)
    {
        var asset = await _context.Assets.FindAsync(new object[] { id }, ct);
        if (asset == null || !asset.IsActive)
            return NotFound(ApiResponse<object>.Fail("Asset not found."));

        var emp = await _context.Employees.FindAsync(new object[] { request.EmployeeId }, ct);
        if (emp == null || !emp.IsActive)
            return BadRequest(ApiResponse<object>.Fail("Employee not found or inactive."));

        asset.Status = "Assigned";

        var assignment = new AssetAssignment
        {
            AssignmentId = Guid.NewGuid(),
            AssetId = id,
            EmployeeId = request.EmployeeId,
            AssignedDate = DateTime.UtcNow,
            Status = "Assigned",
            Remarks = request.Remarks,
            CreatedAt = DateTime.UtcNow
        };

        _context.AssetAssignments.Add(assignment);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(null, "Asset assigned to employee successfully."));
    }

    [HttpPost("{id:guid}/return")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> ReturnAsset(Guid id, CancellationToken ct = default)
    {
        var asset = await _context.Assets.FindAsync(new object[] { id }, ct);
        if (asset == null)
            return NotFound(ApiResponse<object>.Fail("Asset not found."));

        asset.Status = "Available";

        var assignment = await _context.AssetAssignments
            .FirstOrDefaultAsync(a => a.AssetId == id && a.Status == "Assigned", ct);

        if (assignment != null)
        {
            assignment.Status = "Returned";
            assignment.ReturnedDate = DateTime.UtcNow;
            assignment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(null, "Asset returned successfully."));
    }
}

public class CreateAssetRequest
{
    public string AssetTag { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public decimal PurchaseValue { get; set; }
    public DateTime? PurchaseDate { get; set; }
}

public class AssignAssetRequest
{
    public Guid EmployeeId { get; set; }
    public string? Remarks { get; set; }
}
