namespace IndiaHRMS.Domain.Enums;

public enum ComponentGroup
{
    SalaryStructure = 1,
    Benefit = 2
}

public enum CalculationBasis
{
    PercentOfCTC = 1,
    PercentOfBasic = 2,
    FixedAmount = 3,
    BalancingFigure = 4
}

public enum AllocationInputMode
{
    Percent = 1,
    FixedAmount = 2
}

public enum ApplicableTo
{
    Private = 1,
    Government = 2,
    Both = 3
}
