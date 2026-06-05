using AutoMapper;
using IndiaHRMS.Application.DTOs.Auth;
using IndiaHRMS.Application.DTOs.Employee;
using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.DTOs.User;
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

        // ─── Designation ───────────────────────────────────────────────────────
        CreateMap<Designation, DesignationDto>()
            .ForMember(d => d.EmployeeCount, o => o.MapFrom(s => s.Employees.Count(e => e.IsActive)));
        CreateMap<CreateDesignationRequest, Designation>()
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

        // ─── Employee Sub-entities ──────────────────────────────────────────────
        CreateMap<EmployeeDocument, EmployeeDocumentDto>();
        CreateMap<EmployeeBankDetail, BankDetailDto>()
            .ForMember(d => d.MaskedAccountNumber, o => o.Ignore());
        CreateMap<EmployeeEducation, EducationDto>();
        CreateMap<EmployeeExperience, ExperienceDto>();
        CreateMap<PFNominee, PFNomineeDto>();

        // ─── Audit Log ─────────────────────────────────────────────────────────
        CreateMap<AuditLog, AuditLogDto>()
            .ForMember(d => d.UserName, o => o.MapFrom(s => s.User != null ? s.User.Username : null));

        // ─── Notification ──────────────────────────────────────────────────────
        CreateMap<Notification, NotificationDto>()
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()));
    }
}
