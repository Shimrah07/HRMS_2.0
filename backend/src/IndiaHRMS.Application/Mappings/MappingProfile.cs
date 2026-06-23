using AutoMapper;
using IndiaHRMS.Application.DTOs.Auth;
using IndiaHRMS.Application.DTOs.Employee;
using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.DTOs.User;
using IndiaHRMS.Application.DTOs.Performance;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Application.Mappings;

public class HRMSMappingProfile : Profile
{
    public HRMSMappingProfile()
    {
        // ─── User ──────────────────────────────────────────────────────────────
        CreateMap<User, UserListDto>()
            .ForMember(d => d.Roles, o => o.Ignore());
        CreateMap<User, UserDetailDto>()
            .ForMember(d => d.Roles, o => o.Ignore())
            .ForMember(d => d.AssignedRoles, o => o.Ignore());

        // ─── Role / Permission ─────────────────────────────────────────────────
        CreateMap<Role, RoleDto>()
            .ForMember(d => d.Permissions, o => o.Ignore());
        CreateMap<Permission, PermissionDto>();

        // ─── Company ───────────────────────────────────────────────────────────
        CreateMap<Company, CompanyDto>();
        CreateMap<UpdateCompanyRequest, Company>()
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore());

        // ─── Department ────────────────────────────────────────────────────────
        CreateMap<Department, DepartmentDto>()
            .ForMember(d => d.ParentDeptName, o => o.MapFrom(s => s.ParentDept != null ? s.ParentDept.DeptName : null))
            .ForMember(d => d.HODName, o => o.MapFrom(s => s.HODEmployee != null ? $"{s.HODEmployee.FirstName} {s.HODEmployee.LastName}" : null))
            .ForMember(d => d.EmployeeCount, o => o.MapFrom(s => s.Employees.Count(e => e.IsActive)))
            .ForMember(d => d.Children, o => o.Ignore());
        CreateMap<CreateDepartmentRequest, Department>()
            .ForMember(d => d.DeptId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore());
        CreateMap<UpdateDepartmentRequest, Department>()
            .ForMember(d => d.DeptId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore());

        // ─── Designation ───────────────────────────────────────────────────────
        CreateMap<Designation, DesignationDto>()
            .ForMember(d => d.EmployeeCount, o => o.MapFrom(s => s.Employees.Count(e => e.IsActive)));
        CreateMap<CreateDesignationRequest, Designation>()
            .ForMember(d => d.DesignationId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore());
        CreateMap<UpdateDesignationRequest, Designation>()
            .ForMember(d => d.DesignationId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore());

        // ─── Location ──────────────────────────────────────────────────────────
        CreateMap<Location, LocationDto>()
            .ForMember(d => d.EmployeeCount, o => o.MapFrom(s => s.Employees.Count(e => e.IsActive)));
        CreateMap<CreateLocationRequest, Location>()
            .ForMember(d => d.LocationId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore());
        CreateMap<UpdateLocationRequest, Location>()
            .ForMember(d => d.LocationId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore());

        // ─── CostCenter ────────────────────────────────────────────────────────
        CreateMap<CostCenter, CostCenterDto>()
            .ForMember(d => d.ManagerName, o => o.MapFrom(s => s.ManagerEmployee != null ? $"{s.ManagerEmployee.FirstName} {s.ManagerEmployee.LastName}" : null));

