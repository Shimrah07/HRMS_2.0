using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
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
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Application.DTOs.Payroll;
using IndiaHRMS.Application.Services;
using Filters = IndiaHRMS.API.Filters;

namespace IndiaHRMS.API.Controllers;

/// <summary>
/// TICKET-2: Salary Component & Structure CRUD
/// Provides full CRUD for SalaryComponent and SalaryStructure entities + Salary Structure Builder.
/// Restricted to PayrollAdmin / HRAdmin / SuperAdmin.
/// </summary>
[ApiController]
[Route("api/v1/payroll")]
[Authorize]
public class SalaryConfigController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ISalaryCalculationEngine _calcEngine;

    public SalaryConfigController(AppDbContext context, ICurrentUserService currentUser, ISalaryCalculationEngine calcEngine)
    {
        _context = context;
        _currentUser = currentUser;
        _calcEngine = calcEngine;
    }

    // NOTE: Access control via [Filters.RequirePermission] on each endpoint.
    // IsPayrollAdmin => IsAuthenticated was a blanket-access regression — removed.

    // ─────────────────────────────────────────────────────────────────────────
    // SALARY COMPONENTS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/v1/payroll/components — List all salary components for current company</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("components")]
    public async Task<ActionResult<ApiResponse<object>>> GetComponents(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var query = _context.SalaryComponents.AsQueryable();
        if (companyId.HasValue)
            query = query.Where(c => c.CompanyId == companyId.Value);

        var components = await query
            .OrderBy(c => c.ComponentType)
            .ThenBy(c => c.ComponentName)
            .Select(c => new
            {
                componentId = c.ComponentId,
                componentName = c.ComponentName,
                componentCode = c.ComponentCode,
                componentType = c.ComponentType.ToString(),
                calculationType = c.CalculationType.ToString(),
                isStatutory = c.IsStatutory,
                isTaxable = c.IsTaxable,
                isActive = c.IsActive
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(components));
    }

    /// <summary>POST /api/v1/payroll/components — Create a new salary component</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Configure)]
    [HttpPost("components")]
    public async Task<ActionResult<ApiResponse<object>>> CreateComponent([FromBody] CreateComponentRequest req, CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId ?? Guid.Empty;

        // Duplicate code check
        var exists = await _context.SalaryComponents.AnyAsync(
            c => c.CompanyId == companyId && c.ComponentCode == req.ComponentCode.Trim().ToUpper(), ct);
        if (exists)
            return BadRequest(ApiResponse<object>.Fail($"A component with code '{req.ComponentCode}' already exists."));

        Enum.TryParse<ComponentType>(req.ComponentType, true, out var compType);
        Enum.TryParse<CalculationType>(req.CalculationType, true, out var calcType);

        ComponentGroup grp = ComponentGroup.SalaryStructure;
        if (!string.IsNullOrWhiteSpace(req.Group))
        {
            if (req.Group.Equals("Benefit", StringComparison.OrdinalIgnoreCase) || req.Group.Equals("Benefits", StringComparison.OrdinalIgnoreCase))
                grp = ComponentGroup.Benefit;
            else
                Enum.TryParse<ComponentGroup>(req.Group, true, out grp);
        }

        CalculationBasis basis = calcType == CalculationType.Percentage ? CalculationBasis.PercentOfCTC : CalculationBasis.FixedAmount;

        var component = new SalaryComponent
        {
            ComponentId = Guid.NewGuid(),
            CompanyId = companyId,
            ComponentName = req.ComponentName.Trim(),
            ComponentCode = req.ComponentCode.Trim().ToUpper(),
            ComponentType = compType,
            CalculationType = calcType,
            Group = grp,
            CalculationBasis = basis,
            DefaultPercentage = req.DefaultPercentage,
            IsStatutory = req.IsStatutory,
            IsTaxable = req.IsTaxable,
            IsActive = true
        };

        _context.SalaryComponents.Add(component);
        await _context.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetComponents), ApiResponse<object>.Ok(new
        {
            component.ComponentId,
            component.ComponentName,
            component.ComponentCode,
            ComponentType = component.ComponentType.ToString(),
            CalculationType = component.CalculationType.ToString(),
            Group = component.Group.ToString(),
            component.DefaultPercentage,
            component.IsStatutory,
            component.IsTaxable,
            component.IsActive
        }, "Salary component created successfully."));
    }

    /// <summary>PUT /api/v1/payroll/components/{id} — Update a salary component</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Configure)]
    [HttpPut("components/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateComponent(Guid id, [FromBody] CreateComponentRequest req, CancellationToken ct)
    {
        var component = await _context.SalaryComponents.FindAsync(new object[] { id }, ct);
        if (component == null)
            return NotFound(ApiResponse<object>.Fail("Salary component not found."));

        // Guard: prevent editing StatutoryType components (PF, ESI, PT, TDS are managed by compliance engine)
        if (component.IsStatutory)
            return BadRequest(ApiResponse<object>.Fail("Statutory components cannot be modified. Update the compliance ceiling configuration instead."));

        component.ComponentName = req.ComponentName.Trim();
        component.ComponentType = Enum.Parse<ComponentType>(req.ComponentType);
        component.CalculationType = Enum.Parse<CalculationType>(req.CalculationType);
        component.IsTaxable = req.IsTaxable;
        component.IsActive = req.IsActive;

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { id }, "Salary component updated."));
    }

    /// <summary>DELETE /api/v1/payroll/components/{id} — Soft-delete if not used in disbursed payroll</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Configure)]
    [HttpDelete("components/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteComponent(Guid id, CancellationToken ct)
    {

        var component = await _context.SalaryComponents.FindAsync(new object[] { id }, ct);
        if (component == null)
            return NotFound(ApiResponse<object>.Fail("Salary component not found."));

        // Guard: component still used in disbursed payroll?
        var usedInPayroll = await _context.PayrollComponentValues
            .AnyAsync(pcv => pcv.ComponentId == id, ct);
        if (usedInPayroll)
        {
            // Soft-delete: deactivate instead of hard delete (preserves historical records)
            component.IsActive = false;
            await _context.SaveChangesAsync(ct);
            return Ok(ApiResponse<object>.Ok((object?)null, "Component deactivated (it was used in historical payroll records and cannot be fully deleted)."));
        }

        // Also check active structure assignments
        var usedInStructure = await _context.StructureComponents
            .AnyAsync(sc => sc.ComponentId == id, ct);
        if (usedInStructure)
            return BadRequest(ApiResponse<object>.Fail("This component is assigned to one or more salary structures. Remove it from those structures first."));

        _context.SalaryComponents.Remove(component);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok((object?)null, "Salary component deleted permanently."));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SALARY STRUCTURES
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/v1/payroll/structures — List all salary structures (templates & employee saved structures) with component assignments</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("structures")]
    public async Task<ActionResult<ApiResponse<object>>> GetStructures(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var query = _context.SalaryStructures.AsQueryable();
        if (companyId.HasValue)
            query = query.Where(s => s.CompanyId == companyId.Value);

        var dbTemplates = await query
            .Include(s => s.StructureComponents)
                .ThenInclude(sc => sc.Component)
            .OrderByDescending(s => s.EffectiveFrom)
            .ToListAsync(ct);

        var defaultComponents = await _context.SalaryComponents
            .Where(c => c.IsActive)
            .OrderBy(c => c.Group)
            .ThenBy(c => c.ComponentName)
            .ToListAsync(ct);

        var masterTemplates = dbTemplates.Select(s => new
        {
            structureId = s.StructureId,
            structureName = s.StructureName,
            effectiveFrom = s.EffectiveFrom,
            effectiveTo = s.EffectiveTo,
            isActive = s.IsActive,
            components = s.StructureComponents.Any()
                ? s.StructureComponents.Select(sc => new
                  {
                      id = sc.Id,
                      componentId = sc.ComponentId,
                      componentName = sc.Component != null ? sc.Component.ComponentName : "Component",
                      componentCode = sc.Component != null ? sc.Component.ComponentCode : "",
                      componentType = sc.Component != null ? sc.Component.ComponentType.ToString() : "Earning",
                      calculationType = sc.Component != null ? sc.Component.CalculationType.ToString() : "Percentage",
                      fixedValue = sc.FixedValue,
                      formula = (string?)sc.Formula,
                      sequence = sc.Sequence
                  }).OrderBy(x => x.sequence).ToList()
                : defaultComponents.Select(c => new
                  {
                      id = Guid.NewGuid(),
                      componentId = c.ComponentId,
                      componentName = c.ComponentName,
                      componentCode = c.ComponentCode,
                      componentType = c.Group.ToString(),
                      calculationType = c.CalculationBasis.ToString(),
                      fixedValue = 0m,
                      formula = (string?)(c.DefaultPercentage.HasValue ? $"{c.DefaultPercentage}%" : (c.IsBalancingComponent ? "Balancing" : "Fixed")),
                      sequence = 1
                  }).ToList()
        }).ToList();

        // Also fetch employee active saved structures
        var empStructures = await _context.EmployeeSalaryStructures
            .Include(es => es.Employee)
            .Include(es => es.Allocations)
                .ThenInclude(a => a.Component)
            .Where(es => es.IsActive)
            .OrderByDescending(es => es.CreatedAt)
            .Select(es => new
            {
                structureId = es.StructureId,
                structureName = $"{es.Employee.FirstName} {es.Employee.LastName} (₹{es.AnnualCTC:N0} CTC)",
                effectiveFrom = es.EffectiveFrom,
                effectiveTo = es.EffectiveTo,
                isActive = es.IsActive,
                components = es.Allocations.Select(a => new
                {
                    id = a.AllocationId,
                    componentId = a.ComponentId,
                    componentName = a.Component != null ? a.Component.ComponentName : "Component",
                    componentCode = a.Component != null ? a.Component.ComponentCode : "",
                    componentType = a.Group.ToString(),
                    calculationType = a.InputMode.ToString(),
                    fixedValue = a.AnnualAmount,
                    formula = (string?)(a.Percentage.HasValue ? $"{a.Percentage}% (₹{a.MonthlyAmount:N0}/mo)" : $"₹{a.MonthlyAmount:N0}/mo"),
                    sequence = 1
                }).ToList()
            })
            .ToListAsync(ct);

        var result = masterTemplates.Cast<object>().Concat(empStructures).ToList();
        return Ok(ApiResponse<object>.Ok(result));
    }

    /// <summary>POST /api/v1/payroll/structures — Create a new salary structure with components</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Configure)]
    [HttpPost("structures")]
    public async Task<ActionResult<ApiResponse<object>>> CreateStructure([FromBody] CreateStructureRequest req, CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId ?? Guid.Empty;

        // Duplicate name check
        var exists = await _context.SalaryStructures.AnyAsync(
            s => s.CompanyId == companyId && s.StructureName == req.StructureName.Trim(), ct);
        if (exists)
            return BadRequest(ApiResponse<object>.Fail($"A structure named '{req.StructureName}' already exists."));

        var structure = new SalaryStructure
        {
            StructureId = Guid.NewGuid(),
            CompanyId = companyId,
            StructureName = req.StructureName.Trim(),
            EffectiveFrom = DateOnly.Parse(req.EffectiveFrom),
            EffectiveTo = string.IsNullOrEmpty(req.EffectiveTo) ? null : DateOnly.Parse(req.EffectiveTo),
            IsActive = true
        };

        _context.SalaryStructures.Add(structure);

        if (req.Components != null)
        {
            int seq = 1;
            foreach (var comp in req.Components)
            {
                _context.StructureComponents.Add(new StructureComponent
                {
                    Id = Guid.NewGuid(),
                    StructureId = structure.StructureId,
                    ComponentId = comp.ComponentId,
                    FixedValue = comp.FixedValue,
                    Formula = comp.Formula,
                    Sequence = seq++
                });
            }
        }

        await _context.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetStructures), ApiResponse<object>.Ok(new
        {
            structure.StructureId,
            structure.StructureName
        }, "Salary structure created successfully."));
    }

    /// <summary>PUT /api/v1/payroll/structures/{id} — Update structure metadata. Replaces component assignments.</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Configure)]
    [HttpPut("structures/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateStructure(Guid id, [FromBody] CreateStructureRequest req, CancellationToken ct)
    {
        var structure = await _context.SalaryStructures
            .Include(s => s.StructureComponents)
            .FirstOrDefaultAsync(s => s.StructureId == id, ct);

        if (structure == null)
            return NotFound(ApiResponse<object>.Fail("Salary structure not found."));

        // Guard: if this structure has disbursed payroll rows, version it instead of overwriting
        var hasDisbursed = await _context.EmployeeSalaries
            .AnyAsync(es => es.StructureId == id, ct);

        if (hasDisbursed)
        {
            // Safe edit — only allow metadata changes, not component changes
            structure.StructureName = req.StructureName.Trim();
            structure.EffectiveTo = string.IsNullOrEmpty(req.EffectiveTo) ? null : DateOnly.Parse(req.EffectiveTo);
            structure.IsActive = req.IsActive;
            await _context.SaveChangesAsync(ct);
            return Ok(ApiResponse<object>.Ok(new { id }, "Structure metadata updated. Component assignments were not modified as this structure has active employee salary records (edit would break historical data)."));
        }

        // Full update: replace structure components
        structure.StructureName = req.StructureName.Trim();
        structure.EffectiveFrom = DateOnly.Parse(req.EffectiveFrom);
        structure.EffectiveTo = string.IsNullOrEmpty(req.EffectiveTo) ? null : DateOnly.Parse(req.EffectiveTo);
        structure.IsActive = req.IsActive;

        // Remove old component assignments and replace
        _context.StructureComponents.RemoveRange(structure.StructureComponents);

        if (req.Components != null)
        {
            int seq = 1;
            foreach (var comp in req.Components)
            {
                _context.StructureComponents.Add(new StructureComponent
                {
                    Id = Guid.NewGuid(),
                    StructureId = structure.StructureId,
                    ComponentId = comp.ComponentId,
                    FixedValue = comp.FixedValue,
                    Formula = comp.Formula,
                    Sequence = seq++
                });
            }
        }

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { id }, "Salary structure updated."));
    }

    /// <summary>DELETE /api/v1/payroll/structures/{id} — Soft-delete if no active employee assignments exist</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Configure)]
    [HttpDelete("structures/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteStructure(Guid id, CancellationToken ct)
    {

        var structure = await _context.SalaryStructures.FindAsync(new object[] { id }, ct);
        if (structure == null)
            return NotFound(ApiResponse<object>.Fail("Salary structure not found."));

        // Guard: active employees still on this structure?
        var hasActiveEmployees = await _context.EmployeeSalaries
            .AnyAsync(es => es.StructureId == id && es.IsActive, ct);
        if (hasActiveEmployees)
            return BadRequest(ApiResponse<object>.Fail("Cannot delete: active employees are assigned to this structure. Migrate them first."));

        // Soft-delete
        structure.IsActive = false;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok((object?)null, "Salary structure deactivated."));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SALARY STRUCTURE BUILDER — REDESIGN ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/v1/payroll/salary-builder/catalog — Master catalog for salary structure builder</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("salary-builder/catalog")]
    public async Task<ActionResult<ApiResponse<List<SalaryComponentCatalogDto>>>> GetSalaryBuilderCatalog(CancellationToken ct)
    {
        var dbComponents = await _context.SalaryComponents
            .Where(c => c.IsActive)
            .OrderBy(c => c.Group)
            .ThenBy(c => c.ComponentName)
            .ToListAsync(ct);

        var catalog = dbComponents.Select(c => new SalaryComponentCatalogDto
        {
            ComponentId = c.ComponentId,
            ComponentName = c.ComponentName,
            ComponentCode = c.ComponentCode,
            Group = c.Group,
            CalculationBasis = c.CalculationBasis,
            DefaultPercentage = c.DefaultPercentage,
            IsTaxable = c.IsTaxable,
            IsStatutory = c.IsStatutory,
            ApplicableTo = c.ApplicableTo,
            IsBalancingComponent = c.IsBalancingComponent
        }).ToList();

        // Standard default catalog items ensuring full dual-group coverage
        var defaultItems = new List<SalaryComponentCatalogDto>
        {
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000001"), ComponentName = "Basic Salary", ComponentCode = "BASIC", Group = ComponentGroup.SalaryStructure, CalculationBasis = CalculationBasis.PercentOfCTC, DefaultPercentage = 50m, IsTaxable = true, IsStatutory = false, ApplicableTo = ApplicableTo.Both },
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000002"), ComponentName = "HRA", ComponentCode = "HRA", Group = ComponentGroup.SalaryStructure, CalculationBasis = CalculationBasis.PercentOfBasic, DefaultPercentage = 50m, IsTaxable = true, IsStatutory = false, ApplicableTo = ApplicableTo.Both },
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000003"), ComponentName = "Conveyance Allowance", ComponentCode = "CONV", Group = ComponentGroup.SalaryStructure, CalculationBasis = CalculationBasis.FixedAmount, DefaultPercentage = null, IsTaxable = false, IsStatutory = false, ApplicableTo = ApplicableTo.Both },
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000004"), ComponentName = "Leave Travel Allowance (LTA)", ComponentCode = "LTA", Group = ComponentGroup.SalaryStructure, CalculationBasis = CalculationBasis.PercentOfBasic, DefaultPercentage = 5m, IsTaxable = false, IsStatutory = false, ApplicableTo = ApplicableTo.Both },
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000005"), ComponentName = "Medical Allowance", ComponentCode = "MED", Group = ComponentGroup.SalaryStructure, CalculationBasis = CalculationBasis.FixedAmount, DefaultPercentage = null, IsTaxable = false, IsStatutory = false, ApplicableTo = ApplicableTo.Both },
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000006"), ComponentName = "Special Allowance", ComponentCode = "SPL_ALLOW", Group = ComponentGroup.SalaryStructure, CalculationBasis = CalculationBasis.BalancingFigure, DefaultPercentage = null, IsTaxable = true, IsStatutory = false, ApplicableTo = ApplicableTo.Both, IsBalancingComponent = true },
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), ComponentName = "Employer PF", ComponentCode = "EPF_EMP", Group = ComponentGroup.Benefit, CalculationBasis = CalculationBasis.PercentOfBasic, DefaultPercentage = 12m, IsTaxable = false, IsStatutory = true, ApplicableTo = ApplicableTo.Both },
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000008"), ComponentName = "Gratuity Provision", ComponentCode = "GRATUITY", Group = ComponentGroup.Benefit, CalculationBasis = CalculationBasis.PercentOfBasic, DefaultPercentage = 4.81m, IsTaxable = false, IsStatutory = true, ApplicableTo = ApplicableTo.Both },
            new() { ComponentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), ComponentName = "Group Health Insurance", ComponentCode = "INSURANCE", Group = ComponentGroup.Benefit, CalculationBasis = CalculationBasis.FixedAmount, DefaultPercentage = null, IsTaxable = false, IsStatutory = false, ApplicableTo = ApplicableTo.Both }
        };

        // Merge default items if DB is missing any standard component
        foreach (var def in defaultItems)
        {
            if (!catalog.Any(c => c.ComponentName.Equals(def.ComponentName, StringComparison.OrdinalIgnoreCase)))
            {
                catalog.Add(def);
            }
        }

        return Ok(ApiResponse<List<SalaryComponentCatalogDto>>.Ok(catalog.OrderBy(c => c.Group).ThenBy(c => c.ComponentName).ToList()));
    }

    /// <summary>POST /api/v1/payroll/salary-builder/calculate — Live calculation engine</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpPost("salary-builder/calculate")]
    public ActionResult<ApiResponse<SalaryBuilderCalculationResultDto>> CalculateSalaryStructure([FromBody] SalaryBuilderCalculateRequest request)
    {
        if (request == null)
            return BadRequest(ApiResponse<object>.Fail("Invalid request payload."));

        var result = _calcEngine.CalculateStructure(request);
        return Ok(ApiResponse<SalaryBuilderCalculationResultDto>.Ok(result));
    }

    /// <summary>GET /api/v1/payroll/salary-builder/me — Get logged-in employee's active salary structure</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("salary-builder/me")]
    public async Task<ActionResult<ApiResponse<EmployeeSalaryStructureDto>>> GetMySalaryStructure(CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile linked to current user."));

        return await GetEmployeeSalaryStructure(empId.Value, ct);
    }

    /// <summary>GET /api/v1/payroll/salary-builder/employee/{employeeId} — Get employee salary structure</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.View)]
    [HttpGet("salary-builder/employee/{employeeId:guid}")]
    public async Task<ActionResult<ApiResponse<EmployeeSalaryStructureDto>>> GetEmployeeSalaryStructure(Guid employeeId, CancellationToken ct)
    {
        var isOwn = _currentUser.EmployeeId == employeeId;
        var isHrOrFinance = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.PayrollAdmin, RoleCodes.FinanceHead, RoleCodes.FinanceViewer, RoleCodes.Auditor);

        if (!isOwn && !isHrOrFinance)
        {
            return StatusCode(403, ApiResponse<EmployeeSalaryStructureDto>.Fail("Access denied. You can only view your own salary structure."));
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, ct);
        if (employee == null)
            return NotFound(ApiResponse<object>.Fail("Employee not found."));

        var activeStructure = await _context.EmployeeSalaryStructures
            .Include(s => s.Allocations)
            .ThenInclude(a => a.Component)
            .FirstOrDefaultAsync(s => s.EmployeeId == employeeId && s.IsActive, ct);

        if (activeStructure == null)
        {
            // Return empty / default template representation for new setup
            var catalog = (await GetSalaryBuilderCatalog(ct)).Value?.Data ?? new();
            var calcInputs = catalog.Select(c => new SalaryComponentInputDto
            {
                ComponentId = c.ComponentId,
                ComponentName = c.ComponentName,
                Group = c.Group,
                CalculationBasis = c.CalculationBasis,
                InputMode = c.CalculationBasis == CalculationBasis.FixedAmount ? AllocationInputMode.FixedAmount : AllocationInputMode.Percent,
                Percentage = c.DefaultPercentage,
                FixedAmount = c.CalculationBasis == CalculationBasis.FixedAmount ? 0m : null,
                IsBalancingComponent = c.IsBalancingComponent,
                IsStatutory = c.IsStatutory,
                IsTaxable = c.IsTaxable,
                IsIncluded = true
            }).ToList();

            var defaultCalc = _calcEngine.CalculateStructure(new SalaryBuilderCalculateRequest
            {
                AnnualCTC = 600000m,
                Components = calcInputs
            });

            return Ok(ApiResponse<EmployeeSalaryStructureDto>.Ok(new EmployeeSalaryStructureDto
            {
                EmployeeId = employee.EmployeeId,
                EmployeeName = $"{employee.FirstName} {employee.LastName}".Trim(),
                EmployeeCode = employee.EmployeeCode,
                AnnualCTC = 600000m,
                EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow),
                IsActive = false,
                Breakdown = defaultCalc
            }));
        }

        var catalogList = (await GetSalaryBuilderCatalog(ct)).Value?.Data ?? new();

        var calcInputsFromDb = activeStructure.Allocations.Select(a => new SalaryComponentInputDto
        {
            ComponentId = a.ComponentId,
            ComponentName = a.Component?.ComponentName ?? "Component",
            Group = a.Group,
            CalculationBasis = a.Component?.CalculationBasis ?? CalculationBasis.PercentOfCTC,
            InputMode = a.InputMode,
            Percentage = a.Percentage,
            FixedAmount = a.InputMode == AllocationInputMode.FixedAmount ? a.AnnualAmount : null,
            IsBalancingComponent = a.IsBalancingComponent,
            IsStatutory = a.Component?.IsStatutory ?? false,
            IsTaxable = a.Component?.IsTaxable ?? true,
            IsIncluded = true
        }).ToList();

        // Merge any catalog components that are not in the saved structure (as unchecked/available)
        foreach (var cat in catalogList)
        {
            if (!calcInputsFromDb.Any(c => c.ComponentName.Equals(cat.ComponentName, StringComparison.OrdinalIgnoreCase)))
            {
                calcInputsFromDb.Add(new SalaryComponentInputDto
                {
                    ComponentId = cat.ComponentId,
                    ComponentName = cat.ComponentName,
                    Group = cat.Group,
                    CalculationBasis = cat.CalculationBasis,
                    InputMode = cat.CalculationBasis == CalculationBasis.FixedAmount ? AllocationInputMode.FixedAmount : AllocationInputMode.Percent,
                    Percentage = cat.DefaultPercentage,
                    FixedAmount = cat.CalculationBasis == CalculationBasis.FixedAmount ? 0m : null,
                    IsBalancingComponent = cat.IsBalancingComponent,
                    IsStatutory = cat.IsStatutory,
                    IsTaxable = cat.IsTaxable,
                    IsIncluded = false
                });
            }
        }

        var breakdown = _calcEngine.CalculateStructure(new SalaryBuilderCalculateRequest
        {
            AnnualCTC = activeStructure.AnnualCTC,
            Components = calcInputsFromDb
        });

        return Ok(ApiResponse<EmployeeSalaryStructureDto>.Ok(new EmployeeSalaryStructureDto
        {
            StructureId = activeStructure.StructureId,
            EmployeeId = activeStructure.EmployeeId,
            EmployeeName = $"{employee.FirstName} {employee.LastName}".Trim(),
            EmployeeCode = employee.EmployeeCode,
            AnnualCTC = activeStructure.AnnualCTC,
            EffectiveFrom = activeStructure.EffectiveFrom,
            EffectiveTo = activeStructure.EffectiveTo,
            IsActive = activeStructure.IsActive,
            Breakdown = breakdown
        }));
    }

    /// <summary>POST /api/v1/payroll/salary-builder/employee/{employeeId} — Save employee salary structure with SCD-2 versioning</summary>
    [Filters.RequirePermission(PermissionCodes.Payroll.Configure)]
    [HttpPost("salary-builder/employee/{employeeId:guid}")]
    public async Task<ActionResult<ApiResponse<EmployeeSalaryStructureDto>>> SaveEmployeeSalaryStructure(
        Guid employeeId,
        [FromBody] SaveEmployeeSalaryStructureRequest request,
        CancellationToken ct)
    {
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == employeeId, ct);
        if (employee == null)
            return NotFound(ApiResponse<object>.Fail("Employee not found."));

        var calcResult = _calcEngine.CalculateStructure(new SalaryBuilderCalculateRequest
        {
            AnnualCTC = request.AnnualCTC,
            Components = request.Components
        });

        if (calcResult.IsNegativeBalancing || (!calcResult.MatchesCTC && Math.Abs(calcResult.DifferenceAmount) > 1.00m))
        {
            return BadRequest(ApiResponse<object>.Fail(calcResult.StatusMessage));
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // SCD Type 2: Close current active structure
        var existingStructures = await _context.EmployeeSalaryStructures
            .Where(s => s.EmployeeId == employeeId && s.IsActive)
            .ToListAsync(ct);

        foreach (var old in existingStructures)
        {
            old.IsActive = false;
            old.EffectiveTo = today;
        }

        // Create new active structure
        var newStructure = new EmployeeSalaryStructure
        {
            StructureId = Guid.NewGuid(),
            EmployeeId = employeeId,
            AnnualCTC = request.AnnualCTC,
            EffectiveFrom = request.EffectiveFrom ?? today,
            EffectiveTo = null,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var allCalculatedComponents = calcResult.SalaryStructureComponents
            .Concat(calcResult.BenefitComponents)
            .ToList();

        foreach (var c in allCalculatedComponents)
        {
            newStructure.Allocations.Add(new EmployeeSalaryComponentAllocation
            {
                AllocationId = Guid.NewGuid(),
                StructureId = newStructure.StructureId,
                ComponentId = c.ComponentId != Guid.Empty ? c.ComponentId : Guid.NewGuid(),
                Group = c.Group,
                InputMode = c.InputMode,
                Percentage = c.Percentage,
                AnnualAmount = c.AnnualAmount,
                MonthlyAmount = c.MonthlyAmount,
                IsBalancingComponent = c.IsBalancingComponent,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.EmployeeSalaryStructures.Add(newStructure);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<EmployeeSalaryStructureDto>.Ok(new EmployeeSalaryStructureDto
        {
            StructureId = newStructure.StructureId,
            EmployeeId = newStructure.EmployeeId,
            EmployeeName = $"{employee.FirstName} {employee.LastName}".Trim(),
            EmployeeCode = employee.EmployeeCode,
            AnnualCTC = newStructure.AnnualCTC,
            EffectiveFrom = newStructure.EffectiveFrom,
            IsActive = true,
            Breakdown = calcResult
        }, "Salary structure saved successfully."));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Models
// ─────────────────────────────────────────────────────────────────────────────

public class CreateComponentRequest
{
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentCode { get; set; } = string.Empty;
    public string ComponentType { get; set; } = "Earning";
    public string CalculationType { get; set; } = "Fixed";
    public string? Group { get; set; } = "SalaryStructure";
    public decimal? DefaultPercentage { get; set; }
    public bool IsStatutory { get; set; }
    public bool IsTaxable { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateStructureRequest
{
    public string StructureName { get; set; } = string.Empty;
    public string EffectiveFrom { get; set; } = string.Empty;
    public string? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
    public List<StructureComponentRequest>? Components { get; set; }
}

public class StructureComponentRequest
{
    public Guid ComponentId { get; set; }
    public decimal FixedValue { get; set; }
    public string? Formula { get; set; }
}
