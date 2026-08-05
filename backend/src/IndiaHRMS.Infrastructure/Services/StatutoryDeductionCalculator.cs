using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.Infrastructure.Services;

// --- DTOs ---------------------------------------------------------------------

public record StatutoryInput(
    Guid EmployeeId,
    Guid CompanyId,
    decimal BasicPlusDA,
    decimal GrossSalary,
    string WorkState,
    int Month,
    bool PFHigherBasis = false,
    bool VPFOptIn = false,
    decimal VPFAmount = 0m
);

public record StatutoryResult(
    decimal PFEmployee,
    decimal PFEmployer,
    decimal EPSEmployer,
    decimal ESIEmployee,
    decimal ESIEmployer,
    decimal ProfessionalTax,
    decimal LWFEmployee,
    decimal LWFEmployer,
    decimal VPF,
    decimal GratuityProvision,
    bool ESIApplicable,
    bool PFApplicable,
    string Notes
);

// --- Interface ----------------------------------------------------------------

public interface IStatutoryDeductionCalculator
{
    Task<StatutoryResult> CalculateAsync(StatutoryInput input, CancellationToken ct = default);
}

// --- Implementation -----------------------------------------------------------

public class StatutoryDeductionCalculator : IStatutoryDeductionCalculator
{
    private readonly AppDbContext _context;

    public StatutoryDeductionCalculator(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StatutoryResult> CalculateAsync(StatutoryInput inp, CancellationToken ct = default)
    {
        var notes = new List<string>();

        var config = await _context.StatutoryDeductionConfigs
            .FirstOrDefaultAsync(c => c.CompanyId == inp.CompanyId && c.WorkState == inp.WorkState, ct)
            ?? await _context.StatutoryDeductionConfigs
                .FirstOrDefaultAsync(c => c.CompanyId == inp.CompanyId, ct);

        // PF
        decimal pfEmployee = 0m, pfEmployer = 0m, epsEmployer = 0m, vpf = 0m;
        bool pfApplicable = config?.PFApplicable ?? true;

        if (pfApplicable)
        {
            decimal pfWageCeiling = config?.PFWageCeiling ?? 15000m;
            bool higherBasis = inp.PFHigherBasis || (config?.PFHigherBasis ?? false);
            decimal pfBase = higherBasis ? inp.BasicPlusDA : Math.Min(inp.BasicPlusDA, pfWageCeiling);

            pfEmployee = Math.Round(pfBase * 0.12m, 2);
            epsEmployer = Math.Round(Math.Min(pfBase * 0.0833m, higherBasis ? decimal.MaxValue : 1250m), 2);
            decimal pfEPFEmployer = Math.Round(pfBase * 0.0367m, 2);
            pfEmployer = epsEmployer + pfEPFEmployer;

            if (inp.VPFOptIn && inp.VPFAmount > 0)
            {
                vpf = Math.Round(Math.Min(inp.VPFAmount, inp.BasicPlusDA), 2);
                notes.Add($"VPF: Rs.{vpf:N2}");
            }
            notes.Add($"PF base: Rs.{pfBase:N2} ({(higherBasis ? "actual" : "capped at Rs.15,000")})");
        }
        else notes.Add("PF: Not applicable");

        // ESI
        decimal esiEmployee = 0m, esiEmployer = 0m;
        decimal esiLimit = config?.ESIGrossLimit ?? 21000m;
        bool esiApplicable = (config?.ESIApplicable ?? true) && inp.GrossSalary <= esiLimit;

        if (esiApplicable)
        {
            esiEmployee = Math.Round(inp.GrossSalary * 0.0075m, 2);
            esiEmployer = Math.Round(inp.GrossSalary * 0.0325m, 2);
            notes.Add($"ESI applicable: Gross Rs.{inp.GrossSalary:N2}");
        }
        else notes.Add($"ESI not applicable: Gross Rs.{inp.GrossSalary:N2} > Rs.{esiLimit:N2}");

        // PT
        decimal pt = 0m;
        if (config?.PTApplicable ?? true)
        {
            pt = await GetPTAsync(inp.CompanyId, inp.WorkState, inp.GrossSalary, inp.Month, ct);
            notes.Add($"PT ({inp.WorkState}): Rs.{pt:N2}");
        }

        // LWF
        decimal lwfEmployee = 0m, lwfEmployer = 0m;
        if (config?.LWFApplicable == true)
        {
            lwfEmployee = config.LWFEmployeeAmount;
            lwfEmployer = config.LWFEmployerAmount;
        }

        // Gratuity monthly provision (4.81% of Basic+DA / 12)
        decimal gratuityMonthly = Math.Round(inp.BasicPlusDA * 0.0481m / 12m, 2);

        return new StatutoryResult(pfEmployee, pfEmployer, epsEmployer, esiEmployee, esiEmployer, pt, lwfEmployee, lwfEmployer, vpf, gratuityMonthly, esiApplicable, pfApplicable, string.Join("; ", notes));
    }

    private async Task<decimal> GetPTAsync(Guid companyId, string state, decimal monthlyGross, int month, CancellationToken ct)
    {
        var slabs = await _context.ProfessionalTaxSlabs
            .Where(s => s.CompanyId == companyId && s.StateCode == state)
            .OrderBy(s => s.FromAmount)
            .ToListAsync(ct);

        var effectiveSlabs = slabs.Any() ? slabs : GetDefaultMaharashtraSlabs();

        foreach (var slab in effectiveSlabs.OrderByDescending(s => s.FromAmount))
        {
            if (monthlyGross >= slab.FromAmount && (slab.ToAmount == null || monthlyGross <= slab.ToAmount))
            {
                if (month == 2 && slab.FebruaryOverride.HasValue)
                    return slab.FebruaryOverride.Value;
                return slab.MonthlyPTAmount;
            }
        }
        return 0m;
    }

    private static List<ProfessionalTaxSlab> GetDefaultMaharashtraSlabs() => new()
    {
        new() { StateCode = "MH", FromAmount = 0m,     ToAmount = 7500m,   MonthlyPTAmount = 0m,   FebruaryOverride = null },
        new() { StateCode = "MH", FromAmount = 7501m,  ToAmount = 10000m,  MonthlyPTAmount = 175m, FebruaryOverride = null },
        new() { StateCode = "MH", FromAmount = 10001m, ToAmount = null,    MonthlyPTAmount = 200m, FebruaryOverride = 300m }
    };
}
