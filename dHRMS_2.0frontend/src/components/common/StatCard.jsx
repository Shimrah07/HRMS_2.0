import { motion } from 'framer-motion'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { Skeleton } from 'antd'
import useUIStore from '../../store/uiStore'

/**
 * StatCard — Premium KPI card with colored top-border accent.
 *
 * Props:
 *   title       {string}   Card label (uppercase, muted)
 *   value       {any}      Numeric or string value to display
 *   subtitle    {string}   Optional subtitle below value
 *   icon        {ReactNode}Optional icon in a tinted tray
 *   trend       {number}   +/- percentage trend (e.g. 12.5 or -3)
 *   trendLabel  {string}   e.g. "vs last month"
 *   color       {string}   Accent color for top border & icon tray
 *   loading     {boolean}  Show skeleton when true
 *   delay       {number}   Framer Motion stagger delay in seconds
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = '#10113F',
  loading = false,
  delay = 0,
}) {
  const { isDarkMode } = useUIStore()
  const trendPositive = trend > 0
  const trendNegative = trend < 0

  // In dark mode, swap navy → gold so the icon stays readable
  const resolvedColor = color === '#10113F' && isDarkMode ? '#FAA71A' : color

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--color-card-bg)',
          borderRadius: 'var(--radius-xl)',
          border: 'var(--border-glass)',
          padding: '20px 18px',
          height: '100%',
          boxShadow: 'var(--shadow-subtle)',
          borderTop: `3px solid ${resolvedColor}`,
        }}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -3,
        boxShadow: isDarkMode
          ? '0 15px 35px rgba(0, 0, 0, 0.35)'
          : 'var(--shadow-medium)',
      }}
      style={{
        background: 'var(--color-card-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 'var(--radius-xl)',
        border: 'var(--border-glass)',
        // Colored top border — the key accent per card
        borderTop: `3px solid ${resolvedColor}`,
        padding: '20px 18px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isDarkMode ? '0 8px 24px rgba(0, 0, 0, 0.18)' : 'var(--shadow-subtle)',
        transition: 'background-color 0.2s ease, border 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
    >
      {/* Top row: Title + Icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 12 }}>
        <p
          style={{
            margin: 0,
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            lineHeight: 1.35,
            transition: 'color 0.2s ease',
          }}
        >
          {title}
        </p>

        {icon && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.15 }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: `linear-gradient(135deg, ${resolvedColor}22 0%, ${resolvedColor}0a 100%)`,
              border: `1px solid ${resolvedColor}28`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              color: resolvedColor,
              flexShrink: 0,
              boxShadow: `0 3px 8px ${resolvedColor}10`,
              transition: 'all 0.2s ease',
            }}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12, marginBottom: 8 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            transition: 'color 0.2s ease',
            wordBreak: 'break-all',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
        </span>
      </div>

      {/* Trend / Subtitle */}
      <div style={{ marginTop: 'auto' }}>
        {trend !== undefined && trend !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                background: trendPositive
                  ? 'rgba(34, 197, 94, 0.12)'
                  : trendNegative
                  ? 'rgba(233, 64, 67, 0.12)'
                  : 'rgba(16,17,63,0.06)',
                color: trendPositive
                  ? isDarkMode ? '#4ADE80' : '#15803D'
                  : trendNegative
                  ? isDarkMode ? '#FCA5A5' : '#C53030'
                  : 'var(--color-text-muted)',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {trendPositive && <ArrowUpOutlined style={{ fontSize: 10 }} />}
              {trendNegative && <ArrowDownOutlined style={{ fontSize: 10 }} />}
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', fontWeight: 500, transition: 'color 0.2s ease' }}>
                {trendLabel}
              </span>
            )}
          </div>
        ) : (
          subtitle && (
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-muted)', fontWeight: 500, transition: 'color 0.2s ease' }}>
              {subtitle}
            </p>
          )
        )}
      </div>
    </motion.div>
  )
}
