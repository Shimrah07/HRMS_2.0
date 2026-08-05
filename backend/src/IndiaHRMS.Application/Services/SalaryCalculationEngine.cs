using IndiaHRMS.Application.DTOs.Payroll;
using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Application.Services;

public interface ISalaryCalculationEngine
{
    SalaryBuilderCalculationResultDto CalculateStructure(SalaryBuilderCalculateRequest request);
}

public class SalaryCalculationEngine : ISalaryCalculationEngine
{
    public SalaryBuilderCalculationResultDto CalculateStructure(SalaryBuilderCalculateRequest request)
    {
        var result = new SalaryBuilderCalculationResultDto
        {
            TargetAnnualCTC = request.AnnualCTC
        };

        if (request.AnnualCTC <= 0)
        {
            result.StatusMessage = "Annual CTC must be greater than 0.";
            result.MatchesCTC = false;
            return result;
        }

        var activeComponents = request.Components.Where(c => c.IsIncluded).ToList();

        // 1. Find Basic Salary component (if present)
        var basicInput = activeComponents.FirstOrDefault(c =>
            c.ComponentName.Contains("Basic", StringComparison.OrdinalIgnoreCase));

        decimal basicAnnual = 0;
        if (basicInput != null)
        {
            if (basicInput.InputMode == AllocationInputMode.Percent)
            {
                var pct = basicInput.Percentage ?? 0;
                basicAnnual = Math.Round(request.AnnualCTC * (pct / 100m), 2);
            }
            else
            {
                basicAnnual = basicInput.FixedAmount ?? 0;
            }
        }

        // 2. Process non-balancing components
        var calcList = new List<SalaryComponentCalculationDto>();
        SalaryComponentInputDto? balancingInput = null;

        foreach (var input in activeComponents)
        {
            if (input.IsBalancingComponent || input.CalculationBasis == CalculationBasis.BalancingFigure)
            {
                balancingInput = input;
                continue;
            }

            decimal annual = 0;
            if (input.CalculationBasis == CalculationBasis.PercentOfCTC)
            {
                var pct = input.Percentage ?? 0;
                annual = Math.Round(request.AnnualCTC * (pct / 100m), 2);
            }
            else if (input.CalculationBasis == CalculationBasis.PercentOfBasic)
            {
                var pct = input.Percentage ?? 0;
                annual = Math.Round(basicAnnual * (pct / 100m), 2);
            }
            else // FixedAmount
            {
                annual = input.FixedAmount ?? (input.Percentage.HasValue ? Math.Round(request.AnnualCTC * (input.Percentage.Value / 100m), 2) : 0);
            }

            // Back-calculate percentage for display if user typed fixed amount
            decimal? displayPct = input.Percentage;
            if (input.InputMode == AllocationInputMode.FixedAmount && request.AnnualCTC > 0)
            {
                displayPct = Math.Round((annual / request.AnnualCTC) * 100m, 2);
            }

            // Monthly amount rounded to 2 decimal places for accuracy
            decimal monthly = Math.Round(annual / 12m, 2);

            calcList.Add(new SalaryComponentCalculationDto
            {
                ComponentId = input.ComponentId,
                ComponentName = input.ComponentName,
                Group = input.Group,
                CalculationBasis = input.CalculationBasis,
                InputMode = input.InputMode,
                Percentage = displayPct,
                AnnualAmount = annual,
                MonthlyAmount = monthly,
                IsBalancingComponent = false,
                IsStatutory = input.IsStatutory,
                IsTaxable = input.IsTaxable
            });
        }

        // 3. Compute balancing component
        decimal totalNonBalancingAnnual = calcList.Sum(c => c.AnnualAmount);
        decimal balancingAnnual = request.AnnualCTC - totalNonBalancingAnnual;

        if (balancingInput == null)
        {
            // If no balancing component is explicitly checked, look for "Special Allowance"
            balancingInput = activeComponents.FirstOrDefault(c =>
                c.ComponentName.Contains("Special", StringComparison.OrdinalIgnoreCase))
                ?? new SalaryComponentInputDto
                {
                    ComponentId = Guid.NewGuid(),
                    ComponentName = "Special Allowance",
                    Group = ComponentGroup.SalaryStructure,
                    CalculationBasis = CalculationBasis.BalancingFigure,
                    InputMode = AllocationInputMode.Percent,
                    IsBalancingComponent = true
                };
        }

        decimal balancingMonthly = Math.Round(balancingAnnual / 12m, 2);
        decimal? balancingPct = request.AnnualCTC > 0 ? Math.Round((balancingAnnual / request.AnnualCTC) * 100m, 2) : 0;

        var balancingDto = new SalaryComponentCalculationDto
        {
            ComponentId = balancingInput.ComponentId,
            ComponentName = balancingInput.ComponentName,
            Group = balancingInput.Group,
            CalculationBasis = CalculationBasis.BalancingFigure,
            InputMode = AllocationInputMode.Percent,
            Percentage = balancingPct,
            AnnualAmount = balancingAnnual,
            MonthlyAmount = balancingMonthly,
            IsBalancingComponent = true,
            IsStatutory = balancingInput.IsStatutory,
            IsTaxable = balancingInput.IsTaxable
        };

        calcList.Add(balancingDto);

        // 4. Populate Result Summaries
        result.SalaryStructureComponents = calcList.Where(c => c.Group == ComponentGroup.SalaryStructure).ToList();
        result.BenefitComponents = calcList.Where(c => c.Group == ComponentGroup.Benefit).ToList();

        result.SalaryStructureSubtotalAnnual = result.SalaryStructureComponents.Sum(c => c.AnnualAmount);
        result.SalaryStructureSubtotalMonthly = Math.Round(result.SalaryStructureComponents.Sum(c => c.MonthlyAmount), 2);

        result.BenefitsSubtotalAnnual = result.BenefitComponents.Sum(c => c.AnnualAmount);
        result.BenefitsSubtotalMonthly = Math.Round(result.BenefitComponents.Sum(c => c.MonthlyAmount), 2);

        result.TotalAllocatedAnnual = result.SalaryStructureSubtotalAnnual + result.BenefitsSubtotalAnnual;
        result.TotalAllocatedMonthly = Math.Round(result.SalaryStructureSubtotalMonthly + result.BenefitsSubtotalMonthly, 2);

        result.DifferenceAmount = Math.Round(request.AnnualCTC - result.TotalAllocatedAnnual, 2);

        if (balancingAnnual < 0)
        {
            result.IsNegativeBalancing = true;
            result.MatchesCTC = false;
            result.StatusMessage = $"⚠️ Over-allocated by ₹{Math.Abs(balancingAnnual):N2}. Reduce other components.";
        }
        else if (Math.Abs(result.DifferenceAmount) <= 1.00m)
        {
            result.IsNegativeBalancing = false;
            result.MatchesCTC = true;
            result.StatusMessage = "✅ Matches CTC";
        }
        else
        {
            result.IsNegativeBalancing = false;
            result.MatchesCTC = false;
            result.StatusMessage = $"⚠️ Under by ₹{result.DifferenceAmount:N2}";
        }

        return result;
    }
}
