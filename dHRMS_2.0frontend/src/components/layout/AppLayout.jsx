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
  const sidebarWidth = sidebarCollapsed ? 64 : 256

  return (
    <Layout className="min-h-screen" style={{ background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative premium accent blobs */}
      <div className="bg-blob bg-blob-accent" style={{ top: '-10%', left: '25%', opacity: 0.08 }} />
      <div className="bg-blob bg-blob-secondary" style={{ bottom: '10%', right: '10%', opacity: 0.06 }} />
      <div className="bg-blob bg-blob-premium" style={{ top: '45%', left: '-5%', opacity: 0.05 }} />

      <Sidebar />
      <Layout
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Topbar />
        <Content
          style={{
            marginTop: 80,
            padding: '24px 32px 32px',
            minHeight: 'calc(100vh - 80px)',
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
