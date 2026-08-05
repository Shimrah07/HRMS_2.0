using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Domain.Constants;

public static class RbacMatrix
{
    public static readonly List<RolePermissionScope> Matrix = new()
    {
        // ─── EMPLOYEE_MASTER ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "EMPLOYEE_MASTER", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "EMPLOYEE_MASTER", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "EMPLOYEE_MASTER", Scope = PermissionScope.AssignedDept, SpecialNote = "Manage" },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
        new() { RoleCode = "DEPT_MANAGER",        Module = "EMPLOYEE_MASTER", Scope = PermissionScope.Team },
        new() { RoleCode = "EMPLOYEE",            Module = "EMPLOYEE_MASTER", Scope = PermissionScope.Own },
        new() { RoleCode = "AUDITOR",             Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "EMPLOYEE_MASTER", Scope = PermissionScope.View },

        // ─── RECRUITMENT ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "RECRUITMENT", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "RECRUITMENT", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "RECRUITMENT", Scope = PermissionScope.AssignedDept },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "RECRUITMENT", Scope = PermissionScope.None },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "RECRUITMENT", Scope = PermissionScope.Full },
        new() { RoleCode = "DEPT_MANAGER",        Module = "RECRUITMENT", Scope = PermissionScope.Special, SpecialNote = "Interview" },
        new() { RoleCode = "EMPLOYEE",            Module = "RECRUITMENT", Scope = PermissionScope.Special, SpecialNote = "Referral" },
        new() { RoleCode = "AUDITOR",             Module = "RECRUITMENT", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "RECRUITMENT", Scope = PermissionScope.None },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "RECRUITMENT", Scope = PermissionScope.None },

