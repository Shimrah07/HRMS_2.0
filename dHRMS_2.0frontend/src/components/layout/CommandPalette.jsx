import { useEffect, useState, useCallback } from 'react'
import { Input } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  BankOutlined,
  SearchOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import useUIStore from '../../store/uiStore'

const COMMANDS = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined />, path: '/dashboard', category: 'Navigate' },
  { id: 'employees', label: 'Employees', icon: <TeamOutlined />, path: '/employees', category: 'Navigate' },
  { id: 'employees-new', label: 'Add New Employee', icon: <TeamOutlined />, path: '/employees/new', category: 'Action' },
  { id: 'org-chart', label: 'Org Chart', icon: <ApartmentOutlined />, path: '/org-chart', category: 'Navigate' },
  { id: 'departments', label: 'Departments', icon: <BankOutlined />, path: '/organization/departments', category: 'Navigate' },
  { id: 'users', label: 'Users & Roles', icon: <UserOutlined />, path: '/users', category: 'Navigate' },
  { id: 'notifications', label: 'Notifications', icon: <BellOutlined />, path: '/notifications', category: 'Navigate' },
  { id: 'settings', label: 'Settings', icon: <SettingOutlined />, path: '/settings', category: 'Navigate' },
  { id: 'my-profile', label: 'My Profile', icon: <UserOutlined />, path: '/employees/my-profile', category: 'Account' },
]

export default function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, isDarkMode } = useUIStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  const filtered = query
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS

  const handleSelect = useCallback(
    (path) => {
      navigate(path)
      closeCommandPalette()
      setQuery('')
    },
    [navigate, closeCommandPalette]
  )

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (commandPaletteOpen) closeCommandPalette()
        else useUIStore.getState().openCommandPalette()
      }
      if (e.key === 'Escape') closeCommandPalette()
      if (e.key === 'ArrowDown') setSelected((s) => Math.min(s + 1, filtered.length - 1))
      if (e.key === 'ArrowUp') setSelected((s) => Math.max(s - 1, 0))
      if (e.key === 'Enter' && filtered[selected]) handleSelect(filtered[selected].path)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, filtered, selected, handleSelect, closeCommandPalette])

  useEffect(() => setSelected(0), [query])

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          className="command-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={closeCommandPalette}
        >
          <motion.div
            className="command-palette-box"
            initial={{ scale: 0.96, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -8, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div style={{ padding: '12px 16px', borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(16, 17, 63, 0.08)' }}>
              <Input
                autoFocus
                prefix={<SearchOutlined style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(16, 17, 63, 0.35)' }} />}
                placeholder="Search pages, actions, employees..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: 15, boxShadow: 'none', color: isDarkMode ? '#ffffff' : '#10113F' }}
              />
            </div>

            {/* Results */}
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
              {Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <div
                    style={{
                      padding: '6px 16px 4px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: isDarkMode ? '#FAA71A' : 'rgba(16, 17, 63, 0.5)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {category}
                  </div>
                  {cmds.map((cmd, idx) => {
                    const globalIdx = filtered.indexOf(cmd)
                    const isSelected = globalIdx === selected
                    return (
                      <div
                        key={cmd.id}
                        onClick={() => handleSelect(cmd.path)}
                        onMouseEnter={() => setSelected(globalIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '9px 16px',
                          cursor: 'pointer',
                          background: isSelected
                            ? (isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(16, 17, 63, 0.04)')
                            : 'transparent',
                          borderLeft: isSelected
                            ? (isDarkMode ? '2px solid #FAA71A' : '2px solid #10113F')
                            : '2px solid transparent',
                          transition: 'all 0.1s',
                        }}
                      >
                        <span style={{ color: isSelected ? (isDarkMode ? '#FAA71A' : '#10113F') : (isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(16, 17, 63, 0.4)'), fontSize: 16 }}>
                          {cmd.icon}
                        </span>
                        <span style={{ fontSize: 14, color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : '#10113F', flex: 1 }}>{cmd.label}</span>
                        {isSelected && (
                          <ArrowRightOutlined style={{ fontSize: 12, color: isDarkMode ? '#FAA71A' : 'rgba(16, 17, 63, 0.4)' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(16, 17, 63, 0.45)', fontSize: 14 }}>
                  No results for "{query}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '8px 16px', borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(16, 17, 63, 0.08)', display: 'flex', gap: 16 }}>
              {[
                { key: '↑↓', label: 'Navigate' },
                { key: '↵', label: 'Open' },
                { key: 'Esc', label: 'Close' },
              ].map((hint) => (
                <div key={hint.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <kbd style={{
                    fontSize: 11,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 17, 63, 0.04)',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(16, 17, 63, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(16, 17, 63, 0.08)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    fontFamily: 'monospace'
                  }}>
                    {hint.key}
                  </kbd>
                  <span style={{ fontSize: 11, color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(16, 17, 63, 0.4)' }}>{hint.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
