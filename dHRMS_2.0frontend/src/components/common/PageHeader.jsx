import { Breadcrumb } from 'antd'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore'

/**
 * PageHeader — Premium enterprise page header.
 *
 * Props:
 *   title       {string}    Required page title
 *   subtitle    {string}    Optional subtitle line
 *   breadcrumbs {Array}     Array of { label, path? }
 *   actions     {ReactNode} Right-side action buttons
 *   tag         {string}    Optional pill badge beside the title
 */
export default function PageHeader({ title, subtitle, breadcrumbs = [], actions, tag }) {
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ marginBottom: 24 }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 10 }}
          separator={
            <span style={{ color: isDarkMode ? 'rgba(250,167,26,0.5)' : 'rgba(16,17,63,0.25)', fontSize: 11 }}>
              /
            </span>
          }
          items={breadcrumbs.map((b) => ({
            title: b.path ? (
              <span
                role="link"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  color: isDarkMode ? 'rgba(240,244,255,0.5)' : 'rgba(16,17,63,0.5)',
                  fontSize: 12.5,
                  fontWeight: 500,
                  transition: 'color 0.15s ease',
                }}
                onClick={() => navigate(b.path)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(b.path)}
                onMouseEnter={(e) => (e.currentTarget.style.color = isDarkMode ? '#FAA71A' : '#10113F')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isDarkMode ? 'rgba(240,244,255,0.5)' : 'rgba(16,17,63,0.5)')}
              >
                {b.label}
              </span>
            ) : (
              <span style={{ color: isDarkMode ? 'rgba(240,244,255,0.85)' : '#10113F', fontWeight: 600, fontSize: 12.5 }}>
                {b.label}
              </span>
            ),
          }))}
        />
      )}

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Title block with left accent */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Gold accent bar */}
          <div
            style={{
              width: 4,
              height: subtitle ? 52 : 36,
              borderRadius: 4,
              background: 'linear-gradient(180deg, #FAA71A 0%, rgba(250,167,26,0.3) 100%)',
              flexShrink: 0,
              marginTop: 2,
              transition: 'height 0.2s ease',
            }}
          />
          <div>
            {/* Title + optional badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: isDarkMode ? '#F0F4FF' : '#10113F',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  transition: 'color 0.2s ease',
                }}
              >
                {title}
              </h1>
              {tag && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: isDarkMode ? 'rgba(250,167,26,0.15)' : 'rgba(16,17,63,0.08)',
                    color: isDarkMode ? '#FAA71A' : '#10113F',
                    border: isDarkMode ? '1px solid rgba(250,167,26,0.3)' : '1px solid rgba(16,17,63,0.12)',
                    lineHeight: 1.5,
                  }}
                >
                  {tag}
                </span>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p
                style={{
                  margin: '5px 0 0',
                  color: isDarkMode ? 'rgba(240,244,255,0.5)' : 'rgba(16,17,63,0.55)',
                  fontSize: 13.5,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  transition: 'color 0.2s ease',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}
