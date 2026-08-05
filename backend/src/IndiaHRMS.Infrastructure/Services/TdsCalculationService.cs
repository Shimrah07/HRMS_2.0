using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Infrastructure.Services;

// --- DTOs ---------------------------------------------------------------------

public record TdsInput(
    Guid EmployeeId,
    decimal AnnualCTC,
    decimal AnnualBasic,
    TaxRegime SelectedRegime,
    // Old regime deductions
    decimal Section80C = 0m,
    decimal Section80D = 0m,
    decimal Section80E = 0m,
    decimal Section80G = 0m,
    decimal HraClaimAmount = 0m,
    decimal HomeLoanInterest = 0m,
    decimal PreviousEmployerIncome = 0m,
    decimal PreviousEmployerTds = 0m,
    // Statutory
    decimal AnnualPFEmployee = 0m,
    // Month info
    int CurrentMonth = 1,  // 1-12, used to spread TDS over remaining months
    int FinancialYearStartMonth = 4  // Indian FY starts April
);

public record TdsResult(
    TaxRegime RecommendedRegime,
    TaxRegime AppliedRegime,
    decimal OldRegimeTaxableIncome,
    decimal OldRegimeTax,
    decimal NewRegimeTaxableIncome,
    decimal NewRegimeTax,
    decimal AnnualTds,
    decimal MonthlyTds,
    decimal RemainingFYMonths,
    string Breakdown
);

// --- Interface ----------------------------------------------------------------

public interface ITdsCalculationService
{
    TdsResult Calculate(TdsInput input);
}

// --- Implementation -----------------------------------------------------------

public class TdsCalculationService : ITdsCalculationService
{
    public TdsResult Calculate(TdsInput inp)
    {
        // -- New Regime ----------------------------------------------------------
        decimal newTaxable = Math.Max(0, inp.AnnualCTC + inp.PreviousEmployerIncome - 75_000m); // standard deduction ?75,000
        decimal newTax = ComputeTaxNewRegime(newTaxable);
        newTax = ApplySurchargeAndCess(newTaxable, newTax);

        // -- Old Regime ----------------------------------------------------------
        decimal hraCap = Math.Min(inp.HraClaimAmount, inp.AnnualBasic * 0.50m); // metro 50%; simplified
        decimal totalDeductions = Math.Min(inp.Section80C + inp.AnnualPFEmployee, 150_000m) // 80C cap
            + Math.Min(inp.Section80D, 25_000m)
            + Math.Min(inp.Section80E, 200_000m)
            + Math.Min(inp.Section80G, 100_000m)
            + Math.Min(inp.HomeLoanInterest, 200_000m)
            + hraCap;
        decimal oldTaxable = Math.Max(0, inp.AnnualCTC + inp.PreviousEmployerIncome - 50_000m - totalDeductions); // standard deduction ?50,000
        decimal oldTax = ComputeTaxOldRegime(oldTaxable);
        oldTax = ApplySurchargeAndCess(oldTaxable, oldTax);

        // Adjust for previous employer TDS already paid
        var recommended = newTax <= oldTax ? TaxRegime.New : TaxRegime.Old;
        var applied = inp.SelectedRegime;

        decimal annualTds = (applied == TaxRegime.New ? newTax : oldTax) - inp.PreviousEmployerTds;
        annualTds = Math.Max(0, annualTds);

        // Remaining FY months (April start)
        int monthsInFY = 12;
        int monthsElapsed = (inp.CurrentMonth >= inp.FinancialYearStartMonth)
            ? inp.CurrentMonth - inp.FinancialYearStartMonth
            : (inp.CurrentMonth + 12 - inp.FinancialYearStartMonth);
        int remainingMonths = Math.Max(1, monthsInFY - monthsElapsed);

        decimal monthlyTds = Math.Round(annualTds / remainingMonths, 2);

        var breakdown = $"New: taxable={newTaxable:N0} tax={newTax:N0} | Old: taxable={oldTaxable:N0} tax={oldTax:N0} | Applied={applied} | Annual TDS={annualTds:N0} | Monthly={monthlyTds:N2} over {remainingMonths} months";

        return new TdsResult(recommended, applied, oldTaxable, oldTax, newTaxable, newTax, annualTds, monthlyTds, remainingMonths, breakdown);
    }

    // -- New Regime Slabs (FY 2025-26) ------------------------------------------
    private static decimal ComputeTaxNewRegime(decimal income)
    {
        if (income <= 400_000m) return 0m;
        decimal tax = 0m;
        var slabs = new (decimal from, decimal to, decimal rate)[]
        {
            (0m, 400_000m, 0m),
            (400_000m, 800_000m, 0.05m),
            (800_000m, 1_200_000m, 0.10m),
            (1_200_000m, 1_600_000m, 0.15m),
            (1_600_000m, 2_000_000m, 0.20m),
            (2_000_000m, 2_400_000m, 0.25m),
            (2_400_000m, decimal.MaxValue, 0.30m)
        };
        foreach (var (from, to, rate) in slabs)
        {
            if (income <= from) break;
            var slice = Math.Min(income, to) - from;
            if (slice > 0) tax += slice * rate;
        }
        // Rebate u/s 87A: if taxable = ?7L, rebate up to ?25,000
        if (income <= 700_000m) tax = Math.Max(0, tax - 25_000m);
        return Math.Round(tax, 2);
    }

    // -- Old Regime Slabs -------------------------------------------------------
    private static decimal ComputeTaxOldRegime(decimal income)
    {
        if (income <= 250_000m) return 0m;
        decimal tax = 0m;
        var slabs = new (decimal from, decimal to, decimal rate)[]
        {
            (0m, 250_000m, 0m),
            (250_000m, 500_000m, 0.05m),
            (500_000m, 1_000_000m, 0.20m),
            (1_000_000m, decimal.MaxValue, 0.30m)
        };
        foreach (var (from, to, rate) in slabs)
        {
            if (income <= from) break;
            var slice = Math.Min(income, to) - from;
            if (slice > 0) tax += slice * rate;
        }
        // Rebate u/s 87A: taxable = ?5L, rebate up to ?12,500
        if (income <= 500_000m) tax = Math.Max(0, tax - 12_500m);
        return Math.Round(tax, 2);
    }

    // -- Surcharge + 4% Cess ----------------------------------------------------
    private static decimal ApplySurchargeAndCess(decimal income, decimal baseTax)
    {
        decimal surchargeRate = income switch
        {
            > 50_000_000m => 0.37m,
            > 20_000_000m => 0.25m,
            > 10_000_000m => 0.15m,
            > 5_000_000m => 0.10m,
            _ => 0m
        };
        decimal taxWithSurcharge = baseTax + baseTax * surchargeRate;
        decimal cess = taxWithSurcharge * 0.04m; // 4% Health & Education Cess
        return Math.Round(taxWithSurcharge + cess, 2);
    }
}
