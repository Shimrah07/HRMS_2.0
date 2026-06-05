namespace IndiaHRMS.Domain.Constants;

public static class PermissionCodes
{
    public static class Employee
    {
        public const string View = "EMPLOYEE.VIEW";
        public const string Create = "EMPLOYEE.CREATE";
        public const string Edit = "EMPLOYEE.EDIT";
        public const string Delete = "EMPLOYEE.DELETE";
        public const string Export = "EMPLOYEE.EXPORT";
    }

    public static class Attendance
    {
        public const string View = "ATTENDANCE.VIEW";
        public const string Create = "ATTENDANCE.CREATE";
        public const string Edit = "ATTENDANCE.EDIT";
        public const string Approve = "ATTENDANCE.APPROVE";
        public const string Export = "ATTENDANCE.EXPORT";
        public const string Import = "ATTENDANCE.IMPORT";
    }

    public static class Leave
    {
        public const string View = "LEAVE.VIEW";
        public const string Create = "LEAVE.CREATE";
        public const string Edit = "LEAVE.EDIT";
        public const string Approve = "LEAVE.APPROVE";
        public const string Reject = "LEAVE.REJECT";
        public const string Export = "LEAVE.EXPORT";
        public const string Configure = "LEAVE.CONFIGURE";
    }

    public static class Payroll
    {
        public const string View = "PAYROLL.VIEW";
        public const string Process = "PAYROLL.PROCESS";
        public const string Approve = "PAYROLL.APPROVE";
        public const string Export = "PAYROLL.EXPORT";
        public const string Generate = "PAYROLL.GENERATE";
        public const string Configure = "PAYROLL.CONFIGURE";
    }

    public static class Recruitment
    {
        public const string View = "RECRUITMENT.VIEW";
        public const string Create = "RECRUITMENT.CREATE";
        public const string Edit = "RECRUITMENT.EDIT";
        public const string Delete = "RECRUITMENT.DELETE";
        public const string Approve = "RECRUITMENT.APPROVE";
        public const string Export = "RECRUITMENT.EXPORT";
    }

    public static class Performance
    {
        public const string View = "PERFORMANCE.VIEW";
        public const string Create = "PERFORMANCE.CREATE";
        public const string Edit = "PERFORMANCE.EDIT";
        public const string Approve = "PERFORMANCE.APPROVE";
        public const string Export = "PERFORMANCE.EXPORT";
    }

    public static class Training
    {
        public const string View = "TRAINING.VIEW";
        public const string Create = "TRAINING.CREATE";
        public const string Edit = "TRAINING.EDIT";
        public const string Assign = "TRAINING.ASSIGN";
        public const string Export = "TRAINING.EXPORT";
    }

    public static class Separation
    {
        public const string View = "SEPARATION.VIEW";
        public const string Create = "SEPARATION.CREATE";
        public const string Approve = "SEPARATION.APPROVE";
        public const string Export = "SEPARATION.EXPORT";
    }

    public static class Reports
    {
        public const string View = "REPORTS.VIEW";
        public const string Export = "REPORTS.EXPORT";
        public const string Generate = "REPORTS.GENERATE";
        public const string Custom = "REPORTS.CUSTOM";
    }

    public static class UserManagement
    {
        public const string View = "USER_MGMT.VIEW";
        public const string Create = "USER_MGMT.CREATE";
        public const string Edit = "USER_MGMT.EDIT";
        public const string Delete = "USER_MGMT.DELETE";
        public const string Assign = "USER_MGMT.ASSIGN";
    }

    public static class CompanySetup
    {
        public const string View = "COMPANY_SETUP.VIEW";
        public const string Create = "COMPANY_SETUP.CREATE";
        public const string Edit = "COMPANY_SETUP.EDIT";
        public const string Delete = "COMPANY_SETUP.DELETE";
    }

    public static class Compliance
    {
        public const string View = "COMPLIANCE.VIEW";
        public const string Manage = "COMPLIANCE.MANAGE";
        public const string Export = "COMPLIANCE.EXPORT";
    }

    public static class Notifications
    {
        public const string View = "NOTIFICATIONS.VIEW";
        public const string Manage = "NOTIFICATIONS.MANAGE";
    }

    public static class Audit
    {
        public const string View = "AUDIT.VIEW";
        public const string Export = "AUDIT.EXPORT";
    }
}

public static class RoleCodes
{
    public const string SuperAdmin = "SUPER_ADMIN";
    public const string HRAdmin = "HR_ADMIN";
    public const string HRManager = "HR_MANAGER";
    public const string PayrollAdmin = "PAYROLL_ADMIN";
    public const string RecruitmentManager = "RECRUITMENT_MGR";
    public const string DeptManager = "DEPT_MANAGER";
    public const string Employee = "EMPLOYEE";
    public const string Auditor = "AUDITOR";
    public const string ITAdmin = "IT_ADMIN";
    public const string FinanceViewer = "FINANCE_VIEWER";
}

public static class SystemSettingKeys
{
    public const string PFEmployeePercent = "PF_EMPLOYEE_PERCENT";
    public const string PFEmployerPercent = "PF_EMPLOYER_PERCENT";
    public const string PFWageCeiling = "PF_WAGE_CEILING";
    public const string ESIEmployeePercent = "ESI_EMPLOYEE_PERCENT";
    public const string ESIEmployerPercent = "ESI_EMPLOYER_PERCENT";
    public const string ESIWageCeiling = "ESI_WAGE_CEILING";
    public const string BonusWageCeiling = "BONUS_WAGE_CEILING";
    public const string GratuityNumerator = "GRATUITY_NUMERATOR";
    public const string GratuityDenominator = "GRATUITY_DENOMINATOR";
    public const string GratuityMaxAmount = "GRATUITY_MAX_AMOUNT";
    public const string EmployeeIdPrefix = "EMPLOYEE_ID_PREFIX";
    public const string ProbationPeriodDays = "PROBATION_PERIOD_DAYS";
    public const string MaxFailedLoginAttempts = "MAX_FAILED_LOGIN_ATTEMPTS";
    public const string AccountLockoutMinutes = "ACCOUNT_LOCKOUT_MINUTES";
    public const string SessionTimeoutMinutes = "SESSION_TIMEOUT_MINUTES";
    public const string PasswordMinLength = "PASSWORD_MIN_LENGTH";
}
