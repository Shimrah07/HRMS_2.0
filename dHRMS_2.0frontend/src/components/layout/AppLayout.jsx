import { useState, useEffect } from 'react'
import { Layout } from 'antd'
import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from './CommandPalette'
import useUIStore from '../../store/uiStore'

const { Content } = Layout

export default function AppLayout() {
  const { sidebarCollapsed } = useUIStore()
  const location = useLocation()

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  // On mobile screens (<768px), sidebar is rendering as off-canvas Drawer, so content margin is 0
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed || isTablet ? 64 : 256)

  const contentPadding = isMobile
    ? '16px 12px 24px'
    : isTablet
    ? '20px 20px 28px'
    : '24px 32px 32px'

  const contentMarginTop = isMobile ? 72 : 80

  return (
    <Layout className="min-h-screen" style={{ background: 'var(--color-surface)', position: 'relative', overflowX: 'hidden' }}>
      {/* Decorative premium accent blobs */}
      <div className="bg-blob bg-blob-accent" style={{ top: '-10%', left: '25%', opacity: 0.08 }} />
      <div className="bg-blob bg-blob-secondary" style={{ bottom: '10%', right: '10%', opacity: 0.06 }} />
      <div className="bg-blob bg-blob-premium" style={{ top: '45%', left: '-5%', opacity: 0.05 }} />

      <Sidebar isMobile={isMobile} />
      <Layout
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          minWidth: 0,
        }}
      >
        <Topbar isMobile={isMobile} />
        <Content
          style={{
            marginTop: contentMarginTop,
            padding: contentPadding,
            minHeight: `calc(100vh - ${contentMarginTop}px)`,
            minWidth: 0,
          }}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </Content>
      </Layout>
      <CommandPalette />
    </Layout>
  )
}
