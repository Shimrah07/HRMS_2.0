import { useState } from 'react'
import React from 'react'
import { Layout, Tooltip, Drawer } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  RocketOutlined,
  SafetyOutlined,
  BookOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'

const { Sider } = Layout

const NAV_GROUPS = [
  {
    key: 'core',
    label: 'CORE',
    items: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard', permission: null },
    ],
  },
  {
    key: 'self-service',
    label: 'MY WORKSPACE',
    items: [
      { key: '/employees/my-profile', icon: <UserOutlined />, label: 'My Profile', permission: null, selfOnly: true },
    ],
  },
  {
    key: 'people',
    label: 'PEOPLE',
    items: [
      { key: '/employees', icon: <TeamOutlined />, label: 'Employees', permission: PERMISSIONS.EMPLOYEE.VIEW, hideForEmployee: true },
      { key: '/org-chart', icon: <ApartmentOutlined />, label: 'Org Chart', permission: PERMISSIONS.EMPLOYEE.VIEW, hideForEmployee: true },
    ],
  },
  {
    key: 'organization',
    label: 'ORGANIZATION',
    items: [
      { key: '/organization/departments', icon: <BankOutlined />, label: 'Departments', permission: PERMISSIONS.COMPANY_SETUP.VIEW },
      { key: '/organization/designations', icon: <SafetyOutlined />, label: 'Designations', permission: PERMISSIONS.COMPANY_SETUP.VIEW },
      { key: '/organization/locations', icon: <GlobalOutlined />, label: 'Locations', permission: PERMISSIONS.COMPANY_SETUP.VIEW },
    ],
  },
  {
    key: 'workforce',
    label: 'WORKFORCE',
    items: [
      { 
        key: '/attendance', 
        icon: <ClockCircleOutlined />, 
        label: 'Attendance', 
        permission: null,
        children: [
          { key: '/attendance', label: 'My Attendance' },
          { key: '/attendance/team', label: 'Team Attendance' },
          { key: '/attendance/regularizations', label: 'Regularization Queue' },
          { key: '/attendance/shifts', label: 'Shift & Roster' },
          { key: '/attendance/overtime', label: 'Overtime & Comp-Off' },
          { key: '/attendance/freeze', label: 'Attendance Freeze' },
          { key: '/attendance/reports', label: 'Reports & Analytics' }
        ]
      },
      { 
        key: '/leave', 
        icon: <CalendarOutlined />, 
        label: 'Leave', 
        permission: null,
        children: [
          { key: '/leave', label: 'My Leave & Applications' },
          { key: '/leave/balance', label: 'Leave Balance & Ledger' },
          { key: '/leave/policies', label: 'Leave Policy' },
          { key: '/leave/holidays', label: 'Holiday Calendar' },
          { key: '/leave/statutory', label: 'Statutory Leave' },
          { key: '/leave/encashment', label: 'Leave Encashment' },
          { key: '/leave/sector-rules', label: 'Sector Rules' },
          { key: '/leave/reports', label: 'Reports & Analytics' }
        ]
      },
      { key: '/payroll', icon: <DollarOutlined />, label: 'Payroll', permission: PERMISSIONS.PAYROLL.VIEW },
    ],
  },
  {
    key: 'growth',
    label: 'GROWTH',
    items: [
      { key: '/performance', icon: <RocketOutlined />, label: 'Performance', permission: PERMISSIONS.PERFORMANCE.VIEW },
      {
        key: '/recruitment',
        icon: <BookOutlined />,
        label: 'Recruitment',
        permission: PERMISSIONS.RECRUITMENT.VIEW,
        children: [
          { key: '/recruitment', label: 'Manpower Requisitions' },
          { key: '/recruitment/jobs', label: 'Job Openings' },
          { key: '/recruitment/candidates', label: 'Candidates' },
          { key: '/recruitment/applications', label: 'Applications' },
          { key: '/recruitment/interviews', label: 'Interviews' },
          { key: '/recruitment/offers', label: 'Offers' },
          { key: '/recruitment/bgv', label: 'Background Verification' },
          { key: '/recruitment/onboarding', label: 'Onboarding' },
          { key: '/recruitment/probation', label: 'Probation' }
        ]
      },
    ],
  },
  {
    key: 'admin',
    label: 'ADMINISTRATION',
    items: [
      { key: '/users', icon: <UserOutlined />, label: 'Users & Roles', permission: PERMISSIONS.USER_MANAGEMENT.VIEW },
      { key: '/notifications', icon: <BellOutlined />, label: 'Notifications', permission: null },
      { key: '/settings', icon: <SettingOutlined />, label: 'Settings', permission: PERMISSIONS.COMPANY_SETUP.VIEW },
    ],
  },
]