        // ─── ONBOARDING ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "ONBOARDING", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "ONBOARDING", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "ONBOARDING", Scope = PermissionScope.AssignedDept },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "ONBOARDING", Scope = PermissionScope.View },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "ONBOARDING", Scope = PermissionScope.Full },
        new() { RoleCode = "DEPT_MANAGER",        Module = "ONBOARDING", Scope = PermissionScope.Team },
        new() { RoleCode = "EMPLOYEE",            Module = "ONBOARDING", Scope = PermissionScope.Own },
        new() { RoleCode = "AUDITOR",             Module = "ONBOARDING", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "ONBOARDING", Scope = PermissionScope.Special, SpecialNote = "IT Tasks" },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "ONBOARDING", Scope = PermissionScope.None },

        // ─── ATTENDANCE ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "ATTENDANCE", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "ATTENDANCE", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "ATTENDANCE", Scope = PermissionScope.AssignedDept },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "ATTENDANCE", Scope = PermissionScope.View },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "ATTENDANCE", Scope = PermissionScope.None },
        new() { RoleCode = "DEPT_MANAGER",        Module = "ATTENDANCE", Scope = PermissionScope.Team },
        new() { RoleCode = "EMPLOYEE",            Module = "ATTENDANCE", Scope = PermissionScope.Own },
        new() { RoleCode = "AUDITOR",             Module = "ATTENDANCE", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "ATTENDANCE", Scope = PermissionScope.None },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "ATTENDANCE", Scope = PermissionScope.None },

        // ─── LEAVE ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "LEAVE", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "LEAVE", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "LEAVE", Scope = PermissionScope.AssignedDept },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "LEAVE", Scope = PermissionScope.View },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "LEAVE", Scope = PermissionScope.None },
        new() { RoleCode = "DEPT_MANAGER",        Module = "LEAVE", Scope = PermissionScope.Team },
        new() { RoleCode = "EMPLOYEE",            Module = "LEAVE", Scope = PermissionScope.Own },
        new() { RoleCode = "AUDITOR",             Module = "LEAVE", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "LEAVE", Scope = PermissionScope.None },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "LEAVE", Scope = PermissionScope.None },

        // ─── PAYROLL ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "PAYROLL", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "PAYROLL", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "PAYROLL", Scope = PermissionScope.None },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "PAYROLL", Scope = PermissionScope.Full },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "PAYROLL", Scope = PermissionScope.None },
        new() { RoleCode = "DEPT_MANAGER",        Module = "PAYROLL", Scope = PermissionScope.None },
        new() { RoleCode = "EMPLOYEE",            Module = "PAYROLL", Scope = PermissionScope.Own },
        new() { RoleCode = "AUDITOR",             Module = "PAYROLL", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "PAYROLL", Scope = PermissionScope.None },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "PAYROLL", Scope = PermissionScope.View },

        // ─── PERFORMANCE ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "PERFORMANCE", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "PERFORMANCE", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "PERFORMANCE", Scope = PermissionScope.AssignedDept },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "PERFORMANCE", Scope = PermissionScope.None },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "PERFORMANCE", Scope = PermissionScope.None },
        new() { RoleCode = "DEPT_MANAGER",        Module = "PERFORMANCE", Scope = PermissionScope.Team },
        new() { RoleCode = "EMPLOYEE",            Module = "PERFORMANCE", Scope = PermissionScope.Own },
        new() { RoleCode = "AUDITOR",             Module = "PERFORMANCE", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "PERFORMANCE", Scope = PermissionScope.None },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "PERFORMANCE", Scope = PermissionScope.None },

        // ─── TRAINING ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "TRAINING", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "TRAINING", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "TRAINING", Scope = PermissionScope.AssignedDept },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "TRAINING", Scope = PermissionScope.None },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "TRAINING", Scope = PermissionScope.None },
        new() { RoleCode = "DEPT_MANAGER",        Module = "TRAINING", Scope = PermissionScope.Team },
        new() { RoleCode = "EMPLOYEE",            Module = "TRAINING", Scope = PermissionScope.Own },
        new() { RoleCode = "AUDITOR",             Module = "TRAINING", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "TRAINING", Scope = PermissionScope.None },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "TRAINING", Scope = PermissionScope.None },

        // ─── SEPARATION ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "SEPARATION", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "SEPARATION", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "SEPARATION", Scope = PermissionScope.AssignedDept },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "SEPARATION", Scope = PermissionScope.Special, SpecialNote = "F&F" },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "SEPARATION", Scope = PermissionScope.None },
        new() { RoleCode = "DEPT_MANAGER",        Module = "SEPARATION", Scope = PermissionScope.Team },
        new() { RoleCode = "EMPLOYEE",            Module = "SEPARATION", Scope = PermissionScope.Own },
        new() { RoleCode = "AUDITOR",             Module = "SEPARATION", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "SEPARATION", Scope = PermissionScope.Special, SpecialNote = "IT Clearance" },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "SEPARATION", Scope = PermissionScope.None },

        // ─── REPORTS ───
        new() { RoleCode = "SUPER_ADMIN",         Module = "REPORTS", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_ADMIN",            Module = "REPORTS", Scope = PermissionScope.Full },
        new() { RoleCode = "HR_MANAGER",          Module = "REPORTS", Scope = PermissionScope.AssignedDept },
        new() { RoleCode = "PAYROLL_ADMIN",       Module = "REPORTS", Scope = PermissionScope.Full },
        new() { RoleCode = "RECRUITMENT_MANAGER", Module = "REPORTS", Scope = PermissionScope.Special, SpecialNote = "Recruitment Reports" },
        new() { RoleCode = "DEPT_MANAGER",        Module = "REPORTS", Scope = PermissionScope.Team },
        new() { RoleCode = "EMPLOYEE",            Module = "REPORTS", Scope = PermissionScope.None },
        new() { RoleCode = "AUDITOR",             Module = "REPORTS", Scope = PermissionScope.View },
        new() { RoleCode = "IT_ADMIN",            Module = "REPORTS", Scope = PermissionScope.Special, SpecialNote = "System Logs" },
        new() { RoleCode = "FINANCE_VIEWER",      Module = "REPORTS", Scope = PermissionScope.View }
    };

    public static PermissionScope GetScope(string roleCode, string module)
    {
        var entry = Matrix.FirstOrDefault(m => 
            m.RoleCode.Equals(roleCode, StringComparison.OrdinalIgnoreCase) && 
            m.Module.Equals(module, StringComparison.OrdinalIgnoreCase));

        return entry?.Scope ?? PermissionScope.None;
    }
}