        // ─── Employee ──────────────────────────────────────────────────────────
        CreateMap<Employee, EmployeeListDto>()
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.DeptName))
            .ForMember(d => d.DesignationTitle, o => o.MapFrom(s => s.Designation.Title))
            .ForMember(d => d.LocationName, o => o.MapFrom(s => s.Location.LocationName))
            .ForMember(d => d.ReportingManagerName, o => o.MapFrom(s => s.ReportingManager != null ? $"{s.ReportingManager.FirstName} {s.ReportingManager.LastName}" : null));

        CreateMap<Employee, EmployeeSummaryDto>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => $"{s.FirstName} {s.MiddleName} {s.LastName}".Replace("  ", " ").Trim()))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.DeptName))
            .ForMember(d => d.DesignationTitle, o => o.MapFrom(s => s.Designation.Title))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.EmploymentStatus));

        CreateMap<Employee, EmployeeDetailDto>()
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.DeptName))
            .ForMember(d => d.DesignationTitle, o => o.MapFrom(s => s.Designation.Title))
            .ForMember(d => d.LocationName, o => o.MapFrom(s => s.Location.LocationName))
            .ForMember(d => d.CostCenterName, o => o.MapFrom(s => s.CostCenter != null ? s.CostCenter.CostCenterName : null))
            .ForMember(d => d.ReportingManagerName, o => o.MapFrom(s => s.ReportingManager != null ? $"{s.ReportingManager.FirstName} {s.ReportingManager.LastName}" : null))
            .ForMember(d => d.MaskedAadhar, o => o.Ignore())
            .ForMember(d => d.MaskedPAN, o => o.Ignore());

        CreateMap<Employee, DirectoryEntryDto>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => $"{s.FirstName} {s.MiddleName} {s.LastName}".Replace("  ", " ").Trim()))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.DeptName))
            .ForMember(d => d.DesignationTitle, o => o.MapFrom(s => s.Designation.Title))
            .ForMember(d => d.LocationName, o => o.MapFrom(s => s.Location.LocationName));

        CreateMap<Employee, OrgChartNodeDto>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => $"{s.FirstName} {s.LastName}"))
            .ForMember(d => d.DesignationTitle, o => o.MapFrom(s => s.Designation.Title))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.DeptName))
            .ForMember(d => d.DirectReports, o => o.Ignore());

        CreateMap<CreateEmployeeRequest, Employee>()
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.EmployeeCode, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.EmploymentStatus, o => o.MapFrom(_ => EmploymentStatus.Active))
            .ForMember(d => d.IsActive, o => o.MapFrom(_ => true))
            .ForMember(d => d.ProfilePhoto, o => o.Ignore());

        CreateMap<UpdateEmployeeRequest, Employee>()
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.EmployeeCode, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.ProfilePhoto, o => o.Ignore());

        // ─── Employee Sub-entities ──────────────────────────────────────────────
        CreateMap<EmployeeDocument, EmployeeDocumentDto>();
        CreateMap<EmployeeBankDetail, BankDetailDto>()
            .ForMember(d => d.MaskedAccountNumber, o => o.Ignore());
        CreateMap<EmployeeEducation, EducationDto>();
        CreateMap<AddEducationRequest, EmployeeEducation>()
            .ForMember(d => d.EduId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<UpdateEducationRequest, EmployeeEducation>()
            .ForMember(d => d.EduId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<EmployeeExperience, ExperienceDto>();
        CreateMap<AddExperienceRequest, EmployeeExperience>()
            .ForMember(d => d.ExpId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.IsVerified, o => o.MapFrom(_ => false))
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<UpdateExperienceRequest, EmployeeExperience>()
            .ForMember(d => d.ExpId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.IsVerified, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<PFNominee, PFNomineeDto>();
        CreateMap<AddPFNomineeRequest, PFNominee>()
            .ForMember(d => d.NomineeId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.AadharNumber, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<UpdatePFNomineeRequest, PFNominee>()
            .ForMember(d => d.NomineeId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.AadharNumber, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());


        // ─── Audit Log ─────────────────────────────────────────────────────────
        CreateMap<AuditLog, AuditLogDto>()
            .ForMember(d => d.UserName, o => o.MapFrom(s => s.User != null ? s.User.Username : null));

        // ─── Notification ──────────────────────────────────────────────────────
        CreateMap<Notification, NotificationDto>()
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()));

        // ─── Performance ──────────────────────────────────────────────────────
        CreateMap<AppraisalCycle, AppraisalCycleDto>();
        CreateMap<CreateAppraisalCycleRequest, AppraisalCycle>()
            .ForMember(d => d.CycleId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.EmployeeGoals, o => o.Ignore())
            .ForMember(d => d.PerformanceReviews, o => o.Ignore());

        CreateMap<EmployeeGoal, EmployeeGoalDto>()
            .ForMember(d => d.EmployeeName, o => o.MapFrom(s => $"{s.Employee.FirstName} {s.Employee.LastName}"));
        CreateMap<CreateGoalRequest, EmployeeGoal>()
            .ForMember(d => d.GoalId, o => o.Ignore())
            .ForMember(d => d.Status, o => o.MapFrom(_ => "Active"))
            .ForMember(d => d.SelfRating, o => o.Ignore())
            .ForMember(d => d.ManagerRating, o => o.Ignore())
            .ForMember(d => d.Cycle, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<UpdateGoalRequest, EmployeeGoal>()
            .ForMember(d => d.GoalId, o => o.Ignore())
            .ForMember(d => d.CycleId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Cycle, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());

        CreateMap<PerformanceReview, PerformanceReviewDto>()
            .ForMember(d => d.CycleName, o => o.MapFrom(s => s.Cycle.CycleName))
            .ForMember(d => d.EmployeeName, o => o.MapFrom(s => $"{s.Employee.FirstName} {s.Employee.LastName}"))
            .ForMember(d => d.EmployeeCode, o => o.MapFrom(s => s.Employee.EmployeeCode))
            .ForMember(d => d.DesignationTitle, o => o.MapFrom(s => s.Employee.Designation.Title))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Employee.Department.DeptName))
            .ForMember(d => d.ReviewerName, o => o.MapFrom(s => $"{s.Reviewer.FirstName} {s.Reviewer.LastName}"));
        CreateMap<CreateReviewRequest, PerformanceReview>()
            .ForMember(d => d.ReviewId, o => o.Ignore())
            .ForMember(d => d.ReviewerId, o => o.Ignore())
            .ForMember(d => d.SubmittedAt, o => o.Ignore())
            .ForMember(d => d.Cycle, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore())
            .ForMember(d => d.Reviewer, o => o.Ignore());

        CreateMap<PIP, PipDto>()
            .ForMember(d => d.EmployeeName, o => o.MapFrom(s => $"{s.Employee.FirstName} {s.Employee.LastName}"))
            .ForMember(d => d.EmployeeCode, o => o.MapFrom(s => s.Employee.EmployeeCode))
            .ForMember(d => d.DesignationTitle, o => o.MapFrom(s => s.Employee.Designation.Title))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Employee.Department.DeptName))
            .ForMember(d => d.InitiatorName, o => o.Ignore());
        CreateMap<CreatePipRequest, PIP>()
            .ForMember(d => d.PIPId, o => o.Ignore())
            .ForMember(d => d.Status, o => o.MapFrom(_ => PIPStatus.Active))
            .ForMember(d => d.InitiatedBy, o => o.Ignore())
            .ForMember(d => d.ClosedAt, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<UpdatePipRequest, PIP>()
            .ForMember(d => d.PIPId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.StartDate, o => o.Ignore())
            .ForMember(d => d.EndDate, o => o.Ignore())
            .ForMember(d => d.Reason, o => o.Ignore())
            .ForMember(d => d.InitiatedBy, o => o.Ignore())
            .ForMember(d => d.ClosedAt, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
    }
}
