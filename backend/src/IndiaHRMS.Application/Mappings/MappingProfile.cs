using AutoMapper;
using IndiaHRMS.Application.DTOs.Auth;
using IndiaHRMS.Application.DTOs.Employee;
using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.DTOs.User;
using IndiaHRMS.Application.DTOs.Performance;
using IndiaHRMS.Application.DTOs.Recruitment;
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
            .ForMember(d => d.ReportingManagerName, o => o.MapFrom(s => s.ReportingManager != null ? $"{s.ReportingManager.FirstName} {s.ReportingManager.LastName}" : null))
            .ForMember(d => d.GradeCode, o => o.MapFrom(s => s.Grade != null ? s.Grade.Code : null))
            .ForMember(d => d.BandCode, o => o.MapFrom(s => s.Band != null ? s.Band.Code : null))
            .ForMember(d => d.JobFamilyName, o => o.MapFrom(s => s.JobFamily != null ? s.JobFamily.Name : null))
            .ForMember(d => d.BusinessUnitName, o => o.MapFrom(s => s.BusinessUnit != null ? s.BusinessUnit.Name : null))
            .ForMember(d => d.CostCenterName, o => o.MapFrom(s => s.CostCenter != null ? s.CostCenter.CostCenterName : null))
            .ForMember(d => d.ShiftName, o => o.MapFrom(s => s.Shift != null ? s.Shift.ShiftName : null));

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
            .ForMember(d => d.L2ReportingManagerName, o => o.MapFrom(s => s.L2ReportingManager != null ? $"{s.L2ReportingManager.FirstName} {s.L2ReportingManager.LastName}" : null))
            .ForMember(d => d.FunctionalManagerName, o => o.MapFrom(s => s.FunctionalManager != null ? $"{s.FunctionalManager.FirstName} {s.FunctionalManager.LastName}" : null))
            .ForMember(d => d.BusinessUnitName, o => o.MapFrom(s => s.BusinessUnit != null ? s.BusinessUnit.Name : null))
            .ForMember(d => d.DivisionName, o => o.MapFrom(s => s.Division != null ? s.Division.Name : null))
            .ForMember(d => d.SubDeptName, o => o.MapFrom(s => s.SubDepartment != null ? s.SubDepartment.DeptName : null))
            .ForMember(d => d.TeamName, o => o.MapFrom(s => s.Team != null ? s.Team.Name : null))
            .ForMember(d => d.GradeName, o => o.MapFrom(s => s.Grade != null ? s.Grade.Name : null))
            .ForMember(d => d.GradeCode, o => o.MapFrom(s => s.Grade != null ? s.Grade.Code : null))
            .ForMember(d => d.BandName, o => o.MapFrom(s => s.Band != null ? s.Band.Name : null))
            .ForMember(d => d.JobFamilyName, o => o.MapFrom(s => s.JobFamily != null ? s.JobFamily.Name : null))
            .ForMember(d => d.JobFunctionName, o => o.MapFrom(s => s.JobFunction != null ? s.JobFunction.Name : null))
            .ForMember(d => d.ProfitCenterName, o => o.MapFrom(s => s.ProfitCenter != null ? s.ProfitCenter.Name : null))
            .ForMember(d => d.ShiftName, o => o.MapFrom(s => s.Shift != null ? s.Shift.ShiftName : null))
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
            .ForMember(d => d.ProfilePhoto, o => o.Ignore())
            .ForMember(d => d.BusinessUnit, o => o.Ignore())
            .ForMember(d => d.Division, o => o.Ignore())
            .ForMember(d => d.SubDepartment, o => o.Ignore())
            .ForMember(d => d.Team, o => o.Ignore())
            .ForMember(d => d.Grade, o => o.Ignore())
            .ForMember(d => d.Band, o => o.Ignore())
            .ForMember(d => d.JobFamily, o => o.Ignore())
            .ForMember(d => d.JobFunction, o => o.Ignore())
            .ForMember(d => d.ProfitCenter, o => o.Ignore())
            .ForMember(d => d.L2ReportingManager, o => o.Ignore())
            .ForMember(d => d.FunctionalManager, o => o.Ignore())
            .ForMember(d => d.Shift, o => o.Ignore());

        CreateMap<UpdateEmployeeRequest, Employee>()
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.EmployeeCode, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.ProfilePhoto, o => o.Ignore())
            .ForMember(d => d.BusinessUnit, o => o.Ignore())
            .ForMember(d => d.Division, o => o.Ignore())
            .ForMember(d => d.SubDepartment, o => o.Ignore())
            .ForMember(d => d.Team, o => o.Ignore())
            .ForMember(d => d.Grade, o => o.Ignore())
            .ForMember(d => d.Band, o => o.Ignore())
            .ForMember(d => d.JobFamily, o => o.Ignore())
            .ForMember(d => d.JobFunction, o => o.Ignore())
            .ForMember(d => d.ProfitCenter, o => o.Ignore())
            .ForMember(d => d.L2ReportingManager, o => o.Ignore())
            .ForMember(d => d.FunctionalManager, o => o.Ignore())
            .ForMember(d => d.Shift, o => o.Ignore());

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
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<UpdatePFNomineeRequest, PFNominee>()
            .ForMember(d => d.NomineeId, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
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

        // ─── Masters Mappings ──────────────────────────────────────────────────
        CreateMap<BusinessUnit, BusinessUnitDto>();
        CreateMap<CreateBusinessUnitRequest, BusinessUnit>()
            .ForMember(d => d.BusinessUnitId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore())
            .ForMember(d => d.Divisions, o => o.Ignore());
        CreateMap<UpdateBusinessUnitRequest, BusinessUnit>()
            .ForMember(d => d.BusinessUnitId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore())
            .ForMember(d => d.Divisions, o => o.Ignore());

        CreateMap<Division, DivisionDto>()
            .ForMember(d => d.BusinessUnitName, o => o.MapFrom(s => s.BusinessUnit != null ? s.BusinessUnit.Name : null));
        CreateMap<CreateDivisionRequest, Division>()
            .ForMember(d => d.DivisionId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.BusinessUnit, o => o.Ignore());
        CreateMap<UpdateDivisionRequest, Division>()
            .ForMember(d => d.DivisionId, o => o.Ignore())
            .ForMember(d => d.BusinessUnitId, o => o.Ignore())
            .ForMember(d => d.BusinessUnit, o => o.Ignore());

        CreateMap<Department, SubDepartmentDto>()
            .ForMember(d => d.SubDeptId, o => o.MapFrom(s => s.DeptId))
            .ForMember(d => d.DeptId, o => o.MapFrom(s => s.ParentDeptId ?? Guid.Empty))
            .ForMember(d => d.Name, o => o.MapFrom(s => s.DeptName))
            .ForMember(d => d.Code, o => o.MapFrom(s => s.DeptCode))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.ParentDept != null ? s.ParentDept.DeptName : null));

        CreateMap<CreateSubDepartmentRequest, Department>()
            .ForMember(d => d.DeptId, o => o.Ignore())
            .ForMember(d => d.ParentDeptId, o => o.MapFrom(s => s.DeptId))
            .ForMember(d => d.DeptName, o => o.MapFrom(s => s.Name))
            .ForMember(d => d.DeptCode, o => o.MapFrom(s => s.Code))
            .ForMember(d => d.IsActive, o => o.MapFrom(_ => true))
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore())
            .ForMember(d => d.ParentDept, o => o.Ignore())
            .ForMember(d => d.ChildDepts, o => o.Ignore())
            .ForMember(d => d.HODEmployee, o => o.Ignore())
            .ForMember(d => d.Employees, o => o.Ignore());

        CreateMap<UpdateSubDepartmentRequest, Department>()
            .ForMember(d => d.DeptId, o => o.Ignore())
            .ForMember(d => d.ParentDeptId, o => o.Ignore())
            .ForMember(d => d.DeptName, o => o.MapFrom(s => s.Name))
            .ForMember(d => d.DeptCode, o => o.MapFrom(s => s.Code))
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore())
            .ForMember(d => d.ParentDept, o => o.Ignore())
            .ForMember(d => d.ChildDepts, o => o.Ignore())
            .ForMember(d => d.HODEmployee, o => o.Ignore())
            .ForMember(d => d.Employees, o => o.Ignore());

        CreateMap<Team, TeamDto>()
            .ForMember(d => d.SubDepartmentName, o => o.MapFrom(s => s.SubDepartment != null ? s.SubDepartment.DeptName : null));
        CreateMap<CreateTeamRequest, Team>()
            .ForMember(d => d.TeamId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.SubDepartment, o => o.Ignore());
        CreateMap<UpdateTeamRequest, Team>()
            .ForMember(d => d.TeamId, o => o.Ignore())
            .ForMember(d => d.SubDeptId, o => o.Ignore())
            .ForMember(d => d.SubDepartment, o => o.Ignore());

        CreateMap<GradeMaster, GradeMasterDto>();
        CreateMap<CreateGradeRequest, GradeMaster>()
            .ForMember(d => d.GradeId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore());
        CreateMap<UpdateGradeRequest, GradeMaster>()
            .ForMember(d => d.GradeId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore());

        CreateMap<BandMaster, BandMasterDto>();
        CreateMap<CreateBandRequest, BandMaster>()
            .ForMember(d => d.BandId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore());
        CreateMap<UpdateBandRequest, BandMaster>()
            .ForMember(d => d.BandId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore());

        CreateMap<JobFamily, JobFamilyDto>();
        CreateMap<CreateJobFamilyRequest, JobFamily>()
            .ForMember(d => d.JobFamilyId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore())
            .ForMember(d => d.JobFunctions, o => o.Ignore());
        CreateMap<UpdateJobFamilyRequest, JobFamily>()
            .ForMember(d => d.JobFamilyId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore())
            .ForMember(d => d.JobFunctions, o => o.Ignore());

        CreateMap<JobFunction, JobFunctionDto>()
            .ForMember(d => d.JobFamilyName, o => o.MapFrom(s => s.JobFamily != null ? s.JobFamily.Name : null));
        CreateMap<CreateJobFunctionRequest, JobFunction>()
            .ForMember(d => d.JobFunctionId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.JobFamily, o => o.Ignore());
        CreateMap<UpdateJobFunctionRequest, JobFunction>()
            .ForMember(d => d.JobFunctionId, o => o.Ignore())
            .ForMember(d => d.JobFamilyId, o => o.Ignore())
            .ForMember(d => d.JobFamily, o => o.Ignore());

        CreateMap<ProfitCenter, ProfitCenterDto>();
        CreateMap<CreateProfitCenterRequest, ProfitCenter>()
            .ForMember(d => d.ProfitCenterId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore());
        CreateMap<UpdateProfitCenterRequest, ProfitCenter>()
            .ForMember(d => d.ProfitCenterId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore());

        // ─── Recruitment & Onboarding ─────────────────────────────────────────
        CreateMap<JobRequisition, JobRequisitionDto>()
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.DeptName))
            .ForMember(d => d.DesignationTitle, o => o.MapFrom(s => s.Designation.Title))
            .ForMember(d => d.DesignationName, o => o.MapFrom(s => s.Designation.Title))
            .ForMember(d => d.RaisedByUserName, o => o.MapFrom(s => s.RaisedByUser.Username))
            .ForMember(d => d.RaisedByName, o => o.MapFrom(s => s.RaisedByUser.FirstName + " " + s.RaisedByUser.LastName))
            .ForMember(d => d.ApprovedByUserName, o => o.MapFrom(s => s.ApprovedByUser != null ? s.ApprovedByUser.Username : null))
            .ForMember(d => d.SubDepartmentName, o => o.Ignore())
            .ForMember(d => d.HiringManagerName, o => o.Ignore())
            .ForMember(d => d.ReplacingEmployeeName, o => o.Ignore())
            .ForMember(d => d.GradeName, o => o.Ignore())
            .ForMember(d => d.CurrentApproverName, o => o.Ignore());

        CreateMap<CreateJobRequisitionRequest, JobRequisition>()
            .ForMember(d => d.ReqId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.RequisitionDate, o => o.Ignore())
            .ForMember(d => d.Status, o => o.Ignore())
            .ForMember(d => d.RaisedBy, o => o.Ignore())
            .ForMember(d => d.ApprovedBy, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore())
            .ForMember(d => d.Department, o => o.Ignore())
            .ForMember(d => d.Designation, o => o.Ignore())
            .ForMember(d => d.RaisedByUser, o => o.Ignore())
            .ForMember(d => d.ApprovedByUser, o => o.Ignore())
            .ForMember(d => d.JobApplications, o => o.Ignore())
            .ForMember(d => d.JobPostings, o => o.Ignore())
            .ForMember(d => d.MrfNumber, o => o.Ignore())
            .ForMember(d => d.InternalHiringJustification, o => o.Ignore())
            .ForMember(d => d.InternalHiringRemarks, o => o.Ignore())
            .ForMember(d => d.CurrentApproverId, o => o.Ignore())
            .ForMember(d => d.CurrentApprovalLevel, o => o.Ignore());

        CreateMap<UpdateJobRequisitionRequest, JobRequisition>()
            .ForMember(d => d.ReqId, o => o.Ignore())
            .ForMember(d => d.CompanyId, o => o.Ignore())
            .ForMember(d => d.RequisitionDate, o => o.Ignore())
            .ForMember(d => d.RaisedBy, o => o.Ignore())
            .ForMember(d => d.ApprovedBy, o => o.Ignore())
            .ForMember(d => d.Company, o => o.Ignore())
            .ForMember(d => d.Department, o => o.Ignore())
            .ForMember(d => d.Designation, o => o.Ignore())
            .ForMember(d => d.RaisedByUser, o => o.Ignore())
            .ForMember(d => d.ApprovedByUser, o => o.Ignore())
            .ForMember(d => d.JobApplications, o => o.Ignore())
            .ForMember(d => d.JobPostings, o => o.Ignore())
            .ForMember(d => d.MrfNumber, o => o.Ignore())
            .ForMember(d => d.InternalHiringJustification, o => o.Ignore())
            .ForMember(d => d.InternalHiringRemarks, o => o.Ignore())
            .ForMember(d => d.CurrentApproverId, o => o.Ignore())
            .ForMember(d => d.CurrentApprovalLevel, o => o.Ignore());

        CreateMap<JobPosting, JobPostingDto>()
            .ForMember(d => d.PublishingChannels, o => o.MapFrom(s => s.PublishingChannels.Select(pc => pc.ChannelName).ToList()))
            .ForMember(d => d.PerksAndBenefitsList, o => o.MapFrom(s => s.PerksAndBenefits.Select(pb => pb.PerkName).ToList()))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.JobPostingQuestions, o => o.MapFrom(s => s.JobPostingQuestions))
            .ForMember(d => d.InternalJobTitle, o => o.MapFrom(s => s.JobRequisition != null ? s.JobRequisition.JobTitle : null))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.JobRequisition != null && s.JobRequisition.Department != null ? s.JobRequisition.Department.DeptName : null))
            .ForMember(d => d.DesignationName, o => o.MapFrom(s => s.JobRequisition != null && s.JobRequisition.Designation != null ? s.JobRequisition.Designation.Title : null))
            .ForMember(d => d.GradeName, o => o.MapFrom(s => s.JobRequisition != null && s.JobRequisition.Grade != null ? s.JobRequisition.Grade.Name : null))
            .ForMember(d => d.MinSalary, o => o.MapFrom(s => s.JobRequisition != null ? s.JobRequisition.MinSalary : null))
            .ForMember(d => d.MaxSalary, o => o.MapFrom(s => s.JobRequisition != null ? s.JobRequisition.MaxSalary : null));

        CreateMap<CreateJobPostingRequest, JobPosting>()
            .ForMember(d => d.JobId, o => o.Ignore())
            .ForMember(d => d.PostedAt, o => o.Ignore())
            .ForMember(d => d.Status, o => o.Ignore())
            .ForMember(d => d.JobRequisition, o => o.Ignore())
            .ForMember(d => d.PublishChannels, o => o.MapFrom(s => string.Join(",", s.PublishChannels)))
            .ForMember(d => d.PublishingChannels, o => o.MapFrom(s => s.PublishingChannels.Select(pc => new JobPostingChannel { ChannelName = pc }).ToList()))
            .ForMember(d => d.PerksAndBenefits, o => o.MapFrom(s => s.PerksAndBenefits.Select(pb => new JobPostingPerk { PerkName = pb }).ToList()))
            .ForMember(d => d.JobPostingQuestions, o => o.MapFrom(s => s.JobPostingQuestions));

        CreateMap<UpdateJobPostingRequest, JobPosting>()
            .ForMember(d => d.JobId, o => o.Ignore())
            .ForMember(d => d.ReqId, o => o.Ignore())
            .ForMember(d => d.PostedAt, o => o.Ignore())
            .ForMember(d => d.JobRequisition, o => o.Ignore())
            .ForMember(d => d.PublishChannels, o => o.MapFrom(s => string.Join(",", s.PublishChannels)))
            .ForMember(d => d.PublishingChannels, o => o.MapFrom(s => s.PublishingChannels.Select(pc => new JobPostingChannel { ChannelName = pc }).ToList()))
            .ForMember(d => d.PerksAndBenefits, o => o.MapFrom(s => s.PerksAndBenefits.Select(pb => new JobPostingPerk { PerkName = pb }).ToList()))
            .ForMember(d => d.JobPostingQuestions, o => o.MapFrom(s => s.JobPostingQuestions));

        CreateMap<Candidate, CandidateDto>()
            .ForMember(d => d.ReferralEmployeeName, o => o.MapFrom(s => s.ReferralEmployee != null ? (s.ReferralEmployee.FirstName + " " + s.ReferralEmployee.LastName) : null))
            .ForMember(d => d.CandidateStatus, o => o.MapFrom(s => s.CandidateStatus.ToString()))
            .ForMember(d => d.Source, o => o.MapFrom(s => s.Source.HasValue ? s.Source.Value.ToString() : null))
            .ForMember(d => d.Gender, o => o.MapFrom(s => s.Gender.HasValue ? s.Gender.Value.ToString() : null));

        CreateMap<CreateCandidateRequest, Candidate>()
            .ForMember(d => d.CandidateId, o => o.Ignore())
            .ForMember(d => d.ResumeFilePath, o => o.Ignore())
            .ForMember(d => d.CandidateStatus, o => o.Ignore())
            .ForMember(d => d.LastApplicationDate, o => o.Ignore())
            .ForMember(d => d.ReferralEmployee, o => o.Ignore())
            .ForMember(d => d.JobApplications, o => o.Ignore())
            .ForMember(d => d.BGVRecords, o => o.Ignore())
            .ForMember(d => d.Onboardings, o => o.Ignore())
            .ForMember(d => d.CandidateAnswers, o => o.Ignore())
            .ForMember(d => d.Source, o => o.MapFrom(s => string.IsNullOrEmpty(s.Source) ? (CandidateSource?)null : Enum.Parse<CandidateSource>(s.Source)))
            .ForMember(d => d.Gender, o => o.MapFrom(s => string.IsNullOrEmpty(s.Gender) ? (Gender?)null : Enum.Parse<Gender>(s.Gender)));

        CreateMap<UpdateCandidateRequest, Candidate>()
            .ForMember(d => d.CandidateId, o => o.Ignore())
            .ForMember(d => d.ResumeFilePath, o => o.Ignore())
            .ForMember(d => d.ReferralEmployee, o => o.Ignore())
            .ForMember(d => d.JobApplications, o => o.Ignore())
            .ForMember(d => d.BGVRecords, o => o.Ignore())
            .ForMember(d => d.Onboardings, o => o.Ignore())
            .ForMember(d => d.CandidateAnswers, o => o.Ignore())
            .ForMember(d => d.LastApplicationDate, o => o.Ignore())
            .ForMember(d => d.Source, o => o.MapFrom(s => string.IsNullOrEmpty(s.Source) ? (CandidateSource?)null : Enum.Parse<CandidateSource>(s.Source)))
            .ForMember(d => d.CandidateStatus, o => o.MapFrom(s => string.IsNullOrEmpty(s.CandidateStatus) ? CandidateStatus.Active : Enum.Parse<CandidateStatus>(s.CandidateStatus)))
            .ForMember(d => d.Gender, o => o.MapFrom(s => string.IsNullOrEmpty(s.Gender) ? (Gender?)null : Enum.Parse<Gender>(s.Gender)));

        CreateMap<JobPostingQuestion, JobPostingQuestionDto>()
            .ForMember(d => d.QuestionType, o => o.MapFrom(s => s.QuestionType.ToString()));
        CreateMap<CreateJobPostingQuestionRequest, JobPostingQuestion>()
            .ForMember(d => d.QuestionId, o => o.Ignore())
            .ForMember(d => d.JobPostingId, o => o.Ignore())
            .ForMember(d => d.JobPosting, o => o.Ignore())
            .ForMember(d => d.CandidateAnswers, o => o.Ignore());

        CreateMap<CandidateAnswer, CandidateAnswerDto>();
        CreateMap<CreateCandidateAnswerRequest, CandidateAnswer>()
            .ForMember(d => d.AnswerId, o => o.Ignore())
            .ForMember(d => d.CandidateId, o => o.Ignore())
            .ForMember(d => d.Candidate, o => o.Ignore())
            .ForMember(d => d.JobPostingQuestion, o => o.Ignore())
            .ForMember(d => d.Passed, o => o.Ignore())
            .ForMember(d => d.AnsweredOn, o => o.Ignore())
            .ForMember(d => d.AnsweredBy, o => o.Ignore());

        CreateMap<JobApplication, JobApplicationDto>()
            .ForMember(d => d.JobTitle, o => o.MapFrom(s => s.Requisition.JobTitle))
            .ForMember(d => d.CandidateName, o => o.MapFrom(s => $"{s.Candidate.FirstName} {s.Candidate.LastName}"))
            .ForMember(d => d.CandidateEmail, o => o.MapFrom(s => s.Candidate.Email));

        CreateMap<InterviewRound, InterviewRoundDto>()
            .ForMember(d => d.InterviewerName, o => o.MapFrom(s => $"{s.Interviewer.FirstName} {s.Interviewer.LastName}"));

        CreateMap<InterviewRoundPanelist, InterviewRoundPanelistDto>()
            .ForMember(d => d.EmployeeName, o => o.MapFrom(s => $"{s.Employee.FirstName} {s.Employee.LastName}"));

        CreateMap<OfferLetter, OfferLetterDto>()
            .ForMember(d => d.CandidateName, o => o.MapFrom(s => $"{s.JobApplication.Candidate.FirstName} {s.JobApplication.Candidate.LastName}"))
            .ForMember(d => d.JobTitle, o => o.MapFrom(s => s.JobApplication.Requisition.JobTitle));

        CreateMap<BGVRecord, BGVRecordDto>();
        CreateMap<OnboardingProcess, OnboardingProcessDto>()
            .ForMember(d => d.CandidateName, o => o.MapFrom(s => $"{s.Candidate.FirstName} {s.Candidate.LastName}"))
            .ForMember(d => d.BuddyName, o => o.MapFrom(s => s.BuddyEmployee != null ? $"{s.BuddyEmployee.FirstName} {s.BuddyEmployee.LastName}" : null));

        CreateMap<OnboardingTask, OnboardingTaskDto>()
            .ForMember(d => d.OwnerName, o => o.MapFrom(s => s.Owner != null ? $"{s.Owner.FirstName} {s.Owner.LastName}" : string.Empty));

        CreateMap<ProbationReview, ProbationReviewDto>()
            .ForMember(d => d.EmployeeName, o => o.MapFrom(s => $"{s.Employee.FirstName} {s.Employee.LastName}"))
            .ForMember(d => d.ReviewerName, o => o.MapFrom(s => s.Reviewer != null ? $"{s.Reviewer.FirstName} {s.Reviewer.LastName}" : string.Empty));
    }
}
