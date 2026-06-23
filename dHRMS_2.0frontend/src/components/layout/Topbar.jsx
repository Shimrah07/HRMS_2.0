import { Layout, Avatar, Badge, Dropdown, Button, Tooltip } from 'antd'
import {
  BellOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { notificationService } from '../../services/notificationService'

const { Header } = Layout

export default function Topbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { isDarkMode, toggleDarkMode, openCommandPalette, sidebarCollapsed } = useUIStore()
  const sidebarWidth = sidebarCollapsed ? 64 : 256

  /* ── Notification count (unchanged logic) ── */
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60000,
    select: (res) => res?.data ?? 0,
  })
  const unreadCount = countData || 0

  /* ── Logout (unchanged logic) ── */
  const handleLogout = async () => {
    try {
      const { authService } = await import('../../services/authService')
      await authService.logout()
    } catch (_) {}
    logout()
    navigate('/login')
  }

  /* ── User Menu (unchanged) ── */
  const userMenuItems = [
    { key: 'profile',         icon: <UserOutlined />,   label: 'My Profile',       onClick: () => navigate('/employees/my-profile') },
    { key: 'change-password', icon: <KeyOutlined />,    label: 'Change Password',  onClick: () => navigate('/settings?tab=security') },
    { type: 'divider' },
    { key: 'logout',          icon: <LogoutOutlined />, label: 'Sign Out', danger: true, onClick: handleLogout },
  ]

  /* ── User initials ── */
  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <Header
      className="hrms-topbar"
      style={{
        position: 'fixed',
        top: 12,
        right: 24,
        left: sidebarWidth + 24,
        zIndex: 100,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px 0 20px',
        background: isDarkMode ? 'rgba(19, 24, 64, 0.88)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(16,17,63,0.06)',
        borderRadius: 14,
        boxShadow: isDarkMode
          ? '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 8px 32px rgba(16,17,63,0.05), inset 0 0 0 1px rgba(255,255,255,0.8)',
        transition: 'left 0.25s cubic-bezier(0.16,1,0.3,1), background 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* ── Left: Search trigger ── */}
      <Button
        aria-label="Open command palette (Cmd+K)"
        onClick={openCommandPalette}
        style={{
          background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(16,17,63,0.04)',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(16,17,63,0.09)',
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 14px',
          height: 36,
          color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(16,17,63,0.4)',
          cursor: 'pointer',
          minWidth: 220,
          justifyContent: 'space-between',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = isDarkMode ? 'rgba(250,167,26,0.4)' : 'rgba(16,17,63,0.18)'
          e.currentTarget.style.color = isDarkMode ? 'rgba(250,167,26,0.8)' : 'rgba(16,17,63,0.65)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(16,17,63,0.09)'
          e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(16,17,63,0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <SearchOutlined style={{ fontSize: 13 }} />
          <span style={{ fontSize: 13, fontWeight: 400 }}>Search anything...</span>
        </div>
        <kbd
          style={{
            fontSize: 10.5,
            background: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(16,17,63,0.06)',
            padding: '1px 5px',
            borderRadius: 5,
            border: isDarkMode ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(16,17,63,0.1)',
            color: isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(16,17,63,0.4)',
            fontFamily: 'inherit',
          }}
        >
          ⌘K
        </kbd>
      </Button>

      {/* ── Right: Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>

        {/* Dark mode toggle */}
        <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
          <motion.div
            whileTap={{ scale: 0.9 }}
            style={{ display: 'flex' }}
          >
            <Button
              type="text"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              icon={
                <motion.span
                  key={isDarkMode ? 'sun' : 'moon'}
                  initial={{ rotate: -30, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex' }}
                >
                  {isDarkMode ? <SunOutlined style={{ fontSize: 16 }} /> : <MoonOutlined style={{ fontSize: 16 }} />}
                </motion.span>
              }
              onClick={toggleDarkMode}
              style={{
                color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(16,17,63,0.55)',
                borderRadius: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </motion.div>
        </Tooltip>

        {/* Notifications — pulse badge when unread */}
        <Tooltip title="Notifications">
          <div className={unreadCount > 0 ? 'hrms-badge-pulse' : ''}>
            <Badge
              count={unreadCount}
              size="small"
              style={{ background: '#E94043', fontWeight: 700, fontSize: 9 }}
            >
              <Button
                type="text"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                icon={<BellOutlined style={{ fontSize: 16 }} />}
                onClick={() => navigate('/notifications')}
                style={{
                  color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(16,17,63,0.6)',
                  borderRadius: 8,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Badge>
          </div>
        </Tooltip>

        {/* User Avatar dropdown */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px 4px 4px',
              borderRadius: 10,
              cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(16,17,63,0.09)',
              marginLeft: 6,
              transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(250,167,26,0.45)' : 'rgba(16,17,63,0.2)'
              e.currentTarget.style.background = isDarkMode ? 'rgba(250,167,26,0.06)' : 'rgba(16,17,63,0.03)'
              e.currentTarget.style.boxShadow = isDarkMode ? '0 0 0 3px rgba(250,167,26,0.1)' : '0 0 0 3px rgba(16,17,63,0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(16,17,63,0.09)'
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Avatar
              size={30}
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #FAA71A 0%, #f7c358 100%)'
                  : 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)',
                color: isDarkMode ? '#10113F' : '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
                border: 'none',
              }}
            >
              {initials}
            </Avatar>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? '#ffffff' : '#10113F', lineHeight: 1.25, transition: 'color 0.2s ease' }}>
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
              </div>
              <div style={{ fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(16,17,63,0.45)', lineHeight: 1.25, marginTop: 1, transition: 'color 0.2s ease' }}>
                {user?.email}
              </div>
            </div>
          </motion.div>
        </Dropdown>
      </div>
    </Header>
  )
}
