import { Layout, Tooltip } from 'antd'
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
    key: 'people',
    label: 'PEOPLE',
    items: [
      { key: '/employees', icon: <TeamOutlined />,      label: 'Employees', permission: PERMISSIONS.EMPLOYEE.VIEW },
      { key: '/org-chart', icon: <ApartmentOutlined />, label: 'Org Chart', permission: PERMISSIONS.EMPLOYEE.VIEW },
    ],
  },
  {
    key: 'organization',
    label: 'ORGANIZATION',
    items: [
      { key: '/organization/departments',  icon: <BankOutlined />,   label: 'Departments',  permission: PERMISSIONS.COMPANY_SETUP.VIEW },
      { key: '/organization/designations', icon: <SafetyOutlined />, label: 'Designations', permission: PERMISSIONS.COMPANY_SETUP.VIEW },
      { key: '/organization/locations',    icon: <GlobalOutlined />, label: 'Locations',    permission: PERMISSIONS.COMPANY_SETUP.VIEW },
    ],
  },
  {
    key: 'workforce',
    label: 'WORKFORCE',
    items: [
      { key: '/attendance', icon: <ClockCircleOutlined />, label: 'Attendance', permission: PERMISSIONS.ATTENDANCE.VIEW },
      { key: '/leave',      icon: <CalendarOutlined />,    label: 'Leave',      permission: PERMISSIONS.LEAVE.VIEW },
      { key: '/payroll',    icon: <DollarOutlined />,      label: 'Payroll',    permission: PERMISSIONS.PAYROLL.VIEW },
    ],
  },
  {
    key: 'growth',
    label: 'GROWTH',
    items: [
      { key: '/performance',  icon: <RocketOutlined />, label: 'Performance',  permission: PERMISSIONS.PERFORMANCE.VIEW,  badge: 'Soon' },
      { key: '/recruitment',  icon: <BookOutlined />,   label: 'Recruitment',  permission: PERMISSIONS.RECRUITMENT.VIEW,  badge: 'Soon' },
    ],
  },
  {
    key: 'admin',
    label: 'ADMINISTRATION',
    items: [
      { key: '/users',         icon: <UserOutlined />,    label: 'Users & Roles', permission: PERMISSIONS.USER_MANAGEMENT.VIEW },
      { key: '/notifications', icon: <BellOutlined />,    label: 'Notifications', permission: null },
      { key: '/settings',      icon: <SettingOutlined />, label: 'Settings',      permission: PERMISSIONS.COMPANY_SETUP.VIEW },
    ],
  },
]

export default function Sidebar() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { can, isSuperAdmin } = usePermission()

  const isActive = (key) => location.pathname.startsWith(key)

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.permission === null || isSuperAdmin || can(item.permission)
    ),
  })).filter((group) => group.items.length > 0)

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
        background: 'linear-gradient(180deg, #10113F 0%, #0a0c2e 55%, #07091f 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '4px 0 32px rgba(0, 0, 0, 0.2)',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Logo ── */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Go to dashboard"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: sidebarCollapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          cursor: 'pointer',
          flexShrink: 0,
          gap: 12,
          userSelect: 'none',
        }}
        onClick={() => navigate('/dashboard')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')}
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
          {!sidebarCollapsed && (
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
      <div style={{ padding: '8px 0 8px', flex: 1 }}>
        {filteredGroups.map((group) => (
          <div key={group.key} style={{ marginBottom: 2 }}>
            {/* Section label */}
            <AnimatePresence>
              {!sidebarCollapsed && (
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

              const navItem = (
                <div
                  key={item.key}
                  role="menuitem"
                  tabIndex={0}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => navigate(item.key)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: sidebarCollapsed ? '0 15px' : '0 12px 0 16px',
                    height: 42,
                    margin: '2px 8px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    position: 'relative',
                    userSelect: 'none',
                    // Active state
                    background: active
                      ? 'linear-gradient(90deg, rgba(250,167,26,0.18) 0%, rgba(250,167,26,0.04) 100%)'
                      : 'transparent',
                    borderLeft: active ? '3px solid #FAA71A' : '3px solid transparent',
                    // Active glow (key upgrade)
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
                  {/* Icon */}
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

                  {/* Label */}
                  <AnimatePresence>
                    {!sidebarCollapsed && (
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

                  {/* Badge (e.g. "Soon") */}
                  {!sidebarCollapsed && item.badge && (
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

              return sidebarCollapsed ? (
                <Tooltip key={item.key} title={item.label} placement="right">
                  {navItem}
                </Tooltip>
              ) : (
                <div key={item.key}>{navItem}</div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Collapse Toggle ── */}
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
            : <MenuFoldOutlined  style={{ fontSize: 15 }} />
          }
        </div>
      </div>
    </Sider>
  )
}
