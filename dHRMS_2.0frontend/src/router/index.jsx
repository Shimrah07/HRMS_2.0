import { createBrowserRouter } from 'react-router-dom'
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
const LeavePage = lazy(() => import('../pages/leave/LeavePage'))
const PerformancePage = lazy(() => import('../pages/performance/PerformancePage'))
const RecruitmentPage = lazy(() => import('../pages/recruitment/RecruitmentPage'))
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('../pages/errors/UnauthorizedPage'))

const router = createBrowserRouter([
  {
    path: '/login',
    element: wrap(LoginPage),
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
      { path: 'attendance', element: <ProtectedRoute permission={PERMISSIONS.ATTENDANCE.VIEW}>{wrap(AttendancePage)}</ProtectedRoute> },
      { path: 'leave', element: <ProtectedRoute permission={PERMISSIONS.LEAVE.VIEW}>{wrap(LeavePage)}</ProtectedRoute> },
      { path: 'performance', element: <ProtectedRoute permission={PERMISSIONS.PERFORMANCE.VIEW}>{wrap(PerformancePage)}</ProtectedRoute> },
      { path: 'recruitment', element: <ProtectedRoute permission={PERMISSIONS.RECRUITMENT.VIEW}>{wrap(RecruitmentPage)}</ProtectedRoute> },
      { path: '403', element: wrap(UnauthorizedPage) },
      { path: '*', element: wrap(NotFoundPage) },
    ],
  },
])

export default router