export default function Sidebar({ isMobile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, mobileDrawerOpen, closeMobileDrawer } = useUIStore()
  const { can, isSuperAdmin } = usePermission()
  const { roles } = useAuthStore()
  const [openMenus, setOpenMenus] = useState(['/recruitment', '/attendance', '/leave'])

  const toggleMenu = (key) => {
    setOpenMenus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const isEmployee = roles.includes('EMPLOYEE') && !roles.some(r =>
    ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'HR_EXEC', 'PAYROLL_ADMIN', 'IT_ADMIN',
      'REPORTING_MGR', 'DEPT_MANAGER', 'COMPLIANCE_OFFICER', 'AUDITOR', 'FINANCE_VIEWER'].includes(r)
  )

  const isActive = (key) => location.pathname === key || location.pathname.startsWith(key + '/')

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => {
        if (item.selfOnly && !isEmployee) return false
        if (item.hideForEmployee && isEmployee) return false
        if (item.permission === null) return true
        return isSuperAdmin || can(item.permission)
      })
      .map((item) => {
        if (item.children) {
          const isHRRole = roles.some(r => ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'RECRUITMENT_MANAGER'].includes(r));
          const isOrgAdmin = roles.some(r => ['SUPER_ADMIN', 'HR_ADMIN', 'IT_ADMIN', 'COO'].includes(r));
          const isReportingMgr = roles.includes('REPORTING_MGR') || roles.includes('DEPT_MANAGER');
          const isPayrollOrCompliance = roles.some(r => ['PAYROLL_ADMIN', 'COMPLIANCE_OFFICER'].includes(r));
          const isPureEmployee = isEmployee;

          return {
            ...item,
            children: item.children.filter(child => {
              if (child.key.startsWith('/recruitment')) {
                if (isHRRole) return true;
                return child.key === '/recruitment' || child.key === '/recruitment/jobs';
              }
              
              if (child.key.startsWith('/attendance')) {
                if (isPayrollOrCompliance) return child.key === '/attendance/reports';
                if (roles.includes('HR_ADMIN') || roles.includes('SUPER_ADMIN')) return true;
                if (isPureEmployee) return child.key === '/attendance' || child.key === '/attendance/overtime';
                if (isReportingMgr) {
                  const allowedForMgr = ['/attendance', '/attendance/team', '/attendance/regularizations', '/attendance/overtime', '/attendance/reports'];
                  return allowedForMgr.includes(child.key);
                }
                if (isOrgAdmin) return child.key !== '/attendance/freeze';
                return false;
              }
              return true;
            })
          };
        }
        return item;
      })
  })).filter((group) => group.items.length > 0)

  const sidebarContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #130830 0%, #0E0522 55%, #0A0420 100%)' }}>
      {/* ── Logo ── */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Go to dashboard"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: (sidebarCollapsed && !isMobile) ? '0 16px' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          cursor: 'pointer',
          flexShrink: 0,
          gap: 12,
          userSelect: 'none',
        }}
        onClick={() => {
          if (isMobile) closeMobileDrawer()
          navigate('/dashboard')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (isMobile) closeMobileDrawer()
            navigate('/dashboard')
          }
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #FAA71A 0%, #f5c842 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
            color: '#10113F',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(250,167,26,0.35)',
          }}
        >
          MP
        </div>

        <AnimatePresence>
          {(!sidebarCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -10, width: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2, letterSpacing: '-0.01em' }} title="MPOnline Systematic Employee Tracking Human Utilities">
                MPOSethu
              </div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 8.5, fontWeight: 500, letterSpacing: '0.01em' }} title="MPOnline Systematic Employee Tracking Human Utilities">
                SETHU Human Utilities
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <div style={{ padding: '8px 0 8px', flex: 1, overflowY: 'auto' }}>
        {filteredGroups.map((group) => (
          <div key={group.key} style={{ marginBottom: 2 }}>
            {/* Section label */}
            <AnimatePresence>
              {(!sidebarCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    padding: '14px 20px 5px',
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'rgba(250,167,26,0.45)',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                  }}
                >
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            {group.items.map((item) => {
              const active = isActive(item.key)
              const hasChildren = item.children && item.children.length > 0
              const isMenuOpen = openMenus.includes(item.key)

              const navItem = (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    if (hasChildren) {
                      toggleMenu(item.key)
                    } else {
                      if (isMobile) closeMobileDrawer()
                      navigate(item.key)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (hasChildren) {
                        toggleMenu(item.key)
                      } else {
                        if (isMobile) closeMobileDrawer()
                        navigate(item.key)
                      }
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: (sidebarCollapsed && !isMobile) ? '0 15px' : '0 12px 0 16px',
                    height: 42,
                    margin: '2px 8px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    position: 'relative',
                    userSelect: 'none',
                    background: active
                      ? 'linear-gradient(90deg, rgba(250,167,26,0.18) 0%, rgba(250,167,26,0.04) 100%)'
                      : 'transparent',
                    borderLeft: active ? '3px solid #FAA71A' : '3px solid transparent',
                    boxShadow: active
                      ? '0 2px 16px rgba(250,167,26,0.15), inset 0 0 0 1px rgba(250,167,26,0.08)'
                      : 'none',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.06)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      color: active ? '#FAA71A' : 'rgba(255,255,255,0.55)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {item.icon}
                  </span>

                  <AnimatePresence>
                    {(!sidebarCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          fontSize: 13.5,
                          fontWeight: active ? 600 : 400,
                          color: active ? '#FAA71A' : 'rgba(255,255,255,0.75)',
                          flex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          letterSpacing: active ? '-0.01em' : '0',
                          transition: 'color 0.15s ease',
                        }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {(!sidebarCollapsed || isMobile) && item.badge && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'rgba(250,167,26,0.75)',
                        background: 'rgba(250,167,26,0.1)',
                        padding: '1px 6px',
                        borderRadius: 5,
                        border: '1px solid rgba(250,167,26,0.2)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )

              return (
                <React.Fragment key={item.key}>
                  {sidebarCollapsed && !isMobile ? (
                    <Tooltip title={item.label} placement="right">
                      {navItem}
                    </Tooltip>
                  ) : (
                    <div>
                      {navItem}
                      {hasChildren && isMenuOpen && (
                        <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 2, margin: '2px 0' }}>
                          {item.children.map(child => {
                            const childActive = location.pathname === child.key;
                            return (
                              <div
                                key={child.key}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (isMobile) closeMobileDrawer()
                                  navigate(child.key)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    if (isMobile) closeMobileDrawer()
                                    navigate(child.key)
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  height: 34,
                                  padding: '0 12px',
                                  margin: '1px 8px',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  fontSize: 12.5,
                                  fontWeight: childActive ? 600 : 400,
                                  color: childActive ? '#FAA71A' : 'rgba(255,255,255,0.6)',
                                  background: childActive ? 'rgba(250,167,26,0.1)' : 'transparent',
                                  borderLeft: childActive ? '2px solid #FAA71A' : '2px solid transparent',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  if (!childActive) {
                                    e.currentTarget.style.color = '#FAA71A';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!childActive) {
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                    e.currentTarget.style.background = 'transparent';
                                  }
                                }}
                              >
                                {child.label}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Collapse Toggle (Desktop/Tablet Only) ── */}
      {!isMobile && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 8px' }}>
          <div
            role="button"
            tabIndex={0}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleSidebar}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSidebar()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
              padding: '8px 14px',
              cursor: 'pointer',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.35)',
              transition: 'all 0.15s ease',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(250,167,26,0.1)'
              e.currentTarget.style.color = '#FAA71A'
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(250,167,26,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {sidebarCollapsed
              ? <MenuUnfoldOutlined style={{ fontSize: 15 }} />
              : <MenuFoldOutlined style={{ fontSize: 15 }} />
            }
          </div>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        width={280}
        open={mobileDrawerOpen}
        onClose={closeMobileDrawer}
        styles={{ body: { padding: 0, background: '#0A0420' }, header: { display: 'none' } }}
        className="hrms-mobile-sidebar-drawer"
        closeIcon={null}
      >
        {sidebarContent}
      </Drawer>
    )
  }

  return (
    <Sider
      className="hrms-sidebar"
      collapsed={sidebarCollapsed}
      collapsible={false}
      width={256}
      collapsedWidth={64}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 200,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'linear-gradient(180deg, #130830 0%, #0E0522 55%, #0A0420 100%)',
        borderRight: '1px solid rgba(160, 90, 255, 0.15)',
        boxShadow: '4px 0 32px rgba(5, 2, 20, 0.4)',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {sidebarContent}
    </Sider>
  )
}
