using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Application.DTOs.Payroll;

public class SalaryComponentCatalogDto
{
    public Guid ComponentId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentCode { get; set; } = string.Empty;
    public ComponentGroup Group { get; set; }
    public CalculationBasis CalculationBasis { get; set; }
    public decimal? DefaultPercentage { get; set; }
    public bool IsTaxable { get; set; }
    public bool IsStatutory { get; set; }
    public ApplicableTo ApplicableTo { get; set; }
    public bool IsBalancingComponent { get; set; }
}

public class SalaryComponentInputDto
{
    public Guid ComponentId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public ComponentGroup Group { get; set; }
    public CalculationBasis CalculationBasis { get; set; }
    public AllocationInputMode InputMode { get; set; }
    public decimal? Percentage { get; set; }
    public decimal? FixedAmount { get; set; }
    public bool IsBalancingComponent { get; set; }
    public bool IsStatutory { get; set; }
    public bool IsTaxable { get; set; }
    public bool IsIncluded { get; set; } = true;
}

public class SalaryBuilderCalculateRequest
{
    public decimal AnnualCTC { get; set; }
    public List<SalaryComponentInputDto> Components { get; set; } = new();
}

public class SalaryComponentCalculationDto
{
    public Guid ComponentId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public ComponentGroup Group { get; set; }
    public CalculationBasis CalculationBasis { get; set; }
    public AllocationInputMode InputMode { get; set; }
    public decimal? Percentage { get; set; }
    public decimal AnnualAmount { get; set; }
    public decimal MonthlyAmount { get; set; }
    public bool IsBalancingComponent { get; set; }
    public bool IsStatutory { get; set; }
    public bool IsTaxable { get; set; }
}

public class SalaryBuilderCalculationResultDto
{
    public decimal TargetAnnualCTC { get; set; }
    public decimal TotalAllocatedAnnual { get; set; }
    public decimal TotalAllocatedMonthly { get; set; }
    public decimal SalaryStructureSubtotalAnnual { get; set; }
    public decimal SalaryStructureSubtotalMonthly { get; set; }
    public decimal BenefitsSubtotalAnnual { get; set; }
    public decimal BenefitsSubtotalMonthly { get; set; }
    public decimal DifferenceAmount { get; set; }
    public bool MatchesCTC { get; set; }
    public bool IsNegativeBalancing { get; set; }
    public string StatusMessage { get; set; } = string.Empty;

    public List<SalaryComponentCalculationDto> SalaryStructureComponents { get; set; } = new();
    public List<SalaryComponentCalculationDto> BenefitComponents { get; set; } = new();
}

public class SaveEmployeeSalaryStructureRequest
{
    public Guid EmployeeId { get; set; }
    public decimal AnnualCTC { get; set; }
    public DateOnly? EffectiveFrom { get; set; }
    public List<SalaryComponentInputDto> Components { get; set; } = new();
}

public class EmployeeSalaryStructureDto
{
    public Guid StructureId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public decimal AnnualCTC { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; }
    public SalaryBuilderCalculationResultDto Breakdown { get; set; } = new();
}
