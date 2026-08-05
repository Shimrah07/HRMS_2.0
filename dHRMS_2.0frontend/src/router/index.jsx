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
const AttendancePage = lazy(() => import('../pages/attendance/AttendancePage'))
const ShiftMasterPage = lazy(() => import('../pages/attendance/ShiftMasterPage'))
const TeamAttendancePage = lazy(() => import('../pages/attendance/TeamAttendancePage'))
const RegularizationQueuePage = lazy(() => import('../pages/attendance/RegularizationQueuePage'))
const OvertimePage = lazy(() => import('../pages/attendance/OvertimePage'))
const AttendanceFreezePage = lazy(() => import('../pages/attendance/AttendanceFreezePage'))
const AttendanceReportsPage = lazy(() => import('../pages/attendance/AttendanceReportsPage'))
const LeavePage = lazy(() => import('../pages/leave/LeavePage'))
const LeaveDashboardPage = lazy(() => import('../pages/leave/LeaveDashboardPage'))
const LeaveApplicationsPage = lazy(() => import('../pages/leave/LeaveApplicationsPage'))
const LeaveBalancePage = lazy(() => import('../pages/leave/LeaveBalancePage'))
const LeavePoliciesPage = lazy(() => import('../pages/leave/LeavePoliciesPage'))
const HolidayCalendarPage = lazy(() => import('../pages/leave/HolidayCalendarPage'))
const StatutoryLeavePage = lazy(() => import('../pages/leave/StatutoryLeavePage'))
const LeaveEncashmentPage = lazy(() => import('../pages/leave/LeaveEncashmentPage'))
const SectorRulesPage = lazy(() => import('../pages/leave/SectorRulesPage'))
const LeaveReportsPage = lazy(() => import('../pages/leave/LeaveReportsPage'))
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
const TravelExpensePage = lazy(() => import('../pages/travel-expense/TravelExpensePage'))
const TravelRequestsPage = lazy(() => import('../pages/travel-expense/TravelRequestsPage'))
const TravelPoliciesPage = lazy(() => import('../pages/travel-expense/TravelPoliciesPage'))
const ExpenseClaimsPage = lazy(() => import('../pages/travel-expense/ExpenseClaimsPage'))
const TravelApprovalsPage = lazy(() => import('../pages/travel-expense/TravelApprovalsPage'))
const TravelAdvancesPage = lazy(() => import('../pages/travel-expense/TravelAdvancesPage'))
const TravelSectorRulesPage = lazy(() => import('../pages/travel-expense/TravelSectorRulesPage'))
const TravelReportsPage = lazy(() => import('../pages/travel-expense/TravelReportsPage'))
const ResignationNoticePage = lazy(() => import('../pages/exit-management/ResignationNoticePage'))
const CounterOffersPage = lazy(() => import('../pages/exit-management/CounterOffersPage'))
const NoDuesClearancePage = lazy(() => import('../pages/exit-management/NoDuesClearancePage'))
const ExitInterviewsPage = lazy(() => import('../pages/exit-management/ExitInterviewsPage'))
const FullFinalSettlementPage = lazy(() => import('../pages/exit-management/FullFinalSettlementPage'))
const ExitDocumentsPage = lazy(() => import('../pages/exit-management/ExitDocumentsPage'))
const ExitSectorRulesPage = lazy(() => import('../pages/exit-management/ExitSectorRulesPage'))
const AttritionAnalyticsPage = lazy(() => import('../pages/exit-management/AttritionAnalyticsPage'))


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
          { index: true, element: <ProtectedRoute permission={PERMISSIONS.EMPLOYEE.VIEW}>{wrap(EmployeeListPage)}</ProtectedRoute> },
          { path: 'new', element: <ProtectedRoute permission={PERMISSIONS.EMPLOYEE.CREATE}>{wrap(CreateEmployeePage)}</ProtectedRoute> },
          { path: ':id', element: <ProtectedRoute permission={PERMISSIONS.EMPLOYEE.VIEW}>{wrap(EmployeeDetailPage)}</ProtectedRoute> },
          { path: ':id/edit', element: <ProtectedRoute permission={PERMISSIONS.EMPLOYEE.EDIT}>{wrap(CreateEmployeePage)}</ProtectedRoute> },
          { path: 'my-profile', element: <ProtectedRoute>{wrap(MyProfilePage)}</ProtectedRoute> },
          { path: 'directory', element: <ProtectedRoute permission={PERMISSIONS.EMPLOYEE.VIEW}>{wrap(DirectoryPage)}</ProtectedRoute> },
        ],
      },
      {
        path: 'organization',
        children: [
          { path: 'departments', element: <ProtectedRoute permission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(DepartmentsPage)}</ProtectedRoute> },
          { path: 'designations', element: <ProtectedRoute permission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(DesignationsPage)}</ProtectedRoute> },
          { path: 'locations', element: <ProtectedRoute permission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(LocationsPage)}</ProtectedRoute> },
        ],
      },
      { path: 'org-chart', element: <ProtectedRoute permission={PERMISSIONS.EMPLOYEE.VIEW}>{wrap(OrgChartPage)}</ProtectedRoute> },
      { path: 'users', element: <ProtectedRoute permission={PERMISSIONS.USER_MANAGEMENT.VIEW}>{wrap(UserManagementPage)}</ProtectedRoute> },
      { path: 'notifications', element: <ProtectedRoute>{wrap(NotificationsPage)}</ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute permission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(SettingsPage)}</ProtectedRoute> },
      { path: 'payroll', element: <ProtectedRoute permission={PERMISSIONS.PAYROLL.VIEW}>{wrap(PayrollPage)}</ProtectedRoute> },
      { 
        path: 'attendance', 
        children: [
          { index: true, element: <ProtectedRoute>{wrap(AttendancePage)}</ProtectedRoute> },
          { path: 'team', element: <ProtectedRoute permission={PERMISSIONS.ATTENDANCE.VIEW}>{wrap(TeamAttendancePage)}</ProtectedRoute> },
          { path: 'regularizations', element: <ProtectedRoute permission={PERMISSIONS.ATTENDANCE.VIEW}>{wrap(RegularizationQueuePage)}</ProtectedRoute> },
          { path: 'shifts', element: <ProtectedRoute permission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(ShiftMasterPage)}</ProtectedRoute> },
          { path: 'overtime', element: <ProtectedRoute>{wrap(OvertimePage)}</ProtectedRoute> },
          { path: 'freeze', element: <ProtectedRoute permission={PERMISSIONS.COMPANY_SETUP.VIEW}>{wrap(AttendanceFreezePage)}</ProtectedRoute> },
          { path: 'reports', element: <ProtectedRoute permission={PERMISSIONS.ATTENDANCE.VIEW}>{wrap(AttendanceReportsPage)}</ProtectedRoute> },
        ]
      },
      { 
        path: 'leave', 
        errorElement: <Navigate to="/leave" replace />,
        children: [
          { index: true, element: <ProtectedRoute>{wrap(LeaveApplicationsPage)}</ProtectedRoute> },
          { path: 'dashboard', element: <Navigate to="/leave" replace /> },
          { path: 'applications', element: <ProtectedRoute>{wrap(LeaveApplicationsPage)}</ProtectedRoute> },
          { path: 'balance', element: <ProtectedRoute>{wrap(LeaveBalancePage)}</ProtectedRoute> },
          { path: 'policies', element: <ProtectedRoute permission={PERMISSIONS.LEAVE.VIEW}>{wrap(LeavePoliciesPage)}</ProtectedRoute> },
          { path: 'holidays', element: <ProtectedRoute>{wrap(HolidayCalendarPage)}</ProtectedRoute> },
          { path: 'statutory', element: <ProtectedRoute>{wrap(StatutoryLeavePage)}</ProtectedRoute> },
          { path: 'encashment', element: <ProtectedRoute>{wrap(LeaveEncashmentPage)}</ProtectedRoute> },
          { path: 'sector-rules', element: <ProtectedRoute permission={PERMISSIONS.LEAVE.VIEW}>{wrap(SectorRulesPage)}</ProtectedRoute> },
          { path: 'reports', element: <ProtectedRoute>{wrap(LeaveReportsPage)}</ProtectedRoute> },
        ]
      },
      { 
        path: 'travel-expense', 
        errorElement: <Navigate to="/travel-expense/travel-requests" replace />,
        children: [
          { index: true, element: <Navigate to="/travel-expense/travel-requests" replace /> },
          { path: 'dashboard', element: <Navigate to="/travel-expense/travel-requests" replace /> },
          { path: 'travel-requests', element: <ProtectedRoute>{wrap(TravelRequestsPage)}</ProtectedRoute> },
          { path: 'policies', element: <ProtectedRoute>{wrap(TravelPoliciesPage)}</ProtectedRoute> },
          { path: 'expense-claims', element: <ProtectedRoute>{wrap(ExpenseClaimsPage)}</ProtectedRoute> },
          { path: 'approvals', element: <ProtectedRoute>{wrap(TravelApprovalsPage)}</ProtectedRoute> },
          { path: 'advances', element: <ProtectedRoute>{wrap(TravelAdvancesPage)}</ProtectedRoute> },
          { path: 'sector-rules', element: <ProtectedRoute>{wrap(TravelSectorRulesPage)}</ProtectedRoute> },
          { path: 'reports', element: <ProtectedRoute>{wrap(TravelReportsPage)}</ProtectedRoute> },
        ]
      },
      { 
        path: 'exit-management', 
        errorElement: <Navigate to="/exit-management/resignation" replace />,
        children: [
          { index: true, element: <Navigate to="/exit-management/resignation" replace /> },
          { path: 'resignation', element: <ProtectedRoute>{wrap(ResignationNoticePage)}</ProtectedRoute> },
          { path: 'counter-offers', element: <ProtectedRoute>{wrap(CounterOffersPage)}</ProtectedRoute> },
          { path: 'no-dues', element: <ProtectedRoute>{wrap(NoDuesClearancePage)}</ProtectedRoute> },
          { path: 'exit-interviews', element: <ProtectedRoute>{wrap(ExitInterviewsPage)}</ProtectedRoute> },
          { path: 'ffs', element: <ProtectedRoute>{wrap(FullFinalSettlementPage)}</ProtectedRoute> },
          { path: 'documents', element: <ProtectedRoute>{wrap(ExitDocumentsPage)}</ProtectedRoute> },
          { path: 'sector-rules', element: <ProtectedRoute>{wrap(ExitSectorRulesPage)}</ProtectedRoute> },
          { path: 'analytics', element: <ProtectedRoute>{wrap(AttritionAnalyticsPage)}</ProtectedRoute> },
        ]
      },

      {
        path: 'recruitment',
        children: [
          { index: true, element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(RecruitmentPage)}</ProtectedRoute> },
          { path: 'mrf/create', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.CREATE}>{wrap(CreateMrfPage)}</ProtectedRoute> },
          { path: 'mrf/:id/edit', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.EDIT}>{wrap(CreateMrfPage)}</ProtectedRoute> },
          { path: 'candidates', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(CandidatesPage)}</ProtectedRoute> },
          { path: 'applications', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(ApplicationsPage)}</ProtectedRoute> },
          { path: 'jobs', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(JobOpeningsPage)}</ProtectedRoute> },
          { path: 'import', element: <Navigate to="/recruitment/candidates" replace /> },
          { path: 'pending', element: <Navigate to="/recruitment/applications?view=intake" replace /> },
          { path: 'pipeline', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(AtsPipelinePage)}</ProtectedRoute> },
          { path: 'interviews', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(InterviewsPage)}</ProtectedRoute> },
          { path: 'offers', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(OffersPage)}</ProtectedRoute> },
          { path: 'bgv', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(BgvPage)}</ProtectedRoute> },
          { path: 'onboarding', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(OnboardingPage)}</ProtectedRoute> },
          { path: 'probation', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(ProbationPage)}</ProtectedRoute> },
          { path: 'confirmation', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(ConfirmationPage)}</ProtectedRoute> },
        ]
      },
      { path: '403', element: wrap(UnauthorizedPage) },
      { path: '*', element: wrap(NotFoundPage) },
    ],
  },
])

export default router
