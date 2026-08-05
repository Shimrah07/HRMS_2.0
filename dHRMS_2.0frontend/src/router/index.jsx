import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import AppLayout from '../components/layout/AppLayout'
import ProtectedRoute from './ProtectedRoute'
import { PERMISSIONS } from '../constants/permissions'

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
)

const wrap = (Component) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
)

// Lazy imports
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const EmployeeListPage = lazy(() => import('../pages/employees/EmployeeListPage'))
const EmployeeDetailPage = lazy(() => import('../pages/employees/EmployeeDetailPage'))
const CreateEmployeePage = lazy(() => import('../pages/employees/CreateEmployeePage'))
const MyProfilePage = lazy(() => import('../pages/employees/MyProfilePage'))
const DirectoryPage = lazy(() => import('../pages/employees/DirectoryPage'))
const DepartmentsPage = lazy(() => import('../pages/organization/DepartmentsPage'))
const DesignationsPage = lazy(() => import('../pages/organization/DesignationsPage'))
const LocationsPage = lazy(() => import('../pages/organization/LocationsPage'))
const OrgChartPage = lazy(() => import('../pages/organization/OrgChartPage'))
const UserManagementPage = lazy(() => import('../pages/users/UserManagementPage'))
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))
const PayrollPage = lazy(() => import('../pages/payroll/PayrollPage'))
const PayrollDashboardPage = lazy(() => import('../pages/payroll/PayrollDashboardPage'))
const PayrollRunPage = lazy(() => import('../pages/payroll/PayrollRunPage'))
const StatutoryDeductionsPage = lazy(() => import('../pages/payroll/StatutoryDeductionsPage'))
const TaxDeclarationPage = lazy(() => import('../pages/payroll/TaxDeclarationPage'))
const DisbursementPage = lazy(() => import('../pages/payroll/DisbursementPage'))
const SalaryStructurePage = lazy(() => import('../pages/payroll/SalaryStructurePage'))
const TaxDeclarationApprovalPage = lazy(() => import('../pages/payroll/TaxDeclarationApprovalPage'))
const EmployeeLoansPage = lazy(() => import('../pages/payroll/EmployeeLoansPage'))
const ReimbursementsPage = lazy(() => import('../pages/payroll/ReimbursementsPage'))
const AttendancePage = lazy(() => import('../pages/attendance/AttendancePage'))
const ShiftMasterPage = lazy(() => import('../pages/attendance/ShiftMasterPage'))
const TeamAttendancePage = lazy(() => import('../pages/attendance/TeamAttendancePage'))
const RegularizationQueuePage = lazy(() => import('../pages/attendance/RegularizationQueuePage'))
const OvertimePage = lazy(() => import('../pages/attendance/OvertimePage'))
const AttendanceFreezePage = lazy(() => import('../pages/attendance/AttendanceFreezePage'))
const AttendanceReportsPage = lazy(() => import('../pages/attendance/AttendanceReportsPage'))
const LeavePage = lazy(() => import('../pages/leave/LeavePage'))
const PerformancePage = lazy(() => import('../pages/performance/PerformancePage'))
const RecruitmentPage = lazy(() => import('../pages/recruitment/RecruitmentPage'))
const CreateMrfPage = lazy(() => import('../pages/recruitment/CreateMrfPage'))
const CandidatesPage = lazy(() => import('../pages/recruitment/CandidatesPage'))
const ApplicationsPage = lazy(() => import('../pages/recruitment/ApplicationsPage'))
const OffersPage = lazy(() => import('../pages/recruitment/OffersPage'))
const CareersPortalPage = lazy(() => import('../pages/recruitment/CareersPortalPage'))
const CandidateImportPage = lazy(() => import('../pages/recruitment/CandidateImportPage'))
const PendingApplicationsPage = lazy(() => import('../pages/recruitment/PendingApplicationsPage'))
const OnboardingPage = lazy(() => import('../pages/recruitment/OnboardingPage'))
const ProbationPage = lazy(() => import('../pages/recruitment/ProbationPage'))
const ConfirmationPage = lazy(() => import('../pages/recruitment/ConfirmationPage'))
const JobOpeningsPage = lazy(() => import('../pages/recruitment/JobOpeningsPage'))
const AtsPipelinePage = lazy(() => import('../pages/recruitment/AtsPipelinePage'))
const InterviewsPage = lazy(() => import('../pages/recruitment/InterviewsPage'))
const BgvPage = lazy(() => import('../pages/recruitment/BgvPage'))
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('../pages/errors/UnauthorizedPage'))
const ChangePasswordPage = lazy(() => import('../pages/auth/ChangePasswordPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))

/**
 * RBAC fix: Routes use requiredPermission prop on ProtectedRoute.
 * This mirrors the API [RequirePermission] attributes — frontend blocks unauthorized
 * navigation as UX, but the API is the real security boundary.
 *
 * Matrix mapping (B4.3):
 *   /payroll (own slips)      — PAYROLL.VIEW       (EMPLOYEE qualifies)
 *   /payroll/runs             — PAYROLL.PROCESS     (PAYROLL_ADMIN only)
 *   /payroll/salary-config    — PAYROLL.CONFIGURE   (PAYROLL_ADMIN only)
 *   /payroll/statutory        — PAYROLL.CONFIGURE   (PAYROLL_ADMIN only)
 *   /payroll/disbursement     — PAYROLL.DISBURSE    (PAYROLL_ADMIN + FINANCE_HEAD)
 *   /recruitment/*            — RECRUITMENT.VIEW    (RECRUITMENT_MGR, HR_ADMIN, HR_MANAGER)
 *   /users                    — USER_MGMT.VIEW      (IT_ADMIN, SUPER_ADMIN)
 */
const router = createBrowserRouter([
  {
    path: '/login',
    element: wrap(LoginPage),
  },
  {
    path: '/careers',
    element: wrap(CareersPortalPage),
  },
  {
    path: '/forgot-password',
    element: wrap(ForgotPasswordPage),
  },
  {
    path: '/reset-password',
    element: wrap(ResetPasswordPage),
  },
  {
    // Force password change — full screen, no sidebar, auth required
    path: '/change-password',
    element: (
      <ProtectedRoute>
        {wrap(ChangePasswordPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ProtectedRoute><Suspense fallback={<Loading />}><DashboardPage /></Suspense></ProtectedRoute> },
      { path: 'dashboard', element: <ProtectedRoute>{wrap(DashboardPage)}</ProtectedRoute> },
      {
        path: 'employees',
        children: [
          { index: true, element: <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.VIEW}>{wrap(EmployeeListPage)}</ProtectedRoute> },
          { path: 'new', element: <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.CREATE}>{wrap(CreateEmployeePage)}</ProtectedRoute> },
          { path: ':id', element: <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.VIEW}>{wrap(EmployeeDetailPage)}</ProtectedRoute> },
          { path: ':id/edit', element: <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.EDIT}>{wrap(CreateEmployeePage)}</ProtectedRoute> },
          { path: 'my-profile', element: <ProtectedRoute>{wrap(MyProfilePage)}</ProtectedRoute> },
          { path: 'directory', element: <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.VIEW}>{wrap(DirectoryPage)}</ProtectedRoute> },
        ],
      },
      {
        path: 'organization',
        children: [
          { path: 'departments', element: <ProtectedRoute requiredPermission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(DepartmentsPage)}</ProtectedRoute> },
          { path: 'designations', element: <ProtectedRoute requiredPermission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(DesignationsPage)}</ProtectedRoute> },
          { path: 'locations', element: <ProtectedRoute requiredPermission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(LocationsPage)}</ProtectedRoute> },
        ],
      },
      { path: 'org-chart', element: <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.VIEW}>{wrap(OrgChartPage)}</ProtectedRoute> },
      { path: 'users', element: <ProtectedRoute requiredPermission={PERMISSIONS.USER_MANAGEMENT.VIEW}>{wrap(UserManagementPage)}</ProtectedRoute> },
      { path: 'notifications', element: <ProtectedRoute>{wrap(NotificationsPage)}</ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute requiredPermission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(SettingsPage)}</ProtectedRoute> },

      // ── Payroll routes — each locked to the minimum permission required per B4.3 ──
      // EMPLOYEE can reach /payroll (own slips only — PAYROLL.VIEW).
      // Sub-pages require PAYROLL.PROCESS or PAYROLL.CONFIGURE — EMPLOYEE is blocked.
      { path: 'payroll', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.VIEW}>{wrap(PayrollPage)}</ProtectedRoute> },
      { path: 'payroll/dashboard', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.VIEW}>{wrap(PayrollDashboardPage)}</ProtectedRoute> },
      { path: 'payroll/runs', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.PROCESS}>{wrap(PayrollRunPage)}</ProtectedRoute> },
      { path: 'payroll/statutory', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.CONFIGURE}>{wrap(StatutoryDeductionsPage)}</ProtectedRoute> },
      { path: 'payroll/tax-declaration', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.VIEW}>{wrap(TaxDeclarationPage)}</ProtectedRoute> },
      { path: 'payroll/disbursement', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.DISBURSE}>{wrap(DisbursementPage)}</ProtectedRoute> },
      { path: 'payroll/salary-config', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.CONFIGURE}>{wrap(SalaryStructurePage)}</ProtectedRoute> },
      { path: 'payroll/tax-declarations', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.APPROVE}>{wrap(TaxDeclarationApprovalPage)}</ProtectedRoute> },
      { path: 'payroll/loans', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.VIEW}>{wrap(EmployeeLoansPage)}</ProtectedRoute> },
      { path: 'payroll/reimbursements', element: <ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL.VIEW}>{wrap(ReimbursementsPage)}</ProtectedRoute> },

      // ── Attendance routes ──
      {
        path: 'attendance',
        children: [
          { index: true, element: <ProtectedRoute>{wrap(AttendancePage)}</ProtectedRoute> },
          { path: 'team', element: <ProtectedRoute requiredPermission={PERMISSIONS.ATTENDANCE.VIEW}>{wrap(TeamAttendancePage)}</ProtectedRoute> },
          { path: 'regularizations', element: <ProtectedRoute requiredPermission={PERMISSIONS.ATTENDANCE.VIEW}>{wrap(RegularizationQueuePage)}</ProtectedRoute> },
          { path: 'shifts', element: <ProtectedRoute requiredPermission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(ShiftMasterPage)}</ProtectedRoute> },
          { path: 'overtime', element: <ProtectedRoute>{wrap(OvertimePage)}</ProtectedRoute> },
          { path: 'freeze', element: <ProtectedRoute requiredPermission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(AttendanceFreezePage)}</ProtectedRoute> },
          { path: 'reports', element: <ProtectedRoute requiredPermission={PERMISSIONS.ATTENDANCE.VIEW}>{wrap(AttendanceReportsPage)}</ProtectedRoute> },
        ]
      },
      { path: 'leave', element: <ProtectedRoute>{wrap(LeavePage)}</ProtectedRoute> },
      { path: 'performance', element: <ProtectedRoute>{wrap(PerformancePage)}</ProtectedRoute> },

      // ── Recruitment routes ──
      {
        path: 'recruitment',
        children: [
          { index: true, element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(RecruitmentPage)}</ProtectedRoute> },
          { path: 'mrf/create', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.CREATE}>{wrap(CreateMrfPage)}</ProtectedRoute> },
          { path: 'mrf/:id/edit', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.EDIT}>{wrap(CreateMrfPage)}</ProtectedRoute> },
          { path: 'candidates', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(CandidatesPage)}</ProtectedRoute> },
          { path: 'applications', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(ApplicationsPage)}</ProtectedRoute> },
          { path: 'jobs', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(JobOpeningsPage)}</ProtectedRoute> },
          { path: 'import', element: <Navigate to="/recruitment/candidates" replace /> },
          { path: 'pending', element: <Navigate to="/recruitment/applications?view=intake" replace /> },
          { path: 'pipeline', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(AtsPipelinePage)}</ProtectedRoute> },
          { path: 'interviews', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(InterviewsPage)}</ProtectedRoute> },
          { path: 'offers', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(OffersPage)}</ProtectedRoute> },
          { path: 'bgv', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(BgvPage)}</ProtectedRoute> },
          { path: 'onboarding', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(OnboardingPage)}</ProtectedRoute> },
          { path: 'probation', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(ProbationPage)}</ProtectedRoute> },
          { path: 'confirmation', element: <ProtectedRoute requiredPermission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(ConfirmationPage)}</ProtectedRoute> },
        ]
      },
      { path: '403', element: wrap(UnauthorizedPage) },
      { path: '*', element: wrap(NotFoundPage) },
    ],
  },
])

export default router
