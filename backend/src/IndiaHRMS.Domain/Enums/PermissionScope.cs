namespace IndiaHRMS.Domain.Enums;

public enum PermissionScope 
{ 
    None,         // "No" in the matrix
    Own,          // "Own" — self-data only
    Team,         // "Team" — direct reports only (via IReportingScopeService)
    AssignedDept, // "Assigned departments" — HR_MANAGER's data scope
    Full,         // "Full" — everything
    View,         // "View" — read-only, all records in scope
    Special       // module-specific: Referral, Interview, F&F, IT Tasks, System
}

public class RolePermissionScope
{
    public string RoleCode { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public PermissionScope Scope { get; set; }
    public string? SpecialNote { get; set; }
}
